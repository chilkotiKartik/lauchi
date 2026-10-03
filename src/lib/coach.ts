import "server-only";
import type { CoachInfo } from "@/components/Coach";
import { getCourse } from "@/lib/syllabus";
import { labsFor } from "@/labs/registry";
import { hasPyq } from "@/lib/pyq";

/** What the "Fix it now" coach can point to for one unit: explainer video query, unit page, a 3D lab, PYQs, Ask Lochi. */
export function coachFor(course: string, unit: number): CoachInfo {
  const c = getCourse(course);
  return {
    course, courseName: c?.name ?? course, unit, unitTitle: c?.units[unit - 1]?.title ?? `Unit ${unit}`,
    labs: labsFor(course, unit).slice(0, 2).map((l) => ({ id: l.id, title: l.title })), pyq: hasPyq(course),
  };
}
