# Couche Domain - Le Cœur Métier

## Rôle

La couche **Domain** est le **cœur de l'application**. Elle contient:
- Les **entités métier** (modèles de données)
- Les **règles métier** (logique intrinsèque)
- Les **interfaces** (contrats)
- Les **exceptions** (erreurs métier)

**Règle d'or** : Cette couche n'a **AUCUNE dépendance** externe. Pas de framework, pas de NuGet, rien.

## Structure

```
src/CloudCode.Domain/
├── CloudCode.Domain.csproj      # Projet sans dépendances
├── Common/
│   └── BaseEntity.cs            # Classe de base pour toutes les entités
├── Entities/
│   ├── User.cs                  # Utilisateur
│   ├── Project.cs               # Projet de code
│   ├── CodeFile.cs              # Fichier de code
│   ├── Collaboration.cs         # Collaboration sur projet
│   ├── ExecutionResult.cs       # Résultat d'exécution
│   └── AuditLog.cs              # Journal d'audit
├── Enums/
│   ├── ProgrammingLanguage.cs   # Langages supportés
│   ├── ExecutionStatus.cs       # États d'exécution
│   └── CollaboratorRole.cs      # Rôles collaborateurs
├── Exceptions/
│   ├── DomainException.cs       # Exception de base
│   ├── NotFoundException.cs     # Ressource non trouvée
│   ├── UnauthorizedException.cs # Accès non autorisé
│   ├── ValidationException.cs   # Validation échouée
│   └── ConflictException.cs     # Conflit de données
└── Interfaces/
    ├── IRepository.cs           # Repository générique
    ├── IUserRepository.cs       # Repository utilisateurs
    ├── IProjectRepository.cs    # Repository projets
    ├── ICodeFileRepository.cs   # Repository fichiers
    ├── ICollaborationRepository.cs
    └── IUnitOfWork.cs           # Unité de travail
```

## Entités

### BaseEntity - Classe de base

Toutes les entités héritent de `BaseEntity` pour avoir un comportement commun.

```csharp
namespace CloudCode.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();      // Identifiant unique
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;  // Date création
    public DateTime? UpdatedAt { get; set; }            // Date modification
}
```

**Pourquoi Guid et pas int ?**
- **Unicité globale** : Pas de collision entre serveurs
- **Génération client** : L'ID peut être créé avant l'insertion
- **Sécurité** : Difficile à deviner (vs /users/1, /users/2)

### User - Utilisateur

```csharp
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;  // BCrypt hash
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
    public bool EmailConfirmed { get; set; }

    // Token de rafraîchissement JWT
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Navigation properties (relations)
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    public virtual ICollection<Collaboration> Collaborations { get; set; } = new List<Collaboration>();
}
```

**Points clés :**
- `PasswordHash` : JAMAIS le mot de passe en clair
- `RefreshToken` : Pour le renouvellement JWT
- `virtual` : Permet le lazy loading EF Core

### Project - Projet de code

```csharp
public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }   // Enum
    public bool IsPublic { get; set; }                  // Visibilité
    public Guid OwnerId { get; set; }                   // Clé étrangère
    public string? Tags { get; set; }                   // JSON array

    // Navigation
    public virtual User Owner { get; set; } = null!;
    public virtual ICollection<CodeFile> Files { get; set; } = new List<CodeFile>();
    public virtual ICollection<Collaboration> Collaborators { get; set; } = new List<Collaboration>();
}
```

**Relation avec User :**
```
User (1) ──────── (N) Project
     │                    │
     │ OwnerId            │ Owner
     └────────────────────┘
```

### CodeFile - Fichier de code

```csharp
public class CodeFile : BaseEntity
{
    public string Name { get; set; } = string.Empty;    // "main.js"
    public string Path { get; set; } = string.Empty;    // "/src/main.js"
    public string Content { get; set; } = string.Empty; // Code source
    public bool IsFolder { get; set; }                  // Dossier ou fichier
    public Guid? ParentId { get; set; }                 // Parent (arborescence)
    public Guid ProjectId { get; set; }

    // Navigation
    public virtual Project Project { get; set; } = null!;
    public virtual CodeFile? Parent { get; set; }
    public virtual ICollection<CodeFile> Children { get; set; } = new List<CodeFile>();
}
```

**Structure arborescente :**
```
Project
└── CodeFile (IsFolder=true, ParentId=null)     # /src
    ├── CodeFile (IsFolder=false, ParentId=src) # /src/main.js
    └── CodeFile (IsFolder=false, ParentId=src) # /src/utils.js
```

### Collaboration - Collaborateurs

```csharp
public class Collaboration : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public CollaboratorRole Role { get; set; }    // Read, Write, Admin
    public DateTime InvitedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }     // null = invitation en attente

    public virtual Project Project { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
```

**États de collaboration :**
- `AcceptedAt == null` → Invitation en attente
- `AcceptedAt != null` → Collaboration active

## Enums

### ProgrammingLanguage

```csharp
public enum ProgrammingLanguage
{
    JavaScript = 1,
    Python = 2,
    CSharp = 3,
    Java = 4,
    Go = 5,
    TypeScript = 6,
    Html = 7,
    Css = 8,
    Json = 9,
    Markdown = 10
}
```

**Pourquoi des valeurs explicites (= 1, = 2) ?**
- Stabilité en BDD : Si on réordonne, les valeurs restent
- Clarté : On sait que Python = 2 partout

### CollaboratorRole

```csharp
public enum CollaboratorRole
{
    Read = 1,    // Lecture seule
    Write = 2,   // Lecture + écriture
    Admin = 3    // Lecture + écriture + gestion collaborateurs
}
```

