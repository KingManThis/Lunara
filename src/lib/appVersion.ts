// Keeps open tabs and installed copies from running an outdated version after a deploy.
export const BUILD_ID = __BUILD_ID__;

export async function liveBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as { build?: string }).build ?? null : null;
  } catch {
    return null;
  }
}

// A lazily loaded file failed (usually right after a deploy): reload once onto the new version.
window.addEventListener("vite:preloadError", (event) => {
  try {
    if (sessionStorage.getItem("reloaded") === "1") return;
    sessionStorage.setItem("reloaded", "1");
  } catch { /* ignore */ }
  event.preventDefault();
  window.location.reload();
});
