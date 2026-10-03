import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses, type CourseSummary } from "@/lib/syllabus";
import { searchSyllabus } from "@/lib/search";
import { ArtSyllabus } from "@/components/art";

export const metadata: Metadata = { title: "Syllabus" };

const TYPES: { id: CourseSummary["type"] | "all"; label: string }[] = [
  { id: "all", label: "All" }, { id: "theory", label: "Theory" }, { id: "lab", label: "Labs" }, { id: "bridge", label: "Bridge" }, { id: "minor", label: "Minor" },
];
const ACCENT: Record<string, string> = { theory: "#2ba6f5", lab: "#ffc83d", bridge: "#a970ff", minor: "#ff5a5f" };

export default async function Syllabus({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { profile } = await requireOnboarded();
  const mine = visibleCourses(profile, listCourses());
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const type = TYPES.some((t) => t.id === sp.type) ? (sp.type as CourseSummary["type"] | "all") : "all";
  const courses = mine.filter((c) => type === "all" || c.type === type);
  const { hits, total } = searchSyllabus(q, type, profile);
  const href = (t: string) => `/syllabus?${new URLSearchParams({ ...(q ? { q } : {}), ...(t !== "all" ? { type: t } : {}) })}`;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtSyllabus size={56} /><div><h1 className="text-3xl">Syllabus</h1><p className="text-muted">All {mine.length} courses. Search any topic or experiment.</p></div></header>
      <form role="search" className="flex gap-2" action="/syllabus">
        <input className="field" type="search" name="q" defaultValue={q} placeholder="Try “Taylor”, “diode” or “pointer”" aria-label="Search topics and experiments" maxLength={60} />
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        <button className="btn btn-blue" type="submit">Search</button>
      </form>
      <nav aria-label="Course type" className="flex flex-wrap gap-2">
        {TYPES.map((t) => <Link key={t.id} href={href(t.id)} aria-current={type === t.id ? "true" : undefined} className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold no-underline ${type === t.id ? "border-blue bg-blue-l text-blue-t" : "border-line text-ink"}`}>{t.label}</Link>)}
      </nav>
      {q.trim().length >= 2 ? (
        <section aria-live="polite" className="flex flex-col gap-3">
          <p className="text-muted">{total === 0 ? "No topic matches that. Try a shorter word." : `${total} match${total === 1 ? "" : "es"}${total > hits.length ? `, showing ${hits.length}` : ""}.`}</p>
          <ul className="flex flex-col gap-2">
            {hits.map((h) => (
              <li key={h.href}><Link href={h.href} className="card flex items-center gap-3 !p-3 text-ink no-underline hover:border-blue">
                <span className="rounded-lg bg-blue-l px-2 py-1 text-xs font-black text-blue-t">{h.short}</span>
                <span className="flex-1"><b className="text-head">{h.title}</b><br /><span className="text-sm text-muted">{h.where}{h.kind === "experiment" ? " · lab" : ""}</span></span>
                <span aria-hidden className="text-blue-t">→</span>
              </Link></li>
            ))}
          </ul>
        </section>
      ) : (
        <ul className="enter grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.code}><Link href={`/learn/${c.code}`} className="tile h-full" style={{ ["--accent" as string]: ACCENT[c.type] }}>
              <span className="text-xs font-black tracking-wide text-muted">{c.code} · {c.type.toUpperCase()} · {c.credits} {c.credits === 1 ? "credit" : "credits"}</span>
              <b>{c.name}</b>
              <span className="text-sm text-muted">{c.units} {c.units === 1 ? "unit" : "units"} · {c.items} {c.type === "lab" ? "experiments" : "topics"}</span>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
