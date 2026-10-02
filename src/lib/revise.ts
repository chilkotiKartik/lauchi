/** "Revise today": a spaced-repetition queue of missed quiz questions and practised PYQs (table revise_items).
 * Pure helpers plus small query functions that take a Supabase client, so this file is safe in client and server code
 * and in unit tests. All writes go through the service_role functions in supabase/migrations/0007_revise.sql. */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Days until the next review after each step: 1 → 3 → 7 → 21 → 60 (and 60 again after that). */
export const GAPS = [1, 3, 7, 21, 60] as const;
export const MAX_STEP = GAPS.length - 1;
export type ReviseKind = "quiz" | "pyq";

/** Today's date in India as YYYY-MM-DD (the queue runs on India days, like the SQL function revise_today()). */
export function indiaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** The ladder, mirrored from revise_review(): right moves one step up, wrong goes back to step 0 (tomorrow). */
export function schedule(step: number, ok: boolean, today: string): { step: number; due: string } {
  const next = ok ? Math.min(Math.max(0, step) + 1, MAX_STEP) : 0;
  return { step: next, due: addDays(today, GAPS[next]) };
}

const COURSE = "[A-Z]{2,3}-[0-9]{3}";
/** A missed quiz question, rebuilt exactly with fromTemplate(course, unit, template, seed). */
export const quizRef = (course: string, unit: number, template: number, seed: number) => `${course}:${unit}:${template}:${seed}`;
export function parseQuizRef(ref: string): { course: string; unit: number; t: number; s: number } | null {
  const m = new RegExp(`^(${COURSE}):(\\d{1,2}):(\\d{1,3}):(-?\\d{1,10})$`).exec(ref);
  if (!m) return null;
  const s = Number(m[4]);
  if (!Number.isSafeInteger(s) || s < -2147483648 || s > 2147483647) return null;
  return { course: m[1], unit: Number(m[2]), t: Number(m[3]), s };
}
/** A practised previous-year question: COURSE:pyq id (for example AHT-001:Q4.1). */
export const pyqRef = (code: string, id: string) => `${code}:${id}`;
export const PYQ_ID = /^[A-Za-z0-9.\-]{1,40}$/;
export function parsePyqRef(ref: string): { code: string; id: string } | null {
  const m = new RegExp(`^(${COURSE}):(.+)$`).exec(ref);
  return m && PYQ_ID.test(m[2]) ? { code: m[1], id: m[2] } : null;
}

/** Plain-text snippet of a question for the queue's title column. */
export function titleSnippet(html: string, max = 140): string {
  const t = html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return (t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t) || "Question";
}

export type ForecastDay = { day: string; label: string; n: number };
/** Reviews due on each of the next `days` days. Anything overdue counts on today. */
export function forecast(dues: string[], today: string, days = 7): ForecastDay[] {
  const out: ForecastDay[] = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i);
    const label = i === 0 ? "Today" : i === 1 ? "Tmrw" : new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
    return { day, label, n: 0 };
  });
  for (const d of dues) {
    const k = Math.max(0, daysBetween(today, d));
    if (k < days) out[k].n++;
  }
  return out;
}

/** "in 3 days", "tomorrow", "today". */
export function dueIn(due: string, today: string): string {
  const k = daysBetween(today, due);
  return k <= 0 ? "today" : k === 1 ? "tomorrow" : `in ${k} days`;
}

/** How many reviews are due today (overdue included). Pass the signed-in user's own client (RLS keeps it to their rows);
 * when you pass the service-role client, also pass the user id. Returns 0 if the table isn't there yet. */
export async function dueCount(supabase: SupabaseClient, userId?: string): Promise<number> {
  try {
    let q = supabase.from("revise_items").select("id").lte("due", indiaToday());
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q.limit(1000);
    return error ? 0 : (data ?? []).length;
  } catch { return 0; }
}
