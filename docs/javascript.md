# Structure des Cours JavaScript

Cette structure de cours JavaScript est conçue pour être progressive, allant du niveau débutant à avancé, en s'inspirant des concepts fondamentaux et avancés du langage. L'objectif est de fournir une compréhension approfondie des mécanismes internes de JavaScript et des meilleures pratiques pour écrire du code idiomatique, performant et moderne.

## Niveau 1 : Débutant

Ce niveau couvre les bases essentielles de la programmation en JavaScript, permettant aux apprenants de comprendre les concepts fondamentaux et de commencer à écrire des scripts simples et fonctionnels.

### Chapitre 1 : Introduction à JavaScript et aux Fondamentaux
*   **Cours 1.1 : Premiers pas avec JavaScript**
    *   Qu'est-ce que JavaScript ? Histoire et évolution (ES5 → ES2024).
    *   JavaScript dans le navigateur vs Node.js.
    *   La console du navigateur et `console.log()`.
    *   Exécution d'un premier script dans une page HTML.
*   **Cours 1.2 : Variables et Types de Données**
    *   `var`, `let` et `const` — différences et bonnes pratiques.
    *   Types primitifs : `number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint`.
    *   Typage dynamique et coercition de types.
    *   L'opérateur `typeof`.
*   **Cours 1.3 : Opérateurs et Expressions**
    *   Opérateurs arithmétiques (`+`, `-`, `*`, `/`, `%`, `**`).
    *   Opérateurs de comparaison (`==`, `===`, `!=`, `!==`, `<`, `>`, `<=`, `>=`).
    *   Opérateurs logiques (`&&`, `||`, `!`, `??`).
    *   L'égalité stricte (`===`) vs l'égalité lâche (`==`) et les pièges.
*   **Cours 1.4 : Chaînes de Caractères**
    *   Méthodes de `String` : `.length`, `.toUpperCase()`, `.toLowerCase()`, `.trim()`, `.split()`, `.includes()`, `.startsWith()`, `.endsWith()`, `.replace()`, `.slice()`, `.indexOf()`, `.padStart()`, `.padEnd()`, `.repeat()`.
    *   Template literals (backticks) et expressions interpolées.
    *   Multiline strings.
*   **Cours 1.5 : Structures Conditionnelles**
    *   `if`, `else if`, `else`.
    *   L'opérateur ternaire `condition ? a : b`.
    *   `switch / case`.
    *   Valeurs truthy et falsy en JavaScript.
*   **Cours 1.6 : Boucles et Itération**
    *   `for`, `while`, `do...while`.
    *   `for...of` pour itérer sur des valeurs.
    *   `for...in` pour itérer sur les propriétés d'un objet.
    *   `break` et `continue`.

### Chapitre 2 : Structures de Données Essentielles
*   **Cours 2.1 : Les Tableaux (Arrays)**
    *   Création et accès aux éléments.
    *   Méthodes de mutation : `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.reverse()`, `.sort()`, `.fill()`, `.copyWithin()`.
    *   Méthodes fonctionnelles (retournent un nouveau tableau) : `.map()`, `.filter()`, `.reduce()`, `.flat()`, `.flatMap()`, `.slice()`, `.concat()`.
    *   Méthodes de recherche : `.find()`, `.findIndex()`, `.indexOf()`, `.lastIndexOf()`, `.includes()`, `.some()`, `.every()`.
    *   Autres : `.join()`, `.forEach()`, `.entries()`, `.keys()`, `.values()`, `Array.from()`, `Array.isArray()`, `Array.of()`.
    *   Spread operator `[...arr]` et déstructuration `const [a, b] = arr`.
*   **Cours 2.2 : Les Objets (Objects)**
    *   Création de littéraux d'objets `{}`.
    *   Accès aux propriétés : notation point et notation crochet.
    *   Ajout, modification et suppression de propriétés (`delete`).
    *   Méthodes d'`Object` : `Object.keys()`, `Object.values()`, `Object.entries()`, `Object.assign()`, `Object.freeze()`, `Object.seal()`, `Object.create()`, `Object.fromEntries()`, `Object.hasOwn()`.
    *   Spread operator `{...obj}` et déstructuration `const { a, b } = obj`.
    *   Propriétés calculées et shorthand properties.
    *   L'opérateur `in` et `hasOwnProperty()`.
*   **Cours 2.3 : Map et Set**
    *   `Map` : création, `.set()`, `.get()`, `.has()`, `.delete()`, `.clear()`, `.size`, `.keys()`, `.values()`, `.entries()`, `forEach()`.
    *   `Set` : création, `.add()`, `.has()`, `.delete()`, `.clear()`, `.size`, `forEach()`.
    *   `WeakMap` et `WeakSet` — cas d'usage et mémoire.
    *   Quand utiliser `Map` vs objet ordinaire, `Set` vs tableau.
