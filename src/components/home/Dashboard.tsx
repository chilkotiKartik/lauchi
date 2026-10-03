import Link from "next/link";
import { ArtFlame } from "@/components/art";
import { FreezeIcon } from "@/components/daily/FreezeIcon";
import type { SubjectProgress, UnitState } from "@/lib/subject-progress";
import { nextMilestone } from "@/lib/subject-progress";

const PALETTE = ["#1476b8", "#157a37", "#8a6508", "#b33c0b", "#8a4fd6", "#c2303a", "#0b7069", "#4a5a63"]; // white symbols stay legible (≥ 4.8:1)
/** A symbol that says the subject at a glance (falls back to its first letter). */
function symbolFor(name: string): string {
  const n = name.toLowerCase();
  if (/physics/.test(n)) return "φ";
  if (/chem/.test(n)) return "⌬";
  if (/math|calculus|algebra|statistic/.test(n)) return "∫";
  if (/electrical/.test(n)) return "Ω";
  if (/electronic|digital/.test(n)) return "⏚";
  if (/program|problem solving|\bc\b|java|python|data structure/.test(n)) return "{}";
  if (/mechanic|engineering graphics|drawing|workshop/.test(n)) return "⚙";
  if (/environment|ecology|life/.test(n)) return "♻";
  if (/web|internet/.test(n)) return "</>";
  if (/communication|english|language/.test(n)) return "Aa";
  return name.trim()[0]?.toUpperCase() ?? "?";
}
const BAR: Record<UnitState, string> = { new: "var(--line)", started: "var(--blue)", weak: "var(--red)", ok: "var(--gold)", strong: "var(--green)" };
const WORD: Record<UnitState, string> = { new: "not started", started: "reading", weak: "needs work", ok: "good", strong: "strong" };

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <span className="relative grid h-14 w-14 shrink-0 place-items-center" role="img" aria-label={label}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        {pct > 0 && <circle cx="28" cy="28" r={r} fill="none" stroke="var(--green)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />}
      </svg>
      <b className="text-xs text-head">{pct}%</b>
    </span>
  );
}

