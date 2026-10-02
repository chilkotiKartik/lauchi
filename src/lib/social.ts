// Pure helpers for friends, study groups and group streaks. No server or browser APIs here, so they are unit-tested.
import { z } from "zod";

/** Invite codes: 8 characters, no look-alikes (no I, L, O, 0 or 1). Friend and group codes share the format. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

/** Accepts what people paste ("abcd-2345", " ABCD 2345 ", a full link) and returns the bare code, or null. */
export function cleanCode(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input).trim().slice(0, 300);
  const fromLink = /(?:[?&]add=|\/join\/)([A-Za-z0-9-]+)/.exec(s);
  if (fromLink) s = fromLink[1];
  const c = s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return CODE_RE.test(c) ? c : null;
}

/** "ABCD2345" → "ABCD-2345" so it is easy to read out loud. */
export const formatCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

export const GROUP_EMOJIS = ["📚", "🔥", "🚀", "🧠", "⚡", "🎯", "🦉", "🌱", "💻", "⚙️", "🧪", "🏆"] as const;
export const GROUP_COLORS = ["green", "blue", "gold", "orange", "purple", "red"] as const;
export type GroupColor = (typeof GROUP_COLORS)[number];
export const COLOR_VAR: Record<GroupColor, string> = {
  green: "var(--green)", blue: "var(--blue)", gold: "var(--gold)", orange: "var(--orange)", purple: "var(--purple)", red: "var(--red)",
};
export const colorVar = (c: string | null | undefined) => COLOR_VAR[(GROUP_COLORS as readonly string[]).includes(c ?? "") ? (c as GroupColor) : "green"];

export const MAX_GROUP_MEMBERS = 30;
export const GROUP_NAME_MAX = 40;

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Give your group a name").max(GROUP_NAME_MAX, `Keep the name to ${GROUP_NAME_MAX} characters`)
    .refine((s) => !/[\u0000-\u001f\u007f<>]/.test(s), "The name has characters we can't accept"),
  emoji: z.enum(GROUP_EMOJIS),
  color: z.enum(GROUP_COLORS),
});
export const goalSchema = z.number().int().min(50, "Set a goal of at least 50 XP").max(20000, "20,000 XP a week is the most");
export const uuidSchema = z.string().uuid();

/** First letter for an avatar bubble. */
export const initial = (name: string) => (Array.from(name.trim())[0] ?? "?").toUpperCase();

// ------------------------------------------------------------------ group streak
export type GroupDay = { day: string; needed: number; done: number };

/** A day counts for the group only if every member who was in the group that day earned at least 1 XP. */
export const dayComplete = (d: GroupDay | undefined) => !!d && d.needed > 0 && d.done >= d.needed;

function prevDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive complete days ending today, or ending yesterday while today is still in progress
 * (today not being done yet never breaks the streak).
 */
export function groupStreak(days: GroupDay[], today: string): number {
  const by = new Map(days.map((d) => [d.day, d]));
  let cursor = dayComplete(by.get(today)) ? today : prevDay(today);
  let n = 0;
  while (dayComplete(by.get(cursor))) { n++; cursor = prevDay(cursor); }
  return n;
}

/** Today's row (or an empty one), for the checklist header. */
export const todayOf = (days: GroupDay[], today: string): GroupDay => days.find((d) => d.day === today) ?? { day: today, needed: 0, done: 0 };

/** The last `count` days, oldest first, each marked complete or not — for the little week strip. */
export function recentDays(days: GroupDay[], today: string, count = 7): { day: string; complete: boolean }[] {
  const by = new Map(days.map((d) => [d.day, d]));
  const out: { day: string; complete: boolean }[] = [];
  let cursor = today;
  for (let i = 0; i < count; i++) { out.unshift({ day: cursor, complete: dayComplete(by.get(cursor)) }); cursor = prevDay(cursor); }
  return out;
}

/** Normalises the numeric fields an RPC returns (bigint may arrive as a string). */
export function toDays(raw: unknown): GroupDay[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    const day = String(o.day ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
    return [{ day, needed: Number(o.needed) || 0, done: Number(o.done) || 0 }];
  });
}

/** Today's date in India, as YYYY-MM-DD. */
export const indiaToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** Friendly line for the nudge banner: "Aman nudged you", "Aman and Riya nudged you", "Aman, Riya and 2 others…". */
export function nudgeLine(names: string[]): string {
  const u = [...new Set(names)];
  if (u.length === 0) return "";
  if (u.length === 1) return `${u[0]} nudged you`;
  if (u.length === 2) return `${u[0]} and ${u[1]} nudged you`;
  const rest = u.length - 2;
  return `${u[0]}, ${u[1]} and ${rest} ${rest === 1 ? "other" : "others"} nudged you`;
}

/** Progress toward the group's weekly goal, 0–100. */
export const goalPercent = (xp: number, goal: number) => (goal > 0 ? Math.max(0, Math.min(100, Math.round((xp / goal) * 100))) : 0);
