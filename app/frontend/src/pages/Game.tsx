import { useEffect, useRef, useState } from "react";
import { isFuzzyMatch } from "../utils/fuzzyMatch";
import "./Landing.css";
import "./Game.css";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface GameStatusResponse {
  game: {
    status: "idle" | "started";
    startedAt: string | null;
  };
  songsCount: number;
}

const ROUND_DURATION_MS = 60_000;

type FoundField = "title" | "artist" | "both";

function Game() {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [found, setFound] = useState<FoundField | null>(null);
  const [percentLeft, setPercentLeft] = useState(100);
  const [timeUp, setTimeUp] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Charge la 1ère chanson de la liste configurée dans l'admin, ainsi que
  // l'heure de démarrage de la partie (pour synchroniser le minuteur entre
  // toutes les équipes).
  useEffect(() => {
    const load = async () => {
      try {
        const [songsRes, statusRes] = await Promise.all([
          fetch("/api/songs", { credentials: "include" }),
          fetch("/api/game/status", { credentials: "include" }),
        ]);

        if (!songsRes.ok || !statusRes.ok) throw new Error();

        const songsData: { songs: Song[] } = await songsRes.json();
        const statusData: GameStatusResponse = await statusRes.json();

        const firstSong = songsData.songs?.[0];
        if (!firstSong) {
          throw new Error("Aucune chanson n'a été configurée par l'admin.");
        }

        setSong(firstSong);
        startedAtRef.current = statusData.game.startedAt
          ? new Date(statusData.game.startedAt).getTime()
          : Date.now();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la chanson à deviner."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Fait descendre la barre de progression de 100% à 0% en 1 minute,
  // calculée à partir de l'heure de démarrage réelle (pas d'un simple
  // décompte local, pour rester synchronisé même après un rechargement).
  useEffect(() => {
    if (loading || error || found) return;

    const tick = () => {
      if (startedAtRef.current === null) return;
      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, 100 - (elapsed / ROUND_DURATION_MS) * 100);
      setPercentLeft(remaining);
      if (remaining <= 0) setTimeUp(true);
    };

    tick();
    const interval = setInterval(tick, 150);
    return () => clearInterval(interval);
  }, [loading, error, found]);

  const handleGuessChange = (value: string) => {
    setGuess(value);
    if (!song || timeUp) return;

    const titleMatch = isFuzzyMatch(value, song.title);
    const artistMatch = isFuzzyMatch(value, song.artist);

    const hasFoundBoth = titleMatch && found === "artist" || artistMatch && found === "title";

    if (hasFoundBoth) setFound("both");
    else if (titleMatch) setFound("title");
    else if (artistMatch) setFound("artist");
  };

  if (loading) {
    return (
      <main className="landing">
        <p>Chargement de la chanson...</p>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="landing">
        <p className="team-error">{error ?? "Erreur inconnue."}</p>
      </main>
    );
  }

  return (
    <main className="landing game">
      <h1 className="landing-title">🎧 Blind test</h1>
      <p className="landing-subtitle">Trouve le titre et/ou l'artiste !</p>

      <div className="game-progress-track">
        <div
          className={`game-progress-fill${timeUp ? " game-progress-empty" : ""}`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>

      <input
        type="text"
        className="team-input game-guess-input"
        placeholder="Titre et/ou artiste..."
        value={guess}
        disabled={found === "both" || timeUp}
        onChange={(e) => handleGuessChange(e.target.value)}
        autoFocus
      />

      {found && (
        <p className="game-found">
          ✅ Bonne réponse trouvée !
          {found === "both" && " Titre et artiste corrects."}
          {found === "title" && " (titre reconnu)"}
          {found === "artist" && " (artiste reconnu)"}
        </p>
      )}

      {timeUp && !found && (
        <p className="team-error">
          ⏱️ Temps écoulé ! C'était « {song.title} » — {song.artist}.
        </p>
      )}
    </main>
  );
}

export default Game;
