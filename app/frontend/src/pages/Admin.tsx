import { useEffect, useState, FormEvent } from "react";
import "./Landing.css";
import "./Admin.css";

interface Song {
  id: string;
  title: string;
  artist: string;
}

function Admin() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch("/api/songs", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSongs(data.songs))
      .catch(() => setError("Impossible de charger la liste des chansons."))
      .finally(() => setLoading(false));
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

  const handleStartGame = async () => {
    setStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Impossible de lancer la partie.");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setStarting(false);
    }
  };

  return (
    <main className="landing admin">
      <h1 className="landing-title">Administration</h1>
      <p className="landing-subtitle">
        Configure la liste des chansons puis lance la partie.
      </p>

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
          {songs.map((song) => (
            <li key={song.id} className="admin-song-item">
              <span>
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
        disabled={songs.length === 0 || starting}
        onClick={handleStartGame}
      >
        {starting ? "Lancement..." : "Lancer la partie"}
      </button>
    </main>
  );
}

export default Admin;
