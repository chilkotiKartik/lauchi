import { describe, expect, it } from "vitest";
import { buildMessage, isGone, prefsSchema, subscribeSchema, toHHMM, urlBase64ToUint8Array } from "./push";

const keys = { p256dh: "B".repeat(87), auth: "a".repeat(22) };

describe("push helpers", () => {
  it("validates preferences", () => {
    expect(prefsSchema.safeParse({ streak: true, exam: false, studyTime: "07:05" }).success).toBe(true);
    expect(prefsSchema.safeParse({ streak: true, exam: false, studyTime: null }).success).toBe(true);
    for (const t of ["7:05", "24:00", "12:60", "noon", ""]) expect(prefsSchema.safeParse({ streak: true, exam: true, studyTime: t }).success).toBe(false);
  });
  it("accepts only https endpoints with keys, and fills default prefs", () => {
    const ok = subscribeSchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys });
    expect(ok.success && ok.data.prefs).toEqual({ streak: true, exam: true, studyTime: null });
    expect(subscribeSchema.safeParse({ endpoint: "http://x.test/abc", keys }).success).toBe(false);
    expect(subscribeSchema.safeParse({ endpoint: "https://x.test/abc", keys: { p256dh: "x", auth: "y" } }).success).toBe(false);
    expect(subscribeSchema.safeParse({}).success).toBe(false);
  });
  it("writes the right messages", () => {
    expect(buildMessage({ kind: "streak", streak: 5 }).title).toBe("Your 5-day streak ends tonight");
    expect(buildMessage({ kind: "exam", days_left: 1 }).title).toMatch(/tomorrow/i);
    expect(buildMessage({ kind: "exam", days_left: 7 }).title).toBe("7 days to your exam");
    expect(buildMessage({ kind: "study" }).url).toBe("/home");
    const d = buildMessage({ kind: "daily", streak: 4 });
    expect(d.url).toBe("/daily");
    expect(d.tag).toBe("daily");
    expect(d.body).toContain("4-day streak");
    expect(buildMessage({ kind: "daily", streak: null }).body).not.toContain("streak");
    expect(buildMessage({ kind: "exam", days_left: 7 }).url.startsWith("/")).toBe(true);
  });
  it("converts the VAPID key and times", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3]);
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255]);
    expect(toHHMM("18:30:00")).toBe("18:30");
    expect(toHHMM(null)).toBeNull();
  });
  it("knows when a subscription is gone", () => {
    expect(isGone(410)).toBe(true);
    expect(isGone(404)).toBe(true);
    expect(isGone(500)).toBe(false);
    expect(isGone(undefined)).toBe(false);
  });
});
