import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

export type Unit = { n: number; title: string; hours: number | null; topics: string[]; formulas: string[]; hints: string[] };
export type Experiment = { n: number; title: string; aim: string; apparatus: string; formula: string; viva: [string, string][] };
export type Course = {
  code: string; name: string; short: string; type: "theory" | "lab" | "bridge" | "minor"; ltp: string; credits: number; sem: string;
  marks: { ct?: number; ta?: number; ese?: number; total?: number } | null; objectives: string[]; outcomes: string[];
  units: Unit[]; exps: Experiment[]; text: string[]; ref: string[]; rule: string; note: string;
};
export type CourseSummary = { code: string; name: string; short: string; type: Course["type"]; sem: string; credits: number; units: number; items: number };

const dir = path.join(process.cwd(), "src", "content", "syllabus");
const CODE = /^[A-Z]{2,3}-[0-9]{3}$/;

export const listCourses = cache((): CourseSummary[] => JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8")));

export const getCourse = cache((code: string): Course | null => {
  if (!CODE.test(code)) return null;
  try { return JSON.parse(fs.readFileSync(path.join(dir, code + ".json"), "utf8")); } catch { return null; }
});

export const topicKey = (code: string, unit: number, topic: number) => `${code}:${unit}:${topic}`;
export const parseTopicKey = (key: string) => {
  const m = /^([A-Z]{2,3}-[0-9]{3}):([0-9]{1,2}):([0-9]{1,3})$/.exec(key);
  return m ? { course: m[1], unit: +m[2], topic: +m[3] } : null;
};
