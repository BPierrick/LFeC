import { useCallback, useEffect, useState } from "react";
import type { Team } from "@shared/types";
import { getTeam } from "../api/endpoints";

/**
 * Récupère l'équipe de la session courante. Renvoie `teamId` pour le
 * surlignage dans le scoreboard.
 */
export function useTeam() {
  const [team, setTeam] = useState<Team | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getTeam();
      setTeam(data.team);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { team, teamId: team?.id ?? null, refresh: () => void refresh() };
}
