import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses, getCourse } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { StartQuizButton } from "@/components/StartQuizButton";
import { ArtAssign } from "@/components/art";
import { Bar } from "@/components/Crumbs";
import { AssignmentFiles } from "@/components/resources/AssignmentFiles";

export const metadata: Metadata = { title: "Assignments" };

type Row = { id: string; course: string; unit: number; total: number; correct: number | null; submitted_at: string | null; created_at: string };

export default async function Assignments() {
  const { supabase, profile } = await requireOnboarded();
  const { data } = await supabase.from("quiz_sessions").select("id,course,unit,total,correct,submitted_at,created_at").eq("kind", "assignment").order("created_at", { ascending: false }).limit(500);
  const rows = (data ?? []) as Row[];
  const courses = visibleCourses(profile.branch, listCourses()).filter((c) => courseUnits(c.code).length > 0);
  const state = (course: string, unit: number) => {
    const mine = rows.filter((r) => r.course === course && r.unit === unit);
    const open = mine.find((r) => !r.submitted_at);
    const finished = mine.filter((r) => r.submitted_at);
    const best = finished.reduce<Row | null>((b, r) => (!b || (r.correct ?? 0) > (b.correct ?? 0) ? r : b), null);
    return { open, best, last: finished[0] };
  };
  const all = courses.flatMap((c) => courseUnits(c.code).map((u) => ({ c: c.code, u })));
  const done = all.filter((x) => state(x.c, x.u).best).length;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtAssign size={56} /><div><h1 className="text-3xl">Assignments</h1><p className="text-muted">10 questions per unit. No hurry, and you can stop and come back.</p></div></header>
      <ul className="card flex flex-col gap-2 text-[0.95rem]">
        <li className="ml-5 list-disc">Answers are saved as you go. Leave any time and pick up where you stopped.</li>
        <li className="ml-5 list-disc">You see right and wrong only after you submit, then review every question.</li>
        <li className="ml-5 list-disc">Score 40% or more to earn the unit&apos;s XP. It is paid once per unit, so retaking is for practice.</li>
      </ul>
      <div className="card flex flex-col gap-2" aria-label="Overall progress">
        <p className="font-black text-head">{done} of {all.length} units done</p>
        <Bar value={done} max={all.length} label="Assignments done" />
      </div>
      <AssignmentFiles />
      <div className="enter flex flex-col gap-3">
        {courses.map((c) => {
          const units = courseUnits(c.code);
          const dn = units.filter((u) => state(c.code, u).best).length;
          const course = getCourse(c.code);
          return (
            <details key={c.code} className="card group" open={dn > 0 && dn < units.length}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span><span className="text-xs font-black tracking-wide text-muted">{c.code}</span><br /><b className="text-lg text-head">{c.name}</b></span>
                <span className="pill !px-3">{dn}/{units.length}</span>
              </summary>
              <ol className="mt-4 flex flex-col gap-2">
                {units.map((u) => {
                  const st = state(c.code, u);
                  return (
                    <li key={u} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-3">
                      <div className="min-w-0"><p className="text-xs font-black tracking-wide text-muted">UNIT {u}</p><p className="font-black text-head">{course?.units[u - 1]?.title}</p>
                        <p className="text-sm text-muted">{st.open ? "In progress" : st.best ? `Best score ${st.best.correct} / ${st.best.total}` : "Not started"}</p></div>
                      <div className="flex items-center gap-2">
                        {st.last && !st.open && <Link href={`/quiz/${st.last.id}/review`} className="text-sm font-black uppercase">Review</Link>}
                        <StartQuizButton kind="assignment" course={c.code} unit={u} ghost={Boolean(st.best) && !st.open}>{st.open ? "Resume" : st.best ? "Retake" : "Start"}</StartQuizButton>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
    </div>
  );
}
