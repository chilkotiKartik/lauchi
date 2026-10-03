import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { visibleCourses } from "@/lib/stream";
import { getCourse, listCourses } from "@/lib/syllabus";
import { DOUBT_DAILY_LIMIT, STATUS_LABEL, kindLabel, libraryFor, searchSchema } from "@/lib/doubts";
import { AskForm, type CourseOpt } from "@/components/doubts/AskForm";
import { HelpfulButton } from "@/components/doubts/DoubtActions";
import { ArtAsk } from "@/components/art";

export const metadata: Metadata = { title: "Doubt box" };

export default async function Doubts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const q = searchSchema.parse(((await searchParams).q ?? "").toString());
  const courses: CourseOpt[] = visibleCourses(profile, listCourses()).flatMap((s) => {
    const c = getCourse(s.code);
    return c && c.units.length ? [{ code: c.code, short: c.short, units: c.units.map((u) => ({ n: u.n, title: u.title.slice(0, 80) })) }] : [];
  });
  const short = (code: string) => courses.find((c) => c.code === code)?.short ?? code;
  const [mine, lib] = await Promise.all([
    supabase.from("doubts").select("id,course,unit,title,status,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.rpc("public_doubts", { p_q: q || null }),
  ]);
  const myRows = (mine.data ?? []) as { id: string; course: string; unit: number | null; title: string; status: keyof typeof STATUS_LABEL; created_at: string }[];
  const shared = libraryFor(profile, lib.data).slice(0, 50);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtAsk size={56} /><div><h1 className="text-3xl">Doubt box</h1><p className="text-muted">Stuck on something? Ask here. A teacher answers, and Lochi can write a first answer to get you moving.</p></div></header>
      <section className="card flex flex-col gap-3" aria-labelledby="ask-h">
        <h2 id="ask-h" className="text-xl">Ask a doubt</h2>
        <AskForm courses={courses} limit={DOUBT_DAILY_LIMIT} />
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="mine-h">
        <h2 id="mine-h" className="text-xl">My doubts</h2>
        {myRows.length === 0 ? <p className="card text-muted">You haven&apos;t asked anything yet.</p> : (
          <ul className="flex flex-col gap-2">
            {myRows.map((d) => (
              <li key={d.id}><Link href={`/doubts/${d.id}`} className="card flex flex-wrap items-center gap-2 text-ink no-underline hover:bg-soft">
                <span className="min-w-0 flex-1 break-words"><b className="text-head">{d.title}</b><br /><span className="text-sm text-muted">{short(d.course)}{d.unit ? ` · Unit ${d.unit}` : ""}</span></span>
                <span className={`chip ${d.status === "open" ? "chip-hot" : "chip-soft"}`}>{STATUS_LABEL[d.status] ?? d.status}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="lib-h">
        <h2 id="lib-h" className="text-xl">Shared library</h2>
        <p className="text-sm text-muted">Doubts other students asked that a teacher checked and published. Nobody&apos;s name is shown.</p>
        <form role="search" method="get" className="flex gap-2">
          <label className="sr-only" htmlFor="lib-q">Search the shared library</label>
          <input id="lib-q" className="field flex-1" type="search" name="q" defaultValue={q} maxLength={80} placeholder="Search answered doubts" />
          <button className="btn">Search</button>
        </form>
        {lib.error ? <p className="err" role="alert">We couldn&apos;t load the library. Refresh to try again.</p>
          : shared.length === 0 ? <p className="card text-muted">{q ? `No published doubts match “${q}”.` : "Nothing has been published yet."}</p> : (
          <ul className="flex flex-col gap-2">
            {shared.map((d) => (
              <li key={d.id}><details className="card !p-0">
                <summary className="cursor-pointer p-4"><b className="text-head">{d.title}</b><span className="block text-sm text-muted">{short(d.course)}{d.unit ? ` · Unit ${d.unit}` : ""}</span></summary>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <p className="whitespace-pre-wrap break-words">{d.body}</p>
                  {d.answers.map((a) => (
                    <div key={a.id} className="flex flex-col gap-2 rounded-xl bg-soft p-3">
                      <span className="text-xs font-black tracking-wide text-muted">{kindLabel(a.kind)}</span>
                      <p className="whitespace-pre-wrap break-words">{a.body}</p>
                      <HelpfulButton answerId={a.id} count={a.helpful} />
                    </div>
                  ))}
                </div>
              </details></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
