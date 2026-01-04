# Couche API - Point d'Entrée

## Rôle

La couche **API** est le point d'entrée de l'application :
- **Controllers** : Endpoints REST
- **Hubs** : Communication temps réel SignalR
- **Middleware** : Intercepteurs (erreurs, logging)
- **Program.cs** : Configuration et démarrage

## Structure

```
CloudCode/
├── CloudCode.API.csproj
├── Program.cs                      # Point d'entrée
├── appsettings.json               # Configuration
├── Controllers/
│   ├── BaseApiController.cs       # Controller de base
│   ├── AuthController.cs          # Authentification
│   ├── ProjectsController.cs      # Projets
│   ├── FilesController.cs         # Fichiers
│   ├── CollaborationsController.cs # Collaborations
│   ├── ExecutionController.cs     # Exécution code
│   └── AIController.cs            # Assistant IA
├── Hubs/
│   └── CodeHub.cs                 # SignalR temps réel
└── Middleware/
    └── ExceptionMiddleware.cs     # Gestion erreurs globale
```

## Program.cs - Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// ===== SERVICES =====

// Couches métier
builder.Services.AddApplicationServices();        // Application layer
builder.Services.AddInfrastructureServices(       // Infrastructure layer
    builder.Configuration);

// ASP.NET Core
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR pour temps réel
builder.Services.AddSignalR();

// CORS pour le frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ===== MIDDLEWARE PIPELINE =====

// 1. Swagger (dev seulement)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. Gestion des erreurs
app.UseMiddleware<ExceptionMiddleware>();

// 3. CORS
app.UseCors("AllowAll");

// 4. Authentification & Autorisation
app.UseAuthentication();
app.UseAuthorization();

// 5. Endpoints
app.MapControllers();
app.MapHub<CodeHub>("/hubs/code");  // SignalR

app.Run();
```

## Controllers

### BaseApiController

```csharp
[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Récupère l'ID de l'utilisateur connecté depuis le token JWT.
    /// </summary>
    protected Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Récupère l'ID de l'utilisateur ou lance une exception.
    /// </summary>
    protected Guid GetRequiredUserId()
    {
        return GetUserId()
            ?? throw new UnauthorizedException("USER_NOT_FOUND", "Utilisateur non authentifié");
    }
}
```

**Héritage :**
```
ControllerBase (ASP.NET Core)
      │
      ▼
BaseApiController (notre base)
      │
      ├── AuthController
      ├── ProjectsController
      ├── FilesController
      └── ...
```

### AuthController

```csharp
[AllowAnonymous]  // Pas de JWT requis
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var response = await _authService.RegisterAsync(dto);
        return Created("/api/auth/me", response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var response = await _authService.LoginAsync(dto);
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken(RefreshTokenDto dto)
    {
        var response = await _authService.RefreshTokenAsync(dto);
        return Ok(response);
    }

    [Authorize]  // JWT requis
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var userId = GetRequiredUserId();
        await _authService.LogoutAsync(userId);
        return Ok(new { message = "Déconnecté avec succès" });
    }
}
```

### Attributs importants

| Attribut | Effet |
|----------|-------|
| `[ApiController]` | Active la validation automatique |
| `[Route("api/[controller]")]` | Route basée sur le nom du controller |
| `[Authorize]` | Requiert un JWT valide |
| `[AllowAnonymous]` | Permet l'accès sans JWT |
| `[HttpGet]`, `[HttpPost]`, etc. | Verbe HTTP |
| `[FromBody]` | Paramètre depuis le corps JSON |
| `[FromRoute]` | Paramètre depuis l'URL |
| `[FromQuery]` | Paramètre depuis query string |

### ProjectsController

```csharp
[Authorize]
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _projectService;

    // GET /api/projects
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetMyProjects()
    {
        var userId = GetRequiredUserId();
        var projects = await _projectService.GetUserProjectsAsync(userId);
        return Ok(projects);
    }

    // GET /api/projects/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectResponseDto>> GetById(Guid id)
    {
        var userId = GetUserId();
        var project = await _projectService.GetByIdAsync(id, userId);
        return Ok(project);
    }

    // POST /api/projects
    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProjectResponseDto>> Create(CreateProjectDto dto)
    {
        var userId = GetRequiredUserId();
        var project = await _projectService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    // PUT /api/projects/{id}
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectResponseDto>> Update(Guid id, UpdateProjectDto dto)
    {
        var userId = GetRequiredUserId();
        var project = await _projectService.UpdateAsync(id, userId, dto);
        return Ok(project);
    }

    // DELETE /api/projects/{id}
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = GetRequiredUserId();
        await _projectService.DeleteAsync(id, userId);
        return NoContent();
    }

    // GET /api/projects/public
    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetPublicProjects(
        [FromQuery] ProjectSearchDto search)
    {
        var projects = await _projectService.SearchAsync(search);
        return Ok(projects);
    }

    // POST /api/projects/{id}/fork
    [HttpPost("{id:guid}/fork")]
    public async Task<ActionResult<ProjectResponseDto>> Fork(Guid id)
    {
        var userId = GetRequiredUserId();
        var forked = await _projectService.ForkAsync(id, userId);
        return CreatedAtAction(nameof(GetById), new { id = forked.Id }, forked);
    }
}
```

## Middleware

### ExceptionMiddleware

Capture toutes les exceptions et retourne des réponses JSON cohérentes.

```csharp
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);  // Exécute le reste du pipeline
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            NotFoundException ex => (404, new ErrorResponse(ex.Code, ex.Message)),
            UnauthorizedException ex => (401, new ErrorResponse(ex.Code, ex.Message)),
            ValidationException ex => (400, new ErrorResponse(ex.Code, ex.Message)),
            ConflictException ex => (409, new ErrorResponse(ex.Code, ex.Message)),
            _ => (500, new ErrorResponse("INTERNAL_ERROR", "Une erreur interne s'est produite"))
        };

        if (statusCode == 500)
        {
            _logger.LogError(exception, "Unhandled exception");
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(response);
    }
}

