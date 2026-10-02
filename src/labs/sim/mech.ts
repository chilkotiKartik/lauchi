/** Pure maths for the MET-001 Basic Mechanical Engineering labs. No React, no three. SI units unless a name says otherwise. */

export const G = 9.81;
const RAD = Math.PI / 180;

/** Small seeded PRNG (mulberry32) so scenes can scatter particles without Math.random(). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** 66666666.7 → "6.667 × 10⁷". Values between 0.01 and 10 000 are printed plainly. */
export function sci(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const ax = Math.abs(x);
  if (ax >= 0.01 && ax < 1e4) return String(Number(x.toPrecision(digits)));
  const e = Math.floor(Math.log10(ax));
  let m = x / 10 ** e;
  let ee = e;
  if (Math.abs(Number(m.toFixed(digits - 1))) >= 10) { m /= 10; ee += 1; }
  return `${m.toFixed(digits - 1)} × 10${String(ee).split("").map((c) => SUP[c] ?? c).join("")}`;
}

/* ───────────────────────── 1. Block on an inclined plane ───────────────────────── */

export type Motion = "rest" | "up" | "down";
/**
 * Block of mass m (kg) on a slope at θ (degrees) with an applied force P (N) pushing up the slope.
 * Signs along the slope: positive = up the slope. μk is capped at μs (kinetic friction never exceeds static).
 */
export function incline(thetaDeg: number, m: number, muS: number, muK: number, P: number, g = G) {
  const th = thetaDeg * RAD;
  const W = m * g, N = W * Math.cos(th), down = W * Math.sin(th);
  const muKUsed = Math.min(muK, muS);
  const fsMax = muS * N;
  const drive = P - down; // net force along the slope before friction; + tends to push the block up
  let friction: number, a: number, state: Motion;
  if (Math.abs(drive) <= fsMax + 1e-9) { friction = -drive; a = 0; state = "rest"; }
  else {
    const dir = Math.sign(drive);
    friction = -dir * muKUsed * N; a = (drive + friction) / m; state = dir > 0 ? "up" : "down";
  }
  return { W, N, down, fsMax, friction, a, state, net: a * m, drive, muKUsed, repose: Math.atan(muS) / RAD };
}

/* ───────────────────────── 2. Area moment of inertia ───────────────────────── */

export type Section = "rect" | "circle" | "hollow" | "isec" | "tsec";
/**
 * Section properties in mm. b = width (flange width), d = depth (outer diameter for circles), tf = flange thickness
 * (wall thickness for the hollow circle), tw = web thickness, h = offset of a parallel axis from the centroidal x-axis.
 * ȳ is measured from the bottom edge. Thicknesses are capped so the shape stays valid.
 */
export function moi(sec: Section, b: number, d: number, tf: number, tw: number, h: number) {
  let A: number, ybar: number, Ix: number, Iy: number;
  let tfU = tf, twU = tw, di = 0;
  if (sec === "rect") {
    A = b * d; ybar = d / 2; Ix = (b * d ** 3) / 12; Iy = (d * b ** 3) / 12;
  } else if (sec === "circle") {
    A = (Math.PI * d * d) / 4; ybar = d / 2; Ix = Iy = (Math.PI * d ** 4) / 64;
  } else if (sec === "hollow") {
    tfU = Math.min(tf, 0.45 * d); di = d - 2 * tfU;
    A = (Math.PI * (d * d - di * di)) / 4; ybar = d / 2; Ix = Iy = (Math.PI * (d ** 4 - di ** 4)) / 64;
  } else if (sec === "isec") {
    tfU = Math.min(tf, 0.45 * d); twU = Math.min(tw, b);
    const hw = d - 2 * tfU;
    A = 2 * b * tfU + twU * hw; ybar = d / 2;
    Ix = (b * d ** 3 - (b - twU) * hw ** 3) / 12;
    Iy = (2 * tfU * b ** 3) / 12 + (hw * twU ** 3) / 12;
  } else {
    tfU = Math.min(tf, 0.9 * d); twU = Math.min(tw, b);
    const hw = d - tfU, A1 = b * tfU, A2 = twU * hw, y1 = d - tfU / 2, y2 = hw / 2;
    A = A1 + A2; ybar = (A1 * y1 + A2 * y2) / A;
    Ix = (b * tfU ** 3) / 12 + A1 * (y1 - ybar) ** 2 + (twU * hw ** 3) / 12 + A2 * (y2 - ybar) ** 2;
    Iy = (tfU * b ** 3) / 12 + (hw * twU ** 3) / 12;
  }
  const Ishift = Ix + A * h * h;
  return { A, ybar, Ix, Iy, Ishift, k: Math.sqrt(Ix / A), kShift: Math.sqrt(Ishift / A), J: Ix + Iy, tf: tfU, tw: twU, di };
}