/** "Your subjects": tap a subject to open its level path. Bars are units, coloured from real quiz and reading data. */
export function SubjectGrid({ subjects }: { subjects: SubjectProgress[] }) {
  return (
    <section aria-labelledby="subj-h" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="subj-h" className="text-xl">Your subjects</h2>
        <Link href="/learn" className="text-sm font-black uppercase">All</Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {subjects.map((s, i) => {
          const color = PALETTE[i % PALETTE.length];
          const tested = s.units.filter((u) => u.attempts > 0).length;
          return (
            <li key={s.code}>
              <Link href={`/learn/${s.code}`} className="tile h-full !gap-3 !p-4" style={{ ["--accent" as string]: color }} aria-label={`${s.name}: ${s.pct}% of topics done. Open the level path`}>
                <span className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.18)]" style={{ background: color }} aria-hidden>{symbolFor(s.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-black uppercase tracking-wide text-muted">{s.code} · {s.credits} cr</span>
                    <b className="block leading-snug text-head">{s.name}</b>
                  </span>
                  <Ring pct={s.pct} label={`${s.pct}% of topics done`} />
                </span>
                {s.units.length > 0 && (
                  <span className="flex gap-1.5" aria-label={s.units.map((u) => `Unit ${u.n} ${WORD[u.state]}`).join(", ")}>
                    {s.units.map((u) => <span key={u.n} className="h-2.5 flex-1 rounded-full" style={{ background: BAR[u.state] }} title={`Unit ${u.n}: ${u.title} · ${WORD[u.state]}${u.pct !== null ? ` (${u.pct}%)` : ""}`} />)}
                  </span>
                )}
                <span className="text-xs font-bold text-muted">{s.units.length} units{s.labs ? ` · ${s.labs} 3D labs` : ""}{tested ? ` · ${tested} tested` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** One place for the streak: count, this week, freezes, the next milestone and what to do today. */
export function StreakCard({ streak, freezes, week, todayXp, goal, mood }: { streak: number; freezes: number; week: { key: string; name: string; xp: number; today: boolean }[]; todayXp: number; goal: number; mood: "done" | "todo" | "risk" }) {
  const next = nextMilestone(streak);
  const line = mood === "done" ? (todayXp >= goal ? "Streak safe for today, and your daily goal is met." : `Streak safe for today. ${goal - todayXp} XP more for your daily goal.`)
    : mood === "risk" ? "Your streak ends at midnight. One quick quiz keeps it alive!" : streak > 0 ? "Earn any XP today to extend your streak." : "Earn your first XP today to start a streak.";
  return (
    <section aria-label="Streak" className={`card flex flex-col gap-3 ${mood === "risk" ? "!border-orange" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={mood === "done" ? "floaty" : mood === "risk" ? "animate-pulse" : "opacity-60 grayscale"}><ArtFlame size={52} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-black leading-none text-head">{streak} <span className="text-lg">day streak</span></p>
          <p className="mt-1 text-sm text-muted">{line}</p>
        </div>
        <span className="pill shrink-0" title="Streak freezes save your streak on a missed day. You earn one every 7 days (max 2)."><FreezeIcon />&nbsp;<b>{freezes}</b><span className="sr-only"> streak freezes</span></span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="This week">
        {week.map((d) => (
          <li key={d.key} className="flex flex-col items-center gap-1">
            <span aria-hidden className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-black ${d.xp > 0 ? "border-orange bg-orange text-[#3d2000]" : d.today ? "border-orange text-orange" : "border-line text-muted"}`}>{d.xp > 0 ? "✓" : ""}</span>
            <span aria-hidden className={`text-[11px] font-black uppercase ${d.today ? "text-head" : "text-muted"}`}>{d.name.slice(0, 2)}</span>
            <span className="sr-only">{d.name}{d.today ? " (today)" : ""}: {d.xp > 0 ? `${d.xp} XP` : "no XP"}</span>
          </li>
        ))}
      </ol>
      <div>
        <div className="flex justify-between text-xs font-bold text-muted"><span>Next milestone: {next} days</span><span>{streak}/{next}</span></div>
        <div className="bar mt-1" role="progressbar" aria-label="Progress to the next streak milestone" aria-valuemin={0} aria-valuemax={next} aria-valuenow={streak}><i style={{ width: `${Math.min(100, (streak / next) * 100)}%`, background: "var(--orange)" }} /></div>
      </div>
      {mood !== "done" && <Link href="/daily" className="btn">{mood === "risk" ? "Save my streak" : "Do today's challenge"}</Link>}
    </section>
  );
}

/** End-semester countdown: days left, readiness and how many units are leaking marks. */
export function ExamCard({ left, ready, weak }: { left: number | null; ready: number; weak: number }) {
  const cells: [string, string, string | null][] = [
    [left === null ? "—" : String(Math.max(0, left)), left === null ? "set date" : left === 1 ? "day" : "days", left === null ? "/settings" : "/plan"],
    [`${ready}%`, "ready", "/progress"],
    [String(weak), weak === 1 ? "weak unit" : "weak units", weak ? "#fix" : null],
  ];
  return (
    <section aria-labelledby="exam-h" className="card flex flex-col gap-3">
      <h2 id="exam-h" className="text-xl">End semester exam</h2>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(([v, k, href]) => {
          const inner = <><span className="block text-2xl font-black text-head">{v}</span><span className="block text-xs font-bold text-muted">{k}</span></>;
          return href ? <Link key={k} href={href} className="rounded-2xl border-2 border-line bg-soft p-3 text-center no-underline hover:border-blue">{inner}</Link>
            : <div key={k} className="rounded-2xl border-2 border-line bg-soft p-3 text-center">{inner}</div>;
        })}
      </div>
    </section>
  );
}
