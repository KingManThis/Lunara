import { useState } from "react";
import { APP_NAME } from "../config.ts";
import { checkPin } from "../lib/lock.ts";
import { useStore } from "../lib/store.tsx";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { data, resetAll } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  async function press(d: string) {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (await checkPin(data.lock!, next)) onUnlock();
      else { setError(true); setTimeout(() => setPin(""), 350); }
    }
  }

  function forgot() {
    if (confirm(`Forgot your PIN? The only way in is to reset ${APP_NAME}, which ERASES all data on this device. Continue?`)) {
      resetAll();
      onUnlock();
    }
  }

  return (
    <div className="lock">
      <div className="ob-logo" aria-hidden>🔒</div>
      <h2>Enter PIN</h2>
      <div className={`pin-dots ${error ? "shake" : ""}`} aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? "on" : ""} />)}
      </div>
      {error && <p className="notice warn">Wrong PIN</p>}
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} onClick={() => press(d)}>{d}</button>)}
        <span />
        <button onClick={() => press("0")}>0</button>
        <button onClick={() => setPin(pin.slice(0, -1))} aria-label="Delete">⌫</button>
      </div>
      <button className="link" onClick={forgot}>Forgot PIN?</button>
    </div>
  );
}
