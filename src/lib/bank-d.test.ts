// The generators self-verify analytic answers (numeric derivative/integral etc.) when this flag is set.
(globalThis as { __GEN_VERIFY__?: boolean }).__GEN_VERIFY__ = true;
import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import { checkCourse } from "./bank-check";

describe("Basic Mathematics (AHT-000) bank", () => {
  it("has 5 units with at least 8 templates each", () => {
    expect(Object.keys(GEN["AHT-000"]).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
    for (const u of [1, 2, 3, 4, 5]) expect(GEN["AHT-000"][u].length).toBeGreaterThanOrEqual(8);
  });
  it("every template is well-formed and correct across 400 seeds", { timeout: 120_000 }, () => { expect(checkCourse("AHT-000", 400)).toBeGreaterThan(3000); });
});

describe("Biology for Engineers (BTT-001) bank", () => {
  it("has 5 units with at least 10 templates each", () => {
    expect(Object.keys(GEN["BTT-001"]).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
    for (const u of [1, 2, 3, 4, 5]) expect(GEN["BTT-001"][u].length).toBeGreaterThanOrEqual(10);
  });
  it("every template is well-formed across 400 seeds", { timeout: 120_000 }, () => { expect(checkCourse("BTT-001", 400)).toBeGreaterThan(3000); });
});
