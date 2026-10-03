import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse, listCourses } from "@/lib/syllabus";
import { ArtVideo } from "@/components/art";
import { VideoShelf } from "@/components/Videos";
import { getPinnedVideos } from "@/lib/admin";
import { PinnedVideos } from "@/components/PinnedVideos";
import { youtubeConfigured } from "@/lib/youtube";

export const metadata: Metadata = { title: "Video lectures" };

const BOOST = "study motivation for engineering students exam";

export default async function Videos({ searchParams }: { searchParams: Promise<{ course?: string; unit?: string; t?: string; boost?: string }> }) {
  const { profile } = await requireOnboarded();
  const sp = await searchParams;
  const theory = visibleCourses(profile, listCourses()).filter((c) => c.type === "theory" || c.type === "bridge");
  const course = (theory.some((t) => t.code === sp.course) ? getCourse(sp.course ?? "") : null) ?? getCourse(theory[0].code)!;
  const n = Math.min(course.units.length, Math.max(1, parseInt(sp.unit ?? "1", 10) || 1));
  const unit = course.units[n - 1];
  const ti = sp.t !== undefined ? parseInt(sp.t, 10) : -1;
  const topic = ti >= 0 && ti < unit.topics.length ? unit.topics[ti] : null;
  const boost = sp.boost === "1";
  const query = boost ? BOOST : topic ? `${topic} ${course.name}` : `${unit.title} ${course.name} lecture`;
  const on = youtubeConfigured();
  const pinned = boost ? [] : await getPinnedVideos(course.code, n, topic ? ti + 1 : undefined);
  return (
    <div className="flex flex-col gap-5">
      <header className="page-head flex items-center gap-3"><ArtVideo size={56} /><div><h1 className="text-3xl">Video lectures</h1><p className="text-muted">Pick a unit or a single topic and watch right here. {on ? "Results come from YouTube search." : "In-app playback switches on when the site owner adds a YouTube key; until then each search opens YouTube."}</p></div></header>
      <nav aria-label="Subject" className="flex flex-wrap gap-2">
        {theory.map((c) => <Link key={c.code} href={`/videos?course=${c.code}`} aria-current={c.code === course.code && !boost ? "true" : undefined} className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${c.code === course.code && !boost ? "border-red bg-red-l text-red-t" : "border-line text-ink"}`}>{c.short}</Link>)}
        <Link href="/videos?boost=1" aria-current={boost ? "true" : undefined} className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold no-underline ${boost ? "border-purple bg-purple-l text-purple-t" : "border-line text-ink"}`}>Need a boost?</Link>
      </nav>

      {!boost && (
        <nav aria-label="Unit" className="unit-tabs">
          {course.units.map((u) => (
            <Link key={u.n} href={`/videos?course=${course.code}&unit=${u.n}`} aria-current={u.n === n ? "page" : undefined} className={`unit-tab ${u.n === n ? "is-on" : ""}`}>
              <span className="unit-num">U{u.n}</span><span className="truncate">{u.title}</span>
            </Link>
          ))}
        </nav>
      )}

      <PinnedVideos videos={pinned} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card min-w-0" aria-label="Player">
          <p className="text-xs font-black uppercase tracking-wide text-muted">{boost ? "Motivation" : `${course.short} · Unit ${n}`}</p>
          <h2 className="mb-3 text-2xl">{boost ? "When you need a push" : topic ?? unit.title}</h2>
          <VideoShelf key={query} query={query} />
        </section>
        {!boost && (
          <aside className="card flex flex-col gap-2" aria-labelledby="tp">
            <h2 id="tp" className="text-lg">Topics in this unit</h2>
            <p className="text-sm text-muted">Tap a topic for a focused lecture.</p>
            <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              <li><Link href={`/videos?course=${course.code}&unit=${n}`} aria-current={!topic ? "true" : undefined} className={`block rounded-xl px-3 py-2 text-sm font-bold no-underline ${!topic ? "bg-red-l text-red-t" : "text-ink hover:bg-soft"}`}>Whole unit</Link></li>
              {unit.topics.map((t, i) => (
                <li key={i}><Link href={`/videos?course=${course.code}&unit=${n}&t=${i}`} aria-current={i === ti ? "true" : undefined} className={`block rounded-xl px-3 py-2 text-sm font-bold no-underline ${i === ti ? "bg-red-l text-red-t" : "text-ink hover:bg-soft"}`}>{t}</Link></li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
