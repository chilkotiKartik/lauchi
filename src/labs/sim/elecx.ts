/** Pure maths for the extra EET-001 labs. SI units unless a name says otherwise. */

/* ───────────── First-order transients ───────────── */
export function transient(mode: "rc" | "rl", V: number, R: number, CuF: number, LmH: number, tMs: number) {
  const tau = mode === "rc" ? R * CuF * 1e-6 : (LmH * 1e-3) / R;           // s
  const t = tMs / 1000, e = Math.exp(-t / tau);
  if (mode === "rc") {
    const vc = V * (1 - e), i = (V / R) * e;
    return { tau, i, vR: i * R, vX: vc, energy: 0.5 * CuF * 1e-6 * vc * vc, final: V, pct: (1 - e) * 100, settle: 5 * tau };
  }
  const i = (V / R) * (1 - e), vL = V * e;
  return { tau, i, vR: i * R, vX: vL, energy: 0.5 * LmH * 1e-3 * i * i, final: V / R, pct: (1 - e) * 100, settle: 5 * tau };
}

/* ───────────── Two-wattmeter method ───────────── */
/** φ in degrees: positive = lagging. */
export function twoWattmeter(VL: number, IL: number, phiDeg: number) {
  const p = (phiDeg * Math.PI) / 180;
  const W1 = (VL * IL * Math.cos(Math.PI / 6 - p)) / 1000, W2 = (VL * IL * Math.cos(Math.PI / 6 + p)) / 1000; // kW
  const P = W1 + W2, Q = Math.sqrt(3) * (W1 - W2);
  const phiBack = (Math.atan2(Q, P) * 180) / Math.PI;
  return { W1, W2, P, Q, S: Math.sqrt(3) * VL * IL / 1000, pf: Math.cos(p), phiBack, negative: W2 < 0 };
}

/* ───────────── Transformer tests, efficiency and regulation ───────────── */
export function transformerTest(kVA: number, Pi: number, Pcu: number, x: number, pf: number, pctR: number, pctX: number, lead: boolean) {
  const out = x * kVA * pf;                                  // kW
  const cu = x * x * Pcu;
  const eta = out > 0 ? (out / (out + Pi + cu)) * 100 : 0;
  const sin = Math.sqrt(Math.max(0, 1 - pf * pf));
  const reg = x * (pctR * pf + (lead ? -1 : 1) * pctX * sin); // % (approximate formula)
  const xMax = Math.sqrt(Pi / Pcu);
  const etaMax = (xMax * kVA * pf) / (xMax * kVA * pf + 2 * Pi) * 100;
  return { out, cu, eta, reg, xMax, etaMax, loss: Pi + cu };
}
export const etaAt = (x: number, kVA: number, Pi: number, Pcu: number, pf: number) => (x <= 0 ? 0 : (x * kVA * pf) / (x * kVA * pf + Pi + x * x * Pcu) * 100);

/* ───────────── PMMC vs moving-iron meter ───────────── */
/** Deflection in degrees (0–90 full scale). AC → PMMC reads the average (zero); MI reads the RMS on a square-law scale. */
export function meter(kind: "pmmc" | "mi", ImA: number, fsdMa: number, ac: boolean) {
  const r = ImA / fsdMa;
  let defl: number;
  if (kind === "pmmc") defl = ac ? 0 : 90 * r;
  else defl = 90 * Math.min(1.2, r * r) * 1;                 // torque ∝ I², same sign for either direction
  const clipped = Math.max(-10, Math.min(95, defl));
  const reads = kind === "pmmc" ? (ac ? 0 : ImA) : Math.abs(ImA);
  return { defl: clipped, reads, over: Math.abs(r) > 1.0001, scale: kind === "pmmc" ? "uniform (linear)" : "square-law (crowded at the start)", worksAC: kind === "mi" };
}
export function shunt(RmOhm: number, fsdMa: number, rangeA: number) {
  const Im = fsdMa / 1000;
  return rangeA > Im ? (RmOhm * Im) / (rangeA - Im) : Infinity;
}
export const multiplier = (RmOhm: number, fsdMa: number, rangeV: number) => Math.max(0, rangeV / (fsdMa / 1000) - RmOhm);

