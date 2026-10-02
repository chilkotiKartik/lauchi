/** Maths for the environment, electrical, biology, C and basic-maths labs that fill the gaps in the syllabus. Pure functions, no React. */

// ---------- AHT-004 unit 1: resource depletion ----------
/** Reserve left after t years when yearly use starts at c and grows at g (fraction per year). */
export function reserveAt(R: number, c: number, g: number, t: number): number {
  const used = g === 0 ? c * t : (c * (Math.exp(g * t) - 1)) / g;
  return Math.max(0, R - used);
}
/** Years until the reserve is gone: R/c if use is steady, ln(1 + R g / c) / g if use grows exponentially. */
export function depletionYears(R: number, c: number, g: number): number {
  if (c <= 0) return Infinity;
  return g === 0 ? R / c : Math.log(1 + (R * g) / c) / g;
}
export function resources(R: number, c0: number, gPct: number, recyclePct: number) {
  const g = gPct / 100, c = c0 * (1 - recyclePct / 100);
  const steady = R / c0, grow = depletionYears(R, c0, g), grownRecycled = depletionYears(R, c, g);
  const used50 = Math.min(1, (R - reserveAt(R, c, g, 50)) / R);
  return { steady, grow, grownRecycled, used50, years: Array.from({ length: 11 }, (_, i) => reserveAt(R, c, g, i * 10)) };
}

// ---------- AHT-004 unit 3: species–area ----------
/** Fraction of species left when a fraction f of habitat area remains: S/S0 = f^z. */
export const speciesLeft = (f: number, z: number) => Math.pow(Math.max(0, f), z);
export function speciesArea(S0: number, habitatPct: number, z: number) {
  const f = habitatPct / 100, keep = speciesLeft(f, z), S = S0 * keep;
  return { S, lost: S0 - S, lostPct: (1 - keep) * 100, habitatLostPct: 100 - habitatPct };
}

// ---------- AHT-004 unit 5: rainwater harvesting ----------
/** Yearly harvest in litres: area (m²) × rainfall (mm) × runoff coefficient (1 mm on 1 m² is 1 litre). */
export const harvestLitres = (area: number, rainMm: number, coeff: number) => area * rainMm * coeff;
/** A typical monsoon-dominated monthly share of the year's rain (Jan…Dec, percent, adds to 100): an assumption for the model. */
export const MONSOON = [1, 1, 1, 2, 4, 14, 28, 24, 13, 6, 3, 3];
export function tankYear(area: number, rainMm: number, coeff: number, tank: number, dailyUse: number) {
  const yearly = harvestLitres(area, rainMm, coeff);
  let level = 0, overflow = 0, shortfall = 0;
  const levels: number[] = [];
  for (let m = 0; m < 12; m++) {
    level += (yearly * MONSOON[m]) / 100;
    if (level > tank) { overflow += level - tank; level = tank; }
    const need = dailyUse * 30;
    if (level >= need) level -= need; else { shortfall += need - level; level = 0; }
    levels.push(level);
  }
  const demand = dailyUse * 360;
  return { yearly, levels, overflow, shortfall, met: Math.min(100, ((demand - shortfall) / demand) * 100), days: yearly / dailyUse };
}

// ---------- EET-001 unit 5: load, MCB and bill ----------
export const MCB_SIZES = [6, 10, 16, 20, 25, 32, 40, 50, 63] as const;
export const mcbFor = (amps: number) => MCB_SIZES.find((s) => s >= amps) ?? 63;
/** Typical copper wire size (mm²) for a circuit protected by an MCB of this rating (a common guide, not a code substitute). */
export const wireFor = (mcb: number) => (mcb <= 10 ? 1.5 : mcb <= 16 ? 2.5 : mcb <= 25 ? 4 : mcb <= 32 ? 6 : mcb <= 40 ? 10 : 16);
export function loadBill(o: { bulbs: number; fans: number; acs: number; acHours: number; fridge: boolean; tariff: number; fixed: number; volts: number }) {
  const L = [
    { name: "LED bulbs", w: o.bulbs * 9, h: 6 },
    { name: "Fans", w: o.fans * 75, h: 10 },
    { name: "Air conditioners", w: o.acs * 1500, h: o.acHours },
    { name: "Refrigerator", w: o.fridge ? 150 : 0, h: 24 * 0.4 },
  ];
  const connected = L.reduce((s, x) => s + x.w, 0);
  const amps = connected / o.volts, mcb = mcbFor(amps * 1.25);
  const kwh = L.map((x) => (x.w * x.h * 30) / 1000), energy = kwh.reduce((s, x) => s + x, 0);
  return { load: L, connected, amps, mcb, wire: wireFor(mcb), kwh, energy, bill: energy * o.tariff + o.fixed };
}

