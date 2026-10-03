import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse, canSeeLab } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { Crumbs } from "@/components/Crumbs";
import { LabHost, type SavedSetup } from "@/labs/LabHost";
import { LABS, getLab } from "@/labs/registry";
import { decodeParams } from "@/labs/params-core";
import { getCourse } from "@/lib/syllabus";
import { getExperiment } from "@/labs/experiments";
import { LabVideos } from "@/components/lab/LabVideos";
import { getPinnedVideos } from "@/lib/admin";
import { youtubeConfigured } from "@/lib/youtube";
import { ExperimentPanel } from "@/components/lab/ExperimentPanel";
import { LabTasks } from "@/components/lab/LabTasks";
import { getPublishedLabQuestions } from "@/lib/cms-db";

export function generateStaticParams() { return LABS.map((l) => ({ id: l.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const lab = getLab((await params).id);
  return { title: lab?.title ?? "Lab" };
}

export default async function LabPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string | string[] }> }) {
  const { supabase, profile } = await requireOnboarded();
  const lab = getLab((await params).id);
  if (!lab || !canSeeLab(profile.branch, lab)) notFound();
  const v = (await searchParams).v;
  const initial = decodeParams(typeof v === "string" ? v : null);
  const { data } = await supabase.from("lab_setups").select("id,name,params").eq("lab", lab.id).order("created_at", { ascending: false }).limit(30);
  const saved = (data ?? []) as SavedSetup[];
  const base = getExperiment(lab.id);
  // Admin-written questions (cms_lab_questions, published only) are appended; their answers live in the payload and are scored client-side like the built-in ones.
  const extra = base ? await getPublishedLabQuestions(lab.id) : [];
  const experiment = base && extra.length ? { ...base, questions: [...base.questions, ...extra] } : base;
  const shown = lab.where.filter(([c]) => canSeeCourse(profile.branch, c));
  const [wc, wu] = shown[0] ?? lab.where[0];
  const wCourse = getCourse(wc);
  const wTopic = lab.topics[0] ?? lab.title;
  const pinned = await getPinnedVideos(wc, wu);
  const tasks = <LabTasks labId={lab.id} title={lab.title} topic={wTopic} presets={lab.presets} course={wc} unit={wu} courseName={wCourse?.name ?? wc} unitTitle={wCourse?.units[wu - 1]?.title ?? `Unit ${wu}`} />;
  return (
    <div className="flex flex-col gap-4">
      <Crumbs items={[{ href: "/labs", label: "Labs" }, { label: lab.title }]} />
      <h1 className="text-3xl">{lab.title}</h1>
      <p className="line-clamp-2 text-muted sm:line-clamp-none">{lab.blurb} <span className="hidden sm:inline">Drag to rotate, scroll or pinch to zoom. Type exact values in the boxes next to each slider.</span></p>
      <p className="flex flex-wrap gap-2 text-sm">
        {shown.map(([c, u]) => {
          const course = getCourse(c);
          return <Link key={c + u} href={`/learn/${c}/${u}`} className="pill !px-3 no-underline">{course?.short ?? c} · Unit {u}: {course?.units[u - 1]?.title ?? ""}</Link>;
        })}
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <LabHost id={lab.id} title={lab.title} topics={lab.topics} presets={lab.presets} saved={saved} initial={initial} />
          {experiment && tasks}
        </div>
        {experiment
          ? <div className="min-w-0 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1"><ExperimentPanel experiment={experiment} /></div>
          : <div className="min-w-0 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1">{tasks}</div>}
      </div>
      <LabVideos heading="Watch this topic" query={`${wTopic} ${wCourse?.name ?? ""}`.trim()} pinned={pinned} youtubeOn={youtubeConfigured()} />
    </div>
  );
}
