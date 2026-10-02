/** Marks maths for a theory subject: class tests + teacher's assessment (sessional) + end-semester exam (ESE). Pure functions, no I/O. */
export type Scheme = { ct: number; ta: number; ese: number };
/** [grade, grade points, minimum % of the total]. From the reference site the student supplied; a college may publish its own table. */
export const GRADES: readonly (readonly [string, number, number])[] = [["O", 10, 90], ["A+", 9, 85], ["A", 8, 80], ["B+", 7, 70], ["B", 6, 60], ["C", 5, 50], ["P", 4, 40], ["F", 0, 0]];
/** Pass rule used here: at least 30% in the end-sem paper and at least 40% overall. */
export const ESE_MIN = 0.3, OVERALL_MIN = 0.4;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const total = (s: Scheme) => s.ct + s.ta + s.ese;
export const gradeFor = (pct: number) => GRADES.find((g) => pct >= g[2]) ?? GRADES[GRADES.length - 1];

/** Sessional marks, each part limited to its maximum. */
export const sessional = (s: Scheme, ct: number, ta: number) => clamp(ct, 0, s.ct) + clamp(ta, 0, s.ta);

/** End-sem marks needed to pass, and to reach a target grade's minimum %. `null` means it cannot be reached even with full marks. */
export function needed(s: Scheme, ct: number, ta: number, targetPct: number) {
  const ses = sessional(s, ct, ta), floor = Math.ceil(s.ese * ESE_MIN);
  const pass = Math.max(floor, Math.ceil(total(s) * OVERALL_MIN - ses));
  const target = Math.max(floor, Math.ceil((total(s) * targetPct) / 100 - ses));
  return { sessional: ses, pass: pass > s.ese ? null : pass, target: target > s.ese ? null : target };
}

/** Predicted result if the student scores `ese` in the end-sem. */
export function predict(s: Scheme, ct: number, ta: number, ese: number) {
  const e = clamp(ese, 0, s.ese), ses = sessional(s, ct, ta), sum = ses + e, pct = (sum / total(s)) * 100;
  const failed = e < s.ese * ESE_MIN || pct < OVERALL_MIN * 100;
  const g = failed ? GRADES[GRADES.length - 1] : gradeFor(pct);
  return { total: sum, pct, grade: g[0], points: g[1], passed: !failed };
}

/** SGPA = sum(grade points x credits) / sum(credits). Only subjects with credits count. */
export function sgpa(items: { points: number; credits: number }[]) {
  const cr = items.reduce((s, i) => s + i.credits, 0);
  if (cr <= 0) return null;
  return items.reduce((s, i) => s + i.points * i.credits, 0) / cr;
}
