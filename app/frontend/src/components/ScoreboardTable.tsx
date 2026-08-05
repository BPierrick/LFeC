import type { ScoreboardEntry } from "@shared/types";

interface Props {
  entries: ScoreboardEntry[];
  myTeamId: string | null;
  mode: "round" | "final";
  caption?: string;
}

export function ScoreboardTable({ entries, myTeamId, mode, caption }: Props) {
  return (
    <div className="game-scoreboard">
      {caption && <caption className="game-scoreboard-title">{caption}</caption>}
      <table className="scoreboard-table">
        {mode === "round" ? (
          <thead>
            <tr>
              <th scope="col">Équipe</th>
              <th scope="col">Titre</th>
              <th scope="col">Artiste</th>
              <th scope="col">Pts round</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
        ) : (
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Équipe</th>
              <th scope="col">Points</th>
            </tr>
          </thead>
        )}
        <tbody>
          {mode === "round"
            ? entries.map((entry) => (
                <tr
                  key={entry.teamId}
                  className={entry.teamId === myTeamId ? "scoreboard-row-mine" : ""}
                >
                  <td className="scoreboard-name">{entry.name}</td>
                  <td className="scoreboard-check" aria-label={entry.foundTitle ? "Trouvé" : "Manqué"}>
                    {entry.foundTitle ? "✅" : "❌"}
                  </td>
                  <td className="scoreboard-check" aria-label={entry.foundArtist ? "Trouvé" : "Manqué"}>
                    {entry.foundArtist ? "✅" : "❌"}
                  </td>
                  <td className="scoreboard-points">{entry.roundPoints}</td>
                  <td className="scoreboard-points">{entry.totalPoints}</td>
                </tr>
              ))
            : entries.map((entry, index) => (
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
  );
}
