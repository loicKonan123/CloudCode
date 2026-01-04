# Guide Utilisateur - CloudCode API

## Introduction

CloudCode est une API backend pour un IDE collaboratif en ligne. Ce guide explique comment utiliser l'API.

## Prérequis

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Un client HTTP (curl, Postman, Insomnia)
- Optionnel : Node.js et Python pour l'exécution de code

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/loicKonan123/CloudCode.git
cd CloudCode
```

### 2. Restaurer les packages

```bash
dotnet restore
```

### 3. Appliquer les migrations

```bash
dotnet ef database update --project src/CloudCode.Infrastructure --startup-project CloudCode
```

### 4. Lancer l'API

```bash
cd CloudCode
dotnet run --urls "http://localhost:5072"
```

### 5. Vérifier

Ouvrir http://localhost:5072/swagger dans un navigateur.

## Authentification

### Créer un compte

```bash
curl -X POST http://localhost:5072/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mon@email.com",
    "password": "MonMotDePasse123",
    "confirmPassword": "MonMotDePasse123",
    "username": "monpseudo"
  }'
```

**Réponse :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123...",
  "expiresAt": "2024-01-01T13:00:00Z",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "mon@email.com",
    "username": "monpseudo"
  }
}
```

### Se connecter

```bash
curl -X POST http://localhost:5072/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mon@email.com",
    "password": "MonMotDePasse123"
  }'
```

### Utiliser le token

Ajouter le header `Authorization` à toutes les requêtes authentifiées :

```bash
curl http://localhost:5072/api/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Rafraîchir le token

Quand le `accessToken` expire (après 1h), utiliser le `refreshToken` :

```bash
curl -X POST http://localhost:5072/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "abc123..."
  }'
```

### Se déconnecter

```bash
curl -X POST http://localhost:5072/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Projets

### Créer un projet

```bash
curl -X POST http://localhost:5072/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Super Projet",
    "description": "Un projet de démo",
    "language": 1,
    "isPublic": false,
    "tags": ["demo", "javascript"]
  }'
```

**Langages disponibles :**
| ID | Langage |
|----|---------|
| 1 | JavaScript |
| 2 | Python |
| 3 | C# |
| 4 | Java |
| 5 | Go |
| 6 | TypeScript |

### Lister mes projets

```bash
curl http://localhost:5072/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Voir un projet

```bash
curl http://localhost:5072/api/projects/{projectId} \
  -H "Authorization: Bearer $TOKEN"
```

### Modifier un projet

```bash
curl -X PUT http://localhost:5072/api/projects/{projectId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau nom",
    "isPublic": true
  }'
```

### Supprimer un projet

```bash
curl -X DELETE http://localhost:5072/api/projects/{projectId} \
  -H "Authorization: Bearer $TOKEN"
```

### Dupliquer (fork) un projet

```bash
curl -X POST http://localhost:5072/api/projects/{projectId}/fork \
  -H "Authorization: Bearer $TOKEN"
```

### Rechercher des projets publics

```bash
curl "http://localhost:5072/api/projects/public?query=demo&language=1&page=1&pageSize=10"
```

## Fichiers

### Voir l'arborescence

```bash
curl http://localhost:5072/api/projects/{projectId}/files \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse :**
```json
[
  {
    "id": "...",
    "name": "src",
    "path": "/src",
    "isFolder": true,
    "children": [
      {
        "id": "...",
        "name": "index.js",
        "path": "/src/index.js",
        "isFolder": false
      }
    ]
  }
]
```

### Créer un fichier

```bash
curl -X POST http://localhost:5072/api/projects/{projectId}/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "main.js",
    "path": "/src/main.js",
    "content": "console.log(\"Hello World\");",
    "isFolder": false
  }'
```

### Créer un dossier

```bash
curl -X POST http://localhost:5072/api/projects/{projectId}/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "utils",
    "path": "/src/utils",
    "isFolder": true
  }'
```

### Lire un fichier

```bash
curl http://localhost:5072/api/projects/{projectId}/files/{fileId} \
  -H "Authorization: Bearer $TOKEN"
```

### Modifier un fichier

```bash
curl -X PUT http://localhost:5072/api/projects/{projectId}/files/{fileId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "// Nouveau contenu\nconsole.log(\"Updated!\");"
  }'
```

### Supprimer un fichier

```bash
curl -X DELETE http://localhost:5072/api/projects/{projectId}/files/{fileId} \
  -H "Authorization: Bearer $TOKEN"
```

## Collaborations

### Inviter un collaborateur

```bash
curl -X POST http://localhost:5072/api/collaborations/project/{projectId}/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collaborateur@email.com",
    "role": 2
  }'
```

**Rôles disponibles :**
| ID | Rôle | Permissions |
|----|------|-------------|
| 1 | Read | Lecture seule |
| 2 | Write | Lecture + Écriture |
| 3 | Admin | Tout + Gestion collaborateurs |

### Voir mes invitations en attente

```bash
curl http://localhost:5072/api/collaborations/invitations \
  -H "Authorization: Bearer $TOKEN"
```

### Accepter une invitation

```bash
curl -X POST http://localhost:5072/api/collaborations/invitations/{collaborationId}/accept \
  -H "Authorization: Bearer $TOKEN"
```

### Refuser une invitation

```bash
curl -X POST http://localhost:5072/api/collaborations/invitations/{collaborationId}/decline \
  -H "Authorization: Bearer $TOKEN"
```

### Lister les collaborateurs

