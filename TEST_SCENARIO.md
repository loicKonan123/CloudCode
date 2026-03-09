# CloudCode — Scénario de test complet

> Prérequis : API sur `http://localhost:5072` · Frontend sur `http://localhost:3000`
> Ouvre **2 navigateurs** (ou 1 normal + 1 privé) pour tester le VS Mode.

---

## 1. ACCUEIL

**URL :** `http://localhost:3000`

- [ ] La page charge avec l'animation 3D (cube qui tourne)
- [ ] La grille bleue est visible en arrière-plan
- [ ] Le logo CloudCode tourne en continu dans la nav
- [ ] Le bouton **"Start Coding"** est visible
- [ ] La section stats affiche des chiffres (challenges, users)
- [ ] Le leaderboard preview en bas affiche des entrées
- [ ] Cliquer **"Start Coding"** → redirige vers `/login`

---

## 2. INSCRIPTION

**URL :** `http://localhost:3000/register`

- [ ] Background animé (orbes qui bougent) + grille visible
- [ ] Remplir le formulaire :
  - Email : `testuser@cloudcode.dev`
  - Username : `testuser2`
  - Password : `Test2026`
- [ ] Cliquer **"Create Account"**
- [ ] → Redirigé vers `/challenges` automatiquement

---

## 3. CONNEXION

**URL :** `http://localhost:3000/login`

- [ ] Se connecter avec :
  - Email : `devalinloic@gmail.com`
  - Password : `Admin@2026!`
- [ ] → Redirigé vers `/challenges`
- [ ] Le nom d'utilisateur **devalinloic** apparaît dans la nav

---

## 4. LISTE DES CHALLENGES

**URL :** `http://localhost:3000/challenges`

- [ ] La liste de challenges s'affiche (Two Sum, FizzBuzz, etc.)
- [ ] Filtrer par **Easy** → seulement les challenges faciles
- [ ] Filtrer par **Python** → seulement les challenges Python
- [ ] Chercher **"sum"** dans la barre de recherche → résultats filtrés
- [ ] Les challenges résolus ont une icône ✅ verte
- [ ] Cliquer sur un challenge → ouvre la page du challenge
- [ ] Le lien **"VS Mode"** dans la nav est présent

---

## 5. CHALLENGE — TESTER ET SOUMETTRE

**URL :** `http://localhost:3000/challenges/two-sum`

- [ ] La description markdown s'affiche correctement
- [ ] L'éditeur Monaco est présent avec le code de départ
- [ ] Les exemples de test cases sont visibles

### 5a. Tester (Run)
- [ ] Écrire cette solution Python dans l'éditeur :
```python
def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
```
- [ ] Cliquer **"Run Tests"**
- [ ] Les résultats apparaissent : tests passés en vert, échoués en rouge
- [ ] Le score s'affiche (ex : 100%)

### 5b. Soumettre
- [ ] Cliquer **"Submit"**
- [ ] Résultat affiché : ✅ Passed / score / temps d'exécution
- [ ] L'historique des soumissions apparaît en bas

---

## 6. LEADERBOARD

**URL :** `http://localhost:3000/leaderboard`

- [ ] Le classement s'affiche avec rang, username, score
- [ ] Filtres : **All Time / This Month / This Week** fonctionnent
- [ ] Ton compte apparaît si tu as soumis des solutions

---

## 7. COURSES

**URL :** `http://localhost:3000/courses`

- [ ] Liste des cours (Python Fundamentals, JavaScript Basics)
- [ ] Cliquer sur un cours → liste des challenges du cours
- [ ] Les challenges du cours sont dans l'ordre
- [ ] Cliquer sur un challenge dans le cours → ouvre le challenge

---

## 8. VS MODE — LOBBY

### Navigateur 1 (devalinloic)
**URL :** `http://localhost:3000/vs`

- [ ] Ta carte de rang affiche : **Bronze · 1000 ELO · 0W 0L 0D**
- [ ] Le leaderboard VS est vide (aucun match joué)
- [ ] Sélectionner la langue : **Python**

### Navigateur 2 (testuser2)
- [ ] Ouvrir une fenêtre privée → `http://localhost:3000/login`
- [ ] Connexion : `testuser@cloudcode.dev` / `Test2026`
- [ ] Aller sur `http://localhost:3000/vs`
- [ ] Carte de rang : **Bronze · 1000 ELO**

