"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Confetti } from "@/components/motion";

const noop = () => () => {};

/** Confetti the first time a student sees something completed (a group's day, a Sunday Quest): once per id per day on this device. */
export function Celebrate({ id, day }: { id: string; day: string }) {
  const key = `lockin-group-done-${id}`;
  // Server and hydration render nothing; the client then reads whether this day was already celebrated.
  const seen = useSyncExternalStore(noop, () => { try { return localStorage.getItem(key) === day; } catch { return false; } }, () => true);
  useEffect(() => {
    if (seen) return;
    const t = setTimeout(() => { try { localStorage.setItem(key, day); } catch { /* storage blocked: confetti again next visit */ } }, 2500);
    return () => clearTimeout(t);
  }, [seen, key, day]);
  return seen ? null : <Confetti pieces={36} />;
}
