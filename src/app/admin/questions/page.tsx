import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseLabel, courseOptions } from "@/app/admin/data";
import { KINDS, KIND_LABEL, PAGE_SIZE, matchesSearch, paginate, type Kind } from "@/lib/cms-questions-core";
import { QuestionTable, type TableRow } from "./QuestionTable";

export const metadata: Metadata = { title: "Questions" };
export const dynamic = "force-dynamic";

type Row = { id: string; course: string; unit: number; kind: Kind; stem: string; explanation: string; status: string; difficulty: number; tags: string[]; updated_at: string };
type SP = { q?: string; course?: string; unit?: string; status?: string; kind?: string; page?: string };

export default async function AdminQuestions({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const opts = courseOptions();
  let rows: Row[] = [];
  let failed = false;
  try {
    const { data, error } = await createAdminClient().from("cms_questions").select("id,course,unit,kind,stem,explanation,status,difficulty,tags,updated_at")
      .order("updated_at", { ascending: false }).limit(5000);
    if (error) failed = true; else rows = (data ?? []) as Row[];
  } catch { failed = true; }

  const q = (sp.q ?? "").slice(0, 100), course = sp.course ?? "", unit = Number(sp.unit) || 0, status = sp.status ?? "", kind = sp.kind ?? "";
  const filtered = rows.filter((r) => (!course || r.course === course) && (!unit || r.unit === unit) && (!status || r.status === status) && (!kind || r.kind === kind)
    && matchesSearch({ stem: r.stem, tags: r.tags ?? [], explanation: r.explanation }, q));
  const pg = paginate(filtered, Number(sp.page) || 1);
  const units = opts.find((c) => c.code === course)?.units ?? [];
  const total = (s: string) => rows.filter((r) => r.status === s).length;
  const href = (page: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, course, unit: unit ? String(unit) : "", status, kind })) if (v) u.set(k, v);
    if (page > 1) u.set("page", String(page));
    const s = u.toString();
    return `/admin/questions${s ? `?${s}` : ""}`;
  };
  const table: TableRow[] = pg.items.map((r) => ({
    id: r.id, stem: r.stem, kind: r.kind, status: r.status, difficulty: r.difficulty,
    where: `${courseLabel(opts, r.course)} · Unit ${r.unit}`, updated: new Date(r.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
  }));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">Questions</h1>
          <p className="text-muted">Write practice questions for the student <b>Question bank</b>. Published questions appear for students at once; drafts stay hidden. {total("published")} published · {total("draft")} drafts.</p>
        </div>
        <Link href="/admin/questions/new" className="btn btn-blue">New question</Link>
        <Link href="/admin/questions/import" className="btn btn-ghost">Import CSV</Link>
      </header>
      <form method="get" action="/admin/questions" role="search" aria-label="Filter questions" className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="adm-label lg:col-span-2"><label htmlFor="f-q">Search</label><input id="f-q" name="q" className="field" defaultValue={q} placeholder="Words in the question or tags" /></div>
        <div className="adm-label"><label htmlFor="f-course">Subject</label>
          <select id="f-course" name="course" className="field" defaultValue={course}><option value="">All subjects</option>{opts.map((c) => <option key={c.code} value={c.code}>{c.short}</option>)}</select></div>
        <div className="adm-label"><label htmlFor="f-unit">Unit</label>
          <select id="f-unit" name="unit" className="field" defaultValue={unit ? String(unit) : ""}><option value="">All units</option>
            {(units.length ? units.map((u) => u.n) : Array.from({ length: 8 }, (_, i) => i + 1)).map((n) => <option key={n} value={n}>Unit {n}</option>)}</select></div>
        <div className="adm-label"><label htmlFor="f-status">Status</label>
          <select id="f-status" name="status" className="field" defaultValue={status}><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
        <div className="adm-label"><label htmlFor="f-kind">Type</label>
          <select id="f-kind" name="kind" className="field" defaultValue={kind}><option value="">Any type</option>{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6"><button className="btn" type="submit">Apply filters</button><Link href="/admin/questions" className="btn btn-ghost">Clear</Link></div>
      </form>
      <section className="card flex flex-col gap-3" aria-labelledby="ql-h">
        <h2 id="ql-h" className="text-xl">{pg.total} {pg.total === 1 ? "question" : "questions"}</h2>
        {failed ? <p className="err" role="alert">We couldn&apos;t load the list. Refresh to try again.</p>
          : pg.total === 0 ? <p className="text-muted">{rows.length ? "Nothing matches those filters." : "No questions yet. Write the first one."}</p>
          : <QuestionTable key={`${pg.page}:${table.map((t) => t.id + t.status).join()}`} rows={table} />}
        {pg.pages > 1 && (
          <nav aria-label="Pages" className="flex flex-wrap items-center gap-2">
            {pg.page > 1 && <Link className="btn btn-ghost" href={href(pg.page - 1)}>Previous</Link>}
            <span className="text-sm font-extrabold text-head">Page {pg.page} of {pg.pages} ({PAGE_SIZE} per page)</span>
            {pg.page < pg.pages && <Link className="btn btn-ghost" href={href(pg.page + 1)}>Next</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
