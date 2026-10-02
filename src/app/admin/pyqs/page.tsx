import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, toPyq, type CustomPyqRow } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Rich } from "@/lib/rich";
import { PyqForm, type PyqInitial } from "@/components/admin/PyqForm";
import { setPyqHidden } from "@/app/admin/actions";
import { courseLabel, courseOptions } from "@/app/admin/data";

export const metadata: Metadata = { title: "Custom PYQs" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminPyqs({ searchParams }: { searchParams: Promise<{ edit?: string; course?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const opts = courseOptions();
  const courses = opts.map((c) => ({ code: c.code, short: c.short, units: c.units.map((u) => ({ n: u.n, title: u.title })) }));
  const filter = opts.some((c) => c.code === sp.course) ? sp.course! : null;

  let rows: (CustomPyqRow & { hidden: boolean })[] = [];
  let failed = false;
  try {
    let q = createAdminClient().from("custom_pyqs").select("id,course,unit,kind,title,parts,marks,repeated,year,hidden,created_at");
    if (filter) q = q.eq("course", filter);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(300);
    if (error) failed = true; else rows = (data ?? []) as typeof rows;
  } catch { failed = true; }

  const editing = sp.edit && UUID.test(sp.edit) ? rows.find((r) => r.id === sp.edit) ?? null : null;
  const initial: PyqInitial | undefined = editing ? (() => {
    const p = toPyq(editing);
    return { id: editing.id, course: editing.course, unit: Number(editing.unit), kind: p.kind, title: p.title, parts: p.parts, marks: p.marks, repeated: Number(editing.repeated ?? 1), year: editing.year };
  })() : undefined;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Custom PYQs</h1>
        <p className="text-muted">Add previous-year questions the bank is missing. Students see them in the PYQ bank next to the built-in ones. Hide one to take it down without deleting it.</p>
      </header>

      <section className="card flex flex-col gap-3" aria-labelledby="pyq-form">
        <h2 id="pyq-form" className="text-xl">{initial ? "Edit question" : "Add a question"}</h2>
        {sp.edit && !initial && !failed && <p className="err" role="alert">That question wasn&apos;t found. It may have been removed.</p>}
        <PyqForm key={initial?.id ?? "new"} courses={courses} initial={initial} />
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="pyq-list">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="pyq-list" className="mr-auto text-xl">Added questions</h2>
          <nav aria-label="Filter by subject" className="flex max-w-full gap-2 overflow-x-auto pb-1">
            <Link href="/admin/pyqs" className="adm-tab" aria-current={!filter ? "page" : undefined}>All</Link>
            {opts.slice(0, 11).map((c) => <Link key={c.code} href={`/admin/pyqs?course=${c.code}`} className="adm-tab" aria-current={filter === c.code ? "page" : undefined}>{c.short}</Link>)}
          </nav>
        </div>
        {failed ? <p className="err" role="alert">We couldn&apos;t load the questions. Refresh to try again.</p>
          : rows.length === 0 ? <p className="text-muted">No custom questions{filter ? " for this subject" : ""} yet.</p>
          : (
            <ul className="flex flex-col gap-2" aria-label="Custom questions">
              {rows.map((r) => {
                const p = toPyq(r);
                return (
                  <li key={r.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-3 sm:flex-row sm:items-start ${r.hidden ? "border-dashed border-line2 opacity-75" : "border-line"}`}>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="chip chip-id">{courseLabel(opts, r.course)} · U{r.unit}</span>
                        <span className={`chip ${p.kind === "numerical" ? "chip-num" : "chip-th"}`}>{p.kind === "numerical" ? "Numerical" : "Theory"}</span>
                        {p.marks && <span className="chip chip-soft">{p.marks} marks</span>}
                        {p.repeated ? <span className="chip chip-warm">Asked {p.repeated}×</span> : null}
                        {r.hidden && <span className="chip chip-hot">Hidden</span>}
                      </div>
                      <h3 className="break-words text-lg leading-snug"><Rich text={p.title} /></h3>
                      <p className="line-clamp-2 break-words text-sm text-muted"><Rich text={p.parts.map((x) => x.text).join(" · ")} /></p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link href={`/admin/pyqs?edit=${r.id}${filter ? `&course=${filter}` : ""}#pyq-form`} className="btn btn-ghost !min-h-10 !px-3 text-sm" aria-label={`Edit ${p.title.replace(/<[^>]*>/g, "")}`}>Edit</Link>
                      <form action={setPyqHidden.bind(null, r.id, !r.hidden)}>
                        <button className="btn btn-ghost !min-h-10 !px-3 text-sm" aria-label={`${r.hidden ? "Show" : "Hide"} ${p.title.replace(/<[^>]*>/g, "")}`}>{r.hidden ? "Show" : "Hide"}</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </div>
  );
}
