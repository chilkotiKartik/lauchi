/**
 * Previous-year questions, predicted topics and lab blueprints (built by scripts/build-pyq.py).
 * The eight first-year subjects are imported statically (always bundled); any other src/content/pyq/<CODE>.json
 * (e.g. the BCA files) is discovered from disk on the server and appended in alphabetical order.
 */
import fs from "node:fs";
import path from "node:path";
import phy from "@/content/pyq/AHT-001.json";
import chem from "@/content/pyq/AHT-002.json";
import elec from "@/content/pyq/EET-001.json";
import elex from "@/content/pyq/ECT-001.json";
import mech from "@/content/pyq/MET-001.json";
import imaths from "@/content/pyq/AHT-003.json";
import amaths from "@/content/pyq/AHT-005.json";
import cprog from "@/content/pyq/CST-001.json";

export type PyqPart = { text: string; marks: string | null };
export type Pyq = { id: string; kind: "theory" | "numerical"; title: string; marks: string | null; repeated: number | null; parts: PyqPart[] };
export type PyqUnit = { n: number; title: string; syllabus: { head: string; text: string }[]; pyqs: Pyq[]; predicted: { title: string; text: string }[]; labs: { id: string; title: string; points: string[] }[] };
export type PyqSubject = { code: string; name: string; units: PyqUnit[]; priority: { rank: number; title: string; unit: number; times: number; marks: string }[] };

const CORE = [phy, chem, elec, elex, mech] as unknown as PyqSubject[];
const BUNDLED = [imaths, amaths, cprog] as unknown as PyqSubject[];
const CODE_FILE = /^[A-Z]{2,3}-\d{3}\.json$/;

/** Every other src/content/pyq/<CODE>.json (skips index.json and i18n/). Never throws: a bad file is just left out. */
function discover(known: Set<string>): PyqSubject[] {
  const out: PyqSubject[] = [];
  try {
    const dir = path.join(process.cwd(), "src", "content", "pyq");
    for (const f of fs.readdirSync(dir).filter((n) => CODE_FILE.test(n)).sort()) {
      if (known.has(f.slice(0, -5))) continue;
      try {
        const s = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as PyqSubject;
        if (s && s.code === f.slice(0, -5) && Array.isArray(s.units) && s.units.length) out.push(s);
      } catch { /* skip unreadable file */ }
    }
  } catch { /* no filesystem (edge runtime): bundled subjects only */ }
  return out;
}

const REST = [...BUNDLED, ...discover(new Set([...CORE, ...BUNDLED].map((s) => s.code)))].sort((a, b) => a.code.localeCompare(b.code));
const ALL: PyqSubject[] = [...CORE, ...REST];
export const PYQ_CODES = ALL.map((s) => s.code);
export const SHORT: Record<string, string> = {
  "AHT-001": "Physics", "AHT-002": "Chemistry", "EET-001": "Electrical", "ECT-001": "Electronics", "MET-001": "Mechanical",
  "AHT-003": "Intro Maths", "AHT-005": "Analytical M", "CST-001": "Programming",
};
for (const s of ALL) SHORT[s.code] ??= s.name;
/** The subject codes for which `visible(code)` is true, in display order (core five first). */
export const pyqCodesFor = (visible: (code: string) => boolean) => PYQ_CODES.filter(visible);
export const getPyq = (code: string) => ALL.find((s) => s.code === code) ?? null;
export const hasPyq = (code: string) => PYQ_CODES.includes(code);

/** Number of individual questions (sub-parts) in a subject. */
export const countQuestions = (s: PyqSubject) => s.units.reduce((a, u) => a + u.pyqs.reduce((b, q) => b + Math.max(1, q.parts.length), 0), 0);

