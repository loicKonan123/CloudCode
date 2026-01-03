# CloudCode API

**IDE en ligne collaboratif** - Backend .NET 8 avec Clean Architecture

## Architecture

```
CloudCode.sln
├── CloudCode.Domain          # Entités, Interfaces, Exceptions (0 dépendances)
├── CloudCode.Application     # DTOs, Services Interfaces, Validators
├── CloudCode.Infrastructure  # DbContext, Repositories, JWT, BCrypt
└── CloudCode.API             # Controllers, Hubs SignalR, Middleware
```

## Lancer l'API

```bash
cd CloudCode
dotnet run --urls "http://localhost:5072"
```

**Swagger UI:** http://localhost:5072/swagger

## Base de données

- **Type:** SQLite
- **Fichier:** `CloudCode/CloudCode.db`

### Commandes EF Core

```bash
# Créer une migration
dotnet ef migrations add NomMigration --project src/CloudCode.Infrastructure --startup-project CloudCode

# Appliquer les migrations
dotnet ef database update --project src/CloudCode.Infrastructure --startup-project CloudCode
```

## Endpoints API

### Auth (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Créer un compte | Non |
| POST | `/login` | Se connecter | Non |
| POST | `/refresh` | Rafraîchir le token | Non |
| POST | `/logout` | Se déconnecter | Oui |
| POST | `/change-password` | Changer le mot de passe | Oui |

### Projects (`/api/projects`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des projets de l'utilisateur | Oui |
| GET | `/{id}` | Détails d'un projet | Oui |
| POST | `/` | Créer un projet | Oui |
| PUT | `/{id}` | Modifier un projet | Oui |
| DELETE | `/{id}` | Supprimer un projet | Oui |
| GET | `/public` | Projets publics | Non |
| POST | `/{id}/fork` | Dupliquer un projet | Oui |

### Files (`/api/projects/{projectId}/files`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Arborescence des fichiers | Oui |
| GET | `/{fileId}` | Contenu d'un fichier | Oui |
| POST | `/` | Créer un fichier/dossier | Oui |
| PUT | `/{fileId}` | Modifier un fichier | Oui |
| DELETE | `/{fileId}` | Supprimer un fichier | Oui |

### Collaborations (`/api/collaborations`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/project/{id}` | Liste des collaborateurs | Oui |
| POST | `/project/{id}/invite` | Inviter un collaborateur | Oui |
| PUT | `/project/{id}/user/{userId}` | Modifier le rôle | Oui |
| DELETE | `/project/{id}/user/{userId}` | Retirer un collaborateur | Oui |
| GET | `/invitations` | Mes invitations en attente | Oui |
| POST | `/invitations/{id}/accept` | Accepter une invitation | Oui |
| POST | `/invitations/{id}/decline` | Refuser une invitation | Oui |
| POST | `/project/{id}/leave` | Quitter un projet | Oui |

### Execution (`/api/execution`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/run` | Exécuter du code | Oui |
| GET | `/languages` | Langages supportés | Non |

### AI Assistant (`/api/ai`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/explain` | Expliquer du code | Oui |
| POST | `/fix` | Corriger une erreur | Oui |
| POST | `/generate` | Générer du code | Oui |
| POST | `/completions` | Autocomplétion | Oui |
| POST | `/document` | Documenter du code | Oui |
| POST | `/refactor` | Refactorer du code | Oui |
| POST | `/optimize` | Optimiser du code | Oui |

## Authentification JWT

Ajouter le header:
```
Authorization: Bearer <accessToken>
```

### Exemple de login

```bash
curl -X POST http://localhost:5072/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test12345"}'
```

Réponse:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "abc123...",
  "expiresAt": "2024-01-01T12:00:00Z",
  "user": {
    "id": "guid",
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

## SignalR Hub

**URL:** `ws://localhost:5072/hubs/code`

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `JoinProject` | Client → Server | Rejoindre un projet |
| `LeaveProject` | Client → Server | Quitter un projet |
| `SendCodeChange` | Client → Server | Envoyer une modification |
| `ReceiveCodeChange` | Server → Client | Recevoir une modification |
| `UserJoined` | Server → Client | Un utilisateur a rejoint |
| `UserLeft` | Server → Client | Un utilisateur a quitté |

## Compte de test

| Champ | Valeur |
|-------|--------|
| Email | `test@example.com` |
| Password | `Test12345` |
| Username | `testuser` |

## Configuration OpenAI (Optionnel)

Pour activer l'assistant IA, ajouter dans `appsettings.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-api-key",
    "Model": "gpt-3.5-turbo"
  }
}
```

Sans clé API, l'assistant retourne des réponses simulées.

## Technologies

- .NET 8
- Entity Framework Core 8 (SQLite)
- JWT Authentication
- BCrypt (hashage mots de passe)
- SignalR (temps réel)
- FluentValidation
- AutoMapper
- OpenAI GPT (assistance IA)
