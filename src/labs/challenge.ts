/**
 * "Predict → test → explain" tasks that work on every lab, built from what the lab itself shows: its sliders, its
 * readouts and its presets. The right answer is never written by hand: it is what the student's own lab does when
 * they make the change, so the tasks stay correct for all labs and cannot drift from the simulation.
 */
import type { Params } from "./params-core";

export type Dir = "up" | "down" | "same";
export type SliderInfo = { label: string; value: number; min: number; max: number; step: number; unit: string; digits: number; /** moves the real slider */ set?: (v: number) => void };
export type Readout = [string, string];

export type SliderTask = { kind: "slider"; id: string; slider: string };
export type PresetTask = { kind: "preset"; id: string; preset: string; note: string; values: Params };
export type Task = SliderTask | PresetTask;

const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
const PREFIX: Record<string, number> = { p: 1e-12, n: 1e-9, "µ": 1e-6, "μ": 1e-6, u: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };
// a prefix only counts when a unit letter follows it, and not for units that merely start with one of these letters
const NOT_PREFIXED = /^(min|mol|mph|mm[A-Za-z]|month|max|mean|mode|mag|Mach|kg)/;

/**
 * The value a readout shows, in base units, or null when it is not a number ("Stable", "Yes", "—").
 * Handles −, thousands commas, "× 10⁻³", "e-3" and SI prefixes ("1.05 kΩ" is 1050, "950 mA" is 0.95).
 */
export function readValue(text: string): number | null {
  const t = text.replace(/−/g, "-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUP[c]).replace(/(\d),(?=\d{3}\b)/g, "$1");
  const m = /([-+]?(?:\d+\.?\d*|\.\d+))(?:e([-+]?\d+))?/i.exec(t);
  if (!m) return null;
  let v = parseFloat(m[1]) * (m[2] ? 10 ** parseInt(m[2], 10) : 1);
  let rest = t.slice(m.index + m[0].length);
  const pow = /^\s*[×x*]\s*10\^?\s*([-+]?\d+)/.exec(rest);
  if (pow) { v *= 10 ** parseInt(pow[1], 10); rest = rest.slice(pow[0].length); }
  const unit = /^\s?(\S+)/.exec(rest)?.[1] ?? "";
  const p = PREFIX[unit[0]];
  if (p && unit.length > 1 && /[A-Za-zΩ°]/.test(unit[1]) && !NOT_PREFIXED.test(unit)) v *= p;
  return Number.isFinite(v) ? v : null;
}

/** Which way a readout moved between two moments (exact text match means "same", so rounding never invents a change). */
export function direction(before: string, after: string): Dir | null {
  if (before === after) return "same";
  const a = readValue(before), b = readValue(after);
  if (a === null || b === null) return null;
  if (Math.abs(b - a) <= 1e-12 * Math.max(1, Math.abs(a))) return "same";
  return b > a ? "up" : "down";
}

/** The first number as written, without unit prefixes ("550 nm" → 550). */
const shownNumber = (text: string) => { const m = /[-+]?(?:\d+\.?\d*|\.\d+)/.exec(text.replace(/−/g, "-").replace(/(\d),(?=\d{3}\b)/g, "$1")); return m ? parseFloat(m[0]) : null; };

/**
 * Readouts a prediction can be made about: numeric ones, at most four, in the lab's own order. When a slider is being
 * tested, a readout that merely repeats that slider's value is left out (predicting it teaches nothing), unless
 * nothing else is left.
 */
export function predictable(readouts: Readout[], tested?: SliderInfo | null): Readout[] {
  const numeric = readouts.filter(([, v]) => readValue(v) !== null);
  const echo = (v: string) => { const n = shownNumber(v); return tested != null && n !== null && Math.abs(n - tested.value) <= 1e-9 * Math.max(1, Math.abs(n)); };
  const useful = numeric.filter(([, v]) => !echo(v));
  return (useful.length ? useful : numeric).slice(0, 4);
}

/** Tasks for a lab: its first two sliders (one change each) and its first preset. */
export function buildTasks(sliders: SliderInfo[], presets: { name: string; note: string; values: Params }[]): Task[] {
  const out: Task[] = sliders.slice(0, 2).map((s, i) => ({ kind: "slider", id: `s${i}`, slider: s.label }));
  if (presets[0]) out.push({ kind: "preset", id: "p0", preset: presets[0].name, note: presets[0].note, values: presets[0].values });
  return out;
}

/**
 * How far the student must move the slider for a fair, visible test: up unless it already sits in the top tenth,
 * by at least 6 steps or a tenth of the range (whichever is more), never past the end.
 */
export function moveGoal(s: SliderInfo): { dir: "up" | "down"; target: number } {
  const range = s.max - s.min;
  const by = Math.max(6 * s.step, range / 10);
  const dir = s.value >= s.max - range / 10 ? "down" : "up";
  const raw = dir === "up" ? Math.min(s.max, s.value + by) : Math.max(s.min, s.value - by);
  return { dir, target: Number(raw.toFixed(Math.max(0, s.digits))) };
}

export const reached = (goal: { dir: "up" | "down"; target: number }, value: number) =>
  goal.dir === "up" ? value >= goal.target - 1e-9 : value <= goal.target + 1e-9;

const same = (a: Params[string] | undefined, b: Params[string] | undefined) =>
  typeof a === "number" && typeof b === "number" ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)) : a === b;

/** Parameter keys whose value differs between two snapshots. */
export function changedKeys(a: Params | null, b: Params | null): string[] {
  if (!a || !b) return [];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !same(a[k], b[k]));
}

/** True when the lab is showing exactly the preset's values (nothing moved after loading it). */
export const showsPreset = (values: Params, now: Params | null) => !!now && Object.keys(values).every((k) => same(values[k], now[k]));

export type RowResult = { label: string; before: string; after: string; predicted: Dir; actual: Dir | null; right: boolean };

/** Compare each prediction with what the lab actually did. Rows whose readout became non-numeric are skipped. */
export function grade(rows: { label: string; before: string; predicted: Dir }[], after: Readout[]): RowResult[] {
  const now = new Map(after);
  return rows.flatMap((r) => {
    const a = now.get(r.label);
    if (a === undefined) return [];
    const actual = direction(r.before, a);
    return [{ label: r.label, before: r.before, after: a, predicted: r.predicted, actual, right: actual === r.predicted }];
  });
}

const WORD: Record<Dir, string> = { up: "rose", down: "fell", same: "did not change" };
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** One plain sentence about what the test showed, e.g. "Raising R: Current fell and Power rose; Voltage did not change." */
export function summarise(cause: string, results: RowResult[]): string {
  const by = (d: Dir) => results.filter((r) => r.actual === d).map((r) => r.label);
  const parts = (["up", "down", "same"] as Dir[]).map((d) => (by(d).length ? `${list(by(d))} ${WORD[d]}` : "")).filter(Boolean);
  return parts.length ? `${cause}: ${parts.join("; ")}.` : `${cause}: none of the readings changed.`;
}

/** Score for a set of graded tasks, in percent of correct predictions (a task with no gradable rows does not count). */
export function scoreOf(done: { right: number; total: number }[]): number {
  const total = done.reduce((s, d) => s + d.total, 0);
  return total ? Math.round((100 * done.reduce((s, d) => s + d.right, 0)) / total) : 0;
}
