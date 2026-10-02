import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { loadActivity } from "@/lib/activity";
import { doneTopics } from "@/lib/progress";
import { accuracy, badges, bestStreak } from "@/lib/insights";
import { allUnitStats } from "@/lib/mock-units";
import { levelFromXp } from "@/lib/xp";
import { addDays } from "@/lib/plan";
import { getCourse } from "@/lib/syllabus";
import { ArtProgress } from "@/components/art";
import { BadgeArt } from "@/components/BadgeArt";
import { Tilt } from "@/components/Tilt";

export const metadata: Metadata = { title: "Progress" };
type Stats = { total_xp: number; today: string; streak: number; days: Record<string, number> };

export default async function Progress() {
  const { supabase, profile } = await requireOnboarded();
  const { data } = await supabase.rpc("dashboard_stats");
  const s = data as Stats | null;
  if (!s) return <p className="err" role="alert">We couldn&apos;t load your progress. Refresh to try again.</p>;
  const [{ sessions }, done] = await Promise.all([loadActivity(supabase), doneTopics(supabase)]);
  const lv = levelFromXp(s.total_xp);
  const acc = accuracy(sessions);
  const best = Math.max(s.streak, bestStreak(s.days));
  const all = badges({ totalXp: s.total_xp, level: lv.level, sessions, topicsDone: done.size, best });
  const days = Array.from({ length: 30 }, (_, i) => { const d = addDays(s.today, i - 29); return { d, xp: s.days[d] ?? 0 }; });
  const max = Math.max(10, ...days.map((x) => x.xp));
  const byCourse = new Map<string, { c: number; t: number }>();
  for (const u of await allUnitStats(profile.id, sessions)) { const v = byCourse.get(u.course) ?? { c: 0, t: 0 }; v.c += u.correct; v.t += u.total; byCourse.set(u.course, v); }
  const finished = sessions.filter((x) => x.submitted_at).length;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtProgress size={56} /><div><h1 className="text-3xl">Your progress</h1><p className="text-muted">Everything here is counted from your real quizzes.</p></div></header>
      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Total XP", String(s.total_xp)], ["Level", String(lv.level)], ["Quizzes finished", String(finished)], ["Accuracy", acc ? `${acc.pct}%` : "—"], ["Topics done", String(done.size)], ["Current streak", `${s.streak} d`], ["Best streak (12 wk)", `${best} d`], ["XP to next level", String(lv.next - s.total_xp)]].map(([k, v]) => (
          <div key={k} className="card !p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-muted">{k}</p><p className="text-2xl font-black text-head">{v}</p></div>
        ))}
      </section>
      <section className="card" aria-labelledby="h30">
        <h2 id="h30" className="mb-3 text-xl">XP, last 30 days</h2>
        <ol className="flex h-40 items-end gap-[3px]" aria-label="XP per day, last 30 days">
          {days.map((x) => <li key={x.d} title={`${x.d}: ${x.xp} XP`} className="flex-1 rounded-t" style={{ height: `${Math.max(3, (x.xp / max) * 100)}%`, background: x.xp > 0 ? "var(--green)" : "var(--line)" }}><span className="sr-only">{x.d}: {x.xp} XP</span></li>)}
        </ol>
      </section>
      {byCourse.size > 0 && (
        <section className="card" aria-labelledby="acc">
          <h2 id="acc" className="mb-3 text-xl">Accuracy by subject</h2>
          <ul className="flex flex-col gap-3">
            {[...byCourse].map(([code, v]) => { const pct = Math.round((v.c / v.t) * 100); return (
              <li key={code}><div className="flex justify-between text-sm"><b className="text-head">{getCourse(code)?.short ?? code}</b><span>{pct}% · {v.c}/{v.t}</span></div>
                <div className="bar mt-1" role="progressbar" aria-label={`${getCourse(code)?.short} accuracy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%`, background: pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--gold)" : "var(--red)" }} /></div></li>
            ); })}
          </ul>
        </section>
      )}
      <section aria-labelledby="bd">
        <h2 id="bd" className="mb-3 text-xl">Badges · {all.filter((b) => b.earned).length} of {all.length}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {all.map((b) => (
            <li key={b.id}><Tilt><div className={`card flex h-full flex-col items-center gap-1 text-center ${b.earned ? "!border-gold" : ""}`}>
              <span className={b.earned ? "floaty" : "opacity-30 grayscale"}><BadgeArt art={b.art} size={54} /></span>
              <b className="text-sm text-head">{b.title}</b><span className="text-xs text-muted">{b.how}</span>
              {b.earned ? <span className="badge-new">Earned</span> : <span className="text-xs tabular-nums text-muted">{b.value} / {b.target}</span>}
            </div></Tilt></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
