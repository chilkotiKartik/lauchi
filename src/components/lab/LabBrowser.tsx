"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LabVideos } from "@/components/lab/LabVideos";
import type { PinnedVideo } from "@/lib/admin";
import { filterLabs, parseSel, selToQuery, subjectCounts, unitCounts, videoQuery, type BrowseCourse, type BrowseLab, type Sel } from "@/lib/lab-browse";

const ACCENT = { ["--accent" as string]: "#ffc83d" };
const pill = (on: boolean) => `rounded-full border-2 px-3 py-1.5 text-left text-sm font-extrabold transition-colors ${on ? "border-blue bg-blue-l text-blue-t" : "border-line bg-card text-ink hover:bg-soft"}`;

/** Best-score flags from localStorage (`lockin.exp.<labId>`), as a stable string so useSyncExternalStore does not loop. */
function useTried(ids: string[]): Set<string> {
  const joined = ids.join(",");
  const raw = useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
    () => {
      const hit: string[] = [];
      for (const id of joined ? joined.split(",") : []) {
        try { const v = JSON.parse(localStorage.getItem(`lockin.exp.${id}`) ?? "null") as { best?: number } | null; if (v && (v.best ?? 0) > 0) hit.push(id); } catch { /* ignore */ }
      }
      return hit.join(",");
    },
    () => "",
  );
  return useMemo(() => new Set(raw ? raw.split(",") : []), [raw]);
}

