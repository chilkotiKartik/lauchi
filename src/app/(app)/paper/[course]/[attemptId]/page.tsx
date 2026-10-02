import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { selfMarksSchema } from "@/lib/paper";
import { ExamRoom } from "@/components/paper/ExamRoom";
import { ReviewBoard } from "@/components/paper/ReviewBoard";
import { isPaperCourse, paperView, serverNow, subjectName } from "../../data";

export const metadata: Metadata = { title: "Paper" };

type Row = { id: string; course: string; mode: "practice" | "exam"; paper: string[][]; ends_at: string; paused_at: string | null; submitted_at: string | null; chosen: string[]; self_marks: unknown; notes: string };

export default async function Attempt({ params }: { params: Promise<{ course: string; attemptId: string }> }) {
  const { course, attemptId } = await params;
  if (!isPaperCourse(course) || !z.string().uuid().safeParse(attemptId).success) notFound();
  const { supabase, user, profile } = await requireOnboarded();
  if (!canSeeCourse(profile.branch, course)) notFound();
  const { data } = await supabase.from("papers").select("id,course,mode,paper,ends_at,paused_at,submitted_at,chosen,self_marks,notes").eq("id", attemptId).eq("user_id", user.id).limit(1);
  const row = (data?.[0] ?? null) as Row | null;
  if (!row || row.course !== course) notFound();
  const subject = subjectName(course);

  if (row.submitted_at) {
    const marks = selfMarksSchema.safeParse(row.self_marks);
    const auto = new Date(row.submitted_at).getTime() >= new Date(row.ends_at).getTime() - 2000 && !row.paused_at;
    return (
      <ReviewBoard paperId={row.id} subject={subject} code={course} mode={row.mode} questions={paperView(course, row.paper, true)}
        chosen={Array.isArray(row.chosen) ? row.chosen : []} marks={marks.success ? marks.data : {}} checkOn={!!process.env.GEMINI_API_KEY} autoSubmitted={auto} />
    );
  }
  return (
    <ExamRoom paperId={row.id} subject={subject} code={course} mode={row.mode} questions={paperView(course, row.paper, false)}
      endsAt={row.ends_at} pausedAt={row.paused_at} serverNow={serverNow()} chosen={Array.isArray(row.chosen) ? row.chosen : []} notes={row.notes ?? ""} />
  );
}
