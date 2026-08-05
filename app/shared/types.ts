export interface Song {
  id: string;
  title: string;
  artist: string;
  revealed?: boolean;
}

export interface ScoreboardEntry {
  teamId: string;
  name: string;
  foundTitle: boolean;
  foundArtist: boolean;
  roundPoints: number;
  totalPoints: number;
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export interface GameStatusResponse {
  game: {
    status: "idle" | "started" | "finished";
    currentSongIndex: number;
    roundStartedAt: string | null;
    roundStatus: "playing" | "ended";
  };
  songsCount: number;
  currentSong: Song | null;
  roundDurationMs: number;
  scoreboard?: ScoreboardEntry[];
  myRoundResult?: { foundTitle: boolean; foundArtist: boolean } | null;
}

export type FoundField = "title" | "artist" | "both";
