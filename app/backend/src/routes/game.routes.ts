import { Router } from "express";
import { store } from "../store/memoryStore";
import {
  applyAutoRoundEnd,
  buildScoreboard,
  currentSongForClient,
  endRound,
  finalizeRoundScores,
  getMyRoundResult,
  nextRound,
  resetGame,
  ROUND_DURATION_MS,
  startGame,
  stopGame,
} from "../services/game.service";
import { adminAuth } from "../middleware/adminAuth";
import { isFuzzyMatch } from "../utils/fuzzyMatch";

const router = Router();

router.get("/game/status", (req, res) => {
  applyAutoRoundEnd();

  const base = {
    game: store.game,
    songsCount: store.songs.length,
    currentSong: currentSongForClient(),
    roundDurationMs: ROUND_DURATION_MS,
  };

  if (store.game.status === "idle") {
    res.json(base);
    return;
  }

  res.json({
    ...base,
    scoreboard: buildScoreboard(),
    myRoundResult: getMyRoundResult(req.session.teamId),
  });
});

router.get("/game/current-song", (_req, res) => {
  applyAutoRoundEnd();
  const song = currentSongForClient();
  if (!song) {
    res.status(404).json({ error: "Aucune chanson n'est configurée." });
    return;
  }
  res.json({ song });
});

router.post("/game/start", adminAuth, (_req, res) => {
  const result = startGame();
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ game: store.game });
});

router.post("/game/round/end", adminAuth, (_req, res) => {
  const result = endRound();
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ game: store.game });
});

router.post("/game/round/next", adminAuth, (_req, res) => {
  const result = nextRound();
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ game: store.game });
});

router.post("/game/stop", adminAuth, (_req, res) => {
  const result = stopGame();
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ game: store.game });
});

router.post("/game/round/guess", (req, res) => {
  applyAutoRoundEnd();

  if (store.game.status !== "started") {
    res.status(400).json({ error: "Aucune partie en cours." });
    return;
  }
  if (store.game.roundStatus === "ended") {
    res.status(400).json({ error: "Le round est terminé." });
    return;
  }

  const teamId = req.session.teamId;
  if (!teamId) {
    res.status(403).json({ error: "Aucune équipe associée à cette session." });
    return;
  }

  const song = store.songs[store.game.currentSongIndex];
  if (!song) {
    res.status(404).json({ error: "Aucune chanson à deviner." });
    return;
  }

  const guess = (req.body?.guess ?? "").toString();
  const now = new Date().toISOString();

  if (!store.roundResults[teamId]) {
    store.roundResults[teamId] = { foundTitleAt: null, foundArtistAt: null };
  }
  const result = store.roundResults[teamId];

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

router.post("/game/reset", adminAuth, (_req, res) => {
  resetGame();
  res.json({ game: store.game });
});

// finalizeRoundScores est réexporté pour les éventuels tests
export { finalizeRoundScores };
export default router;
