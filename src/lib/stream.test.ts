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

describe("semester plan", () => {
  const see = (branch: string, semester: number) => (code: string) => canSeeCourse({ branch, semester }, code);
  it("CSE semester 1: Physics, Intro Maths, Electrical, PPS, EVS (and their labs)", () => {
    const s = see("CSE", 1);
    for (const c of ["AHT-001", "AHT-003", "EET-001", "CST-001", "AHT-004", "AHP-001", "EEP-001", "CSP-001"]) expect(s(c), c).toBe(true);
    for (const c of ["AHT-002", "AHT-005", "ECT-001", "MET-001", "AHP-002", "ECP-001", "MEP-001"]) expect(s(c), c).toBe(false);
  });
  it("semester 2 swaps CSE and AIML, with Analytical Mathematics", () => {
    const cse2 = see("CSE", 2), ai1 = see("AIML", 1), ai2 = see("AIML", 2);
    for (const c of ["AHT-002", "AHT-005", "ECT-001", "MET-001"]) { expect(cse2(c), c).toBe(true); expect(ai2(c), c).toBe(c === "AHT-005"); }
    for (const c of ["AHT-002", "AHT-003", "ECT-001", "MET-001"]) expect(ai1(c), c).toBe(true);
    for (const c of ["AHT-001", "EET-001", "CST-001", "AHT-004"]) { expect(ai2(c), c).toBe(true); expect(cse2(c), c).toBe(false); expect(ai1(c), c).toBe(false); }
  });
  it("BCA: five subjects in semester 1, the rest in semester 2", () => {
    const b1 = see("BCA", 1), b2 = see("BCA", 2);
    for (const c of ["BCA-001", "BCA-002", "BCA-011", "BCA-003", "BCA-004"]) { expect(b1(c), c).toBe(true); expect(b2(c), c).toBe(false); }
    for (const c of ["BCA-005", "BCA-006", "BCA-007", "BCA-008", "BCA-009", "BCA-010"]) { expect(b2(c), c).toBe(true); expect(b1(c), c).toBe(false); }
    expect(b1("AHT-001")).toBe(false); // never B.Tech subjects
  });
  it("subjects outside the plan (electives, the web minor) show in both semesters; a bare branch sees its whole year", () => {
    expect(see("CSE", 2)("AHP-006")).toBe(true);
    expect(see("CSE", 2)("WD-101")).toBe(true);
    expect(canSeeCourse("CSE", "AHT-002")).toBe(true);
  });
});
