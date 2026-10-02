import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { dailyHistory, ensureDaily, streakInfo } from "@/lib/daily-server";
import { DailyRunner } from "@/components/daily/DailyRunner";
import { HistoryStrip } from "@/components/daily/HistoryStrip";
import { FreezeCount } from "@/components/daily/FreezeIcon";
import { ArtFlame, ArtBolt } from "@/components/art";
import { Lochi } from "@/components/Lochi";
import { Rich } from "@/lib/rich";

export const metadata: Metadata = { title: "Daily challenge" };
export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const { supabase, user, profile } = await requireOnboarded();
  const daily = await ensureDaily(supabase, user.id, profile.branch);
  const [history, streak] = await Promise.all([dailyHistory(user.id), streakInfo(user.id)]);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <Lochi mood={daily.completed ? "celebrate" : "thinking"} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">Daily challenge</h1>
          <p className="text-muted">Five questions, picked for you, new every day (India time).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="pill" title="Day streak"><ArtFlame size={24} /><b>{streak.streak}</b><span className="sr-only"> day streak</span></span>
          <FreezeCount freezes={streak.freezes} />
        </div>
      </header>

      {daily.total === 0 ? (
        <p className="card text-muted">There are no practice questions for your course yet. Check back soon.</p>
      ) : daily.completed ? (
        <section className="card flex flex-col gap-4" aria-labelledby="done">
          <div role="status" className="flex flex-wrap items-center gap-3">
            <h2 id="done" className="text-2xl">Done for today!</h2>
            <span className="chip">You got {daily.completed.score} of {daily.total}</span>
            {daily.completed.xp > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-gold-l px-3 py-1 font-black text-head"><ArtBolt size={20} />+{daily.completed.xp} XP</span>}
          </div>
          <p className="text-muted">You can only take the challenge once a day. A new one arrives tomorrow.</p>
          <ol className="flex flex-col gap-3" aria-label="Your answers">
            {daily.review.map((r, i) => (
              <li key={i} className={`rounded-2xl border-2 p-3 ${r.ok ? "border-green bg-green-l" : "border-red bg-red-l"}`}>
                <p className="font-black text-head">{i + 1}. <Rich text={r.q} /></p>
                <p className="text-sm"><b>{r.ok ? "Correct" : "Your answer"}:</b> <Rich text={r.given} />{!r.ok && <> · <b>Right answer:</b> <Rich text={r.right} /></>}</p>
                {r.why && <p className="mt-1 text-sm text-muted"><Rich text={r.why} /></p>}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2"><Link href="/goals" className="btn btn-blue">Weekly goals</Link><Link href="/practice" className="btn btn-ghost">Practise more</Link></div>
        </section>
      ) : (
        <DailyRunner questions={daily.questions} answered={daily.answered} />
      )}

      <HistoryStrip cells={history} />
      <p className="text-sm text-muted">Finish a 7-day streak to earn a streak freeze (you can bank 2). If you miss a day, a freeze keeps your streak alive automatically.</p>
    </div>
  );
}