/** The most-repeated questions of a subject: the notes' own priority table when there is one, otherwise ranked by repeat count. */
export function topRepeated(s: PyqSubject, n = 12): { title: string; unit: number; times: number; marks: string }[] {
  if (s.priority.length) return s.priority.slice(0, n).map((p) => ({ title: p.title, unit: p.unit, times: p.times, marks: p.marks }));
  return s.units.flatMap((u) => u.pyqs.filter((q) => q.repeated).map((q) => ({ title: q.title, unit: u.n, times: q.repeated as number, marks: q.marks ? `${q.marks} Marks` : "" })))
    .sort((a, b) => b.times - a.times || a.unit - b.unit).slice(0, n);
}

/** Lab blueprints in the notes → the lockin. 3D labs that implement them. */
export const LAB_MAP: Record<string, string[]> = {
  "AHT-001:1.1": ["rings"], "AHT-001:1.2": ["rayleigh", "diffraction"], "AHT-001:2.1": ["laser"], "AHT-001:2.2": ["fiber"], "AHT-001:2.3": ["polarimeter", "polarization"],
  "AHT-001:3.1": ["emwave"], "AHT-001:3.2": ["hysteresis"], "AHT-001:4.1": ["box"], "AHT-001:4.2": ["compton"], "AHT-001:5.1": ["hall"], "AHT-001:5.2": ["solarcell", "pnjunction"],
  "AHT-002:1.1": ["motheory"], "AHT-002:1.2": ["cft"], "AHT-002:2.1": ["nernst"], "AHT-002:2.2": ["ellingham"], "AHT-002:3.1": ["softening", "hardness"],
  "AHT-002:3.2": ["corrosion"], "AHT-002:4.1": ["calorimeter"], "AHT-002:4.2": ["lubrication", "polymer"], "AHT-002:5.1": ["nmr"], "AHT-002:5.2": ["snmech"],
  "EET-001:1.1": ["transient", "thevenin"], "EET-001:2.1": ["rlc"], "EET-001:2.2": ["wattmeter", "threephase"], "EET-001:3.1": ["trtest", "transformer"], "EET-001:3.2": ["meters"],
  "EET-001:4.1": ["dcmachine"], "EET-001:4.2": ["torqueslip", "rotatingfield"], "EET-001:5.1": ["powergrid", "loadbill"], "EET-001:5.2": ["earthing"],
  "ECT-001:1.1": ["semicond"], "ECT-001:1.2": ["diodeiv", "pnjunction"], "ECT-001:2.1": ["rectifier"], "ECT-001:2.2": ["clipper", "zener"], "ECT-001:3.1": ["bjt"],
  "ECT-001:3.2": ["biasstab"], "ECT-001:4.1": ["jfet"], "ECT-001:4.2": ["mosfet"], "ECT-001:5.1": ["opamp"], "ECT-001:5.2": ["kmap", "logic"],
  "MET-001:1.1": ["truss"], "MET-001:1.2": ["ladder"], "MET-001:2.1": ["tensile"], "MET-001:2.2": ["beam"], "MET-001:3.1": ["bernoulli"], "MET-001:3.2": ["pelton"],
  "AHT-003:1.1": ["surface", "mvt", "taylor"], "AHT-003:2.1": ["volume", "polar"], "AHT-003:3.1": ["revolution"], "AHT-003:4.1": ["vectorfield"], "AHT-003:5.1": ["eigen"],
  "AHT-005:1.1": ["slopefield"], "AHT-005:2.1": ["oscillator", "pendulum"], "AHT-005:3.1": ["fourier", "series"], "AHT-005:4.1": ["string"], "AHT-005:5.1": ["complexmap"],
  "CST-001:1.1": ["cpipeline", "gcdflow"], "CST-001:2.1": ["ctrlflow", "bits"], "CST-001:3.1": ["sortstack", "sorting", "search"], "CST-001:4.1": ["ptrheap", "pointers"], "CST-001:5.1": ["structunion", "structlayout"],
  "MET-001:4.1": ["pvwork"], "MET-001:4.2": ["carnot"], "MET-001:5.1": ["engine4s", "otto"], "MET-001:5.2": ["dualcycle", "diesel"],
};
