import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWeeks, defaultGoals, goalMet, pct, type GoalRow, type ProgressRow } from "@/lib/goals";
import { indiaToday } from "@/lib/social";
import { addDays, weekStart } from "@/lib/streak";
import { GoalsForm } from "@/components/daily/GoalsForm";
import { ArtTarget } from "@/components/art";

export const metadata: Metadata = { title: "Weekly goals" };
export const dynamic = "force-dynamic";

const label = (w: string) => {
  const f = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${f(w)} – ${f(addDays(w, 6))}`;
};

function Bar({ name, value, target }: { name: string; value: number; target: number }) {
  const p = pct(value, target);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm font-bold text-head"><span>{name}</span><span className="tabular-nums">{value} / {target}</span></div>
      <div className="bar" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(value, target)}><i style={{ width: `${p}%` }} /></div>
    </div>
  );
}

export default async function Goals() {
  const { supabase, user, profile } = await requireOnboarded();
  const today = indiaToday();
  const cur = weekStart(today);
  const [prog, goals] = await Promise.all([
    createAdminClient().rpc("weekly_progress", { p_user: user.id, p_from: addDays(cur, -49) }),
    supabase.from("weekly_goals").select("week_start,xp_target,quizzes_target").eq("user_id", user.id).order("week_start", { ascending: false }).limit(12),
  ]);
  const weeks = buildWeeks(today, (prog.data ?? []) as ProgressRow[], (goals.data ?? []) as GoalRow[]);
  const now = weeks[0];
  const defaults = defaultGoals(profile.daily_goal_xp);
  const target = now.goal ?? defaults;
  const history = weeks.slice(1);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtTarget size={56} /><div><h1 className="text-3xl">Weekly goals</h1><p className="text-muted">Set a target for this week (Monday to Sunday, India time). Progress is counted from your real XP and finished quizzes.</p></div></header>
      <section className="card flex flex-col gap-4" aria-labelledby="tw">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="tw" className="text-xl">This week</h2><p className="text-sm text-muted">{label(now.weekStart)}</p></div>
        <Bar name="XP earned" value={now.xp} target={target.xpTarget} />
        <Bar name="Quizzes finished" value={now.quizzes} target={target.quizzesTarget} />
        {goalMet({ ...now, goal: target }) && <p role="status" className="ok">Goal reached. Great week!</p>}
        {!now.goal && <p className="text-sm text-muted">No goal saved yet. These numbers come from your daily goal ({profile.daily_goal_xp} XP a day). Save them or change them.</p>}
        <GoalsForm xpTarget={target.xpTarget} quizzesTarget={target.quizzesTarget} saved={Boolean(now.goal)} />
        <p className="text-xs text-muted">Quizzes include practice, topic, mock and assignment quizzes plus your daily challenge.</p>
      </section>
      <section className="card flex flex-col gap-3" aria-labelledby="hw">
        <h2 id="hw" className="text-xl">Last 8 weeks</h2>
        <ol className="flex flex-col gap-2" aria-label="Previous weeks">
          {history.map((w) => (
            <li key={w.weekStart} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-line p-3">
              <span className="min-w-[8.5rem] font-black text-head">{label(w.weekStart)}</span>
              <span className="text-sm tabular-nums">{w.xp}{w.goal ? ` / ${w.goal.xpTarget}` : ""} XP · {w.quizzes}{w.goal ? ` / ${w.goal.quizzesTarget}` : ""} quizzes</span>
              <span className={`chip ml-auto ${goalMet(w) ? "" : "opacity-80"}`}>{w.goal ? (goalMet(w) ? "Goal reached" : "Missed") : "No goal set"}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
