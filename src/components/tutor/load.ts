import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getCourse } from "@/lib/syllabus";
import { getPyq } from "@/lib/pyq";
import { LESSONS } from "@/content/lessons";
import { recentMistakes } from "@/lib/review";
import { buildContext, type BuiltContext, type ContextInput, type CtxParams, type MistakeIn } from "@/lib/tutor";
import type { AnswerBook } from "@/content/answers/types";

function modelAnswer(course: string, id: string): ContextInput["answer"] {
  try {
    const book = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "content", "answers", course + ".json"), "utf8")) as AnswerBook;
    return book[id];
  } catch { return undefined; }
}

/** Gather the syllabus, lesson, PYQ, model answer and the student's mistakes for the given params, then trim to the budget. Never throws. */
export async function loadTutorContext(userId: string, p: CtxParams | null): Promise<BuiltContext> {
  if (!p) return { text: "", sources: [] };
  const input: ContextInput = {};
  let course = p.course;
  let unitN = p.unit;
  const sub = course ? getPyq(course) : null;
  const pq = p.pyq && sub ? sub.units.flatMap((u) => u.pyqs.map((q) => ({ q, unit: u.n }))).find((x) => x.q.id === p.pyq) : undefined;
  if (pq) {
    unitN = unitN ?? pq.unit;
    input.pyq = { id: pq.q.id, title: pq.q.title, text: pq.q.parts.map((x) => x.text).join("\n") || pq.q.title };
    input.answer = modelAnswer(course!, pq.q.id);
  }
  const c = course ? getCourse(course) : null;
  if (c) {
    input.courseName = c.name;
    const u = unitN ? c.units[unitN - 1] : undefined;
    if (u) {
      input.unit = { n: u.n, title: u.title, topics: u.topics, formulas: u.formulas, hints: u.hints };
      if (p.topic && u.topics[p.topic - 1]) input.topic = { title: u.topics[p.topic - 1], lesson: LESSONS[`${course}:${u.n}:${p.topic}`] };
    }
  } else course = undefined;
  if (course || p.mistake) {
    try {
      const all = await recentMistakes(userId);
      const toIn = (r: (typeof all)[number]): MistakeIn => ({ q: r.q, given: r.given, right: r.right, why: r.why });
      if (p.mistake) {
        const [sid, idx] = p.mistake.split(":");
        const f = all.find((r) => r.session === sid && String(r.index) === idx);
        if (f) { input.focusMistake = toIn(f); if (!course) input.mistakes = []; }
      }
      if (course) input.mistakes = all.filter((r) => r.course === course && (!unitN || r.unit === unitN)).slice(0, 5).map(toIn);
    } catch { /* mistakes are optional */ }
  }
  return buildContext(input);
}
