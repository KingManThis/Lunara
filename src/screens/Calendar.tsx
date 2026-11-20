import { useState } from "react";
import { DaySheet } from "../components/DaySheet.tsx";
import { dayKind } from "../lib/cycle.ts";
import { addDays, addMonths, daysInMonth, formatMonth, formatShort, monthStart, WEEKDAYS, weekday } from "../lib/dates.ts";
import { useStore } from "../lib/store.tsx";
import { useCycle } from "../lib/useCycle.ts";

export function Calendar() {
  const { data } = useStore();
  const { today, prediction } = useCycle();
  const [month, setMonth] = useState(monthStart(today));
  const [sheet, setSheet] = useState<string | null>(null);

  const lead = weekday(month);
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => addDays(month, i));

  return (
    <div className="screen calendar">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">‹</button>
        <h2>{formatMonth(month)}</h2>
        <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">›</button>
      </div>
      {month !== monthStart(today) && (
        <button className="link center-block" onClick={() => setMonth(monthStart(today))}>Back to today</button>
      )}

      <div className="cal-grid" role="grid">
        {WEEKDAYS.map((w) => <div key={w} className="cal-wd" role="columnheader">{w[0]}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`pad${i}`} />)}
        {days.map((d) => {
          const k = dayKind(d, data.logs, prediction, today);
          const log = data.logs[d];
          const hasNotes = Boolean(log?.symptoms?.length || log?.moods?.length || log?.notes || log?.sex);
          const cls = [
            "cal-day",
            k.period && "period",
            k.spotting && "spotting",
            k.predictedPeriod && "predicted",
            !k.period && !k.predictedPeriod && k.fertile && "fertile",
            k.ovulation && "ovulation",
            d === today && "is-today",
            d > today && "future",
          ].filter(Boolean).join(" ");
          return (
            <button key={d} className={cls} role="gridcell" disabled={d > today}
              aria-label={`${formatShort(d)}${k.period ? ", period" : k.predictedPeriod ? ", predicted period" : k.ovulation ? ", ovulation" : k.fertile ? ", fertile" : ""}`}
              onClick={() => setSheet(d)}>
              <span>{Number(d.slice(8))}</span>
              {hasNotes && <i className="note-dot" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="legend">
        <span><i className="key period" /> Period</span>
        <span><i className="key predicted" /> Predicted</span>
        <span><i className="key fertile" /> Fertile</span>
        <span><i className="key ovulation" /> Ovulation</span>
        <span><i className="key notes" /> Notes</span>
      </div>
      <p className="muted small center">Tap a day to log or edit it. Predictions are estimates.</p>

      {sheet && <DaySheet date={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
