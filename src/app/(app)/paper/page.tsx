import type { Metadata } from "next";
import Link from "next/link";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { PAPER_COURSES } from "@/lib/paper";
import { Trend } from "@/components/paper/Trend";
import { History } from "@/components/paper/History";
import { loadHistory, shortName, subjectName } from "./data";

export const metadata: Metadata = { title: "Full paper" };

export default async function PaperHome() {
  const { supabase, profile } = await requireOnboarded();
  const rows = await loadHistory(supabase);
  const scores = rows.filter((r) => r.total !== null).map((r) => r.total as number).reverse();
  return (
    <div className="flex flex-col gap-5">
      <section className="pp-hall" aria-labelledby="ph">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="pp-eyebrow">Exam hall</p>
          <h1 id="ph" className="text-3xl text-white">Full 3-hour paper</h1>
          <p className="text-white/85">Sit a UTU-style end-semester paper on the clock: 5 questions, 100 marks, 3 hours. Write on paper, then mark yourself with model answers.</p>
        </div>
      </section>
      <section aria-labelledby="pick" className="flex flex-col gap-3">
        <h2 id="pick" className="text-xl">Pick a subject</h2>
        <ul className="enter grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAPER_COURSES.filter((c) => canSeeCourse(profile, c)).map((c) => (
            <li key={c}>
              <Link href={`/paper/${c}`} className="card hero-card flex h-full flex-col gap-1 no-underline">
                <b className="text-lg text-head">{shortName(c)}</b>
                <span className="text-sm text-muted">{subjectName(c)} · {c}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="hist" className="flex flex-col gap-3">
        <h2 id="hist" className="text-xl">Your past papers</h2>
        <Trend scores={scores} />
        <History rows={rows} />
      </section>
    </div>
  );
}
