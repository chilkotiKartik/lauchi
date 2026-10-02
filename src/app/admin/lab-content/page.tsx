import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { LABS, getLab } from "@/labs/registry";
import { getExperiment } from "@/labs/experiments";
import { LabQuestionForm, blankLabQ, type LabQInitial } from "@/components/cms/LabQuestionForm";

export const metadata: Metadata = { title: "Lab content" };
type Row = { id: string; lab_id: string; kind: "mcq" | "tf" | "numeric"; payload: Record<string, unknown>; status: "draft" | "published"; updated_at: string };
const KIND = { mcq: "Multiple choice", tf: "True or false", numeric: "Numeric" } as const;

function toInitial(r: Row): LabQInitial {
  const p = r.payload as Record<string, unknown>; const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : ""); const a = (k: string) => (Array.isArray(p[k]) ? (p[k] as unknown[]).map(String) : []);
  return {
    id: r.id, labId: r.lab_id, status: r.status, type: r.kind, prompt: s("prompt"), scenario: s("scenario"), marks: Number(p.marks) || 1, hint: s("hint"), formulas: a("formulas"), solution: a("solution"), explanation: s("explanation"), commonMistake: s("commonMistake"),
    options: r.kind === "mcq" ? a("options") : ["", "", "", ""], answerIdx: r.kind === "mcq" ? Number(p.answer) || 0 : 0, tf: r.kind === "tf" ? p.answer === true : true,
    num: r.kind === "numeric" ? String(p.answer ?? "") : "", tolerance: r.kind === "numeric" ? String(p.tolerance ?? "0") : "0", unit: s("unit"),
  };
}

export default async function AdminLabContent({ searchParams }: { searchParams: Promise<{ lab?: string; status?: string; edit?: string; new?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const labs = LABS.filter((l) => getExperiment(l.id)).map((l) => ({ id: l.id, title: l.title }));
  const lab = labs.some((l) => l.id === sp.lab) ? sp.lab! : "";
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : "";
  let rows: Row[] = []; let failed = false;
  try {
    const { data, error } = await createAdminClient().from("cms_lab_questions").select("id,lab_id,kind,payload,status,updated_at").order("updated_at", { ascending: false }).limit(1000);
    if (error) failed = true; else rows = (data ?? []) as Row[];
  } catch { failed = true; }
  const shown = rows.filter((r) => (!lab || r.lab_id === lab) && (!status || r.status === status));
  const editing = sp.edit ? rows.find((r) => r.id === sp.edit) : undefined;
  const creating = sp.new === "1" || Boolean(editing);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl">Lab content</h1>
          <p className="text-muted">Add extra questions to a lab&apos;s guided experiment. Published ones appear after the built-in questions on the lab&apos;s Questions tab.</p>
        </div>
        <Link href={`/admin/lab-content?new=1${lab ? `&lab=${lab}` : ""}`} className="btn no-underline">New question</Link>
      </header>

      {creating && (
        <section className="card flex flex-col gap-3" aria-labelledby="lq-h">
          <h2 id="lq-h" className="text-xl">{editing ? "Edit question" : "New question"}</h2>
          <LabQuestionForm key={editing?.id ?? `new-${lab}`} labs={labs} initial={editing ? toInitial(editing) : blankLabQ(lab || labs[0]?.id || "")} />
          <Link href="/admin/lab-content" className="text-sm font-extrabold">Close editor</Link>
        </section>
      )}

      <form method="get" action="/admin/lab-content" className="card grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label="Filter lab questions">
        <div className="adm-label"><label htmlFor="lf-lab">Lab</label><select id="lf-lab" name="lab" className="field" defaultValue={lab}><option value="">All labs</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
        <div className="adm-label"><label htmlFor="lf-status">Status</label><select id="lf-status" name="status" className="field" defaultValue={status}><option value="">Any status</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <button type="submit" className="btn btn-ghost">Filter</button>
      </form>

      <section className="card flex flex-col gap-3" aria-labelledby="ll-h">
        <h2 id="ll-h" className="text-xl">{shown.length} question{shown.length === 1 ? "" : "s"}</h2>
        {failed ? <p className="err" role="alert">We couldn&apos;t load the list. Refresh to try again.</p>
          : shown.length === 0 ? <p className="text-muted">Nothing here yet.</p>
          : <ul className="flex flex-col gap-2" aria-label="Lab questions">{shown.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/lab-content?edit=${r.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line p-3 no-underline hover:border-blue">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5"><b className="break-words text-head">{String(r.payload.prompt ?? "").slice(0, 140)}</b><span className="text-sm text-muted">{getLab(r.lab_id)?.title ?? r.lab_id} · {KIND[r.kind]}</span></span>
                <span className={`chip ${r.status === "published" ? "chip-id" : "chip-warm"}`}>{r.status === "published" ? "Published" : "Draft"}</span>
              </Link>
            </li>))}</ul>}
      </section>
    </div>
  );
}
