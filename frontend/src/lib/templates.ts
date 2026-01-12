import { ProgrammingLanguage } from '@/types';

export interface TemplateFile {
  name: string;
  content: string;
  isFolder?: boolean;
  children?: TemplateFile[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: ProgrammingLanguage;
  tags: string[];
  files: TemplateFile[];
}

// ============================================
// TEMPLATES DE PROJET
// ============================================

export const projectTemplates: ProjectTemplate[] = [
  // ===== JAVASCRIPT =====
  {
    id: 'js-empty',
    name: 'JavaScript Vide',
    description: 'Projet JavaScript minimal',
    icon: '📄',
    language: ProgrammingLanguage.JavaScript,
    tags: ['javascript', 'minimal'],
    files: [
      {
        name: 'index.js',
        content: `// Bienvenue dans CloudCode!
// Commencez à coder ici

console.log("Hello, World!");
`,
      },
    ],
  },
  {
    id: 'js-node-api',
    name: 'Node.js API',
    description: 'API REST avec Express.js',
    icon: '🚀',
    language: ProgrammingLanguage.JavaScript,
    tags: ['nodejs', 'express', 'api'],
    files: [
      {
        name: 'package.json',
        content: `{
  "name": "node-api",
  "version": "1.0.0",
  "description": "API REST avec Express",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
`,
      },
      {
        name: 'index.js',
        content: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\\'API!' });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

app.post('/api/users', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: Date.now(), name });
});

