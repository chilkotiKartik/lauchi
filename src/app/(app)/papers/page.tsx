import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { canSeeCourse } from "@/lib/stream";
import { PYQ_CODES, countQuestions, getPyq, SHORT } from "@/lib/pyq";
import { ArtPapers, ArtMock } from "@/components/art";

export const metadata: Metadata = { title: "Papers & PYQs Bank" };

const OFFICIAL_LINKS = [
  { title: "Official UTU Paper Portal", href: "https://online.uktech.ac.in/ums/public/Info/downloadpaper", blurb: "UTU official paper download portal. Filter by session, B.Tech/BCA branch, semester and course code.", cta: "Open University Portal" },
  { title: "Official Model Question Papers", href: "https://uktech.ac.in/en/page/model-question-paper", blurb: "Model sample papers published by the university board for examination preparation.", cta: "Open Model Papers" },
  { title: "Official UTU Syllabus Ordinances", href: "https://uktech.ac.in/en/page/syllabus", blurb: "Official university curriculum and credit system documents for verifying prescribed units.", cta: "Open Syllabus" },
];

export default async function PapersPage() {
  const { profile } = await requireOnboarded();
  const visibleCodes = PYQ_CODES.filter((c) => canSeeCourse(profile.branch, c));

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <header className="page-head flex items-center gap-3.5">
        <ArtPapers size={56} />
        <div>
          <h1 className="text-3xl font-black text-head">Question Papers &amp; PYQ Bank</h1>
          <p className="text-sm font-semibold text-muted">
            Solve complete end-semester 3-hour examination papers on the clock, drill previous year questions, and grade with official marking schemes.
          </p>
        </div>
      </header>

      {/* Hero Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/paper"
          className="card hero-card flex flex-col justify-between p-5 no-underline transition-transform hover:scale-[1.01]"
          style={{ ["--accent" as string]: "#1476b8" }}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue">Timed Simulator</span>
            <h2 className="mt-1 text-2xl font-black text-head">3-Hour Exam Simulator &rarr;</h2>
            <p className="mt-2 text-sm text-muted">
              Sit a real 100-mark UTU pattern examination paper (5 questions with internal choices). Write on paper, self-evaluate with model answers, and track your readiness.
            </p>
          </div>
          <span className="btn btn-blue mt-4 w-fit">Open Paper Simulator</span>
        </Link>

        <Link
          href="/pyq"
          className="card hero-card flex flex-col justify-between p-5 no-underline transition-transform hover:scale-[1.01]"
          style={{ ["--accent" as string]: "#ff5a5f" }}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-red-400">Question Bank</span>
            <h2 className="mt-1 text-2xl font-black text-head">Unit-Wise PYQ Bank &rarr;</h2>
            <p className="mt-2 text-sm text-muted">
              Explore 800+ solved university questions sorted by repeat frequency, with marking distribution, predicted upcoming topics, and 3D concept simulations.
            </p>
          </div>
          <span className="btn mt-4 w-fit bg-red-500 text-white hover:bg-red-600">Browse Solved PYQs</span>
        </Link>
      </div>

      {/* Available Subject Question Papers Grid */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-head">Your Subject Question Papers</h2>
          <span className="badge-new">{visibleCodes.length} Subjects Available</span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCodes.map((code) => {
            const subject = getPyq(code);
            if (!subject) return null;
            const qCount = countQuestions(subject);
            const short = SHORT[code] ?? subject.name;

            return (
              <div key={code} className="card flex flex-col justify-between gap-3 border-2 border-line p-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted">{code}</span>
                    <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-black text-head">
                      {qCount} Questions
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-black text-head">{short}</h3>
                  <p className="mt-1 text-xs font-bold text-muted line-clamp-2">{subject.name}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                  <Link
                    href={`/paper/${code}`}
                    className="btn btn-blue flex-1 py-2 text-xs font-black text-center"
                  >
                    Start Paper
                  </Link>
                  <Link
                    href={`/pyq?course=${code}`}
                    className="btn btn-ghost flex-1 py-2 text-xs font-black text-center border border-line"
                  >
                    View PYQs
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How to Master Past Papers */}
      <section className="card p-5" aria-labelledby="how-guide">
        <h2 id="how-guide" className="text-xl font-black text-head mb-3">
          How to Master UTU Semester Exams with Past Papers
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-2xl border border-line bg-soft/60 p-3.5">
            <b className="text-blue font-black">1. Timed Simulation</b>
            <p className="mt-1 text-xs text-muted">
              Start a 3-hour timer on lockin. Write answers by hand on physical paper without looking at references.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-soft/60 p-3.5">
            <b className="text-amber-500 font-black">2. Model Marking</b>
            <p className="mt-1 text-xs text-muted">
              Compare your written responses against step-by-step model marking rubrics to find missing points.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-soft/60 p-3.5">
            <b className="text-emerald-500 font-black">3. Drill Weak Units</b>
            <p className="mt-1 text-xs text-muted">
              Jump into the Duolingo practice path for any units where you lost marks to ensure 100% preparation.
            </p>
          </div>
        </div>
      </section>

      {/* Official External Portals */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-black text-head">Official University Portals</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.href} className="card flex flex-col justify-between gap-3 p-4">
              <div>
                <h3 className="text-sm font-black text-head">{l.title}</h3>
                <p className="mt-1 text-xs text-muted">{l.blurb}</p>
              </div>
              <a className="btn btn-ghost border border-line text-xs font-black" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.cta} &rarr;
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
