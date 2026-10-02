import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/lib/auth", () => ({ getSession: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => { throw new Error("no db"); } }));
import { askSchema, answerSchema, canAnswerDoubts, libraryFor, overDailyLimit } from "@/lib/doubts";

const ok = { course: "EET-001", unit: "2", title: "Why KVL?", body: "Please explain Kirchhoff", makePublic: true };
describe("askSchema", () => {
  it("accepts a good doubt and turns an empty unit into null", () => {
    expect(askSchema.parse(ok).unit).toBe(2);
    expect(askSchema.parse({ ...ok, unit: "" }).unit).toBeNull();
  });
  it("enforces limits", () => {
    expect(askSchema.safeParse({ ...ok, title: "abc" }).success).toBe(false);
    expect(askSchema.safeParse({ ...ok, body: "short" }).success).toBe(false);
    expect(askSchema.safeParse({ ...ok, body: "x".repeat(2001) }).success).toBe(false);
    expect(askSchema.safeParse({ ...ok, course: "nope" }).success).toBe(false);
    expect(askSchema.safeParse({ ...ok, unit: "13" }).success).toBe(false);
    expect(answerSchema.safeParse(" ").success).toBe(false);
  });
});
describe("overDailyLimit", () => {
  const now = Date.parse("2026-10-02T12:00:00Z");
  it("counts only the last 24 hours", () => {
    const recent = Array.from({ length: 10 }, () => "2026-10-02T08:00:00Z");
    expect(overDailyLimit(recent, now)).toBe(true);
    expect(overDailyLimit(recent.slice(1), now)).toBe(false);
    expect(overDailyLimit(Array.from({ length: 10 }, () => "2026-10-01T08:00:00Z"), now)).toBe(false);
  });
});
describe("libraryFor", () => {
  const row = (course: string, extra: object = {}) => ({ id: "1", course, unit: 1, title: "t", body: "b", created_at: "x", user_id: "SECRET", answers: [{ id: "a", kind: "admin", body: "ans", helpful: 2, author_id: "SECRET" }], ...extra });
  it("filters by stream, drops unanswered rows and never passes through identity fields", () => {
    const r = libraryFor("CSE", [row("EET-001"), row("BCA-101"), row("EET-001", { answers: [] })]);
    expect(r).toHaveLength(1);
    expect(JSON.stringify(r)).not.toContain("SECRET");
    expect(libraryFor("BCA", [row("EET-001"), row("BCA-101")]).map((x) => x.course)).toEqual(["BCA-101"]);
    expect(libraryFor("CSE", null)).toEqual([]);
  });
});
describe("canAnswerDoubts", () => {
  it("is false when signed out", async () => { expect(await canAnswerDoubts()).toBe(false); });
});
