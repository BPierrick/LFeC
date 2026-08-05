import { Router } from "express";
import { randomUUID } from "node:crypto";
import { store } from "../store/memoryStore";

const router = Router();

router.post("/team", (req, res) => {
  const name = (req.body?.name ?? "").trim();

  if (!name) {
    res.status(400).json({ error: "Le nom d'équipe est requis." });
    return;
  }
  if (name.length > 40) {
    res.status(400).json({ error: "Le nom d'équipe est trop long (40 caractères max)." });
    return;
  }

  const existing = store.teams.find((t) => t.id === req.session.teamId);
  if (existing) {
    existing.name = name;
    res.json({ team: existing });
    return;
  }

  const team = { id: randomUUID(), name, createdAt: new Date().toISOString() };
  store.teams.push(team);
  req.session.teamId = team.id;
  res.json({ team });
});

router.get("/team", (req, res) => {
  const team = store.teams.find((t) => t.id === req.session.teamId) || null;
  res.json({ team });
});

router.get("/teams", (_req, res) => {
  const sorted = [...store.teams].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ teams: sorted });
});

export default router;
