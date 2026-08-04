import { useEffect, useRef, useState } from "react";
import "./Landing.css";
import "./Game.css";

interface Song {
  id: string;
  title: string;
  artist: string;
  revealed: boolean;
}

interface ScoreboardEntry {
  teamId: string;
  name: string;
  foundTitle: boolean;
  foundArtist: boolean;
  roundPoints: number;
  totalPoints: number;
}

interface GameStatusResponse {
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

type FoundField = "title" | "artist" | "both";

function Game() {
  const [status, setStatus] = useState<GameStatusResponse | null>(null);
  const [guess, setGuess] = useState("");
  const [found, setFound] = useState<FoundField | null>(null);
  const [percentLeft, setPercentLeft] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const roundStartedAtRef = useRef<number | null>(null);
  const lastIndexRef = useRef<number>(-1);
  const guessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling régulier de l'état de la partie pour suivre les transitions
  // de round (changement de chanson), la fin de round (révélation) et
  // la fin de partie.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const [statusRes, teamRes] = await Promise.all([
          fetch("/api/game/status", { credentials: "include" }),
          fetch("/api/team", { credentials: "include" }),
        ]);

        if (statusRes.ok) {
          const data: GameStatusResponse = await statusRes.json();
          if (!cancelled) {
            setStatus(data);
            setError(null);
          }
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (!cancelled && teamData?.team?.id) {
            setMyTeamId(teamData.team.id);
          }
        }
      } catch {
        // on ignore les erreurs de polling ponctuelles
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Réagit aux changements d'état détectés par le polling.
  useEffect(() => {
    if (!status) return;

    // Fin de partie
    if (status.game.status === "finished") return;

    // Nouveau round détecté : on réinitialise l'interface locale
    if (status.game.currentSongIndex !== lastIndexRef.current) {
      lastIndexRef.current = status.game.currentSongIndex;
      setGuess("");
      setFound(null);
      setPercentLeft(100);
      roundStartedAtRef.current = status.game.roundStartedAt
        ? new Date(status.game.roundStartedAt).getTime()
        : Date.now();
    }
  }, [status]);

  // Synchronise `found` avec `myRoundResult` du serveur (fiable même après reload)
  useEffect(() => {
    if (!status?.myRoundResult) return;
    const { foundTitle, foundArtist } = status.myRoundResult;
    if (foundTitle && foundArtist) setFound("both");
    else if (foundTitle) setFound("title");
    else if (foundArtist) setFound("artist");
  }, [status?.myRoundResult]);

  // Barre de progression basée sur l'heure de démarrage du round
  // (synchronisée côté serveur pour rester cohérente entre les équipes).
  useEffect(() => {
    if (!status || status.game.status !== "started") return;
    if (status.game.roundStatus === "ended") {
      setPercentLeft(0);
      return;
    }

    const tick = () => {
      if (roundStartedAtRef.current === null) return;
      const elapsed = Date.now() - roundStartedAtRef.current;
      const duration = status.roundDurationMs;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setPercentLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 150);
    return () => clearInterval(interval);
  }, [status]);

  // Envoie le guess au serveur (avec debounce) pour validation. Le client
  // ne reçoit jamais la réponse, seulement ce qui a été reconnu.
  const handleGuessChange = (value: string) => {
    setGuess(value);

    if (guessTimerRef.current) clearTimeout(guessTimerRef.current);

    if (!status || status.game.status !== "started" || status.game.roundStatus === "ended") {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setFound(null);
      return;
    }

    guessTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/game/round/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ guess: trimmed }),
        });
        if (!res.ok) return;
        const data: { foundTitle: boolean; foundArtist: boolean } = await res.json();

        const hasTitle = data.foundTitle;
        const hasArtist = data.foundArtist;

        if (hasTitle || hasArtist) {
          setGuess("");
        }

        setFound(() => {
          if (hasTitle && hasArtist) return "both";
          if (hasTitle) return "title";
          if (hasArtist) return "artist";
          return null;
        });
      } catch {
        // on ignore les erreurs ponctuelles de validation
      }
    }, 300);
  };

  if (loading) {
    return (
      <main className="landing">
        <p>Chargement de la chanson...</p>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="landing">
        <p className="team-error">{error ?? "Impossible de charger la partie."}</p>
      </main>
    );
  }

  // --- Écran : Partie terminée (classement final) ---
  if (status.game.status === "finished") {
    const scoreboard = status.scoreboard ?? [];
    return (
      <main className="landing game">
        <h1 className="landing-title">🏆 Partie terminée</h1>
        <p className="landing-subtitle">Merci d'avoir joué !</p>

        {scoreboard.length > 0 && (
          <div className="game-scoreboard">
            <h2 className="game-scoreboard-title">Classement final</h2>
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Équipe</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => (
                  <tr
                    key={entry.teamId}
                    className={entry.teamId === myTeamId ? "scoreboard-row-mine" : ""}
                  >
                    <td className="scoreboard-rank">{index + 1}</td>
                    <td className="scoreboard-name">{entry.name}</td>
                    <td className="scoreboard-points">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    );
  }

  // --- Écran : En attente du démarrage ---
  if (status.game.status === "idle") {
    return (
      <main className="landing game">
        <h1 className="landing-title">🎧 Blind test</h1>
        <p className="landing-subtitle">En attente du démarrage de la partie...</p>
      </main>
    );
  }

  // --- Écran : Round en cours / terminé ---
  const song = status.currentSong;
  const roundEnded = status.game.roundStatus === "ended";
  const roundNumber = status.game.currentSongIndex + 1;
  const scoreboard = status.scoreboard ?? [];
  const myResult = status.myRoundResult;

  return (
    <main className="landing game">
      <h1 className="landing-title">🎧 Blind test</h1>
      <p className="landing-subtitle">
        Round {roundNumber} / {status.songsCount}
      </p>

      <div className="game-progress-track">
        <div
          className={`game-progress-fill${roundEnded ? " game-progress-empty" : ""}`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>

      <input
        type="text"
        className="team-input game-guess-input"
        placeholder="Titre et/ou artiste..."
        value={guess}
        disabled={found === "both" || roundEnded}
        onChange={(e) => handleGuessChange(e.target.value)}
        autoFocus
      />

      {found && !roundEnded && (
        <p className="game-found">
          ✅ Bonne réponse trouvée !
          {found === "both" && " Titre et artiste corrects."}
          {found === "title" && " (titre reconnu)"}
          {found === "artist" && " (artiste reconnu)"}
        </p>
      )}

      {/* --- Section révélation (fin de round) --- */}
      {roundEnded && song?.revealed && (
        <div className="game-reveal-section">
          <div className="game-reveal-answer">
            <p className="game-reveal-label">La réponse était</p>
            <p className="game-reveal-song">
              « {song.title} » — {song.artist}
            </p>
          </div>

          <div className="game-reveal-mine">
            {myResult ? (
              <p>
                {myResult.foundTitle ? "✅ Titre trouvé" : "❌ Titre manqué"}
                {"  ·  "}
                {myResult.foundArtist ? "✅ Artiste trouvé" : "❌ Artiste manqué"}
              </p>
            ) : (
              <p>Aucune réponse enregistrée.</p>
            )}
          </div>

          {scoreboard.length > 0 && (
            <div className="game-scoreboard">
              <h2 className="game-scoreboard-title">Scores</h2>
              <table className="scoreboard-table">
                <thead>
                  <tr>
                    <th>Équipe</th>
                    <th>Titre</th>
                    <th>Artiste</th>
                    <th>Pts round</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.map((entry) => (
                    <tr
                      key={entry.teamId}
                      className={entry.teamId === myTeamId ? "scoreboard-row-mine" : ""}
                    >
                      <td className="scoreboard-name">{entry.name}</td>
                      <td className="scoreboard-check">
                        {entry.foundTitle ? "✅" : "❌"}
                      </td>
                      <td className="scoreboard-check">
                        {entry.foundArtist ? "✅" : "❌"}
                      </td>
                      <td className="scoreboard-points">{entry.roundPoints}</td>
                      <td className="scoreboard-points">{entry.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default Game;
