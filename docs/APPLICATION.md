# Couche Application - Orchestration

## Rôle

La couche **Application** orchestre les cas d'utilisation. Elle contient:
- **DTOs** : Objets de transfert de données
- **Interfaces de services** : Contrats pour la logique métier
- **Validators** : Règles de validation des entrées
- **Mappings** : Transformation entités ↔ DTOs

**Dépendance** : Application → Domain (uniquement)

## Structure

```
src/CloudCode.Application/
├── CloudCode.Application.csproj
├── DependencyInjection.cs          # Configuration IoC
├── DTOs/
│   ├── AI/                         # DTOs pour l'IA
│   ├── Auth/                       # DTOs authentification
│   ├── Collaboration/              # DTOs collaboration
│   ├── Execution/                  # DTOs exécution code
│   ├── Files/                      # DTOs fichiers
│   ├── Projects/                   # DTOs projets
│   └── Users/                      # DTOs utilisateurs
├── Interfaces/
│   ├── IAIService.cs               # Service IA
│   ├── IAuthService.cs             # Service authentification
│   ├── ICodeExecutionService.cs    # Service exécution
│   ├── ICollaborationService.cs    # Service collaboration
│   ├── IFileService.cs             # Service fichiers
│   ├── IProjectService.cs          # Service projets
│   └── ITokenService.cs            # Service tokens JWT
├── Validators/
│   ├── AI/                         # Validateurs IA
│   ├── Auth/                       # Validateurs auth
│   ├── Collaboration/              # Validateurs collaboration
│   ├── Execution/                  # Validateurs exécution
│   ├── Files/                      # Validateurs fichiers
│   └── Projects/                   # Validateurs projets
└── Mappings/
    └── MappingProfile.cs           # Configuration AutoMapper
```

## DTOs (Data Transfer Objects)

### Pourquoi des DTOs ?

```csharp
// ❌ DANGER : Exposer l'entité directement
[HttpGet("{id}")]
public Task<User> GetUser(Guid id)  // Expose PasswordHash !

// ✅ SÉCURISÉ : Utiliser un DTO
[HttpGet("{id}")]
public Task<UserProfileDto> GetUser(Guid id)  // Contrôle total
```

**Avantages :**
1. **Sécurité** : Masquer les champs sensibles
2. **Découplage** : L'API ne dépend pas des entités
3. **Flexibilité** : Forme des données adaptée au client
4. **Versionning** : Évolution API sans casser les entités

### DTOs d'entrée (Request)

```csharp
// DTOs/Auth/RegisterDto.cs
public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}

// DTOs/Auth/LoginDto.cs
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

### DTOs de sortie (Response)

```csharp
// DTOs/Auth/AuthResponseDto.cs
public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

// DTOs/Users/UserProfileDto.cs
public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    // PAS de PasswordHash !
}
```

### Convention de nommage

| Type | Suffixe | Exemple |
|------|---------|---------|
| Création | `CreateXxxDto` | `CreateProjectDto` |
| Modification | `UpdateXxxDto` | `UpdateProjectDto` |
| Réponse | `XxxResponseDto` | `ProjectResponseDto` |
| Recherche | `XxxSearchDto` | `ProjectSearchDto` |

### Exemple complet : Project DTOs

```csharp
// Création
public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public List<string> Tags { get; set; } = new();
}

// Modification
public class UpdateProjectDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
    public List<string>? Tags { get; set; }
}

