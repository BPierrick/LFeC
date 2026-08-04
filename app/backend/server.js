import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { isFuzzyMatch } from "./fuzzyMatch.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Log temporaire de debug : à retirer une fois le problème résolu
app.use((req, res, next) => {
  console.log(`[debug] ${req.method} ${req.url}`);
  next();
});

// --- Stockage en mémoire (à remplacer par une vraie base de données en prod) ---
/** @type {{ id: string, name: string, createdAt: string }[]} */
const teams = [];

/** @type {{ id: string, title: string, artist: string }[]} */
const songs = [];

const ROUND_DURATION_MS = 60_000;

/**
 * État de la partie.
 * @type {{
 *   status: "idle" | "started" | "finished",
 *   currentSongIndex: number,
 *   roundStartedAt: string | null,
 *   roundStatus: "playing" | "ended",
 *   roundScored: boolean,
 * }}
 */
let game = {
  status: "idle",
  currentSongIndex: 0,
  roundStartedAt: null,
  roundStatus: "playing",
  roundScored: false,
};

/**
 * Résultats du round courant par équipe.
 * @type {Record<string, { foundTitleAt: string | null, foundArtistAt: string | null }>}
 */
let roundResults = {};

/**
 * Scores cumulés par équipe (teamId -> nombre de points).
 * @type {Record<string, number>}
 */
let scores = {};

/**
 * Breakdown du dernier round finalisé (pour affichage).
 * @type {{ teamId: string, name: string, foundTitle: boolean, foundArtist: boolean, roundPoints: number, totalPoints: number }[]}
 */
let lastRoundBreakdown = [];

// Si le round courant a dépassé la durée, on le termine côté serveur.
function applyAutoRoundEnd() {
  if (
    game.status === "started" &&
    game.roundStatus === "playing" &&
    game.roundStartedAt &&
    Date.now() - new Date(game.roundStartedAt).getTime() >= ROUND_DURATION_MS
  ) {
    game.roundStatus = "ended";
  }
  finalizeRoundScores();
}

// Calcule et attribue les points du round courant une seule fois,
// quand le round vient de se terminer.
function finalizeRoundScores() {
  if (game.status !== "started" || game.roundStatus !== "ended" || game.roundScored) {
    return;
  }

  game.roundScored = true;

  /** @type {{ teamId: string, name: string, category: "both" | "one" | "none", completionTime: number }[]} */
  const ranked = teams.map((team) => {
    const r = roundResults[team.id] || { foundTitleAt: null, foundArtistAt: null };
    const foundTitle = !!r.foundTitleAt;
    const foundArtist = !!r.foundArtistAt;

    let category = "none";
    let completionTime = Infinity;

    if (foundTitle && foundArtist) {
      category = "both";
      completionTime = Math.max(
        new Date(r.foundTitleAt).getTime(),
        new Date(r.foundArtistAt).getTime()
      );
    } else if (foundTitle || foundArtist) {
      category = "one";
      completionTime = new Date(
        foundTitle ? r.foundTitleAt : r.foundArtistAt
      ).getTime();
    }

    return { teamId: team.id, name: team.name, category, completionTime, foundTitle, foundArtist };
  });

  // Attribue les points : both = 7/6/5, one = 3/2/1, none = 0, triés par temps.
  const bothRanked = ranked.filter((e) => e.category === "both").sort((a, b) => a.completionTime - b.completionTime);
  const oneRanked = ranked.filter((e) => e.category === "one").sort((a, b) => a.completionTime - b.completionTime);

  const bothPoints = [7, 6, 5];
  const onePoints = [3, 2, 1];

  const pointsByTeamId = {};

  bothRanked.forEach((entry, index) => {
    pointsByTeamId[entry.teamId] = bothPoints[Math.min(index, bothPoints.length - 1)];
  });

  oneRanked.forEach((entry, index) => {
    pointsByTeamId[entry.teamId] = onePoints[Math.min(index, onePoints.length - 1)];
  });

  // Construit le breakdown et cumule les scores
  lastRoundBreakdown = ranked.map((entry) => {
    const roundPoints = pointsByTeamId[entry.teamId] || 0;
    const prevTotal = scores[entry.teamId] || 0;
    const totalPoints = prevTotal + roundPoints;
    scores[entry.teamId] = totalPoints;

    return {
      teamId: entry.teamId,
      name: entry.name,
      foundTitle: entry.foundTitle,
      foundArtist: entry.foundArtist,
      roundPoints,
      totalPoints,
    };
  });

  // Tri par total décroissant
  lastRoundBreakdown.sort((a, b) => b.totalPoints - a.totalPoints);
}

