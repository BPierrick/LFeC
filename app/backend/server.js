import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";

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

/** @type {{ status: "idle" | "started", startedAt: string | null }} */
let game = { status: "idle", startedAt: null };

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

// État courant de la partie (interrogé en polling par la page /equipes)
app.get("/api/game/status", (req, res) => {
  res.json({ game, songsCount: songs.length });
});

// Lance la partie : réservé à l'admin (pas d'auth pour l'instant, cf. README)
app.post("/api/game/start", (req, res) => {
  if (songs.length === 0) {
    return res.status(400).json({ error: "Ajoute au moins une chanson avant de lancer la partie." });
  }

  game = { status: "started", startedAt: new Date().toISOString() };
  res.json({ game });
});

// Remet la partie à zéro (pratique en développement)
app.post("/api/game/reset", (req, res) => {
  game = { status: "idle", startedAt: null };
  res.json({ game });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
});
