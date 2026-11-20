import { useRef, useState } from "react";
import { APP_NAME } from "../config.ts";
import { todayISO } from "../lib/dates.ts";
import { makeLock } from "../lib/lock.ts";
import { sanitize, useStore } from "../lib/store.tsx";

function Stepper({ label, value, min, max, onChange, hint }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void; hint?: string;
}) {
  return (
    <div className="stepper">
      <div>
        <div>{label}</div>
        {hint && <div className="muted small">{hint}</div>}
      </div>
      <div className="stepper-ctl">
        <button className="icon-btn" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <span aria-live="polite">{value}</span>
        <button className="icon-btn" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export function Settings() {
  const { data, setSettings, setLock, replaceAll, resetAll, storageOk } = useStore();
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function savePin() {
    if (!/^\d{4}$/.test(pin)) { setMsg("PIN must be 4 digits."); return; }
    if (pin !== pin2) { setMsg("PINs don't match."); return; }
    setLock(await makeLock(pin));
    setPin(""); setPin2(""); setMsg("PIN lock is on ✓");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ ...data, lock: null }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${APP_NAME.toLowerCase()}-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function importData(file: File) {
    try {
      const next = sanitize(JSON.parse(await file.text()));
      const n = Object.keys(next.logs).length;
      if (!confirm(`Replace everything on this device with the backup (${n} logged days)?`)) return;
      replaceAll({ ...next, onboarded: true, lock: data.lock });
      setMsg(`Restored ${n} logged days ✓`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  function deleteAll() {
    if (!confirm("Delete ALL your data from this device? This can't be undone.")) return;
    if (!confirm("Last check: export a backup first if you want to keep it. Delete everything?")) return;
    resetAll();
  }

  return (
    <div className="screen settings">
      <h1>Settings</h1>
      {msg && <p className="notice" role="status">{msg}</p>}
      {!storageOk && <p className="notice warn">This browser isn't letting {APP_NAME} save data (private mode?). Your logs may be lost when you close it.</p>}

      <div className="card">
        <h3>Your cycle</h3>
        <p className="muted small">Used for predictions until you've logged two periods; after that your own history takes over.</p>
        <Stepper label="Cycle length" value={data.settings.cycleLength} min={15} max={60}
          onChange={(n) => setSettings({ cycleLength: n })} hint="days from one period start to the next" />
        <Stepper label="Period length" value={data.settings.periodLength} min={1} max={12}
          onChange={(n) => setSettings({ periodLength: n })} hint="days" />
        <Stepper label="Luteal phase" value={data.settings.lutealLength} min={9} max={18}
          onChange={(n) => setSettings({ lutealLength: n })} hint="days from ovulation to period (usually 14)" />
      </div>

      <div className="card">
        <h3>Privacy</h3>
        <p className="muted small">
          Your data is stored only on this device. {APP_NAME} has no account, no servers and no tracking, so nothing you
          log is ever uploaded.
        </p>
        {data.lock ? (
          <div className="row">
            <span>🔒 PIN lock is on</span>
            <button className="btn secondary small" onClick={() => { setLock(null); setMsg("PIN lock removed."); }}>Turn off</button>
          </div>
        ) : (
          <div className="pin-form">
            <label>New 4-digit PIN<input inputMode="numeric" type="password" maxLength={4} autoComplete="new-password"
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} /></label>
            <label>Repeat PIN<input inputMode="numeric" type="password" maxLength={4} autoComplete="new-password"
              value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} /></label>
            <button className="btn primary small" onClick={savePin}>Turn on PIN lock</button>
            <p className="muted small">If you forget the PIN you'll need to reset the app, which erases its data, so keep a backup.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Backup</h3>
        <p className="muted small">Save a backup file to restore your history on a new phone or after clearing your browser.</p>
        <div className="row wrap">
          <button className="btn secondary small" onClick={exportData}>⬇ Export backup</button>
          <button className="btn secondary small" onClick={() => fileRef.current?.click()}>⬆ Restore backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
        </div>
      </div>

      <div className="card danger">
        <h3>Delete all data</h3>
        <p className="muted small">Erase every log and setting from this device.</p>
        <button className="btn danger small" onClick={deleteAll}>Delete everything</button>
      </div>

      <p className="muted small center">
        {APP_NAME} gives estimates for information only. It is not medical advice and must not be used as contraception.
        Talk to a healthcare professional about health concerns.
      </p>
    </div>
  );
}