// Construit le scoreboard complet pour l'API.
function buildScoreboard(teamId) {
  return teams.map((team) => {
    const r = roundResults[team.id] || { foundTitleAt: null, foundArtistAt: null };
    const foundTitle = !!r.foundTitleAt;
    const foundArtist = !!r.foundArtistAt;

    const breakdownEntry = lastRoundBreakdown.find((e) => e.teamId === team.id);
    const roundPoints = breakdownEntry ? breakdownEntry.roundPoints : 0;

    return {
      teamId: team.id,
      name: team.name,
      foundTitle,
      foundArtist,
      roundPoints,
      totalPoints: scores[team.id] || 0,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}

function getMyRoundResult(teamId) {
  if (!teamId) return null;
  const r = roundResults[teamId];
  if (!r) return null;
  return { foundTitle: !!r.foundTitleAt, foundArtist: !!r.foundArtistAt };
}

// Renvoie la chanson du round courant, en masquant le titre/artiste
// tant que le round n'est pas terminé (anti-triche côté joueur).
function currentSongForClient() {
  const song = songs[game.currentSongIndex];
  if (!song) return null;
  if (game.roundStatus === "ended") {
    return { ...song, revealed: true };
  }
  return { id: song.id, revealed: false };
}

// Middlewares
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // nécessaire pour que le cookie de session passe
  })
);
app.use(express.json());

app.use(
  session({
    name: "flute.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // passer à true derrière HTTPS en production
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    },
  })
);

// Route de test santé
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend opérationnel 🚀" });
});

// --- Équipes ---

// Enregistre ou met à jour le nom d'équipe de la session courante
app.post("/api/team", (req, res) => {
  const name = (req.body?.name ?? "").trim();

  if (!name) {
    return res.status(400).json({ error: "Le nom d'équipe est requis." });
  }
  if (name.length > 40) {
    return res.status(400).json({ error: "Le nom d'équipe est trop long (40 caractères max)." });
  }

  let team = teams.find((t) => t.id === req.session.teamId);

  if (team) {
    // La session avait déjà une équipe : on met juste à jour le nom
    team.name = name;
  } else {
    team = { id: randomUUID(), name, createdAt: new Date().toISOString() };
    teams.push(team);
    req.session.teamId = team.id;
  }

  res.json({ team });
});

// Renvoie l'équipe associée à la session courante (ou null)
app.get("/api/team", (req, res) => {
  const team = teams.find((t) => t.id === req.session.teamId) || null;
  res.json({ team });
});

// Renvoie la liste de toutes les équipes enregistrées
app.get("/api/teams", (req, res) => {
  const sorted = [...teams].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ teams: sorted });
});

// --- Chansons (configurées par l'admin) ---

app.get("/api/songs", (req, res) => {
  res.json({ songs });
});

app.post("/api/songs", (req, res) => {
  const title = (req.body?.title ?? "").trim();
  const artist = (req.body?.artist ?? "").trim();

  if (!title || !artist) {
    return res.status(400).json({ error: "Titre et artiste sont requis." });
  }

  const song = { id: randomUUID(), title, artist };
  songs.push(song);
  res.status(201).json({ song });
});

app.delete("/api/songs/:id", (req, res) => {
  const index = songs.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Chanson introuvable." });
  }
  songs.splice(index, 1);
  res.status(204).end();
});

// --- Partie / Blind test ---

// État courant de la partie (interrogé en polling par /equipes, /jeu et /admin)
app.get("/api/game/status", (req, res) => {
  applyAutoRoundEnd();

  const base = {
    game,
    songsCount: songs.length,
    currentSong: currentSongForClient(),
    roundDurationMs: ROUND_DURATION_MS,
  };

  if (game.status === "idle") {
    res.json(base);
    return;
  }

  res.json({
    ...base,
    scoreboard: buildScoreboard(),
    myRoundResult: getMyRoundResult(req.session.teamId),
  });
});

