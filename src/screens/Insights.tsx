import { formatDayMonth } from "../lib/dates.ts";
import { useStore } from "../lib/store.tsx";
import { useCycle } from "../lib/useCycle.ts";

export function Insights() {
  const { data } = useStore();
  const { periods, stats } = useCycle();

  const cycles = periods.slice(0, -1).map((p, i) => ({
    start: p.start, length: stats.cycleLengths[i], periodLength: p.length,
  })).filter((c) => c.length).slice(-8).reverse();
  const maxLen = Math.max(35, ...cycles.map((c) => c.length));

  const counts = (key: "symptoms" | "moods") => {
    const m = new Map<string, number>();
    for (const log of Object.values(data.logs)) for (const v of log[key] ?? []) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  };
  const symptoms = counts("symptoms");
  const moods = counts("moods");
  const regular = stats.shortest != null && stats.longest != null && stats.longest - stats.shortest <= 7;

  return (
    <div className="screen insights">
      <h1>Insights</h1>

      <div className="stat-grid">
        <div className="card stat"><span className="muted">Average cycle</span><strong>{stats.avgCycle} days</strong></div>
        <div className="card stat"><span className="muted">Average period</span><strong>{stats.avgPeriod} days</strong></div>
        <div className="card stat"><span className="muted">Cycles logged</span><strong>{stats.cycleLengths.length}</strong></div>
        <div className="card stat">
          <span className="muted">Range</span>
          <strong>{stats.shortest != null ? `${stats.shortest}–${stats.longest}` : "—"}</strong>
        </div>
      </div>

      {!stats.usedHistory ? (
        <div className="card">
          <h3>Keep logging</h3>
          <p className="muted">Log at least two periods to see your real averages. Until then, predictions use your settings.</p>
        </div>
      ) : (
        <div className="card">
          <h3>Cycle regularity</h3>
          <p className="muted">
            {regular
              ? "Your cycles vary by a week or less, which is considered regular."
              : "Your cycle length varies by more than a week. Stress, travel and illness can cause this; if it continues, consider talking to a clinician."}
          </p>
        </div>
      )}

      {cycles.length > 0 && (
        <div className="card">
          <h3>Recent cycles</h3>
          <ul className="cycle-bars">
            {cycles.map((c) => (
              <li key={c.start}>
                <span className="cb-label">{formatDayMonth(c.start)}</span>
                <span className="cb-bar" style={{ width: `${(c.length / maxLen) * 100}%` }}>
                  <span className="cb-period" style={{ width: `${(c.periodLength / c.length) * 100}%` }} />
                </span>
                <span className="cb-len">{c.length}d</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(symptoms.length > 0 || moods.length > 0) && (
        <div className="card">
          <h3>Most logged</h3>
          {symptoms.length > 0 && <p className="tags">{symptoms.map(([s, n]) => <span key={s} className="tag">{s} · {n}</span>)}</p>}
          {moods.length > 0 && <p className="tags">{moods.map(([s, n]) => <span key={s} className="tag">{s} · {n}</span>)}</p>}
        </div>
      )}

      <p className="muted small center">For information only. Not medical advice or a method of contraception.</p>
    </div>
  );
}