/* ───────────────────────── 3. Tensile test ───────────────────────── */

export type Material = "steel" | "al" | "cu" | "ci";
export interface MatProps {
  name: string; E: number; sy: number; su: number; eL: number; eu: number; ef: number; sfFrac: number; brittle: boolean;
}
/** Typical textbook values. E, σ_y, σ_u in MPa; strains as fractions. eL = end of the yield plateau (mild steel only). */
export const MATERIALS: Record<Material, MatProps> = {
  steel: { name: "Mild steel", E: 200e3, sy: 250, su: 410, eL: 0.015, eu: 0.18, ef: 0.25, sfFrac: 0.78, brittle: false },
  al: { name: "Aluminium alloy (6061-T6)", E: 70e3, sy: 275, su: 310, eL: 0, eu: 0.08, ef: 0.12, sfFrac: 0.85, brittle: false },
  cu: { name: "Copper (annealed)", E: 117e3, sy: 70, su: 220, eL: 0, eu: 0.3, ef: 0.45, sfFrac: 0.75, brittle: false },
  ci: { name: "Grey cast iron", E: 100e3, sy: NaN, su: 200, eL: 0, eu: 0.005, ef: 0.005, sfFrac: 1, brittle: true },
};

/** Engineering stress (MPa) at engineering strain eps (fraction). 0 once fractured. */
export function stressAt(mat: Material, eps: number): number {
  const M = MATERIALS[mat];
  if (eps <= 0) return 0;
  if (eps > M.ef + 1e-12) return 0;
  if (M.brittle) return (M.su * Math.tanh((M.E * eps) / M.su)) / Math.tanh((M.E * M.ef) / M.su);
  const ey = M.sy / M.E;
  if (eps <= ey) return M.E * eps;
  const e0 = Math.max(ey, M.eL);
  if (eps <= e0) return M.sy;
  if (eps <= M.eu) { const x = (eps - e0) / (M.eu - e0); return M.sy + (M.su - M.sy) * (1 - (1 - x) ** 2); }
  const x = (eps - M.eu) / (M.ef - M.eu);
  return M.su - M.su * (1 - M.sfFrac) * x * x;
}

export type Region = "elastic" | "yield plateau" | "strain hardening" | "necking" | "fractured" | "elastic, brittle";
export function tensileRegion(mat: Material, eps: number): Region {
  const M = MATERIALS[mat];
  if (eps > M.ef + 1e-12) return "fractured";
  if (M.brittle) return "elastic, brittle";
  if (eps <= M.sy / M.E) return "elastic";
  if (eps <= M.eL) return "yield plateau";
  if (eps <= M.eu) return "strain hardening";
  return "necking";
}

/** Full test state for strain in percent, gauge length L0 (mm) and diameter d0 (mm). Force in N. */
export function tensile(mat: Material, epsPct: number, L0: number, d0: number) {
  const M = MATERIALS[mat], eps = epsPct / 100;
  const A0 = (Math.PI * d0 * d0) / 4, sigma = stressAt(mat, eps);
  return { M, eps, A0, sigma, F: sigma * A0, dL: eps * L0, region: tensileRegion(mat, eps), fractured: eps > M.ef + 1e-12, elongPct: M.ef * 100 };
}

/** Sampled stress–strain curve [strain, stress] up to fracture, then the drop to zero. */
export function tensileCurve(mat: Material, n = 160): [number, number][] {
  const M = MATERIALS[mat], out: [number, number][] = [];
  const ey = M.brittle ? M.ef : M.sy / M.E;
  // dense sampling in the elastic part so the steep line is drawn exactly
  for (let i = 0; i <= 8; i++) out.push([(ey * i) / 8, stressAt(mat, (ey * i) / 8)]);
  if (!M.brittle) for (let i = 1; i <= n; i++) { const e = ey + ((M.ef - ey) * i) / n; out.push([e, stressAt(mat, e)]); }
  out.push([M.ef, 0]);
  return out;
}

/* ───────────────────────── 4. Venturi meter ───────────────────────── */

export const RHO_W = 1000, RHO_HG = 13600, NU_W = 1e-6;
/**
 * Venturi meter carrying water. Q in L/s, diameters in mm. The throat is capped at 0.9·D₁.
 * The measured (actual) flow Q = C_d·Q_ideal, so the real pressure drop for the same Q is Δp_ideal / C_d².
 */
