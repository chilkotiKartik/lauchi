import type { Metadata } from "next";
import { Suspense } from "react";
import { canSeeCourse, visibleLabs } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { LABS as ALL_LABS } from "@/labs/registry";
import { getExperiment } from "@/labs/experiments";
import { getCourse, listCourses } from "@/lib/syllabus";
import { getPinnedVideos } from "@/lib/admin";
import { youtubeConfigured } from "@/lib/youtube";
import { parseSel, subjectCounts, type BrowseCourse, type BrowseLab } from "@/lib/lab-browse";
import { ArtLab } from "@/components/art";
import { LabBrowser } from "@/components/lab/LabBrowser";

export const metadata: Metadata = { title: "Labs" };

export default async function Labs({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string; topic?: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const sp = await searchParams;
  const { data: progress } = await supabase.from("lab_progress").select("lab"); // RLS: own rows only; missing table → no ticks
  const done = new Set((progress ?? []).map((r: { lab: string }) => r.lab));
  const labs: BrowseLab[] = visibleLabs(profile, ALL_LABS).map((l) => ({
    id: l.id, title: l.title, blurb: l.blurb, where: l.where.filter(([c]) => canSeeCourse(profile, c)), topics: l.topics, animated: l.animated, guided: !!getExperiment(l.id), done: done.has(l.id),
  }));
  const order = listCourses().map((c) => c.code);
  const codes = subjectCounts(labs, order).map((s) => s.course);
  const courses: BrowseCourse[] = codes.map((code) => {
    const c = getCourse(code);
    if (c) return { code, name: c.name, short: c.short, units: c.units.map((u) => ({ n: u.n, title: u.title, topics: u.topics })) };
    const max = Math.max(...labs.flatMap((l) => l.where.filter(([x]) => x === code).map(([, u]) => u)));
    return { code, name: code, short: code, units: Array.from({ length: max }, (_, i) => ({ n: i + 1, title: `Unit ${i + 1}`, topics: [] })) };
  });
  const sel = parseSel(sp, courses);
  const pinnedFor = `${sel.course ?? ""}:${sel.unit ?? ""}:${sel.topic ?? ""}`;
  const pinned = sel.course && sel.unit ? await getPinnedVideos(sel.course, sel.unit, sel.topic ?? undefined) : [];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="card hero-card flex items-center gap-4" style={{ ["--accent" as string]: "#ffc83d" }}>
        <div className="floaty hidden sm:block"><ArtLab size={72} /></div>
        <div className="min-w-0">
          <h1 className="text-3xl">Live 3D labs</h1>
          <p className="text-muted">{labs.length} simulations across {codes.length} subjects{done.size ? ` · ${labs.filter((l) => l.done).length} done` : ""}. Tap a subject to see its labs by unit.</p>
        </div>
      </div>
      <Suspense fallback={<div className="skel h-64" aria-hidden />}>
        <LabBrowser labs={labs} courses={courses} pinned={pinned} pinnedFor={pinnedFor} youtubeOn={youtubeConfigured()} />
      </Suspense>
    </div>
  );
}
