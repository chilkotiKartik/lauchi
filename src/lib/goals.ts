import { z } from "zod";
import { addDays, weekStart } from "@/lib/streak";

export const goalsSchema = z.object({
  xpTarget: z.number().int().min(10).max(5000),
  quizzesTarget: z.number().int().min(0).max(100),
});
export type GoalsInput = z.infer<typeof goalsSchema>;

/** Defaults for a week with no saved goal: 7 days of the daily XP goal and 5 quizzes. */
export const defaultGoals = (dailyGoalXp: number): GoalsInput => ({ xpTarget: Math.min(5000, Math.max(10, dailyGoalXp * 7)), quizzesTarget: 5 });

export type WeekRow = { weekStart: string; xp: number; quizzes: number; goal: GoalsInput | null };
export type ProgressRow = { week_start: string; xp: number | string; quizzes: number | string };
export type GoalRow = { week_start: string; xp_target: number; quizzes_target: number };

/** The current week and the 7 before it, newest first, with progress and the saved goal (if any). */
export function buildWeeks(today: string, progress: ProgressRow[], goals: GoalRow[], weeks = 8): WeekRow[] {
  const cur = weekStart(today);
  const p = new Map(progress.map((r) => [String(r.week_start).slice(0, 10), r]));
  const g = new Map(goals.map((r) => [String(r.week_start).slice(0, 10), r]));
  return Array.from({ length: weeks }, (_, i) => {
    const w = addDays(cur, -7 * i), pr = p.get(w), go = g.get(w);
    return { weekStart: w, xp: Number(pr?.xp ?? 0), quizzes: Number(pr?.quizzes ?? 0), goal: go ? { xpTarget: go.xp_target, quizzesTarget: go.quizzes_target } : null };
  });
}

export const pct = (done: number, target: number) => (target <= 0 ? 100 : Math.min(100, Math.round((done / target) * 100)));
export const goalMet = (w: WeekRow) => Boolean(w.goal) && w.xp >= w.goal!.xpTarget && w.quizzes >= w.goal!.quizzesTarget;