public record ErrorResponse(string Code, string Message);
```

**Mapping exceptions → HTTP :**
```
NotFoundException     → 404 Not Found
UnauthorizedException → 401 Unauthorized
ValidationException   → 400 Bad Request
ConflictException     → 409 Conflict
Exception            → 500 Internal Server Error
```

## SignalR Hub

### CodeHub - Collaboration temps réel

```csharp
[Authorize]
public class CodeHub : Hub
{
    private static readonly ConcurrentDictionary<string, HashSet<ConnectedUser>> ProjectUsers = new();

    /// <summary>
    /// Rejoindre un projet pour collaborer.
    /// </summary>
    public async Task JoinProject(Guid projectId)
    {
        var groupName = $"project_{projectId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        var user = GetCurrentUser();
        if (user != null)
        {
            // Notifier les autres
            await Clients.OthersInGroup(groupName).SendAsync("UserJoined", user);

            // Envoyer la liste des utilisateurs actifs
            var activeUsers = ProjectUsers.GetValueOrDefault(groupName)?.ToList();
            await Clients.Caller.SendAsync("ActiveUsers", activeUsers);
        }
    }

    /// <summary>
    /// Envoyer une modification de code.
    /// </summary>
    public async Task SendCodeChange(Guid projectId, Guid fileId, CodeChange change)
    {
        var groupName = $"project_{projectId}";
        var user = GetCurrentUser();

        await Clients.OthersInGroup(groupName).SendAsync("CodeChanged", new
        {
            FileId = fileId,
            User = user,
            Change = change,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Envoyer la position du curseur.
    /// </summary>
    public async Task SendCursorPosition(Guid projectId, Guid fileId, CursorPosition position)
    {
        var groupName = $"project_{projectId}";
        await Clients.OthersInGroup(groupName).SendAsync("CursorMoved", new
        {
            FileId = fileId,
            User = GetCurrentUser(),
            Position = position
        });
    }

    /// <summary>
    /// Envoyer un message de chat.
    /// </summary>
    public async Task SendChatMessage(Guid projectId, string message)
    {
        var groupName = $"project_{projectId}";
        await Clients.Group(groupName).SendAsync("ChatMessage", new
        {
            User = GetCurrentUser(),
            Message = message.Trim(),
            Timestamp = DateTime.UtcNow
        });
    }
}
```

### Connexion côté client (JavaScript)

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/code", {
        accessTokenFactory: () => localStorage.getItem("accessToken")
    })
    .withAutomaticReconnect()
    .build();

// Écouter les événements
connection.on("UserJoined", (user) => {
    console.log(`${user.username} a rejoint le projet`);
});

connection.on("CodeChanged", (data) => {
    applyCodeChange(data.fileId, data.change);
});

connection.on("CursorMoved", (data) => {
    showRemoteCursor(data.user, data.position);
});

// Démarrer la connexion
await connection.start();

// Rejoindre un projet
await connection.invoke("JoinProject", projectId);

// Envoyer une modification
await connection.invoke("SendCodeChange", projectId, fileId, {
    startLine: 10,
    startColumn: 0,
    endLine: 10,
    endColumn: 5,
    text: "const"
});
```

## Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=CloudCode.db"
  },
  "Jwt": {
    "SecretKey": "VotreCléSecrèteTrèsLongueDe32CaractèresMinimum!",
    "Issuer": "CloudCode",
    "Audience": "CloudCodeUsers",
    "AccessTokenExpirationHours": 1,
    "RefreshTokenExpirationDays": 7
  },
  "OpenAI": {
    "ApiKey": "",
    "Model": "gpt-3.5-turbo"
  },
  "CodeExecution": {
    "TimeoutSeconds": 5,
    "MaxOutputLength": 50000
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## Swagger / OpenAPI

Accessible en développement : `http://localhost:5072/swagger`

**Configuration :**
```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CloudCode API",
        Version = "v1",
        Description = "API pour l'IDE collaboratif CloudCode"
    });

    // Support JWT dans Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
});
```

## Résumé du pipeline HTTP

```
Requête HTTP
     │
     ▼
┌─────────────────────┐
│   UseMiddleware     │  ← ExceptionMiddleware (catch erreurs)
│   (ExceptionMiddleware)
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   UseCors           │  ← Permet requêtes cross-origin
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ UseAuthentication   │  ← Valide le JWT
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ UseAuthorization    │  ← Vérifie [Authorize]
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   MapControllers    │  ← Route vers le bon controller
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   Controller        │  ← Traite la requête
│   → Service         │
│   → Repository      │
│   → Database        │
└─────────────────────┘
     │
     ▼
Réponse HTTP
```
