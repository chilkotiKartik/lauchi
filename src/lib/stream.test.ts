import { describe, expect, it } from "vitest";
import { canSeeCourse, canSeeLab, streamOf, visibleCourses, visibleLabs } from "@/lib/stream";

const courses = [
  { code: "AHT-001", type: "theory" }, { code: "CST-001", type: "theory" }, { code: "BTT-001", type: "bridge" },
  { code: "AHT-000", type: "bridge" }, { code: "WD-101", type: "minor" }, { code: "BCA-001", type: "theory" }, { code: "BCA-011", type: "bridge" },
];

describe("stream", () => {
  it("maps branches to streams", () => {
    expect(streamOf("BCA")).toBe("bca");
    for (const b of ["CSE", "CSE-DS", "AIML", "ECE", "EE", "ME", "CE", null]) expect(streamOf(b)).toBe("btech");
  });
  it("BCA sees only BCA-* courses (bridge included)", () => {
    expect(visibleCourses("BCA", courses).map((c) => c.code)).toEqual(["BCA-001", "BCA-011"]);
  });
  it("CSE sees WD and first-year subjects but not BCA or bridge", () => {
    expect(canSeeCourse("CSE", "WD-101")).toBe(true);
    expect(canSeeCourse("AIML", "WD-201")).toBe(true);
    expect(canSeeCourse("CSE", "AHT-001")).toBe(true);
    expect(canSeeCourse("CSE", "BCA-001")).toBe(false);
    expect(visibleCourses("CSE", courses).map((c) => c.code)).toEqual(["AHT-001", "CST-001", "WD-101"]);
  });
  it("ME does not see WD; bridge hidden for btech", () => {
    expect(canSeeCourse("ME", "WD-101")).toBe(false);
    expect(canSeeCourse("ME", "AHT-001")).toBe(true);
    expect(canSeeCourse("ECE", "BTT-001")).toBe(false);
    expect(canSeeCourse("ECE", "AHT-000")).toBe(false);
  });
  it("filters labs by where", () => {
    const labs = [{ where: [["AHP-001", 1]] as [string, number][] }, { where: [["BCA-001", 2]] as [string, number][] }, { where: [["WD-101", 1], ["AHP-001", 1]] as [string, number][] }];
    expect(visibleLabs("BCA", labs)).toHaveLength(1);
    expect(canSeeLab("BCA", labs[0])).toBe(false);
    expect(visibleLabs("CSE", labs)).toHaveLength(2);
    expect(visibleLabs("ME", labs)).toHaveLength(2);
    expect(canSeeLab("ME", { where: [["WD-101", 1]] })).toBe(false);
  });
});
