import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOptions } from "@/app/admin/data";
import { QuestionForm, type FormInitial } from "../QuestionForm";

export const metadata: Metadata = { title: "Edit question" };
export const dynamic = "force-dynamic";

export default async function EditQuestion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { data } = await createAdminClient().from("cms_questions").select("id,course,unit,kind,stem,options,answer,explanation,steps,difficulty,tags,status").eq("id", id).limit(1);
  const r = (data ?? [])[0] as (Omit<FormInitial, "steps" | "tags"> & { steps: string[] | null; tags: string[] | null; status: string }) | undefined;
  if (!r) notFound();
  const courses = courseOptions().map((c) => ({ code: c.code, short: c.short, units: c.units.map((u) => ({ n: u.n, title: u.title })) }));
  const initial: FormInitial = { ...r, unit: Number(r.unit), difficulty: Number(r.difficulty), steps: r.steps ?? [], tags: r.tags ?? [], options: Array.isArray(r.options) ? r.options : [] };
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Edit question</h1>
        {created && <p className="ok mt-2" role="status">Saved as a draft. Publish it when you are ready.</p>}
      </header>
      <QuestionForm courses={courses} id={id} initial={initial} status={r.status} />
    </div>
  );
}
