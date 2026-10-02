import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { loadActivity } from "@/lib/activity";
import { dailyQuests } from "@/lib/insights";
import { addDays } from "@/lib/plan";
import { ArtQuest } from "@/components/art";

export const metadata: Metadata = { title: "Quests" };

type Stats = { today_xp: number; today: string; days: Record<string, number> };

export default async function Quests() {
  const { supabase, profile } = await requireOnboarded();
  const { data } = await supabase.rpc("dashboard_stats");
  const s = data as Stats | null;
  if (!s) return <p className="err" role="alert">We couldn&apos;t load your quests. Refresh to try again.</p>;
  const { sessions, events } = await loadActivity(supabase);
  const quests = dailyQuests({ today: s.today, tz: profile.timezone, todayXp: s.today_xp, goal: profile.daily_goal_xp, sessions, events });
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(s.today, i - 6); return { d, xp: s.days[d] ?? 0 }; });
  const max = Math.max(profile.daily_goal_xp, ...week.map((w) => w.xp));
  const doneCount = quests.filter((q) => q.value >= q.target).length;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtQuest size={56} /><div><h1 className="text-3xl">Daily quests</h1><p className="text-muted">{doneCount} of {quests.length} done today. Quests track what you actually did; the XP comes from the quizzes themselves.</p></div></header>
      <ul className="flex flex-col gap-3">
        {quests.map((q) => {
          const ok = q.value >= q.target;
          return (
            <li key={q.id} className={`card flex items-center gap-4 ${ok ? "!border-green" : ""}`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black ${ok ? "bg-green text-[#0d3a19]" : "bg-soft text-muted"}`} aria-hidden>{ok ? "✓" : "•"}</span>
              <div className="flex-1"><h2 className="text-lg">{q.title}</h2><p className="text-sm text-muted">{q.hint}</p>
                <div className="bar mt-2" role="progressbar" aria-label={q.title} aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={q.value}><i style={{ width: `${(q.value / q.target) * 100}%` }} /></div></div>
              <span className="tabular-nums font-black text-head">{q.value}/{q.target}</span>
            </li>
          );
        })}
      </ul>
      <section className="card" aria-labelledby="wk">
        <h2 id="wk" className="mb-3 text-xl">This week&apos;s XP</h2>
        <ol className="flex h-36 items-end gap-2" aria-label="XP per day, last 7 days">
          {week.map((w) => (
            <li key={w.d} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-black tabular-nums text-head">{w.xp}</span>
              <span className="w-full rounded-t-lg" style={{ height: `${Math.max(4, (w.xp / max) * 90)}px`, background: w.xp >= profile.daily_goal_xp ? "var(--gold)" : "var(--blue)" }} />
              <span className="text-xs text-muted">{new Date(w.d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" })}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-muted">Gold bars are days you reached your {profile.daily_goal_xp} XP goal.</p>
      </section>
      <Link href="/practice" className="btn w-fit">Go practise</Link>
    </div>
  );
}
