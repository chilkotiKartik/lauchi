/** Pure maths for the extra AHT-001 labs (grating resolution, He–Ne laser, polarimeter, solar cell / LED). SI units unless named. */
export const HC_EV_NM = 1239.84;
const KB_EV = 8.617e-5;

/* ───────────── Rayleigh resolution with a grating ───────────── */

/** Normalised grating intensity (single slit envelope ignored): [sin(Nβ)/(N sin β)]², β = π d sin θ / λ. */
export function gratingI(sinTheta: number, lambdaNm: number, dNm: number, N: number): number {
  const b = (Math.PI * dNm * sinTheta) / lambdaNm;
  const s = Math.sin(b);
  if (Math.abs(s) < 1e-9) return 1;
  const r = Math.sin(N * b) / (N * s);
  return r * r;
}

export function rayleigh(lambdaNm: number, dLambdaNm: number, linesPerMm: number, N: number, m: number) {
  const dNm = 1e6 / linesPerMm;
  const l2 = lambdaNm + dLambdaNm;
  const sin1 = (m * lambdaNm) / dNm, sin2 = (m * l2) / dNm;
  const visible = Math.abs(sin2) < 1;
  const needed = lambdaNm / dLambdaNm;
  const have = m * N;
  // angular half-width of a principal maximum (to its first zero): Δ(sin θ) = λ/(N d)
  const halfWidthSin = lambdaNm / (N * dNm);
  const sepSin = sin2 - sin1;
  const ratio = have / needed;
  const status = !visible ? "order not formed" : ratio >= 1.25 ? "clearly resolved" : ratio >= 0.98 ? "just resolved (Rayleigh)" : "not resolved";
  const th1 = visible ? (Math.asin(Math.min(1, sin1)) * 180) / Math.PI : NaN;
  const th2 = visible ? (Math.asin(Math.min(1, sin2)) * 180) / Math.PI : NaN;
  return { dNm, needed, have, ratio, status, visible, sin1, sin2, th1, th2, dThetaDeg: th2 - th1, halfWidthSin, sepSin, maxOrder: Math.floor(dNm / l2) };
}

/** Combined pattern of the two lines around order m, for plotting (x = sin θ offset in units of the line separation). */
export function doubletProfile(lambdaNm: number, dLambdaNm: number, dNm: number, N: number, m: number, pts = 240) {
  const s1 = (m * lambdaNm) / dNm, s2 = (m * (lambdaNm + dLambdaNm)) / dNm;
  const centre = (s1 + s2) / 2;
  const span = Math.max(4 * Math.abs(s2 - s1), 6 * lambdaNm / (N * dNm));
  const out: [number, number][] = [];
  for (let i = 0; i <= pts; i++) {
    const s = centre - span / 2 + (span * i) / pts;
    out.push([(s - centre) / span, 0.5 * (gratingI(s, lambdaNm, dNm, N) + gratingI(s, lambdaNm + dLambdaNm, dNm, N))]);
  }
  return out;
}

/* ───────────── He–Ne laser (simplified gain/threshold model) ───────────── */

/** He:Ne mixing efficiency: best near 7:1, falls off either side (simplified). */
export const mixEfficiency = (heNe: number) => Math.exp(-(((heNe - 7) / 5) ** 2));

export function laser(currentMa: number, heNe: number, lengthCm: number, rOutPct: number, rBackPct = 99.9, lossPerM = 0.005) {
  const L = lengthCm / 100;
  const sat = currentMa / (1 + currentMa / 8);                  // gain saturates with discharge current
  const g0 = 0.11 * (sat / 3.85) * mixEfficiency(heNe);         // small-signal gain per metre (≈0.11 /m at the optimum)
  const R1 = rBackPct / 100, R2 = rOutPct / 100;
  const gth = Math.log(1 / (R1 * R2)) / (2 * L) + lossPerM;     // round-trip threshold
  const lasing = g0 > gth && currentMa > 0;
  const out = lasing ? Math.min(25, 1.2 * (g0 / gth - 1) * ((1 - R2) / 0.01) ** 0.6 * (L / 0.3)) : 0; // mW, schematic scaling
  const fsrMHz = 2.998e8 / (2 * L) / 1e6;                       // longitudinal mode spacing c/2L
  const modes = lasing ? Math.max(1, Math.floor(1500 / fsrMHz) + 1) : 0; // modes inside a ~1.5 GHz Doppler width
  const photonEv = HC_EV_NM / 632.8;
  return { g0, gth, lasing, out, fsrMHz, modes, photonEv, inversion: g0 / Math.max(gth, 1e-9) };
}