```bash
curl http://localhost:5072/api/collaborations/project/{projectId} \
  -H "Authorization: Bearer $TOKEN"
```

### Modifier le rôle

```bash
curl -X PUT http://localhost:5072/api/collaborations/project/{projectId}/user/{userId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "role": 3 }'
```

### Retirer un collaborateur

```bash
curl -X DELETE http://localhost:5072/api/collaborations/project/{projectId}/user/{userId} \
  -H "Authorization: Bearer $TOKEN"
```

### Quitter un projet

```bash
curl -X POST http://localhost:5072/api/collaborations/project/{projectId}/leave \
  -H "Authorization: Bearer $TOKEN"
```

## Exécution de code

### Exécuter du code

```bash
curl -X POST http://localhost:5072/api/execution/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "fileId": "...",
    "code": "console.log(\"Hello from CloudCode!\");",
    "language": 1,
    "input": "",
    "timeoutSeconds": 5
  }'
```

**Réponse :**
```json
{
  "id": "...",
  "output": "Hello from CloudCode!\n",
  "errorOutput": "",
  "exitCode": 0,
  "status": 2,
  "executionTimeMs": 45.2,
  "executedAt": "2024-01-01T12:00:00Z"
}
```

**Status possibles :**
| ID | Status |
|----|--------|
| 0 | Pending |
| 1 | Running |
| 2 | Completed |
| 3 | Failed |
| 4 | Timeout |

### Langages supportés

```bash
curl http://localhost:5072/api/execution/languages
```

## Assistant IA

> **Note** : Nécessite une clé API OpenAI dans `appsettings.json`

### Expliquer du code

```bash
curl -X POST http://localhost:5072/api/ai/explain \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const add = (a, b) => a + b;",
    "language": "javascript"
  }'
```

### Corriger une erreur

```bash
curl -X POST http://localhost:5072/api/ai/fix \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(hello)",
    "error": "ReferenceError: hello is not defined",
    "language": "javascript"
  }'
```

### Générer du code

```bash
curl -X POST http://localhost:5072/api/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Une fonction qui trie un tableau par ordre croissant",
    "language": "javascript"
  }'
```

### Documenter du code

```bash
curl -X POST http://localhost:5072/api/ai/document \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function calculate(a, b, op) { ... }",
    "language": "javascript"
  }'
```

### Refactorer du code

```bash
curl -X POST http://localhost:5072/api/ai/refactor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1; var y = 2; var z = x + y;",
    "instructions": "Utiliser const et des noms de variables descriptifs",
    "language": "javascript"
  }'
```

### Optimiser du code

```bash
curl -X POST http://localhost:5072/api/ai/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "for(let i=0; i<arr.length; i++) { sum += arr[i]; }",
    "language": "javascript"
  }'
```

## SignalR (Temps réel)

### Connexion

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5072/hubs/code", {
        accessTokenFactory: () => "votre_jwt_token"
    })
    .withAutomaticReconnect()
    .build();

await connection.start();
```

### Rejoindre un projet

```javascript
await connection.invoke("JoinProject", projectId);
```

### Écouter les événements

```javascript
// Nouveau utilisateur
connection.on("UserJoined", (user) => {
    console.log(`${user.username} a rejoint`);
});

// Modification de code
connection.on("CodeChanged", (data) => {
    console.log(`${data.user.username} a modifié ${data.fileId}`);
    applyChange(data.change);
});

// Mouvement de curseur
connection.on("CursorMoved", (data) => {
    showCursor(data.user, data.position);
});

// Message de chat
connection.on("ChatMessage", (data) => {
    displayMessage(data.user.username, data.message);
});
```

### Envoyer des événements

```javascript
// Modification de code
await connection.invoke("SendCodeChange", projectId, fileId, {
    startLine: 5,
    startColumn: 0,
    endLine: 5,
    endColumn: 10,
    text: "const x = 1;"
});

// Position du curseur
await connection.invoke("SendCursorPosition", projectId, fileId, {
    line: 10,
    column: 5
});

// Message de chat
await connection.invoke("SendChatMessage", projectId, "Hello team!");
```

## Codes d'erreur

| Code | HTTP | Description |
|------|------|-------------|
| `USER_NOT_FOUND` | 404 | Utilisateur introuvable |
| `PROJECT_NOT_FOUND` | 404 | Projet introuvable |
| `FILE_NOT_FOUND` | 404 | Fichier introuvable |
| `INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `TOKEN_EXPIRED` | 401 | Token JWT expiré |
| `NOT_AUTHORIZED` | 403 | Accès refusé |
| `EMAIL_EXISTS` | 409 | Email déjà utilisé |
| `USERNAME_EXISTS` | 409 | Nom d'utilisateur déjà pris |
| `VALIDATION_ERROR` | 400 | Données invalides |

## Compte de test

Pour tester rapidement :

| Champ | Valeur |
|-------|--------|
| Email | `test@example.com` |
| Password | `Test12345` |
| Username | `testuser` |

```bash
curl -X POST http://localhost:5072/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test12345"}'
```

## Bonnes pratiques

1. **Stocker les tokens de manière sécurisée** (httpOnly cookies ou secure storage)
2. **Rafraîchir le token avant expiration** (vérifier `expiresAt`)
3. **Gérer les erreurs 401** (rediriger vers login)
4. **Utiliser HTTPS en production**
5. **Ne jamais logger les tokens**

## Support

- **Issues** : https://github.com/loicKonan123/CloudCode/issues
- **Documentation** : Dossier `/docs`
