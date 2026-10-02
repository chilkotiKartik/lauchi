import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSize, kindLabel, RESOURCE_COLS, type ResourceRow } from "@/lib/resources";
import { courseLabel, courseOptions, unitLabel } from "@/app/admin/data";
import { ResourceForm } from "./ResourceForm";
import { RowActions } from "./RowActions";
import "./resources.css";

export const metadata: Metadata = { title: "Notes & files" };

export default async function AdminResources() {
  await requireAdmin();
  const opts = courseOptions();
  let rows: ResourceRow[] = [];
  let failed = false;
  try {
    const { data, error } = await createAdminClient().from("resources").select(RESOURCE_COLS)
      .order("course", { ascending: true }).order("unit", { ascending: true }).order("created_at", { ascending: false }).limit(1000);
    if (error) failed = true; else rows = (data ?? []) as ResourceRow[];
  } catch { failed = true; }

  const groups = new Map<string, ResourceRow[]>();
  for (const r of rows) { const k = `${r.course}:${r.unit}`; groups.set(k, [...(groups.get(k) ?? []), r]); }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Notes &amp; files</h1>
        <p className="text-muted">Upload PDFs, assignments, slides or links for a subject and unit. Students find them on the <b>Notes &amp; files</b> page, and on that unit&apos;s page. Files are private and only open for signed-in students of that stream.</p>
      </header>
      <section className="card flex flex-col gap-3" aria-labelledby="up-h">
        <h2 id="up-h" className="text-xl">Add a file or link</h2>
        <ResourceForm courses={opts.map((c) => ({ code: c.code, short: c.short, units: c.units }))} />
      </section>
      <section className="card flex flex-col gap-4" aria-labelledby="list-h">
        <h2 id="list-h" className="text-xl">Uploaded so far</h2>
        {failed ? <p className="err" role="alert">We couldn&apos;t load the list. Refresh to try again.</p>
          : rows.length === 0 ? <p className="text-muted">Nothing uploaded yet.</p>
          : [...groups.entries()].map(([k, list]) => {
            const course = list[0].course, unit = Number(list[0].unit);
            return (
              <div key={k} className="flex flex-col gap-2">
                <h3 className="text-base">{courseLabel(opts, course)} · Unit {unit}{unitLabel(opts, course, unit) ? `: ${unitLabel(opts, course, unit)}` : ""}</h3>
                <ul className="flex flex-col gap-2" aria-label={`Files for ${courseLabel(opts, course)} unit ${unit}`}>
                  {list.map((r) => (
                    <li key={r.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line p-3 ${r.hidden ? "opacity-70" : ""}`}>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <b className="break-words text-head">{r.title}</b>
                        <span className="text-sm text-muted">
                          {[kindLabel(r.kind), r.file_name, formatSize(r.size_bytes), r.topic ? `Topic ${r.topic}` : "Whole unit", r.external_url ? "has link" : ""].filter(Boolean).join(" · ")}
                        </span>
                        {r.hidden && <span className="chip chip-warm w-fit">Hidden from students</span>}
                      </div>
                      <RowActions id={r.id} title={r.title} hidden={Boolean(r.hidden)} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </section>
    </div>
  );
}
