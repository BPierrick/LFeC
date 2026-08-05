import { Router } from "express";
import { randomUUID } from "node:crypto";
import { store } from "../store/memoryStore";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// La liste complète des chansons est publique (les joueurs n'en ont pas besoin
// mais l'admin la gère). Les mutations sont réservées à l'admin.
router.get("/songs", (_req, res) => {
  res.json({ songs: store.songs });
});

router.post("/songs", adminAuth, (req, res) => {
  const title = (req.body?.title ?? "").trim();
  const artist = (req.body?.artist ?? "").trim();

  if (!title || !artist) {
    res.status(400).json({ error: "Titre et artiste sont requis." });
    return;
  }

  const song = { id: randomUUID(), title, artist };
  store.songs.push(song);
  res.status(201).json({ song });
});

router.delete("/songs/:id", adminAuth, (req, res) => {
  const index = store.songs.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Chanson introuvable." });
    return;
  }
  store.songs.splice(index, 1);
  res.status(204).end();
});

export default router;
