import { requireOnboarded } from "@/lib/auth";
import { canSeeCourse } from "@/lib/stream";
import { formatSize, kindLabel } from "@/lib/resources";
import { loadResources } from "./data";

/** "Notes & files" shelf for one unit (mirrors Teacher's picks). Renders nothing when there is nothing shared. */
export async function CourseResources({ course, unit }: { course: string; unit: number }) {
  const { supabase, profile } = await requireOnboarded();
  if (!canSeeCourse(profile.branch, course)) return null;
  const items = await loadResources(supabase, profile.branch, { course, unit, limit: 50 });
  if (items.length === 0) return null;
  return (
    <section className="card flex flex-col gap-3" aria-labelledby="unit-files">
      <h2 id="unit-files" className="text-xl">Notes &amp; files</h2>
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-soft p-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2"><b className="break-words text-head">{r.title}</b>{r.fresh && <span className="chip chip-hot">New</span>}<span className="chip chip-cool">{kindLabel(r.kind)}</span></p>
              {(r.description || r.size_bytes) && <p className="text-sm text-muted">{[r.description, formatSize(r.size_bytes)].filter(Boolean).join(" · ")}</p>}
            </div>
            <a className="btn btn-ghost !px-4 !py-2 !text-sm no-underline" href={`/api/resources/${r.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title}`}>Open</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
