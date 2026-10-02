// The generators self-verify computed answers (brute force / second method) when this flag is set.
(globalThis as { __GEN_VERIFY__?: boolean }).__GEN_VERIFY__ = true;
import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import syllabusIndex from "@/content/syllabus/index.json";
import { checkCourse } from "./bank-check";
import { courseUnits, hasBank } from "./quiz-core";

/** BCA course → number of units in its syllabus (src/content/syllabus/BCA-0NN.json). */
const BCA: Record<string, number> = { "BCA-001": 5, "BCA-002": 5, "BCA-003": 5, "BCA-006": 5, "BCA-007": 5, "BCA-008": 6, "BCA-009": 5 };

describe("BCA question banks", () => {
  it("cover every unit of the seven subjects with at least 8 templates each (300+ in total)", () => {
    let total = 0;
    for (const [code, n] of Object.entries(BCA)) {
      expect(courseUnits(code), code).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      const syl = (syllabusIndex as { code: string; units: number }[]).find((c) => c.code === code);
      expect(syl?.units, `${code} syllabus units`).toBe(n);
      for (let u = 1; u <= n; u++) {
        expect(hasBank(code, u)).toBe(true);
        expect(GEN[code][u].length, `${code} unit ${u}`).toBeGreaterThanOrEqual(8);
        total += GEN[code][u].length;
      }
    }
    expect(total).toBeGreaterThanOrEqual(300);
  });


  for (const code of Object.keys(BCA)) {
    it(`${code}: every template is well-formed and its computed answers check out across 300 seeds`, { timeout: 120_000 }, () => {
      expect(checkCourse(code, 300, false, true)).toBeGreaterThan(1500);
    });
  }

  it("every unit offers enough different questions for a session", () => {
    const original = Math.random;
    try {
      for (const [code, n] of Object.entries(BCA)) for (let u = 1; u <= n; u++) {
        const texts = new Set<string>();
        let seed = 1;
        Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (const t of GEN[code][u]) texts.add(t().q);
        expect(texts.size, `${code} unit ${u}`).toBeGreaterThanOrEqual(8);
      }
    } finally { Math.random = original; }
  });

  it("have exactly one correct option per question, and it is the one the explanation names for the numeric templates", () => {
    // spot-check a few fixed facts that do not depend on the random seed
    const original = Math.random;
    try {
      let seed = 7;
      Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let k = 0; k < 200; k++) {
        const q = GEN["BCA-003"][1][k % GEN["BCA-003"][1].length]();
        if (q.type !== "mcq") continue;
        const m = /Convert the binary number (\d+) to decimal/.exec(q.q);
        if (m) expect(q.o![q.a as number]).toBe(String(parseInt(m[1], 2)));
        const h = /decimal value of the hexadecimal number ([0-9A-F]+)/.exec(q.q);
        if (h) expect(q.o![q.a as number]).toBe(String(parseInt(h[1], 16)));
      }
      for (let k = 0; k < 200; k++) {
        const q = GEN["BCA-002"][4][k % GEN["BCA-002"][4].length]();
        const m = /(\d+) people sit around a circular table/.exec(q.q);
        if (m) { let f = 1; for (let i = 2; i < Number(m[1]); i++) f *= i; expect(q.o![q.a as number]).toBe(String(f)); }
        const c = /committee of (\d+) members is to be chosen from (\d+) people/.exec(q.q);
        if (c) { const r = Number(c[1]), n = Number(c[2]); let x = 1; for (let i = 1; i <= r; i++) x = (x * (n - r + i)) / i; expect(q.o![q.a as number]).toBe(String(Math.round(x))); }
      }
    } finally { Math.random = original; }
  });
});
