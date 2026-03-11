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
| `20260310051932_AddStreakAndOfficialSolution` | Streak (ChallengeStreak, BestChallengeStreak, LastChallengeSolvedDate) sur User + OfficialSolutionPython/JS + Hints sur Challenge |
| `20260310130000_AddFirebaseUid` | Colonne `FirebaseUid` (nullable) sur Users + index unique |

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
| `/admin/users` | Admin users | Gérer utilisateurs |

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
- **Bouton Random** : navigue vers un challenge aléatoire parmi les challenges filtrés
- **Hints** : jusqu'à 3 indices débloquables un par un (stockés en JSON dans `Challenge.Hints`)
- **Solution officielle** : tab "Solution" visible uniquement après résolution complète (score 100), affiche Python et/ou JS

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
- **Firebase Auth** : email verification automatique à l'inscription, password reset par email, Google Sign-In
  - Backend : `POST /api/auth/firebase` — vérifie Firebase ID token, crée/lie le compte, émet JWT custom
  - Frontend : `lib/firebase.ts`, authStore mis à jour (login, register, loginWithGoogle, sendPasswordReset)
  - Page `/forgot-password` avec formulaire de reset
  - Google Sign-In via popup — username auto-dérivé du displayName Google (suffixe aléatoire si déjà pris)
  - Config : `firebase_key.json` à la racine du projet (service account), `.env.local` pour les clés web

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
- Gestion utilisateurs : liste, donner/retirer les droits admin
- Seeder : relancer l'injection des challenges depuis l'API

---

## 9. Fonctionnalités manquantes / À faire

### 🔴 Priorité haute — Produit

| Feature | Description | Complexité | Lié monétisation |
|---|---|---|---|
| ~~**Page Profil utilisateur**~~ | ✅ Implémenté — `/profile` avec stats complètes | — | — |
| ~~**Streak journalier**~~ | ✅ Implémenté — champs `ChallengeStreak` + `BestChallengeStreak` sur User, calculé dans JudgeService | — | — |
| ~~**Solution officielle**~~ | ✅ Implémenté — tab "Solution" visible après résolution (score 100), Python + JS | — | — |
| ~~**Hints / indices**~~ | ✅ Implémenté — débloquables un par un dans l'onglet Description | — | — |
| ~~**Challenge aléatoire**~~ | ✅ Implémenté — bouton Random dans la liste, respecte les filtres actifs | — | — |
| ~~**Email de vérification**~~ | ✅ Implémenté — Firebase Auth envoie l'email automatiquement à l'inscription | — | — |
| ~~**Reset de mot de passe**~~ | ✅ Implémenté — page `/forgot-password`, Firebase sendPasswordResetEmail | — | — |
| ~~**Google Sign-In**~~ | ✅ Implémenté — Firebase signInWithPopup, username auto-dérivé, bouton sur login + register | — | — |
| **Rate limiting soumissions** | Max X soumissions/minute pour éviter l'abus | Faible | Oui — free vs premium |
| **Challenge aléatoire** | Bouton "Random" sur `/challenges` filtré par difficulté | Très faible | Non |

### 🟡 Priorité moyenne — Engagement

| Feature | Description | Complexité |
|---|---|---|
| ~~**Graphique de progression**~~ | ✅ Implémenté — Heatmap GitHub-style sur `/profile`, 365 cases colorées par intensité | — |
| **Notifications email** | Email si streak en danger, nouveau challenge, résultat VS | Moyenne |
| ~~**Pagination leaderboard**~~ | ✅ Implémenté — 20 par page, boutons Prev/Next + numéros avec ellipsis | — |
| **Discussion par challenge** | Commentaires / forum sous chaque challenge | Haute |
| ~~**Partage challenge**~~ | ✅ Implémenté — bouton Share dans l'onglet Description | — |
| ~~**Challenge du jour**~~ | ✅ Implémenté — banner avec countdown, hash déterministe | — |
| ~~**Profil public**~~ | ✅ Implémenté — `/u/{username}` avec stats complètes | — |
| ~~**Admin — Statistiques globales**~~ | ✅ Implémenté — `/admin` dashboard : KPIs, graphique 14 jours, top challenges, raccourcis | — |

### 🟢 Priorité basse / Nice-to-have

| Feature | Description | Complexité |
|---|---|---|
| ~~**Badges et achievements**~~ | ✅ Implémenté — 16 badges calculés côté frontend depuis les stats existantes (common/rare/epic/legendary), section sur `/profile` | — |
| **Boutique avatars / thèmes** | Items cosmétiques achetables (lié monétisation) | Haute |
| **Contests** | Compétitions avec deadline et classement | Haute |
| **Support Java / C++ / Go** | Ajouter langages aux challenges | Haute |
| **Éditeur collaboratif** | Pair programming sur challenge | Haute |
| **Certifications payantes** | Badge certifié CloudCode après examen | Haute |
| **Mobile app** | React Native | Très haute |

### 🔧 Dette technique — À régler avant production

| Problème | Impact | Solution |
|---|---|---|
| **SQLite en production** | Corruption possible en concurrence | Migrer vers PostgreSQL |
| **Exécution code non sandboxée** | Risque sécurité (code malveillant) | Docker par exécution |
| ~~**Pas de rate limiting**~~ | ✅ Implémenté — sliding window 15/min (submit) + 30/min (test) | — |
| **JWT dans localStorage** | XSS vulnérabilité | httpOnly cookie |
| **Pas de tests automatisés** | Régressions difficiles à détecter | xUnit (backend) + Jest (frontend) |
| **Pas de SMTP configuré** | Email vérification impossible | Mailgun / SendGrid / Resend |
| **Logs en console uniquement** | Difficile à déboguer en prod | Serilog + fichier / Datadog |
| **Pas de backup DB** | Perte données possible | Cron backup SQLite → S3 ou local |

---

## 10. Plan de monétisation

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
Mois 1 : Page Profil + Streak journalier + Solution officielle
         → Fondation de l'expérience premium

Mois 2 : Hébergement (Railway/Render) + PostgreSQL + SMTP (Resend/Mailgun)
         → App accessible publiquement

Mois 3 : Stripe intégration + Système Premium (IsPremium, paywalls)
         → Premier dollar encaissé

Mois 4 : Boutique cosmétique (badges, thèmes)
         → Revenu impulsif

Mois 5 : VS Mode "gems" (monnaie virtuelle achetable)
         + Challenges "Pro" exclusifs Premium
         → Engagement + rétention

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

*Ce guide couvre l'état de l'application au 10 mars 2026. Mettre à jour après chaque feature importante.*
