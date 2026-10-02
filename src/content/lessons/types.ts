export type Check = { q: string; o: string[]; a: number; why: string };
export type Lesson = {
  intro: string;
  sections: { h: string; p: string[]; formula?: string[] }[];
  examples: { q: string; steps: string[]; ans: string }[];
  mistakes: string[];
  check: Check[];
  lab?: { id: string; label: string };
};
