import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET, cleanCode, colorVar, dayComplete, formatCode, goalPercent, groupSchema, groupStreak, initial, nudgeLine, recentDays, toDays, todayOf, indiaToday,
} from "./social";

describe("invite codes", () => {
  it("accepts what people paste and returns the bare code", () => {
    expect(cleanCode("ABCD2345")).toBe("ABCD2345");
    expect(cleanCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(cleanCode("abcd 2345")).toBe("ABCD2345");
    expect(cleanCode("https://lockin.app/join/ABCD-2345")).toBe("ABCD2345");
    expect(cleanCode("https://lockin.app/friends?add=abcd2345&x=1")).toBe("ABCD2345");
  });
  it("rejects anything that cannot be a code", () => {
    expect(cleanCode("")).toBeNull();
    expect(cleanCode(null)).toBeNull();
    expect(cleanCode("ABC")).toBeNull();
    expect(cleanCode("ABCD23456")).toBeNull();
    expect(cleanCode("ABCD0123")).toBeNull(); // 0 and 1 are never used
    expect(cleanCode("ABCDIOL2")).toBeNull(); // I, O and L are never used
    expect(cleanCode("<script>")).toBeNull();
  });
  it("the alphabet has no look-alike characters", () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    for (const c of "IOL01") expect(CODE_ALPHABET).not.toContain(c);
    expect(cleanCode(CODE_ALPHABET.slice(0, 8))).toBe(CODE_ALPHABET.slice(0, 8));
  });
  it("formats codes in two halves", () => {
    expect(formatCode("ABCD2345")).toBe("ABCD-2345");
    expect(formatCode("ABC")).toBe("ABC");
  });
});

describe("group streak", () => {
  const d = (day: string, needed: number, done: number) => ({ day, needed, done });
  it("a day counts only when every member studied", () => {
    expect(dayComplete(d("2026-10-01", 3, 3))).toBe(true);
    expect(dayComplete(d("2026-10-01", 3, 2))).toBe(false);
    expect(dayComplete(d("2026-10-01", 0, 0))).toBe(false);
    expect(dayComplete(undefined)).toBe(false);
  });
  it("counts consecutive complete days ending today", () => {
    const days = [d("2026-09-28", 2, 1), d("2026-09-29", 2, 2), d("2026-09-30", 2, 2), d("2026-10-01", 2, 2)];
    expect(groupStreak(days, "2026-10-01")).toBe(3);
  });
  it("today still in progress does not break the streak", () => {
    const days = [d("2026-09-29", 2, 2), d("2026-09-30", 2, 2), d("2026-10-01", 2, 1)];
    expect(groupStreak(days, "2026-10-01")).toBe(2);
  });
  it("a missed day breaks it", () => {
    const days = [d("2026-09-28", 2, 2), d("2026-09-29", 2, 1), d("2026-09-30", 2, 2), d("2026-10-01", 2, 0)];
    expect(groupStreak(days, "2026-10-01")).toBe(1);
    expect(groupStreak([d("2026-09-29", 2, 2)], "2026-10-01")).toBe(0);
    expect(groupStreak([], "2026-10-01")).toBe(0);
  });
  it("crosses month and year boundaries", () => {
    const days = [d("2025-12-31", 1, 1), d("2026-01-01", 1, 1)];
    expect(groupStreak(days, "2026-01-01")).toBe(2);
    expect(groupStreak([d("2026-02-28", 1, 1), d("2026-03-01", 1, 1)], "2026-03-01")).toBe(2);
  });
  it("today's row and the week strip", () => {
    const days = [d("2026-09-30", 2, 2), d("2026-10-01", 2, 1)];
    expect(todayOf(days, "2026-10-01")).toEqual(d("2026-10-01", 2, 1));
    expect(todayOf(days, "2026-10-02")).toEqual(d("2026-10-02", 0, 0));
    const strip = recentDays(days, "2026-10-01", 7);
    expect(strip).toHaveLength(7);
    expect(strip[0].day).toBe("2026-09-25");
    expect(strip.at(-1)).toEqual({ day: "2026-10-01", complete: false });
    expect(strip.at(-2)).toEqual({ day: "2026-09-30", complete: true });
  });
  it("normalises RPC rows", () => {
    expect(toDays([{ day: "2026-10-01", needed: "2", done: 1 }, { day: "bad" }, null, "x"])).toEqual([d("2026-10-01", 2, 1)]);
    expect(toDays(null)).toEqual([]);
  });
});

describe("small helpers", () => {
  it("validates groups", () => {
    expect(groupSchema.safeParse({ name: " Hostel 4 ", emoji: "🔥", color: "orange" }).data?.name).toBe("Hostel 4");
    expect(groupSchema.safeParse({ name: "x".repeat(41), emoji: "🔥", color: "orange" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "  ", emoji: "🔥", color: "orange" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "ok", emoji: "💩", color: "orange" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "ok", emoji: "🔥", color: "pink" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "<b>", emoji: "🔥", color: "red" }).success).toBe(false);
  });
  it("nudge lines", () => {
    expect(nudgeLine([])).toBe("");
    expect(nudgeLine(["Aman"])).toBe("Aman nudged you");
    expect(nudgeLine(["Aman", "Riya", "Aman"])).toBe("Aman and Riya nudged you");
    expect(nudgeLine(["Aman", "Riya", "Sid"])).toBe("Aman, Riya and 1 other nudged you");
    expect(nudgeLine(["Aman", "Riya", "Sid", "Jo"])).toBe("Aman, Riya and 2 others nudged you");
  });
  it("initials, colours, goals and India's date", () => {
    expect(initial("aman")).toBe("A");
    expect(initial("")).toBe("?");
    expect(colorVar("blue")).toBe("var(--blue)");
    expect(colorVar("nope")).toBe("var(--green)");
    expect(goalPercent(250, 500)).toBe(50);
    expect(goalPercent(900, 500)).toBe(100);
    expect(goalPercent(10, 0)).toBe(0);
    expect(indiaToday(new Date("2026-09-30T19:00:00Z"))).toBe("2026-10-01"); // 00:30 IST
    expect(indiaToday(new Date("2026-09-30T18:00:00Z"))).toBe("2026-09-30");
  });
});
