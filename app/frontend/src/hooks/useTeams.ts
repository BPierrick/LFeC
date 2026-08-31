import { useCallback, useEffect, useState } from "react";
import type { Team } from "@shared/types";
import { getTeams } from "../api/endpoints";
import { usePolling } from "./usePolling";

interface UseTeamsResult {
  teams: Team[];
  refresh: () => void;
}

export function useTeams(intervalMs = 2000): UseTeamsResult {
    const [teams, setTeams] = useState<Team[]>([]);

    const refresh = useCallback(async () => {
        try {
            const data = await getTeams();
            setTeams(data.teams);
        } catch {
            // ignore
        }
    }, []);

    usePolling(refresh, intervalMs);

    // Premier chargement immédiat (usePolling le fait déjà, mais on s'assure
    // que l'état de chargement initial est correct).
    useEffect(() => {
        refresh();
    }, [refresh]);

    return {teams, refresh: () => void refresh()};
}
