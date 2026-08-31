import { Router } from "express";
import { randomUUID } from "node:crypto";
import { store } from "../store/memoryStore";
import { adminAuth } from "../middleware/adminAuth";
import { Song } from "@shared/types";

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

router.post("/songs/import", adminAuth, (req, res) => {

  if (!Array.isArray(req.body?.songs) || req.body?.songs.length === 0) {
    res.status(400).json({ error: "Le corps de la requête doit contenir un tableau de chansons {title, artist} non vide." });
    return;
  }

  const skippedSongs: any[] = []
  const songs = req.body.songs.filter(
    (s: any) => {
      const isSongValid = typeof s?.title === "string" && typeof s?.artist === "string"
      if (!isSongValid) skippedSongs.push(s);
      return isSongValid
    }
  ).map((s: Song) => {
    const title = s.title.trim();
    const artist = s.artist.trim();
    return { id: randomUUID(), title, artist };
  });

  if (songs.length === 0) {
    res.status(400).json({ error: "Aucune chanson valide à importer." });
    return;
  }

  store.songs.push(...songs);


  res.status(201).json({
    "imported": songs.length,
    "skipped": skippedSongs.length,
    "skippedDetails": skippedSongs.map((s: any) => ({
      "title": s.title || "",
      "artist": s.artist || "",
    })),
    "songs": songs
  });
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
