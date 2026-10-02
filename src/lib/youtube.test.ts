import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { cleanQuery, parseSearch } from "./youtube";

describe("youtube search parsing", () => {
  it("keeps only valid video ids and decodes titles", () => {
    const v = parseSearch({ items: [
      { id: { videoId: "dQw4w9WgXcQ" }, snippet: { title: "Newton&#39;s rings &amp; more", channelTitle: "Physics &quot;Wallah&quot;", publishedAt: "2024-05-01T00:00:00Z", liveBroadcastContent: "none" } },
      { id: { videoId: "bad id!" }, snippet: { title: "x" } },
      { id: { channelId: "UC123" }, snippet: { title: "a channel" } },
      { id: { videoId: "abcdefghijk" }, snippet: { title: "live", liveBroadcastContent: "live" } },
    ] });
    expect(v).toEqual([{ id: "dQw4w9WgXcQ", title: "Newton's rings & more", channel: 'Physics "Wallah"', published: "2024-05-01" }]);
  });
  it("survives junk", () => {
    expect(parseSearch(null)).toEqual([]);
    expect(parseSearch({ items: "no" })).toEqual([]);
  });
  it("cleans queries", () => {
    expect(cleanQuery("  V<sub>th</sub>  of <script>x</script>  ")).toBe("V th of x");
    expect(cleanQuery("a".repeat(300)).length).toBe(120);
  });
});

describe("searchVideos", () => {
  it("says so plainly when no key is configured", async () => {
    const { searchVideos } = await import("./youtube");
    delete process.env.YOUTUBE_API_KEY;
    const r = await searchVideos("newton's rings", "u1");
    expect(r).toMatchObject({ ok: false, code: "not_configured" });
  });
  it("caches results and limits fresh searches per student", async () => {
    vi.resetModules();
    process.env.YOUTUBE_API_KEY = "k";
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (u: string) => { calls.push(u); return new Response(JSON.stringify({ items: [{ id: { videoId: "dQw4w9WgXcQ" }, snippet: { title: "x", channelTitle: "c", liveBroadcastContent: "none" } }] }), { status: 200 }); });
    const { searchVideos, USER_DAILY_SEARCHES } = await import("./youtube");
    const a = await searchVideos("rings", "u1"), b = await searchVideos("Rings", "u2");
    expect(a.ok && b.ok && b.cached).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("safeSearch=strict");
    for (let i = 0; i < USER_DAILY_SEARCHES - 1; i++) await searchVideos(`topic ${i}`, "u1");
    expect(await searchVideos("one more", "u1")).toMatchObject({ ok: false, code: "limit" });
    vi.unstubAllGlobals();
    delete process.env.YOUTUBE_API_KEY;
  });
});