// ---------- CST-001 unit 1: an algorithm as a flowchart (Euclid's GCD) ----------
export type GcdStep = { node: "start" | "input" | "test" | "calc" | "output"; a: number; b: number; note: string };
export function gcdTrace(a0: number, b0: number, method: "mod" | "sub"): GcdStep[] {
  const t: GcdStep[] = [{ node: "start", a: a0, b: b0, note: "Start" }, { node: "input", a: a0, b: b0, note: `Read a = ${a0}, b = ${b0}` }];
  let a = a0, b = b0, guard = 0;
  if (method === "mod") {
    for (;;) {
      t.push({ node: "test", a, b, note: `Is b = 0?  ${b === 0 ? "Yes" : "No"}` });
      if (b === 0 || ++guard > 400) break;
      const r = a % b;
      t.push({ node: "calc", a: b, b: r, note: `r = ${a} mod ${b} = ${r}; a = ${b}; b = ${r}` });
      a = b; b = r;
    }
    t.push({ node: "output", a, b, note: `Print gcd = ${a}` });
  } else {
    for (;;) {
      t.push({ node: "test", a, b, note: `Is a = b?  ${a === b ? "Yes" : "No"}` });
      if (a === b || ++guard > 3000) break;
      if (a > b) { a -= b; } else { b -= a; }
      t.push({ node: "calc", a, b, note: `Subtract the smaller from the larger: a = ${a}, b = ${b}` });
    }
    t.push({ node: "output", a, b, note: `Print gcd = ${a}` });
  }
  return t;
}
export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// ---------- BTT-001 unit 1: why cells are small ----------
export function cellSize(rUm: number, dUm2s: number, foldFactor: number) {
  const sa = 4 * Math.PI * rUm * rUm, vol = (4 / 3) * Math.PI * rUm ** 3;
  return { sa, vol, saOverV: sa / vol, saFolded: sa * foldFactor, saVFolded: (sa * foldFactor) / vol, diffusionS: (rUm * rUm) / (6 * dUm2s) };
}

// ---------- BTT-001 unit 3: enzyme kinetics ----------
export type Inhib = "none" | "competitive" | "noncompetitive" | "uncompetitive";
export function mm(S: number, Vmax: number, Km: number, I: number, Ki: number, mode: Inhib) {
  const a = 1 + (mode === "none" ? 0 : I / Ki);
  const vmaxApp = mode === "noncompetitive" || mode === "uncompetitive" ? Vmax / a : Vmax;
  const kmApp = mode === "competitive" ? Km * a : mode === "uncompetitive" ? Km / a : Km;
  const v = (vmaxApp * S) / (kmApp + S);
  return { v, vmaxApp, kmApp, free: (Vmax * S) / (Km + S) };
}

// ---------- BTT-001 unit 5: free energy of a reaction ----------
export const R_GAS = 8.314; // J/(mol·K)
/** ΔG = ΔG°′ + RT ln Q with ΔG°′ in kJ/mol, T in kelvin and log10 Q given. */
export const deltaG = (dG0: number, T: number, log10Q: number) => dG0 + (Math.LN10 * R_GAS * T * log10Q) / 1000;
/** Equilibrium ratio Q_eq where ΔG = 0. */
export const qEq = (dG0: number, T: number) => Math.pow(10, -(dG0 * 1000) / (Math.LN10 * R_GAS * T));
export const ATP_DG0 = -30.5;

// ---------- AHT-000 unit 2: limits and continuity ----------
export type LimFn = "hole" | "jump" | "sinc" | "pole";
export function limFn(kind: LimFn, x: number, k: number, j: number): number | null {
  switch (kind) {
    case "hole": return x === k ? null : (x * x - k * k) / (x - k);
    case "jump": return x < k ? x : x + j;
    case "sinc": return x === 0 ? null : Math.sin(x) / x;
    case "pole": return x === k ? null : 1 / (x - k);
  }
}
export function limitAt(kind: LimFn, a: number, k: number, j: number) {
  const eps = 1e-6, at = limFn(kind, a, k, j);
  let left: number | null, right: number | null;
  if (kind === "hole") { left = right = a === k ? 2 * k : (a * a - k * k) / (a - k); }
  else if (kind === "jump") { left = a <= k ? a : a + j; right = a < k ? a : a + j; if (a === k) { left = k; right = k + j; } }
  else if (kind === "sinc") { left = right = a === 0 ? 1 : Math.sin(a) / a; }
  else { if (a === k) { left = -Infinity; right = Infinity; } else { left = right = 1 / (a - k); } }
  const exists = left !== null && right !== null && Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < eps;
  const continuous = exists && at !== null && Math.abs((at as number) - (left as number)) < eps;
  return { at, left, right, exists, limit: exists ? (left as number) : null, continuous };
}

// ---------- AHT-000 unit 2: partial fractions ----------
/** (p x + q) / ((x − r1)(x − r2)) = A/(x − r1) + B/(x − r2), for r1 ≠ r2. */
export function partial(p: number, q: number, r1: number, r2: number) {
  const A = (p * r1 + q) / (r1 - r2), B = (p * r2 + q) / (r2 - r1);
  const whole = (x: number) => (p * x + q) / ((x - r1) * (x - r2));
  const sum = (x: number) => A / (x - r1) + B / (x - r2);
  return { A, B, whole, sum };
}
