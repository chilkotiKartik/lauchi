import { describe, expect, it } from "vitest";
import { chestReady, nextMilestone, starsFor, streakMood, subjectProgress, unitState } from "./subject-progress";

const course = { code: "AHT-001", name: "Engineering Physics", short: "Physics", credits: 4, units: [
  { n: 1, title: "Wave optics", topics: ["a", "b", "c", "d"] },
  { n: 2, title: "Fibres", topics: ["a", "b"] },
] };

describe("subject progress", () => {
  it("counts topics read and colours units by quiz accuracy", () => {
    const done = new Set(["AHT-001:1:1", "AHT-001:1:2", "AHT-001:2:1", "EET-001:1:1"]);
    const p = subjectProgress(course, done, [{ course: "AHT-001", unit: 1, pct: 50, attempts: 2 }], 3);
    expect(p.pct).toBe(50); // 3 of 6 topics
    expect(p.units.map((u) => [u.topicsDone, u.state, u.stars])).toEqual([[2, "weak", 0], [1, "started", 0]]);
    expect(p.labs).toBe(3);
  });
  it("gives stars and states at the quiz thresholds", () => {
    expect([null, 59, 60, 75, 90].map(starsFor)).toEqual([0, 0, 1, 2, 3]);
    expect(unitState(0, null, 0)).toBe("new");
    expect(unitState(0, 80, 1)).toBe("strong");
    expect(unitState(3, 65, 1)).toBe("ok");
  });
  it("knows the next streak milestone and today's streak mood", () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(7)).toBe(14);
    expect(streakMood(10, 22)).toBe("done");
    expect(streakMood(0, 10)).toBe("todo");
    expect(streakMood(0, 21)).toBe("risk");
  });
  it("opens a unit chest at 60% practice accuracy", () => {
    expect(chestReady(null)).toBe(false);
    expect(chestReady(59)).toBe(false);
    expect(chestReady(60)).toBe(true);
  });
});
