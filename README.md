# CloudCode - IDE Collaboratif en Ligne

**Un IDE cloud complet pour apprendre le developpement fullstack**

![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![SignalR](https://img.shields.io/badge/SignalR-Temps%20Reel-purple)

---

## Apercu

CloudCode est un environnement de developpement integre (IDE) accessible depuis un navigateur web. Il permet de :

- Ecrire et executer du code dans plusieurs langages
- Collaborer en temps reel avec d'autres developpeurs
- Gerer des projets avec une arborescence de fichiers
- Installer des packages (pip, npm)

### Technologies utilisees

| Couche | Technologies | Concepts appris |
|--------|--------------|-----------------|
| **Backend** | .NET 8, Clean Architecture, EF Core | API REST, Repository Pattern, DI |
| **Frontend** | Next.js 14, TypeScript, Zustand, Monaco | React, State Management, SSR |
| **Temps reel** | SignalR (WebSocket) | Communication bidirectionnelle |
| **Auth** | JWT, BCrypt | Tokens, Hashage securise |
| **Database** | SQLite, EF Core Migrations | ORM, Versioning schema |

---

## Fonctionnalites

### IDE Complet
- **Editeur Monaco** (meme que VSCode) avec coloration syntaxique
- **Onglets multiples** pour editer plusieurs fichiers
- **Auto-save** apres 2 secondes d'inactivite
- **Raccourcis clavier** (Ctrl+S, Ctrl+Enter, Ctrl+N, etc.)

### Execution de code
- **7 langages** : JavaScript, Python, C#, Java, Go, TypeScript, Rust
- **Support stdin** pour les programmes interactifs
- **Affichage sortie/erreurs** avec temps d'execution

### Gestion de fichiers
- Arborescence de fichiers et dossiers
- Creer, renommer, supprimer fichiers
- **Telecharger le projet en ZIP**

### Collaboration
- **Temps reel** via SignalR
- Inviter des collaborateurs par email
- Voir les utilisateurs connectes

### Packages
- Gestionnaire de dependances integre
- Support **pip** (Python) et **npm** (JavaScript)

---

## Demarrage rapide

### Prerequis

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)

### Installation

```bash
# Cloner le projet
git clone https://github.com/loicKonan123/CloudCode.git
cd CloudCode

# Backend
dotnet restore
dotnet ef database update --project src/CloudCode.Infrastructure --startup-project src/CloudCode.API
cd src/CloudCode.API && dotnet run --urls "http://localhost:5000"

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

### Acces

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Swagger | http://localhost:5000/swagger |

### Compte de test

| Champ | Valeur |
|-------|--------|
| Email | `test@example.com` |
| Password | `Test12345` |

---

## Architecture

```
CloudCode/
├── src/
│   ├── CloudCode.API/              # Controllers, SignalR Hub
│   ├── CloudCode.Application/      # Services, DTOs, Validators
│   ├── CloudCode.Domain/           # Entities, Interfaces
│   └── CloudCode.Infrastructure/   # EF Core, Repositories
├── tests/
│   └── CloudCode.Tests/            # Tests unitaires
├── frontend/
│   └── src/
│       ├── app/                    # Pages Next.js
│       ├── components/             # Composants React
│       │   ├── ui/                 # Toast, Dialogs, Modals
│       │   ├── collaboration/      # Gestion collaborateurs
│       │   └── packages/           # Gestionnaire packages
│       ├── lib/                    # API, SignalR, Monaco
│       ├── stores/                 # Zustand (auth, state)
│       └── types/                  # Types TypeScript
└── docs/                           # Documentation complete
```

### Clean Architecture

```
        API (Controllers)
              ↓
        Application (Services, DTOs)
              ↓
           Domain (Entities, Interfaces)
              ↑
        Infrastructure (EF Core, External)
```

> **Regle d'or** : Les dependances pointent vers le Domain (centre).

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+S` | Sauvegarder |
| `Ctrl+Enter` | Executer |
| `Ctrl+N` | Nouveau fichier |
| `Ctrl+Shift+N` | Nouveau dossier |
| `Ctrl+W` | Fermer l'onglet |
| `Ctrl+Shift+?` | Afficher les raccourcis |
| `Esc` | Fermer le panel |

---

## API Endpoints

### Auth
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Creer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/refresh` | Rafraichir le token |

### Projects
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/projects` | Mes projets |
| POST | `/api/projects` | Creer |
| PUT | `/api/projects/{id}` | Modifier |
| DELETE | `/api/projects/{id}` | Supprimer |

### Files
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/files/project/{id}` | Arborescence |
| POST | `/api/files` | Creer fichier |
| GET | `/api/files/project/{id}/download` | Telecharger ZIP |

### Execution
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/execution/run` | Executer du code |

---

## Docker

```bash
# Lancer avec Docker Compose
docker-compose up -d

# Arreter
docker-compose down
```

---

## Tests

```bash
# Lancer les tests
dotnet test

# Avec couverture
dotnet test --collect:"XPlat Code Coverage"
```

---

## Documentation complete

Pour une documentation detaillee avec concepts pedagogiques :

**[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**

---

## Ressources pour apprendre

### Backend .NET
- [ASP.NET Core Docs](https://docs.microsoft.com/aspnet/core)
- [Clean Architecture Template](https://github.com/jasontaylordev/CleanArchitecture)

### Frontend Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand State Management](https://github.com/pmndrs/zustand)

### Temps reel
- [SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)

---

## Licence

MIT License - Libre d'utilisation pour apprendre et modifier.
