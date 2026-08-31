import type { GameStatusResponse, Song, Team } from "@shared/types";
import { apiGet, apiPost, apiDelete } from "./client";

// --- Équipes ---
export const getTeam = () => apiGet<{ team: Team | null }>("/api/team");
export const getTeams = () => apiGet<{ teams: Team[] }>("/api/teams");
export const removeTeam = (id: string) => apiDelete(`/api/teams/${id}`);
export const registerTeam = (name: string) =>
  apiPost<{ team: Team }>("/api/team", { name });

// --- Chansons ---
export const getSongs = () => apiGet<{ songs: Song[] }>("/api/songs");
export const addSong = (title: string, artist: string) =>
  apiPost<{ song: Song }>("/api/songs", { title, artist });
export const importSongs = (songs: { title: string; artist: string }[]) =>
  apiPost<{ imported: number; skipped: number; skippedDetails: unknown[]; songs: Song[] }>(
    "/api/songs/import",
    { songs }
  );
export const removeSong = (id: string) => apiDelete(`/api/songs/${id}`);

// --- Partie ---
export const getGameStatus = () => apiGet<GameStatusResponse>("/api/game/status");
export const startGame = () => apiPost<{ game: unknown }>("/api/game/start");
export const endRound = () => apiPost<{ game: unknown }>("/api/game/round/end");
export const nextRound = () => apiPost<{ game: unknown }>("/api/game/round/next");
export const stopGame = () => apiPost<{ game: unknown }>("/api/game/stop");
export const resetGame = () => apiPost<{ game: unknown }>("/api/game/reset");
export const submitGuess = (guess: string) =>
  apiPost<{ foundTitle: boolean; foundArtist: boolean }>(
    "/api/game/round/guess",
    { guess }
  );

// --- Admin auth ---
export const adminLogin = (password: string) =>
  apiPost<{ success: boolean }>("/api/admin/login", { password });
export const adminLogout = () =>
  apiPost<{ success: boolean }>("/api/admin/logout");
export const getAdminSession = () =>
  apiGet<{ isAdmin: boolean }>("/api/admin/session");
