import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/lib/auth", () => ({ getSession: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => { throw new Error("no db in unit tests"); } }));
import {
  adminEmails, customPyqSchema, fieldErrors, isAdmin, normaliseAnalytics, parseYoutubeId, pickPinned, pinVideoSchema, reportSchema, requireAdmin, toPyq,
  type PinnedRow,
} from "./admin";

describe("admin roles", () => {
  it("parses ADMIN_EMAILS", () => {
    expect([...adminEmails(" A@x.com, b@Y.in ,,nonsense, ")]).toEqual(["a@x.com", "b@y.in"]);
    expect(adminEmails(undefined).size).toBe(0);
    expect(adminEmails("").size).toBe(0);
  });
  it("is never an admin when signed out, and requireAdmin 404s", async () => {
    expect(await isAdmin()).toBe(false);
    await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("YouTube ids", () => {
  it.each([
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  aaaaaaaaaa1 ", "aaaaaaaaaa1"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("%s", (input, id) => expect(parseYoutubeId(input)).toBe(id));
  it.each(["", "short", "https://evil.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=bad", "javascript:alert(1)", "dQw4w9WgXcQQ"])("rejects %s", (input) => {
    expect(parseYoutubeId(input)).toBeNull();
  });
});

describe("custom PYQs", () => {
  const ok = { course: "AHT-001", unit: "2", kind: "numerical", title: "Grating resolving power", parts: [{ text: "Find the resolving power.", marks: "5" }], marks: "", repeated: "3", year: "2023" };
  it("accepts a valid question and normalises blanks to null", () => {
    const r = customPyqSchema.parse(ok);
    expect(r).toMatchObject({ unit: 2, repeated: 3, marks: null, year: "2023", parts: [{ text: "Find the resolving power.", marks: "5" }] });
  });
  it("reports field errors by path", () => {
    const r = customPyqSchema.safeParse({ ...ok, course: "physics", title: "x", parts: [{ text: " ", marks: "" }], repeated: "-1" });
    expect(r.success).toBe(false);
    const e = fieldErrors(r.error!);
    expect(e.course).toBe("Pick a subject");
    expect(e.title).toMatch(/short title/);
    expect(e["parts.0.text"]).toBe("Write the question text");
    expect(e.repeated).toMatch(/negative/);
  });
  it("maps a row to the bank's Pyq shape with a C- id", () => {
    const p = toPyq({ id: "0b6c1d36-2f0a-4c55-9e0e-3c9a0e7f1a11", course: "AHT-001", unit: 2, kind: "theory", title: "T", parts: [{ text: "a", marks: "" }, { text: "b", marks: "2" }, { nope: 1 }], marks: null, repeated: 1, year: null });
    expect(p).toEqual({ id: "C-0b6c1d36-2f0a-4c55-9e0e-3c9a0e7f1a11", kind: "theory", title: "T", marks: null, repeated: 1, parts: [{ text: "a", marks: null }, { text: "b", marks: "2" }], unit: 2, year: null });
    expect(toPyq({ id: "x", course: "AHT-001", unit: 1, kind: "theory", title: "T", parts: "junk", marks: null, repeated: null, year: null }).parts).toEqual([]);
  });
});

describe("pinned videos", () => {
  const row = (o: Partial<PinnedRow>): PinnedRow => ({ id: "i", course: "AHT-001", unit: 1, topic: null, video_id: "aaaaaaaaaa1", title: "t", channel: "c", note: "", position: 0, created_at: "2026-01-01T00:00:00Z", ...o });
  it("orders by position and filters by topic", () => {
    const rows = [row({ video_id: "bbbbbbbbbb2", position: 2, topic: "3" }), row({ video_id: "aaaaaaaaaa1", position: 1 }), row({ video_id: "cccccccccc3", position: 0, topic: "4" })];
    expect(pickPinned(rows).map((v) => v.id)).toEqual(["cccccccccc3", "aaaaaaaaaa1", "bbbbbbbbbb2"]);
    expect(pickPinned(rows, 3).map((v) => v.id)).toEqual(["aaaaaaaaaa1", "bbbbbbbbbb2"]);
    expect(pickPinned(rows, "4")[0]).toEqual({ id: "cccccccccc3", title: "t", channel: "c", thumb: "https://i.ytimg.com/vi/cccccccccc3/mqdefault.jpg" });
  });
  it("validates the pin form", () => {
    const r = pinVideoSchema.safeParse({ course: "AHT-001", unit: "1", topic: "", video: "https://youtu.be/aaaaaaaaaa1", title: "Lecture", channel: "", note: "" });
    expect(r.success && r.data).toMatchObject({ video: "aaaaaaaaaa1", topic: null, unit: 1 });
    const bad = pinVideoSchema.safeParse({ course: "AHT-001", unit: "1", topic: "x", video: "https://vimeo.com/1", title: "", channel: "", note: "" });
    const e = fieldErrors(bad.error!);
    expect(Object.keys(e).sort()).toEqual(["title", "topic", "video"]);
  });
});

describe("reports", () => {
  it("validates the API body", () => {
    expect(reportSchema.safeParse({ where: "quiz", ref: "AHT-001:1:t3", course: "AHT-001", unit: 1, text: "Option B is wrong" }).success).toBe(true);
    expect(reportSchema.safeParse({ where: "pyq", ref: "Q1.2", text: "typo here", course: null, unit: null }).success).toBe(true);
    expect(reportSchema.safeParse({ where: "chat", ref: "x", text: "hello there" }).success).toBe(false);
    expect(reportSchema.safeParse({ where: "quiz", ref: "x".repeat(201), text: "hello there" }).success).toBe(false);
    expect(reportSchema.safeParse({ where: "quiz", ref: "x", text: "y".repeat(501) }).success).toBe(false);
    expect(reportSchema.safeParse({ where: "quiz", ref: "x", text: "ok" }).success).toBe(false);
  });
});

describe("analytics", () => {
  it("keeps only groups with at least 5 students, even if the database sent more", () => {
    const a = normaliseAnalytics({
      days: 7, since: "2026-09-25",
      units: [{ course: "AHT-001", unit: "2", students: "7", attempts: "40", correct: "10", accuracy: "25" }, { course: "AHT-002", unit: 1, students: 3, attempts: 9, correct: 9, accuracy: 100 }],
      daily: [{ day: "2026-09-30", students: 12 }, { day: "2026-10-01", students: 2 }, { day: "2026-10-02", students: null }],
      top_reported: [{ source: "quiz", ref: "r", course: null, unit: null, reports: "3", open: "1" }],
      totals: { students: 4, quizzes: 30 },
    });
    expect(a.units).toEqual([{ course: "AHT-001", unit: 2, students: 7, attempts: 40, correct: 10, accuracy: 25 }]);
    expect(a.daily.map((d) => d.students)).toEqual([12, null, null]);
    expect(a.totals).toEqual({ students: null, quizzes: null });
    expect(a.top_reported[0]).toMatchObject({ reports: 3, open: 1 });
    expect(normaliseAnalytics(null).units).toEqual([]);
  });
});
