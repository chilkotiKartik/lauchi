import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canSeeCourse } from "@/lib/stream";
import { getCourse, listCourses } from "@/lib/syllabus";
import { getPyq } from "@/lib/pyq";
import { fetchPublishedQuestions } from "@/lib/cms-questions";
import { Crumbs } from "@/components/Crumbs";
import { BankPractice } from "@/components/bank/BankPractice";
import { ArtPapers } from "@/components/art";

export const metadata: Metadata = { title: "Question bank" };
/** Always read fresh: a question published or unpublished a moment ago must show up (or go) at once. */
export const dynamic = "force-dynamic";

async function publishedCounts(): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  try {
    const { data } = await createAdminClient().from("cms_questions").select("course,unit").eq("status", "published").limit(20000);
    for (const r of (data ?? []) as { course: string; unit: number }[]) { const k = `${r.course}:${r.unit}`; m.set(k, (m.get(k) ?? 0) + 1); }
  } catch { /* table not there yet: show empty counts */ }
  return m;
}

export default async function BankPage({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string; mode?: string }> }) {
  const { user, profile } = await requireOnboarded();
  const sp = await searchParams;
  const courses = listCourses().filter((c) => c.units > 0 && canSeeCourse(profile.branch, c.code, c.type));
  const course = courses.find((c) => c.code === sp.course) ?? null;
  const full = course ? getCourse(course.code) : null;
  const counts = await publishedCounts();
  const unitN = full ? Math.floor(Number(sp.unit)) : NaN;
  const unit = full && Number.isInteger(unitN) ? full.units.find((u) => u.n === unitN) ?? null : null;

  const head = (
    <header className="page-head flex items-center gap-3">
      <ArtPapers size={56} />
      <div><h1 className="text-3xl">Question bank</h1><p className="text-muted">Questions written by your teachers. Answer one and we check it for you, with the working.</p></div>
    </header>
  );

  if (!course || !full) {
    return (
      <div className="flex flex-col gap-5">
        {head}
        {courses.length === 0 ? <p className="card">There are no subjects for your course yet.</p> : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Subjects">
            {courses.map((c) => {
              const n = [...counts.entries()].filter(([k]) => k.startsWith(c.code + ":")).reduce((a, [, v]) => a + v, 0);
              return (
                <li key={c.code}>
                  <Link href={`/bank?course=${c.code}`} className="card flex h-full flex-col gap-1 no-underline">
                    <b className="text-lg text-head">{c.short}</b>
                    <span className="text-sm text-muted">{c.name}</span>
                    <span className="chip chip-cool mt-1 w-fit">{n} {n === 1 ? "question" : "questions"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  if (!unit) {
    const pyq = getPyq(course.code);
    return (
      <div className="flex flex-col gap-5">
        {head}
        <Crumbs items={[{ href: "/bank", label: "Question bank" }, { label: course.short }]} />
        <ul className="flex flex-col gap-3" aria-label={`Units of ${course.short}`}>
          {full.units.map((u) => {
            const n = counts.get(`${course.code}:${u.n}`) ?? 0;
            const p = pyq?.units.find((x) => x.n === u.n)?.pyqs.length ?? 0;
            return (
              <li key={u.n} className="card flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <b className="break-words text-head">Unit {u.n}: {u.title}</b>
                  <span className="flex flex-wrap gap-2">
                    <span className="chip chip-cool">{n} {n === 1 ? "question" : "questions"}</span>
                    {p > 0 && <Link href={`/pyq?course=${course.code}&unit=${u.n}`} className="chip chip-warm no-underline">{p} previous-year {p === 1 ? "question" : "questions"}</Link>}
                  </span>
                </div>
                {n > 0
                  ? <Link href={`/bank?course=${course.code}&unit=${u.n}`} className="btn btn-blue" aria-label={`Practise unit ${u.n}`}>Practise</Link>
                  : <span className="text-sm text-muted">No questions yet</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // practise one unit
  let questions = await fetchPublishedQuestions(course.code, unit.n, 50);
  const missedMode = sp.mode === "missed";
  if (missedMode) {
    const last = new Map<string, boolean>();
    try {
      const { data } = await createAdminClient().from("cms_question_attempts").select("question_id,correct,updated_at").eq("user_id", user.id).order("updated_at", { ascending: true }).limit(5000);
      for (const r of (data ?? []) as { question_id: string; correct: boolean }[]) last.set(r.question_id, r.correct);
    } catch { /* none */ }
    questions = questions.filter((q) => last.get(q.id) === false);
  }
  const pyqCount = getPyq(course.code)?.units.find((x) => x.n === unit.n)?.pyqs.length ?? 0;
  const pyqHref = pyqCount > 0 ? `/pyq?course=${course.code}&unit=${unit.n}` : null;
  const base = `/bank?course=${course.code}&unit=${unit.n}`;
  return (
    <div className="flex flex-col gap-5">
      {head}
      <Crumbs items={[{ href: "/bank", label: "Question bank" }, { href: `/bank?course=${course.code}`, label: course.short }, { label: `Unit ${unit.n}` }]} />
      <h2 className="text-xl">Unit {unit.n}: {unit.title}{missedMode ? " · questions I missed" : ""}</h2>
      {questions.length === 0 ? (
        <div className="card flex flex-col gap-2">
          <p>{missedMode ? "You have no missed questions here. Nice." : "No questions are published for this unit yet."}</p>
          <div className="flex flex-wrap gap-2">
            {missedMode && <Link href={base} className="btn btn-blue">Practise all questions</Link>}
            {pyqHref && <Link href={pyqHref} className="btn btn-ghost">Try previous-year questions ({pyqCount})</Link>}
            <Link href={`/bank?course=${course.code}`} className="btn btn-ghost">Back to units</Link>
          </div>
        </div>
      ) : (
        <BankPractice key={`${base}${missedMode}`} questions={questions} backHref={`/bank?course=${course.code}`} pyqHref={pyqHref} missedHref={`${base}&mode=missed`} />
      )}
    </div>
  );
}
