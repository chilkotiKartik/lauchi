/** Model answers and marking rubrics for PYQs, keyed by PYQ id (e.g. "Q4.1") inside src/content/answers/<COURSE>.json. */
export type ModelAnswer = {
  /** Total marks the answer is written for (matches the PYQ). */
  marks: number;
  /** Examiner-style marking scheme: the points a full-marks answer must contain. Marks add up to `marks`. */
  rubric: { point: string; marks: number }[];
  /** The model answer as ordered blocks (paragraphs / derivation steps). Allowed markup: <sub> <sup> <b> <i>. */
  answer: string[];
  /** Key formulas/results to box (optional). */
  formulas?: string[];
  /** What diagram to draw and what to label (optional). */
  diagram?: string;
  /** Final numerical answer with units, for numericals (optional). */
  result?: string;
};
export type AnswerBook = Record<string, ModelAnswer>;
