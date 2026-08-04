# Mon App — React (Vite) + Express

Structure du projet :

```
mon-app/
├── backend/     → API Node.js/Express
└── frontend/    → Application React (Vite)
```

## Pourquoi ce stack ?

- **React + Vite + TypeScript** : démarrage quasi instantané, HMR très rapide, typage statique pour éviter les erreurs courantes.
- **React Router** : gestion du routage front (landing page, page d'équipe...).
- **Node.js + Express** : reste en JavaScript côté serveur (même langage que le front), écosystème énorme, parfait pour une API REST simple à faire évoluer.
- Le frontend est déjà configuré avec un **proxy Vite** vers `/api`, donc pas de souci de CORS en développement.

## Pages actuelles

- `/` — Landing page « La flûte en chantier » : l'utilisateur choisit un nom d'équipe
  (saisie libre ou suggestion). Le nom est envoyé au backend puis l'utilisateur est
  redirigé vers `/equipes`.
- `/equipes` — Liste de toutes les équipes enregistrées, avec la sienne mise en avant.
  Vérifie automatiquement (toutes les 2s) si la partie a été lancée, et redirige
  alors vers `/jeu`.
- `/admin` — Configuration de la liste des chansons (titre/artiste) et lancement
  de la partie.
- `/jeu` — Page de jeu (blind test), pour l'instant un simple placeholder.

## Persistance par session

Chaque visiteur reçoit un **cookie de session** (`flute.sid`) posé par le backend
(`express-session`). Ce cookie permet d'associer une équipe à un utilisateur sans
compte ni mot de passe :

- `POST /api/team` — enregistre (ou met à jour) le nom d'équipe de la session courante.
- `GET /api/team` — renvoie l'équipe de la session courante (ou `null`).
- `GET /api/teams` — renvoie la liste de toutes les équipes enregistrées.
- `GET /api/songs` / `POST /api/songs` / `DELETE /api/songs/:id` — gestion de la
  liste de chansons par l'admin.
- `GET /api/game/status` — état courant de la partie (`idle` ou `started`), interrogé
  en polling par `/equipes`.
- `POST /api/game/start` — lance la partie (refusé si la liste de chansons est vide).
- `POST /api/game/reset` — remet la partie à `idle` (pratique en développement pour
  retester sans redémarrer le serveur).

⚠️ Les équipes et les chansons sont actuellement stockées **en mémoire** côté serveur :
elles sont perdues à chaque redémarrage du backend, et ne sont pas partagées entre
plusieurs instances du serveur. Pour une vraie mise en production, il faudra :
- persister les données dans une base de données (SQLite, PostgreSQL, MongoDB...) ;
- utiliser un store de session persistant (ex. Redis) au lieu du store mémoire par défaut.

⚠️ La page `/admin` n'est **pas protégée par une authentification** pour l'instant :
n'importe qui connaissant l'URL peut y accéder et lancer la partie. À ajouter avant
tout déploiement public (mot de passe simple, ou un vrai système d'auth).

## Aller plus loin : temps réel avec WebSocket

La détection du lancement de partie sur `/equipes` fonctionne par **polling**
(vérification toutes les 2 secondes). C'est simple et suffisant pour un petit groupe,
mais ça ajoute jusqu'à 2s de latence et un peu de trafic réseau inutile. Si besoin
d'un lancement instantané pour tout le monde, on peut migrer vers `socket.io`
(serveur + client) pour pousser l'événement `game:started` en temps réel.

## Installation

Dans deux terminaux séparés :

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

→ démarre sur `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

→ démarre sur `http://localhost:5173`

Ouvre `http://localhost:5173` : la page React appelle `/api/hello` sur le backend
et affiche la réponse — ça confirme que les deux briques communiquent bien.

## Étapes suivantes possibles

- Ajouter une base de données (PostgreSQL, MongoDB…) côté backend.
- Ajouter un routeur front (`react-router-dom`).
- Ajouter TypeScript.
- Dockeriser les deux services.

Dis-moi ce que ton app doit faire concrètement (type de données, authentification,
besoin ou non de base de données...) et je peux adapter l'architecture en conséquence.