*   **Cours 2.4 : Déstructuration et Spread/Rest**
    *   Déstructuration de tableaux avec valeurs par défaut et renommage.
    *   Déstructuration d'objets imbriqués.
    *   Rest parameters `...rest` dans la déstructuration.
    *   Spread `...` pour copier et fusionner.
    *   `Object.assign()` vs spread — différences.

### Chapitre 3 : Fonctions et Portée
*   **Cours 3.1 : Fonctions Fondamentales**
    *   Déclarations de fonctions (`function`) vs expressions de fonctions.
    *   Fonctions fléchées (`=>`) — syntaxes et différences avec `function`.
    *   Paramètres par défaut.
    *   Rest parameters (`...args`) et l'objet `arguments`.
    *   Valeurs de retour implicites (arrow functions).
*   **Cours 3.2 : Portée et Closures**
    *   Portée globale, de fonction et de bloc (`let`/`const` vs `var`).
    *   Le hoisting — fonctions et variables.
    *   Closures : définition, exemples pratiques et pièges.
    *   Le pattern IIFE (Immediately Invoked Function Expression).
*   **Cours 3.3 : Le mot-clé `this`**
    *   `this` dans le contexte global, d'une méthode, d'une fonction ordinaire.
    *   `this` dans les fonctions fléchées (lexical `this`).
    *   `.call()`, `.apply()`, `.bind()` — forcer la valeur de `this`.
*   **Cours 3.4 : Modules ES**
    *   `import` et `export` (named et default).
    *   Re-export, import dynamique `import()`.
    *   CommonJS (`require` / `module.exports`) pour Node.js.
    *   Différences entre modules ES et CommonJS.

### Chapitre 4 : Le DOM et les Événements
*   **Cours 4.1 : Sélection et Manipulation du DOM**
    *   `document.querySelector()`, `document.querySelectorAll()`, `getElementById()`, `getElementsByClassName()`.
    *   Lecture et modification de contenu : `.textContent`, `.innerHTML`, `.value`.
    *   Modification de styles : `.style`, `.classList` (`.add()`, `.remove()`, `.toggle()`, `.contains()`).
    *   Modification d'attributs : `.getAttribute()`, `.setAttribute()`, `.removeAttribute()`, `.dataset`.
    *   Création et insertion de nœuds : `createElement()`, `appendChild()`, `insertBefore()`, `remove()`, `replaceWith()`, `innerHTML`.
*   **Cours 4.2 : Événements**
    *   `addEventListener()` et `removeEventListener()`.
    *   Événements courants : `click`, `input`, `change`, `submit`, `keydown`, `keyup`, `mouseover`, `load`, `DOMContentLoaded`.
    *   L'objet `event` : `event.target`, `event.preventDefault()`, `event.stopPropagation()`.
    *   Bubbling, capturing et délégation d'événements.
*   **Cours 4.3 : Formulaires et Validation**
    *   Lecture des valeurs d'un formulaire.
    *   Validation native HTML5 et validation JS.
    *   `FormData`.

### Chapitre 5 : Gestion des Erreurs
*   **Cours 5.1 : Types d'Erreurs**
    *   `SyntaxError`, `TypeError`, `ReferenceError`, `RangeError`, etc.
    *   Lire une stack trace.
*   **Cours 5.2 : `try / catch / finally`**
    *   Intercepter et gérer les erreurs.
    *   Relancer une erreur avec `throw`.
    *   Le bloc `finally`.
*   **Cours 5.3 : Erreurs Personnalisées**
    *   Créer une classe d'erreur personnalisée (`class MyError extends Error`).
    *   Bonne pratique : toujours utiliser `instanceof` pour discriminer les erreurs.

### Projets Pratiques - Niveau Débutant
*   **Projet 1.1 : Quiz Interactif** (DOM + events + conditions)
*   **Projet 1.2 : Todo List** (CRUD sur un tableau, manipulation DOM)
*   **Projet 1.3 : Calculatrice** (opérateurs, fonctions, events)

---

## Niveau 2 : Intermédiaire

Ce niveau approfondit les concepts de JavaScript, en se concentrant sur l'asynchronisme, la programmation orientée objet, les patterns fonctionnels et les APIs modernes du navigateur.

### Chapitre 6 : JavaScript Asynchrone
*   **Cours 6.1 : Le Modèle d'Exécution**
    *   Le thread unique, la call stack, le heap.
    *   La boucle d'événements (event loop) : call stack, task queue, microtask queue.
    *   Pourquoi les opérations I/O sont non-bloquantes.
