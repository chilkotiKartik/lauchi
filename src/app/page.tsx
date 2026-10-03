import Link from "next/link";
import { HeroLochi } from "@/components/HeroLochi";
import { Lochi } from "@/components/Lochi";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArtAsk, ArtBolt, ArtFlame, ArtLab, ArtLeague, ArtMock, ArtPractice, ArtPapers, ArtTarget, ArtVideo } from "@/components/art";
import { getSession } from "@/lib/auth";
import { LABS } from "@/labs/registry";
import { listCourses } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { PYQ_CODES, countQuestions, getPyq } from "@/lib/pyq";
import { SeeItMove } from "@/components/home/SeeItMove";

import { Footer } from "@/components/Footer";
import { QuickThemeToggle } from "@/components/QuickThemeToggle";

const steps = [
  ["Sign in", "Create an account with your email and a password, or get a one-tap sign-in link by email."],
  ["Tell us your semester", "Name, branch and semester. Under a minute."],
  ["Drill, explore, repeat", "Fresh questions every round, 3D labs for hard ideas, and a plan that counts down to your exam."],
];
const rules = [
  ["150", "marks per theory subject: 30 class tests + 20 teacher's assessment + 100 end sem", "#1476b8"],
  ["30 & 60", "to pass: at least 30 in the end sem and 60 of 150 overall (40%)", "#23773a"],
  ["O → F", "eight grades on a 10-point scale, from O (90%+) to P (40%+)", "#7a3fd6"],
  ["PYQs", "linked straight to UTU's official old question paper portal", "#b35900"],
] as const;

