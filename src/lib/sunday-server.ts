import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dailySeed, type DailyItem, type UnitRef } from "@/lib/daily";
import { courseUnits, fromTemplate, givenAnswer, rightAnswer, toPublic, type PublicQuestion } from "@/lib/quiz";
import { visibleCourses } from "@/lib/stream";
import { getCourse, listCourses } from "@/lib/syllabus";
import { indiaToday } from "@/lib/social";
import { isSunday, istStart, planQuest, questDay, questItems, sundayStreak, weekMonday, weekStats, type PlannedUnit } from "@/lib/sunday";
import type { ReviewItem } from "@/lib/daily-server";
import { coachFor } from "@/lib/coach";
import type { CoachInfo } from "@/components/Coach";

export type SundayRow = { items: DailyItem[]; units: PlannedUnit[]; answers: Record<string, { a: unknown; ok: boolean }>; score: number | null; xp: number | null; completed_at: string | null };
export type PlannedView = PlannedUnit & { short: string; title: string };
export type SundayView = {
  today: string; sunday: string; open: boolean; review: boolean; units: PlannedView[];
  total: number; answered: number[]; questions: (PublicQuestion | null)[];
  completed: { score: number; xp: number } | null; answers: ReviewItem[];
  coach: CoachInfo[];
  streak: number; history: { day: string; score: number | null; total: number; done: boolean }[];
};

const shift = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Every unit with a question bank in the student's own subjects. */
function poolFor(branch: string | null): UnitRef[] {
  return visibleCourses(branch, listCourses()).flatMap((c) => courseUnits(c.code).map((unit) => ({ course: c.code, unit })));
}
/** A seeded shuffle of the pool, used when the student practised nothing this week (Sunday is then a mixed review). */
function shuffled(pool: UnitRef[], seed: number): UnitRef[] {
  const a = [...pool];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) | 0; const j = (s >>> 0) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** What the student answered from Monday 00:00 up to (not including) `until`, both India time. */
async function weekActivity(userId: string, monday: string, until: string) {
  const db = createAdminClient();
  const [s, d] = await Promise.all([
    db.from("quiz_sessions").select("course,unit,answers").eq("user_id", userId).gte("created_at", istStart(monday)).lt("created_at", istStart(until)).limit(400),
    db.from("daily_challenges").select("items,answers").eq("user_id", userId).gte("day", monday).lt("day", until).limit(7),
  ]);
  return weekStats((s.data ?? []) as Parameters<typeof weekStats>[0], (d.data ?? []) as Parameters<typeof weekStats>[1]);
}

function label(units: PlannedUnit[]): PlannedView[] {
  return units.map((u) => { const c = getCourse(u.course); return { ...u, short: c?.short ?? u.course, title: c?.units[u.unit - 1]?.title ?? `Unit ${u.unit}` }; });
}

async function history(userId: string, today: string) {
  const { data } = await createAdminClient().from("sunday_quests").select("day,score,items,completed_at").eq("user_id", userId).order("day", { ascending: false }).limit(12);
  const rows = (data ?? []) as { day: string; score: number | null; items: unknown[]; completed_at: string | null }[];
  const done = rows.filter((r) => r.completed_at).map((r) => r.day);
  const by = new Map(rows.map((r) => [r.day, r]));
  const last = isSunday(today) ? today : shift(questDay(today), -7);
  const list = Array.from({ length: 8 }, (_, i) => shift(last, -7 * (7 - i))).map((day) => {
    const r = by.get(day);
    return { day, score: r?.score ?? null, total: Array.isArray(r?.items) ? r!.items.length : 0, done: Boolean(r?.completed_at) };
  });
  return { streak: sundayStreak(done, today), history: list };
}

export async function loadSundayRow(userId: string, day: string): Promise<SundayRow | null> {
  const { data } = await createAdminClient().from("sunday_quests").select("items,units,answers,score,xp,completed_at").eq("user_id", userId).eq("day", day).limit(1);
  return ((data ?? [])[0] as SundayRow | undefined) ?? null;
}

/**
 * Monday–Saturday: the live preview of what Sunday will cover. Sunday: the quest itself, created on first visit from
 * Monday–Saturday's activity (so it matches Saturday night's preview) and then fixed for the day.
 */
export async function ensureSunday(userId: string, branch: string | null): Promise<SundayView> {
  const today = indiaToday();
  const sunday = questDay(today), monday = weekMonday(sunday), open = isSunday(today);
  const pool = poolFor(branch);
  const fallback = shuffled(pool, dailySeed(userId, sunday));
  const [{ streak, history: hist }, existing] = await Promise.all([history(userId, today), open ? loadSundayRow(userId, sunday) : Promise.resolve(null)]);
  const base = { today, sunday, open, streak, history: hist };

  if (!open) {
    const plan = planQuest(await weekActivity(userId, monday, shift(today, 1)), pool, fallback);
    return { ...base, review: plan.review, units: label(plan.units), total: 0, answered: [], questions: [], completed: null, answers: [], coach: [] };
  }

  let row = existing;
  if (!row) {
    const plan = planQuest(await weekActivity(userId, monday, sunday), pool, fallback);
    const items = questItems(plan.units, dailySeed(userId, `sunday:${sunday}`));
    if (!items.length) return { ...base, review: plan.review, units: [], total: 0, answered: [], questions: [], completed: null, answers: [], coach: [] };
    // A second tab inserting at the same moment is rejected by the primary key; both build identical items (same seed, same week).
    await createAdminClient().from("sunday_quests").insert({ user_id: userId, day: sunday, items, units: plan.units });
    row = { items, units: plan.units, answers: {}, score: null, xp: null, completed_at: null };
  }
  const qs = row.items.map((i) => fromTemplate(i.c, i.u, i.t, i.s));
  const done = Boolean(row.completed_at);
  return {
    ...base, review: row.units.every((u) => u.attempts === 0), units: label(row.units),
    total: row.items.length, answered: Object.keys(row.answers ?? {}).map(Number), questions: qs.map((q) => (q ? toPublic(q) : null)),
    completed: done ? { score: row.score ?? 0, xp: row.xp ?? 0 } : null,
    coach: row.items.map((i) => coachFor(i.c, i.u)),
    answers: done ? qs.flatMap((q, i) => (q ? [{ q: q.q, given: givenAnswer(q, row!.answers[String(i)]?.a), right: rightAnswer(q), why: q.why, ok: Boolean(row!.answers[String(i)]?.ok) }] : [])) : [],
  };
}

/** For the dashboard card: days until Sunday, units planned so far, whether this Sunday's quest is done, and the Sunday streak. */
export async function sundaySummary(userId: string, branch: string | null): Promise<{ open: boolean; daysLeft: number; units: number; done: boolean; streak: number }> {
  try {
    const today = indiaToday(), sunday = questDay(today), open = isSunday(today);
    const daysLeft = open ? 0 : Math.round((Date.parse(sunday) - Date.parse(today)) / 864e5);
    const [h, row] = await Promise.all([history(userId, today), open ? loadSundayRow(userId, sunday) : Promise.resolve(null)]);
    if (open) return { open, daysLeft, units: row?.units.length ?? 0, done: Boolean(row?.completed_at), streak: h.streak };
    const plan = planQuest(await weekActivity(userId, weekMonday(sunday), shift(today, 1)), poolFor(branch), []);
    return { open, daysLeft, units: plan.units.length, done: false, streak: h.streak };
  } catch { return { open: false, daysLeft: 0, units: 0, done: false, streak: 0 }; }
}