---

## 9. VS MODE — MATCH

### Démarrer le match
- [ ] **Navigateur 1** : cliquer **"Find Opponent"**
  - Le timer de queue commence (00:00, 00:01, ...)
  - Le bouton **"Cancel"** apparaît
- [ ] **Navigateur 2** : cliquer **"Find Opponent"**
  - Les deux navigateurs sont **redirigés automatiquement** vers `/vs/{matchId}`

### Salle de combat
- [ ] Les deux joueurs voient la même page
- [ ] La barre du haut affiche : `devalinloic` ⚔️ `testuser2`
- [ ] Le timer partagé tourne (00:00, 00:01...)
- [ ] L'éditeur Monaco est prêt avec le code de départ
- [ ] La description du challenge est visible à gauche

### Anti-cheat
- [ ] Changer d'onglet → une bannière jaune apparaît : **"Focus violation detected (1)"**
- [ ] Revenir sur l'onglet → la bannière reste visible

### Soumettre une solution
- [ ] **Navigateur 1** : coller la solution Two Sum :
```python
def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
```
- [ ] Cliquer **"Submit Solution"**
- [ ] **Navigateur 2** voit apparaître : _"Opponent is submitting..."_
- [ ] Si correct → **Navigateur 1** voit : ✅ All Tests Passed
- [ ] **Les deux navigateurs** affichent l'écran de fin :
  - Navigateur 1 : 🏆 **"You Win!"** + ELO gagné (ex: +16)
  - Navigateur 2 : 💀 **"Defeat"** + ELO perdu (ex: -16)

### Résultat
- [ ] Cliquer **"Play Again"** → retour au lobby
- [ ] Le leaderboard VS s'est mis à jour avec les nouveaux ELO
- [ ] La carte de rang montre : **1W 0L · 1016 ELO**

---

## 10. ADMIN — GESTION DES CHALLENGES

> Se connecter en tant qu'admin : `devalinloic@gmail.com` / `Admin@2026!`

**URL :** `http://localhost:3000/admin/challenges`

- [ ] La liste de tous les challenges (publiés et non publiés)
- [ ] Cliquer **"New Challenge"** → formulaire de création
- [ ] Créer un challenge de test :
  - Title : `Test Challenge`
  - Difficulty : Easy
  - Language : Python
  - Description : `Return the sum of two numbers.`
  - Starter code : `def solution(a, b):\n    pass`
  - Test case : Input `1 2` / Output `3`
- [ ] Sauvegarder → le challenge apparaît dans la liste
- [ ] Cliquer **Publish** → le challenge devient visible dans `/challenges`
- [ ] Cliquer **Edit** → modifier et sauvegarder
- [ ] Cliquer **Delete** → confirmation et suppression

---

## 11. ADMIN — GESTION DES UTILISATEURS

**URL :** `http://localhost:3000/admin/users`

- [ ] Liste de tous les utilisateurs avec email, username, rôle
- [ ] Bouton **"Toggle Admin"** pour promouvoir/rétrograder un user

---

## 12. DÉCONNEXION

- [ ] Cliquer **"Logout"** dans la nav
- [ ] → Redirigé vers `/login`
- [ ] Essayer d'accéder à `/challenges` sans être connecté → redirigé vers `/login`

---

## Résumé des fonctionnalités à valider

| Feature | Statut |
|---|---|
| Page d'accueil animée (3D + grille) | ⬜ |
| Inscription / Connexion / Déconnexion | ⬜ |
| Liste des challenges avec filtres | ⬜ |
| Éditeur de code + Run Tests | ⬜ |
| Soumission + scoring | ⬜ |
| Leaderboard avec périodes | ⬜ |
| Courses (liste + détail) | ⬜ |
| VS Mode — matchmaking en temps réel | ⬜ |
| VS Mode — bataille avec éditeur | ⬜ |
| VS Mode — anti-cheat (tab detection) | ⬜ |
| VS Mode — ELO + leaderboard VS | ⬜ |
| VS Mode — forfeit | ⬜ |
| Admin — CRUD challenges | ⬜ |
| Admin — gestion users | ⬜ |
