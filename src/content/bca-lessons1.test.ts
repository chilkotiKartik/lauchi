import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Lesson } from "./lessons/types";
import { LABS } from "../labs/registry";
import { L_BCA001 } from "./lessons/bca-001";

const root = path.join(__dirname);
const syl = (code: string) => JSON.parse(fs.readFileSync(path.join(root, "syllabus", `${code}.json`), "utf8")) as { units: { topics: string[] }[] };
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
  for (const c of l.check) { expect(c.a).toBeGreaterThanOrEqual(0); expect(c.a).toBeLessThan(c.o.length); expect(new Set(c.o).size, `${key}: duplicate options in ${c.q.slice(0, 50)}`).toBe(c.o.length); }
  if (l.lab) expect(labIds.has(l.lab.id), `${key} links unknown lab ${l.lab.id}`).toBe(true);
  const all = [l.intro, ...l.sections.flatMap((s) => [s.h, ...s.p, ...(s.formula ?? [])]), ...l.examples.flatMap((e) => [e.q, ...e.steps, e.ans]), ...l.mistakes, ...l.check.flatMap((c) => [c.q, ...c.o, c.why])];
  for (const x of all) {
    expect(TAG.test(x), `${key}: only <sub><sup><b><i> allowed: ${x.slice(0, 80)}`).toBe(false);
    // extra: any &name; must be an entity the renderer decodes (otherwise it would be shown literally)
    for (const m of x.matchAll(/&([a-z#0-9]+);/gi)) expect(/^(?:lt|gt|amp|quot|apos|nbsp|minus|times|le|ge|ne|deg|#\d+|#x[0-9a-f]+)$/i.test(m[1]), `${key}: unknown entity &${m[1]}; in ${x.slice(0, 60)}`).toBe(true);
  }
}

const BOOKS: Record<string, Record<string, Lesson>> = { "BCA-001": L_BCA001 };

describe("BCA lessons (batch 1: BCA-001..004)", () => {
  for (const [code, book] of Object.entries(BOOKS)) {
    it(`${code}: every lesson is well formed and keyed to a real topic`, () => {
      expect(Object.keys(book).length).toBeGreaterThan(0);
      for (const [k, l] of Object.entries(book)) { expect(k.startsWith(`${code}:`)).toBe(true); checkLesson(k, l); }
    });
  }
  it("keys are unique across the four courses", () => {
    const keys = Object.values(BOOKS).flatMap((b) => Object.keys(b));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
