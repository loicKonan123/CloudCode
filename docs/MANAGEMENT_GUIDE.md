# CloudCode — Guide de Gestion & Administration

> Guide pratique pour gérer l'application **après déploiement** : ajouter du contenu, gérer les utilisateurs, surveiller l'app, faire des backups, et évoluer vers la génération IA de quiz.
> Mise à jour : mars 2026

---

## Table des Matières

1. [Ajouter des Challenges](#1-ajouter-des-challenges)
2. [Ajouter des Questions Quiz](#2-ajouter-des-questions-quiz)
3. [Gérer les Utilisateurs](#3-gérer-les-utilisateurs)
4. [Sauvegardes de la Base de Données](#4-sauvegardes-de-la-base-de-données)
5. [Mettre à Jour l'Application](#5-mettre-à-jour-lapplication)
6. [Variables d'Environnement Production](#6-variables-denvironnement-production)
7. [Monitoring & Logs](#7-monitoring--logs)
8. [Plan IA — Génération de Quiz](#8-plan-ia--génération-de-quiz)

---

## 1. Ajouter des Challenges

### Via l'interface Admin (recommandé)

1. Se connecter avec un compte **admin**
2. Aller sur `/admin/challenges`
3. Cliquer **+ New Challenge**
4. Remplir :
   - **Title** : nom du challenge (ex: "Two Sum")
   - **Slug** : identifiant URL (ex: `two-sum`) — généré auto mais vérifier qu'il est unique
   - **Description** : markdown supporté — expliquer le problème, les contraintes, les exemples
   - **Difficulty** : Easy / Medium / Hard
   - **Language** : Python / JavaScript / Both
   - **Starter Code Python** : squelette de la fonction que l'user doit compléter
   - **Starter Code JS** : idem pour JavaScript
   - **Tags** : catégories (Arrays, Strings, DP, etc.)
   - **Test Cases** : au moins 3 visibles + 5 cachés (isHidden=true)
5. Cliquer **Publish** pour le rendre visible

### Format du Starter Code (IMPORTANT)

Le platform utilise le **mode fonction** — l'user écrit uniquement la fonction, pas le programme complet.

**Python :**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass
```

**JavaScript :**
```javascript
function twoSum(nums, target) {
    // Your code here
}
```

Le JudgeService ajoute automatiquement le TestRunner qui appelle la fonction avec les inputs des test cases.

### Format des Test Cases

| Champ | Description | Exemple |
|---|---|---|
| `input` | Arguments de la fonction, séparés par newline | `[2,7,11,15]\n9` |
| `expectedOutput` | Sortie attendue (toString du résultat) | `[0,1]` |
| `isHidden` | `false` = visible dans l'UI, `true` = caché (soumission) | `true` |
| `description` | Label optionnel affiché | `"Basic example"` |
| `orderIndex` | Ordre d'affichage | `0`, `1`, `2`... |

**Règle :** les inputs correspondent aux **paramètres dans l'ordre** de la fonction. Pour `two_sum(nums, target)` : ligne 1 = `nums`, ligne 2 = `target`.

### Via le Seeder (pour du contenu en masse)

Fichier : `src/CloudCode.Infrastructure/Data/ChallengeSeeder.cs`

Chaque challenge suit ce pattern :
```csharp
new Challenge {
    Title = "Two Sum",
    Slug = "two-sum",
    Description = "...",
    Difficulty = ChallengeDifficulty.Easy,
    SupportedLanguages = ChallengeLanguage.Both,
    StarterCodePython = "def two_sum(nums, target):\n    pass",
    StarterCodeJavaScript = "function twoSum(nums, target) {\n}",
    Tags = "[\"Arrays\",\"Hash Map\"]",
    IsPublished = true,
    IsFunction = true,
    Hints = "[\"Try using a hash map\",\"Think about complements\"]",
    TestCases = new List<TestCase> {
        new() { Input = "[2,7,11,15]\n9", ExpectedOutput = "[0,1]", IsHidden = false, OrderIndex = 0 },
        new() { Input = "[3,2,4]\n6",     ExpectedOutput = "[1,2]", IsHidden = true,  OrderIndex = 1 },
    }
}
```

Après modification du seeder, redémarrer l'API — le seeder utilise l'**upsert par slug** (met à jour si existe, insère sinon).

### Vérifier qu'un Challenge Fonctionne

Avant de publier, tester manuellement :
1. Aller sur `/challenges/{slug}`
2. Écrire une solution correcte, cliquer **Run** → tous les tests visibles doivent passer
3. Cliquer **Submit** → score 100 attendu
4. Écrire une solution incorrecte → vérifier que ça fail correctement

---

## 2. Ajouter des Questions Quiz

### Via le Seeder (méthode actuelle)

Fichier : `src/CloudCode.Infrastructure/Data/QuizSeeder.cs`

Le seeder s'exécute au démarrage **seulement si la table est vide**. Pour ajouter de nouvelles questions après le premier déploiement, utiliser l'approche Admin (voir ci-dessous) ou ajouter une logique d'upsert.

**Format d'une question :**
```csharp
new QuizQuestion {
    Category = QuizCategory.Python,     // Python/JavaScript/Algorithms/DataStructures/GeneralCS
    Difficulty = QuizDifficulty.Medium, // Easy/Medium/Hard
    Text = "Que retourne list(range(3)) ?",
    OptionA = "[0, 1, 2]",
    OptionB = "[1, 2, 3]",
    OptionC = "[0, 1, 2, 3]",
    OptionD = "range(0, 3)",
    CorrectOption = 0,    // 0=A, 1=B, 2=C, 3=D
    Explanation = "range(3) génère 0,1,2. list() le convertit en [0,1,2].",
    IsPublished = true
}
```

**Règles de qualité :**
- `Text` : question claire, sans ambiguïté
- Les 4 options doivent être **plausibles** (pas de distracteurs évidents)
- `Explanation` : expliquer **pourquoi** c'est la bonne réponse
- Équilibrer les catégories : viser 10+ questions par catégorie pour avoir de la variété
- Viser 10+ questions par niveau (Easy/Medium/Hard) si possible

### Via une Interface Admin (à implémenter)

Pour gérer les questions sans redéployer, ajouter un endpoint admin :

**Endpoint à créer :**
```
POST   /api/admin/quiz/questions        → créer
GET    /api/admin/quiz/questions        → lister toutes
PUT    /api/admin/quiz/questions/{id}   → modifier
DELETE /api/admin/quiz/questions/{id}   → supprimer
POST   /api/admin/quiz/questions/{id}/publish  → publier/dépublier
```

**Page admin à créer :** `/admin/quiz` — formulaire simple avec les 4 options, catégorie, difficulté, explication.

### Volumes de Questions Recommandés

| Catégorie | Objectif minimum | Objectif idéal |
|---|---|---|
| Python | 18 (6/difficulté) | 30+ |
| JavaScript | 18 | 30+ |
| Algorithms | 18 | 30+ |
| Data Structures | 18 | 30+ |
| General CS | 18 | 30+ |
| **Total** | **90** | **150+** |

Actuellement : **30 questions** (6 par catégorie, mix de difficultés). Sessions de 6 questions max par catégorie.

---

## 3. Gérer les Utilisateurs

### Via l'interface Admin

URL : `/admin` → onglet **Users**

Actions disponibles :
- **Promouvoir Admin** : donne accès à `/admin`, création de challenges, etc.
- **Supprimer l'utilisateur** : supprime compte + toutes les données associées (cascade)

### Promouvoir le Premier Admin

Au premier lancement, il faut promouvoir manuellement le premier admin via SQLite :

```bash
# Installer sqlite3 si nécessaire
sqlite3 src/CloudCode.API/CloudCode.db

-- Trouver l'userId
SELECT Id, Email, Username, IsAdmin FROM Users;

-- Promouvoir
UPDATE Users SET IsAdmin = 1 WHERE Email = 'ton@email.com';

.quit
```

Ou via l'API en modifiant temporairement un endpoint pour se donner admin.

### Réinitialiser un Mot de Passe Manuellement

```sql
-- En production, forcer un reset via email est préférable
-- En urgence (SQLite) :
UPDATE Users SET PasswordHash = NULL WHERE Email = 'user@email.com';
-- L'user devra utiliser "Forgot Password"
```

---

## 4. Sauvegardes de la Base de Données

### Backup Manuel

La base de données est un **fichier SQLite unique** :
```
src/CloudCode.API/CloudCode.db
```

Copier ce fichier = backup complet.

```bash
# Backup avec timestamp
cp src/CloudCode.API/CloudCode.db backups/CloudCode_$(date +%Y%m%d_%H%M%S).db
```

### Backup Automatique (cron)

```bash
# Ajouter dans crontab -e
# Backup quotidien à 3h du matin
0 3 * * * cp /app/CloudCode.db /backups/CloudCode_$(date +\%Y\%m\%d).db

# Garder seulement les 30 derniers backups
0 4 * * * find /backups -name "CloudCode_*.db" -mtime +30 -delete
```

### Restauration

```bash
# Arrêter l'app d'abord
systemctl stop cloudcode  # ou docker stop cloudcode-api

# Restaurer
cp backups/CloudCode_20260314.db src/CloudCode.API/CloudCode.db

# Relancer
systemctl start cloudcode
```

### Migration vers PostgreSQL (recommandé pour la prod)

SQLite est bien pour démarrer mais PostgreSQL est recommandé en production pour :
- Concurrence (SQLite a des locks en écriture)
- Backup natif (`pg_dump`)
- Meilleure scalabilité

```bash
# Dans src/CloudCode.Infrastructure/DependencyInjection.cs
# Remplacer :
options.UseSqlite(connection)
# Par :
options.UseNpgsql(connection)  # NuGet : Npgsql.EntityFrameworkCore.PostgreSQL
```

---

## 5. Mettre à Jour l'Application

### Avec Docker (recommandé)

```bash
# Sur le serveur
cd /app/cloudcode

# Pull les nouvelles images
git pull origin main

# Rebuild et restart
docker compose down
docker compose up -d --build

# Vérifier les logs
docker compose logs -f api
```

### Sans Docker (serveur direct)

```bash
# Backend
cd /app/cloudcode
git pull origin main
cd src/CloudCode.API
dotnet publish -c Release -o publish/
systemctl restart cloudcode-api

# Frontend
cd /app/cloudcode/frontend
git pull origin main
npm install
npm run build
systemctl restart cloudcode-frontend  # ou pm2 restart cloudcode-frontend
```

### Après une Migration EF Core

Si une nouvelle migration a été ajoutée :
```bash
# Option 1 : auto-migration au démarrage (déjà configuré dans Program.cs si applicable)
# Option 2 : appliquer manuellement
cd src/CloudCode.Infrastructure
dotnet ef database update --startup-project ../CloudCode.API
```

### Rollback en Urgence

```bash
# Revenir au commit précédent
git log --oneline -5
git checkout <commit-hash>
docker compose up -d --build
```

---

## 6. Variables d'Environnement Production

Fichier : `src/CloudCode.API/appsettings.Production.json` (ou variables d'env Docker)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=/data/CloudCode.db"
  },
  "Jwt": {
    "Key": "CHANGER_CLE_SECRETE_256_BITS_MINIMUM",
    "Issuer": "https://api.cloudcode.io",
    "Audience": "https://cloudcode.io",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 30
  },
  "Cors": {
    "AllowedOrigins": ["https://cloudcode.io", "https://www.cloudcode.io"]
  },
  "Resend": {
    "ApiKey": "re_xxxx",
    "FromEmail": "noreply@cloudcode.io"
  },
  "Firebase": {
    "ServiceAccountJson": "{ ... }"
  }
}
```

**Variables critiques à NE PAS oublier :**

| Variable | Description | Obligatoire |
|---|---|---|
| `Jwt:Key` | Clé secrète ≥ 32 caractères aléatoires | ✅ |
| `ConnectionStrings:DefaultConnection` | Chemin vers la DB | ✅ |
| `Cors:AllowedOrigins` | Domaines frontend autorisés | ✅ |
| `Resend:ApiKey` | Pour les emails (reset password) | ✅ |
| `Firebase:ServiceAccountJson` | Pour Google Sign-In | ❌ (optionnel) |

**Côté frontend** — fichier `.env.production` :
```env
NEXT_PUBLIC_API_URL=https://api.cloudcode.io
```

---

## 7. Monitoring & Logs

### Health Check

L'API expose un endpoint de santé :
```
GET https://api.cloudcode.io/health
```
Réponse : `200 OK` + `Healthy`

Configurer une surveillance externe (ex: UptimeRobot gratuit) pour alerter si l'app est down.

### Logs Docker

```bash
# Voir les logs en temps réel
docker compose logs -f api
docker compose logs -f frontend

# Dernières 100 lignes
docker compose logs --tail=100 api

# Filtrer les erreurs
docker compose logs api 2>&1 | grep -i "error\|exception\|fail"
```

### Logs Systemd (sans Docker)

```bash
journalctl -u cloudcode-api -f          # temps réel
journalctl -u cloudcode-api --since "1 hour ago"
journalctl -u cloudcode-api -p err      # erreurs seulement
```

### Métriques Clés à Surveiller

| Métrique | Outil | Seuil d'alerte |
|---|---|---|
| Uptime | UptimeRobot | < 99% |
| CPU | htop / docker stats | > 80% |
| RAM | htop / docker stats | > 85% |
| Espace disque | df -h | > 80% |
| Taille DB | ls -lh CloudCode.db | > 1 GB → migrer PostgreSQL |

---

## 8. Plan IA — Génération de Quiz

### Vision

Intégrer **Claude (Anthropic API)** ou **OpenAI** pour générer automatiquement des questions de quiz, réduire le travail manuel, et avoir un contenu infini.

### Architecture Proposée

```
Admin → "Générer 10 questions Python Medium"
           ↓
    POST /api/admin/quiz/generate
           ↓
    AIQuizGeneratorService
    (appel Claude API avec prompt structuré)
           ↓
    Questions générées (JSON)
           ↓
    Page de review admin : approuver / modifier / rejeter
           ↓
    Publier en base (IsPublished = true)
```

### Implémentation Backend

**1. Package NuGet :**
```bash
dotnet add package Anthropic.SDK
# ou
dotnet add package OpenAI
```

**2. Service à créer — `IAIQuizGeneratorService.cs` :**
```csharp
public interface IAIQuizGeneratorService
{
    Task<List<QuizQuestion>> GenerateQuestionsAsync(
        QuizCategory category,
        QuizDifficulty difficulty,
        int count = 10
    );
}
```

**3. Prompt type pour Claude :**
```
Tu es un expert en {category}. Génère {count} questions QCM en français
sur {category} de niveau {difficulty}.

Format JSON strict :
[{
  "text": "Question ?",
  "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...",
  "correctOption": 0,  // 0=A, 1=B, 2=C, 3=D
  "explanation": "Explication courte."
}]

Contraintes :
- Questions précises et non ambiguës
- Les 4 options doivent être plausibles
- Explication de maximum 2 phrases
- Pas de doublons avec les questions existantes
```

**4. Endpoint admin :**
```
POST /api/admin/quiz/generate
Body: { category: 1, difficulty: 2, count: 10 }
Response: { questions: [...] }  // pour review avant insertion
```

**5. Workflow Review :**
```
POST /api/admin/quiz/generate  → questions en attente (IsPublished=false)
GET  /api/admin/quiz/pending   → liste à reviewer
PUT  /api/admin/quiz/{id}      → modifier si besoin
POST /api/admin/quiz/{id}/publish → approuver
DELETE /api/admin/quiz/{id}    → rejeter
```

### Page Admin pour la Review

```
/admin/quiz/generate
├── Formulaire : Catégorie, Difficulté, Nombre (1-20)
├── Bouton "Générer avec l'IA"
├── Loader pendant l'appel API
└── Grille de questions générées
    ├── Chaque question : texte + 4 options + correction + explication
    ├── Bouton ✅ Approuver
    ├── Bouton ✏️ Modifier
    └── Bouton ❌ Rejeter
```

### Coût Estimé (Claude API)

| Modèle | Coût / 1M tokens | Questions générées / dollar |
|---|---|---|
| Claude Haiku 4.5 | ~$0.80 input / $4 output | ~500 questions |
| Claude Sonnet 4.6 | ~$3 input / $15 output | ~200 questions |

Pour un batch de 10 questions → environ **$0.01-0.05** selon le modèle. Très abordable.

### Variables d'Env à Ajouter

```json
{
  "AI": {
    "Provider": "anthropic",
    "ApiKey": "sk-ant-api03-...",
    "Model": "claude-haiku-4-5-20251001"
  }
}
```

### Qualité & Modération

- Toujours passer par la **review humaine** avant publication
- Logger toutes les questions générées pour audit
- Filtrer les questions avec des mots-clés problématiques
- Versionner les questions (savoir lesquelles ont été générées par IA)
- Ajouter un champ `Source` : `"manual"` | `"ai-generated"` sur `QuizQuestion`

---

## Résumé Opérationnel

| Tâche | Fréquence | Qui | Comment |
|---|---|---|---|
| Backup DB | Quotidien | Cron | Copie fichier .db |
| Ajouter challenges | Au besoin | Admin | Interface `/admin/challenges` |
| Ajouter questions quiz | Au besoin | Admin | Seeder ou interface `/admin/quiz` (à créer) |
| Vérifier uptime | Continu | UptimeRobot | Alert email/SMS |
| Review logs | Hebdo | Toi | `docker logs` ou journalctl |
| Update app | À chaque release | Toi | `git pull` + `docker compose up --build` |
| Générer quiz IA | Au besoin | Admin | POST `/admin/quiz/generate` + review |

---

*CloudCode — Guide de Gestion v1.0 — Mars 2026*