// Réponse
public class ProjectResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public List<string> Tags { get; set; } = new();
    public UserProfileDto Owner { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// Recherche
public class ProjectSearchDto
{
    public string? Query { get; set; }
    public ProgrammingLanguage? Language { get; set; }
    public bool? IsPublic { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
```

## Interfaces de Services

### Principe

Les interfaces définissent **CE QUE** fait le service, pas **COMMENT**.

```csharp
// Application définit le CONTRAT
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken ct = default);
}

// Infrastructure fournit l'IMPLÉMENTATION
public class AuthService : IAuthService
{
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct)
    {
        // Implémentation concrète avec BCrypt, JWT, etc.
    }
}
```

### IAuthService

```csharp
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken ct = default);
}
```

### IProjectService

```csharp
public interface IProjectService
{
    Task<ProjectResponseDto> GetByIdAsync(Guid id, Guid? userId, CancellationToken ct = default);
    Task<IEnumerable<ProjectResponseDto>> GetUserProjectsAsync(Guid userId, CancellationToken ct = default);
    Task<PagedResult<ProjectResponseDto>> SearchAsync(ProjectSearchDto dto, CancellationToken ct = default);
    Task<ProjectResponseDto> CreateAsync(Guid userId, CreateProjectDto dto, CancellationToken ct = default);
    Task<ProjectResponseDto> UpdateAsync(Guid id, Guid userId, UpdateProjectDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectResponseDto> ForkAsync(Guid projectId, Guid userId, CancellationToken ct = default);
    Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken ct = default);
}
```

### IFileService

```csharp
public interface IFileService
{
    Task<IEnumerable<FileTreeItemDto>> GetTreeAsync(Guid projectId, Guid userId, CancellationToken ct = default);
    Task<FileResponseDto> GetByIdAsync(Guid fileId, Guid userId, CancellationToken ct = default);
    Task<FileResponseDto> CreateAsync(Guid projectId, Guid userId, CreateFileDto dto, CancellationToken ct = default);
    Task<FileResponseDto> UpdateAsync(Guid fileId, Guid userId, UpdateFileDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid fileId, Guid userId, CancellationToken ct = default);
    Task<FileResponseDto> MoveAsync(Guid fileId, Guid userId, MoveFileDto dto, CancellationToken ct = default);
    Task<FileResponseDto> CopyAsync(Guid fileId, Guid userId, CopyFileDto dto, CancellationToken ct = default);
    Task<byte[]> DownloadProjectAsZipAsync(Guid projectId, Guid userId, CancellationToken ct = default);
}
```

### IAIService

```csharp
public interface IAIService
{
    Task<string> ExplainCodeAsync(string code, string language, CancellationToken ct = default);
    Task<string> FixCodeAsync(string code, string error, string language, CancellationToken ct = default);
    Task<string> GenerateCodeAsync(string prompt, string language, CancellationToken ct = default);
    Task<IEnumerable<string>> GetCompletionsAsync(string code, int cursorPosition, string language, CancellationToken ct = default);
    Task<string> DocumentCodeAsync(string code, string language, CancellationToken ct = default);
    Task<string> RefactorCodeAsync(string code, string instructions, string language, CancellationToken ct = default);
    Task<string> OptimizeCodeAsync(string code, string language, CancellationToken ct = default);
}
```

## Validators (FluentValidation)

### Pourquoi FluentValidation ?

```csharp
// ❌ Data Annotations (limité)
public class RegisterDto
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }  // Pas de logique complexe possible
}

// ✅ FluentValidation (expressif)
public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format email invalide")
            .MaximumLength(256).WithMessage("Email trop long")
            .Must(BeUniqueEmail).WithMessage("Email déjà utilisé");  // Logique custom
    }
}
```

### Exemple : RegisterDtoValidator

```csharp
public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("L'email n'est pas valide")
            .MaximumLength(256).WithMessage("L'email est trop long");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est requis")
            .MinimumLength(8).WithMessage("Le mot de passe doit contenir au moins 8 caractères")
            .Matches("[A-Z]").WithMessage("Le mot de passe doit contenir une majuscule")
            .Matches("[a-z]").WithMessage("Le mot de passe doit contenir une minuscule")
            .Matches("[0-9]").WithMessage("Le mot de passe doit contenir un chiffre");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Les mots de passe ne correspondent pas");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Le nom d'utilisateur est requis")
            .MinimumLength(3).WithMessage("Le nom d'utilisateur doit contenir au moins 3 caractères")
            .MaximumLength(50).WithMessage("Le nom d'utilisateur est trop long")
            .Matches("^[a-zA-Z0-9_]+$").WithMessage("Caractères autorisés : lettres, chiffres, underscore");
    }
}
```

### Exemple : CreateProjectDtoValidator

```csharp
public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom du projet est requis")
            .MinimumLength(2).WithMessage("Le nom doit contenir au moins 2 caractères")
            .MaximumLength(100).WithMessage("Le nom ne peut pas dépasser 100 caractères")
            .Matches("^[a-zA-Z0-9-_ ]+$").WithMessage("Caractères spéciaux non autorisés");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La description ne peut pas dépasser 500 caractères")
            .When(x => x.Description != null);  // Seulement si fourni

        RuleFor(x => x.Language)
            .IsInEnum().WithMessage("Langage non supporté");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags autorisés");
    }
}
```

### Règles conditionnelles

```csharp
RuleFor(x => x.Input)
    .MaximumLength(10_000)
    .When(x => x.Input != null);  // Valide seulement si Input n'est pas null

