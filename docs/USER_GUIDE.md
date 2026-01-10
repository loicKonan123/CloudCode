# Guide Utilisateur - CloudCode

## Introduction

CloudCode est un **IDE collaboratif en ligne** complet permettant de coder ensemble en temps reel.

### Pourquoi ce projet est pedagogique ?

Ce projet utilise les technologies et patterns les plus demandes en entreprise :

| Cote | Technologies | Ce que tu apprends |
|------|--------------|-------------------|
| **Backend** | .NET 8, Clean Architecture | API REST, Separation des responsabilites, DI |
| **Frontend** | Next.js 14, TypeScript, Zustand | React moderne, State management, SSR |
| **Temps reel** | SignalR | WebSockets, Communication bidirectionnelle |
| **Base de donnees** | EF Core, SQLite | ORM, Migrations, Repository Pattern |
| **Auth** | JWT, BCrypt | Securite, Tokens, Hashage |

---

## Table des matieres

1. [Prerequis](#prerequis)
2. [Installation](#installation)
3. [Demarrage rapide avec Docker](#demarrage-rapide-avec-docker)
4. [Interface utilisateur](#interface-utilisateur-frontend)
5. [Fonctionnalites de l'IDE](#fonctionnalites-de-lide)
6. [API Reference](#api-reference)
7. [Collaboration en temps reel](#signalr-temps-reel)
8. [Deploiement](#deploiement)
9. [Concepts cles pour un Fullstack](#concepts-cles-pour-un-fullstack)

---

## Prerequis

### Pour le developpement

| Outil | Version | Pourquoi ? |
|-------|---------|------------|
| [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) | 8.0+ | Runtime et compilateur C# |
| [Node.js](https://nodejs.org/) | 18+ | Runtime JavaScript pour Next.js |
| Git | 2.0+ | Versioning du code |

### Pour Docker (recommande en production)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Installation

### Etape 1 : Cloner le projet

```bash
git clone https://github.com/loicKonan123/CloudCode.git
cd CloudCode
```

### Etape 2 : Lancer le Backend (.NET)

```bash
# Restaurer les packages NuGet (equivalent de npm install pour .NET)
dotnet restore

# Appliquer les migrations de base de donnees
dotnet ef database update --project src/CloudCode.Infrastructure --startup-project src/CloudCode.API

# Lancer l'API
cd src/CloudCode.API
dotnet run --urls "http://localhost:5000"
```

> **Concept cle** : Les migrations EF Core sont comme des "commits" pour ta base de donnees. Elles permettent de versionner le schema.

### Etape 3 : Lancer le Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Etape 4 : Verifier que tout fonctionne

| Service | URL | Description |
|---------|-----|-------------|
| API Swagger | http://localhost:5000/swagger | Documentation interactive de l'API |
| Frontend | http://localhost:3000 | Interface utilisateur |
| Health Check | http://localhost:5000/health | Statut de l'API |

---

## Demarrage rapide avec Docker

```bash
# Construire et demarrer tous les services
docker-compose up -d

# Voir les logs en temps reel
docker-compose logs -f

# Arreter les services
docker-compose down
```

> **Concept cle** : Docker permet d'isoler chaque service dans un "conteneur". Ainsi, ton app fonctionne de la meme facon sur ta machine et en production.

---

## Interface utilisateur (Frontend)

### Page de connexion

1. Ouvrir http://localhost:3000
2. Creer un compte ou se connecter
3. Tu es redirige vers le **Dashboard**

### Dashboard - Mes Projets

Le dashboard affiche tous tes projets avec :

| Element | Description |
|---------|-------------|
| **Carte projet** | Nom, langage, date de creation |
| **Icone Globe/Cadenas** | Projet public ou prive |
| **Bouton Rename** | Renommer le projet (au survol) |
| **Bouton Delete** | Supprimer le projet (au survol) |
| **Barre de recherche** | Filtrer par nom ou description |
| **Bouton Nouveau** | Creer un nouveau projet |

### Creer un projet

1. Cliquer sur **"Nouveau"**
2. Remplir le formulaire :
   - **Nom** : Obligatoire, unique
   - **Description** : Optionnel
   - **Langage** : JavaScript, Python, C#, Java, Go, TypeScript, Rust
   - **Visibilite** : Public (tout le monde peut voir) ou Prive

---

## Fonctionnalites de l'IDE

### Vue d'ensemble de l'interface

```
+------------------------------------------------------------------+
| [<] CloudCode    [Nom du projet] [Pencil]    [Keyboard] [Download] [Trash] [Save] [Run] |
+------------------------------------------------------------------+
|         |                                    |                   |
| SIDEBAR |         EDITEUR MONACO             |   PANEL SORTIE    |
| Fichiers|  +---------------------------+     |                   |
|         |  | Tab1 | Tab2 | Tab3 | x   |     | Entree (stdin)    |
|         |  +---------------------------+     |   [textarea]      |
| [+] [F] |  |                           |     |                   |
|         |  |   Code ici...             |     | Sortie standard   |
|         |  |                           |     |   [output]        |
|         |  |                           |     |                   |
+---------+--+---------------------------+-----+-------------------+
```

### Fonctionnalites detaillees

#### 1. Systeme d'onglets multiples

Tu peux ouvrir **plusieurs fichiers** en meme temps :

- **Clic sur un fichier** : Ouvre dans un nouvel onglet
- **Indicateur orange** : Fichier non sauvegarde
- **Bouton X** : Fermer l'onglet (sauvegarde auto avant fermeture)
- **Auto-save** : Sauvegarde automatique apres 2 secondes d'inactivite

> **Concept cle** : C'est exactement comme VSCode ! Ce pattern est appele "Tab Management" et utilise un state derive.

#### 2. Input Console (stdin)

Pour les programmes interactifs (qui lisent l'entree utilisateur) :

1. Ouvrir le panel **"Entree (stdin)"** dans le panel de sortie
2. Taper les donnees d'entree
3. Cliquer sur **Executer**

**Exemple Python :**
```python
name = input("Votre nom: ")
age = input("Votre age: ")
print(f"Bonjour {name}, vous avez {age} ans!")
```

Dans le champ stdin, entre :
```
Alice
25
```

#### 3. Telecharger le projet (ZIP)

Clique sur l'icone **Download** dans l'en-tete pour telecharger tout ton projet en fichier ZIP.

> **Concept cle** : Le backend genere le ZIP a la volee avec `System.IO.Compression`. Le frontend recoit un `Blob` et cree un lien de telechargement.

#### 4. Raccourcis clavier

Clique sur l'icone **Keyboard** ou appuie sur `Ctrl+Shift+?` pour voir tous les raccourcis :

| Raccourci | Action |
|-----------|--------|
| `Ctrl+S` | Sauvegarder le fichier |
| `Ctrl+Enter` | Executer le code |
| `Ctrl+N` | Nouveau fichier |
| `Ctrl+Shift+N` | Nouveau dossier |
| `Ctrl+W` | Fermer l'onglet actif |
| `Ctrl+Shift+?` | Afficher les raccourcis |
| `Esc` | Fermer le panel de sortie |

#### 5. Gestionnaire de packages

Clique sur l'icone **Package** pour gerer les dependances :

| Langage | Gestionnaire |
|---------|--------------|
| Python | pip |
| JavaScript/TypeScript | npm |

**Exemple** : Ajouter `numpy` pour Python, `lodash` pour JavaScript.

#### 6. Collaboration en temps reel

- **Badge utilisateurs** : Affiche le nombre de personnes connectees
- **Bouton Collaborateurs** : Inviter des collaborateurs par email
- **Synchronisation** : Le code est synchronise en temps reel via SignalR

### Gestion des fichiers

| Action | Comment ? |
|--------|----------|
| **Creer un fichier** | Bouton `+` dans la sidebar |
| **Creer un dossier** | Bouton `Folder+` dans la sidebar |
| **Renommer** | Icone crayon au survol du fichier |
| **Supprimer** | Icone poubelle au survol du fichier |

---

## API Reference

### Architecture de l'API (Clean Architecture)

```
CloudCode.API/          <- Presentation Layer (Controllers)
    |
CloudCode.Application/  <- Business Logic Layer (Services, DTOs)
    |
CloudCode.Domain/       <- Domain Layer (Entities, Interfaces)
    |
CloudCode.Infrastructure/ <- Data Access Layer (EF Core, Repositories)
```

> **Concept cle** : La Clean Architecture separe les responsabilites. Le Domain ne depend de rien, l'Infrastructure depend de tout.

### Authentification (JWT)

#### Qu'est-ce que JWT ?

JWT = **JSON Web Token**. C'est un token signe qui contient des informations sur l'utilisateur.

```
eyJhbGciOiJIUzI1NiIs...   <- Header (algorithme)
.eyJzdWIiOiIxMjM0NTY...   <- Payload (donnees utilisateur)
.SflKxwRJSMeKKF2QT4f...   <- Signature (verification)
```

#### Flux d'authentification

```
1. POST /api/auth/login    -> Recoit accessToken + refreshToken
2. Requetes avec header    -> Authorization: Bearer <accessToken>
3. Token expire (1h)       -> POST /api/auth/refresh avec refreshToken
4. Deconnexion             -> POST /api/auth/logout (invalide refreshToken)
```

#### Endpoints Auth

```bash
# Creer un compte
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mon@email.com",
    "password": "MonMotDePasse123",
    "confirmPassword": "MonMotDePasse123",
    "username": "monpseudo"
  }'

# Se connecter
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mon@email.com", "password": "MonMotDePasse123"}'

# Requete authentifiee
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Projets CRUD

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/projects` | Lister mes projets |
| GET | `/api/projects/{id}` | Voir un projet |
| POST | `/api/projects` | Creer un projet |
| PUT | `/api/projects/{id}` | Modifier un projet |
| DELETE | `/api/projects/{id}` | Supprimer un projet |

### Fichiers CRUD

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/files/project/{projectId}` | Arborescence des fichiers |
| GET | `/api/files/{fileId}` | Contenu d'un fichier |
| POST | `/api/files` | Creer un fichier/dossier |
| PUT | `/api/files/{fileId}` | Modifier le contenu |
| DELETE | `/api/files/{fileId}` | Supprimer |
| GET | `/api/files/project/{projectId}/download` | Telecharger en ZIP |

### Execution de code

```bash
curl -X POST http://localhost:5000/api/execution/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "fileId": "...",
    "code": "print(input())",
    "language": 2,
    "input": "Hello World"
  }'
```

**Langages supportes :**

| ID | Langage | Extension |
|----|---------|-----------|
| 1 | JavaScript | .js |
| 2 | Python | .py |
| 3 | C# | .cs |
| 4 | Java | .java |
| 5 | Go | .go |
| 6 | TypeScript | .ts |
| 7 | Rust | .rs |

### Gestion des packages

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dependencies/project/{projectId}` | Liste des packages |
| POST | `/api/dependencies/project/{projectId}` | Ajouter un package |
| DELETE | `/api/dependencies/project/{projectId}/{dependencyId}` | Supprimer |

---

## SignalR (Temps reel)

### Qu'est-ce que SignalR ?

SignalR permet une communication **bidirectionnelle** entre le serveur et les clients via WebSocket.

```
Client 1  <---->  Serveur SignalR  <---->  Client 2
                      |
                      v
                  Broadcast a tous les clients du projet
```

### Connexion au Hub

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5000/hubs/code", {
        accessTokenFactory: () => accessToken  // JWT pour l'auth
    })
    .withAutomaticReconnect()  // Reconnexion auto si deconnecte
    .build();

await connection.start();
```

### Evenements

| Event | Direction | Description |
|-------|-----------|-------------|
| `JoinProject` | Client -> Server | Rejoindre un projet |
| `LeaveProject` | Client -> Server | Quitter un projet |
| `UserJoined` | Server -> Client | Un utilisateur a rejoint |
| `UserLeft` | Server -> Client | Un utilisateur a quitte |
| `CodeChanged` | Bidirectionnel | Modification de code |

---

## Deploiement

### Variables d'environnement production

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db;Database=cloudcode;..."
  },
  "JwtSettings": {
    "SecretKey": "minimum-32-caracteres-secret-key"
  }
}
```

### Docker Compose Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Concepts cles pour un Fullstack

### 1. Clean Architecture

```
        Presentation (API)
              |
        Application (Use Cases)
              |
           Domain
              |
        Infrastructure (DB, External Services)
```

**Regle d'or** : Les dependances vont toujours vers le centre (Domain).

### 2. Repository Pattern

```csharp
// Interface dans Domain
public interface IProjectRepository
{
    Task<Project?> GetByIdAsync(Guid id);
    Task<IEnumerable<Project>> GetAllAsync();
    Task AddAsync(Project project);
}

// Implementation dans Infrastructure
public class ProjectRepository : IProjectRepository
{
    private readonly ApplicationDbContext _context;
    // Implementation avec EF Core...
}
```

**Avantage** : Tu peux changer de base de donnees sans toucher au code metier.

### 3. State Management (Zustand)

```typescript
// Store simple et performant
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const response = await authApi.login(credentials);
    set({ user: response.data.user, isAuthenticated: true });
  },
}));
```

**Avantage** : Plus simple que Redux, pas de boilerplate.

### 4. JWT Flow

```
1. Login -> accessToken (1h) + refreshToken (7j)
2. Requetes -> Authorization: Bearer accessToken
3. 401 Unauthorized -> Utiliser refreshToken pour obtenir nouveau accessToken
4. refreshToken expire -> Redirection vers login
```

### 5. WebSocket vs HTTP

| HTTP | WebSocket (SignalR) |
|------|---------------------|
| Request/Response | Bidirectionnel |
| Client initie | Serveur peut push |
| Polling necessaire | Temps reel natif |

---

## Tests

```bash
# Lancer tous les tests
dotnet test

# Tests avec couverture
dotnet test --collect:"XPlat Code Coverage"
```

---

## Structure du projet

```
cloudCode/
├── src/
│   ├── CloudCode.API/              # Controllers, SignalR Hub, Middleware
│   ├── CloudCode.Application/      # Services, DTOs, Validators
│   ├── CloudCode.Domain/           # Entities, Enums, Interfaces
│   └── CloudCode.Infrastructure/   # EF Core, Repositories, Migrations
├── tests/
│   └── CloudCode.Tests/            # Tests unitaires xUnit
├── frontend/
│   └── src/
│       ├── app/                    # Pages Next.js (App Router)
│       ├── components/             # Composants React reutilisables
│       │   ├── ui/                 # Composants UI generiques
│       │   ├── collaboration/      # Gestion collaborateurs
│       │   └── packages/           # Gestionnaire packages
│       ├── lib/                    # API, SignalR, Utils, Monaco config
│       ├── stores/                 # Zustand stores
│       └── types/                  # Types TypeScript
├── docs/                           # Documentation
├── Dockerfile                      # Image Docker API
├── docker-compose.yml              # Stack locale
└── README.md
```

---

## Compte de test

| Champ | Valeur |
|-------|--------|
| Email | `test@example.com` |
| Password | `Test12345` |

---

## Ressources pour aller plus loin

### Backend .NET
- [Documentation officielle ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [Clean Architecture by Jason Taylor](https://github.com/jasontaylordev/CleanArchitecture)

### Frontend React/Next.js
- [Documentation Next.js](https://nextjs.org/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

### Temps reel
- [SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)

---

## Support

- **Issues** : https://github.com/loicKonan123/CloudCode/issues
- **Documentation** : Dossier `/docs`
