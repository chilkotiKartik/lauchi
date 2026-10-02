(globalThis as { __GEN_VERIFY__?: boolean }).__GEN_VERIFY__ = true;
import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import { checkCourse } from "./bank-check";
import { courseUnits, hasBank } from "./quiz-core";

const BCA2: Record<string, number> = { "BCA-004": 6, "BCA-005": 5, "BCA-010": 5, "BCA-011": 4 };
describe("BCA question banks (IT fundamentals, personality, EVS, bridge maths)", () => {
  it("cover every unit with at least 8 templates", () => {
    for (const [code, n] of Object.entries(BCA2)) {
      expect(courseUnits(code), code).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      for (let u = 1; u <= n; u++) { expect(hasBank(code, u)).toBe(true); expect(GEN[code][u].length, `${code} u${u}`).toBeGreaterThanOrEqual(8); }
    }
  });
  for (const code of Object.keys(BCA2)) it(`${code}: templates are well-formed`, { timeout: 120_000 }, () => { expect(checkCourse(code, 200, false, true)).toBeGreaterThan(300); });
});
