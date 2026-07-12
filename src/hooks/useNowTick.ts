import { useEffect, useState } from 'react';

/** Forces a periodic re-render so time-derived UI (overdue flags, countdowns) stays live. */
export function useNowTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}
