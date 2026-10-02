import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOptions } from "@/app/admin/data";
import { LESSONS } from "@/content/lessons";
import { emptyLesson, lessonKey, lessonTargetSchema } from "@/lib/cms-lessons";
import { LABS } from "@/labs/registry";
import { LessonEditor } from "@/components/cms/LessonEditor";
import { TopicPicker } from "@/components/cms/TopicPicker";
import { ImportStaticButton } from "@/components/cms/ImportStaticButton";

export const metadata: Metadata = { title: "New lesson" };
type SP = { course?: string; unit?: string; topic?: string };

export default async function NewLesson({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const opts = courseOptions();
  const t = lessonTargetSchema.safeParse(sp);
  const title = t.success ? opts.find((c) => c.code === t.data.course)?.units.find((u) => u.n === t.data.unit)?.topics[t.data.topic - 1] : undefined;
  if (t.success && title) {
    const { data } = await createAdminClient().from("cms_lessons").select("id,created_at").eq("course", t.data.course).eq("unit", t.data.unit).eq("topic", t.data.topic).order("created_at", { ascending: false }).limit(1);
    const have = (data ?? [])[0] as { id: string } | undefined;
    if (have) redirect(`/admin/lessons/${have.id}`);
  }
  const hasStatic = t.success && Boolean(LESSONS[lessonKey(t.data.course, t.data.unit, t.data.topic)]);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/admin/lessons" className="text-sm font-extrabold">← All lessons</Link>
        <h1 className="text-3xl">New lesson</h1>
        <p className="text-muted">Pick the topic, then write the lesson or start from the built-in one.</p>
      </header>
      <section className="card flex flex-col gap-3" aria-label="Pick a topic">
        <TopicPicker courses={opts} action="/admin/lessons/new" course={sp.course} unit={t.success ? t.data.unit : undefined} topic={t.success ? t.data.topic : undefined} submit="Choose topic" />
      </section>
      {t.success && title && (
        <>
          {hasStatic && (
            <section className="card flex flex-wrap items-center gap-3" aria-label="Start from the built-in lesson">
              <p className="mr-auto text-muted">This topic already has a built-in lesson. Copy it as a draft and edit from there.</p>
              <ImportStaticButton course={t.data.course} unit={t.data.unit} topic={t.data.topic} />
            </section>
          )}
          <LessonEditor key={lessonKey(t.data.course, t.data.unit, t.data.topic)} id={null} target={t.data} topicTitle={title} initial={emptyLesson()} status={null} version={0} labs={LABS.map((l) => ({ id: l.id, title: l.title }))} />
        </>
      )}
    </div>
  );
}
