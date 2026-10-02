import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOptions } from "@/app/admin/data";
import { LABS } from "@/labs/registry";
import { emptyLesson, validateLesson } from "@/lib/cms-lessons";
import { LessonEditor } from "@/components/cms/LessonEditor";

export const metadata: Metadata = { title: "Edit lesson" };
type Row = { id: string; course: string; unit: number; topic: number; title: string; status: "draft" | "published"; version: number; body: unknown };

export default async function EditLesson({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { data } = await createAdminClient().from("cms_lessons").select("id,course,unit,topic,title,status,version,body").eq("id", id).limit(1);
  const r = (data ?? [])[0] as Row | undefined;
  if (!r) notFound();
  const v = validateLesson(r.body, { strict: false });
  const title = courseOptions().find((c) => c.code === r.course)?.units.find((u) => u.n === Number(r.unit))?.topics[Number(r.topic) - 1] ?? r.title;
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/admin/lessons" className="text-sm font-extrabold">← All lessons</Link>
        <h1 className="text-3xl">Edit lesson</h1>
      </header>
      <LessonEditor key={r.id} id={r.id} target={{ course: r.course, unit: Number(r.unit), topic: Number(r.topic) }} topicTitle={title} initial={v.ok ? v.lesson : emptyLesson()} status={r.status} version={r.version} labs={LABS.map((l) => ({ id: l.id, title: l.title }))} />
    </div>
  );
}