// Demarrage du serveur
app.listen(PORT, () => {
  console.log(\`Serveur demarre sur http://localhost:\${PORT}\`);
});
`,
      },
      {
        name: '.env',
        content: `PORT=3000
NODE_ENV=development
`,
      },
      {
        name: 'README.md',
        content: `# Node.js API

## Installation
\`\`\`bash
npm install
\`\`\`

## Demarrage
\`\`\`bash
npm start
\`\`\`

## Endpoints
- GET / - Message de bienvenue
- GET /api/users - Liste des utilisateurs
- POST /api/users - Creer un utilisateur
`,
      },
    ],
  },
  {
    id: 'js-react',
    name: 'React App',
    description: 'Application React basique',
    icon: '⚛️',
    language: ProgrammingLanguage.JavaScript,
    tags: ['react', 'frontend', 'spa'],
    files: [
      {
        name: 'package.json',
        content: `{
  "name": "react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #f0f6fc; }
    .app { max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #58a6ff; margin-bottom: 1rem; }
    .counter { display: flex; align-items: center; gap: 1rem; margin-top: 2rem; }
    button { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 1rem; }
    .btn-primary { background: #238636; color: white; }
    .btn-primary:hover { background: #2ea043; }
    .count { font-size: 2rem; font-weight: bold; color: #58a6ff; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="App.js"></script>
</body>
</html>
`,
      },
      {
        name: 'App.js',
        content: `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="app">
      <h1>Bienvenue sur React!</h1>
      <p>Ceci est une application React basique.</p>

      <div className="counter">
        <button className="btn-primary" onClick={() => setCount(count + 1)}>
          Incrementer
        </button>
        <span className="count">{count}</span>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`,
      },
    ],
  },

  // ===== PYTHON =====
  {
    id: 'py-empty',
    name: 'Python Vide',
    description: 'Projet Python minimal',
    icon: '🐍',
    language: ProgrammingLanguage.Python,
    tags: ['python', 'minimal'],
    files: [
      {
        name: 'main.py',
        content: `# Bienvenue dans CloudCode!
# Commencez a coder ici

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
      },
    ],
  },
  {
    id: 'py-flask-api',
    name: 'Flask API',
    description: 'API REST avec Flask',
    icon: '🌶️',
    language: ProgrammingLanguage.Python,
    tags: ['python', 'flask', 'api'],
    files: [
      {
        name: 'requirements.txt',
        content: `flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
`,
      },
      {
        name: 'app.py',
        content: `from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Base de donnees simple (en memoire)
users = [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob", "email": "bob@example.com"},
]

@app.route('/')
def home():
    return jsonify({"message": "Bienvenue sur l'API Flask!"})

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(users)

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u["id"] == user_id), None)
    if user:
        return jsonify(user)
    return jsonify({"error": "Utilisateur non trouve"}), 404

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    new_user = {
        "id": len(users) + 1,
        "name": data.get("name"),
        "email": data.get("email")
    }
    users.append(new_user)
    return jsonify(new_user), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
`,
      },
      {
        name: '.env',
        content: `PORT=5000
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
`,
      },
      {
        name: 'README.md',
        content: `# Flask API

## Installation
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Demarrage
\`\`\`bash
python app.py
\`\`\`

## Endpoints
- GET / - Message de bienvenue
- GET /api/users - Liste des utilisateurs
- GET /api/users/:id - Obtenir un utilisateur
- POST /api/users - Creer un utilisateur
`,
      },
    ],
  },
  {
    id: 'py-data-science',
    name: 'Data Science',
    description: 'Analyse de donnees avec Pandas',
    icon: '📊',
    language: ProgrammingLanguage.Python,
    tags: ['python', 'pandas', 'data'],
    files: [
      {
        name: 'requirements.txt',
        content: `pandas==2.1.0
numpy==1.25.0
matplotlib==3.8.0
`,
      },
      {
        name: 'analysis.py',
        content: `import pandas as pd
import numpy as np

# Creer un DataFrame exemple
data = {
    'Nom': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'Ville': ['Paris', 'Lyon', 'Marseille', 'Paris', 'Lyon'],
    'Salaire': [45000, 52000, 48000, 55000, 47000]
}

df = pd.DataFrame(data)

print("=== Donnees ===")
print(df)

print("\\n=== Statistiques ===")
print(df.describe())

print("\\n=== Moyenne des salaires par ville ===")
print(df.groupby('Ville')['Salaire'].mean())

print("\\n=== Personnes de plus de 30 ans ===")
print(df[df['Age'] > 30])
`,
      },
      {
        name: 'README.md',
        content: `# Projet Data Science

## Installation
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Execution
\`\`\`bash
python analysis.py
\`\`\`
`,
      },
    ],
  },

  // ===== TYPESCRIPT =====
  {
    id: 'ts-empty',
    name: 'TypeScript Vide',
    description: 'Projet TypeScript minimal',
    icon: '💙',
    language: ProgrammingLanguage.TypeScript,
    tags: ['typescript', 'minimal'],
    files: [
      {
        name: 'index.ts',
        content: `// Bienvenue dans CloudCode!
// Commencez a coder en TypeScript

interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Bonjour \${user.name}, vous avez \${user.age} ans!\`;
}

const user: User = {
  name: "Alice",
  age: 25
};

console.log(greet(user));
`,
      },
      {
        name: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
`,
      },
    ],
  },
  {
    id: 'ts-express-api',
    name: 'Express TypeScript API',
    description: 'API REST avec Express et TypeScript',
    icon: '🔷',
    language: ProgrammingLanguage.TypeScript,
    tags: ['typescript', 'express', 'api'],
    files: [
      {
        name: 'package.json',
        content: `{
  "name": "express-ts-api",
  "version": "1.0.0",
  "scripts": {
    "start": "ts-node index.ts",
    "build": "tsc",
    "dev": "ts-node-dev index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/node": "^20.4.5",
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1"
  }
}
`,
      },
      {
        name: 'index.ts',
        content: `import express, { Request, Response } from 'express';
import cors from 'cors';

interface User {
  id: number;
  name: string;
  email: string;
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de donnees en memoire
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API TypeScript Express' });
});

app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'Utilisateur non trouve' });
  }
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, email } = req.body;
  const newUser: User = {
    id: users.length + 1,
    name,
    email,
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.listen(PORT, () => {
  console.log(\`Serveur demarre sur http://localhost:\${PORT}\`);
});
`,
      },
      {
        name: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
`,
      },
      {
        name: '.env',
        content: `PORT=3000
NODE_ENV=development
`,
      },
    ],
  },

  // ===== HTML/WEB =====
  {
    id: 'html-landing',
    name: 'Landing Page',
    description: 'Page web moderne avec HTML/CSS',
    icon: '🌐',
    language: ProgrammingLanguage.JavaScript,
    tags: ['html', 'css', 'landing'],
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma Landing Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="hero">
    <nav class="nav">
      <div class="logo">MonSite</div>
      <ul class="nav-links">
        <li><a href="#features">Fonctionnalites</a></li>
        <li><a href="#about">A propos</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>

    <div class="hero-content">
      <h1>Bienvenue sur MonSite</h1>
      <p>La meilleure solution pour vos besoins</p>
      <button class="btn-primary">Commencer</button>
    </div>
  </header>

  <section id="features" class="features">
    <h2>Nos Fonctionnalites</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3>Rapide</h3>
        <p>Performance optimale</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Securise</h3>
        <p>Protection des donnees</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💡</div>
        <h3>Simple</h3>
        <p>Facile a utiliser</p>
      </div>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2024 MonSite. Tous droits reserves.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        name: 'style.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Navigation */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  position: absolute;
  width: 100%;
  top: 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.nav-links a:hover {
  opacity: 0.8;
}

/* Hero */
.hero {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-primary {
  padding: 1rem 2rem;
  font-size: 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* Features */
.features {
  padding: 5rem 5%;
  text-align: center;
  background: #f8f9fa;
}

.features h2 {
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
}

/* Footer */
.footer {
  padding: 2rem;
  text-align: center;
  background: #333;
  color: white;
}
`,
      },
      {
        name: 'script.js',
        content: `// Animation au scroll
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll pour les liens de navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Animation des cartes au scroll
  const cards = document.querySelectorAll('.feature-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';
    observer.observe(card);
  });
});

console.log('Site charge avec succes!');
`,
      },
    ],
  },

  // ===== GAMES =====
  {
    id: 'js-game-snake',
    name: 'Jeu Snake',
    description: 'Le classique jeu Snake en JavaScript',
    icon: '🐍',
    language: ProgrammingLanguage.JavaScript,
    tags: ['javascript', 'game', 'canvas'],
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snake Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #1a1a2e;
      font-family: system-ui, sans-serif;
      color: white;
    }
    h1 { margin-bottom: 1rem; color: #00ff88; }
    #score { margin-bottom: 1rem; font-size: 1.2rem; }
    canvas {
      border: 3px solid #00ff88;
      border-radius: 10px;
      background: #0f0f23;
    }
    .controls {
      margin-top: 1rem;
      color: #888;
    }
  </style>
</head>
<body>
  <h1>Snake Game</h1>
  <div id="score">Score: 0</div>
  <canvas id="game" width="400" height="400"></canvas>
  <p class="controls">Utilisez les fleches pour jouer</p>
  <script src="game.js"></script>
</body>
</html>
`,
      },
      {
        name: 'game.js',
        content: `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;

function drawGame() {
  // Clear canvas
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw snake
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#00ff88' : '#00cc6a';
    ctx.fillRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );
  });

  // Move snake
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall collision
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }

  // Self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = 'Score: ' + score;
    placeFood();
  } else {
    snake.pop();
  }
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
  // Ne pas placer sur le serpent
  if (snake.some(s => s.x === food.x && s.y === food.y)) {
    placeFood();
  }
}

