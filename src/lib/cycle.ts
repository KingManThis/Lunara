// Cycle engine: turns logged days into periods, averages and predictions.
// Pure functions (no browser APIs) so they're easy to test.
//
// Method (the standard calendar method used by most trackers):
// - A period is a run of logged bleeding days (light/medium/heavy); gaps of up to 2 days are bridged.
// - Cycle length = days between consecutive period starts; the average uses the last 6 plausible cycles (15–60 days).
// - Next period = last start + average cycle length.
// - Ovulation ≈ next period start − luteal phase (default 14 days); fertile window = 5 days before ovulation to 1 day after.
// These are estimates, not medical advice or contraception.

import { addDays, diffDays, type ISODate } from "./dates.ts";

export type Flow = "spotting" | "light" | "medium" | "heavy";

export type DayLog = {
  flow?: Flow;
  symptoms?: string[];
  moods?: string[];
  sex?: "protected" | "unprotected";
  temperature?: number; // basal body temperature, user's unit
  notes?: string;
};

export type Logs = Record<ISODate, DayLog>;

export type CycleSettings = {
  cycleLength: number; // used until there's enough history
  periodLength: number;
  lutealLength: number;
};

export type Period = { start: ISODate; end: ISODate; length: number };

export type Stats = {
  avgCycle: number;
  avgPeriod: number;
  cycleLengths: number[]; // all completed cycles, oldest first
  usedHistory: boolean; // true when averages come from logged cycles rather than settings
  shortest: number | null;
  longest: number | null;
};

export type PredictedCycle = {
  start: ISODate;
  end: ISODate;
  ovulation: ISODate;
  fertileStart: ISODate;
  fertileEnd: ISODate;
};

export type Phase = "menstrual" | "follicular" | "fertile" | "luteal";

export type Status = {
  cycleDay: number | null;
  inPeriod: boolean;
  periodDay: number | null;
  daysUntilNext: number | null; // negative = late
  nextStart: ISODate | null;
  phase: Phase | null;
  fertileToday: boolean;
  ovulationToday: boolean;
  daysUntilOvulation: number | null;
};

const BLEEDING: Flow[] = ["light", "medium", "heavy"];
const MAX_GAP = 2; // a 1–2 day pause still counts as the same period
const MIN_CYCLE = 15;
const MAX_CYCLE = 60;
const HISTORY = 6;

export const isBleeding = (log?: DayLog) => Boolean(log?.flow && BLEEDING.includes(log.flow));

