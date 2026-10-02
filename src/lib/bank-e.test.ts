(globalThis as { __GEN_VERIFY__?: boolean }).__GEN_VERIFY__ = true;
import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import { checkCourse } from "./bank-check";

const WD: Record<string, number> = { "WD-101": 8, "WD-201": 10, "WD-301": 9, "WD-401": 8 };
describe("Web Development banks", () => {
  for (const [code, units] of Object.entries(WD)) {
    it(`${code} has a bank for each of its ${units} units`, () => {
      const have = Object.keys(GEN[code] ?? {}).map(Number).sort((a, b) => a - b);
      expect(have).toEqual(Array.from({ length: units }, (_, i) => i + 1));
      for (const u of have) expect(GEN[code][u].length, `${code} u${u}`).toBeGreaterThanOrEqual(6);
    });
    it(`${code}: every template is well-formed across 300 seeds`, { timeout: 120_000 }, () => { expect(checkCourse(code, 300, true)).toBeGreaterThan(1500); });
  }
});
