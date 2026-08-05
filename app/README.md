# La flûte en chantier

Blind test musical multijoueur pour une soirée entre amis. Un admin configure
la liste des chansons et pilote le déroulé des rounds ; les équipes rejoignent
depuis leur téléphone et devinent le titre et/ou l'artiste.

## Stack

- **Frontend** : React 18 + Vite + TypeScript, react-router-dom
- **Backend** : Express 4 + TypeScript (exécuté via `tsx`), sessions cookie
- **Types partagés** : `app/shared/types.ts` (importé via l'alias `@shared/*`)
- **Tests** : Vitest (backend)

## Structure

```
app/
├── shared/                 # types partagés frontend/backend
│   └── types.ts
├── backend/                # API Express (TypeScript)
│   └── src/
│       ├── routes/         # health, team, song, game, admin
│       ├── services/       # game.service, scoring.service
│       ├── store/          # memoryStore (in-memory, interface Store)
│       ├── middleware/     # adminAuth, errorHandler
│       ├── utils/          # fuzzyMatch
│       └── tests/          # fuzzyMatch, scoring
└── frontend/              # SPA React
    └── src/
        ├── api/           # client + endpoints typés
        ├── hooks/         # useGameStatus, usePolling, useTeam
        ├── context/       # AuthContext
        ├── components/    # ScoreboardTable, ProgressBar, Button...
        └── pages/         # Landing, TeamsList, Admin, Game
```

## Déroulé d'une partie

1. Les équipes s'enregistrent sur `/` puis attendent sur `/equipes`.
2. L'admin se connecte sur `/admin` (mot de passe `ADMIN_PASSWORD`), configure
   les chansons et lance la partie.
3. Les équipes sont redirigées vers `/jeu`. À chaque round, l'admin révèle la
   chanson courante, termine le round (ou attends la fin du minuteur 60s),
   puis passe au suivant. Les chansons sont parcourues **dans l'ordre** de la liste.
4. À la fin de chaque round, la réponse est révélée et un tableau des scores
   s'affiche (titre ✓/✗, artiste ✓/✗, points du round, total).
5. La partie se termine après la dernière chanson (ou arrêt manuel) ; le
   classement final s'affiche.

## Scoring

Par round, les équipes sont classées par ordre de complétion :

- **Titre ET artiste trouvés** : 7 pts (1re), 6 pts (2e), 5 pts (les autres)
- **Titre OU artiste trouvé** : 3 pts (1re), 2 pts (2e), 1 pt (les autres)
- **Rien trouvé** : 0 pt

Le temps de complétion = instant où le 2e champ est trouvé (catégorie "both")
ou l'unique champ trouvé (catégorie "one").

## Authentification admin

L'admin se connecte avec un mot de passe unique (`ADMIN_PASSWORD` dans `.env`).
La session admin (`req.session.isAdmin`) protège les mutations de chansons et
les actions de pilotage de la partie.

## Endpoints API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST/GET | `/api/team` | Enregistre/lit l'équipe de la session |
| GET | `/api/teams` | Liste toutes les équipes |
| GET/POST/DELETE | `/api/songs` | CRUD chansons (mutations admin) |
| GET | `/api/game/status` | État complet de la partie (polling) |
| GET | `/api/game/current-song` | Chanson courante (masquée si round en cours) |
| POST | `/api/game/start` | Lance la partie (admin) |
| POST | `/api/game/round/end` | Termine le round courant (admin) |
| POST | `/api/game/round/next` | Round suivant ou fin de partie (admin) |
| POST | `/api/game/round/guess` | Valide un guess (anti-triche, ne révèle pas) |
| POST | `/api/game/stop` | Arrêt anticipé (admin) |
| POST | `/api/game/reset` | Remet à zéro (admin) |
| POST | `/api/admin/login` `/logout` | Connexion/déconnexion admin |
| GET | `/api/admin/session` | État de session admin |

## Anti-triche

La chanson courante n'est jamais envoyée au client pendant un round :
`/api/game/current-song` et `/api/game/status` masquent le titre/artiste tant
que `roundStatus === "playing"`. La validation des guesses se fait côté serveur
(`POST /api/game/round/guess`), qui ne renvoie que les booléens `foundTitle` /
`foundArtist`.

## Persistance

⚠️ Les données (équipes, chansons, scores) sont stockées **en mémoire** côté
serveur : perdues au redémarrage, non partagées entre instances. Le store est
exposé derrière une interface (`src/store/memoryStore.ts`) pour un futur
remplacement par une base de données.

## Installation

Dans deux terminaux :

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # renseigner SESSION_SECRET et ADMIN_PASSWORD
npm run dev
```

→ démarre sur `http://localhost:5001`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

→ démarre sur `http://localhost:5173` (proxy `/api` → backend:5001)

## Scripts

| | Backend | Frontend |
|---|---|---|
| Dev | `npm run dev` (tsx watch) | `npm run dev` (vite) |
| Build/Typecheck | `npm run build` (tsc --noEmit) | `npm run build` (tsc + vite) |
| Start (prod) | `npm start` (tsx) | servir `dist/` |
| Tests | `npm test` (vitest) | — |

## Limitations connues

- Pas de WebSocket : la synchro se fait par polling (~1s).
- Pas de base de données : tout est en mémoire.
- Pas de lecture audio : les joueurs devinent via un champ texte.
- Auth admin par mot de passe unique (suffisant pour une soirée).
