/** Maths for the Engineering Graphics labs (MEP-002). Pure functions, no React. */

// ---------- unit 1: drawing scales and sheet sizes ----------
export const SCALES = { s1_1: 1, s1_2: 0.5, s1_5: 0.2, s1_10: 0.1, s1_20: 0.05, s1_50: 0.02, s1_100: 0.01, s2_1: 2, s5_1: 5 } as const;
export type ScaleId = keyof typeof SCALES;
export const SCALE_TEXT: Record<ScaleId, string> = { s1_1: "1:1 (full size)", s1_2: "1:2", s1_5: "1:5", s1_10: "1:10", s1_20: "1:20", s1_50: "1:50", s1_100: "1:100", s2_1: "2:1 (enlarge)", s5_1: "5:1 (enlarge)" };
/** Long side of ISO 216 sheets in millimetres. */
export const SHEETS = { a4: 297, a3: 420, a2: 594 } as const;
export type SheetId = keyof typeof SHEETS;
const STANDARD = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
export const ratioText = (rf: number) => (rf >= 1 ? `${rf}:1` : `1:${Math.round(1 / rf)}`);
export function scaleFit(actualMm: number, scale: ScaleId, sheet: SheetId) {
  const rf = SCALES[scale], drawn = actualMm * rf, usable = SHEETS[sheet] - 20;
  const best = STANDARD.find((s) => actualMm * s <= usable) ?? STANDARD[STANDARD.length - 1];
  return { rf, drawn, usable, fits: drawn <= usable, best, bestText: ratioText(best), bestDrawn: actualMm * best };
}

// ---------- unit 2: projections of a straight line (first angle) ----------
/** Line AB whose end points are `sep` apart along the reference line; h = height above HP, d = distance in front of VP. */
export function lineProjection(sep: number, h1: number, d1: number, h2: number, d2: number) {
  const dh = h2 - h1, dd = d2 - d1;
  const fv = Math.hypot(sep, dh), tv = Math.hypot(sep, dd), tl = Math.hypot(sep, dh, dd);
  const deg = (r: number) => (r * 180) / Math.PI;
  return { fv, tv, tl, theta: deg(Math.atan2(Math.abs(dh), Math.hypot(sep, dd))), phi: deg(Math.atan2(Math.abs(dd), Math.hypot(sep, dh))) };
}

// ---------- unit 3: isometric view ----------
/** Foreshortening of the x, y and z edges of a cube seen from azimuth az and elevation el (degrees). */
export function foreshortening(az: number, el: number): [number, number, number] {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const dots = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
  return dots.map((d) => Math.sqrt(Math.max(0, 1 - d * d))) as [number, number, number];
}
export const ISO_EL = (Math.asin(1 / Math.sqrt(3)) * 180) / Math.PI; // 35.264°
export const ISO_SCALE = Math.sqrt(2 / 3); // 0.8165

// ---------- unit 4: section of a cylinder by an inclined plane through its centre ----------
export function cylinderSection(r: number, h: number, tiltDeg: number) {
  const a = (tiltDeg * Math.PI) / 180, t = Math.tan(a), cos = Math.cos(a);
  const xm = t < 1e-9 ? r : Math.min(r, h / (2 * t)), full = xm >= r - 1e-9;
  const area = (2 * (xm * Math.sqrt(Math.max(0, r * r - xm * xm)) + r * r * Math.asin(Math.min(1, xm / r)))) / cos;
  const shape = tiltDeg < 1e-9 ? "circle" : full ? "ellipse" : "part of an ellipse";
  return { xm, full, area, shape, semiMajor: r / cos, semiMinor: r };
}

// ---------- unit 5: polar coordinates in a CAD drawing ----------
export function polarPath(legs: [number, number][]) {
  const pts: [number, number][] = [[0, 0]];
  for (const [len, ang] of legs) { const [x, y] = pts[pts.length - 1], a = (ang * Math.PI) / 180; pts.push([x + len * Math.cos(a), y + len * Math.sin(a)]); }
  const end = pts[pts.length - 1], back = Math.hypot(end[0], end[1]);
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; area += x1 * y2 - x2 * y1; }
  const closeAngle = ((Math.atan2(-end[1], -end[0]) * 180) / Math.PI + 360) % 360;
  return { pts, back, closeAngle, area: Math.abs(area) / 2, perimeter: legs.reduce((s, l) => s + Math.abs(l[0]), 0) + back };
}
