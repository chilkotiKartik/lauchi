/** Data-driven guided experiment for a 3D lab. Everything the student sees (steps, questions, solutions) comes from data of this shape. */

/** A step is "done" when the real lab state satisfies `check` (read from the lab's live params), so progress can't be faked. */
export type StepCheck =
  | { kind: "param"; key: string; op: "gte" | "lte" | "eq" | "neq" | "changed"; value?: number | string | boolean }
  | { kind: "preset"; name?: string }          // the student loaded a preset (any, or the named one)
  | { kind: "reset" }                          // the student pressed Reset
  | { kind: "manual" };                        // student ticks it themselves (use sparingly: observation/reading steps)

export type Step = { id: string; title: string; text: string; hint?: string; check: StepCheck };

export type Equipment = { name: string; what: string; where?: string };

type QBase = {
  id: string;
  prompt: string;
  /** Scenario text shown above the prompt for scenario-based questions. */
  scenario?: string;
  marks: number;
  hint?: string;
  /** Formulas used, shown with the solution. Only <sub> <sup> <b> <i> markup. */
  formulas?: string[];
  /** Numbered worked solution, shown after answering. */
  solution: string[];
  explanation: string;
  commonMistake?: string;
};
export type Question =
  | (QBase & { type: "mcq"; options: string[]; answer: number })
  | (QBase & { type: "tf"; answer: boolean })
  | (QBase & { type: "numeric"; answer: number; tolerance: number; unit?: string });

export type Experiment = {
  labId: string;
  title: string;
  aim: string;
  /** What the student will be able to do afterwards. */
  objectives: string[];
  equipment: Equipment[];
  steps: Step[];
  questions: Question[];
  /** Learning summary shown on the results screen. */
  summary: string[];
  /** Pass mark in percent. Default 60. */
  pass?: number;
};
