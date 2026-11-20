import { useState } from "react";
import { APP_NAME, APP_TAGLINE } from "../config.ts";
import type { Logs } from "../lib/cycle.ts";
import { addDays, diffDays, isValidISO, todayISO } from "../lib/dates.ts";
import { useStore } from "../lib/store.tsx";

export function Onboarding() {
  const { setOnboarded } = useStore();
  const today = todayISO();
  const [step, setStep] = useState(0);
  const [lastStart, setLastStart] = useState("");
  const [periodLength, setPeriodLength] = useState(5);
  const [cycleLength, setCycleLength] = useState(28);
  const [error, setError] = useState<string | null>(null);

  function finish(cycle = cycleLength) {
    const logs: Logs = {};
    if (lastStart) {
      if (!isValidISO(lastStart) || lastStart > today) { setError("Pick a date that isn't in the future."); return; }
      if (diffDays(lastStart, today) > 120) { setError("That's over 4 months ago. Pick your most recent period, or skip."); return; }
      const days = Math.min(periodLength, diffDays(lastStart, today) + 1);
      for (let i = 0; i < days; i++) logs[addDays(lastStart, i)] = { flow: "medium" };
    }
    setOnboarded(logs, { cycleLength: cycle, periodLength });
  }

  return (
    <div className="onboarding">
      {step === 0 && (
        <div className="ob-step">
          <div className="ob-logo" aria-hidden>🌙</div>
          <h1>{APP_NAME}</h1>
          <p className="lead">{APP_TAGLINE}</p>
          <ul className="ob-points">
            <li>🔮 Predicts your next period and fertile window</li>
            <li>📝 Log flow, symptoms, mood and notes in seconds</li>
            <li>🔒 Your data stays on your phone: no account, no cloud, no tracking</li>
          </ul>
          <button className="btn primary full" onClick={() => setStep(1)}>Get started</button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-step">
          <h2>When did your last period start?</h2>
          <input type="date" max={today} value={lastStart} onChange={(e) => { setLastStart(e.target.value); setError(null); }}
            aria-label="Last period start date" />
          <label className="ob-label">How many days does it usually last?
            <div className="stepper-ctl big">
              <button className="icon-btn" onClick={() => setPeriodLength(Math.max(1, periodLength - 1))} aria-label="Fewer days">−</button>
              <span>{periodLength} days</span>
              <button className="icon-btn" onClick={() => setPeriodLength(Math.min(12, periodLength + 1))} aria-label="More days">+</button>
            </div>
          </label>
          {error && <p className="notice warn">{error}</p>}
          <button className="btn primary full" disabled={!lastStart} onClick={() => setStep(2)}>Next</button>
          <button className="link" onClick={() => { setLastStart(""); setStep(2); }}>I don't remember</button>
        </div>
      )}

      {step === 2 && (
        <div className="ob-step">
          <h2>How long is your cycle usually?</h2>
          <p className="muted">From the first day of one period to the first day of the next. Most are 21–35 days.</p>
          <div className="stepper-ctl big">
            <button className="icon-btn" onClick={() => setCycleLength(Math.max(15, cycleLength - 1))} aria-label="Shorter">−</button>
            <span>{cycleLength} days</span>
            <button className="icon-btn" onClick={() => setCycleLength(Math.min(60, cycleLength + 1))} aria-label="Longer">+</button>
          </div>
          {error && <p className="notice warn">{error}</p>}
          <button className="btn primary full" onClick={() => finish()}>Start tracking</button>
          <button className="link" onClick={() => finish(28)}>Not sure (use 28)</button>
          <p className="muted small">{APP_NAME} learns your real cycle as you log. This is just a starting point.</p>
        </div>
      )}
    </div>
  );
}
