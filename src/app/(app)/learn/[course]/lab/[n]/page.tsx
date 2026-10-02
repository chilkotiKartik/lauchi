import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { Crumbs } from "@/components/Crumbs";
import { Rich } from "@/lib/rich";

export async function generateMetadata({ params }: { params: Promise<{ course: string; n: string }> }): Promise<Metadata> {
  const p = await params; const e = getCourse(p.course)?.exps[+p.n - 1];
  return { title: e?.title ?? "Experiment" };
}

export default async function Experiment({ params }: { params: Promise<{ course: string; n: string }> }) {
  const { profile } = await requireOnboarded();
  const p = await params;
  const c = getCourse(p.course); const n = Number(p.n);
  const e = c && Number.isInteger(n) ? c.exps[n - 1] : undefined;
  if (!c || !e || !canSeeCourse(profile.branch, c.code, c.type)) notFound();
  return (
    <div className="flex flex-col gap-5">
      <Crumbs items={[{ href: "/learn", label: "Learn" }, { href: `/learn/${c.code}`, label: c.short }, { label: `Experiment ${e.n}` }]} />
      <h1 className="text-2xl sm:text-3xl">{e.title}</h1>
      {e.aim && <section className="card"><h2 className="mb-1 text-lg">Aim</h2><p>{e.aim}</p></section>}
      {e.apparatus && <section className="card"><h2 className="mb-1 text-lg">Apparatus</h2><p>{e.apparatus}</p></section>}
      {e.formula && <section className="card"><h2 className="mb-1 text-lg">Key formula</h2><p><Rich text={e.formula} /></p></section>}
      {e.viva.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="viva">
          <h2 id="viva" className="text-xl">Viva questions</h2>
          {e.viva.map(([q, a], i) => (
            <details key={i} className="card !py-3"><summary className="cursor-pointer font-black text-head">{q}</summary><p className="mt-2">{a}</p></details>
          ))}
        </section>
      )}
    </div>
  );
}
