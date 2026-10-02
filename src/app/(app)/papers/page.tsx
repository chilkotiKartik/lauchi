import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { ArtPapers } from "@/components/art";

export const metadata: Metadata = { title: "Papers & PYQs" };

const LINKS = [
  { title: "Official old question papers", href: "https://online.uktech.ac.in/ums/public/Info/downloadpaper", blurb: "The university's own paper portal. Pick the session, B.TECH, your branch and semester, then the paper code.", cta: "Open the paper portal" },
  { title: "Model question papers", href: "https://uktech.ac.in/en/page/model-question-paper", blurb: "Model papers the university publishes for several B.Tech branches and semesters.", cta: "Open model papers" },
  { title: "Official syllabus", href: "https://uktech.ac.in/en/page/syllabus", blurb: "The syllabus pages on the university website. Use them to double-check any unit.", cta: "Open the syllabus" },
];

export default async function Papers() {
  await requireOnboarded();
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtPapers size={56} /><div><h1 className="text-3xl">Papers &amp; PYQs</h1><p className="text-muted">We link to the university&apos;s own sources instead of re-hosting papers, so what you see is always the official copy.</p></div></header>
      <Link href="/pyq" className="card hero-card flex flex-col gap-1 no-underline" style={{ ["--accent" as string]: "#ff5a5f" }}>
        <b className="text-xl text-head">Open the PYQ bank →</b>
        <span className="text-muted">400+ previous-year questions for Physics, Chemistry, Electrical, Electronics and Mechanical, ranked by how often they were asked, with predicted topics and labs.</span>
      </Link>
      <ul className="enter grid gap-3 md:grid-cols-3">
        {LINKS.map((l) => (
          <li key={l.href} className="card flex flex-col gap-3">
            <h2 className="text-lg">{l.title}</h2>
            <p className="flex-1 text-[0.95rem]">{l.blurb}</p>
            <a className="btn btn-blue" href={l.href} target="_blank" rel="noopener noreferrer">{l.cta}</a>
          </li>
        ))}
      </ul>
      <section className="card" aria-labelledby="how">
        <h2 id="how" className="mb-2 text-xl">How to use a past paper with lockin.</h2>
        <ol className="ml-5 flex list-decimal flex-col gap-1 leading-relaxed">
          <li>Attempt it timed, before looking anything up. A <Link href="/mock">mock test</Link> is good warm-up.</li>
          <li>For each question you miss, note the unit it came from.</li>
          <li>Drill that unit in <Link href="/practice">Practice</Link> or do its <Link href="/assignments">assignment</Link>.</li>
          <li>Stuck on a method? Ask Lochi.</li>
        </ol>
      </section>
    </div>
  );
}
