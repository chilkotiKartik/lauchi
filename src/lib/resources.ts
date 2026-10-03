// Admin-uploaded notes & resources: pure helpers (validation, file checks, grouping). No server-only imports so unit tests can use it.
import { z } from "zod";

export const BUCKET = "resources";
export const MAX_BYTES = 20 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 600;
export const NEW_DAYS = 7;

export const KINDS = ["notes", "assignment", "pyq-paper", "slides", "link", "other"] as const;
export type ResourceKind = (typeof KINDS)[number];
export const KIND_LABEL: Record<ResourceKind, string> = {
  notes: "Notes", assignment: "Assignment", "pyq-paper": "PYQ paper", slides: "Slides", link: "Link", other: "Other",
};
export const kindLabel = (k: string) => KIND_LABEL[k as ResourceKind] ?? "Other";

export type ResourceRow = {
  id: string; course: string; unit: number; topic: string | null; kind: string; title: string; description: string;
  file_path: string | null; file_name: string | null; size_bytes: number | null; mime: string | null; external_url: string | null;
  hidden?: boolean; created_at: string;
  /** false (the default): students can only read it inside the app; no download, no storage link */
  allow_download?: boolean;
};
export const RESOURCE_COLS = "id,course,unit,topic,kind,title,description,file_path,file_name,size_bytes,mime,external_url,hidden,created_at,allow_download";

/* ------------------------------------------------------------------ validation */

const COURSE = /^[A-Z]{2,3}-[0-9]{3}$/;
const noControl = (s: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const text = (max: number, label: string) => z.string().trim().max(max, `${label} is too long (max ${max} characters)`).refine(noControl, `${label} has characters we can't accept`);

/** Only http(s) links are accepted; anything else (javascript:, data:, file:) is refused. */
export function parseHttpUrl(input: string): string | null {
  const s = input.trim();
  if (!s || s.length > 500) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch { return null; }
}

export const uploadSchema = z.object({
  course: z.string().regex(COURSE, "Pick a subject"),
  unit: z.coerce.number({ error: "Pick a unit" }).int("Pick a unit").min(1, "Pick a unit").max(12, "Pick a unit"),
  topic: z.string().trim().regex(/^([0-9]{1,3})?$/, "Pick a topic").transform((t) => (t === "" ? null : t)),
  kind: z.enum(KINDS, { error: "Pick what kind of file this is" }),
  title: text(140, "Title").pipe(z.string().min(1, "Give it a title")),
  description: text(500, "Description"),
  url: z.string().trim().transform((v, ctx) => {
    if (v === "") return null;
    const u = parseHttpUrl(v);
    if (!u) { ctx.addIssue({ code: "custom", message: "That doesn't look like a web link (https://…)" }); return z.NEVER; }
    return u;
  }),
});
export type UploadInput = z.infer<typeof uploadSchema>;

export const idSchema = z.string().uuid();

/* ------------------------------------------------------------------ files */

export type Sniffed = { mime: "application/pdf" | "image/png" | "image/jpeg"; ext: "pdf" | "png" | "jpg" };

/** Decides the real type from the first bytes. The browser-sent type and the file extension are never trusted. */
export function sniff(bytes: Uint8Array): Sniffed | null {
  const at = (i: number) => bytes[i];
  if (bytes.length >= 5 && at(0) === 0x25 && at(1) === 0x50 && at(2) === 0x44 && at(3) === 0x46 && at(4) === 0x2d) return { mime: "application/pdf", ext: "pdf" };
  if (bytes.length >= 8 && at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 && at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a) return { mime: "image/png", ext: "png" };
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  return null;
}

export type FileCheck = { ok: true; type: Sniffed } | { ok: false; message: string };
export function checkFile(bytes: Uint8Array): FileCheck {
  if (bytes.length === 0) return { ok: false, message: "That file is empty." };
  if (bytes.length > MAX_BYTES) return { ok: false, message: "That file is bigger than 20 MB. Try compressing it." };
  const type = sniff(bytes);
  if (!type) return { ok: false, message: "Only PDF, PNG and JPG files are accepted." };
  return { ok: true, type };
}

/** A file name safe to keep in storage paths and Content-Disposition: letters, digits, dot, dash, underscore; forced extension. */
export function safeFileName(name: string, ext: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const stem = base.replace(/\.[A-Za-z0-9]{1,5}$/, "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 80);
  return `${stem || "file"}.${ext}`;
}

/** course/unit/<id>-<name>: the id keeps two uploads of the same name apart. */
export const storagePath = (course: string, unit: number, id: string, fileName: string) => `${course}/${unit}/${id}-${fileName}`;

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/* ------------------------------------------------------------------ student side */

export type ResourceItem = ResourceRow & { fresh: boolean; seen: boolean };

export const isFresh = (createdAt: string, now: number = Date.now()) => {
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && now - t >= 0 && now - t < NEW_DAYS * 86_400_000;
};

export function toItems(rows: ResourceRow[], seen: ReadonlySet<string>, now: number = Date.now()): ResourceItem[] {
  return rows.map((r) => ({ ...r, unit: Number(r.unit), size_bytes: r.size_bytes === null ? null : Number(r.size_bytes), fresh: isFresh(r.created_at, now), seen: seen.has(r.id) }));
}

export function filterItems(items: ResourceItem[], q: string, kind: ResourceKind | "all", openOnly = false): ResourceItem[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    if (openOnly && r.seen) return false;
    if (!words.length) return true;
    const hay = `${r.title} ${r.description} ${r.course} ${kindLabel(r.kind)} ${r.file_name ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export type UnitGroup = { unit: number; items: ResourceItem[] };
export type CourseGroup = { course: string; units: UnitGroup[]; count: number };

/** Groups by subject (in the given order, unknown subjects dropped), then unit ascending; newest first inside a unit. */
export function groupItems(items: ResourceItem[], courseOrder: readonly string[]): CourseGroup[] {
  const out: CourseGroup[] = [];
  for (const course of courseOrder) {
    const mine = items.filter((r) => r.course === course);
    if (!mine.length) continue;
    const units = [...new Set(mine.map((r) => r.unit))].sort((a, b) => a - b).map((unit) => ({
      unit,
      items: mine.filter((r) => r.unit === unit).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }));
    out.push({ course, units, count: mine.length });
  }
  return out;
}

/** True when the file can be shown inside the page (PDF or image). Links and other files open in a new tab. */
export const canPreview = (r: Pick<ResourceRow, "file_path" | "mime">) => Boolean(r.file_path) && (r.mime === "application/pdf" || r.mime === "image/png" || r.mime === "image/jpeg");
