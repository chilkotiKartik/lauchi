// Stream-based visibility: a student only sees the subjects and labs of their own stream.
// Pure (no server-only) so unit tests can import it.
export type Stream = "btech" | "bca";

const CSE_FAMILY = new Set(["CSE", "CSE-DS", "AIML"]);
const BTECH_HIDDEN = new Set(["BTT-001", "AHT-000"]);

export const streamOf = (branch: string | null | undefined): Stream => (branch === "BCA" ? "bca" : "btech");

export function canSeeCourse(branch: string | null | undefined, code: string, type?: string): boolean {
  if (streamOf(branch) === "bca") return code.startsWith("BCA-");
  if (code.startsWith("BCA-")) return false;
  if (BTECH_HIDDEN.has(code) || type === "bridge") return false;
  if (code.startsWith("WD-")) return !!branch && CSE_FAMILY.has(branch);
  return true;
}

export const visibleCourses = <T extends { code: string; type?: string }>(branch: string | null | undefined, courses: readonly T[]): T[] =>
  courses.filter((c) => canSeeCourse(branch, c.code, c.type));

export const canSeeLab = (branch: string | null | undefined, lab: { where: readonly (readonly [string, number])[] }): boolean =>
  lab.where.some(([c]) => canSeeCourse(branch, c));

export const visibleLabs = <T extends { where: readonly (readonly [string, number])[] }>(branch: string | null | undefined, labs: readonly T[]): T[] =>
  labs.filter((l) => canSeeLab(branch, l));
