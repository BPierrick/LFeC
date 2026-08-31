import { useEffect, useState, FormEvent } from "react";
import type { Song } from "@shared/types";
import { useAuth } from "../context/AuthContext";
import {
  addSong,
  getSongs,
  removeSong,
  startGame,
  endRound,
  nextRound,
  stopGame,
  resetGame,
  removeTeam,
} from "../api/endpoints";
import { useGameStatus } from "../hooks/useGameStatus";
import { TextInput } from "../components/TextInput";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import "./Landing.css";
import "./Admin.css";
import { useTeams } from "@/hooks/useTeams";

function AdminLogin() {
  const { login, error } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    await login(password);
    setSubmitting(false);
  };

  return (
    <main className="landing admin">
      <h1 className="landing-title">Administration</h1>
      <p className="landing-subtitle">Connecte-toi pour piloter la partie.</p>

      <form className="team-form" onSubmit={handleSubmit}>
        <TextInput
          id="admin-password"
          label="Mot de passe admin"
          type="password"
          placeholder="Mot de passe"
          value={password}
          disabled={submitting}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="team-submit" disabled={submitting}>
          {submitting ? "..." : "Se connecter"}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}
    </main>
  );
}

function Admin() {
  const { isAuthed, checking, logout } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { status, refresh } = useGameStatus(1000);
  const {teams, refresh: refreshTeams} = useTeams();



  useEffect(() => {
    if (!isAuthed) return;
    getSongs()
      .then((data) => setSongs(data.songs))
      .catch(() => setError("Impossible de charger la liste des chansons."))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  const handleAddSong = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();

    if (!trimmedTitle || !trimmedArtist) {
      setError("Merci de renseigner un titre et un artiste.");
      return;
    }

    setError(null);
    try {
      const data = await addSong(trimmedTitle, trimmedArtist);
      setSongs((prev) => [...prev, data.song]);
      setTitle("");
      setArtist("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      await removeSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Impossible de supprimer cette chanson.");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await removeTeam(id);
      refreshTeams();
    } catch {
      setError("Impossible de supprimer cette équipe.");
    }
  };

  const callAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    setError(null);
    try {
      await fn();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setActionLoading(null);
    }
  };

  if (checking) {
    return (
      <main className="landing admin">
        <p>Vérification de la session...</p>
      </main>
    );
  }

  if (!isAuthed) {
    return <AdminLogin />;
  }

  const gameStatus = status?.game.status ?? "idle";
  const roundStatus = status?.game.roundStatus ?? "playing";
  const currentIndex = status?.game.currentSongIndex ?? 0;
  const currentSong = songs[currentIndex];
  const isLastRound = currentIndex + 1 >= songs.length;

  return (
    <main className="landing admin">
      <h1 className="landing-title">Administration</h1>
      <p className="landing-subtitle">
        Configure la liste des chansons puis pilote le déroulé de la partie.
      </p>

      <button type="button" className="admin-logout" onClick={() => void logout()}>
        Déconnexion
      </button>

      {gameStatus === "idle" && (
        <>
          <form className="admin-form" onSubmit={handleAddSong}>
            <TextInput
              id="song-title"
              label="Titre"
              type="text"
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextInput
              id="song-artist"
              label="Artiste"
              type="text"
              placeholder="Artiste"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
            <button type="submit" className="team-submit">
              Ajouter
            </button>
          </form>

          {error && <ErrorBanner message={error} />}

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <ul className="admin-songs">
              {songs.length === 0 && <li>Aucune chanson pour le moment.</li>}
              {songs.map((song, index) => (
                <li key={song.id} className="admin-song-item">
                  <span>
                    <span className="admin-song-rank">{index + 1}.</span>{" "}
                    <strong>{song.title}</strong> — {song.artist}
                  </span>
                  <button
                    type="button"
                    className="admin-song-remove"
                    onClick={() => handleDeleteSong(song.id)}
                    aria-label={`Supprimer ${song.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <ul className="teams">
              {teams.length === 0 && <li>Aucune équipe pour le moment.</li>}
              {teams.map((team) => (
                <li key={team.id} className="team-item">
                  <span>
                    <strong>{team.name}</strong>
                  </span>
                  <button
                    type="button"
                    className="team-remove"
                    onClick={() => handleDeleteTeam(team.id)}
                    aria-label={`Supprimer ${team.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="primary"
            disabled={songs.length === 0 || actionLoading !== null}
            onClick={() => callAction("start", startGame)}
          >
            {actionLoading === "start" ? "Lancement..." : "Lancer la partie"}
          </Button>
        </>
      )}

      {gameStatus === "started" && (
        <div className="admin-control-panel">
          <div className="admin-round-info">
            <p className="admin-round-title">
              Round {currentIndex + 1} / {songs.length}
            </p>
            {currentSong && (
              <p className="admin-round-song">
                <strong>{currentSong.title}</strong> — {currentSong.artist}
              </p>
            )}
            <p className={`admin-round-state admin-round-state-${roundStatus}`}>
              {roundStatus === "playing" ? "⏳ Round en cours" : "✅ Round terminé — réponse révélée"}
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="admin-controls">
            {roundStatus === "playing" && (
              <Button variant="end" disabled={actionLoading !== null} onClick={() => callAction("end", endRound)}>
                {actionLoading === "end" ? "..." : "Terminer le round"}
              </Button>
            )}

            {roundStatus === "ended" && (
              <Button variant="next" disabled={actionLoading !== null} onClick={() => callAction("next", nextRound)}>
                {actionLoading === "next" ? "..." : isLastRound ? "Terminer la partie" : "Round suivant"}
              </Button>
            )}

            <Button variant="stop" disabled={actionLoading !== null} onClick={() => callAction("stop", stopGame)}>
              {actionLoading === "stop" ? "..." : "Terminer la partie"}
            </Button>

            <Button variant="reset" disabled={actionLoading !== null} onClick={() => callAction("reset", resetGame)}>
              {actionLoading === "reset" ? "..." : "Réinitialiser"}
            </Button>
          </div>
        </div>
      )}

      {gameStatus === "finished" && (
        <div className="admin-control-panel">
          <p className="admin-finished">🏆 Partie terminée</p>
          {error && <ErrorBanner message={error} />}
          <Button variant="reset" disabled={actionLoading !== null} onClick={() => callAction("reset", resetGame)}>
            {actionLoading === "reset" ? "..." : "Réinitialiser pour reconfigurer"}
          </Button>
        </div>
      )}
    </main>
  );
}

export default Admin;
