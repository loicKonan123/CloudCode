# CloudCode — Coding Challenge Platform
## Plan de développement

---

## Vision

Plateforme de coding challenges (style LeetCode / HackerRank) centrée sur **Python** et **JavaScript**.
Les utilisateurs résolvent des problèmes algorithmiques dans un éditeur en ligne, leur code est testé
automatiquement contre des cas de test, et un classement global mesure leur progression.

---

## Choix standards retenus

| Question | Décision |
|---|---|
| Qui crée les challenges ? | **Admin seulement** (panel d'administration dédié) |
| Test cases cachés ? | **Oui** — exemples visibles + cas cachés pour éviter le hardcoding |
| Score / classement ? | **Oui** — score par challenge (basé sur tests passés) + leaderboard global |
| Mode playground ? | **Non** pour l'instant — focus sur les challenges |
| Langages de base | **Python + JavaScript** (extensible facilement) |

---

## Architecture des données

### Entités à créer (Backend)

```
Challenge
├── Id (Guid)
├── Title (string)
├── Slug (string, unique — pour l'URL)
├── Description (string, Markdown)
├── Difficulty (Easy | Medium | Hard)
├── SupportedLanguages (Python | JavaScript | Both)
├── StarterCodePython (string)
├── StarterCodeJavaScript (string)
├── Tags (string[])
├── IsPublished (bool)
├── CreatedAt, UpdatedAt
└── TestCases[]

TestCase
├── Id (Guid)
├── ChallengeId (Guid)
├── Input (string — stdin)
├── ExpectedOutput (string — stdout attendu)
├── IsHidden (bool — caché pour l'utilisateur)
├── OrderIndex (int)
└── Description (string, optionnel — ex: "Cas vide", "Grand tableau")

UserSubmission
├── Id (Guid)
├── UserId (Guid)
├── ChallengeId (Guid)
├── Language (Python | JavaScript)
├── Code (string)
├── Status (Pending | Running | Passed | Failed | Error | Timeout)
├── PassedTests (int)
├── TotalTests (int)
├── Score (int — 0-100)
├── ExecutionTimeMs (double)
├── ErrorOutput (string?)
└── SubmittedAt (DateTime)

UserProgress
├── UserId (Guid)
├── ChallengeId (Guid)
├── IsSolved (bool)
├── BestScore (int)
├── AttemptCount (int)
└── LastAttemptAt (DateTime)
```

---

## Pages Frontend

### 1. `/challenges` — Liste des challenges
- Grille de challenges avec filtre par difficulté (Easy / Medium / Hard)
- Filtre par langue (Python / JS / Les deux)
- Badge "Résolu ✓" si l'utilisateur a déjà passé ce challenge
- Indicateur de taux de réussite global (% d'utilisateurs ayant résolu)

### 2. `/challenges/[slug]` — Page du challenge (IDE)
**Layout :**
```
┌─────────────────────┬──────────────────────────────┐
│   Description       │   Éditeur Monaco              │
│   (Markdown)        │   (Python ou JS)              │
│                     │                               │
│   Exemples visibles │                               │
│   Input / Output    │                               │
│                     ├──────────────────────────────┤
│   Onglets :         │   Résultats des tests         │
│   - Description     │   ✓ Test 1 : Passé (12ms)     │
│   - Soumissions     │   ✗ Test 3 : Échoué           │
│     précédentes     │     Attendu: 5 / Obtenu: 4    │
└─────────────────────┴──────────────────────────────┘
```

**Actions :**
- Sélecteur de langage (Python / JS)
- Bouton **Tester** → exécute uniquement les cas **visibles** (feedback rapide)
- Bouton **Soumettre** → exécute tous les cas (visibles + cachés), enregistre le score
- Raccourci : Ctrl+Enter = Tester, Ctrl+Shift+Enter = Soumettre

### 3. `/leaderboard` — Classement global
- Classement par score total (somme des meilleurs scores)
- Filtre par période (tout le temps / ce mois / cette semaine)
- Position de l'utilisateur connecté mise en évidence

### 4. `/admin/challenges` — Panel admin
- Liste des challenges (publiés / brouillons)
- Créer / modifier / supprimer un challenge
- Éditeur de test cases (input / output attendu / visible ou caché)
- Prévisualisation du Markdown
- Bouton "Tester le challenge" pour vérifier que les test cases passent

### 5. `/profile/[username]` — Profil utilisateur
- Nombre de challenges résolus
- Graphique de progression
- Historique des soumissions récentes

---

## API Backend à créer

### Challenges (public)
```
GET    /api/challenges                    → Liste paginée + filtres
GET    /api/challenges/{slug}             → Détail + test cases visibles
POST   /api/challenges/{slug}/test        → Tester (cas visibles seulement)
POST   /api/challenges/{slug}/submit      → Soumettre (tous les cas)
GET    /api/challenges/{slug}/submissions → Mes soumissions pour ce challenge
```

### Leaderboard
```
GET    /api/leaderboard?period=all|month|week
```

### Admin
```
GET    /api/admin/challenges              → Tous les challenges (brouillons inclus)
POST   /api/admin/challenges              → Créer un challenge
PUT    /api/admin/challenges/{id}         → Modifier
DELETE /api/admin/challenges/{id}         → Supprimer
POST   /api/admin/challenges/{id}/publish → Publier / dépublier
```

### Profil
```
GET    /api/profile/{username}            → Stats publiques
GET    /api/profile/me                    → Mon profil complet
```

---

## Moteur d'exécution (Judge)

### Fonctionnement
1. Réception du code + langage + challengeId
2. Pour chaque test case (visible ou tous selon l'action) :
   - Écrire le code dans un fichier temp
   - Passer `testCase.Input` en stdin
   - Exécuter avec timeout (5s par test case)
   - Comparer stdout avec `testCase.ExpectedOutput` (trim + normalize whitespace)
3. Calculer le score : `(passedTests / totalTests) * 100`
4. Sauvegarder la soumission

### Règles de comparaison (standard)
- Trim des espaces en début/fin de ligne
- Ignorer les retours à la ligne en fin de fichier
- Comparaison exacte sinon (case-sensitive)

### Timeouts
- 5 secondes par test case
- Maximum 20 test cases par challenge

---

## Système de score

| Résultat | Score |
|---|---|
| Tous les tests passés | 100 pts |
| 80-99% tests passés | 75 pts |
| 50-79% | 50 pts |
| 1-49% | 25 pts |
| 0% | 0 pts |

- Le **meilleur score** de toutes les soumissions est conservé
- Le leaderboard classe par **score total** (somme des meilleurs scores)
- En cas d'égalité : classé par nombre de challenges résolus à 100%

---

## Ce qu'on réutilise de l'existant

| Existant | Statut |
|---|---|
| Auth (login/register/JWT) | ✅ Réutilisé tel quel |
| Monaco Editor | ✅ Réutilisé (sans file tree) |
| Moteur d'exécution Python/JS | ✅ Réutilisé et adapté |
| Base de données SQLite + EF Core | ✅ Réutilisé (nouvelles migrations) |
| Architecture Clean (Domain/App/Infra/API) | ✅ Respectée |

## Ce qu'on supprime / ignore

| Existant | Statut |
|---|---|
| Gestion de projets/fichiers | ❌ Pas utilisé pour les challenges |
| Terminal ConPTY | ❌ Supprimé |
| Git, Preview, Format | ❌ Supprimés |
| Venv / Package Manager | ❌ Supprimés (packages pré-installés globalement) |
| Collaboration temps-réel | ⏳ Plus tard |

---

## Phases de développement

### Phase 1 — Backend Judge + modèle de données
- [ ] Entités : `Challenge`, `TestCase`, `UserSubmission`, `UserProgress`
- [ ] Migration EF Core
- [ ] `ChallengeService` + `JudgeService` (moteur d'exécution + comparaison)
- [ ] Controllers : `ChallengesController`, `AdminController`, `LeaderboardController`
- [ ] Seeder : 5 challenges d'exemple pour tester

### Phase 2 — Frontend Challenge
- [ ] Page `/challenges` — liste avec filtres
- [ ] Page `/challenges/[slug]` — IDE split (description + éditeur + résultats)
- [ ] Sélecteur Python / JS avec starter code automatique
- [ ] Panel résultats des tests (vert/rouge par test case)
- [ ] Boutons Tester / Soumettre

### Phase 3 — Leaderboard + Profil
- [ ] Page `/leaderboard`
- [ ] Page `/profile/[username]`
- [ ] Score total + badge par difficulté

### Phase 4 — Panel Admin
- [ ] Page `/admin/challenges` — liste + CRUD
- [ ] Éditeur de challenge (titre, description markdown, difficulté, test cases)
- [ ] Prévisualisation du rendu
- [ ] Bouton "Vérifier" pour tester les test cases avant publication

### Phase 5 (optionnel) — Améliorations
- [ ] Ajouter TypeScript comme 3ème langage
- [ ] Timer par challenge (mode compétition)
- [ ] Partage de solution après résolution
- [ ] Commentaires / discussion par challenge

---

## Packages Python pré-installés (global sur le serveur)

Pour éviter toute gestion de dépendances, ces packages sont disponibles pour tous les challenges :
- `collections`, `itertools`, `functools`, `math`, `heapq`, `bisect` → stdlib (toujours dispo)
- `numpy` → calcul numérique
- `json`, `re`, `datetime` → stdlib

**Aucun package externe requis pour 99% des algorithmes classiques.**

---

## Exemples de challenges (seeds)

1. **Two Sum** (Easy, Python+JS) — Trouver deux nombres dont la somme = target
2. **FizzBuzz** (Easy, Python+JS) — Classique
3. **Palindrome** (Easy, Python+JS) — Vérifier si une chaîne est un palindrome
4. **Fibonacci** (Easy, Python+JS) — N-ième terme
5. **Anagramme** (Medium, Python+JS) — Vérifier si deux mots sont anagrammes

---

*Dernière mise à jour : Mars 2026*
