import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { courseOptions } from "@/app/admin/data";
import { QuestionForm } from "../QuestionForm";

export const metadata: Metadata = { title: "New question" };

export default async function NewQuestion({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const courses = courseOptions().map((c) => ({ code: c.code, short: c.short, units: c.units.map((u) => ({ n: u.n, title: u.title })) }));
  return (
    <div className="flex flex-col gap-5">
      <header><h1 className="text-3xl">New question</h1><p className="text-muted">It is saved as a draft. Publish it from the next screen when it looks right.</p></header>
      <QuestionForm courses={courses} preset={sp.course ? { course: sp.course, unit: Number(sp.unit) || 1 } : undefined} />
    </div>
  );
}
