import type { Song } from "@shared/types";
import { store, resetGameStore } from "../store/memoryStore";
import { computeRoundScoring } from "./scoring.service";

export const ROUND_DURATION_MS = 60_000;

/** Termine automatiquement le round si le temps est écoulé, puis finalise le score. */
export function applyAutoRoundEnd(): void {
  const { game } = store;
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

/** Calcule et attribue les points du round courant une seule fois. */
export function finalizeRoundScores(): void {
  const { game } = store;
  if (game.status !== "started" || game.roundStatus !== "ended" || game.roundScored) {
    return;
  }

  game.roundScored = true;

  const { roundPointsByTeamId, breakdown } = computeRoundScoring({
    teams: store.teams,
    roundResults: store.roundResults,
  });

  // Cumule les scores et complète le breakdown avec les totaux.
  store.lastRoundBreakdown = breakdown.map((entry) => {
    const roundPoints = roundPointsByTeamId[entry.teamId] || 0;
    const prevTotal = store.scores[entry.teamId] || 0;
    const totalPoints = prevTotal + roundPoints;
    store.scores[entry.teamId] = totalPoints;

    return { ...entry, roundPoints, totalPoints };
  });

  store.lastRoundBreakdown.sort((a, b) => b.totalPoints - a.totalPoints);
}

/** Lance la partie. */
export function startGame(): { error?: string } {
  if (store.songs.length === 0) {
    return { error: "Ajoute au moins une chanson avant de lancer la partie." };
  }

  store.game = {
    status: "started",
    currentSongIndex: 0,
    roundStartedAt: new Date().toISOString(),
    roundStatus: "playing",
    roundScored: false,
  };
  store.roundResults = {};
  store.scores = {};
  store.lastRoundBreakdown = [];
  return {};
}

/** Termine le round courant (révèle la réponse). Idempotent. */
export function endRound(): { error?: string } {
  if (store.game.status !== "started") {
    return { error: "Aucune partie en cours." };
  }
  store.game.roundStatus = "ended";
  finalizeRoundScores();
  return {};
}

/** Passe au round suivant, ou termine la partie si c'était la dernière chanson. */
export function nextRound(): { error?: string } {
  if (store.game.status !== "started") {
    return { error: "Aucune partie en cours." };
  }

  // Sécurité : finalise le round courant s'il était encore en cours
  // (l'admin passe au suivant sans avoir terminé le round explicitement).
  if (store.game.roundStatus === "playing") {
    store.game.roundStatus = "ended";
    finalizeRoundScores();
  }

  if (store.game.currentSongIndex + 1 < store.songs.length) {
    store.game.currentSongIndex += 1;
    store.game.roundStartedAt = new Date().toISOString();
    store.game.roundStatus = "playing";
    store.game.roundScored = false;
    store.roundResults = {};
    store.lastRoundBreakdown = [];
  } else {
    store.game.status = "finished";
    store.game.roundStatus = "ended";
  }

  return {};
}

/** Arrêt manuel de la partie (fin anticipée). */
export function stopGame(): { error?: string } {
  if (store.game.status !== "started") {
    return { error: "Aucune partie en cours." };
  }
  store.game.status = "finished";
  store.game.roundStatus = "ended";
  finalizeRoundScores();
  return {};
}

/** Remet la partie à zéro. */
export function resetGame(): void {
  resetGameStore();
}

/** Chanson du round courant, masquée tant que le round n'est pas terminé. */
export function currentSongForClient(): (Song & { revealed: boolean }) | null {
  const song = store.songs[store.game.currentSongIndex];
  if (!song) return null;
  if (store.game.roundStatus === "ended") {
    return { ...song, revealed: true };
  }
  return { id: song.id, title: "", artist: "", revealed: false };
}

/** Scoreboard complet (O(teams)) trié par total décroissant. */
export function buildScoreboard() {
  // Indexe le breakdown par teamId pour éviter le O(teams²).
  const breakdownByTeamId = new Map(
    store.lastRoundBreakdown.map((e) => [e.teamId, e])
  );

  return store.teams
    .map((team) => {
      const r = store.roundResults[team.id] || { foundTitleAt: null, foundArtistAt: null };
      const breakdownEntry = breakdownByTeamId.get(team.id);
      return {
        teamId: team.id,
        name: team.name,
        foundTitle: !!r.foundTitleAt,
        foundArtist: !!r.foundArtistAt,
        roundPoints: breakdownEntry ? breakdownEntry.roundPoints : 0,
        totalPoints: store.scores[team.id] || 0,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getMyRoundResult(teamId: string | undefined) {
  if (!teamId) return null;
  const r = store.roundResults[teamId];
  if (!r) return null;
  return { foundTitle: !!r.foundTitleAt, foundArtist: !!r.foundArtistAt };
}
