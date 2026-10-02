import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LESSONS, LESSONS_HI, LESSONS_HL, type Lesson } from "./lessons";
import type { AnswerBook } from "./answers/types";
import { LABS } from "../labs/registry";

const root = path.join(__dirname);
const syl = (code: string) => JSON.parse(fs.readFileSync(path.join(root, "syllabus", `${code}.json`), "utf8")) as { units: { topics: string[] }[] };
const pyq = (code: string) => JSON.parse(fs.readFileSync(path.join(root, "pyq", `${code}.json`), "utf8")) as { units: { n: number; pyqs: { id: string; parts: { text: string }[] }[]; predicted: unknown[] }[] };
const CORE = ["AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001"];
const TAG = /<\/?(?!(?:sub|sup|b|i)>)[a-z][a-z0-9]*(?:\s[^<>]*)?\/?>/i;
const labIds = new Set(LABS.map((l) => l.id));

function checkLesson(key: string, l: Lesson) {
  const [code, u, t] = key.split(":");
  const s = syl(code);
  expect(s.units[+u - 1]?.topics[+t - 1], `${key} is not a real topic`).toBeTruthy();
  expect(l.intro.length).toBeGreaterThan(40);
  expect(l.sections.length).toBeGreaterThanOrEqual(2);
  expect(l.examples.length).toBeGreaterThanOrEqual(1);
  expect(l.mistakes.length).toBeGreaterThanOrEqual(2);
  expect(l.check.length).toBeGreaterThanOrEqual(2);
  for (const c of l.check) { expect(c.a).toBeGreaterThanOrEqual(0); expect(c.a).toBeLessThan(c.o.length); expect(new Set(c.o).size).toBe(c.o.length); }
  if (l.lab) expect(labIds.has(l.lab.id), `${key} links unknown lab ${l.lab.id}`).toBe(true);
  const all = [l.intro, ...l.sections.flatMap((s) => [s.h, ...s.p, ...(s.formula ?? [])]), ...l.examples.flatMap((e) => [e.q, ...e.steps, e.ans]), ...l.mistakes, ...l.check.flatMap((c) => [c.q, ...c.o, c.why])];
  for (const x of all) expect(TAG.test(x), `${key}: only <sub><sup><b><i> allowed: ${x.slice(0, 80)}`).toBe(false);
}

describe("lessons", () => {
  it("every lesson is attached to a real topic and well formed", () => { for (const [k, l] of Object.entries(LESSONS)) checkLesson(k, l); });
  it("translations only exist for English lessons and keep the same shape", () => {
    for (const [name, book] of [["hi", LESSONS_HI], ["hl", LESSONS_HL]] as const) for (const [k, l] of Object.entries(book)) {
      const en = LESSONS[k];
      expect(en, `${name} ${k} has no English lesson`).toBeTruthy();
      checkLesson(k, l);
      expect(l.check.map((c) => c.a), `${name} ${k} answers must match English`).toEqual(en.check.map((c) => c.a));
      expect(l.lab?.id).toBe(en.lab?.id);
    }
  });
});

describe("model answers", () => {
  for (const code of CORE) it(`${code}: ids exist, rubric adds up, markup is safe`, () => {
    const book = JSON.parse(fs.readFileSync(path.join(root, "answers", `${code}.json`), "utf8")) as AnswerBook;
    const ids = new Set(pyq(code).units.flatMap((u) => u.pyqs.map((p) => p.id)));
    for (const [id, a] of Object.entries(book)) {
      expect(ids.has(id), `${code} ${id} is not a PYQ`).toBe(true);
      expect(a.rubric.length).toBeGreaterThanOrEqual(2);
      expect(a.rubric.reduce((s, r) => s + r.marks, 0), `${code} ${id} rubric must add up to marks`).toBeCloseTo(a.marks, 5);
      expect(a.answer.length).toBeGreaterThanOrEqual(2);
      for (const x of [...a.answer, ...a.rubric.map((r) => r.point), ...(a.formulas ?? []), a.diagram ?? "", a.result ?? ""]) expect(TAG.test(x), `${code} ${id}: ${x.slice(0, 60)}`).toBe(false);
    }
  });
});

describe("PYQ translations", () => {
  for (const code of CORE) for (const lang of ["hi", "hl"]) it(`${code}.${lang} matches the English bank`, () => {
    const f = path.join(root, "pyq", "i18n", `${code}.${lang}.json`);
    if (!fs.existsSync(f)) return;
    const tr = JSON.parse(fs.readFileSync(f, "utf8")) as { units?: Record<string, string>; q: Record<string, { title: string; parts: string[] }> };
    const en = new Map(pyq(code).units.flatMap((u) => u.pyqs.map((p) => [p.id, p] as const)));
    for (const [id, t] of Object.entries(tr.q)) {
      const e = en.get(id);
      expect(e, `${code}.${lang} ${id} unknown`).toBeTruthy();
      expect(t.parts.length, `${code}.${lang} ${id} parts`).toBe(e!.parts.length);
      for (const x of [t.title, ...t.parts]) expect(TAG.test(x)).toBe(false);
    }
  });
});
