import { useEffect, useState, FormEvent } from "react";
import "./Landing.css";
import "./Admin.css";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface GameStatusResponse {
  game: {
    status: "idle" | "started" | "finished";
    currentSongIndex: number;
    roundStartedAt: string | null;
    roundStatus: "playing" | "ended";
  };
  songsCount: number;
}

function Admin() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<GameStatusResponse | null>(null);

  // Charge la liste des chansons configurées
  useEffect(() => {
    fetch("/api/songs", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSongs(data.songs))
      .catch(() => setError("Impossible de charger la liste des chansons."))
      .finally(() => setLoading(false));
  }, []);

  // Polling de l'état de la partie pour piloter l'affichage des commandes
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/game/status", { credentials: "include" });
        if (!res.ok) return;
        const data: GameStatusResponse = await res.json();
        setStatus(data);
      } catch {
        // on ignore les erreurs ponctuelles
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, []);

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
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmedTitle, artist: trimmedArtist }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de l'ajout.");
      }

      const data = await res.json();
      setSongs((prev) => [...prev, data.song]);
      setTitle("");
      setArtist("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error();
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Impossible de supprimer cette chanson.");
    }
  };

  const callGameAction = async (action: string, endpoint: string) => {
    setActionLoading(action);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Action impossible.");
      }

      // Rafraîchit immédiatement l'état local
      const data = await res.json();
      if (data?.game) {
        setStatus((prev) => prev ? { ...prev, game: data.game } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartGame = () => {
    setStarting(true);
    callGameAction("start", "/api/game/start").finally(() => setStarting(false));
  };

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

      {gameStatus === "idle" && (
        <>
          <form className="admin-form" onSubmit={handleAddSong}>
            <input
              type="text"
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="team-input"
            />
            <input
              type="text"
              placeholder="Artiste"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="team-input"
            />
            <button type="submit" className="team-submit">
              Ajouter
            </button>
          </form>

          {error && <p className="team-error">{error}</p>}

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

          <button
            type="button"
            className="admin-start-button"
            disabled={songs.length === 0 || starting || actionLoading !== null}
            onClick={handleStartGame}
          >
            {starting ? "Lancement..." : "Lancer la partie"}
          </button>
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

          {error && <p className="team-error">{error}</p>}

          <div className="admin-controls">
            {roundStatus === "playing" && (
              <button
                type="button"
                className="admin-button admin-button-end"
                disabled={actionLoading !== null}
                onClick={() => callGameAction("end", "/api/game/round/end")}
              >
                {actionLoading === "end" ? "..." : "Terminer le round"}
              </button>
            )}

            {roundStatus === "ended" && (
              <button
                type="button"
                className="admin-button admin-button-next"
                disabled={actionLoading !== null}
                onClick={() => callGameAction("next", "/api/game/round/next")}
              >
                {actionLoading === "next"
                  ? "..."
                  : isLastRound
                  ? "Terminer la partie"
                  : "Round suivant"}
              </button>
            )}

            <button
              type="button"
              className="admin-button admin-button-stop"
              disabled={actionLoading !== null}
              onClick={() => callGameAction("stop", "/api/game/stop")}
            >
              {actionLoading === "stop" ? "..." : "Terminer la partie"}
            </button>

            <button
              type="button"
              className="admin-button admin-button-reset"
              disabled={actionLoading !== null}
              onClick={() => callGameAction("reset", "/api/game/reset")}
            >
              {actionLoading === "reset" ? "..." : "Réinitialiser"}
            </button>
          </div>
        </div>
      )}

      {gameStatus === "finished" && (
        <div className="admin-control-panel">
          <p className="admin-finished">🏆 Partie terminée</p>
          {error && <p className="team-error">{error}</p>}
          <button
            type="button"
            className="admin-button admin-button-reset"
            disabled={actionLoading !== null}
            onClick={() => callGameAction("reset", "/api/game/reset")}
          >
            {actionLoading === "reset" ? "..." : "Réinitialiser pour reconfigurer"}
          </button>
        </div>
      )}
    </main>
  );
}

export default Admin;
