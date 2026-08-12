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
  foundTitleAt: string | null;
  foundArtistAt: string | null;
}

const ONE_POINTS = [3, 2, 1];

/**
 * Calcule les points du round courant à partir des résultats des équipes.
 * Logique pure, sans effet de bord : renvoie les points par équipe et le
 * breakdown ordonné par total (les totaux sont calculés par l'appelant).
 */
export function computeRoundScoring(input: ScoringInput): ScoringOutput {
  const ranked: RankedEntry[] = input.teams.map((team) => {
    const r = input.roundResults[team.id] || { foundTitleAt: null, foundArtistAt: null };

    let category: "both" | "one" | "none" = "none";
    const { foundTitleAt, foundArtistAt } = r;

    if (foundTitleAt && foundArtistAt) {
      category = "both";
    } else if (foundTitleAt || foundArtistAt) {
      category = "one";
    }
    return { teamId: team.id, name: team.name, category, foundTitleAt, foundArtistAt };
  });


  const titleRanked = ranked
    .filter((e) => e.foundTitleAt !== null)
    .sort((a, b) => new Date(a.foundTitleAt!).getTime() - new Date(b.foundTitleAt!).getTime());
  const artistRanked = ranked
    .filter((e) => e.foundArtistAt !== null)
    .sort((a, b) => new Date(a.foundArtistAt!).getTime() - new Date(b.foundArtistAt!).getTime());

  const roundPointsByTeamId: Record<string, number> = {};
  // Toutes les équipes commencent à 0 point pour ce round
  for (const team of input.teams) {
    roundPointsByTeamId[team.id] = 0;
  }

  titleRanked.forEach((entry, index) => {
    roundPointsByTeamId[entry.teamId] += ONE_POINTS[Math.min(index, ONE_POINTS.length - 1)];
  });

  artistRanked.forEach((entry, index) => {
    roundPointsByTeamId[entry.teamId] += ONE_POINTS[Math.min(index, ONE_POINTS.length - 1)];
  });

  // Le breakdown sera ordonné par total (calculé par l'appelant), on renvoie
  // ici une version non ordonnée ; l'appelant ajoute totalPoints et trie.
  return {
    roundPointsByTeamId,
    breakdown: ranked.map((entry) => ({
      teamId: entry.teamId,
      name: entry.name,
      foundTitle: !!entry.foundTitleAt,
      foundArtist: !!entry.foundArtistAt,
      roundPoints: roundPointsByTeamId[entry.teamId] || 0,
      totalPoints: 0,
    })),
  };
}