export default async function Landing() {
  const session = await getSession();
  const cta = session ? { href: "/home", label: "Open dashboard" } : { href: "/login", label: "Start free" };
  const courses = listCourses();
  const banks = courses.filter((c) => courseUnits(c.code).length > 0).length;
  const pyqCount = PYQ_CODES.reduce((n, code) => { const s = getPyq(code); return n + (s ? countQuestions(s) : 0); }, 0);
  const moveStats = [
    { label: "live 3D labs", value: LABS.length },
    { label: "past-paper questions", value: pyqCount },
    { label: "courses", value: courses.length },
  ];
  const features = [
    { Icon: ArtLab, title: "3D explainers", body: `${LABS.length} live 3D labs. Spin a saddle point, watch an EM wave travel, change any value and see what happens.`, accent: "#ffc83d" },
    { Icon: ArtPractice, title: "Practice by unit", body: `Endless fresh questions per unit in ${banks} subjects. Most are generated on the spot with the answer worked out by code.`, accent: "#2ba6f5" },
    { Icon: ArtMock, title: "Timed mock tests", body: "Question palette, a real countdown and no answers until you submit. The exam hall stops being new.", accent: "#ff9a1f" },
    { Icon: ArtPapers, title: "Papers & PYQs", body: "Links to the university's own old and model papers, plus assignments for every unit that has questions.", accent: "#ff5a5f" },
    { Icon: ArtVideo, title: "Lectures by unit", body: "One tap from any topic to a YouTube search for it. No fake video links.", accent: "#ff5a5f" },
    { Icon: ArtAsk, title: "Ask Lochi (AI)", body: "Stuck at 1 a.m.? Get a step-by-step explanation of the exact thing you missed.", accent: "#a970ff" },
    { Icon: ArtLeague, title: "Streaks & league", body: "Daily goals, badges and an optional weekly XP league that shows only first names.", accent: "#ffc83d" },
  ];
  return (
    <div className="min-h-dvh">
      <div className="aurora" aria-hidden><i /><i /><i /><i /></div>
      <header className="sticky top-0 z-20 border-b-2 border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <Link href="/" aria-label="lockin. home" className="flex shrink-0 items-center gap-2 text-xl font-black text-green-t no-underline sm:text-2xl"><Lochi mood="idle" size={36} /><span className="hidden min-[400px]:inline">lockin<span className="text-head">.</span></span></Link>
          <nav aria-label="Account" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <QuickThemeToggle compact />
            {!session && <Link href="/login" className="btn btn-ghost !min-h-11 whitespace-nowrap !px-3 !text-sm sm:!px-6 sm:!text-base">Log in</Link>}
            <Link href={cta.href} className="btn !min-h-11 whitespace-nowrap !px-3 !text-sm sm:!px-6 sm:!text-base">{session ? "Dashboard" : "Get started"}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-10 pt-8 md:grid-cols-2 md:pt-12" aria-labelledby="hero-h">
          <div className="enter flex flex-col items-start gap-5">
            <div className="flex flex-wrap gap-2"><span className="pill !px-3 text-xs uppercase tracking-wide">For UTU B.Tech students</span><span className="pill !px-3 text-xs uppercase tracking-wide">Unofficial</span></div>
            <h1 id="hero-h" className="text-5xl leading-[1.05] sm:text-6xl">
              Stop scrolling notes.<br /><span className="text-green-t">Lock in</span> on the units that <span className="text-purple">cost you marks.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted">Pick your branch and semester. lockin. finds your weak units, drills you on them with 3D explainers, and tells you exactly what you need in the end sem.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={cta.href} className="btn !min-h-14 !px-8">{cta.label}</Link>
              <Link href="/labs" className="btn btn-ghost !min-h-14 !px-8">Try the 3D labs</Link>
            </div>
            <p className="text-sm font-extrabold text-muted">{courses.length} courses · {LABS.length} live 3D labs · questions for {banks} subjects · free</p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <HeroLochi big />
            <span className="pill floaty absolute left-0 top-[14%] shadow-lg" style={{ animationDelay: "0s" }}><ArtFlame size={24} />Daily streak</span>
            <span className="pill floaty absolute right-0 top-[34%] shadow-lg" style={{ animationDelay: ".8s" }}><ArtTarget size={24} />End-sem readiness</span>
            <span className="pill floaty absolute bottom-[12%] left-[6%] shadow-lg" style={{ animationDelay: "1.6s" }}><ArtBolt size={24} />XP for every quiz</span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10" aria-labelledby="feat-h">
          <Reveal><h2 id="feat-h" className="text-3xl sm:text-4xl">Everything for your semester, in one place</h2><p className="mt-2 max-w-xl text-muted">Built around the UTU scheme: your subject codes, units and marking rules.</p></Reveal>
          <Stagger as="ul" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, body, accent }) => (
              <StaggerItem as="li" key={title} className="card flex flex-col gap-2">
                <span className="disc" style={{ ["--accent" as string]: accent }}><Icon size={38} /></span>
                <h3 className="text-lg">{title}</h3>
                <p className="text-[0.95rem] text-muted">{body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <SeeItMove stats={moveStats} />

        <section className="mx-auto max-w-6xl px-5 py-10" aria-labelledby="how">
          <Reveal><h2 id="how" className="text-3xl sm:text-4xl">How it works</h2></Reveal>
          <Stagger as="ol" className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <StaggerItem as="li" key={t} className="card flex flex-col gap-2">
                <b className="grid h-10 w-10 place-items-center rounded-full bg-green text-lg text-[#0d3a19] shadow-[0_3px_0_var(--green-d)]">{i + 1}</b>
                <h3 className="text-lg">{t}</h3><p className="text-[0.95rem] text-muted">{d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10" aria-labelledby="rules">
          <Reveal><h2 id="rules" className="text-3xl sm:text-4xl">UTU rules, already built in</h2></Reveal>
          <Stagger as="ul" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map(([big, body, bg]) => (
              <StaggerItem as="li" key={big} className="rounded-3xl p-5 text-white" style={{ background: bg }}>
                <p className="text-4xl font-black text-white">{big}</p><p className="mt-2 font-bold leading-snug text-white">{body}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-3 text-sm text-muted">From the university&apos;s <a href="https://uktech.ac.in/en/page/syllabus" target="_blank" rel="noopener noreferrer">syllabus</a> pages and ordinances. Always confirm with your college.</p>
        </section>

        <Reveal className="mx-auto max-w-6xl px-5 py-10">
          <section aria-labelledby="cta-h" className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#7a3fd6] p-8 sm:flex-row sm:items-center sm:p-10">
            <div><h2 id="cta-h" className="text-3xl !text-white sm:text-4xl">Your end sem, but you walk in knowing your number.</h2><p className="mt-2 font-bold text-white/90">Free to start. Set up takes a minute.</p></div>
            <Link href={cta.href} className="btn !min-h-14 !bg-gold !px-8 !text-[#5a3d00] !shadow-[0_4px_0_#e0a300]">{session ? "Dashboard" : "Start now"}</Link>
          </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
