"use client";
import { useLocalJson } from "@/lib/local-store";

/** Per-device study preferences. Kept in localStorage: nothing here is personal data and nothing needs the server. */
export type Prefs = {
  sound: boolean;      // little chimes for right / wrong / level up
  voice: boolean;      // Lochi says "Correct!" etc. out loud
  rate: number;        // speaking speed, 0.6 – 1.6
  lang: "en-IN" | "en-US" | "en-GB" | "hi-IN";
  motion: "full" | "calm"; // calm = fewer moving backgrounds (reduced-motion devices are always calm)
};
export const PREFS_KEY = "lockin.prefs";
export const DEFAULT_PREFS: Prefs = { sound: true, voice: false, rate: 1, lang: "en-IN", motion: "full" };

export function clampPrefs(p: unknown): Prefs {
  const o = (p && typeof p === "object" ? p : {}) as Partial<Prefs>;
  const langs = ["en-IN", "en-US", "en-GB", "hi-IN"] as const;
  return {
    sound: typeof o.sound === "boolean" ? o.sound : DEFAULT_PREFS.sound,
    voice: typeof o.voice === "boolean" ? o.voice : DEFAULT_PREFS.voice,
    rate: typeof o.rate === "number" && Number.isFinite(o.rate) ? Math.min(1.6, Math.max(0.6, o.rate)) : DEFAULT_PREFS.rate,
    lang: langs.includes(o.lang as Prefs["lang"]) ? (o.lang as Prefs["lang"]) : DEFAULT_PREFS.lang,
    motion: o.motion === "calm" ? "calm" : "full",
  };
}

/** Read outside React (sound effects, speech). Safe when storage is blocked. */
export function readPrefs(): Prefs {
  try { return clampPrefs(JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null")); } catch { return DEFAULT_PREFS; }
}

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const [raw, set] = useLocalJson<Partial<Prefs> | null>(PREFS_KEY, null);
  const prefs = clampPrefs(raw);
  return [prefs, (patch) => set(clampPrefs({ ...prefs, ...patch }))];
}
