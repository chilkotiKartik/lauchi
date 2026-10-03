import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { hasBank } from "@/lib/quiz";
import { LESSONS } from "@/content/lessons";
import { Crumbs } from "@/components/Crumbs";
import { LessonView } from "@/components/LessonView";
import { StartQuizButton } from "@/components/StartQuizButton";
import { Rich } from "@/lib/rich";
import { ListenButton } from "@/components/Voice";
import { getPinnedVideos } from "@/lib/admin";
import { PinnedVideos } from "@/components/PinnedVideos";
import { ReportButton } from "@/components/admin/ReportButton";
import { ArtAsk } from "@/components/art";
import { VideoShelf } from "@/components/Videos";
import { labsFor } from "@/labs/registry";
import { hasPyq } from "@/lib/pyq";
import { getPublishedLesson } from "@/lib/cms-db";

type P = Promise<{ course: string; unit: string; topic: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const p = await params; return { title: getCourse(p.course)?.units[+p.unit - 1]?.topics[+p.topic - 1] ?? "Topic" };
}

export default async function TopicPage({ params }: { params: P }) {
  const { supabase, profile } = await requireOnboarded();
  const p = await params; const un = Number(p.unit), tn = Number(p.topic);
  const c = getCourse(p.course); const u = c && Number.isInteger(un) ? c.units[un - 1] : undefined;
  const title = u && Number.isInteger(tn) ? u.topics[tn - 1] : undefined;
  if (!c || !u || !title || !canSeeCourse(profile, c.code, c.type)) notFound();
  const key = `${c.code}:${un}:${tn}`;
  const pinned = await getPinnedVideos(c.code, un, tn);
  const score = (await doneTopics(supabase)).get(key);
  const lesson = (await getPublishedLesson(c.code, un, tn)) ?? LESSONS[key];
  const prev = tn > 1 ? `/learn/${c.code}/${un}/${tn - 1}` : null;
  const next = tn < u.topics.length ? `/learn/${c.code}/${un}/${tn + 1}` : null;
  return (
    <div className="flex flex-col gap-6">
      <Crumbs items={[{ href: "/learn", label: "Learn" }, { href: `/learn/${c.code}`, label: c.short }, { href: `/learn/${c.code}/${un}`, label: `Unit ${un}` }, { label: `Topic ${tn}` }]} />
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black tracking-wide text-muted">UNIT {un}: {u.title.toUpperCase()}</p>
        <h1 className="text-3xl">{title}</h1>
        {score !== undefined && <p className="ok w-fit" role="status">Completed · best score {score}%</p>}
        <div className="flex flex-wrap gap-2">
          <ListenButton label="Listen to this lesson" text={lesson ? [title, lesson.intro, ...lesson.sections.flatMap((x) => [x.h, ...x.p, ...(x.formula ?? [])])].join(". ") : [title, ...u.formulas, ...u.hints].join(". ")} />
          {labsFor(c.code, un).slice(0, 2).map((l) => <Link key={l.id} href={`/labs/${l.id}`} className="voice-btn no-underline">3D lab: {l.title}</Link>)}
          <Link href={`/ask?course=${c.code}&unit=${un}&topic=${tn}&q=${encodeURIComponent(`Explain "${title}" simply, with an example`)}`} className="voice-btn no-underline"><ArtAsk size={20} /> Ask Lochi</Link>
          <ReportButton where="lesson" refId={key} course={c.code} unit={un} />
          {hasPyq(c.code) && <Link href={`/pyq?course=${c.code}&unit=${un}`} className="voice-btn no-underline">Unit {un} PYQs</Link>}
        </div>
      </header>
      {lesson ? <LessonView lesson={lesson} /> : (
        <section className="flex flex-col gap-4" aria-label="Study notes">
          <p className="card">A step-by-step lesson for this topic is not written yet. Use the unit notes below, then test yourself with the quiz.</p>
          {u.formulas.length > 0 && (<><h2 className="text-xl">Formulas for this unit</h2>
            <ul className="card flex flex-col gap-2">{u.formulas.map((f, i) => <li key={i} className="ml-5 list-disc"><Rich text={f} /></li>)}</ul></>)}
          {u.hints.length > 0 && (<><h2 className="text-xl">How to prepare</h2>
            <ul className="card flex flex-col gap-2">{u.hints.map((f, i) => <li key={i} className="ml-5 list-disc">{f}</li>)}</ul></>)}
        </section>
      )}
      <PinnedVideos videos={pinned} />
      <section className="card flex flex-col gap-2" aria-labelledby="vl">
        <h2 id="vl" className="text-xl">Watch a lecture on this topic</h2>
        <VideoShelf lazy query={`${title} ${c.name}`} />
      </section>
      {hasBank(c.code, un) ? (
        <section className="card flex flex-col gap-2 !border-green" aria-labelledby="tq">
          <h2 id="tq" className="text-xl">Topic quiz</h2>
          <p className="text-sm text-muted">5 questions from this unit. Score 60% or more to complete the topic and earn XP.</p>
          <StartQuizButton kind="topic" course={c.code} unit={un} topicKey={key}>{score !== undefined ? "Take the quiz again" : "Take the topic quiz"}</StartQuizButton>
        </section>
      ) : (
        <p className="card text-sm text-muted">Practice questions for this subject are not available yet.</p>
      )}
      <nav aria-label="Topic navigation" className="flex justify-between gap-3">
        {prev ? <Link href={prev} className="btn btn-ghost">← Previous</Link> : <span />}
        {next ? <Link href={next} className="btn btn-ghost">Next →</Link> : <Link href={`/learn/${c.code}/${un}`} className="btn btn-ghost">Back to unit</Link>}
      </nav>
    </div>
  );
}