export function getPeriods(logs: Logs): Period[] {
  const days = Object.keys(logs).filter((d) => isBleeding(logs[d])).sort();
  const periods: Period[] = [];
  for (const day of days) {
    const last = periods[periods.length - 1];
    if (last && diffDays(last.end, day) <= MAX_GAP + 1) {
      last.end = day;
      last.length = diffDays(last.start, day) + 1;
    } else {
      periods.push({ start: day, end: day, length: 1 });
    }
  }
  return periods;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function getStats(periods: Period[], settings: CycleSettings, today: ISODate): Stats {
  const cycleLengths: number[] = [];
  for (let i = 1; i < periods.length; i++) cycleLengths.push(diffDays(periods[i - 1].start, periods[i].start));
  const plausible = cycleLengths.filter((c) => c >= MIN_CYCLE && c <= MAX_CYCLE).slice(-HISTORY);

  // Only count finished periods for the average length (the current one may still be going).
  const finished = periods.filter((p) => diffDays(p.end, today) > MAX_GAP).slice(-HISTORY);
  const periodLengths = finished.map((p) => p.length).filter((l) => l >= 1 && l <= 12);

  return {
    avgCycle: plausible.length ? Math.round(mean(plausible)) : settings.cycleLength,
    avgPeriod: periodLengths.length ? Math.round(mean(periodLengths)) : settings.periodLength,
    cycleLengths,
    usedHistory: plausible.length > 0,
    shortest: plausible.length ? Math.min(...plausible) : null,
    longest: plausible.length ? Math.max(...plausible) : null,
  };
}

function cycleFrom(start: ISODate, stats: Stats, settings: CycleSettings): PredictedCycle {
  const nextStart = addDays(start, stats.avgCycle);
  const ovulation = addDays(nextStart, -settings.lutealLength);
  return {
    start,
    end: addDays(start, stats.avgPeriod - 1),
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
  };
}

/**
 * The current cycle (from the last logged period) plus `count` predicted future cycles.
 * If the next period is late, predictions restart from tomorrow so the calendar stays useful.
 */
export function predictCycles(
  periods: Period[], stats: Stats, settings: CycleSettings, today: ISODate, count = 6,
): { current: PredictedCycle | null; upcoming: PredictedCycle[] } {
  const last = periods[periods.length - 1];
  if (!last) return { current: null, upcoming: [] };
  const current = { ...cycleFrom(last.start, stats, settings), end: last.end };
  let nextStart = addDays(last.start, stats.avgCycle);
  if (diffDays(today, nextStart) < 0) nextStart = addDays(today, 1);
  const upcoming: PredictedCycle[] = [];
  for (let i = 0; i < count; i++) {
    upcoming.push(cycleFrom(nextStart, stats, settings));
    nextStart = addDays(nextStart, stats.avgCycle);
  }
  return { current, upcoming };
}

const within = (d: ISODate, a: ISODate, b: ISODate) => d >= a && d <= b;

export function getStatus(periods: Period[], stats: Stats, settings: CycleSettings, today: ISODate): Status {
  const last = periods[periods.length - 1];
  const empty: Status = {
    cycleDay: null, inPeriod: false, periodDay: null, daysUntilNext: null, nextStart: null,
    phase: null, fertileToday: false, ovulationToday: false, daysUntilOvulation: null,
  };
  if (!last || last.start > today) return empty;

  const cycleDay = diffDays(last.start, today) + 1;
  const nextStart = addDays(last.start, stats.avgCycle);
  const daysUntilNext = diffDays(today, nextStart);
  // In period if today is inside the logged run, or the period started recently and could still be going.
  const inPeriod = within(today, last.start, last.end) ||
    (diffDays(last.end, today) <= 1 && cycleDay <= Math.max(stats.avgPeriod, last.length));
  const ovulation = addDays(nextStart, -settings.lutealLength);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const fertileToday = !inPeriod && daysUntilNext >= 0 && within(today, fertileStart, fertileEnd);
  const phase: Phase = inPeriod ? "menstrual" : fertileToday ? "fertile" : today < fertileStart ? "follicular" : "luteal";

  return {
    cycleDay,
    inPeriod,
    periodDay: inPeriod ? cycleDay : null,
    daysUntilNext,
    nextStart,
    phase,
    fertileToday,
    ovulationToday: today === ovulation,
    daysUntilOvulation: diffDays(today, ovulation) >= 0 ? diffDays(today, ovulation) : null,
  };
}

export type DayKind = {
  period: boolean; // logged bleeding
  spotting: boolean;
  predictedPeriod: boolean;
  fertile: boolean;
  ovulation: boolean;
};

/** What to show on a calendar day. Predictions are only shown for today and later. */
export function dayKind(
  day: ISODate, logs: Logs, prediction: ReturnType<typeof predictCycles>, today: ISODate,
): DayKind {
  const log = logs[day];
  const k: DayKind = {
    period: isBleeding(log), spotting: log?.flow === "spotting",
    predictedPeriod: false, fertile: false, ovulation: false,
  };
  const cycles = [...(prediction.current ? [prediction.current] : []), ...prediction.upcoming];
  for (const c of cycles) {
    if (day >= today && !k.period && c !== prediction.current && within(day, c.start, c.end)) k.predictedPeriod = true;
    if (!k.period && within(day, c.fertileStart, c.fertileEnd)) k.fertile = true;
    if (day === c.ovulation && !k.period) k.ovulation = true;
  }
  return k;
}
