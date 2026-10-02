// The PYQ-style templates (content/src/gen_f.js) self-verify some answers when this flag is set.
(globalThis as { __GEN_VERIFY__?: boolean }).__GEN_VERIFY__ = true;
import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import { checkCourse } from "./bank-check";

const CORE = ["AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001"];
describe("core subject banks with PYQ-style questions", () => {
  for (const code of CORE) {
    it(`${code}: 5 units, at least 12 templates each`, () => {
      expect(Object.keys(GEN[code]).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
      for (const u of [1, 2, 3, 4, 5]) expect(GEN[code][u].length, `${code} u${u}`).toBeGreaterThanOrEqual(12);
    });
    it(`${code}: every template is well-formed across 300 seeds`, { timeout: 180_000 }, () => { expect(checkCourse(code, 300)).toBeGreaterThan(15000); });
  }
});
