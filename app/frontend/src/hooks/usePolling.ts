import { useEffect, useRef } from "react";

/**
 * Invoque `callback` toutes les `intervalMs` millisecondes, immédiatement
 * au montage. Gère proprement le cleanup et évite les chevauchements.
 */
export function usePolling(callback: () => void, intervalMs: number): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    tick();
    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
}