function gameOver() {
  clearInterval(gameLoop);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 30px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = 'white';
  ctx.font = '20px system-ui';
  ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('Appuyez sur Espace pour rejouer', canvas.width / 2, canvas.height / 2 + 50);
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  scoreEl.textContent = 'Score: 0';
  placeFood();
  clearInterval(gameLoop);
  gameLoop = setInterval(drawGame, 100);
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
      if (dy !== 1) { dx = 0; dy = -1; }
      break;
    case 'ArrowDown':
      if (dy !== -1) { dx = 0; dy = 1; }
      break;
    case 'ArrowLeft':
      if (dx !== 1) { dx = -1; dy = 0; }
      break;
    case 'ArrowRight':
      if (dx !== -1) { dx = 1; dy = 0; }
      break;
    case ' ':
      resetGame();
      break;
  }
});

// Demarrer le jeu
resetGame();
`,
      },
    ],
  },
];

// Fonction pour obtenir les templates par langage
export function getTemplatesByLanguage(language: ProgrammingLanguage): ProjectTemplate[] {
  return projectTemplates.filter(t => t.language === language);
}

// Fonction pour obtenir un template par ID
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === id);
}

// Templates groupes par categorie
export const templateCategories = [
  {
    name: 'JavaScript',
    language: ProgrammingLanguage.JavaScript,
    templates: projectTemplates.filter(t => t.language === ProgrammingLanguage.JavaScript),
  },
  {
    name: 'Python',
    language: ProgrammingLanguage.Python,
    templates: projectTemplates.filter(t => t.language === ProgrammingLanguage.Python),
  },
  {
    name: 'TypeScript',
    language: ProgrammingLanguage.TypeScript,
    templates: projectTemplates.filter(t => t.language === ProgrammingLanguage.TypeScript),
  },
];
