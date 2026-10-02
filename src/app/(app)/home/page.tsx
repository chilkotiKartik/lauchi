import type { Metadata } from "next";
import Link from "next/link";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { levelFromXp } from "@/lib/xp";
import { branchName } from "@/lib/academics";
import { loadActivity, quizzedTopics } from "@/lib/activity";
import { doneTopics } from "@/lib/progress";
import { accuracy, badges, bestStreak, dailyQuests, leaking, readiness } from "@/lib/insights";
import { allUnitStats } from "@/lib/mock-units";
import { daysBetween } from "@/lib/plan";
import { getCourse } from "@/lib/syllabus";
import { HeroLochi } from "@/components/HeroLochi";
import { ArtLab, ArtMock, ArtPractice, ArtTarget, ArtFormula } from "@/components/art";
import { ProgressRing } from "@/components/ProgressRing";
import { Heatmap } from "@/components/Heatmap";
import { StartQuizButton } from "@/components/StartQuizButton";
import { Tilt } from "@/components/Tilt";
import { BadgeArt } from "@/components/BadgeArt";
import { ListenButton } from "@/components/Voice";
import { boostFor, moodLine } from "@/lib/motivation";
import { ArtFocus, ArtPyq, ArtRevise, ArtFriends } from "@/components/art";
import { Lochi } from "@/components/Lochi";
import { dueCount } from "@/lib/revise";
import { visibleLabs } from "@/lib/stream";
import { LABS } from "@/labs/registry";
import { HomeScene } from "@/components/home/HomeScene";
import { MissionStrip } from "@/components/home/MissionStrip";
import { dayNames, lastDays, pickLab } from "@/components/home/data";

export const metadata: Metadata = { title: "Dashboard" };

type Stats = { total_xp: number; today_xp: number; streak: number; today: string; days: Record<string, number> };

const QUICK = [
  { href: "/practice", label: "Practice", Icon: ArtPractice, accent: "#44c95a" },
  { href: "/mock", label: "Mock test", Icon: ArtMock, accent: "#a970ff" },
  { href: "/labs", label: "3D labs", Icon: ArtLab, accent: "#ffc83d" },
  { href: "/formulas", label: "Formula cards", Icon: ArtFormula, accent: "#ff9a1f" },
];

