import { describe, expect, it } from "vitest";
import { emailSchema, nameSchema, onboardingSchema } from "./schemas";
import { safeNext } from "./safe-path";

const good = { name: "Kalu", branch: "CSE", year: 1, semester: 1, dailyGoalXp: 50, timezone: "Asia/Calcutta", consent: true };

describe("onboarding validation", () => {
  it("accepts a valid submission", () => expect(onboardingSchema.safeParse(good).success).toBe(true));
  it.each([
    ["no consent", { ...good, consent: false }],
    ["year 2", { ...good, year: 2 }],
    ["semester 3", { ...good, semester: 3 }],
    ["unknown branch", { ...good, branch: "XYZ" }],
    ["odd goal", { ...good, dailyGoalXp: 99999 }],
    ["bad timezone", { ...good, timezone: "Mars/Base" }],
    ["empty name", { ...good, name: "   " }],
    ["html in name", { ...good, name: "<script>" }],
    ["long name", { ...good, name: "x".repeat(61) }],
  ])("rejects %s", (_l, v) => expect(onboardingSchema.safeParse(v).success).toBe(false));
  it.each(["CSE", "AIML", "BCA"])("accepts branch %s", (b) => expect(onboardingSchema.safeParse({ ...good, branch: b }).success).toBe(true));
  it("stores the canonical name for legacy timezone aliases", () => expect(onboardingSchema.parse({ ...good, timezone: "Asia/Calcutta" }).timezone).toBe("Asia/Kolkata"));
  it("trims names", () => expect(nameSchema.parse("  Kalu  ")).toBe("Kalu"));
  it("normalises email", () => expect(emailSchema.parse(" A@B.CO ")).toBe("a@b.co"));
  it("rejects a bad email", () => expect(emailSchema.safeParse("nope").success).toBe(false));
});

describe("redirect safety", () => {
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined])("blocks %s", (v) =>
    expect(safeNext(v as string | null)).toBe("/home"));
  it("allows same-site paths", () => expect(safeNext("/learn/AHT-001?x=1")).toBe("/learn/AHT-001?x=1"));
});
