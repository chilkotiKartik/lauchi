import { describe, expect, it } from "vitest";
import { canPreview, checkFile, filterItems, formatSize, groupItems, isFresh, MAX_BYTES, parseHttpUrl, safeFileName, sniff, storagePath, toItems, uploadSchema, type ResourceRow } from "./resources";

const row = (o: Partial<ResourceRow>): ResourceRow => ({
  id: "1", course: "BAS-101", unit: 1, topic: null, kind: "notes", title: "T", description: "", file_path: null, file_name: null, size_bytes: null, mime: null,
  external_url: "https://example.com", created_at: "2026-01-01T00:00:00Z", ...o,
});
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe("sniff / checkFile", () => {
  it("recognises pdf, png and jpeg by magic bytes", () => {
    expect(sniff(pdf)?.mime).toBe("application/pdf");
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
  });
  it("rejects look-alikes, empty and oversize files", () => {
    expect(sniff(new TextEncoder().encode("<html>%PDF-"))).toBeNull();
    expect(checkFile(new Uint8Array())).toMatchObject({ ok: false });
    expect(checkFile(new Uint8Array(MAX_BYTES + 1))).toMatchObject({ ok: false });
    expect(checkFile(new TextEncoder().encode("MZ exe"))).toMatchObject({ ok: false });
    expect(checkFile(pdf)).toMatchObject({ ok: true });
  });
});

describe("safeFileName / storagePath", () => {
  it("strips paths, odd characters and forces the extension", () => {
    expect(safeFileName("../../etc/Unit 1 Notes (final).PDF", "pdf")).toBe("Unit-1-Notes-final.pdf");
    expect(safeFileName("C:\\x\\évil..name.exe", "pdf")).toBe("evil.name.pdf");
    expect(safeFileName("....", "png")).toBe("file.png");
    expect(safeFileName("a".repeat(300) + ".pdf", "pdf").length).toBeLessThanOrEqual(84);
  });
  it("builds a path under course/unit", () => {
    expect(storagePath("BAS-101", 2, "abc", "n.pdf")).toBe("BAS-101/2/abc-n.pdf");
  });
});

describe("parseHttpUrl", () => {
  it("accepts web links and refuses other schemes", () => {
    expect(parseHttpUrl("https://youtu.be/abc")).toContain("youtu.be");
    expect(parseHttpUrl("example.com/x")).toBe("https://example.com/x");
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,hi")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});

describe("uploadSchema", () => {
  const ok = { course: "BAS-101", unit: "2", topic: "", kind: "notes", title: " Unit 2 notes ", description: "", url: "" };
  it("parses a valid form", () => {
    expect(uploadSchema.parse(ok)).toMatchObject({ unit: 2, topic: null, title: "Unit 2 notes", url: null });
  });
  it("reports friendly errors", () => {
    const r = uploadSchema.safeParse({ ...ok, course: "x", kind: "zip", title: "", url: "ftp://a" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(["course", "kind", "title", "url"]);
  });
});

describe("student helpers", () => {
  const now = Date.parse("2026-03-10T00:00:00Z");
  it("marks items under 7 days old as new", () => {
    expect(isFresh("2026-03-05T00:00:00Z", now)).toBe(true);
    expect(isFresh("2026-03-02T00:00:00Z", now)).toBe(false);
    expect(isFresh("garbage", now)).toBe(false);
  });
  const items = toItems([
    row({ id: "a", title: "Waves notes", unit: 2, created_at: "2026-03-09T00:00:00Z" }),
    row({ id: "b", title: "Optics slides", kind: "slides", unit: 1, created_at: "2026-01-01T00:00:00Z" }),
    row({ id: "c", title: "Sets assignment", kind: "assignment", course: "BAS-103", unit: 1 }),
    row({ id: "d", title: "Newer waves", unit: 2, created_at: "2026-03-09T12:00:00Z" }),
  ], new Set(["b"]), now);
  it("groups by subject order, then unit, newest first", () => {
    const g = groupItems(items, ["BAS-103", "BAS-101", "ZZ-999"]);
    expect(g.map((x) => x.course)).toEqual(["BAS-103", "BAS-101"]);
    expect(g[1].units.map((u) => u.unit)).toEqual([1, 2]);
    expect(g[1].units[1].items.map((i) => i.id)).toEqual(["d", "a"]);
  });
  it("filters by text, kind and unseen", () => {
    expect(filterItems(items, "waves", "all").map((i) => i.id).sort()).toEqual(["a", "d"]);
    expect(filterItems(items, "", "slides").map((i) => i.id)).toEqual(["b"]);
    expect(filterItems(items, "", "all", true).some((i) => i.id === "b")).toBe(false);
    expect(filterItems(items, "optics bas", "all").map((i) => i.id)).toEqual(["b"]);
  });
  it("formats sizes and preview support", () => {
    expect(formatSize(500)).toBe("1 KB");
    expect(formatSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatSize(null)).toBe("");
    expect(canPreview({ file_path: "x", mime: "application/pdf" })).toBe(true);
    expect(canPreview({ file_path: null, mime: null })).toBe(false);
  });
});
