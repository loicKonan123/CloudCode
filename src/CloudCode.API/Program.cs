using CloudCode.Application;
using CloudCode.Hubs;
using CloudCode.Infrastructure;
using CloudCode.Infrastructure.Data;
using CloudCode.Middleware;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Limit request body size (1 MB default, 10 MB for code submissions)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 1 * 1024 * 1024; // 1 MB global
});

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CloudCode API", Version = "v1" });

    // Configuration JWT pour Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Application Layer services
builder.Services.AddApplicationServices();

// Infrastructure Layer services (DbContext, Repositories, JWT, etc.)
builder.Services.AddInfrastructureServices(builder.Configuration);

// SignalR
builder.Services.AddSignalR();

// HttpClient for reverse proxy
builder.Services.AddHttpClient();

// Health Checks
builder.Services.AddHealthChecks();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    // Code execution
    options.AddSlidingWindowLimiter("submit", opt =>
    {
        opt.PermitLimit = 15;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 3;
        opt.QueueLimit = 0;
    });
    options.AddSlidingWindowLimiter("test", opt =>
    {
        opt.PermitLimit = 30;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 3;
        opt.QueueLimit = 0;
    });

    // Auth endpoints — protection brute-force
    options.AddFixedWindowLimiter("auth-login", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("auth-register", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("auth-forgot-password", opt =>
    {
        opt.PermitLimit = 3;
        opt.Window = TimeSpan.FromMinutes(5);
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("auth-refresh", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("comments", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    options.RejectionStatusCode = 429;
});

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
              .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
              .AllowCredentials();
    });
});

// Firebase Admin SDK
try
{
    var firebaseCredentialPath = builder.Configuration["Firebase:ServiceAccountPath"];
    if (!string.IsNullOrEmpty(firebaseCredentialPath) && File.Exists(firebaseCredentialPath))
    {
        FirebaseApp.Create(new AppOptions
        {
            Credential = GoogleCredential.FromFile(firebaseCredentialPath)
        });
    }
    else
    {
        var firebaseJson = builder.Configuration["Firebase:ServiceAccountJson"];
        if (!string.IsNullOrEmpty(firebaseJson))
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromJson(firebaseJson)
            });
        }
        else
        {
            Console.WriteLine("[Firebase] Aucune clé trouvée — Google Sign-In désactivé.");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Firebase] Erreur init : {ex.Message} — Google Sign-In désactivé.");
}

var app = builder.Build();

// Seed challenges + quiz questions + courses + lessons
await ChallengeSeeder.SeedChallengesAsync(app.Services);
await QuizSeeder.SeedQuestionsAsync(app.Services);
await CourseSeeder.SeedCoursesAsync(app.Services);
await LessonSeeder.SeedLessonsAsync(app.Services);

// Global exception handler
app.UseGlobalExceptionHandler();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CloudCode API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Reverse proxy for user applications (after auth)
app.UseReverseProxy();

app.MapControllers();

// Health Check endpoint
app.MapHealthChecks("/health");

// SignalR Hubs
app.MapHub<CodeHub>("/hubs/code");
app.MapHub<TerminalHub>("/hubs/terminal");
app.MapHub<VsHub>("/hubs/vs");
app.MapHub<QuizHub>("/hubs/quiz");
Console.WriteLine("CloudCode API running at: http://localhost:5072");
Console.WriteLine("Swagger UI: http://localhost:5072/swagger");

app.Run();
