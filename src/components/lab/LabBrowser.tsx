"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChipRow } from "@/components/ChipRow";
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
  const { labs: shown } = filterLabs(labs, sel, topicText, q);
  const selKey = `${sel.course ?? ""}:${sel.unit ?? ""}:${sel.topic ?? ""}`;
  const vq = course && unit ? videoQuery(course.name, unit.title, topicText) : "";

  // labs of the chosen subject, grouped by unit (search narrows them); a chosen unit shows only that unit
  const groups = course ? course.units.map((u) => ({ u, labs: shown.filter((l) => l.where.some(([c, n]) => c === course.code && n === u.n)) })).filter((g) => g.labs.length > 0 && (!unit || g.u.n === unit.n)) : [];
  const Tile = ({ l }: { l: BrowseLab }) => {
    const w = (course && l.where.find(([c]) => c === course.code)) || l.where[0];
    const label = courses.find((c) => c.code === w[0])?.short ?? w[0];
    return (
      <Link href={`/labs/${l.id}`} className="tile h-full !gap-1 !p-3 sm:!p-4" style={ACCENT}>
        {!course && <span className="text-[11px] font-black uppercase tracking-wide text-muted">{label} · Unit {w[1]}</span>}
        <b className="leading-snug">{l.title}</b>
        <span className="line-clamp-2 text-sm text-muted">{l.blurb}</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {l.animated && <span className="chip chip-soft !text-[11px]">animated</span>}
          {l.guided && <span className="chip chip-cool !text-[11px]">guided{tried.has(l.id) ? " · tried" : ""}</span>}
        </span>
      </Link>
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* subjects: one swipeable row of chips; picking one shows its labs right below, no scrolling */}
      <ChipRow label="Subjects" active={sel.course}>
        <button type="button" aria-pressed={!course} onClick={() => { setQ(""); go({ course: null, unit: null, topic: null }); }} className={`${pill(!course)} shrink-0 whitespace-nowrap`}>All labs · {labs.length}</button>
        {subjects.map(({ course: code, count }) => {
          const c = courses.find((x) => x.code === code);
          const on = sel.course === code;
          return (
            <button key={code} type="button" aria-pressed={on} onClick={() => go(on ? { course: null, unit: null, topic: null } : { course: code, unit: null, topic: null })}
              className={`${pill(on)} shrink-0 whitespace-nowrap`} title={c?.name ?? code}>
              {c?.short ?? code} · {count}
            </button>
          );
        })}
      </ChipRow>

      {course && (
        <ChipRow label={`Units of ${course.name}`} active={`${course.code}:${sel.unit ?? 0}`}>
          <button type="button" aria-pressed={!unit} onClick={() => go({ course: course.code, unit: null, topic: null })} className={`${pill(!unit)} shrink-0 whitespace-nowrap`}>All units</button>
          {course.units.map((u) => {
            const count = units.find((x) => x.n === u.n)?.count ?? 0;
            const on = sel.unit === u.n;
            return (
              <button key={u.n} type="button" aria-pressed={on} onClick={() => go({ course: course.code, unit: on ? null : u.n, topic: null })}
                className={`${pill(on)} shrink-0 whitespace-nowrap ${count === 0 ? "opacity-60" : ""}`} title={u.title}>
                Unit {u.n} · {count}
              </button>
            );
          })}
        </ChipRow>
      )}

      <label className="sr-only" htmlFor="lab-search">Search labs by name</label>
      <input id="lab-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={course ? `Search ${course.short} labs…` : "Search all labs, e.g. Thevenin"} className="field" />

      {course ? (
        groups.length === 0 ? (
          <p role="status" className="card text-muted">{q ? "No lab matches that name here." : "No labs for this unit yet. The lectures below still cover it."}</p>
        ) : groups.map(({ u, labs: list }) => (
          <section key={u.n} aria-labelledby={`u-${u.n}`} className="flex min-w-0 flex-col gap-2">
            <h2 id={`u-${u.n}`} className="flex items-baseline gap-2 text-lg"><span className="unit-num">U{u.n}</span><span className="min-w-0">{u.title}</span><span className="text-sm font-bold text-muted">· {list.length}</span></h2>
            <ul className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {list.map((l) => <li key={l.id} className="min-w-0"><Tile l={l} /></li>)}
            </ul>
          </section>
        ))
      ) : shown.length === 0 ? (
        <p role="status" className="card text-muted">No lab matches that name here.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 xl:grid-cols-3" aria-label="All labs">
          {shown.map((l) => <li key={l.id} className="min-w-0"><Tile l={l} /></li>)}
        </ul>
      )}

      {course && unit && (
        <LabVideos key={selKey} id="topic-videos" heading={`Watch: ${unit.title}`} query={vq} youtubeOn={youtubeOn} pinned={pinnedFor === selKey ? pinned : []} />
      )}
    </div>
  );
}
