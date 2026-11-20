import { useMemo } from "react";
import { getPeriods, getStats, getStatus, predictCycles } from "./cycle.ts";
import { todayISO } from "./dates.ts";
import { useStore } from "./store.tsx";

/** Everything derived from the logs, recalculated only when data changes. */
export function useCycle() {
  const { data } = useStore();
  const today = todayISO();
  return useMemo(() => {
    const periods = getPeriods(data.logs);
    const stats = getStats(periods, data.settings, today);
    const status = getStatus(periods, stats, data.settings, today);
    const prediction = predictCycles(periods, stats, data.settings, today, 12);
    return { today, periods, stats, status, prediction };
  }, [data.logs, data.settings, today]);
}