export function LabBrowser({ labs, courses, pinned, pinnedFor, youtubeOn }: { labs: BrowseLab[]; courses: BrowseCourse[]; pinned: PinnedVideo[]; pinnedFor: string; youtubeOn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sel = useMemo(() => parseSel({ course: params.get("course"), unit: params.get("unit"), topic: params.get("topic") }, courses), [params, courses]);
  const [q, setQ] = useState("");
  const tried = useTried(useMemo(() => labs.filter((l) => l.guided).map((l) => l.id), [labs]));

  const go = (next: Sel) => { const s = selToQuery(next); router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }); };
  const subjects = useMemo(() => subjectCounts(labs, courses.map((c) => c.code)), [labs, courses]);
  const course = courses.find((c) => c.code === sel.course) ?? null;
  const unit = course?.units.find((u) => u.n === sel.unit) ?? null;
  const topicText = unit && sel.topic ? unit.topics[sel.topic - 1] ?? null : null;
  const units = course ? unitCounts(labs, course.code, course.units) : [];
  const { labs: shown, fallback } = filterLabs(labs, sel, topicText, q);
  const selKey = `${sel.course ?? ""}:${sel.unit ?? ""}:${sel.topic ?? ""}`;
  const vq = course && unit ? videoQuery(course.name, unit.title, topicText) : "";

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section aria-labelledby="pick-subject" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pick-subject" className="text-xl">1. Pick a subject</h2>
          {course && <button type="button" className="btn btn-ghost !min-h-11" onClick={() => { setQ(""); go({ course: null, unit: null, topic: null }); }}>Show all subjects</button>}
        </div>
        <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {subjects.map(({ course: code, count }) => {
            const c = courses.find((x) => x.code === code);
            const guided = labs.filter((l) => l.guided && l.where.some(([x]) => x === code));
            const done = guided.filter((l) => tried.has(l.id)).length;
            const on = sel.course === code;
            return (
              <li key={code} className="min-w-0">
                <button type="button" aria-pressed={on} onClick={() => go(on ? { course: null, unit: null, topic: null } : { course: code, unit: null, topic: null })}
                  className={`flex min-h-[4.5rem] w-full min-w-0 flex-col gap-0.5 rounded-2xl border-2 p-3 text-left transition-colors ${on ? "border-blue bg-blue-l" : "border-line bg-card hover:bg-soft"}`}>
                  <b className="text-head">{c?.short ?? code}</b>
                  <span className="truncate text-xs text-muted">{c?.name ?? code}</span>
                  <span className="text-xs font-extrabold text-blue-t">{count} lab{count === 1 ? "" : "s"}{guided.length > 0 && ` · ${done}/${guided.length} experiments tried`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {course && (
        <section aria-labelledby="pick-unit" className="flex min-w-0 flex-col gap-2">
          <h2 id="pick-unit" className="text-xl">2. Pick a unit <span className="text-base text-muted">· {course.name}</span></h2>
          <ul className="unit-tabs" role="list">
            {course.units.map((u) => {
              const count = units.find((x) => x.n === u.n)?.count ?? 0;
              const on = sel.unit === u.n;
              return (
                <li key={u.n} className="flex-none">
                  <button type="button" aria-pressed={on} onClick={() => go({ course: course.code, unit: on ? null : u.n, topic: null })}
                    className={`unit-tab ${on ? "is-on" : ""} ${count === 0 ? "!border-dashed" : ""}`}>
                    <span className="unit-num">U{u.n}</span>
                    <span className="flex min-w-0 flex-col text-left"><span className="truncate">{u.title}</span><span className="text-xs font-bold text-muted">{count > 0 ? `${count} lab${count === 1 ? "" : "s"}` : "Videos only"}</span></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {course && unit && unit.topics.length > 0 && (
        <section aria-labelledby="pick-topic" className="flex min-w-0 flex-col gap-2">
          <h2 id="pick-topic" className="text-xl">3. Pick a topic <span className="text-base text-muted">· optional</span></h2>
          <ul className="flex flex-wrap gap-2">
            {unit.topics.map((t, i) => (
              <li key={i} className="max-w-full">
                <button type="button" aria-pressed={sel.topic === i + 1} onClick={() => go({ course: course.code, unit: unit.n, topic: sel.topic === i + 1 ? null : i + 1 })} className={`${pill(sel.topic === i + 1)} max-w-full break-words`}>{t}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="labs-h" className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="labs-h" className="text-xl">{course ? `Labs${unit ? ` for Unit ${unit.n}` : ""}${topicText ? `: ${topicText}` : ""}` : "All labs"} <span className="text-base text-muted">· {shown.length}</span></h2>
          <label className="flex w-full flex-col gap-1 text-sm font-extrabold text-head sm:w-72">
            Search labs by name
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Thevenin" className="field" />
          </label>
        </div>
        {fallback && topicText && <p role="status" className="text-sm text-muted">No lab is tagged &ldquo;{topicText}&rdquo;, so here are all labs for this unit.</p>}
        {shown.length === 0 ? (
          <p role="status" className="card text-muted">{q ? "No lab matches that name here." : unit ? "No labs for this unit yet. The lectures below still cover it." : "No labs here yet."}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((l) => {
              const w = (course && l.where.find(([c]) => c === course.code)) || l.where[0];
              const label = courses.find((c) => c.code === w[0])?.short ?? w[0];
              return (
                <li key={l.id} className="min-w-0">
                  <Link href={`/labs/${l.id}`} className="tile h-full" style={ACCENT}>
                    <span className="text-xs font-black uppercase tracking-wide text-muted">{label} · Unit {w[1]}{l.animated ? " · animated" : ""}</span>
                    <b>{l.title}</b>
                    <span className="text-sm text-muted">{l.blurb}</span>
                    {l.guided && <span className="chip chip-cool w-fit">guided experiment{tried.has(l.id) ? " · tried" : ""}</span>}
                    <span className="mt-auto text-xs font-extrabold text-blue-t">{l.topics.join(" · ")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {course && unit ? (
        <LabVideos key={selKey} id="topic-videos" heading={`Watch: ${topicText ?? unit.title}`} query={vq} youtubeOn={youtubeOn} pinned={pinnedFor === selKey ? pinned : []} />
      ) : (
        <p className="card text-muted">Pick a subject and a unit to see lecture videos for it.</p>
      )}
    </div>
  );
}
