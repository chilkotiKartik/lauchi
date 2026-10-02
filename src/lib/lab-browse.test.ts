import { describe, expect, it } from "vitest";
import { filterLabs, labMatchesTopic, parseSel, selToQuery, subjectCounts, topicMatches, unitCounts, videoQuery, type BrowseCourse, type BrowseLab } from "./lab-browse";

const lab = (id: string, title: string, where: [string, number][], topics: string[]): BrowseLab => ({ id, title, blurb: `${title} blurb`, where, topics, animated: false, guided: false });
const LABS = [
  lab("a", "Gauss law sphere", [["P", 1]], ["Gauss's law", "Electric flux"]),
  lab("b", "Thevenin", [["E", 2]], ["Thevenin theorem"]),
  lab("c", "Norton", [["E", 2], ["P", 3]], ["Norton equivalent circuits"]),
  lab("d", "Bode plot", [["E", 4]], ["Frequency response"]),
];
const COURSES: BrowseCourse[] = [
  { code: "E", name: "Electrical", short: "Elec", units: [{ n: 1, title: "DC", topics: ["Ohm"] }, { n: 2, title: "Network theorems", topics: ["Thevenin's theorem", "Superposition"] }] },
  { code: "P", name: "Physics", short: "Phy", units: [{ n: 1, title: "Fields", topics: ["Gauss law"] }] },
];

describe("topicMatches", () => {
  it("matches substrings either way, case-insensitively", () => {
    expect(topicMatches("Thevenin theorem", "thevenin")).toBe(true);
    expect(topicMatches("Gauss", "Gauss's law and flux")).toBe(true);
    expect(topicMatches("Electric flux", "Flux")).toBe(true);
  });
  it("uses word overlap and rejects unrelated text", () => {
    expect(topicMatches("Norton equivalent circuits", "Equivalent circuit of Norton")).toBe(true);
    expect(topicMatches("Frequency response", "Superposition")).toBe(false);
    expect(topicMatches("", "x")).toBe(false);
  });
});

describe("grouping", () => {
  it("counts subjects and units", () => {
    expect(subjectCounts(LABS, ["E", "P", "Z"])).toEqual([{ course: "E", count: 3 }, { course: "P", count: 2 }]);
    expect(unitCounts(LABS, "E", COURSES[0].units)).toEqual([{ n: 1, count: 0 }, { n: 2, count: 2 }]);
  });
});

describe("filterLabs", () => {
  it("narrows by subject, unit and topic, falling back to the unit", () => {
    expect(filterLabs(LABS, { course: "E", unit: null, topic: null }, null, "").labs.map((l) => l.id)).toEqual(["c", "b", "d"]);
    const t = filterLabs(LABS, { course: "E", unit: 2, topic: 1 }, "Thevenin's theorem", "");
    expect(t.labs.map((l) => l.id)).toEqual(["b"]);
    expect(t.fallback).toBe(false);
    const f = filterLabs(LABS, { course: "E", unit: 2, topic: 2 }, "Superposition", "");
    expect(f.labs.map((l) => l.id)).toEqual(["c", "b"]);
    expect(f.fallback).toBe(true);
  });
  it("searches titles and keeps everything with no selection", () => {
    expect(filterLabs(LABS, { course: null, unit: null, topic: null }, null, "").labs).toHaveLength(4);
    expect(filterLabs(LABS, { course: null, unit: null, topic: null }, null, " NORTON ").labs.map((l) => l.id)).toEqual(["c"]);
  });
  it("labMatchesTopic checks the title too", () => {
    expect(labMatchesTopic(LABS[3], "Bode plot")).toBe(true);
  });
});

describe("url state", () => {
  it("validates params", () => {
    expect(parseSel({ course: "nope" }, COURSES)).toEqual({ course: null, unit: null, topic: null });
    expect(parseSel({ course: "E", unit: "9" }, COURSES)).toEqual({ course: "E", unit: null, topic: null });
    expect(parseSel({ course: "E", unit: "2", topic: "2" }, COURSES)).toEqual({ course: "E", unit: 2, topic: 2 });
    expect(parseSel({ course: "E", unit: "2", topic: "7" }, COURSES).topic).toBeNull();
    expect(parseSel({ course: "E", topic: "1" }, COURSES).topic).toBeNull();
  });
  it("round-trips to a query string", () => {
    expect(selToQuery({ course: "E", unit: 2, topic: 1 })).toBe("course=E&unit=2&topic=1");
    expect(selToQuery({ course: null, unit: 2, topic: 1 })).toBe("");
  });
  it("builds the same video phrase as /videos", () => {
    expect(videoQuery("Electrical", "DC", null)).toBe("DC Electrical lecture");
    expect(videoQuery("Electrical", "DC", "Ohm")).toBe("Ohm Electrical");
  });
});