*   **Cours 6.2 : Callbacks**
    *   Pattern callback et callback hell.
    *   `setTimeout()` et `setInterval()` / `clearTimeout()` / `clearInterval()`.
*   **Cours 6.3 : Promises**
    *   Création d'une Promise (`new Promise((resolve, reject) => ...)`).
    *   `.then()`, `.catch()`, `.finally()`.
    *   Chaînage de promises.
    *   `Promise.all()`, `Promise.allSettled()`, `Promise.race()`, `Promise.any()`, `Promise.resolve()`, `Promise.reject()`.
*   **Cours 6.4 : `async` / `await`**
    *   Fonctions `async` et l'opérateur `await`.
    *   Gestion des erreurs avec `try/catch` en asynchrone.
    *   Exécution parallèle avec `await Promise.all()`.
    *   Top-level `await` (modules ES).
*   **Cours 6.5 : Fetch API et HTTP**
    *   `fetch()` — requêtes GET, POST, PUT, DELETE.
    *   L'objet `Response` : `.json()`, `.text()`, `.status`, `.ok`.
    *   Headers, options et gestion des erreurs réseau.
    *   Introduction à Axios comme alternative.

### Chapitre 7 : Programmation Orientée Objet
*   **Cours 7.1 : Prototypes**
    *   La chaîne de prototypes (`[[Prototype]]`).
    *   `Object.getPrototypeOf()`, `Object.setPrototypeOf()`.
    *   Héritage prototypal vs héritage classique.
*   **Cours 7.2 : Classes ES6**
    *   `class`, `constructor`, méthodes d'instance et méthodes statiques.
    *   Héritage avec `extends` et `super`.
    *   Champs privés `#field` et méthodes privées.
    *   Getters `get` et setters `set`.
*   **Cours 7.3 : Patterns Orientés Objet**
    *   Factory functions vs classes.
    *   Mixins et composition.
    *   Le pattern Singleton, Factory, Observer.

### Chapitre 8 : Programmation Fonctionnelle
*   **Cours 8.1 : Fonctions d'Ordre Supérieur**
    *   `.map()`, `.filter()`, `.reduce()` en profondeur.
    *   Composition de fonctions.
    *   Fonctions pures et effets de bord.
*   **Cours 8.2 : Immutabilité**
    *   Pourquoi l'immutabilité facilite le raisonnement.
    *   Patterns pour mettre à jour des objets et tableaux immutablement.
    *   `Object.freeze()` et structuredClone().
*   **Cours 8.3 : Currying et Partial Application**
    *   Définition et implémentation manuelle.
    *   Utilisation pratique pour la configuration de fonctions.
*   **Cours 8.4 : Itérateurs et Générateurs**
    *   Le protocole d'itération : `Symbol.iterator`.
    *   Fonctions génératrices (`function*`) et `yield`.
    *   Générateurs asynchrones (`async function*`) et `for await...of`.

### Chapitre 9 : Gestion du State et du Stockage
*   **Cours 9.1 : Web Storage**
    *   `localStorage` et `sessionStorage` — `.setItem()`, `.getItem()`, `.removeItem()`, `.clear()`.
    *   Sérialisation JSON avec `JSON.stringify()` et `JSON.parse()`.
    *   Cookies et `document.cookie`.
*   **Cours 9.2 : IndexedDB et Cache API**
    *   Introduction à IndexedDB pour les données structurées.
    *   Cache API et Service Workers pour le mode offline.
*   **Cours 9.3 : Gestion du State**
    *   Pattern Flux / Redux (state centralisé, actions, reducers).
    *   Observer pattern pour réagir aux changements.
    *   Introduction à Proxy et Reflect pour la réactivité.

### Chapitre 10 : APIs Navigateur et Performances
*   **Cours 10.1 : APIs Modernes du Navigateur**
    *   `IntersectionObserver`, `MutationObserver`, `ResizeObserver`.
    *   Web Workers pour le calcul en arrière-plan.
    *   Geolocation API, Notifications API, Clipboard API.
*   **Cours 10.2 : Performances Web**
    *   Repaint, reflow et optimisation du DOM.
    *   `requestAnimationFrame()` pour les animations.
    *   Debounce et throttle — implémentation et cas d'usage.
    *   Lazy loading et code splitting.
*   **Cours 10.3 : Expressions Régulières**
    *   Syntaxe de base : `.test()`, `.match()`, `.replace()`, `.split()`.
    *   Groupes capturants, lookahead, lookbehind.
    *   Flags : `g`, `i`, `m`, `s`, `u`.

### Projets Pratiques - Niveau Intermédiaire
*   **Projet 2.1 : Application Météo** (Fetch API + async/await + DOM)
*   **Projet 2.2 : Gestionnaire de Notes** (LocalStorage + CRUD + classes)
*   **Projet 2.3 : Jeu de Mémoire** (Closures + animations + événements)

