import { describe, it, expect } from "vitest";
import { computeRoundScoring } from "../src/services/scoring.service";
import type { Team } from "../../shared/types";
import type { RoundResult } from "../src/types";

function makeTeam(id: string): Team {
  return { id, name: id, createdAt: new Date().toISOString() };
}

function result(titleAt: string | null, artistAt: string | null): RoundResult {
  return { foundTitleAt: titleAt, foundArtistAt: artistAt };
}

const T0 = "2024-01-01T00:00:00.000Z";
const T1 = "2024-01-01T00:00:01.000Z";
const T2 = "2024-01-01T00:00:02.000Z";
const T3 = "2024-01-01T00:00:03.000Z";

describe("computeRoundScoring", () => {
  it("donne 0 point à une équipe qui n'a rien trouvé", () => {
    const teams = [makeTeam("a")];
    const roundResults: Record<string, RoundResult> = {
      a: result(null, null),
    };
    const out = computeRoundScoring({ teams, roundResults });
    expect(out.roundPointsByTeamId.a).toBe(0);
  });

  it("donne 7 points à la 1re équipe 'both'", () => {
    const teams = [makeTeam("a")];
    const out = computeRoundScoring({ teams, roundResults: { a: result(T0, T1) } });
    expect(out.roundPointsByTeamId.a).toBe(7);
  });

  it("both : 1er=7, 2e=6, autres=5 (tri par temps de complétion)", () => {
    const teams = [makeTeam("a"), makeTeam("b"), makeTeam("c")];
    const roundResults = {
      a: result(T0, T2), // complétion à T2
      b: result(T0, T1), // complétion à T1 -> 1er
      c: result(T0, T3), // complétion à T3
    };
    const out = computeRoundScoring({ teams, roundResults });
    expect(out.roundPointsByTeamId.b).toBe(7);
    expect(out.roundPointsByTeamId.a).toBe(6);
    expect(out.roundPointsByTeamId.c).toBe(5);
  });

  it("one : 1er=3, 2e=2, autres=1", () => {
    const teams = [makeTeam("a"), makeTeam("b"), makeTeam("c"), makeTeam("d")];
    const roundResults = {
      a: result(T3, null), // titre à T3
      b: result(T1, null), // titre à T1 -> 1er
      c: result(T2, null), // titre à T2
      d: result(null, null),
    };
    const out = computeRoundScoring({ teams, roundResults });
    expect(out.roundPointsByTeamId.b).toBe(3);
    expect(out.roundPointsByTeamId.c).toBe(2);
    expect(out.roundPointsByTeamId.a).toBe(1);
    expect(out.roundPointsByTeamId.d).toBe(0);
  });

  it("catégorise both et one indépendamment", () => {
    const teams = [makeTeam("both1"), makeTeam("one1"), makeTeam("none")];
    const roundResults = {
      both1: result(T0, T1),
      one1: result(T0, null),
      none: result(null, null),
    };
    const out = computeRoundScoring({ teams, roundResults });
    expect(out.roundPointsByTeamId.both1).toBe(7);
    expect(out.roundPointsByTeamId.one1).toBe(3);
    expect(out.roundPointsByTeamId.none).toBe(0);
  });

  it("ne crash pas si une équipe est absente des roundResults", () => {
    const teams = [makeTeam("a")];
    const out = computeRoundScoring({ teams, roundResults: {} });
    expect(out.roundPointsByTeamId.a ?? 0).toBe(0);
  });
});
