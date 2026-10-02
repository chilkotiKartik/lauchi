import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { STATUS_LABEL, idSchema, kindLabel } from "@/lib/doubts";
import { Crumbs } from "@/components/Crumbs";
import { AiButton, HelpfulButton, ResolveButton } from "@/components/doubts/DoubtActions";

export const metadata: Metadata = { title: "Your doubt" };

type Ans = { id: string; author_kind: string; body: string; helpful_count: number; created_at: string };

export default async function DoubtPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOnboarded();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const { data } = await supabase.from("doubts").select("id,course,unit,title,body,status,visibility,published,created_at").eq("id", id.data).limit(1);
  const d = (data ?? [])[0] as { id: string; course: string; unit: number | null; title: string; body: string; status: keyof typeof STATUS_LABEL; visibility: string; published: boolean; created_at: string } | undefined;
  if (!d) notFound();
  const { data: ans } = await supabase.from("doubt_answers").select("id,author_kind,body,helpful_count,created_at").eq("doubt_id", d.id).order("created_at", { ascending: true }).limit(50);
  const answers = (ans ?? []) as Ans[];
  const c = getCourse(d.course);
  const hasAi = answers.some((a) => a.author_kind === "ai");
  return (
    <div className="flex flex-col gap-5">
      <Crumbs items={[{ href: "/doubts", label: "Doubt box" }, { label: "Your doubt" }]} />
      <header className="flex flex-col gap-1">
        <span className="text-xs font-black tracking-wide text-muted">{(c?.short ?? d.course).toUpperCase()}{d.unit ? ` · UNIT ${d.unit}` : ""}</span>
        <h1 className="break-words text-3xl">{d.title}</h1>
        <p className="flex flex-wrap gap-2"><span className="chip chip-soft">{STATUS_LABEL[d.status]}</span>
          <span className="chip chip-soft">{d.visibility === "public" ? (d.published ? "In the shared library" : "Public once a teacher approves") : "Private"}</span></p>
      </header>
      <p className="card whitespace-pre-wrap break-words">{d.body}</p>
      <section className="flex flex-col gap-3" aria-label="Answers">
        <h2 className="text-xl">Answers</h2>
        {answers.length === 0 && <p className="card text-muted">No answer yet. A teacher will reply here. You can also ask Lochi for a first answer.</p>}
        {answers.map((a) => (
          <div key={a.id} className="card flex flex-col gap-2">
            <span className="text-xs font-black tracking-wide text-muted">{kindLabel(a.author_kind)}</span>
            <p className="whitespace-pre-wrap break-words">{a.body}</p>
            <HelpfulButton answerId={a.id} count={a.helpful_count} />
          </div>
        ))}
      </section>
      <div className="flex flex-wrap gap-3">
        {!hasAi && d.status !== "resolved" && <AiButton id={d.id} />}
        {d.status === "answered" && <ResolveButton id={d.id} />}
      </div>
    </div>
  );
}
