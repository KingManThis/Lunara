import { useEffect, useState } from "react";
import { UpdateBanner } from "./components/UpdateBanner.tsx";
import { useStore } from "./lib/store.tsx";
import { Calendar } from "./screens/Calendar.tsx";
import { Insights } from "./screens/Insights.tsx";
import { LockScreen } from "./screens/LockScreen.tsx";
import { Onboarding } from "./screens/Onboarding.tsx";
import { Settings } from "./screens/Settings.tsx";
import { Today } from "./screens/Today.tsx";

const TABS = [
  { id: "today", label: "Today", icon: "🌙" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "insights", label: "Insights", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const tabFromHash = (): Tab => {
  const h = window.location.hash.replace("#", "");
  return (TABS.find((t) => t.id === h)?.id ?? "today") as Tab;
};

export default function App() {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  // Locked only if a PIN existed when the app opened; turning the lock on doesn't lock you out mid-session.
  const [unlocked, setUnlocked] = useState(() => !data.lock);

  // Keep the tab in the URL so the phone's back button works between tabs.
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Re-lock when the app goes to the background.
  useEffect(() => {
    if (!data.lock) return;
    const onHide = () => { if (document.visibilityState === "hidden") setUnlocked(false); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [data.lock]);

  if (data.lock && !unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  if (!data.onboarded) return <Onboarding />;

  return (
    <div className="app">
      <UpdateBanner />
      <main className="content">
        {tab === "today" && <Today />}
        {tab === "calendar" && <Calendar />}
        {tab === "insights" && <Insights />}
        {tab === "settings" && <Settings />}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? "active" : ""} aria-current={tab === t.id ? "page" : undefined}>
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
