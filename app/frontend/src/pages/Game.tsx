import { useEffect, useRef, useState } from "react";
import type { FoundField } from "@shared/types";
import { useGameStatus } from "../hooks/useGameStatus";
import { useTeam } from "../hooks/useTeam";
import { submitGuess } from "../api/endpoints";
import { ProgressBar } from "../components/ProgressBar";
import { ScoreboardTable } from "../components/ScoreboardTable";
import "./Landing.css";
import "./Game.css";

function Game() {
  const { status, loading, connectionLost } = useGameStatus(1000);
  const { teamId } = useTeam();
  const [guess, setGuess] = useState("");
  const [found, setFound] = useState<FoundField | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [percentLeft, setPercentLeft] = useState(100);
  const roundStartedAtRef = useRef<number | null>(null);
  const lastIndexRef = useRef<number>(-1);

  // Nouveau round détecté : réinitialise l'interface locale
  useEffect(() => {
    if (!status) return;
    if (status.game.status === "finished") {
      lastIndexRef.current = -1;
      return;
    }
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

  // Synchronise `found` avec `myRoundResult` du serveur (fiable après reload)
  useEffect(() => {
    const r = status?.myRoundResult;
    if (!r) return;
    if (r.foundTitle && r.foundArtist) setFound("both");
    else if (r.foundTitle) setFound("title");
    else if (r.foundArtist) setFound("artist");
  }, [status?.myRoundResult]);

  // Barre de progression synchronisée côté serveur
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
      setPercentLeft(Math.max(0, 100 - (elapsed / duration) * 100));
    };

    tick();
    const interval = setInterval(tick, 150);
    return () => clearInterval(interval);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = guess.trim();
    if (!trimmed) {
      setFound(null);
      return;
    }
    setSubmitting(true);

    try {
      const data = await submitGuess(trimmed);
      if (data.foundTitle || data.foundArtist) setGuess("");
      setFound(() => {
        if (data.foundTitle && data.foundArtist) return "both";
        if (data.foundTitle) return "title";
        if (data.foundArtist) return "artist";
        return null;
      });
    } catch {
      // on ignore les erreurs ponctuelles de validation
    }
    finally {
      setSubmitting(false);
    }
  }

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
        <p className="team-error">Impossible de charger la partie.</p>
      </main>
    );
  }

  if (connectionLost) {
    return (
      <main className="landing">
        <p className="team-error">Connexion au serveur perdue...</p>
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
          <ScoreboardTable entries={scoreboard} myTeamId={teamId} mode="final" caption="Classement final" />
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

      <ProgressBar percentLeft={percentLeft} empty={roundEnded} />
      <form className="team-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="team-input game-guess-input"
          placeholder="Titre et/ou artiste..."
          value={guess}
          disabled={found === "both" || roundEnded}
          onChange={(e) => setGuess(e.target.value)}
          autoFocus
          aria-label="Ta réponse"
        />
        <button type="submit" className="team-submit" disabled={submitting}>
          {submitting ? "..." : "Valider"}
        </button>
      </form>

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
            <ScoreboardTable entries={scoreboard} myTeamId={teamId} mode="round" caption="Scores" />
          )}
        </div>
      )}
    </main>
  );
}

export default Game;