/* ───────────── Laurent half-shade polarimeter ───────────── */

export const SAMPLES = {
  sucrose: { name: "Cane sugar (sucrose)", S: 66.5 },
  glucose: { name: "Glucose (dextrose)", S: 52.7 },
  fructose: { name: "Fructose", S: -92.4 },
  water: { name: "Pure water", S: 0 },
} as const;
export type SampleId = keyof typeof SAMPLES;

/** Rotation θ = S·l·c (l in dm, c in g/mL); intensities of the two half-fields for an analyser at φ (degrees). */
export function polarimeter(sample: SampleId, cPct: number, lCm: number, analyserDeg: number, halfShadeDeg = 8) {
  const S = SAMPLES[sample].S;
  const theta = S * (lCm / 10) * (cPct / 100);
  const a = (analyserDeg * Math.PI) / 180, h = (halfShadeDeg * Math.PI) / 180, t = (theta * Math.PI) / 180;
  // the two halves carry light polarised at θ ± h/2; the analyser passes cos² of the angle between them
  const left = Math.cos(a - (t + h / 2)) ** 2, right = Math.cos(a - (t - h / 2)) ** 2;
  const matchDeg = (((theta + 90) % 180) + 180) % 180; // equal-darkness setting: analyser ⟂ the bisector
  const balanced = Math.abs(left - right) < 0.01 && left < 0.1;
  return { S, theta, left, right, matchDeg, balanced };
}

/* ───────────── Solar cell and LED (single-diode model) ───────────── */

export const LED_MATS = {
  gaas: { name: "GaAs", Eg: 1.42 },
  gaasp: { name: "GaAsP", Eg: 1.9 },
  gap: { name: "GaP", Eg: 2.26 },
  ingan: { name: "InGaN", Eg: 2.7 },
} as const;
export type LedMat = keyof typeof LED_MATS;

/** Silicon cell: J_sc = 35 mA/cm² at 1000 W/m², I₀ grows steeply with temperature. */
export function solarCell(G: number, areaCm2: number, T: number, rLoad: number) {
  const VT = (KB_EV * T);
  const n = 1.3;
  const Iph = 0.035 * areaCm2 * (G / 1000) * (1 + 0.0005 * (T - 300));
  const I0 = 1e-10 * areaCm2 * (T / 300) ** 3 * Math.exp((-1.12 / KB_EV) * (1 / T - 1 / 300));
  const I = (V: number) => Iph - I0 * (Math.exp(V / (n * VT)) - 1);
  const Voc = Iph > 0 ? n * VT * Math.log(Iph / I0 + 1) : 0;
  // maximum power point by scanning
  let Pm = 0, Vm = 0, Im = 0;
  for (let k = 0; k <= 400; k++) { const V = (Voc * k) / 400, i = I(V), P = V * i; if (P > Pm) { Pm = P; Vm = V; Im = i; } }
  // operating point with the load: bisection on V where I(V) = V / R
  let lo = 0, hi = Math.max(Voc, 1e-6);
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (I(mid) - mid / rLoad > 0) lo = mid; else hi = mid; }
  const Vop = (lo + hi) / 2, Iop = Math.max(0, I(Vop));
  const Pin = G * areaCm2 * 1e-4;
  return { Iph, I0, Voc, Isc: Iph, Vm, Im, Pm, FF: Voc > 0 && Iph > 0 ? Pm / (Voc * Iph) : 0, eff: Pin > 0 ? (Pm / Pin) * 100 : 0, Vop, Iop, Pop: Vop * Iop, curve: (V: number) => I(V) };
}

export function led(mat: LedMat, V: number, T = 300) {
  const Eg = LED_MATS[mat].Eg, VT = KB_EV * T, n = 2;
  // simplified: about 1 mA flows when the bias equals the band gap (in volts), rising e-fold every nV_T
  const I = Math.min(0.1, 1e-3 * Math.exp((V - Eg) / (n * VT)));
  const lambda = HC_EV_NM / Eg;
  return { Eg, lambda, I, on: I > 1e-4, photonsPerS: (I * 0.3) / 1.602e-19 };
}

/** Rough visible colour of a wavelength (for a glow), as a hex string. */
export function nmHex(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 0.5; b = 1; }
  else if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else if (nm <= 780) { r = 1; }
  else { r = 0.55; g = 0.05; b = 0.05; }
  const h = (x: number) => Math.round(Math.min(1, x) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
