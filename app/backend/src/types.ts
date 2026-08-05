export interface GameState {
  status: "idle" | "started" | "finished";
  currentSongIndex: number;
  roundStartedAt: string | null;
  roundStatus: "playing" | "ended";
  roundScored: boolean;
}

export interface RoundResult {
  foundTitleAt: string | null;
  foundArtistAt: string | null;
}

export interface BreakdownEntry {
  teamId: string;
  name: string;
  foundTitle: boolean;
  foundArtist: boolean;
  roundPoints: number;
  totalPoints: number;
}
