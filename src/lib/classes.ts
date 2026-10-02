import { z } from "zod";

/** Pure helpers for class groups: validation, code cleaning, and shaping the JSON the database functions return. No I/O. */

export const MAX_CLASSES_PER_STUDENT = 5;
export const COURSE_RE = /^[A-Z]{2,3}-[0-9]{3}$/;
export const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
export const uuidSchema = z.string().uuid();

const noControl = (s: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Give your class a name").max(60, "Keep the name under 60 characters").refine(noControl, "That name has characters we can't accept"),
  course: z.string().trim().transform((c) => (c === "" ? null : c)).pipe(z.string().regex(COURSE_RE, "Pick a subject").nullable()),
});

/** Same cleaning as the database: upper-case, letters and digits only. Null when it cannot be a valid code. */
export function cleanCode(raw: string): string | null {
  const c = raw.slice(0, 40).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return CODE_RE.test(c) ? c : null;
}

export const joinSchema = z.object({ code: z.string().trim().min(1, "Type the class code").max(40, "That code is too long") });

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(254);

export type JoinStatus = "ok" | "not_found" | "limited" | "full" | "own" | "already";
export const JOIN_MESSAGES: Record<Exclude<JoinStatus, "ok" | "already">, string> = {
  not_found: "We couldn't find a class with that code. Check it with your teacher.",
  limited: "Too many wrong codes. Wait an hour and try again.",
  full: `You can be in ${MAX_CLASSES_PER_STUDENT} classes at most. Leave one first.`,
  own: "That is your own class. Open it from your list.",
};

/* ------------------------------------------------------------------ shapes */

export type ClassRow = { id: string; owner_id: string; name: string; course: string | null; archived: boolean; created_at: string };
export type WeakUnit = { course: string; unit: number; pct: number; total: number; students?: number };
export type RosterRow = {
  user_id: string; name: string; joined_at: string; xp7: number; xp30: number; streak: number; quizzes: number;
  correct: number; total: number; accuracy: number | null; weakest: WeakUnit[];
};
export type Overview = { members: number; active7: number; avg_xp7: number; quizzes7: number; accuracy: number | null; weak: WeakUnit[] };
export type Compare = { class_id: string; members: number; my_xp7: number; avg_xp7: number; my_accuracy: number | null; avg_accuracy: number | null };

const num = (v: unknown, d = 0) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? d : Number(v));
const numOrNull = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

const weak = (v: unknown): WeakUnit[] =>
  arr(v).map((w) => ({ course: String(w.course), unit: num(w.unit), pct: num(w.pct), total: num(w.total), students: w.students === undefined ? undefined : num(w.students) }));

export function normaliseRoster(raw: unknown): RosterRow[] {
  return arr(raw).map((r) => ({
    user_id: String(r.user_id), name: String(r.name ?? "").trim() || "Student", joined_at: String(r.joined_at ?? ""),
    xp7: num(r.xp7), xp30: num(r.xp30), streak: num(r.streak), quizzes: num(r.quizzes), correct: num(r.correct), total: num(r.total),
    accuracy: numOrNull(r.accuracy), weakest: weak(r.weakest).slice(0, 3),
  }));
}

export function normaliseOverview(raw: unknown): Overview {
  const o = (raw ?? {}) as Record<string, unknown>;
  return { members: num(o.members), active7: num(o.active7), avg_xp7: num(o.avg_xp7), quizzes7: num(o.quizzes7), accuracy: numOrNull(o.accuracy), weak: weak(o.weak) };
}

export function normaliseCompare(raw: unknown): Compare[] {
  return arr(raw).map((c) => ({ class_id: String(c.class_id), members: num(c.members), my_xp7: num(c.my_xp7), avg_xp7: num(c.avg_xp7), my_accuracy: numOrNull(c.my_accuracy), avg_accuracy: numOrNull(c.avg_accuracy) }));
}

/* ------------------------------------------------------------------ roster sorting */

export type SortKey = "name" | "xp7" | "xp30" | "streak" | "quizzes" | "accuracy";
export const SORT_KEYS: SortKey[] = ["name", "xp7", "xp30", "streak", "quizzes", "accuracy"];

/** Sorted copy. Students with no accuracy yet always sort last; ties fall back to name. */
export function sortRoster(rows: RosterRow[], key: SortKey, dir: "asc" | "desc"): RosterRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "name") return sign * a.name.localeCompare(b.name);
    if (key === "accuracy") {
      if (a.accuracy === null && b.accuracy === null) return a.name.localeCompare(b.name);
      if (a.accuracy === null) return 1;
      if (b.accuracy === null) return -1;
      return sign * (a.accuracy - b.accuracy) || a.name.localeCompare(b.name);
    }
    return sign * (a[key] - b[key]) || a.name.localeCompare(b.name);
  });
}

/** What a class-average comparison should say, in plain words. */
export function compareWord(mine: number | null, avg: number | null): "above" | "below" | "level" | "none" {
  if (mine === null || avg === null) return "none";
  const d = mine - avg;
  return Math.abs(d) < 1 ? "level" : d > 0 ? "above" : "below";
}