/* ───────────── DC machine ───────────── */
export function dcMachine(mode: "gen" | "motor", P: number, Z: number, phiMwb: number, lap: boolean, N: number, V: number, Ra: number, Ia: number) {
  const A = lap ? P : 2, phi = phiMwb / 1000;
  const k = (P * Z) / (60 * A);                              // E = k Φ N
  if (mode === "gen") {
    const E = k * phi * N, Vt = E - Ia * Ra;
    return { E, Vt, N, torque: (P * phi * Z * Ia) / (2 * Math.PI * A), power: Vt * Ia, A };
  }
  const Eb = V - Ia * Ra, speed = Eb / (k * phi);
  return { E: Eb, Vt: V, N: speed, torque: (P * phi * Z * Ia) / (2 * Math.PI * A), power: Eb * Ia, A };
}

/* ───────────── Induction motor torque–slip ───────────── */
/** Simplified per-phase model (stator impedance neglected): T = 3V²R₂s/(ω_s(R₂² + (sX₂)²)). */
export function inductionTorque(s: number, Vph: number, R2: number, X2: number, f: number, poles: number) {
  const ws = (4 * Math.PI * f) / poles;
  return (3 * Vph * Vph * R2 * s) / (ws * (R2 * R2 + (s * X2) ** 2));
}
export function torqueSlip(Vpct: number, R2: number, X2: number, f: number, poles: number, TL: number, Vrated = 230) {
  const V = (Vrated * Vpct) / 100;
  const Ns = (120 * f) / poles;
  const sm = Math.min(1, R2 / X2);
  const Tmax = inductionTorque(sm, V, R2, X2, f, poles);
  const Tst = inductionTorque(1, V, R2, X2, f, poles);
  // stable operating point: smallest s in (0, s_m] where T(s) = T_L
  let s: number | null = null;
  if (TL <= Tmax) { let lo = 1e-6, hi = sm; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (inductionTorque(mid, V, R2, X2, f, poles) < TL) lo = mid; else hi = mid; } s = (lo + hi) / 2; }
  return { Ns, sm, Tmax, Tst, s, N: s === null ? 0 : Ns * (1 - s), stalls: s === null, rotorEff: s === null ? 0 : (1 - s) * 100, fr: s === null ? f : s * f };
}

/* ───────────── Transmission and distribution ───────────── */
export function grid(PMW: number, kV: number, km: number, ohmPerKm: number, pf: number) {
  const I = (PMW * 1e6) / (Math.sqrt(3) * kV * 1e3 * pf);
  const R = ohmPerKm * km;
  const lossMW = (3 * I * I * R) / 1e6;
  const dropPct = ((Math.sqrt(3) * I * R * pf) / (kV * 1e3)) * 100;     // resistive part only
  return { I, R, lossMW, eff: (PMW / (PMW + lossMW)) * 100, dropPct, lossCrPerYear: (lossMW * 1000 * 8760 * 0.5 * 5) / 1e7 }; // 50 % load factor, ₹5/unit, in crore ₹
}

/* ───────────── Earthing and lead–acid battery ───────────── */
export function pipeEarth(rho: number, L: number, dMm: number) { const d = dMm / 1000; return (rho / (2 * Math.PI * L)) * Math.log((4 * L) / d); }
export function plateEarth(rho: number, sideM: number) { const A = sideM * sideM; return (rho / 4) * Math.sqrt(Math.PI / A); }
export function earthFault(Re: number, V = 230, Rsource = 1, mcbA = 16) {
  const If = V / (Re + Rsource), touch = If * Re;
  const trips = If >= 5 * mcbA;                            // type-B MCB magnetic trip ≈ 3–5 × In: use 5×
  return { If, touch, trips, safe: touch <= 50 || trips };
}
/** Peukert-style run time and specific gravity at a state of charge. */
export function battery(Ah: number, IA: number, socPct: number, k = 1.2) {
  const hours = IA > 0 ? (20 * Math.pow(Ah / (IA * 20), k)) * (socPct / 100) : Infinity;
  const sg = 1.12 + 0.16 * (socPct / 100);
  const ocv = 11.8 + 0.9 * (socPct / 100);
  return { hours, sg, ocv, Wh: 12 * Ah * (socPct / 100) };
}
