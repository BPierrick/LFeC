import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";
import "./TeamsList.css";

interface Team {
  id: string;
  name: string;
  createdAt: string;
}

function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [teamsRes, meRes] = await Promise.all([
          fetch("/api/teams", { credentials: "include" }),
          fetch("/api/team", { credentials: "include" }),
        ]);

        if (!teamsRes.ok || !meRes.ok) throw new Error("Erreur réseau");

        const teamsData = await teamsRes.json();
        const meData = await meRes.json();

        setTeams(teamsData.teams);
        setMyTeam(meData.team);
        setStatus("ok");
      } catch {
        setStatus("error");
      }
    };

    load();
  }, []);

  // Vérifie régulièrement si l'administrateur a lancé la partie, et
  // redirige automatiquement tout le monde vers la page de jeu.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/game/status", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.game?.status === "started") {
          clearInterval(interval);
          navigate("/jeu");
        }
      } catch {
        // on ignore les erreurs de polling ponctuelles, on retentera au prochain tick
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <main className="landing">
      <h1 className="landing-title">Les équipes</h1>

      {myTeam && (
        <p className="landing-subtitle">
          Tu joues avec l'équipe <strong>{myTeam.name}</strong>.
        </p>
      )}

      {status === "loading" && <p>Chargement des équipes...</p>}
      {status === "error" && (
        <p className="team-error">
          Impossible de charger la liste des équipes.
        </p>
      )}

      {status === "ok" && (
        <ul className="teams-list">
          {teams.length === 0 && <li>Aucune équipe pour le moment.</li>}
          {teams.map((team) => (
            <li
              key={team.id}
              className={
                myTeam?.id === team.id ? "teams-item teams-item-mine" : "teams-item"
              }
            >
              {team.name}
              {myTeam?.id === team.id && <span className="teams-badge">toi</span>}
            </li>
          ))}
        </ul>
      )}

      <Link to="/" className="team-submit" style={{ textDecoration: "none", display: "inline-block", marginTop: "1.5rem" }}>
        Changer d'équipe
      </Link>
    </main>
  );
}

export default TeamsList;
