// Pure logic for the subject -> unit -> topic lab browser. No server-only imports so tests and client code can use it.

export type BrowseLab = { id: string; title: string; blurb: string; where: [string, number][]; topics: string[]; animated: boolean; guided: boolean; /** the student finished this lab's tasks or experiment */ done?: boolean };
export type BrowseUnit = { n: number; title: string; topics: string[] };
export type BrowseCourse = { code: string; name: string; short: string; units: BrowseUnit[] };
export type Sel = { course: string | null; unit: number | null; topic: number | null };

const STOP = new Set(["the", "and", "for", "with", "from", "into", "of", "in", "on", "to", "a", "an", "by", "its", "using", "their", "are", "use"]);

/** Lower-case word tokens (3+ letters/digits) without filler words. */
export function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length >= 3 && !STOP.has(t));
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Fuzzy match of a lab's topic label against a syllabus topic: substring either way, or enough shared words. */
export function topicMatches(labTopic: string, syllabusTopic: string): boolean {
  const a = norm(labTopic), b = norm(syllabusTopic);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(tokens(a)), tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return false;
  let shared = 0;
  for (const t of ta) if (tb.has(t) || [...tb].some((u) => u.length >= 5 && t.length >= 5 && (u.startsWith(t) || t.startsWith(u)))) shared++;
  return shared >= 2 || shared === Math.min(ta.size, tb.size);
}

export const labMatchesTopic = (lab: Pick<BrowseLab, "topics" | "title">, topic: string): boolean =>
  lab.topics.some((t) => topicMatches(t, topic)) || topicMatches(lab.title, topic);

export const labInCourse = (lab: Pick<BrowseLab, "where">, course: string) => lab.where.some(([c]) => c === course);
export const labInUnit = (lab: Pick<BrowseLab, "where">, course: string, unit: number) => lab.where.some(([c, u]) => c === course && u === unit);

/** Labs per subject, in first-seen order of `order` (course codes), skipping subjects with no labs. */
export function subjectCounts(labs: readonly Pick<BrowseLab, "where">[], order: readonly string[]): { course: string; count: number }[] {
  const n = new Map<string, number>();
  for (const l of labs) for (const c of new Set(l.where.map(([x]) => x))) n.set(c, (n.get(c) ?? 0) + 1);
  const known = order.filter((c) => n.has(c));
  const rest = [...n.keys()].filter((c) => !order.includes(c)).sort();
  return [...known, ...rest].map((course) => ({ course, count: n.get(course) ?? 0 }));
}

/** Lab count for each unit of one subject (units without labs get 0). */
export function unitCounts(labs: readonly Pick<BrowseLab, "where">[], course: string, units: readonly { n: number }[]): { n: number; count: number }[] {
  return units.map((u) => ({ n: u.n, count: labs.filter((l) => labInUnit(l, course, u.n)).length }));
}

export type Filtered = { labs: BrowseLab[]; /** true when a chosen topic matched no lab, so the whole unit is shown instead */ fallback: boolean };

/** Labs for a selection, optionally narrowed by a title/blurb search. Sorted by unit then title. */
export function filterLabs(labs: readonly BrowseLab[], sel: Sel, topicText: string | null, q: string): Filtered {
  let list = labs.slice();
  let fallback = false;
  if (sel.course) {
    const c = sel.course;
    list = list.filter((l) => labInCourse(l, c));
    if (sel.unit) {
      const u = sel.unit;
      list = list.filter((l) => labInUnit(l, c, u));
      if (topicText) {
        const hit = list.filter((l) => labMatchesTopic(l, topicText));
        if (hit.length) list = hit; else fallback = list.length > 0;
      }
    }
  }
  const needle = norm(q);
  if (needle) list = list.filter((l) => norm(`${l.title} ${l.blurb}`).includes(needle));
  const key = (l: BrowseLab) => {
    const w = (sel.course && l.where.find(([c]) => c === sel.course)) || l.where[0];
    return w ? w[1] : 99;
  };
  list.sort((a, b) => key(a) - key(b) || a.title.localeCompare(b.title));
  return { labs: list, fallback };
}

/** Validates raw URL params against the known subjects. Topic is 1-based and only valid with a unit. */
export function parseSel(raw: { course?: string | null; unit?: string | null; topic?: string | null }, courses: readonly BrowseCourse[]): Sel {
  const course = courses.find((c) => c.code === raw.course) ?? null;
  if (!course) return { course: null, unit: null, topic: null };
  const u = Number.parseInt(raw.unit ?? "", 10);
  const unit = course.units.find((x) => x.n === u) ?? null;
  if (!unit) return { course: course.code, unit: null, topic: null };
  const t = Number.parseInt(raw.topic ?? "", 10);
  const topic = Number.isInteger(t) && t >= 1 && t <= unit.topics.length ? t : null;
  return { course: course.code, unit: unit.n, topic };
}

export function selToQuery(sel: Sel): string {
  const p = new URLSearchParams();
  if (sel.course) p.set("course", sel.course);
  if (sel.course && sel.unit) p.set("unit", String(sel.unit));
  if (sel.course && sel.unit && sel.topic) p.set("topic", String(sel.topic));
  return p.toString();
}

/** Same phrasing as the /videos page so YouTube searches are shared through the server cache. */
export function videoQuery(courseName: string, unitTitle: string, topic: string | null): string {
  return topic ? `${topic} ${courseName}` : `${unitTitle} ${courseName} lecture`;
}
