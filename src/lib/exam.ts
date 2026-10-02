/** Exam preparation: turns the plan engine's per-unit data into a day-by-day revision schedule. Pure, no I/O. */
import { addDays, daysBetween, priority, MIN_PER_TOPIC, type PlanUnit } from "@/lib/plan";

export type TaskKind = "learn" | "practice" | "pyq" | "revise" | "mock";
export type ExamTask = { day: string; course: string; unit: number; kind: TaskKind; minutes: number };
export type StoredTask = ExamTask & { id: string; done: boolean };

export const KIND_LABEL: Record<TaskKind, string> = { learn: "Learn", practice: "Practice quiz", pyq: "Previous-year questions", revise: "Revise", mock: "Mock test" };
export const taskKey = (t: Pick<ExamTask, "day" | "course" | "unit" | "kind">) => `${t.day}|${t.course}|${t.unit}|${t.kind}`;

/** 0 (strong) .. 1 (weak). A unit never quizzed counts as half weak. */
export const weakness = (u: Pick<PlanUnit, "accuracy">) => (u.accuracy === null ? 0.5 : Math.max(0, Math.min(1, 1 - u.accuracy)));
export const isWeak = (u: Pick<PlanUnit, "accuracy">) => u.accuracy === null || u.accuracy < 0.8;

/**
 * Days available = today .. the day before the exam. Work is ordered in phases (learn + practice per unit, then PYQs, then revision of weak units, then one mock per subject),
 * weakest and least-finished units first inside each phase, and cut into days by cumulative minutes so every day gets a similar load.
 * Bigger units (more topics) get longer blocks; weaker units get longer practice blocks.
 */
export function buildSchedule(units: PlanUnit[], today: string, exam: string): ExamTask[] {
  const span = daysBetween(today, exam);
  if (span <= 0 || units.length === 0) return [];
  const ranked = [...units].sort((a, b) => priority(b) - priority(a) || a.course.localeCompare(b.course) || a.unit - b.unit);
  const seq: Omit<ExamTask, "day">[] = [];
  for (const u of ranked) {
    const left = Math.max(0, u.topics - u.done);
    if (left > 0) seq.push({ course: u.course, unit: u.unit, kind: "learn", minutes: Math.min(240, left * MIN_PER_TOPIC) });
    seq.push({ course: u.course, unit: u.unit, kind: "practice", minutes: Math.round(15 + 25 * weakness(u)) });
  }
  for (const u of ranked) seq.push({ course: u.course, unit: u.unit, kind: "pyq", minutes: Math.min(60, 20 + 4 * u.topics) });
  for (const u of ranked.filter(isWeak).sort((a, b) => weakness(b) - weakness(a))) seq.push({ course: u.course, unit: u.unit, kind: "revise", minutes: Math.min(60, 20 + 4 * u.topics) });
  const bySubject = new Map<string, number[]>();
  for (const u of ranked) bySubject.set(u.course, [...(bySubject.get(u.course) ?? []), weakness(u)]);
  [...bySubject.entries()].sort((a, b) => avg(b[1]) - avg(a[1])).forEach(([course]) => seq.push({ course, unit: 0, kind: "mock", minutes: 60 }));

  const total = seq.reduce((n, t) => n + t.minutes, 0);
  let cum = 0;
  return seq.map((t) => {
    const mid = cum + t.minutes / 2; cum += t.minutes;
    return { ...t, day: addDays(today, Math.min(span - 1, Math.floor((mid / total) * span))) };
  });
}
const avg = (a: number[]) => a.reduce((n, x) => n + x, 0) / a.length;

export const progressPct = (tasks: Pick<StoredTask, "done">[]) => (tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0);

export function groupByDay<T extends { day: string }>(tasks: T[]): { day: string; tasks: T[] }[] {
  const m = new Map<string, T[]>();
  for (const t of tasks) m.set(t.day, [...(m.get(t.day) ?? []), t]);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, tasks]) => ({ day, tasks }));
}

/** Where a task takes the student. */
export function taskLinks(t: Pick<ExamTask, "course" | "unit" | "kind">): { href: string; label: string }[] {
  const c = encodeURIComponent(t.course);
  switch (t.kind) {
    case "learn": return [{ href: `/learn/${c}/${t.unit}`, label: "Open lessons" }, { href: `/labs?course=${c}&unit=${t.unit}`, label: "Labs" }];
    case "practice": return [{ href: `/practice/${c}`, label: "Start practice" }];
    case "pyq": return [{ href: `/pyq?course=${c}&unit=${t.unit}`, label: "Open PYQs" }];
    case "revise": return [{ href: `/learn/${c}/${t.unit}`, label: "Open lessons" }, { href: `/pyq?course=${c}&unit=${t.unit}`, label: "PYQs" }, { href: `/labs?course=${c}&unit=${t.unit}`, label: "Labs" }];
    case "mock": return [{ href: "/mock", label: "Take a mock" }];
  }
}

/** The weakest units inside the chosen scope, among those the student has actually attempted. */
export function weakUnits(units: PlanUnit[], n = 5) {
  return units.filter((u) => u.accuracy !== null && u.accuracy < 1).sort((a, b) => weakness(b) - weakness(a)).slice(0, n);
}