RuleFor(x => x.EndDate)
    .GreaterThan(x => x.StartDate)
    .When(x => x.StartDate.HasValue);  // Valide seulement si StartDate existe
```

### Enregistrement automatique

```csharp
// DependencyInjection.cs
public static IServiceCollection AddApplicationServices(this IServiceCollection services)
{
    // Enregistre tous les validateurs du projet automatiquement
    services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

    return services;
}
```

## Mappings (AutoMapper)

### Configuration

```csharp
// Mappings/MappingProfile.cs
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserProfileDto>();

        // Project mappings
        CreateMap<Project, ProjectResponseDto>()
            .ForMember(dest => dest.Tags,
                opt => opt.MapFrom(src => ParseTags(src.Tags)));

        CreateMap<CreateProjectDto, Project>()
            .ForMember(dest => dest.Tags,
                opt => opt.MapFrom(src => SerializeTags(src.Tags)));

        // File mappings
        CreateMap<CodeFile, FileResponseDto>();
        CreateMap<CreateFileDto, CodeFile>();
    }

    private static List<string> ParseTags(string? json)
        => string.IsNullOrEmpty(json) ? new() : JsonSerializer.Deserialize<List<string>>(json) ?? new();

    private static string SerializeTags(List<string>? tags)
        => tags == null || tags.Count == 0 ? "[]" : JsonSerializer.Serialize(tags);
}
```

### Utilisation dans un service

```csharp
public class ProjectService : IProjectService
{
    private readonly IMapper _mapper;

    public async Task<ProjectResponseDto> GetByIdAsync(Guid id, Guid? userId, CancellationToken ct)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé");

        return _mapper.Map<ProjectResponseDto>(project);  // Transformation automatique
    }

    public async Task<ProjectResponseDto> CreateAsync(Guid userId, CreateProjectDto dto, CancellationToken ct)
    {
        var project = _mapper.Map<Project>(dto);  // DTO → Entité
        project.OwnerId = userId;

        await _unitOfWork.Projects.AddAsync(project, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return _mapper.Map<ProjectResponseDto>(project);  // Entité → DTO
    }
}
```

## Injection de dépendances

```csharp
// DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // AutoMapper
        services.AddAutoMapper(Assembly.GetExecutingAssembly());

        // FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        return services;
    }
}
```

**Appelé dans Program.cs :**
```csharp
builder.Services.AddApplicationServices();
```

## Flux de données complet

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Request    │     │   Validator  │     │   Service    │
│   LoginDto   │────▶│   Validates  │────▶│   Processes  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Response   │     │   Mapper     │     │   Entity     │
│AuthResponseDto◀────│   Transforms │◀────│    User      │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Résumé

| Composant | Rôle | Technologie |
|-----------|------|-------------|
| **DTOs** | Transport de données | Classes C# |
| **Interfaces** | Contrats de services | `interface` |
| **Validators** | Validation des entrées | FluentValidation |
| **Mappings** | Transformation données | AutoMapper |

La couche Application est le **chef d'orchestre** qui coordonne les flux de données sans implémenter la logique technique.
