import { canSeeCourse, type Viewer } from "@/lib/stream";
import { getCourse, listCourses, type CourseSummary } from "@/lib/syllabus";

export type Hit = { kind: "topic" | "experiment"; course: string; short: string; href: string; title: string; where: string };

/** Case-insensitive search over every topic and experiment title. Server-only (reads the syllabus JSON). */
export function searchSyllabus(query: string, type: CourseSummary["type"] | "all", branch: Viewer, max = 60): { hits: Hit[]; total: number } {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { hits: [], total: 0 };
  const all: Hit[] = [];
  for (const s of listCourses()) {
    if (type !== "all" && s.type !== type) continue;
    if (!canSeeCourse(branch, s.code, s.type)) continue;
    const c = getCourse(s.code); if (!c) continue;
    c.units.forEach((u) => u.topics.forEach((t, ti) => {
      if (t.toLowerCase().includes(q) || u.title.toLowerCase().includes(q)) all.push({ kind: "topic", course: c.code, short: c.short, href: `/learn/${c.code}/${u.n}/${ti + 1}`, title: t, where: `Unit ${u.n}: ${u.title}` });
    }));
    c.exps.forEach((e) => { if (e.title.toLowerCase().includes(q) || e.aim.toLowerCase().includes(q)) all.push({ kind: "experiment", course: c.code, short: c.short, href: `/learn/${c.code}/lab/${e.n}`, title: e.title, where: `Experiment ${e.n}` }); });
  }
  return { hits: all.slice(0, max), total: all.length };
}
