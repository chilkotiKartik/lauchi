import type { Lesson } from "./types";
import { continuity, limit, mvt, rolle } from "./aht-003-u1a";
import { maclaurin, taylor, taylor2 } from "./aht-003-u1b";
import { lagrange, maxmin2, maxmin3, partial } from "./aht-003-u1c";
import { L_AHT001 } from "./r3-aht-001";
import { L_AHT001_HI, L_AHT001_HL } from "./i18n/aht-001";
import { L_AHT002 } from "./r3-aht-002";
import { L_AHT002_HI, L_AHT002_HL } from "./i18n/aht-002";
import { L_EET001 } from "./r3-eet-001";
import { L_EET001_HI, L_EET001_HL } from "./i18n/eet-001";
import { L_ECT001 } from "./r3-ect-001";
import { L_ECT001_HI, L_ECT001_HL } from "./i18n/ect-001";
import { L_MET001 } from "./r3-met-001";
import { L_MET001_HI, L_MET001_HL } from "./i18n/met-001";
import { AHT003_HI, AHT003_HL } from "./i18n/aht-003";
import { L_BCA001 } from "./bca-001";
import { L_BCA002 } from "./bca-002";
import { L_BCA006 } from "./bca-006";
import { L_BCA007 } from "./bca-007";
import { L_BCA008 } from "./bca-008";

/** Lessons are keyed by topic key ("COURSE:unit:topic"). Topics without an entry show the syllabus notes only. */
export const LESSONS: Record<string, Lesson> = {
  "AHT-003:1:1": limit,
  "AHT-003:1:2": continuity,
  "AHT-003:1:3": rolle,
  "AHT-003:1:4": mvt,
  "AHT-003:1:5": maclaurin,
  "AHT-003:1:6": taylor,
  "AHT-003:1:7": taylor2,
  "AHT-003:1:8": partial,
  "AHT-003:1:9": maxmin2,
  "AHT-003:1:10": maxmin3,
  "AHT-003:1:11": lagrange,
  ...L_AHT001,
  ...L_AHT002,
  ...L_EET001,
  ...L_ECT001,
  ...L_MET001,
  ...L_BCA001,
  ...L_BCA002,
  ...L_BCA006,
  ...L_BCA007,
  ...L_BCA008,
};
export const LESSONS_HI: Record<string, Lesson> = { ...AHT003_HI, ...L_AHT001_HI, ...L_AHT002_HI, ...L_EET001_HI, ...L_ECT001_HI, ...L_MET001_HI };
export const LESSONS_HL: Record<string, Lesson> = { ...AHT003_HL, ...L_AHT001_HL, ...L_AHT002_HL, ...L_EET001_HL, ...L_ECT001_HL, ...L_MET001_HL };
export type Lang = "en" | "hi" | "hl";
/** The lesson in the student's language, falling back to English. */
export const lessonFor = (key: string, lang: Lang): Lesson | undefined => (lang === "hi" ? LESSONS_HI[key] : lang === "hl" ? LESSONS_HL[key] : undefined) ?? LESSONS[key];
export type { Lesson };
