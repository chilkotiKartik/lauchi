import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseLabel, courseOptions } from "@/app/admin/data";

export const metadata: Metadata = { title: "Lessons" };
const PAGE = 20;
type Row = { id: string; course: string; unit: number; topic: number; title: string; status: "draft" | "published"; version: number; updated_at: string };
type SP = { q?: string; course?: string; unit?: string; status?: string; page?: string };

export default async function AdminLessons({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const opts = courseOptions();
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80);
  const course = opts.some((c) => c.code === sp.course) ? sp.course! : "";
  const unit = Number(sp.unit) >= 1 && Number(sp.unit) <= 12 ? Number(sp.unit) : 0;
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : "";
  let rows: Row[] = []; let failed = false;
  try {
    const { data, error } = await createAdminClient().from("cms_lessons").select("id,course,unit,topic,title,status,version,updated_at").order("updated_at", { ascending: false }).limit(2000);
    if (error) failed = true; else rows = (data ?? []) as Row[];
  } catch { failed = true; }
  const filtered = rows.filter((r) => (!course || r.course === course) && (!unit || Number(r.unit) === unit) && (!status || r.status === status) && (!q || r.title.toLowerCase().includes(q) || r.course.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);
  const href = (p: number) => { const u = new URLSearchParams(); if (q) u.set("q", q); if (course) u.set("course", course); if (unit) u.set("unit", String(unit)); if (status) u.set("status", status); if (p > 1) u.set("page", String(p)); const s = u.toString(); return `/admin/lessons${s ? `?${s}` : ""}`; };
  const units = opts.find((c) => c.code === course)?.units ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl">Lessons</h1>
          <p className="text-muted">Write or replace the step-by-step lesson for any topic. A published lesson shows instead of the built-in one; unpublish it to go back.</p>
        </div>
        <Link href="/admin/lessons/new" className="btn no-underline">New lesson</Link>
      </header>
      <form method="get" action="/admin/lessons" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end" aria-label="Filter lessons">
        <div className="adm-label"><label htmlFor="f-q">Search</label><input id="f-q" name="q" className="field" defaultValue={q} placeholder="Title or subject code" /></div>
        <div className="adm-label"><label htmlFor="f-course">Subject</label>
          <select id="f-course" name="course" className="field" defaultValue={course}><option value="">All subjects</option>{opts.map((c) => <option key={c.code} value={c.code}>{c.short}</option>)}</select></div>
        <div className="adm-label"><label htmlFor="f-unit">Unit</label>
          <select id="f-unit" name="unit" className="field" defaultValue={unit || ""}><option value="">All units</option>{(units.length ? units.map((u) => u.n) : Array.from({ length: 6 }, (_, i) => i + 1)).map((n) => <option key={n} value={n}>Unit {n}</option>)}</select></div>
        <div className="adm-label"><label htmlFor="f-status">Status</label>
          <select id="f-status" name="status" className="field" defaultValue={status}><option value="">Any status</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <button type="submit" className="btn btn-ghost">Filter</button>
      </form>
      <section className="card flex flex-col gap-3" aria-labelledby="ls-h">
        <h2 id="ls-h" className="text-xl">{filtered.length} lesson{filtered.length === 1 ? "" : "s"}</h2>
        {failed ? <p className="err" role="alert">We couldn&apos;t load lessons. Refresh to try again.</p>
          : shown.length === 0 ? <p className="text-muted">No lessons match. Use <b>New lesson</b> to write one.</p>
          : (
            <ul className="flex flex-col gap-2" aria-label="Lessons">
              {shown.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/lessons/${r.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line p-3 no-underline hover:border-blue">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5"><b className="break-words text-head">{r.title || "Untitled"}</b><span className="text-sm text-muted">{courseLabel(opts, r.course)} · Unit {r.unit} · Topic {r.topic} · v{r.version} · {new Date(r.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span></span>
                    <span className={`chip ${r.status === "published" ? "chip-id" : "chip-warm"}`}>{r.status === "published" ? "Published" : "Draft"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-between gap-3">
            {page > 1 ? <Link className="btn btn-ghost no-underline" href={href(page - 1)}>← Previous</Link> : <span />}
            <span className="text-sm text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link className="btn btn-ghost no-underline" href={href(page + 1)}>Next →</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
  );
}
