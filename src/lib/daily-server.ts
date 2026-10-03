import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { chooseItems, historyStrip, type DailyItem, type DayCell, type UnitRef } from "@/lib/daily";
import { courseUnits, fromTemplate, givenAnswer, rightAnswer, toPublic, type PublicQuestion } from "@/lib/quiz";
import { visibleCourses, type Viewer } from "@/lib/stream";
import { listCourses } from "@/lib/syllabus";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";
import { leaking } from "@/lib/insights";
import { dailySeed } from "@/lib/daily";
import { coachFor } from "@/lib/coach";
import type { CoachInfo } from "@/components/Coach";
import { indiaToday } from "@/lib/social";
import { lastDays } from "@/lib/streak";

export type DailyRow = { items: DailyItem[]; answers: Record<string, { a: unknown; ok: boolean }>; score: number | null; xp: number | null; completed_at: string | null };
export type ReviewItem = { q: string; given: string; right: string; why: string; ok: boolean };
export type DailyView = {
  day: string; total: number; answered: number[]; questions: (PublicQuestion | null)[];
  completed: { score: number; xp: number } | null; review: ReviewItem[];
  /** per question: where the "Fix it now" coach points after a wrong answer */
  coach: CoachInfo[];
};

export async function loadDailyRow(userId: string, day: string): Promise<DailyRow | null> {
  const { data } = await createAdminClient().from("daily_challenges").select("items,answers,score,xp,completed_at").eq("user_id", userId).eq("day", day).limit(1);
  return ((data ?? [])[0] as DailyRow | undefined) ?? null;
}

/** Today's challenge for this student, created on first visit from their stream's real question banks. */
export async function ensureDaily(supabase: SupabaseClient, userId: string, branch: Viewer): Promise<DailyView> {
  const day = indiaToday();
  let row = await loadDailyRow(userId, day);
  if (!row) {
    const pool: UnitRef[] = visibleCourses(branch, listCourses()).flatMap((c) => courseUnits(c.code).map((unit) => ({ course: c.code, unit })));
    let weak: UnitRef[] = [];
    try {
      const { sessions } = await loadActivity(supabase);
      const inPool = new Set(pool.map((p) => `${p.course}:${p.unit}`));
      weak = leaking((await allUnitStats(userId, sessions)).filter((u) => inPool.has(`${u.course}:${u.unit}`)), 2).map((u) => ({ course: u.course, unit: u.unit }));
    } catch { /* no history yet: a plain seeded pick still works */ }
    const items = chooseItems({ seed: dailySeed(userId, day), pool, weak });
    if (items.length === 0) return { day, total: 0, answered: [], questions: [], completed: null, review: [], coach: [] };
    await createAdminClient().from("daily_challenges").insert({ user_id: userId, day, items }); // a duplicate (two tabs) is simply ignored
    // Next.js memoises identical GET fetches within one render, so re-reading here could return the stale "no row" answer; read after a duplicate-insert race only.
    row = { items, answers: {}, score: null, xp: null, completed_at: null };
  }
  return view(day, row);
}

function view(day: string, row: DailyRow | null): DailyView {
  if (!row) return { day, total: 0, answered: [], questions: [], completed: null, review: [], coach: [] };
  const qs = row.items.map((i) => fromTemplate(i.c, i.u, i.t, i.s));
  const done = Boolean(row.completed_at);
  return {
    day, total: row.items.length,
    answered: Object.keys(row.answers ?? {}).map(Number),
    questions: qs.map((q) => (q ? toPublic(q) : null)),
    completed: done ? { score: row.score ?? 0, xp: row.xp ?? 0 } : null,
    coach: row.items.map((i) => coachFor(i.c, i.u)),
    review: done ? qs.flatMap((q, i) => q ? [{ q: q.q, given: givenAnswer(q, row.answers[String(i)]?.a), right: rightAnswer(q), why: q.why, ok: Boolean(row.answers[String(i)]?.ok) }] : []) : [],
  };
}

/** The last 14 India days with completion marks. */
export async function dailyHistory(userId: string): Promise<DayCell[]> {
  const today = indiaToday();
  const { data } = await createAdminClient().from("daily_challenges").select("day,score,completed_at").eq("user_id", userId).order("day", { ascending: false }).limit(30);
  return historyStrip((data ?? []) as { day: string; score: number | null; completed_at: string | null }[], lastDays(today, 14), today);
}

/** Freezes banked and the streak, from the database (and persists the checkpoint). */
export async function streakInfo(userId: string): Promise<{ streak: number; freezes: number }> {
  try {
    const { data } = await createAdminClient().rpc("sync_streak", { p_user: userId });
    const o = (data ?? {}) as { streak?: number; freezes?: number };
    return { streak: Number(o.streak ?? 0), freezes: Number(o.freezes ?? 0) };
  } catch { return { streak: 0, freezes: 0 }; }
}
