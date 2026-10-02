"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "lockin-notice-v1";
const listeners = new Set<() => void>();
let dismissedInMemory = false;

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const seen = () => {
  if (dismissedInMemory) return true;
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export function Notice() {
  const dismissed = useSyncExternalStore(subscribe, seen, () => true);
  if (dismissed) return null;
  const dismiss = () => {
    dismissedInMemory = true;
    try { localStorage.setItem(KEY, "1"); } catch { /* storage blocked: notice returns next visit */ }
    listeners.forEach((l) => l());
  };
  return (
    <div role="region" aria-label="Privacy notice" className="mx-3 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line bg-soft p-4 sm:mx-auto sm:max-w-xl">
      <p className="min-w-0 flex-1 text-sm">We only use cookies that keep you signed in. No ads, no tracking. <Link href="/cookies">Cookie notice</Link> · <Link href="/privacy">Privacy</Link></p>
      <button type="button" className="btn btn-blue !min-h-11 !px-4" onClick={dismiss}>Got it</button>
    </div>
  );
}
