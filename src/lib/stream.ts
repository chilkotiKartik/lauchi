// Stream-based visibility: a student only sees the subjects and labs of their own stream.
// Pure (no server-only) so unit tests can import it.
export type Stream = "btech" | "bca";

const CSE_FAMILY = new Set(["CSE", "CSE-DS", "AIML"]);
const BTECH_HIDDEN = new Set(["BTT-001", "AHT-000"]);

export const streamOf = (branch: string | null | undefined): Stream => (branch === "BCA" ? "bca" : "btech");

/** Who is looking: a branch key, or a profile (branch + semester) so subjects can be filtered by semester too. */
export type Viewer = string | null | undefined | { branch: string | null; semester?: number | null };
const who = (v: Viewer) => (v && typeof v === "object" ? { branch: v.branch, semester: v.semester ?? null } : { branch: v ?? null, semester: null });

/**
 * The subjects of each branch per semester (theory; each subject's lab follows it). CSE and AIML swap their sets
 * between semesters; maths is Introduction to Engineering Mathematics in semester 1 and Analytical Mathematics in
 * semester 2. BCA takes five subjects in semester 1 and the rest in semester 2.
 */
const CSE_SET = ["AHT-001", "EET-001", "CST-001", "AHT-004"];
const AIML_SET = ["AHT-002", "ECT-001", "MET-001"];
const BCA_SEM1 = ["BCA-001", "BCA-002", "BCA-011", "BCA-003", "BCA-004"];
const BCA_SEM2 = ["BCA-005", "BCA-006", "BCA-007", "BCA-008", "BCA-009", "BCA-010"];
export const SEMESTER_PLAN: Record<string, Record<1 | 2, string[]>> = {
  CSE: { 1: [...CSE_SET, "AHT-003"], 2: [...AIML_SET, "AHT-005"] },
  AIML: { 1: [...AIML_SET, "AHT-003"], 2: [...CSE_SET, "AHT-005"] },
  BCA: { 1: BCA_SEM1, 2: BCA_SEM2 },
};
/** Short subject names for the semester picker (kept here so the sign-up screen needs no syllabus files). */
const NAME: Record<string, string> = {
  "AHT-001": "Physics", "AHT-002": "Chemistry", "AHT-003": "Intro Maths", "AHT-004": "EVS", "AHT-005": "Analytical Maths",
  "CST-001": "PPS (C)", "EET-001": "Basic Electrical", "ECT-001": "Basic Electronics", "MET-001": "Basic Mechanical",
  "BCA-001": "C Programming", "BCA-002": "Basic Maths", "BCA-003": "Digital Electronics", "BCA-004": "IT Fundamentals", "BCA-005": "Personality Development",
  "BCA-006": "Data Structures", "BCA-007": "Computer Organization", "BCA-008": "Java", "BCA-009": "Software Engineering", "BCA-010": "EVS", "BCA-011": "Bridge Maths",
};
/** "Physics, Intro Maths, …" for a branch and semester, or "" when the branch has no plan. */
export const semesterSubjects = (branch: string, semester: 1 | 2) => (SEMESTER_PLAN[branch]?.[semester] ?? []).map((c) => NAME[c] ?? c).join(", ");

/** A practical's code → the theory subject it belongs to. */
const LAB_OF: Record<string, string> = { "AHP-001": "AHT-001", "AHP-002": "AHT-002", "CSP-001": "CST-001", "ECP-001": "ECT-001", "EEP-001": "EET-001", "MEP-001": "MET-001" };
const planned = (branch: string) => { const p = SEMESTER_PLAN[branch]; return p ? new Set([...p[1], ...p[2]]) : new Set<string>(); };

/** True when this subject is taught in the viewer's semester (subjects outside the plan, e.g. electives, always show). */
export function inSemester(branch: string | null, semester: number | null, code: string): boolean {
  if (!branch || (semester !== 1 && semester !== 2) || !SEMESTER_PLAN[branch]) return true;
  const theory = LAB_OF[code] ?? code;
  if (!planned(branch).has(theory)) return true;
  return SEMESTER_PLAN[branch][semester].includes(theory);
}

export function canSeeCourse(viewer: Viewer, code: string, type?: string): boolean {
  const { branch, semester } = who(viewer);
  if (streamOf(branch) === "bca") return code.startsWith("BCA-") && inSemester(branch, semester, code);
  if (code.startsWith("BCA-")) return false;
  if (BTECH_HIDDEN.has(code) || type === "bridge") return false;
  if (code.startsWith("WD-")) return !!branch && CSE_FAMILY.has(branch);
  return inSemester(branch, semester, code);
}

export const visibleCourses = <T extends { code: string; type?: string }>(viewer: Viewer, courses: readonly T[]): T[] =>
  courses.filter((c) => canSeeCourse(viewer, c.code, c.type));

export const canSeeLab = (viewer: Viewer, lab: { where: readonly (readonly [string, number])[] }): boolean =>
  lab.where.some(([c]) => canSeeCourse(viewer, c));

export const visibleLabs = <T extends { where: readonly (readonly [string, number])[] }>(viewer: Viewer, labs: readonly T[]): T[] =>
  labs.filter((l) => canSeeLab(viewer, l));
