import { useEffect, useState } from "react";
import type { DayLog, Flow } from "../lib/cycle.ts";
import { formatShort, type ISODate } from "../lib/dates.ts";
import { FLOWS, MOODS, SYMPTOMS } from "../lib/options.ts";
import { useStore } from "../lib/store.tsx";

function toggle(list: string[] | undefined, value: string): string[] {
  const set = new Set(list ?? []);
  if (set.has(value)) set.delete(value); else set.add(value);
  return [...set];
}

function Drops({ n }: { n: number }) {
  return <span className="drops" aria-hidden>{n === 0 ? "·" : "💧".repeat(n)}</span>;
}

/** Bottom sheet to log everything about one day. */
export function DaySheet({ date, onClose }: { date: ISODate; onClose: () => void }) {
  const { data, saveLog } = useStore();
  const [log, setLog] = useState<DayLog>(() => data.logs[date] ?? {});
  const [temp, setTemp] = useState(log.temperature?.toString() ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  function save() {
    const t = temp.trim() === "" ? undefined : Number(temp.replace(",", "."));
    saveLog(date, { ...log, temperature: t != null && Number.isFinite(t) ? t : undefined });
    onClose();
  }

  const setFlow = (f: Flow) => setLog({ ...log, flow: log.flow === f ? undefined : f });

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Log for ${formatShort(date)}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" aria-hidden />
        <div className="sheet-head">
          <h2>{formatShort(date)}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <section>
          <h3>Period</h3>
          <div className="chips">
            {FLOWS.map((f) => (
              <button key={f.value} className={`chip flow ${log.flow === f.value ? "on" : ""}`}
                aria-pressed={log.flow === f.value} onClick={() => setFlow(f.value)}>
                <Drops n={f.drops} /> {f.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Symptoms</h3>
          <div className="chips">
            {SYMPTOMS.map((s) => (
              <button key={s} className={`chip ${log.symptoms?.includes(s) ? "on" : ""}`}
                aria-pressed={log.symptoms?.includes(s) ?? false}
                onClick={() => setLog({ ...log, symptoms: toggle(log.symptoms, s) })}>{s}</button>
            ))}
          </div>
        </section>

        <section>
          <h3>Mood</h3>
          <div className="chips">
            {MOODS.map((m) => (
              <button key={m} className={`chip ${log.moods?.includes(m) ? "on" : ""}`}
                aria-pressed={log.moods?.includes(m) ?? false}
                onClick={() => setLog({ ...log, moods: toggle(log.moods, m) })}>{m}</button>
            ))}
          </div>
        </section>

        <section>
          <h3>Sex</h3>
          <div className="chips">
            {(["protected", "unprotected"] as const).map((v) => (
              <button key={v} className={`chip ${log.sex === v ? "on" : ""}`} aria-pressed={log.sex === v}
                onClick={() => setLog({ ...log, sex: log.sex === v ? undefined : v })}>
                {v === "protected" ? "Protected" : "Unprotected"}
              </button>
            ))}
          </div>
        </section>

        <section className="two-col">
          <label>Temperature
            <input inputMode="decimal" placeholder="e.g. 36.5" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </label>
        </section>

        <section>
          <label>Notes
            <textarea rows={3} placeholder="Anything else about today…" value={log.notes ?? ""}
              onChange={(e) => setLog({ ...log, notes: e.target.value })} />
          </label>
        </section>

        <div className="sheet-actions">
          <button className="btn primary full" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
