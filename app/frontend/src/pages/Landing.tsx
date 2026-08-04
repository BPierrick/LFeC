import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const SUGGESTIONS = [
  "Les Pipeaux Fous",
  "Do Ré Mi Chantier",
  "L'Octave Sauvage",
  "Les Bâtisseurs de Son",
];

function Landing() {
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const chooseTeam = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Merci de choisir un nom d'équipe.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de l'enregistrement.");
      }

      navigate("/equipes");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de contacter le serveur."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chooseTeam(teamName);
  };

  return (
    <main className="landing">
      <h1 className="landing-title">La flûte en chantier</h1>
      <p className="landing-subtitle">
        Choisis un nom d'équipe pour commencer l'aventure.
      </p>

      <form className="team-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom de ton équipe"
          value={teamName}
          disabled={submitting}
          onChange={(e) => {
            setTeamName(e.target.value);
            if (error) setError(null);
          }}
          className="team-input"
        />
        <button type="submit" className="team-submit" disabled={submitting}>
          {submitting ? "..." : "Valider"}
        </button>
      </form>

      {error && <p className="team-error">{error}</p>}

      <div className="suggestions">
        <p className="suggestions-label">Ou choisis une suggestion :</p>
        <div className="suggestions-list">
          {SUGGESTIONS.map((name) => (
            <button
              key={name}
              type="button"
              className="suggestion-chip"
              disabled={submitting}
              onClick={() => chooseTeam(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Landing;