**Hiérarchie des permissions :**
```
Admin > Write > Read
  │       │       │
  ├── Inviter des collaborateurs
  │       ├── Modifier les fichiers
  │       │       └── Lire les fichiers
```

### ExecutionStatus

```csharp
public enum ExecutionStatus
{
    Pending = 0,    // En attente
    Running = 1,    // En cours
    Completed = 2,  // Terminé avec succès
    Failed = 3,     // Terminé avec erreur
    Timeout = 4,    // Temps dépassé
    Cancelled = 5   // Annulé
}
```

## Interfaces Repository

### IRepository<T> - Générique

```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}
```

**Pourquoi `CancellationToken` ?**
- Permet d'annuler les requêtes longues
- Libère les ressources si le client déconnecte

### IUserRepository - Spécifique

```csharp
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<bool> ExistsAsync(string email, CancellationToken ct = default);
}
```

**Héritage d'interface :**
```
IRepository<User>
      │
      ▼
IUserRepository (ajoute GetByEmailAsync, etc.)
```

### IUnitOfWork - Coordination

```csharp
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IProjectRepository Projects { get; }
    ICodeFileRepository Files { get; }
    ICollaborationRepository Collaborations { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```

**Pattern Unit of Work :**
```csharp
// Plusieurs opérations dans une transaction
var user = await _unitOfWork.Users.GetByIdAsync(userId);
var project = new Project { Name = "Mon projet", OwnerId = userId };

await _unitOfWork.Projects.AddAsync(project);
await _unitOfWork.SaveChangesAsync();  // Commit atomique
```

## Exceptions Métier

### DomainException - Base

```csharp
public class DomainException : Exception
{
    public string Code { get; }

    public DomainException(string code, string message) : base(message)
    {
        Code = code;
    }
}
```

**Pourquoi un `Code` ?**
- Le `Message` est pour les humains (peut changer)
- Le `Code` est pour le code (stable, testable)

```csharp
throw new NotFoundException("USER_NOT_FOUND", "Utilisateur non trouvé");

// Côté client :
if (error.code === "USER_NOT_FOUND") {
    showLoginForm();
}
```

### Hiérarchie des exceptions

```
DomainException
├── NotFoundException       # 404 - Ressource introuvable
├── UnauthorizedException   # 401/403 - Accès refusé
├── ValidationException     # 400 - Données invalides
└── ConflictException       # 409 - Conflit (email déjà pris)
```

### Utilisation

```csharp
// Dans un service
var user = await _unitOfWork.Users.GetByIdAsync(userId)
    ?? throw new NotFoundException("USER_NOT_FOUND", "Utilisateur non trouvé");

if (project.OwnerId != userId)
    throw new UnauthorizedException("NOT_OWNER", "Vous n'êtes pas le propriétaire");

var existing = await _unitOfWork.Users.GetByEmailAsync(email);
if (existing != null)
    throw new ConflictException("EMAIL_EXISTS", "Cet email est déjà utilisé");
```

## Bonnes pratiques Domain

### 1. Pas de dépendances externes

```xml
<!-- CloudCode.Domain.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <!-- AUCUN PackageReference ! -->
</Project>
```

### 2. Entités riches (pas anémiques)

```csharp
// ❌ Anemic Domain Model (mauvais)
public class User
{
    public string Email { get; set; }
}

// ✅ Rich Domain Model (bon)
public class User : BaseEntity
{
    private string _email = string.Empty;

    public string Email
    {
        get => _email;
        set => _email = value?.ToLowerInvariant().Trim()
            ?? throw new ValidationException("EMAIL_REQUIRED", "Email requis");
    }
}
```

### 3. Invariants métier dans les entités

```csharp
public class Collaboration : BaseEntity
{
    private CollaboratorRole _role;

    public CollaboratorRole Role
    {
        get => _role;
        set
        {
            if (!Enum.IsDefined(typeof(CollaboratorRole), value))
                throw new ValidationException("INVALID_ROLE", "Rôle invalide");
            _role = value;
        }
    }
}
```

### 4. Immutabilité des identifiants

```csharp
public abstract class BaseEntity
{
    // private set : seul le constructeur peut définir l'Id
    public Guid Id { get; private set; } = Guid.NewGuid();
}
```

## Diagramme de classes

```
┌─────────────────┐     ┌─────────────────┐
│   BaseEntity    │     │      User       │
├─────────────────┤     ├─────────────────┤
│ Id: Guid        │◄────│ Email           │
│ CreatedAt       │     │ PasswordHash    │
│ UpdatedAt       │     │ Username        │
└─────────────────┘     │ RefreshToken    │
                        └────────┬────────┘
                                 │ 1
                                 │
                        ┌────────┴────────┐
                        │                 │
                      N │               N │
               ┌───────────────┐  ┌───────────────┐
               │    Project    │  │ Collaboration │
               ├───────────────┤  ├───────────────┤
               │ Name          │  │ Role          │
               │ Language      │  │ AcceptedAt    │
               │ IsPublic      │  └───────────────┘
               └───────┬───────┘
                       │ 1
                       │
                     N │
               ┌───────────────┐
               │   CodeFile    │
               ├───────────────┤
               │ Name          │
               │ Path          │
               │ Content       │
               │ IsFolder      │
               └───────────────┘
```

## Résumé

| Élément | Rôle |
|---------|------|
| **Entities** | Modèles de données avec logique métier |
| **Enums** | Types énumérés pour les valeurs fixes |
| **Exceptions** | Erreurs métier typées |
| **Interfaces** | Contrats pour les repositories |

La couche Domain est **stable** et **indépendante**. Elle change rarement et n'est jamais affectée par les choix technologiques (framework web, ORM, etc.).
