# CloudCode — Guide du Propriétaire

> Document complet : architecture, fonctionnalités, base de données, API, état actuel et ce qui manque.
> Mise à jour : mars 2026

---

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Base de données](#4-base-de-données)
5. [Backend — Couches et Services](#5-backend--couches-et-services)
6. [API REST — Endpoints complets](#6-api-rest--endpoints-complets)
7. [Frontend — Pages et Composants](#7-frontend--pages-et-composants)
8. [Fonctionnalités implémentées](#8-fonctionnalités-implémentées)
9. [Fonctionnalités manquantes / À faire](#9-fonctionnalités-manquantes--à-faire)
10. [Lancer le projet](#10-lancer-le-projet)
11. [Configuration](#11-configuration)
12. [Conventions et patterns](#12-conventions-et-patterns)

---

## 1. Vue d'ensemble

CloudCode est une **plateforme de coding compétitif** style LeetCode, avec :

- **Challenges de code** : 51 challenges en mode fonction (Python + JavaScript), testés automatiquement
- **Mode VS** : 1v1 en temps réel avec système ELO
- **Cours** : Parcours d'apprentissage guidé
- **Classement** : Leaderboard global et par challenge
- **Administration** : Panel admin pour gérer challenges, cours, users

L'application tourne entièrement en local (SQLite) sans dépendances cloud.

---

## 2. Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Backend | .NET / C# | 8.0 |
| ORM | Entity Framework Core | 8.x |
| Base de données | SQLite | — |
| Auth | JWT + Refresh Token | — |
| Real-time | SignalR | — |
| Frontend | Next.js (App Router) | 16.1 |
| UI Framework | React | 19.2 |
| Langage frontend | TypeScript | 5.x |
| CSS | Tailwind CSS | 4.x |
| Éditeur de code | Monaco Editor | 4.7 |
| Terminal | xterm.js | 6.0 |
| 3D | Three.js | 0.183 |
| State management | Zustand | 5.0 |
| HTTP client | Axios | 1.13 |
| Validation | FluentValidation | — |
| Mapping | AutoMapper | — |

---

## 3. Architecture

### Architecture Générale

```
CloudCode/
├── src/
│   ├── CloudCode.Domain/          # Entités, interfaces, enums
│   ├── CloudCode.Application/     # DTOs, interfaces services, validators
│   ├── CloudCode.Infrastructure/  # Implémentation services, EF Core, migrations
│   └── CloudCode.API/             # Controllers, SignalR Hubs, middleware
└── frontend/
    └── src/
        ├── app/                   # Pages (App Router Next.js)
        ├── components/            # Composants réutilisables
        ├── stores/                # State management (Zustand)
        ├── lib/                   # API client, utilitaires
        └── types/                 # Types TypeScript
```

### Pattern Backend : Clean Architecture

```
API Controller
    ↓ appelle
Application Service (Interface)
    ↓ implémenté par
Infrastructure Service
    ↓ utilise
Repository / DbContext (EF Core → SQLite)
```

**Règle** : chaque couche ne dépend que de la couche inférieure. Le Domain ne dépend de rien.

### Flux d'une requête typique

```
HTTP Request
→ JWT Middleware (vérifie token)
→ Controller (valide input, appelle service)
→ Service (logique métier)
→ Repository / DbContext (accès données)
→ SQLite
→ Response DTO
```

---

## 4. Base de données

### Schéma complet

```
Users (17 champs)
├── Id (Guid, PK)
├── Email (unique)
├── PasswordHash
├── Username (unique)
├── Avatar?
├── Bio?
├── EmailConfirmed
├── RefreshToken?
├── RefreshTokenExpiry?
├── IsAdmin
├── CreatedAt / UpdatedAt
│
├── → Projects (1-N, propriétaire)
├── → Collaborations (1-N, invité)
├── → UserSubmissions (1-N)
├── → UserProgress (1-N)
├── → VsMatches (N-N via Player1Id/Player2Id)
├── → VsRanks (1-1)
├── → AuditLogs (1-N)
└── → GitCredentials (1-N)

Projects (10 champs)
├── Id, Name, Description, Language
├── IsPublic, OwnerId, Tags (JSON)
├── CreatedAt / UpdatedAt
│
├── → CodeFiles (1-N, hiérarchique)
├── → Collaborations (1-N)
├── → ExecutionResults (1-N)
├── → ProjectDependencies (1-N)
└── → EnvironmentVariables (1-N)

CodeFiles (8 champs)
├── Id, Name, Path, Content (text)
├── IsFolder, ParentId?, ProjectId
└── (hiérarchique : parent/enfants)

Challenges (15 champs)
├── Id, Title, Slug (unique), Description (markdown)
├── Difficulty (1=Easy, 2=Medium, 3=Hard)
├── SupportedLanguages (1=Python, 2=JS, 3=Les deux)
├── StarterCodePython, StarterCodeJavaScript
├── TestRunnerPython, TestRunnerJavaScript
├── IsFunction (bool — mode LeetCode)
├── Tags (JSON), IsPublished
├── CreatedAt / UpdatedAt
│
├── → TestCases (1-N)
├── → UserSubmissions (1-N)
└── → UserProgress (1-N)

TestCases (7 champs)
├── Id, ChallengeId
├── Input, ExpectedOutput
├── IsHidden (bool — caché à l'user)
├── OrderIndex, Description?

UserSubmissions (10 champs)
├── Id, UserId, ChallengeId
├── Language, Code
├── Status (1=Pending … 6=Timeout)
├── PassedTests, TotalTests, Score
├── ExecutionTimeMs, ErrorOutput?
└── SubmittedAt

UserProgress (clé composite UserId+ChallengeId)
├── IsSolved, BestScore
├── AttemptCount, LastAttemptAt

Courses (7 champs)
├── Id, Title, Slug, Description
├── Language, OrderIndex, IsPublished
└── → CourseChallenges (1-N)

CourseChallenges
├── CourseId, ChallengeId, OrderIndex

VsMatches (14 champs)
├── Id, Player1Id, Player2Id, ChallengeId, WinnerId?
├── Status (1=Waiting, 2=InProgress, 3=Finished, 4=Cancelled)
├── Player1/2Language, Player1/2Submitted
├── Player1/2EloChange
└── StartedAt, FinishedAt?

VsRanks
├── UserId (unique), Elo (défaut 1000)
├── Wins, Losses, Draws
├── CurrentStreak, BestStreak
└── Tier calculé : Bronze/Silver/Gold/Platinum/Diamond/Master/Grandmaster

Collaborations
├── ProjectId, UserId, Role (1=Read, 2=Write, 3=Admin)
├── InvitedAt, AcceptedAt?, InvitedByEmail

ExecutionResults
├── ProjectId, FileId, UserId
├── Language, Code, Output, ErrorOutput
├── ExitCode, Status, ExecutionTime, MemoryUsedBytes

ProjectDependencies
├── ProjectId, Name, Version, Type
└── IsInstalled, InstalledAt?

EnvironmentVariables
├── ProjectId, Key, Value, IsSecret

AuditLogs
├── UserId, ProjectId?, Action, Details (JSON)
└── IpAddress, UserAgent

GitCredentials
├── UserId, Provider (github/gitlab/bitbucket)
├── Token, Username?
```

### Migrations appliquées

| Migration | Description |
|---|---|
| `20260103025621_InitialCreate` | Schéma complet initial |
| `20260109051158_AddProjectDependencies` | Table ProjectDependencies |
| `20260307021701_AddChallengeEntities` | Tables Challenges, TestCases, UserSubmissions, UserProgress |
| `20260309100000_AddChallengeFunctionMode` | Colonnes IsFunction, TestRunnerPython/JS sur Challenges |

---

## 5. Backend — Couches et Services

### Domain (CloudCode.Domain)

**Entités** : User, Project, CodeFile, Challenge, TestCase, UserSubmission, UserProgress, Course, CourseChallenge, VsMatch, VsRank, Collaboration, ExecutionResult, ProjectDependency, EnvironmentVariable, AuditLog, GitCredential

**Enums** :
- `ProgrammingLanguage` — 15 langages (JS, Python, C#, Java, Go, TypeScript, HTML, CSS, JSON, Markdown, SQL, XML, YAML, Bash, Rust)
- `ChallengeDifficulty` — Easy(1), Medium(2), Hard(3)
- `ChallengeLanguage` — Python(1), JavaScript(2), Both(3)
- `SubmissionStatus` — Pending(1), Running(2), Passed(3), Failed(4), Error(5), Timeout(6)
- `VsMatchStatus` — Waiting(1), InProgress(2), Finished(3), Cancelled(4)
- `ExecutionStatus` — Pending, Running, Completed, Failed, Timeout, Cancelled
- `CollaboratorRole` — Read(1), Write(2), Admin(3)

### Application (CloudCode.Application)

**Services (interfaces)** :
| Interface | Rôle |
|---|---|
| `IAuthService` | Login, register, refresh token, reset password |
| `ITokenService` | Générer et valider JWT |
| `IProjectService` | CRUD projets |
| `IFileService` | CRUD fichiers dans un projet |
| `ICodeExecutionService` | Exécuter du code, capturer output |
| `ICollaborationService` | Partager projets, gérer collaborateurs |
| `IDependencyService` | Packages npm/pip par projet |
| `IEnvironmentService` | Variables d'environnement |
| `IAIService` | Intégration aide IA |
| `IFormattingService` | Formatter le code (black, prettier, gofmt) |
| `IGitService` | Opérations git (init, commit, push, pull) |
| `IGitCredentialService` | Stocker/récupérer tokens GitHub/GitLab |
| `IChallengeService` | CRUD challenges, leaderboard |
| `IJudgeService` | Exécuter et juger les soumissions |
| `ICourseService` | CRUD cours |
| `IVsService` | Gestion matchs compétitifs |
| `IMatchmakingService` | Trouver un adversaire pour VS mode |
| `IPortDetectionService` | Trouver ports disponibles |
| `IUserService` | Gestion utilisateurs (admin) |

### Infrastructure (CloudCode.Infrastructure)

**Pattern JudgeService** (le plus critique) :
```
Challenge en mode IsFunction=true
→ user écrit uniquement la fonction (ex: def two_sum(nums, target):)
→ JudgeService appelle BuildCode(userCode, testRunner) :
    code_complet = userCode + "\n" + testRunnerPython
→ Écrit dans fichier temp
→ Lance python3/node avec stdin = input du test case
→ Capture stdout, compare avec expectedOutput (normalisé)
→ Retourne passed/failed par test case
```

**FormattingService** :
- Python → `black --quiet -` (stdin/stdout)
- JavaScript/TypeScript → `npx prettier --parser babel`
- Go → `gofmt`
- Rust → `rustfmt --edition 2021`
- Si outil absent → retourne code original sans erreur

**GitService** : utilise `System.Diagnostics.Process` pour appeler `git` en CLI.

**ChallengeSeeder** : s'exécute au démarrage de l'app, upsert par slug (met à jour les existants, ajoute les nouveaux).

### API (CloudCode.API)

**SignalR Hubs** :
- `/hubs/code` — Collaboration temps réel (curseurs, modifications)
- `/hubs/terminal` — Terminal/output en streaming
- `/hubs/vs` — Matchmaking et résultats VS mode

**Middleware** :
- `ExceptionMiddleware` — Capture toutes les exceptions, retourne JSON structuré

---

## 6. API REST — Endpoints complets

### Auth (`/api/auth`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/login` | Login email/password → JWT |
| POST | `/auth/register` | Créer un compte |
| POST | `/auth/refresh` | Renouveler le JWT via refresh token |
| POST | `/auth/logout` | Invalider le refresh token |

### Challenges (`/api/challenges`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/challenges` | ✓ | Liste tous les challenges publiés (+ isSolved par user) |
| GET | `/challenges/{slug}` | ✓ | Détail d'un challenge |
| POST | `/challenges/{slug}/test` | ✓ | Tester le code (test cases visibles seulement) |
| POST | `/challenges/{slug}/submit` | ✓ | Soumettre (tous les test cases) |
| GET | `/challenges/{slug}/submissions` | ✓ | Historique des soumissions du user |
| GET | `/leaderboard` | ✓ | Classement global |

### Admin Challenges (`/api/admin/challenges`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/challenges` | Admin | Tous les challenges (publiés + brouillons) |
| POST | `/admin/challenges` | Admin | Créer un challenge |
| PUT | `/admin/challenges/{id}` | Admin | Modifier un challenge |
| DELETE | `/admin/challenges/{id}` | Admin | Supprimer |
| POST | `/admin/challenges/{id}/publish` | Admin | Publier/dépublier |
| POST | `/admin/challenges/seed` | Admin | Relancer le seeder |

### Courses (`/api/courses`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/courses` | ✓ | Liste des cours publiés |
| GET | `/courses/{slug}` | ✓ | Détail cours + challenges (avec isSolved) |
| GET | `/admin/courses` | Admin | Tous les cours |
| POST | `/admin/courses` | Admin | Créer |
| PUT | `/admin/courses/{id}` | Admin | Modifier |
| DELETE | `/admin/courses/{id}` | Admin | Supprimer |
| POST | `/admin/courses/{id}/publish` | Admin | Publier/dépublier |

### VS Mode (`/api/vs`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/vs/rank` | ✓ | Mon ELO et stats |
| GET | `/vs/rank/{userId}` | ✓ | ELO d'un autre user |
| GET | `/vs/leaderboard` | ✓ | Classement compétitif |
| GET | `/vs/matches` | ✓ | Mon historique de matchs |
| GET | `/vs/matches/{id}` | ✓ | Détail d'un match |
| POST | `/vs/matches/{id}/submit` | ✓ | Soumettre code dans un match |
| POST | `/vs/matches/{id}/forfeit` | ✓ | Abandonner un match |

### Projets (`/api/projects`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/projects` | Mes projets |
| POST | `/projects` | Créer un projet |
| GET | `/projects/{id}` | Détail projet |
| PUT | `/projects/{id}` | Modifier |
| DELETE | `/projects/{id}` | Supprimer |
| GET | `/projects/{id}/files` | Arborescence de fichiers |
| GET | `/projects/{id}/download` | Télécharger en ZIP |

### Fichiers (`/api/files`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/files/{id}` | Lire un fichier |
| POST | `/files` | Créer un fichier/dossier |
| PUT | `/files/{id}` | Modifier contenu |
| DELETE | `/files/{id}` | Supprimer |
| POST | `/files/{id}/rename` | Renommer |

### Exécution (`/api/execution`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/execution/run` | Exécuter du code |

### Formatage (`/api/format`)

| Méthode | Route | Body | Description |
|---|---|---|---|
| POST | `/format` | `{ code, language }` | Formatter le code |

### Git (`/api/projects/{id}/git`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/git/init` | Initialiser un repo |
| GET | `/git/status` | Voir les fichiers modifiés |
| GET | `/git/diff` | Voir les diffs |
| POST | `/git/stage` | Stager tous les fichiers |
| POST | `/git/commit` | Commit avec message |
| POST | `/git/push` | Push vers remote |
| POST | `/git/pull` | Pull depuis remote |
| GET | `/git/branches` | Lister les branches |
| POST | `/git/checkout` | Changer/créer branche |
| GET | `/git/log` | Historique commits |
| POST | `/git/remote` | Définir l'URL remote |

### Git Credentials (`/api/git/credentials`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/git/credentials` | Sauvegarder token GitHub/GitLab |
| GET | `/git/credentials` | Voir mes credentials |
| DELETE | `/git/credentials/{provider}` | Supprimer |

### Collaboration (`/api/collaborations`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/collaborations/{projectId}` | Collaborateurs d'un projet |
| POST | `/collaborations/{projectId}/invite` | Inviter par email |
| DELETE | `/collaborations/{projectId}/{userId}` | Retirer un collaborateur |

### Admin Users (`/api/admin/users`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/users` | Tous les utilisateurs |
| POST | `/admin/users/{id}/toggle-admin` | Donner/retirer admin |

---

## 7. Frontend — Pages et Composants

### Pages (Next.js App Router)

| Route | Page | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page (3D hero, stats, challenge du jour, leaderboard preview) |
| `/login` | `app/login/page.tsx` | Formulaire de connexion |
| `/register` | `app/register/page.tsx` | Formulaire d'inscription |
| `/challenges` | `app/challenges/page.tsx` | Liste des challenges (filtres difficulty/language/tags, recherche) |
| `/challenges/[slug]` | `app/challenges/[slug]/page.tsx` | IDE challenge (éditeur Monaco, run/submit, résultats, timer, historique) |
| `/leaderboard` | `app/leaderboard/page.tsx` | Classement global |
| `/courses` | `app/courses/page.tsx` | Liste des cours |
| `/courses/[slug]` | `app/courses/[slug]/page.tsx` | Cours avec liste de challenges et progression |
| `/vs` | `app/vs/page.tsx` | Accueil VS mode (ELO, recherche adversaire, historique) |
| `/vs/[matchId]` | `app/vs/[matchId]/page.tsx` | Match en cours (IDE dual, timer, résultats temps réel) |
| `/admin/challenges` | Admin challenges | Tableau de bord challenges |
| `/admin/challenges/new` | Admin challenges | Créer challenge |
| `/admin/challenges/[id]/edit` | Admin challenges | Modifier challenge |
| `/admin/courses` | Admin courses | Tableau de bord cours |
| `/admin/courses/new` | Admin courses | Créer cours |
| `/admin/courses/[id]/edit` | Admin courses | Modifier cours |
| `/admin/users` | Admin users | Gérer utilisateurs |

### Composants

| Composant | Description |
|---|---|
| `AnimatedLogo` | Logo CloudCode animé |
| `SoundControl` | Bouton on/off effets sonores |
| `three/HeroScene` | Scène Three.js pour la landing page |

### State Management (Zustand)

| Store | État | Actions |
|---|---|---|
| `authStore` | user, isAuthenticated, isLoading, error | login, register, logout, checkAuth, setUser, clearError |

Persisté dans `localStorage` (accessToken, refreshToken).

### lib/api.ts — Clients API

| Client | Endpoints exposés |
|---|---|
| `authApi` | login, register, logout, refresh |
| `challengesApi` | getAll, getBySlug, test, submit, getSubmissions, getLeaderboard + admin CRUD |
| `coursesApi` | getAll, getBySlug + admin CRUD |
| `vsApi` | getMyRank, getRank, getLeaderboard, getMatch, getHistory, submit, forfeit |
| `formattingApi` | format(code, language) |
| `adminUsersApi` | getAll, toggleAdmin |

**Intercepteurs Axios** :
- Request → injecte `Authorization: Bearer {token}`
- Response 401 → tente refresh token automatique → redirige vers `/login` si échec

---

## 8. Fonctionnalités implémentées

### ✅ Challenges (COMPLET)

- 51 challenges en base de données, tous publiés
- Format fonction LeetCode : l'user écrit uniquement la fonction
- Python + JavaScript supportés (la plupart supportent les deux)
- Test cases visibles (exemples) + cachés (soumission complète)
- 259 test cases vérifiés et fonctionnels
- Score par soumission
- Historique des soumissions (clic pour recharger le code)
- Timer de résolution
- **Persistance du code** : localStorage par user+challenge+langage, survit à la déconnexion et fermeture du navigateur
- Format code (Alt+Shift+F) — Python via black
- Reset au starter code
- Raccourcis clavier : Ctrl+Enter (Run), Ctrl+Shift+Enter (Submit)

### ✅ Challenges — Catégories couvertes

| Catégorie | Challenges |
|---|---|
| Arrays | Two Sum, Max Subarray, Move Zeros, Remove Duplicates, Array Intersection, Rotate Array, Find Missing, Single Number |
| Strings | Reverse String, Palindrome Check, Anagram Check, Count Vowels, Caesar Cipher, Longest Common Prefix, Count Char, First Non-Repeating |
| Math | Fibonacci, Factorial, Prime Number, FizzBuzz, Power of Two |
| Sorting | Bubble Sort, Merge Sort |
| Dynamic Programming | Climbing Stairs, Coin Change, Edit Distance, Longest Common Subsequence, Min Path Sum, Knapsack, Max Product Subarray |
| Linked Lists | Reverse Linked List, Detect Cycle |
| Trees/Graphs | Binary Search, BFS, DFS, Valid BST, Tree Height |
| Stack/Queue | Valid Parentheses, Min Stack |
| Hashing | Group Anagrams, Top K Elements |
| Miscellaneous | Even/Odd Check, Sum of Digits |

### ✅ VS Mode (COMPLET)

- Matchmaking temps réel via SignalR
- Système ELO (défaut 1000)
- Tiers : Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- Matchs 1v1 sur un même challenge aléatoire
- Soumission simultanée, premier qui passe tous les tests gagne
- Historique des matchs
- Leaderboard compétitif

### ✅ Cours (COMPLET)

- Cours Python et JavaScript
- Challenges ordonnés dans chaque cours
- Progression : isSolved par challenge
- Admin : créer, modifier, ordonner, publier/dépublier

### ✅ Authentification (COMPLET)

- JWT Access Token (durée configurable)
- Refresh Token (persisté en DB)
- Refresh automatique côté frontend (intercepteur Axios)
- Hashage bcrypt des mots de passe
- Rôles : User et Admin

### ✅ Leaderboard (COMPLET)

- Classement par score total
- Nombre de challenges résolus
- Perfect scores (100%)
- Filtres par période (all, week, month)

### ✅ Projets & IDE (PARTIELLEMENT)

- Créer/modifier/supprimer des projets
- Éditeur Monaco avec arborescence de fichiers
- Exécution de code (run)
- Collaboration en temps réel (SignalR)
- Téléchargement en ZIP
- Variables d'environnement
- Gestion des dépendances
- Git intégré (init, commit, push, pull)
- Formatage du code (black, prettier, gofmt, rustfmt)

### ✅ Admin (COMPLET)

- Tableau de bord challenges : créer, modifier, publier, supprimer
- Tableau de bord cours : idem
- Gestion utilisateurs : liste, donner/retirer les droits admin
- Seeder : relancer l'injection des challenges depuis l'API

---

## 9. Fonctionnalités manquantes / À faire

### 🔴 Priorité haute

| Feature | Description | Complexité |
|---|---|---|
| **Email de vérification** | Confirmer l'email à l'inscription | Moyenne |
| **Reset de mot de passe** | Envoyer email avec lien de reset | Moyenne |
| **Profile utilisateur** | Page `/profile` avec stats, avatar, bio | Faible |
| **Streak journalier** | Défi quotidien + streak de jours consécutifs | Faible |

### 🟡 Priorité moyenne

| Feature | Description | Complexité |
|---|---|---|
| **Hints / indices** | Indices débloquables sur les challenges | Faible |
| **Discussion par challenge** | Forum/commentaires sous chaque challenge | Haute |
| **Solution officielle** | Voir la solution après avoir résolu | Faible |
| **Complexité algorithmique** | Afficher O(n) attendu sur les challenges | Faible |
| **Pagination leaderboard** | Actuellement tout chargé d'un coup | Faible |
| **Notifications** | Notif quand un adversaire VS soumet | Moyenne |
| **Statistiques avancées** | Graphique de progression dans le temps | Moyenne |
| **Challenge aléatoire** | Bouton "challenge surprise" selon niveau | Faible |

### 🟢 Priorité basse / Nice-to-have

| Feature | Description | Complexité |
|---|---|---|
| **Dark/Light mode** | Toggle thème | Faible |
| **Partage de challenge** | Lien partageable avec code pré-rempli | Faible |
| **Badges et achievements** | Système de récompenses (first solve, streak, etc.) | Haute |
| **Mobile app** | Version React Native | Très haute |
| **Support Java/C++** | Ajouter d'autres langages aux challenges | Haute |
| **Éditeur collaboratif** | Pair programming sur challenge | Haute |
| **Contests** | Compétitions avec deadline | Haute |
| **Subscription/Plan** | Challenges premium | Très haute |

### 🔧 Dette technique

| Problème | Solution suggérée |
|---|---|
| **SQLite en production** | Migrer vers PostgreSQL pour la concurrence |
| **Exécution code non sandboxée** | Dockeriser les exécutions (sécurité) |
| **Pas de rate limiting** | Limiter les soumissions (ex: 10/minute/user) |
| **Tokens JWT dans localStorage** | httpOnly cookie plus sécurisé |
| **Pas de tests automatisés** | Ajouter xUnit (backend) et Jest (frontend) |
| **Emails non envoyés** | Configurer SMTP (Mailgun, SendGrid) |
| **Logs en console** | Ajouter Serilog avec structured logging |

---

## 10. Lancer le projet

### Prérequis

- .NET 8 SDK
- Node.js 18+
- Python 3.10+ (pour l'exécution des challenges Python)
- Node.js dans PATH (pour les challenges JavaScript)

### Backend

```bash
cd src/CloudCode.API
dotnet run
# Démarre sur http://localhost:5072
# Les migrations sont appliquées automatiquement au démarrage
# Le seeder injecte les 51 challenges au premier démarrage
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Démarre sur http://localhost:3000
```

### Variables d'environnement Frontend

Créer `frontend/.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:5072
```

### Variables d'environnement Backend

`src/CloudCode.API/appsettings.json` :
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=CloudCode.db"
  },
  "JwtSettings": {
    "SecretKey": "...",
    "Issuer": "CloudCode",
    "Audience": "CloudCode",
    "AccessTokenExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 7
  },
  "AllowedOrigins": ["http://localhost:3000"]
}
```

### Créer un compte Admin

1. Créer un compte normal via `/register`
2. Aller dans la DB SQLite : `UPDATE Users SET IsAdmin = 1 WHERE Email = 'ton@email.com';`
3. Ou passer par `/api/admin/users/{id}/toggle-admin` si un admin existe déjà

---

## 11. Configuration

### Durée des tokens JWT

Dans `appsettings.json` :
```json
"AccessTokenExpiryMinutes": 60,
"RefreshTokenExpiryDays": 7
```

### Timeout d'exécution du code

Dans `JudgeService.cs` :
```csharp
private const int ExecutionTimeoutMs = 5000; // 5 secondes
```

### Limites du Judge

- Max 200 résultats de recherche
- Timeout 5s par test case
- Normalisation output : trim + lowercase pour les comparaisons

### CORS

Dans `appsettings.json` :
```json
"AllowedOrigins": ["http://localhost:3000", "https://tondomaine.com"]
```

---

## 12. Conventions et patterns

### Nommage Backend

- Controllers : `{Resource}Controller.cs`
- Services : `I{Name}Service` (interface) + `{Name}Service` (implémentation)
- DTOs : `{Resource}{Action}Dto` (ex: `CreateChallengeDto`)
- Migrations : `{date}_{description}` (ex: `20260307021701_AddChallengeEntities`)

### Nommage Frontend

- Pages : `page.tsx` dans le dossier route
- Stores : `{name}Store.ts`
- Types : regroupés dans `types/index.ts`
- API clients : `{resource}Api` dans `lib/api.ts`

### Challenges — Format fonction

```python
# StarterCodePython
def function_name(param1, param2):
    pass

# TestRunnerPython (caché, appended par JudgeService)
import sys
data = sys.stdin.read().split('\n')
# ... lire les inputs, appeler la fonction, print(result)
```

```javascript
// StarterCodeJavaScript
function functionName(param1, param2) {
    // Write your solution here
}

// TestRunnerJavaScript (caché)
const data = require('fs').readFileSync(0, 'utf8').trim().split('\n');
// ... lire les inputs, appeler la fonction, console.log(result)
```

### LocalStorage — Convention de clés

| Clé | Contenu |
|---|---|
| `accessToken` | JWT access token |
| `refreshToken` | JWT refresh token |
| `cc_code_{userId}_{slug}_py` | Code Python sauvegardé par user+challenge |
| `cc_code_{userId}_{slug}_js` | Code JavaScript sauvegardé par user+challenge |
| `auth-storage` | State Zustand persisté (user) |

---

*Ce guide couvre l'état de l'application au 9 mars 2026. Mettre à jour après chaque feature importante.*
