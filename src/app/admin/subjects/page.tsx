import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourse, listCourses } from "@/lib/syllabus";
import { labsFor } from "@/labs/registry";
import { LESSONS } from "@/content/lessons";

export const metadata: Metadata = { title: "Subjects & units" };

type Counter = Map<string, number>;
const bump = (m: Counter, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

/** key "COURSE:unit" -> count, from one table. A missing table (migration not run yet) counts as zero. */
async function counts(table: string, cols: string, filter?: (r: Record<string, unknown>) => boolean): Promise<Counter> {
  const m: Counter = new Map();
  try {
    const { data, error } = await createAdminClient().from(table).select(cols).limit(5000);
    if (error) return m;
    for (const r of (data ?? []) as unknown as Record<string, unknown>[]) if (!filter || filter(r)) bump(m, `${r.course}:${r.unit}`);
  } catch { /* ignore */ }
  return m;
}

export default async function AdminSubjects({ searchParams }: { searchParams: Promise<{ stream?: string }> }) {
  await requireAdmin();
  const stream = (await searchParams).stream === "bca" ? "bca" : "btech";
  const courses = listCourses().filter((c) => c.units > 0 && (stream === "bca" ? c.code.startsWith("BCA-") : !c.code.startsWith("BCA-")));
  const [lessons, questions, resources, videos, pyqs] = await Promise.all([
    counts("cms_lessons", "course,unit,status", (r) => r.status === "published"),
    counts("cms_questions", "course,unit,status", (r) => r.status === "published"),
    counts("resources", "course,unit,hidden", (r) => r.hidden === false),
    counts("pinned_videos", "course,unit"),
    counts("custom_pyqs", "course,unit,hidden", (r) => r.hidden === false),
  ]);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Subjects &amp; units</h1>
        <p className="text-muted">Every subject with what is published for each unit. Use the links to add content straight to a unit.</p>
      </header>
      <nav aria-label="Stream" className="flex gap-2">
        <Link href="/admin/subjects" className="adm-tab" aria-current={stream === "btech" ? "page" : undefined}>B.Tech (CSE, AIML)</Link>
        <Link href="/admin/subjects?stream=bca" className="adm-tab" aria-current={stream === "bca" ? "page" : undefined}>BCA</Link>
      </nav>
      {courses.map((s) => {
        const c = getCourse(s.code);
        if (!c) return null;
        const topics = c.units.reduce((a, u) => a + u.topics.length, 0);
        return (
          <section key={s.code} className="card flex flex-col gap-3" aria-labelledby={`sj-${s.code}`}>
            <div>
              <h2 id={`sj-${s.code}`} className="text-xl">{c.short} <span className="text-sm font-extrabold text-muted">{c.code} · {c.sem}</span></h2>
              <p className="text-sm text-muted">{c.name} · {c.units.length} units · {topics} topics</p>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <caption className="sr-only">{c.name}: content per unit</caption>
                <thead><tr><th scope="col">Unit</th><th scope="col" className="num">Topics</th><th scope="col" className="num">Lessons</th><th scope="col" className="num">Questions</th><th scope="col" className="num">Notes</th><th scope="col" className="num">PYQs</th><th scope="col" className="num">Videos</th><th scope="col" className="num">Labs</th><th scope="col">Add</th></tr></thead>
                <tbody>
                  {c.units.map((u) => {
                    const k = `${c.code}:${u.n}`;
                    const builtIn = u.topics.filter((_, i) => LESSONS[`${c.code}:${u.n}:${i + 1}`]).length;
                    const q = `course=${c.code}&unit=${u.n}`;
                    return (
                      <tr key={u.n}>
                        <th scope="row" className="!text-left !normal-case !tracking-normal !text-head">{u.n}. {u.title}</th>
                        <td className="num">{u.topics.length}</td>
                        <td className="num">{lessons.get(k) ?? 0}{builtIn > 0 && <span className="text-muted"> (+{builtIn} built-in)</span>}</td>
                        <td className="num">{questions.get(k) ?? 0}</td>
                        <td className="num">{resources.get(k) ?? 0}</td>
                        <td className="num">{pyqs.get(k) ?? 0}</td>
                        <td className="num">{videos.get(k) ?? 0}</td>
                        <td className="num">{labsFor(c.code, u.n).length}</td>
                        <td><span className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-extrabold">
                          <Link href={`/admin/lessons/new?${q}&topic=1`}>Lesson</Link>
                          <Link href={`/admin/questions/new?${q}`}>Question</Link>
                          <Link href={`/admin/resources?${q}`}>Notes</Link>
                          <Link href={`/admin/pyqs?${q}`}>PYQ</Link>
                          <Link href={`/admin/videos?${q}`}>Video</Link>
                        </span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
