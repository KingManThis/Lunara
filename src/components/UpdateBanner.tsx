import { useEffect, useState } from "react";
import { BUILD_ID, liveBuildId } from "../lib/appVersion.ts";

export function UpdateBanner() {
  const [outdated, setOutdated] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const check = async () => { const live = await liveBuildId(); if (live && live !== BUILD_ID) setOutdated(true); };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    check();
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(check, 5 * 60_000);
    return () => { document.removeEventListener("visibilitychange", onVisible); clearInterval(t); };
  }, []);
  if (!outdated) return null;
  return (
    <div className="update-banner" role="status">
      <span>✨ A new version is ready</span>
      <button className="btn small" onClick={() => window.location.reload()}>Update</button>
    </div>
  );
}
