import type { Team } from "@shared/types";
import type { BreakdownEntry, RoundResult } from "../types";

export interface ScoringInput {
  teams: Team[];
  roundResults: Record<string, RoundResult>;
}

export interface ScoringOutput {
  breakdown: BreakdownEntry[];
  roundPointsByTeamId: Record<string, number>;
}

interface RankedEntry {
  teamId: string;
  name: string;
  category: "both" | "one" | "none";
  completionTime: number;
  foundTitle: boolean;
  foundArtist: boolean;
}

const BOTH_POINTS = [7, 6, 5];
const ONE_POINTS = [3, 2, 1];

/**
 * Calcule les points du round courant à partir des résultats des équipes.
 * Logique pure, sans effet de bord : renvoie les points par équipe et le
 * breakdown ordonné par total (les totaux sont calculés par l'appelant).
 */
export function computeRoundScoring(input: ScoringInput): ScoringOutput {
  const ranked: RankedEntry[] = input.teams.map((team) => {
    const r = input.roundResults[team.id] || { foundTitleAt: null, foundArtistAt: null };
    const foundTitle = !!r.foundTitleAt;
    const foundArtist = !!r.foundArtistAt;

    let category: "both" | "one" | "none" = "none";
    let completionTime = Infinity;

    if (foundTitle && foundArtist) {
      category = "both";
      completionTime = Math.max(
        new Date(r.foundTitleAt!).getTime(),
        new Date(r.foundArtistAt!).getTime()
      );
    } else if (foundTitle || foundArtist) {
      category = "one";
      completionTime = new Date(
        (foundTitle ? r.foundTitleAt : r.foundArtistAt)!
      ).getTime();
    }

    return { teamId: team.id, name: team.name, category, completionTime, foundTitle, foundArtist };
  });

  const bothRanked = ranked
    .filter((e) => e.category === "both")
    .sort((a, b) => a.completionTime - b.completionTime);
  const oneRanked = ranked
    .filter((e) => e.category === "one")
    .sort((a, b) => a.completionTime - b.completionTime);

  const roundPointsByTeamId: Record<string, number> = {};
  // Toutes les équipes commencent à 0 point pour ce round
  for (const team of input.teams) {
    roundPointsByTeamId[team.id] = 0;
  }

  bothRanked.forEach((entry, index) => {
    roundPointsByTeamId[entry.teamId] = BOTH_POINTS[Math.min(index, BOTH_POINTS.length - 1)];
  });

  oneRanked.forEach((entry, index) => {
    roundPointsByTeamId[entry.teamId] = ONE_POINTS[Math.min(index, ONE_POINTS.length - 1)];
  });

  // Le breakdown sera ordonné par total (calculé par l'appelant), on renvoie
  // ici une version non ordonnée ; l'appelant ajoute totalPoints et trie.
  return {
    roundPointsByTeamId,
    breakdown: ranked.map((entry) => ({
      teamId: entry.teamId,
      name: entry.name,
      foundTitle: entry.foundTitle,
      foundArtist: entry.foundArtist,
      roundPoints: roundPointsByTeamId[entry.teamId] || 0,
      totalPoints: 0,
    })),
  };
}
