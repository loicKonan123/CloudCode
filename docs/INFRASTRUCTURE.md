# Couche Infrastructure - Implémentations Techniques

## Rôle

La couche **Infrastructure** fournit les **implémentations concrètes** :
- **Accès aux données** : Entity Framework Core, SQLite
- **Services externes** : JWT, BCrypt, OpenAI
- **Repositories** : Implémentations des interfaces Domain

**Dépendances** : Infrastructure → Application → Domain

## Structure

```
src/CloudCode.Infrastructure/
├── CloudCode.Infrastructure.csproj
├── DependencyInjection.cs          # Configuration IoC
├── Data/
│   ├── ApplicationDbContext.cs     # DbContext EF Core
│   ├── DesignTimeDbContextFactory.cs  # Pour les migrations
│   ├── Configurations/             # Configuration Fluent API
│   │   ├── UserConfiguration.cs
│   │   ├── ProjectConfiguration.cs
│   │   ├── CodeFileConfiguration.cs
│   │   ├── CollaborationConfiguration.cs
│   │   └── ...
│   └── Migrations/                 # Migrations EF Core
│       └── 20260103_InitialCreate.cs
├── Repositories/
│   ├── Repository.cs               # Implémentation générique
│   ├── UserRepository.cs
│   ├── ProjectRepository.cs
│   ├── CodeFileRepository.cs
│   ├── CollaborationRepository.cs
│   └── UnitOfWork.cs
└── Services/
    ├── AuthService.cs              # Authentification
    ├── TokenService.cs             # Génération JWT
    ├── PasswordHasher.cs           # BCrypt
    ├── ProjectService.cs           # Logique projets
    ├── FileService.cs              # Logique fichiers
    ├── CollaborationService.cs     # Logique collaboration
    └── AIService.cs                # Intégration OpenAI
```

## Entity Framework Core

### ApplicationDbContext

```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSet = Tables de la base de données
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<CodeFile> CodeFiles => Set<CodeFile>();
    public DbSet<Collaboration> Collaborations => Set<Collaboration>();
    public DbSet<ExecutionResult> ExecutionResults => Set<ExecutionResult>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applique toutes les configurations du dossier Configurations/
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
```

### Configuration Fluent API

**Pourquoi Fluent API plutôt que Data Annotations ?**
- Séparation des préoccupations (config hors de l'entité)
- Plus de contrôle sur le mapping
- Configurations complexes possibles

```csharp
// Data/Configurations/UserConfiguration.cs
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Table
        builder.ToTable("Users");

        // Clé primaire
        builder.HasKey(u => u.Id);

        // Propriétés
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(100);

        // Index unique sur Email
        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.HasIndex(u => u.Username)
            .IsUnique();

        // Relation 1-N avec Projects
        builder.HasMany(u => u.Projects)
            .WithOne(p => p.Owner)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### Configuration des relations

```csharp
// ProjectConfiguration.cs
public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects");
        builder.HasKey(p => p.Id);

        // Relation avec User (propriétaire)
        builder.HasOne(p => p.Owner)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation avec CodeFiles
        builder.HasMany(p => p.Files)
            .WithOne(f => f.Project)
            .HasForeignKey(f => f.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation avec Collaborations
        builder.HasMany(p => p.Collaborators)
            .WithOne(c => c.Project)
            .HasForeignKey(c => c.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### Migrations EF Core

```bash
# Créer une nouvelle migration
dotnet ef migrations add NomMigration \
    --project src/CloudCode.Infrastructure \
    --startup-project CloudCode

# Appliquer les migrations
dotnet ef database update \
    --project src/CloudCode.Infrastructure \
    --startup-project CloudCode
```

**Fichier de migration généré :**
```csharp
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                Email = table.Column<string>(maxLength: 256, nullable: false),
                PasswordHash = table.Column<string>(maxLength: 100, nullable: false),
                Username = table.Column<string>(maxLength: 50, nullable: false),
                CreatedAt = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Users");
    }
}
```

## Repositories

### Repository générique

```csharp
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, ct);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
    {
        return await _dbSet.ToListAsync(ct);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        return entity;
    }

    public virtual void Update(T entity)
    {
        _dbSet.Attach(entity);
        _context.Entry(entity).State = EntityState.Modified;
    }

    public virtual void Remove(T entity)
    {
        _dbSet.Remove(entity);
    }
}
```

### Repository spécialisé

```csharp
public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), ct);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower(), ct);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);
    }

    public async Task<bool> ExistsAsync(string email, CancellationToken ct = default)
    {
        return await _dbSet.AnyAsync(u => u.Email.ToLower() == email.ToLower(), ct);
    }
}
```

### ProjectRepository avec requêtes complexes

```csharp
public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public async Task<IEnumerable<Project>> GetByOwnerIdAsync(Guid ownerId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(p => p.Owner)  // Eager loading
            .Where(p => p.OwnerId == ownerId)
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Project>> SearchAsync(
        string? query,
        ProgrammingLanguage? language,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var queryable = _dbSet
            .Include(p => p.Owner)
            .Where(p => p.IsPublic);  // Projets publics seulement

        if (!string.IsNullOrWhiteSpace(query))
        {
            queryable = queryable.Where(p =>
                p.Name.Contains(query) ||
                (p.Description != null && p.Description.Contains(query)));
        }

        if (language.HasValue)
        {
            queryable = queryable.Where(p => p.Language == language.Value);
        }

        return await queryable
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken ct = default)
    {
        var project = await _dbSet.FindAsync(new object[] { projectId }, ct);
        if (project == null) return false;

        // Propriétaire ou projet public
        if (project.OwnerId == userId || project.IsPublic) return true;

        // Collaborateur accepté
        return await _context.Collaborations.AnyAsync(
            c => c.ProjectId == projectId &&
                 c.UserId == userId &&
                 c.AcceptedAt != null,
            ct);
    }
}
```

### Unit of Work

```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Users = new UserRepository(context);
        Projects = new ProjectRepository(context);
        Files = new CodeFileRepository(context);
        Collaborations = new CollaborationRepository(context);
    }

    public IUserRepository Users { get; }
    public IProjectRepository Projects { get; }
    public ICodeFileRepository Files { get; }
    public ICollaborationRepository Collaborations { get; }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

## Services

### AuthService

```csharp
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly PasswordHasher _passwordHasher;

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct)
    {
        // 1. Trouver l'utilisateur
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email, ct)
            ?? throw new UnauthorizedException("INVALID_CREDENTIALS", "Email ou mot de passe incorrect");

        // 2. Vérifier le mot de passe
        if (!_passwordHasher.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email ou mot de passe incorrect");

        // 3. Générer les tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // 4. Sauvegarder le refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(ct);

        // 5. Retourner la réponse
        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            User = MapToProfileDto(user)
        };
    }
}
```

### TokenService (JWT)

```csharp
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public string GenerateAccessToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
```

### PasswordHasher (BCrypt)

```csharp
public class PasswordHasher
{
    private const int WorkFactor = 12;  // 2^12 itérations

