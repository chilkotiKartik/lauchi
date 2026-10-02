import "server-only";
import { getCourse, listCourses } from "@/lib/syllabus";

export type CourseOption = { code: string; short: string; name: string; units: { n: number; title: string; topics: string[] }[] };

/** Every subject that has units, with unit and topic titles, for the admin pickers. */
export function courseOptions(): CourseOption[] {
  return listCourses().filter((c) => c.units > 0).flatMap((c) => {
    const full = getCourse(c.code);
    if (!full || !full.units.length) return [];
    return [{
      code: c.code, short: c.short, name: c.name,
      units: full.units.map((u) => ({ n: u.n, title: u.title.slice(0, 90), topics: u.topics.map((t) => t.slice(0, 90)) })),
    }];
  });
}

export const courseLabel = (opts: CourseOption[], code: string) => opts.find((c) => c.code === code)?.short ?? code;
export const unitLabel = (opts: CourseOption[], code: string, unit: number) => opts.find((c) => c.code === code)?.units.find((u) => u.n === unit)?.title ?? "";
