// All data lives on this device (localStorage). Nothing is sent anywhere.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CycleSettings, DayLog, Logs } from "./cycle.ts";
import type { ISODate } from "./dates.ts";

export type Lock = { salt: string; hash: string };

export type Data = {
  version: 1;
  onboarded: boolean;
  settings: CycleSettings;
  logs: Logs;
  lock: Lock | null;
};

const KEY = "lunara-data-v1";

export const DEFAULT_DATA: Data = {
  version: 1,
  onboarded: false,
  settings: { cycleLength: 28, periodLength: 5, lutealLength: 14 },
  logs: {},
  lock: null,
};

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DATA;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_DATA;
  }
}

const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;

/** Validate data from storage or an imported backup. Throws on anything that isn't ours. */
export function sanitize(input: unknown): Data {
  if (!input || typeof input !== "object") throw new Error("Not a valid backup file.");
  const o = input as Partial<Data>;
  if (o.version !== 1 || typeof o.logs !== "object" || o.logs === null) throw new Error("Not a valid backup file.");
  const logs: Logs = {};
  for (const [date, log] of Object.entries(o.logs)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !log || typeof log !== "object") continue;
    const l = log as DayLog;
    const clean: DayLog = {};
    if (l.flow && ["spotting", "light", "medium", "heavy"].includes(l.flow)) clean.flow = l.flow;
    if (Array.isArray(l.symptoms)) clean.symptoms = l.symptoms.filter((s) => typeof s === "string").slice(0, 30);
    if (Array.isArray(l.moods)) clean.moods = l.moods.filter((s) => typeof s === "string").slice(0, 30);
    if (l.sex === "protected" || l.sex === "unprotected") clean.sex = l.sex;
    if (typeof l.temperature === "number" && Number.isFinite(l.temperature)) clean.temperature = l.temperature;
    if (typeof l.notes === "string" && l.notes.trim()) clean.notes = l.notes.slice(0, 2000);
    if (Object.keys(clean).length) logs[date] = clean;
  }
  const s = (o.settings ?? {}) as Partial<CycleSettings>;
  return {
    version: 1,
    onboarded: Boolean(o.onboarded),
    settings: {
      cycleLength: clamp(s.cycleLength, 15, 60, 28),
      periodLength: clamp(s.periodLength, 1, 12, 5),
      lutealLength: clamp(s.lutealLength, 9, 18, 14),
    },
    logs,
    lock: o.lock && typeof o.lock.salt === "string" && typeof o.lock.hash === "string" ? o.lock : null,
  };
}

type Store = {
  data: Data;
  saveLog: (date: ISODate, log: DayLog) => void;
  setSettings: (s: Partial<CycleSettings>) => void;
  setOnboarded: (logs: Logs, s: Partial<CycleSettings>) => void;
  setLock: (lock: Lock | null) => void;
  replaceAll: (d: Data) => void;
  resetAll: () => void;
  storageOk: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageOk(true);
    } catch {
      setStorageOk(false); // private browsing or storage full
    }
  }, [data]);

  const saveLog = useCallback((date: ISODate, log: DayLog) => {
    setData((d) => {
      const logs = { ...d.logs };
      const empty = !log.flow && !log.symptoms?.length && !log.moods?.length && !log.sex &&
        log.temperature == null && !log.notes?.trim();
      if (empty) delete logs[date];
      else logs[date] = log;
      return { ...d, logs };
    });
  }, []);

  const store = useMemo<Store>(() => ({
    data,
    storageOk,
    saveLog,
    setSettings: (s) => setData((d) => ({ ...d, settings: { ...d.settings, ...s } })),
    setOnboarded: (logs, s) => setData((d) => ({
      ...d, onboarded: true, settings: { ...d.settings, ...s }, logs: { ...d.logs, ...logs },
    })),
    setLock: (lock) => setData((d) => ({ ...d, lock })),
    replaceAll: (next) => setData(next),
    resetAll: () => setData(DEFAULT_DATA),
  }), [data, storageOk, saveLog]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
