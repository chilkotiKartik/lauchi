import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOptions, courseLabel } from "@/app/admin/data";
import { STATUS_LABEL, kindLabel } from "@/lib/doubts";
import { AnswerForm, RowButtons } from "./Controls";

export const metadata: Metadata = { title: "Doubts" };

type Row = { id: string; course: string; unit: number | null; title: string; body: string; status: keyof typeof STATUS_LABEL; visibility: string; published: boolean; hidden: boolean; created_at: string };
type Ans = { id: string; doubt_id: string; author_kind: string; body: string; helpful_count: number };
const filt = z.object({ status: z.enum(["open", "answered", "resolved", "all", "hidden"]).catch("open"), course: z.string().regex(/^[A-Z]{2,3}-[0-9]{3}$/).optional().catch(undefined) });

export default async function AdminDoubts({ searchParams }: { searchParams: Promise<{ status?: string; course?: string }> }) {
  await requireAdmin();
  const f = filt.parse(await searchParams);
  const opts = courseOptions();
  let rows: Row[] = [], answers: Ans[] = [], failed = false;
  try {
    const db = createAdminClient();
    const { data, error } = await db.from("doubts").select("id,course,unit,title,body,status,visibility,published,hidden,created_at").order("created_at", { ascending: false }).limit(300);
    if (error) failed = true; else rows = (data ?? []) as Row[];
    if (rows.length) {
      const { data: a } = await db.from("doubt_answers").select("id,doubt_id,author_kind,body,helpful_count").in("doubt_id", rows.map((r) => r.id)).limit(2000);
      answers = (a ?? []) as Ans[];
    }
  } catch { failed = true; }
  const shown = rows.filter((r) => (f.status === "hidden" ? r.hidden : f.status === "all" || r.status === f.status) && !(r.hidden && f.status !== "hidden" && f.status !== "all") && (!f.course || r.course === f.course));
  const tab = (status: string, label: string) => <Link key={status} href={`/admin/doubts?status=${status}${f.course ? `&course=${f.course}` : ""}`} className="adm-tab" aria-current={f.status === status ? "page" : undefined}>{label}</Link>;
  return (
    <div className="flex flex-col gap-5">
      <header><h1 className="text-3xl">Doubts</h1><p className="text-muted">Answer student doubts, and publish the good ones (the student agreed to share) to the shared library. Students are never named.</p></header>
      <div className="flex flex-wrap items-center gap-2">
        {tab("open", "Open")}{tab("answered", "Answered")}{tab("resolved", "Resolved")}{tab("hidden", "Hidden")}{tab("all", "All")}
        <form method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="status" value={f.status} />
          <label className="sr-only" htmlFor="dc">Subject</label>
          <select id="dc" name="course" className="field" defaultValue={f.course ?? ""}><option value="">All subjects</option>{opts.map((c) => <option key={c.code} value={c.code}>{c.short}</option>)}</select>
          <button className="btn btn-ghost">Filter</button>
        </form>
      </div>
      {failed ? <p className="err" role="alert">We couldn&apos;t load the doubts. Refresh to try again.</p>
        : shown.length === 0 ? <p className="card text-muted">No doubts here.</p> : (
        <ul className="flex flex-col gap-3">
          {shown.map((d) => {
            const mine = answers.filter((a) => a.doubt_id === d.id);
            return (
              <li key={d.id} className="card flex flex-col gap-3">
                <div>
                  <span className="text-xs font-black tracking-wide text-muted">{courseLabel(opts, d.course)}{d.unit ? ` · Unit ${d.unit}` : ""} · {new Date(d.created_at).toLocaleDateString("en-IN")}</span>
                  <h2 className="break-words text-lg">{d.title}</h2>
                  <p className="flex flex-wrap gap-2 pt-1">
                    <span className="chip chip-soft">{STATUS_LABEL[d.status]}</span>
                    <span className="chip chip-soft">{d.visibility === "public" ? "Student agreed to share" : "Private"}</span>
                    {d.published && <span className="chip chip-id">In library</span>}
                    {d.hidden && <span className="chip chip-hot">Hidden</span>}
                  </p>
                </div>
                <p className="whitespace-pre-wrap break-words">{d.body}</p>
                {mine.map((a) => <div key={a.id} className="rounded-xl bg-soft p-3"><span className="text-xs font-black tracking-wide text-muted">{kindLabel(a.author_kind)} · {a.helpful_count} found it helpful</span><p className="whitespace-pre-wrap break-words">{a.body}</p></div>)}
                <AnswerForm id={d.id} />
                <RowButtons id={d.id} published={d.published} hidden={d.hidden} canPublish={d.visibility === "public" && mine.length > 0 && d.status !== "open"} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
