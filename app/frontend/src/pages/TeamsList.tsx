import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Team } from "@shared/types";
import { getTeams, getTeam } from "../api/endpoints";
import { useGameStatus } from "../hooks/useGameStatus";
import "./Landing.css";
import "./TeamsList.css";

function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const navigate = useNavigate();
  const { status: game } = useGameStatus(2000);

  useEffect(() => {
    const load = async () => {
      try {
        const [teamsData, meData] = await Promise.all([
          getTeams(),
          getTeam(),
        ]);
        setTeams(teamsData.teams);
        setMyTeam(meData.team);
        setStatus("ok");
      } catch {
        setStatus("error");
      }
    };
    load();
  }, []);

  // Redirige vers le jeu dès que la partie démarre
  useEffect(() => {
    if (game?.game.status === "started") navigate("/jeu");
  }, [game, navigate]);

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
        <p className="team-error">Impossible de charger la liste des équipes.</p>
      )}

      {status === "ok" && (
        <ul className="teams-list" aria-label="Liste des équipes">
          {teams.length === 0 && <li>Aucune équipe pour le moment.</li>}
          {teams.map((team) => (
            <li
              key={team.id}
              className={myTeam?.id === team.id ? "teams-item teams-item-mine" : "teams-item"}
            >
              {team.name}
              {myTeam?.id === team.id && <span className="teams-badge" aria-hidden="true">toi</span>}
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
