import { expect } from "vitest";
import { appendFileSync } from "node:fs";
import { GEN } from "@/content/gen.generated.cjs";
import { grade } from "./quiz-core";

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Text may only carry <sub>, <sup>, <b>, <i> as markup; a bare < or > (as in "x < 0") is shown as text by `Rich`, but a broken tag is not. */
export function markupProblem(s: string): string | null {
  const bare = s.replace(/<\/?(sub|sup|b|i)>/g, "").replace(/&lt;|&gt;/g, "");
  if (/<\/?[a-zA-Z]/.test(bare)) return "unsupported or broken tag";
  const open = (t: string) => (s.match(new RegExp(`<${t}>`, "g")) ?? []).length, close = (t: string) => (s.match(new RegExp(`</${t}>`, "g")) ?? []).length;
  for (const t of ["sub", "sup", "b", "i"]) if (open(t) !== close(t)) return `unbalanced <${t}>`;
  return null;
}

/** Runs every template of a course many times with different seeds. Any thrown self-check or malformed question fails the test. */
/** `allowFixed`: hand-written banks whose questions are fixed texts (only the option order varies) skip the "mostly varies" rule. */
export function checkCourse(course: string, seeds: number, allowUndefinedWord = false, allowFixed = false) {
  const units = Object.keys(GEN[course] ?? {}).map(Number).sort((a, b) => a - b);
  expect(units.length, `${course} has a bank`).toBeGreaterThan(0);
  let n = 0;
  const problems: string[] = [];
  const original = Math.random;
  try {
    for (const u of units) {
      const bank = GEN[course][u];
      let frozen = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bank.forEach((tpl: () => any, ti: number) => {
        const seen = new Set<string>();
        let failed = false;
        for (let s = 1; s <= seeds && !failed; s++) {
          try {
          Math.random = mulberry32(s * 2654435761 + ti * 97 + u);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any;
          try { q = tpl(); } catch (e) { throw new Error(`${course} unit ${u} template ${ti} seed ${s}: ${(e as Error).message}`); }
          const where = `${course} u${u} t${ti} s${s}: ${String(q.q).slice(0, 80)}`;
          expect(String(q.q).trim().length, where).toBeGreaterThan(8);
          expect(String(q.why).trim().length, where).toBeGreaterThan(8);
          // JS-teaching banks legitimately show "undefined" and "NaN" as answer options or in explanations
          const bad = allowUndefinedWord
            ? /\[object|Infinity/.test(q.q + q.why + (q.o ?? []).join(" "))
            : /undefined|NaN|\[object|Infinity/.test(q.q + q.why + (q.o ?? []).join(" "));
          expect(bad, where).toBe(false);
          if (process.env.BANK_DUMP && s <= 2) appendFileSync(process.env.BANK_DUMP, `\n[${course} u${u} t${ti}] ${q.q}\n${q.type === "nat" ? "  ANSWER: " + q.a : (q.o as string[]).map((x, i) => `  ${(q.type === "mcq" ? q.a === i : q.a.includes(i)) ? "*" : "-"} ${x}`).join("\n")}\n  WHY: ${q.why}\n`);
          for (const txt of [q.q, q.why, ...(q.o ?? [])]) expect(markupProblem(String(txt)), `${where} :: ${txt}`).toBeNull();
          if (q.type === "nat") {
            expect(Number.isFinite(q.a), where).toBe(true);
            expect(grade(q, String(q.a)), `${where} own answer fails grading`).toBe(true);
          } else {
            expect(q.o.length, where).toBeGreaterThanOrEqual(3);
            expect(new Set(q.o).size, `${where} duplicate options`).toBe(q.o.length);
            expect(q.o.every((x: string) => String(x).trim().length > 0), where).toBe(true);
            if (q.type === "mcq") { expect(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, where).toBe(true); }
            else { expect(Array.isArray(q.a) && q.a.length > 0 && q.a.length < q.o.length, where).toBe(true); }
          }
          seen.add(q.q);
          n++;
          } catch (e) { failed = true; problems.push(String((e as Error).message).split("\n").slice(0, 3).join(" | ").slice(0, 400)); }
        }
        if (seen.size === 1) frozen++;
      });
      // a few single-fact questions are fine (the engine never repeats one inside a session), but the bank must mostly vary
      if (!allowFixed && frozen > Math.max(2, Math.floor(bank.length / 2))) problems.push(`${course} unit ${u}: ${frozen} of ${bank.length} templates never vary`);
    }
  } finally { Math.random = original; }
  expect(problems, `${course}: ${problems.length} template problem(s)`).toEqual([]);
  return n;
}
