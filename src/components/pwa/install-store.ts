"use client";
/** Tiny shared store for "can this app be installed?" so the button and any banner agree. Browser only. */
type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export type InstallState = { canPrompt: boolean; installed: boolean };

let deferred: Prompt | null = null;
let installed = false;
let snapshot: InstallState = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();
const emit = () => { snapshot = { canPrompt: deferred !== null, installed }; listeners.forEach((l) => l()); };
let wired = false;

export const subscribeInstall = (cb: () => void) => {
  if (!wired && typeof window !== "undefined") {
    wired = true;
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as Prompt; emit(); });
    window.addEventListener("appinstalled", () => { deferred = null; installed = true; emit(); });
  }
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
export const getInstallState = () => snapshot;
export const serverInstallState: InstallState = { canPrompt: false, installed: false };

export async function promptInstall() {
  if (!deferred) return;
  const p = deferred;
  deferred = null; emit();
  await p.prompt();
  const { outcome } = await p.userChoice;
  if (outcome === "accepted") { installed = true; emit(); }
}

export const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
export const isIos = () =>
  typeof navigator !== "undefined" && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
