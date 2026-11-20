import { useState } from "react";
import { CycleRing } from "../components/CycleRing.tsx";
import { DaySheet } from "../components/DaySheet.tsx";
import { dayKind, isBleeding } from "../lib/cycle.ts";
import { addDays, formatDayMonth, formatShort, WEEKDAYS, weekday } from "../lib/dates.ts";
import { useStore } from "../lib/store.tsx";
import { useCycle } from "../lib/useCycle.ts";

const PHASE_TEXT = {
  menstrual: { name: "Period", tip: "Rest, stay hydrated and keep warm. Gentle movement can ease cramps." },
  follicular: { name: "Follicular phase", tip: "Energy often rises as estrogen climbs. A good time for new plans." },
  fertile: { name: "Fertile window", tip: "Pregnancy is most likely around now. Predictions aren't contraception." },
  luteal: { name: "Luteal phase", tip: "PMS symptoms like bloating or mood changes can show up before your period." },
};

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function Today() {
  const { data, saveLog } = useStore();
  const { today, status, stats, prediction } = useCycle();
  const [sheet, setSheet] = useState<string | null>(null);
  const todayLog = data.logs[today];
  const bleedingToday = isBleeding(todayLog);

  let headline: string;
  let sub: string;
  if (status.cycleDay == null) {
    headline = "Welcome";
    sub = "Log your period to start predictions";
  } else if (status.inPeriod) {
    headline = `Period day ${status.periodDay}`;
    sub = `Cycle day ${status.cycleDay}`;
  } else if (status.daysUntilNext! < 0) {
    headline = `${plural(-status.daysUntilNext!, "day")} late`;
    sub = `Expected ${formatDayMonth(status.nextStart!)}`;
  } else if (status.daysUntilNext === 0) {
    headline = "Period expected today";
    sub = `Cycle day ${status.cycleDay}`;
  } else {
    headline = `Period in ${plural(status.daysUntilNext!, "day")}`;
    sub = `Cycle day ${status.cycleDay} · ${formatDayMonth(status.nextStart!)}`;
  }

  function togglePeriodToday() {
    saveLog(today, { ...todayLog, flow: bleedingToday ? undefined : "medium" });
  }

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));
  const phase = status.phase ? PHASE_TEXT[status.phase] : null;
  const next = prediction.upcoming[0];
  const nextFertile = [prediction.current, ...prediction.upcoming]
    .find((c) => c && c.fertileStart > today)?.fertileStart;

  return (
    <div className="screen today">
      <p className="date-label">{formatShort(today)}</p>

      <div className="week">
        {week.map((d) => {
          const k = dayKind(d, data.logs, prediction, today);
          return (
            <button key={d} className={`week-day ${d === today ? "is-today" : ""}`} onClick={() => setSheet(d)}
              disabled={d > today} aria-label={`Log ${formatShort(d)}`}>
              <span className="wd">{WEEKDAYS[weekday(d)][0]}</span>
              <span className={`dot ${k.period ? "period" : k.predictedPeriod ? "predicted" : k.ovulation ? "ovulation" : k.fertile ? "fertile" : ""}`}>
                {Number(d.slice(8))}
              </span>
            </button>
          );
        })}
      </div>

      <CycleRing status={status} stats={stats} lutealLength={data.settings.lutealLength}>
        <div className="ring-headline">{headline}</div>
        <div className="ring-sub">{sub}</div>
        {status.cycleDay != null && !status.inPeriod && status.fertileToday && (
          <div className="pill fertile">{status.ovulationToday ? "Ovulation day" : "Fertile window"}</div>
        )}
        {status.inPeriod && <div className="pill period">On your period</div>}
      </CycleRing>

      <div className="actions">
        <button className={`btn ${bleedingToday ? "secondary" : "primary"}`} onClick={togglePeriodToday}>
          {bleedingToday ? "✓ Period logged today" : status.inPeriod || (status.daysUntilNext ?? 99) <= 3 ? "🩸 Period started" : "🩸 Log period"}
        </button>
        <button className="btn secondary" onClick={() => setSheet(today)}>＋ Symptoms & mood</button>
      </div>

      {todayLog && (todayLog.symptoms?.length || todayLog.moods?.length || todayLog.notes) ? (
        <div className="card today-log" onClick={() => setSheet(today)} role="button" tabIndex={0}>
          <h3>Today</h3>
          <div className="tags">
            {[...(todayLog.symptoms ?? []), ...(todayLog.moods ?? [])].map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          {todayLog.notes && <p className="muted">{todayLog.notes}</p>}
        </div>
      ) : null}

      {phase && (
        <div className="card">
          <h3>{phase.name}</h3>
          <p className="muted">{phase.tip}</p>
        </div>
      )}

      {next && (
        <div className="card upcoming">
          <h3>Coming up</h3>
          <ul>
            <li><span className="key period" /> Next period <b>{formatDayMonth(next.start)}</b></li>
            {status.daysUntilOvulation != null && (
              <li><span className="key ovulation" /> Ovulation <b>{status.daysUntilOvulation === 0 ? "today" : `in ${plural(status.daysUntilOvulation, "day")}`}</b></li>
            )}
            <li><span className="key fertile" /> Fertile window <b>{status.fertileToday ? "now" : nextFertile ? formatDayMonth(nextFertile) : "—"}</b></li>
          </ul>
          {!stats.usedHistory && <p className="muted small">Predictions use your settings until you've logged two periods.</p>}
        </div>
      )}

      {sheet && <DaySheet date={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
