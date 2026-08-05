import { useCallback, useEffect, useState } from "react";
import type { GameStatusResponse } from "@shared/types";
import { getGameStatus } from "../api/endpoints";
import { usePolling } from "./usePolling";

interface UseGameStatusResult {
  status: GameStatusResponse | null;
  loading: boolean;
  connectionLost: boolean;
  refresh: () => void;
}

/**
 * Polling factorisé de l'état de la partie. Tous les écrans (TeamsList,
 * Admin, Game) consomment ce hook. Détecte une perte de connexion.
 */
export function useGameStatus(intervalMs = 1000): UseGameStatusResult {
  const [status, setStatus] = useState<GameStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getGameStatus();
      setStatus(data);
      setConnectionLost(false);
    } catch {
      setConnectionLost(true);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(refresh, intervalMs);

  // Premier chargement immédiat (usePolling le fait déjà, mais on s'assure
  // que l'état de chargement initial est correct).
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, connectionLost, refresh: () => void refresh() };
}
