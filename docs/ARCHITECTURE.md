# Architecture CloudCode

## Vue d'ensemble

CloudCode utilise la **Clean Architecture** (Architecture Propre), un pattern architectural créé par Robert C. Martin (Uncle Bob). Cette architecture garantit:

- **Indépendance des frameworks** : Le code métier ne dépend pas d'ASP.NET ou Entity Framework
- **Testabilité** : La logique métier peut être testée sans UI, base de données ou serveur
- **Indépendance de l'UI** : L'interface peut changer sans modifier la logique métier
- **Indépendance de la base de données** : SQLite peut être remplacé par PostgreSQL sans toucher au métier

## Diagramme des couches

```
┌─────────────────────────────────────────────────────────────────┐
│                        CloudCode.API                             │
│    (Controllers, Hubs SignalR, Middleware, Program.cs)          │
├─────────────────────────────────────────────────────────────────┤
│                   CloudCode.Infrastructure                       │
│    (DbContext, Repositories, Services, JWT, BCrypt)             │
├─────────────────────────────────────────────────────────────────┤
│                    CloudCode.Application                         │
│    (DTOs, Interfaces Services, Validators, Mappings)            │
├─────────────────────────────────────────────────────────────────┤
│                      CloudCode.Domain                            │
│    (Entités, Enums, Exceptions, Interfaces Repositories)        │
└─────────────────────────────────────────────────────────────────┘
              ▲                                    │
              │      Règle de dépendance          │
              │      (vers l'intérieur)           ▼
```

## Règle de dépendance

**Les dépendances pointent TOUJOURS vers l'intérieur (vers Domain).**

```
API → Infrastructure → Application → Domain
```

- `Domain` : 0 dépendance (le cœur pur)
- `Application` : dépend de Domain
- `Infrastructure` : dépend de Application et Domain
- `API` : dépend de tout

## Structure des projets

```
CloudCode.sln
│
├── CloudCode/                          # Couche API (point d'entrée)
│   ├── Controllers/                    # Endpoints REST
│   ├── Hubs/                          # SignalR temps réel
│   ├── Middleware/                    # Gestion erreurs, logging
│   └── Program.cs                     # Configuration app
│
├── src/
│   ├── CloudCode.Domain/              # Couche Domaine (cœur métier)
│   │   ├── Common/                    # BaseEntity
│   │   ├── Entities/                  # User, Project, CodeFile...
│   │   ├── Enums/                     # ProgrammingLanguage, Status...
│   │   ├── Exceptions/                # DomainException, NotFoundException...
│   │   └── Interfaces/                # IRepository, IUnitOfWork
│   │
│   ├── CloudCode.Application/         # Couche Application (orchestration)
│   │   ├── DTOs/                      # Data Transfer Objects
│   │   ├── Interfaces/                # IAuthService, IProjectService...
│   │   ├── Validators/                # FluentValidation rules
│   │   └── Mappings/                  # AutoMapper profiles
│   │
│   └── CloudCode.Infrastructure/      # Couche Infrastructure (implémentations)
│       ├── Data/                      # DbContext, Configurations EF
│       ├── Repositories/              # Implémentations repositories
│       └── Services/                  # AuthService, TokenService...
│
└── docs/                              # Documentation
```

## Flux d'une requête HTTP

```
1. Client HTTP
       │
       ▼
2. [API] Controller reçoit la requête
       │
       ▼
3. [API] Middleware valide le JWT (si [Authorize])
       │
       ▼
4. [Infrastructure] Service métier traite la logique
       │
       ▼
5. [Infrastructure] Repository accède à la BDD
       │
       ▼
6. [Domain] Entités sont manipulées
       │
       ▼
7. [Application] DTO est créé pour la réponse
       │
       ▼
8. [API] Controller retourne le résultat
```

## Exemple concret : Login

```csharp
// 1. Controller (API) - Point d'entrée
[HttpPost("login")]
public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
{
    var response = await _authService.LoginAsync(dto);  // Appel service
    return Ok(response);
}

// 2. Service (Infrastructure) - Logique métier
public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
{
    var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email);  // Repository

    if (!_passwordHasher.Verify(dto.Password, user.PasswordHash))
        throw new UnauthorizedException("INVALID_CREDENTIALS");    // Exception Domain

    var token = _tokenService.GenerateAccessToken(user);           // Service infra

    return new AuthResponseDto { AccessToken = token, User = ... }; // DTO Application
}

// 3. Repository (Infrastructure) - Accès données
public async Task<User?> GetByEmailAsync(string email)
{
    return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
}

// 4. Entity (Domain) - Modèle pur
public class User : BaseEntity
{
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    // ...
}
```

## Inversion de dépendance (DIP)

Le principe clé est l'**Inversion de Dépendance**:

```csharp
// Domain définit l'INTERFACE (abstraction)
public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
}

// Infrastructure fournit l'IMPLÉMENTATION (détail)
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }
}

// Injection au démarrage (API/Program.cs)
services.AddScoped<IUserRepository, UserRepository>();
```

**Avantage** : Domain ne connaît pas Entity Framework. On pourrait remplacer par Dapper, MongoDB, ou un fichier JSON sans modifier Domain ni Application.

## Patterns utilisés

### 1. Repository Pattern
Abstraction de l'accès aux données.

```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
}
```

### 2. Unit of Work Pattern
Gestion des transactions et coordination des repositories.

```csharp
public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IProjectRepository Projects { get; }
    ICodeFileRepository Files { get; }
    ICollaborationRepository Collaborations { get; }

    Task<int> SaveChangesAsync();
}
```

### 3. DTO Pattern
Séparation entre entités internes et données exposées.

```csharp
// Entité (interne, avec relations)
public class User : BaseEntity
{
    public string PasswordHash { get; set; }  // Jamais exposé !
    public ICollection<Project> Projects { get; set; }
}

// DTO (externe, contrôlé)
public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; }
    // Pas de PasswordHash !
}
```

### 4. Service Layer Pattern
Encapsulation de la logique métier complexe.

```csharp
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto);
}
```

## Avantages de cette architecture

| Avantage | Description |
|----------|-------------|
| **Maintenabilité** | Chaque couche a une responsabilité claire |
| **Testabilité** | Les interfaces permettent le mocking |
| **Flexibilité** | Changement de BDD sans toucher au métier |
| **Scalabilité** | Modules découplés, faciles à faire évoluer |
| **Onboarding** | Structure prévisible, facile à comprendre |

## Anti-patterns évités

1. **Anemic Domain Model** ❌ : Les entités contiennent de la logique métier
2. **God Class** ❌ : Services découpés par responsabilité
3. **Tight Coupling** ❌ : Interfaces partout pour le découplage
4. **Magic Strings** ❌ : Enums et constantes typées

## Pour aller plus loin

- 📖 [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 📖 [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- 📖 [Implementing DDD - Vaughn Vernon](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577)