    public string Hash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool Verify(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

**Pourquoi BCrypt ?**
- **Lent par design** : Résiste aux attaques brute-force
- **Salt intégré** : Chaque hash est unique
- **Work factor ajustable** : Adapte la difficulté au matériel

### AIService (OpenAI)

```csharp
public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public async Task<string> ExplainCodeAsync(string code, string language, CancellationToken ct)
    {
        var prompt = $"Explain the following {language} code:\n\n```{language}\n{code}\n```";
        return await SendChatCompletionAsync(prompt, ct);
    }

    private async Task<string> SendChatCompletionAsync(string prompt, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return GetMockResponse(prompt);  // Mode démo sans clé

        var request = new
        {
            model = _model,
            messages = new[]
            {
                new { role = "system", content = "You are a helpful programming assistant." },
                new { role = "user", content = prompt }
            },
            max_tokens = 2000
        };

        var response = await _httpClient.PostAsJsonAsync("chat/completions", request, ct);
        var result = await response.Content.ReadFromJsonAsync<OpenAIResponse>(ct);

        return result?.Choices?.FirstOrDefault()?.Message?.Content ?? "No response";
    }
}
```

## Injection de dépendances

```csharp
// DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Entity Framework Core avec SQLite
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ICodeFileRepository, CodeFileRepository>();
        services.AddScoped<ICollaborationRepository, CollaborationRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IFileService, FileService>();
        services.AddScoped<ICollaborationService, CollaborationService>();
        services.AddHttpClient<IAIService, AIService>();
        services.AddSingleton<PasswordHasher>();

        // JWT Authentication
        ConfigureJwtAuthentication(services, configuration);

        return services;
    }
}
```

## Résumé des technologies

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **ORM** | Entity Framework Core 8 | Mapping objet-relationnel |
| **Base de données** | SQLite | Stockage persistant |
| **Authentification** | JWT Bearer | Tokens d'accès |
| **Hashage** | BCrypt.Net | Sécurité mots de passe |
| **IA** | OpenAI API | Assistance au code |
| **HTTP Client** | HttpClient | Appels API externes |

La couche Infrastructure est la **seule à connaître les détails techniques**. Elle peut être remplacée sans affecter Domain ni Application.
