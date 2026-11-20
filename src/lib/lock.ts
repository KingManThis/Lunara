// Optional PIN lock. The PIN is stored only as a salted SHA-256 hash.
// This keeps casual onlookers out of the app; it is not encryption of the stored data.
import type { Lock } from "./store.tsx";

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeLock(pin: string): Promise<Lock> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  return { salt, hash: await sha256(salt + pin) };
}

export async function checkPin(lock: Lock, pin: string): Promise<boolean> {
  return (await sha256(lock.salt + pin)) === lock.hash;
}
