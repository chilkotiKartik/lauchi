import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { formatSize } from "@/lib/resources";
import { loadResources } from "./data";

/** Read-only list of assignment files teachers uploaded, grouped by subject. Renders nothing when there are none. */
export async function AssignmentFiles() {
  const { supabase, profile } = await requireOnboarded();
  const items = await loadResources(supabase, profile.branch, { kind: "assignment", limit: 200 });
  if (items.length === 0) return null;
  const codes = [...new Set(items.map((i) => i.course))];
  return (
    <section className="card flex flex-col gap-3" aria-labelledby="teacher-asg">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="teacher-asg" className="text-xl">Assignment files from your teachers</h2>
        <Link href="/resources" className="text-sm font-black">All notes &amp; files</Link>
      </div>
      {codes.map((code) => (
        <div key={code} className="flex flex-col gap-2">
          <h3 className="text-base">{getCourse(code)?.short ?? code}</h3>
          <ul className="flex flex-col gap-2">
            {items.filter((i) => i.course === code).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-soft p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2"><b className="break-words text-head">{r.title}</b>{r.fresh && <span className="chip chip-hot">New</span>}</p>
                  <p className="text-sm text-muted">Unit {r.unit}{r.size_bytes ? ` · ${formatSize(r.size_bytes)}` : ""}</p>
                </div>
                <a className="btn btn-ghost !px-4 !py-2 !text-sm no-underline" href={`/api/resources/${r.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title}`}>Open</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
