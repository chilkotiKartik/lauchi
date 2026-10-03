import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { ensureSunday } from "@/lib/sunday-server";
import { maxSundayXp, SUNDAY_COUNT, SUNDAY_XP } from "@/lib/sunday";
import { DailyRunner } from "@/components/daily/DailyRunner";
import { StartQuizButton } from "@/components/StartQuizButton";
import { ArtBolt, ArtQuest } from "@/components/art";
import { Lochi } from "@/components/Lochi";
import { Celebrate } from "@/components/social/Celebrate";
import { Rich } from "@/lib/rich";
import { answerSunday } from "./actions";

export const metadata: Metadata = { title: "Sunday Quest" };
export const dynamic = "force-dynamic";

const dayName = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function SundayPage() {
  const { user, profile } = await requireOnboarded();
  const q = await ensureSunday(user.id, profile.branch);
  const daysLeft = Math.round((Date.parse(q.sunday) - Date.parse(q.today)) / 864e5);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <ArtQuest size={60} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">Sunday Quest</h1>
          <p className="text-muted">Every Sunday: {SUNDAY_COUNT} questions from what <b>you</b> studied this week, with more from the units you got wrong. Up to {maxSundayXp()} XP.</p>
        </div>
        <span className="pill" title="Sundays in a row"><b>{q.streak}</b>&nbsp;Sunday{q.streak === 1 ? "" : "s"} in a row</span>
      </header>

      {!q.open ? (
        <section className="card flex flex-col gap-4" aria-labelledby="prep">
          <div className="flex flex-wrap items-center gap-3">
            <Lochi mood="thinking" size={64} />
            <div className="min-w-0 flex-1">
              <h2 id="prep" className="text-2xl">Opens {daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`} · Sunday {dayName(q.sunday)}</h2>
              <p className="text-muted">{q.review
                ? "You haven't practised anything this week yet, so right now Sunday would be a mixed review. Practise a few units and the quest will be built from them."
                : "This is what Sunday covers so far. It updates as you practise; the units with more mistakes get more questions. Revise these and you are ready."}</p>
            </div>
          </div>
          {q.units.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {q.units.map((u) => (
                <li key={`${u.course}:${u.unit}`} className="rounded-2xl border-2 border-line p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted">{u.short} · Unit {u.unit}</p>
                  <p className="font-extrabold text-head">{u.title}</p>
                  <p className="text-sm text-muted">{u.attempts > 0 ? `${u.attempts} answered this week, ${u.wrong} wrong · ` : ""}<b className="text-head">{u.questions} question{u.questions === 1 ? "" : "s"}</b> on Sunday</p>
                  <div className="mt-2 flex flex-wrap items-start gap-2">
                    <StartQuizButton kind="practice" course={u.course} unit={u.unit} className="btn !min-h-10 !px-4 !text-sm">Practise</StartQuizButton>
                    <Link href={`/learn/${u.course}/${u.unit}`} className="btn btn-ghost !min-h-10 !px-4 !text-sm">Re-read</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted">Rewards: {SUNDAY_XP.finish} XP for finishing, {SUNDAY_XP.perCorrect} XP per correct answer and a {SUNDAY_XP.bonus} XP bonus for 80% or more. Missed questions join your <Link href="/revise">Revise</Link> queue.</p>
          <Link href="/revise" className="btn btn-blue w-fit">Revise my mistakes now</Link>
        </section>
      ) : q.total === 0 ? (
        <p className="card text-muted">There are no practice questions for your subjects yet, so there is no quest this week.</p>
      ) : q.completed ? (
        <section className="card flex flex-col gap-4" aria-labelledby="done">
          <Celebrate id="sunday" day={q.sunday} />
          <div role="status" className="flex flex-wrap items-center gap-3">
            <Lochi mood="celebrate" size={64} />
            <h2 id="done" className="text-2xl">Quest complete!</h2>
            <span className="chip">{q.completed.score} of {q.total} correct</span>
            {q.completed.xp > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-gold-l px-3 py-1 font-black text-head"><ArtBolt size={20} />+{q.completed.xp} XP</span>}
          </div>
          <p className="text-muted">The next quest opens next Sunday and will be built from what you study this week.</p>
          <ol className="flex flex-col gap-3" aria-label="Your answers">
            {q.answers.map((r, i) => (
              <li key={i} className={`rounded-2xl border-2 p-3 ${r.ok ? "border-green bg-green-l" : "border-red bg-red-l"}`}>
                <p className="font-black text-head">{i + 1}. <Rich text={r.q} /></p>
                <p className="text-sm"><b>{r.ok ? "Correct" : "Your answer"}:</b> <Rich text={r.given} />{!r.ok && <> · <b>Right answer:</b> <Rich text={r.right} /></>}</p>
                {r.why && <p className="mt-1 text-sm text-muted"><Rich text={r.why} /></p>}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <>
          <p className="text-sm text-muted">Covers {q.units.map((u) => `${u.short} U${u.unit}`).join(", ")}. Open until midnight tonight (India time).</p>
          <DailyRunner questions={q.questions} answered={q.answered} submit={answerSunday} label="Quest progress" coach={q.coach} />
        </>
      )}

      <section className="card" aria-labelledby="hist">
        <h2 id="hist" className="mb-3 text-xl">Last 8 Sundays</h2>
        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {q.history.map((h) => (
            <li key={h.day} className={`rounded-xl border-2 p-2 text-center ${h.done ? "border-green bg-green-l" : "border-line"}`}>
              <span className="block text-xs text-muted">{dayName(h.day)}</span>
              <b className="text-head">{h.done ? `${h.score}/${h.total}` : "–"}</b>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