// Chanson du round courant (titre/artiste masqués tant que le round
// n'est pas terminé, pour empêcher la triche via l'onglet Network).
app.get("/api/game/current-song", (req, res) => {
  applyAutoRoundEnd();
  const song = currentSongForClient();
  if (!song) {
    return res.status(404).json({ error: "Aucune chanson n'est configurée." });
  }
  res.json({ song });
});

// Lance la partie : réservé à l'admin (pas d'auth pour l'instant, cf. README)
app.post("/api/game/start", (req, res) => {
  if (songs.length === 0) {
    return res.status(400).json({ error: "Ajoute au moins une chanson avant de lancer la partie." });
  }

  game = {
    status: "started",
    currentSongIndex: 0,
    roundStartedAt: new Date().toISOString(),
    roundStatus: "playing",
    roundScored: false,
  };
  roundResults = {};
  scores = {};
  lastRoundBreakdown = [];
  res.json({ game });
});

// Termine le round courant (révèle la réponse). Idempotent.
app.post("/api/game/round/end", (req, res) => {
  if (game.status !== "started") {
    return res.status(400).json({ error: "Aucune partie en cours." });
  }
  game.roundStatus = "ended";
  finalizeRoundScores();
  res.json({ game });
});

// Passe au round suivant, ou termine la partie si c'était la dernière chanson.
app.post("/api/game/round/next", (req, res) => {
  if (game.status !== "started") {
    return res.status(400).json({ error: "Aucune partie en cours." });
  }

  if (game.currentSongIndex + 1 < songs.length) {
    game.currentSongIndex += 1;
    game.roundStartedAt = new Date().toISOString();
    game.roundStatus = "playing";
    game.roundScored = false;
    roundResults = {};
    lastRoundBreakdown = [];
  } else {
    game.status = "finished";
    game.roundStatus = "ended";
  }

  res.json({ game });
});

// Arrêt manuel de la partie (fin anticipée).
app.post("/api/game/stop", (req, res) => {
  if (game.status !== "started") {
    return res.status(400).json({ error: "Aucune partie en cours." });
  }
  game.status = "finished";
  game.roundStatus = "ended";
  finalizeRoundScores();
  res.json({ game });
});

// Valide un guess pour la chanson du round courant (anti-triche : la
// réponse n'est jamais renvoyée, seulement ce qui a été reconnu).
app.post("/api/game/round/guess", (req, res) => {
  applyAutoRoundEnd();

  if (game.status !== "started") {
    return res.status(400).json({ error: "Aucune partie en cours." });
  }
  if (game.roundStatus === "ended") {
    return res.status(400).json({ error: "Le round est terminé." });
  }

  const teamId = req.session.teamId;
  if (!teamId) {
    return res.status(403).json({ error: "Aucune équipe associée à cette session." });
  }

  const song = songs[game.currentSongIndex];
  if (!song) {
    return res.status(404).json({ error: "Aucune chanson à deviner." });
  }

  const guess = (req.body?.guess ?? "").toString();
  const now = new Date().toISOString();

  // Initialise le résultat du round pour cette équipe si nécessaire
  if (!roundResults[teamId]) {
    roundResults[teamId] = { foundTitleAt: null, foundArtistAt: null };
  }
  const result = roundResults[teamId];

  // N'enregistre que la première trouvaille (timestamp)
  if (!result.foundTitleAt && isFuzzyMatch(guess, song.title)) {
    result.foundTitleAt = now;
  }
  if (!result.foundArtistAt && isFuzzyMatch(guess, song.artist)) {
    result.foundArtistAt = now;
  }

  res.json({
    foundTitle: !!result.foundTitleAt,
    foundArtist: !!result.foundArtistAt,
  });
});

// Remet la partie à zéro (pratique en développement / pour reconfigurer)
app.post("/api/game/reset", (req, res) => {
  game = {
    status: "idle",
    currentSongIndex: 0,
    roundStartedAt: null,
    roundStatus: "playing",
    roundScored: false,
  };
  roundResults = {};
  scores = {};
  lastRoundBreakdown = [];
  res.json({ game });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
});
