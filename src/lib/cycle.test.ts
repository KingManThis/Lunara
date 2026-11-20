// Run with: npm test
import { addDays, diffDays, addMonths, isValidISO } from "./dates.ts";
import { dayKind, getPeriods, getStats, getStatus, predictCycles, type Logs } from "./cycle.ts";

let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log("ok  ", name);
  else { failed++; console.log("FAIL", name, detail ?? ""); }
}

const settings = { cycleLength: 28, periodLength: 5, lutealLength: 14 };
const period = (logs: Logs, start: string, days: number, flow: "light" | "medium" | "heavy" = "medium") => {
  for (let i = 0; i < days; i++) logs[addDays(start, i)] = { flow };
};

// --- dates ---
check("addDays across month/year", addDays("2026-12-30", 3) === "2027-01-02");
check("addDays leap day", addDays("2028-02-28", 1) === "2028-02-29");
check("diffDays across DST (US March)", diffDays("2026-03-07", "2026-03-09") === 2);
check("addMonths wraps year", addMonths("2026-11-01", 2) === "2027-01-01" && addMonths("2026-01-01", -1) === "2025-12-01");
check("isValidISO rejects Feb 30", !isValidISO("2026-02-30") && isValidISO("2026-02-28"));

// --- periods ---
{
  const logs: Logs = {};
  period(logs, "2026-09-01", 5);
  logs["2026-09-07"] = { flow: "light" }; // 1-day pause, same period
  logs["2026-09-20"] = { flow: "spotting" }; // spotting never starts a period
  period(logs, "2026-09-29", 4);
  logs["2026-10-05"] = { symptoms: ["cramps"] }; // non-flow log ignored
  const ps = getPeriods(logs);
  check("groups days and bridges a short gap", ps.length === 2 && ps[0].end === "2026-09-07" && ps[0].length === 7, ps);
  check("spotting alone isn't a period", !ps.some((p) => p.start === "2026-09-20"));
}

// --- stats + predictions with regular 30-day cycles ---
{
  const logs: Logs = {};
  for (const s of ["2026-06-01", "2026-07-01", "2026-07-31", "2026-08-30", "2026-09-29", "2026-10-29"]) period(logs, s, 5);
  const today = "2026-11-10";
  const ps = getPeriods(logs);
  const st = getStats(ps, settings, today);
  check("average cycle from history = 30", st.avgCycle === 30 && st.usedHistory, st);
  check("average period = 5", st.avgPeriod === 5, st);
  const status = getStatus(ps, st, settings, today);
  check("cycle day 13", status.cycleDay === 13, status);
  check("next period Nov 28 in 18 days", status.nextStart === "2026-11-28" && status.daysUntilNext === 18, status);
  check("ovulation Nov 14, fertile window Nov 9–15 → fertile today", status.fertileToday && status.phase === "fertile" && status.daysUntilOvulation === 4, status);
  const pred = predictCycles(ps, st, settings, today);
  check("upcoming cycles every 30 days", pred.upcoming[0].start === "2026-11-28" && pred.upcoming[1].start === "2026-12-28", pred.upcoming.slice(0, 2));
  const k = dayKind("2026-11-29", logs, pred, today);
  check("calendar marks predicted period", k.predictedPeriod && !k.period, k);
  check("calendar marks ovulation", dayKind("2026-11-14", logs, pred, today).ovulation);
  check("past logged day shows as period", dayKind("2026-10-30", logs, pred, today).period);
}

// --- outliers ignored, defaults without history ---
{
  const logs: Logs = {};
  period(logs, "2026-01-01", 4);
  period(logs, "2026-01-29", 4); // 28
  period(logs, "2026-05-01", 4); // 92: missed logging, ignored
  period(logs, "2026-05-27", 4); // 26
  const st = getStats(getPeriods(logs), settings, "2026-06-10");
  check("ignores implausible 92-day cycle", st.avgCycle === 27 && st.longest === 28, st);

  const one: Logs = {}; period(one, "2026-11-01", 5);
  const st1 = getStats(getPeriods(one), settings, "2026-11-03");
  check("one period → uses settings (28)", st1.avgCycle === 28 && !st1.usedHistory);
  const s1 = getStatus(getPeriods(one), st1, settings, "2026-11-03");
  check("in period on day 3", s1.inPeriod && s1.periodDay === 3, s1);
}

// --- late period ---
{
  const logs: Logs = {};
  period(logs, "2026-10-01", 5);
  const today = "2026-11-02"; // expected Oct 29
  const ps = getPeriods(logs);
  const st = getStats(ps, settings, today);
  const s = getStatus(ps, st, settings, today);
  check("late by 4 days", s.daysUntilNext === -4 && s.phase === "luteal" && !s.fertileToday, s);
  const pred = predictCycles(ps, st, settings, today);
  check("late: next prediction starts tomorrow", pred.upcoming[0].start === "2026-11-03", pred.upcoming[0]);
}

// --- no data ---
{
  const s = getStatus([], getStats([], settings, "2026-11-20"), settings, "2026-11-20");
  check("no data → empty status", s.cycleDay === null && s.nextStart === null);
}

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nall passed");
