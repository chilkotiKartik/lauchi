import { describe, expect, it } from "vitest";
import {
  cleanCode, compareWord, createClassSchema, emailSchema, joinSchema, normaliseCompare, normaliseOverview, normaliseRoster, sortRoster, type RosterRow,
} from "./classes";

const row = (name: string, o: Partial<RosterRow> = {}): RosterRow => ({
  user_id: name, name, joined_at: "", xp7: 0, xp30: 0, streak: 0, quizzes: 0, correct: 0, total: 0, accuracy: null, weakest: [], ...o,
});

describe("cleanCode", () => {
  it("is case-insensitive and ignores spaces and dashes", () => {
    expect(cleanCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(cleanCode("abcd 2345")).toBe("ABCD2345");
  });
  it("rejects look-alike letters, wrong length and junk", () => {
    expect(cleanCode("ABCD-234O")).toBeNull();
    expect(cleanCode("ABCD234")).toBeNull();
    expect(cleanCode("ABCD23456")).toBeNull();
    expect(cleanCode("")).toBeNull();
    expect(cleanCode("<script>alert(1)</script>")).toBeNull();
  });
});

describe("schemas", () => {
  it("validates a class", () => {
    expect(createClassSchema.parse({ name: "  CSE-A  ", course: "" })).toEqual({ name: "CSE-A", course: null });
    expect(createClassSchema.parse({ name: "CSE-A", course: "PH-101" }).course).toBe("PH-101");
    expect(createClassSchema.safeParse({ name: "", course: "" }).success).toBe(false);
    expect(createClassSchema.safeParse({ name: "x".repeat(61), course: "" }).success).toBe(false);
    expect(createClassSchema.safeParse({ name: "ok", course: "physics" }).success).toBe(false);
    expect(createClassSchema.safeParse({ name: "bad\u0000name", course: "" }).success).toBe(false);
  });
  it("validates join codes and emails", () => {
    expect(joinSchema.safeParse({ code: "abcd2345" }).success).toBe(true);
    expect(joinSchema.safeParse({ code: "  " }).success).toBe(false);
    expect(emailSchema.parse("  Teacher@Example.COM ")).toBe("teacher@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("sortRoster", () => {
  const rows = [row("Zed", { xp7: 5, accuracy: 50 }), row("Amy", { xp7: 30, accuracy: null }), row("Bob", { xp7: 30, accuracy: 90 })];
  it("sorts numbers descending with name as tie-break", () => {
    expect(sortRoster(rows, "xp7", "desc").map((r) => r.name)).toEqual(["Amy", "Bob", "Zed"]);
  });
  it("keeps students without accuracy last in both directions", () => {
    expect(sortRoster(rows, "accuracy", "desc").map((r) => r.name)).toEqual(["Bob", "Zed", "Amy"]);
    expect(sortRoster(rows, "accuracy", "asc").map((r) => r.name)).toEqual(["Zed", "Bob", "Amy"]);
  });
  it("sorts by name and does not mutate", () => {
    expect(sortRoster(rows, "name", "asc").map((r) => r.name)).toEqual(["Amy", "Bob", "Zed"]);
    expect(rows[0].name).toBe("Zed");
  });
});

describe("normalisers", () => {
  it("turns database JSON (strings, nulls) into numbers", () => {
    const r = normaliseRoster([{ user_id: "u", name: "  ", joined_at: "x", xp7: "12", xp30: 40, streak: 3, quizzes: "2", correct: 8, total: 10, accuracy: "80",
      weakest: [{ course: "PH-101", unit: 2, pct: "40", total: 10 }, { course: "A-1", unit: 1, pct: 1, total: 1 }, { course: "B", unit: 1, pct: 1, total: 1 }, { course: "C", unit: 1, pct: 1, total: 1 }] }]);
    expect(r[0]).toMatchObject({ name: "Student", xp7: 12, quizzes: 2, accuracy: 80 });
    expect(r[0].weakest).toHaveLength(3);
    expect(r[0].weakest[0].pct).toBe(40);
    expect(normaliseRoster(null)).toEqual([]);
  });
  it("handles an empty overview and compare list", () => {
    expect(normaliseOverview(null)).toEqual({ members: 0, active7: 0, avg_xp7: 0, quizzes7: 0, accuracy: null, weak: [] });
    expect(normaliseCompare([{ class_id: "c", members: "3", my_xp7: 10, avg_xp7: "7", my_accuracy: null, avg_accuracy: 60 }])[0]).toMatchObject({ members: 3, avg_xp7: 7, my_accuracy: null });
  });
  it("never carries student identity into a compare row", () => {
    const keys = Object.keys(normaliseCompare([{ class_id: "c", user_id: "other", name: "Other", members: 2, my_xp7: 1, avg_xp7: 1 }])[0]).sort();
    expect(keys).toEqual(["avg_accuracy", "avg_xp7", "class_id", "members", "my_accuracy", "my_xp7"]);
  });
});

describe("compareWord", () => {
  it("compares with a one-point dead zone", () => {
    expect(compareWord(80, 60)).toBe("above");
    expect(compareWord(40, 60)).toBe("below");
    expect(compareWord(60, 60.4)).toBe("level");
    expect(compareWord(null, 60)).toBe("none");
  });
});