export function venturi(QLs: number, D1mm: number, D2mm: number, Cd: number) {
  const Q = QLs / 1000, D1 = D1mm / 1000, D2 = Math.min(D2mm, 0.9 * D1mm) / 1000;
  const A1 = (Math.PI * D1 * D1) / 4, A2 = (Math.PI * D2 * D2) / 4;
  const v1 = Q / A1, v2 = Q / A2;
  const dpIdeal = (RHO_W * (v2 * v2 - v1 * v1)) / 2, dp = dpIdeal / (Cd * Cd);
  const hm = dp / ((RHO_HG - RHO_W) * G);
  return { A1, A2, v1, v2, dpIdeal, dp, hm, Re: (v2 * D2) / NU_W, beta: D2 / D1, D2mm: D2 * 1000 };
}

/* ───────────────────────── 5. Heat engine / refrigerator / heat pump ───────────────────────── */

export type Device = "engine" | "fridge" | "pump";
/**
 * Reversible limit and an actual device working at `frac` of it, between T_H and T_C (K). `input` in kW is Q_H for the
 * engine and the work W for the refrigerator and heat pump. dS is the entropy generated in the universe (W/K).
 */
export function heatDevice(dev: Device, TH: number, TC: number, input: number, frac: number) {
  if (!(TC > 0 && TH > TC)) return { valid: false as const };
  let limit: number, actual: number, QH: number, QC: number, W: number;
  if (dev === "engine") {
    limit = 1 - TC / TH; actual = frac * limit; QH = input; W = actual * QH; QC = QH - W;
  } else if (dev === "fridge") {
    limit = TC / (TH - TC); actual = frac * limit; W = input; QC = actual * W; QH = QC + W;
  } else {
    limit = TH / (TH - TC); actual = Math.max(1, frac * limit); W = input; QH = actual * W; QC = QH - W;
  }
  const dS = dev === "engine" ? (-QH / TH + QC / TC) * 1000 : (QH / TH - QC / TC) * 1000;
  return { valid: true as const, limit, actual, QH, QC, W, dS };
}

/* ───────────────────────── 6. Diesel air-standard cycle ───────────────────────── */

export const dieselEfficiency = (r: number, rho: number, g: number) => 1 - (r ** (1 - g) * (rho ** g - 1)) / (g * (rho - 1));
export const ottoEfficiency = (r: number, g: number) => 1 - r ** (1 - g);

type PV = { v: number; p: number };
function segment(path: [number, number][], a: PV, b: PV, kind: "adiabatic" | "v" | "p", g: number, n = 40) {
  for (let i = 0; i <= n; i++) {
    const s = i / n, v = a.v + (b.v - a.v) * s;
    path.push([v, kind === "adiabatic" ? a.p * (a.v / v) ** g : kind === "p" ? a.p : a.p + (b.p - a.p) * s]);
  }
}
/**
 * Air-standard Diesel cycle with p in units of p₁ and V in units of the clearance volume V₂ (so V₁ = r).
 * 1→2 isentropic compression, 2→3 constant-pressure heat addition to V₃ = ρ, 3→4 isentropic expansion, 4→1 constant volume.
 * Work and heat are returned in units of p₁V₁. The Otto loop has the same r and the same heat input.
 */
export function diesel(r: number, rho: number, g: number) {
  const p2 = r ** g, p3 = p2, p4 = p3 * (rho / r) ** g;
  const s1 = { v: r, p: 1 }, s2 = { v: 1, p: p2 }, s3 = { v: rho, p: p3 }, s4 = { v: r, p: p4 };
  const qIn = (g / (g - 1)) * (p3 * rho - p2 * 1), qOut = (p4 * r - r) / (g - 1);
  const W = qIn - qOut;
  const path: [number, number][] = [];
  segment(path, s1, s2, "adiabatic", g); segment(path, s2, s3, "p", g); segment(path, s3, s4, "adiabatic", g); segment(path, s4, s1, "v", g);
  // Otto at the same r and the same heat input: constant-volume heat addition at V = 1
  const p3o = p2 + (g - 1) * qIn, p4o = p3o / r ** g;
  const ottoPath: [number, number][] = [];
  const o3 = { v: 1, p: p3o }, o4 = { v: r, p: p4o };
  segment(ottoPath, s1, s2, "adiabatic", g); segment(ottoPath, s2, o3, "v", g); segment(ottoPath, o3, o4, "adiabatic", g); segment(ottoPath, o4, s1, "v", g);
  const ottoW = qIn - (p4o * r - r) / (g - 1);
  return {
    path, ottoPath, p2, p3o,
    eff: W / qIn, formula: dieselEfficiency(r, rho, g), otto: ottoEfficiency(r, g),
    work: W / r, heatIn: qIn / r, mep: W / (r - 1), ottoWork: ottoW / r, ottoMep: ottoW / (r - 1),
    T3: r ** (g - 1) * rho, // peak temperature in units of T₁
  };
}
