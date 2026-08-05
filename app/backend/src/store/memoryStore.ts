import type { Song, Team } from "@shared/types";
import type { BreakdownEntry, GameState, RoundResult } from "../types";

export const store = {
  teams: [] as Team[],
  songs: [] as Song[],
  game: {
    status: "idle",
    currentSongIndex: 0,
    roundStartedAt: null,
    roundStatus: "playing",
    roundScored: false,
  } as GameState,
  roundResults: {} as Record<string, RoundResult>,
  scores: {} as Record<string, number>,
  lastRoundBreakdown: [] as BreakdownEntry[],
};

export function resetGameStore() {
  store.game = {
    status: "idle",
    currentSongIndex: 0,
    roundStartedAt: null,
    roundStatus: "playing",
    roundScored: false,
  };
  store.roundResults = {};
  store.scores = {};
  store.lastRoundBreakdown = [];
}