export default async function Home() {
  const { supabase, profile } = await requireOnboarded();
  const statsPromise = supabase.rpc("dashboard_stats");
  const activityPromise = loadActivity(supabase);
  const donePromise = doneTopics(supabase);
  const duePromise = dueCount(supabase);

  const [{ data: statsData, error }, { sessions, events }, done, due] = await Promise.all([
    statsPromise,
    activityPromise,
    donePromise,
    duePromise,
  ]);

  const stats = statsData as Stats | null;
  if (error || !stats) return <p className="err" role="alert">We couldn&apos;t load your stats. Refresh the page to try again.</p>;

  const fixStatsPromise = allUnitStats(profile.id, sessions);
  const lv = levelFromXp(stats.total_xp);
  const goalDone = stats.today_xp >= profile.daily_goal_xp;
  const acc = accuracy(sessions);
  const pool = quizzedTopics(profile.branch);
  const ready = readiness(done.size, pool.total, acc?.pct ?? null);
  const rawFix = await fixStatsPromise;
  const fix = leaking(rawFix.filter((u) => canSeeCourse(profile.branch, u.course)));
  const quests = dailyQuests({ today: stats.today, tz: profile.timezone, todayXp: stats.today_xp, goal: profile.daily_goal_xp, sessions, events });
  const earned = badges({ totalXp: stats.total_xp, level: lv.level, sessions, topicsDone: done.size, best: Math.max(stats.streak, bestStreak(stats.days)) }).filter((b) => b.earned);
  const left = profile.exam_date ? daysBetween(stats.today, profile.exam_date) : null;
  const line = goalDone ? "Daily goal done. Brilliant!" : stats.streak > 0 ? `${stats.streak}-day streak. Keep it alive today.` : "Earn your first XP today to start a streak.";

  const top = fix[0] ?? null;
  const topCourse = top ? getCourse(top.course) : null;
  const weak = top && topCourse ? { course: top.course, unit: top.unit, pct: top.pct, label: `${topCourse.short}: ${topCourse.units[top.unit - 1]?.title ?? `Unit ${top.unit}`}` } : null;
  const lab = pickLab(visibleLabs(profile.branch, LABS), top ? { course: top.course, unit: top.unit } : null);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="enter flex min-w-0 flex-col gap-5">
        <Tilt max={3}>
          <section className="card hero-card flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left" style={{ ["--accent" as string]: "#44c95a" }} aria-label="Welcome">
            <div className="floaty"><HeroLochi /></div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl">Welcome back, {profile.name}!</h1>
              <p className="text-lg">{line}</p>
              <p className="text-sm text-muted">{branchName(profile.branch)} · Semester {profile.semester === 1 ? "I" : "II"} · Level {lv.level}</p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link href="/practice" className="btn">Practice now</Link>
                <Link href="/learn" className="btn btn-ghost">Continue learning</Link>
              </div>
            </div>
          </section>
        </Tilt>

        <HomeScene
          week={lastDays(stats.today, stats.days, 7)} names={dayNames(stats.today, 7)} todayXp={stats.today_xp} goal={profile.daily_goal_xp}
          streak={stats.streak} level={lv.level} levelInto={lv.into} levelSpan={lv.span} quote={boostFor(stats.today, 1)}
        />

        <MissionStrip due={due} weak={weak} lab={lab ? { id: lab.id, title: lab.title } : null} />

        <Tilt max={3}>
          <Link href="/revise" className="card flex items-center gap-4 no-underline" style={{ ["--accent" as string]: "#2ba6f5" }}>
            {due > 0 ? <span className="floaty"><ArtRevise size={56} /></span> : <Lochi mood="happy" size={56} />}
            <span className="min-w-0 flex-1">
              <h2 className="text-xl">Revise today ({due})</h2>
              <span className="block text-sm text-muted">{due > 0 ? `${due} ${due === 1 ? "question is" : "questions are"} ready to revise before you forget ${due === 1 ? "it" : "them"}.` : "Nothing to revise right now. Lochi is proud of you."}</span>
            </span>
            <span className="btn shrink-0">{due > 0 ? "Revise" : "Open"}</span>
          </Link>
        </Tilt>

        <section className="card boost flex flex-col gap-3" aria-labelledby="boost">
          {[12, 30, 52, 74, 90].map((x, i) => <span key={x} aria-hidden className="spark" style={{ left: `${x}%`, bottom: 8, animationDelay: `${i * 0.7}s` }} />)}
          <div className="flex items-center justify-between gap-2"><h2 id="boost" className="text-xs font-black uppercase tracking-widest text-muted">Today&apos;s boost</h2><ListenButton text={`${boostFor(stats.today)} ${moodLine({ streak: stats.streak, todayXp: stats.today_xp, goal: profile.daily_goal_xp, daysLeft: left })}`} label="Hear it" /></div>
          <blockquote>“{boostFor(stats.today)}”</blockquote>
          <p className="font-bold text-head">{moodLine({ streak: stats.streak, todayXp: stats.today_xp, goal: profile.daily_goal_xp, daysLeft: left })}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/focus" className="voice-btn no-underline"><ArtFocus size={20} /> Start a 25-min focus</Link>
            <Link href="/pyq" className="voice-btn no-underline"><ArtPyq size={20} /> Most-asked PYQs</Link>
          </div>
        </section>

        <section aria-label="Quick actions" className="enter grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK.map(({ href, label, Icon, accent }) => (
            <Tilt key={href}><Link href={href} className="tile items-center text-center" style={{ ["--accent" as string]: accent }}><span className="disc"><Icon size={38} /></span><b>{label}</b></Link></Tilt>
          ))}
        </section>

        <section className="card" aria-labelledby="fix">
          <div className="mb-3 flex items-center justify-between"><h2 id="fix" className="text-xl">Units to fix first</h2><span className="badge-new">From your quizzes</span></div>
          {fix.length === 0 ? (
            <p className="text-muted">Take a practice quiz and lockin. will show the units where you lose the most marks.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {fix.map((u) => {
                const c = getCourse(u.course);
                return (
                  <li key={`${u.course}${u.unit}`} className="flex items-center gap-3 rounded-2xl bg-soft p-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1476b8] font-black text-white">U{u.unit}</span>
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-head">{c?.short}: {c?.units[u.unit - 1]?.title}</p><p className="text-sm text-muted">{u.pct}% right over {u.attempts} {u.attempts === 1 ? "quiz" : "quizzes"}</p></div>
                    <StartQuizButton kind="practice" course={u.course} unit={u.unit}>Fix</StartQuizButton>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="qs">
          <div className="mb-3 flex items-center justify-between"><h2 id="qs" className="text-xl">Today&apos;s quests</h2><Link href="/quests" className="text-sm font-black uppercase">All quests</Link></div>
          <ul className="flex flex-col gap-3">
            {quests.map((q) => (
              <li key={q.id} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${q.value >= q.target ? "bg-green text-[#0d3a19]" : "bg-soft text-muted"}`} aria-hidden>{q.value >= q.target ? "✓" : ""}</span>
                <div className="flex-1"><p className="font-black text-head">{q.title}</p><div className="bar mt-1" role="progressbar" aria-label={q.title} aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={q.value}><i style={{ width: `${(q.value / q.target) * 100}%` }} /></div></div>
                <span className="text-sm tabular-nums text-muted">{q.value}/{q.target}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-label="Activity">
          <h2 className="mb-3 text-xl">Last 12 weeks</h2>
          <Heatmap today={stats.today} days={stats.days} />
        </section>
      </div>

      <aside className="enter flex flex-col gap-5" aria-label="Summary">
        <section className="card flex items-center gap-4" aria-label="Daily goal">
          <ProgressRing value={stats.today_xp} max={profile.daily_goal_xp} label="Daily goal" />
          <div><h2 className="text-lg">Daily goal</h2><p className="text-muted">{stats.today_xp} of {profile.daily_goal_xp} XP today</p></div>
        </section>
        <section className="card flex flex-col gap-3" aria-label="Readiness">
          <div className="flex items-center gap-4">
            <ProgressRing value={ready.score} max={100} label="Readiness" color="var(--blue)" />
            <div><h2 className="text-lg">Readiness</h2><p className="text-sm text-muted">Half syllabus done, half quiz accuracy</p></div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-soft p-2"><dt className="text-muted">Topics done</dt><dd className="font-black text-head">{done.size} of {pool.total}</dd></div>
            <div className="rounded-xl bg-soft p-2"><dt className="text-muted">Quiz accuracy</dt><dd className="font-black text-head">{acc ? `${acc.pct}%` : "No quiz yet"}</dd></div>
          </dl>
          <p className="text-xs text-muted">Measured over the {pool.courses} subjects that have quizzes.</p>
        </section>
        <section className="card flex items-center gap-4" aria-label="Exam countdown">
          <ArtTarget size={52} />
          {left === null ? (
            <div><h2 className="text-lg">Exam countdown</h2><p className="text-sm text-muted">Set your exam date in <Link href="/settings">Settings</Link> to unlock a study plan.</p></div>
          ) : left > 0 ? (
            <div><h2 className="text-lg">{left} {left === 1 ? "day" : "days"} to go</h2><p className="text-sm text-muted"><Link href="/plan">See your study plan</Link></p></div>
          ) : (
            <div><h2 className="text-lg">{left === 0 ? "Exam day. You've got this!" : "Exam date has passed"}</h2><p className="text-sm text-muted">Update it in <Link href="/settings">Settings</Link>.</p></div>
          )}
        </section>
        <section className="card" aria-labelledby="bd">
          <div className="mb-2 flex items-center justify-between"><h2 id="bd" className="text-lg">Badges</h2><Link href="/progress" className="text-sm font-black uppercase">All</Link></div>
          {earned.length === 0 ? <p className="text-sm text-muted">Finish a quiz to earn your first badge.</p> : (
            <ul className="flex flex-wrap gap-2">{earned.map((b) => <li key={b.id} title={b.title} className="grid place-items-center rounded-2xl bg-soft p-2"><BadgeArt art={b.art} size={40} /><span className="sr-only">{b.title}</span></li>)}</ul>
          )}
        </section>
      </aside>
    </div>
  );
}