---

## Niveau 3 : Avancé

Ce niveau explore les aspects les plus sophistiqués de JavaScript, incluant TypeScript, Node.js, les patterns d'architecture, et les outils modernes.

### Chapitre 11 : TypeScript — JavaScript avec Types
*   **Cours 11.1 : Introduction à TypeScript**
    *   Installation, configuration `tsconfig.json`, compilation `tsc`.
    *   Types de base : `number`, `string`, `boolean`, `null`, `undefined`, `any`, `unknown`, `never`, `void`.
    *   Type inference et annotation explicite.
*   **Cours 11.2 : Types Avancés**
    *   Interfaces et types (`interface` vs `type`).
    *   Union (`|`) et intersection (`&`).
    *   Generics `<T>`.
    *   Utility types : `Partial<T>`, `Required<T>`, `Readonly<T>`, `Pick<T>`, `Omit<T>`, `Record<K,V>`, `ReturnType<F>`.
*   **Cours 11.3 : TypeScript et POO**
    *   Modificateurs d'accès `public`, `private`, `protected`, `readonly`.
    *   Classes abstraites et interfaces implémentées.
    *   Decorators (expérimental).

### Chapitre 12 : Node.js et Développement Serveur
*   **Cours 12.1 : Node.js Fondamentaux**
    *   L'architecture de Node.js : event loop, libuv, V8.
    *   Modules natifs : `fs`, `path`, `os`, `events`, `stream`, `crypto`.
    *   `process` : arguments (`process.argv`), variables d'environnement (`process.env`), `process.exit()`.
*   **Cours 12.2 : npm et Gestion des Dépendances**
    *   `package.json`, `package-lock.json`.
    *   Scripts npm et npx.
    *   Dépendances de développement vs production.
    *   Introduction à `pnpm` et `bun` comme alternatives.
*   **Cours 12.3 : Création d'une API REST avec Express / Fastify**
    *   Routing, middlewares, gestion des erreurs.
    *   Validation des entrées (zod, joi).
    *   Authentification JWT.
    *   Tests d'API avec Vitest/Jest + Supertest.

### Chapitre 13 : Outils et Bundlers Modernes
*   **Cours 13.1 : Linters et Formatters**
    *   ESLint — configuration, règles, plugins.
    *   Prettier — formatage automatique.
    *   Intégration dans VS Code et hooks pre-commit.
*   **Cours 13.2 : Bundlers**
    *   Introduction à Vite, Webpack et esbuild.
    *   Tree-shaking, code splitting, minification.
    *   Variables d'environnement et modes dev/prod.
*   **Cours 13.3 : Tests Automatisés**
    *   Vitest / Jest — tests unitaires.
    *   Testing Library pour les composants UI.
    *   Playwright / Cypress pour les tests end-to-end.
    *   Coverage et bonnes pratiques.

### Chapitre 14 : Patterns d'Architecture et Design Patterns
*   **Cours 14.1 : Design Patterns JavaScript**
    *   Module Pattern, Revealing Module.
    *   Observer / PubSub, Strategy, Command, Decorator.
    *   Proxy pour la validation et la réactivité.
*   **Cours 14.2 : Architecture Front-End**
    *   Composants, props, état local vs état global.
    *   Gestion du state avec des patterns scalables.
    *   Micro-frontends — introduction.
*   **Cours 14.3 : Sécurité JavaScript**
    *   XSS — prévention, sanitisation du DOM.
    *   CSRF, Content Security Policy.
    *   Dépendances vulnérables et `npm audit`.

### Chapitre 15 : JavaScript et Intelligence Artificielle
*   **Cours 15.1 : Intégration d'APIs d'IA**
    *   Appel à des APIs LLM (OpenAI, Anthropic) depuis JS/Node.
    *   Streaming de réponses avec `ReadableStream`.
    *   Gestion des coûts, rate limits et erreurs.
*   **Cours 15.2 : IA dans le Navigateur**
    *   TensorFlow.js et ONNX Runtime Web.
    *   Web Speech API, Vision et Canvas.
*   **Cours 15.3 : Outils d'Assistance au Code**
    *   GitHub Copilot, Cursor, Codeium.
    *   Bonnes pratiques et limites de l'IA dans le développement.

### Projets Pratiques - Niveau Avancé
*   **Projet 3.1 : SPA sans Framework** (Routing client-side + state management custom)
*   **Projet 3.2 : API REST complète** (Node.js + TypeScript + auth JWT + tests)
*   **Projet 3.3 : Application en Temps Réel** (WebSockets + événements + state)
