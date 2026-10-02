/** Pure maths for the extra ECT-001 labs. */
const Q = 1.602e-19, KB_EV = 8.617e-5;

/* ───────────── Semiconductor carriers and conduction ───────────── */
export const MATS = {
  si: { name: "Silicon", Eg: 1.12, ni300: 1.5e10, mun: 1350, mup: 480 },
  ge: { name: "Germanium", Eg: 0.66, ni300: 2.4e13, mun: 3900, mup: 1900 },
  gaas: { name: "GaAs", Eg: 1.42, ni300: 2.1e6, mun: 8500, mup: 400 },
} as const;
export type Mat = keyof typeof MATS;
export function niAt(mat: Mat, T: number) {
  const m = MATS[mat];
  return m.ni300 * Math.pow(T / 300, 1.5) * Math.exp((-m.Eg / (2 * KB_EV)) * (1 / T - 1 / 300));
}
/** Carriers (cm⁻³), conductivity (S/cm), Fermi level relative to intrinsic level (eV), current density (A/cm²) for a field E (V/cm). */
export function semicond(mat: Mat, T: number, type: "intrinsic" | "n" | "p", logN: number, E: number) {
  const m = MATS[mat], ni = niAt(mat, T), N = type === "intrinsic" ? 0 : 10 ** logN;
  const maj = N / 2 + Math.sqrt((N / 2) ** 2 + ni * ni), min = (ni * ni) / maj;
  const n = type === "p" ? min : maj, p = type === "p" ? maj : type === "intrinsic" ? ni : min;
  // mobility falls with temperature (lattice scattering ∝ T^−1.5)
  const tf = Math.pow(T / 300, -1.5), mun = m.mun * tf, mup = m.mup * tf;
  const sigma = Q * (n * mun + p * mup);
  const EF = KB_EV * T * Math.log(n / ni);                      // E_F − E_i
  return { ni, n, p, sigma, rho: 1 / sigma, EF, J: sigma * E, vn: mun * E, vp: mup * E, Eg: m.Eg, mun, mup };
}

/* ───────────── Clippers and clampers ───────────── */
export type Shaper = "posclip" | "negclip" | "dualclip" | "posclamp" | "negclamp";
/** Output for input v (all volts). Diode drop Vd (0 for ideal). Steady state for clampers. */
export function shape(mode: Shaper, v: number, Vm: number, Vref: number, Vd: number) {
  switch (mode) {
    case "posclip": return Math.min(v, Vref + Vd);             // shunt diode to +Vref clips the top
    case "negclip": return Math.max(v, -(Vref + Vd));           // shunt diode to −Vref clips the bottom
    case "dualclip": return Math.max(-(Vref + Vd), Math.min(v, Vref + Vd));
    case "posclamp": return v + Vm + Vref - Vd;                 // bottom held at Vref − Vd
    case "negclamp": return v - Vm + Vref + Vd;                 // top held at Vref + Vd
  }
}
export function shaperInfo(mode: Shaper, Vm: number, Vref: number, Vd: number) {
  let hi = -Infinity, lo = Infinity;
  for (let k = 0; k <= 360; k++) { const v = Vm * Math.sin((k * Math.PI) / 180), o = shape(mode, v, Vm, Vref, Vd); hi = Math.max(hi, o); lo = Math.min(lo, o); }
  return { hi, lo, pp: hi - lo, dc: (hi + lo) / 2, clamp: mode === "posclamp" || mode === "negclamp" };
}

/* ───────────── Zener shunt regulator ───────────── */
export function zener(Vin: number, Rs: number, Vz: number, ILmA: number, PzmW: number, rz = 2) {
  const IL = ILmA / 1000;
  // Zener off if the load alone would pull the node below Vz
  const Vopen = Vin - IL * Rs;
  if (Vopen <= Vz) {
    const VL = Math.max(0, Vopen);
    return { on: false, VL, IR: IL, IZ: 0, PZ: 0, over: false, status: "Zener OFF: not regulating", Izm: PzmW / Vz };
  }
  // with a small Zener resistance rz: VL = Vz + IZ rz, IR = (Vin − VL)/Rs, IZ = IR − IL
  const IZ = (Vin - Vz - IL * Rs) / (Rs + rz);
  const VL = Vz + IZ * rz, IR = IZ + IL, PZ = VL * IZ * 1000;
  const over = PZ > PzmW;
  return { on: true, VL, IR, IZ, PZ, over, status: over ? "Zener over its power rating!" : "Regulating", Izm: PzmW / Vz };
}

/* ───────────── BJT bias stability ───────────── */
export function biasStab(kind: "fixed" | "divider", T: number, VCC: number, RC: number, RE: number, R1: number, R2: number, RB: number, beta25: number) {
  const beta = beta25 * (1 + 0.008 * (T - 25));
  const ICBO = 10e-9 * Math.pow(2, (T - 25) / 10);              // A
  const VBE = 0.7 - 0.0022 * (T - 25);
  let IC: number, S: number;
  if (kind === "fixed") {
    const IB = (VCC - VBE) / (RB * 1e3);
    IC = beta * IB + (beta + 1) * ICBO;
    S = beta + 1;
  } else {
    const Vth = (VCC * R2) / (R1 + R2), Rth = ((R1 * R2) / (R1 + R2)) * 1e3, Re = RE * 1e3;
    IC = (beta * (Vth - VBE) + (beta + 1) * ICBO * (Rth + Re)) / (Rth + (beta + 1) * Re);
    S = ((1 + beta) * (1 + Rth / Re)) / (1 + beta + Rth / Re);
  }
  const Rtot = (RC + (kind === "divider" ? RE : 0)) * 1e3;
  const IcSat = VCC / Rtot;
  const sat = IC >= IcSat;
  const ICq = Math.min(IC, IcSat), VCE = Math.max(0.2, VCC - ICq * Rtot);
  const re = 0.026 / Math.max(ICq, 1e-9);
  const Av = -(RC * 1e3) / re;                                  // emitter bypassed, no load
  return { beta, ICBO, VBE, IC: ICq, VCE, sat, S, Av, region: sat ? "saturation" : VCE < 1 ? "near saturation" : "active" };
}

/* ───────────── JFET ───────────── */
export function jfetId(VGS: number, VDS: number, IDSS: number, VP: number, lambda = 0.01) {
  const vp = Math.abs(VP), vgs = Math.min(0, Math.max(VGS, -vp));
  const u = 1 - vgs / VP;                                        // VP negative → 1 − VGS/VP
  if (VGS <= VP) return { ID: 0, region: "cut-off", VDSsat: 0 };
  const VDSsat = vgs - VP;
  if (VDS < VDSsat) {
    const ID = IDSS * (2 * u * (VDS / vp) - (VDS / vp) ** 2);
    return { ID: Math.max(0, ID), region: "ohmic", VDSsat };
  }
  return { ID: IDSS * u * u * (1 + lambda * (VDS - VDSsat)), region: "saturation (pinched off)", VDSsat };
}
export function jfet(VGS: number, VDS: number, IDSS: number, VP: number) {
  const r = jfetId(VGS, VDS, IDSS, VP);
  const gm = VGS > VP ? ((2 * IDSS) / Math.abs(VP)) * (1 - VGS / VP) : 0;          // mS when IDSS in mA
  return { ...r, gm };
}
/** Depletion half-width along the channel (0 at the source … 1 at the drain), as a fraction of the channel half-height. */
export function depletion(x: number, VGS: number, VDS: number, VP: number, VDSsat: number) {
  const vp = Math.abs(VP), vd = Math.min(VDS, Math.max(0, VDSsat));
  return Math.min(1, Math.sqrt(Math.max(0, -VGS + vd * x) / vp));
}

/* ───────────── Karnaugh map (Quine–McCluskey, 4 variables) ───────────── */
const VARS = ["A", "B", "C", "D"];
type Imp = { val: number; mask: number }; // mask bit = 1 means "this variable is eliminated"
const bits = (x: number) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
export function primeImplicants(terms: number[]): Imp[] {
  let cur: Imp[] = [...new Set(terms)].map((t) => ({ val: t, mask: 0 }));
  const primes: Imp[] = [];
  while (cur.length) {
    const used = new Set<number>(), next: Imp[] = [], seen = new Set<string>();
    for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
      const a = cur[i], b = cur[j];
      if (a.mask !== b.mask) continue;
      const diff = a.val ^ b.val;
      if (bits(diff) !== 1) continue;
      used.add(i); used.add(j);
      const n = { val: a.val & ~diff, mask: a.mask | diff }, k = `${n.val}/${n.mask}`;
      if (!seen.has(k)) { seen.add(k); next.push(n); }
    }
    cur.forEach((t, i) => { if (!used.has(i)) primes.push(t); });
    cur = next;
  }
  return primes;
}
const covers = (p: Imp, m: number) => (m & ~p.mask) === (p.val & ~p.mask);
/** Minimum cover: essential primes first, then exact search over the rest (small sizes). */
export function minimise(ones: number[], dcs: number[]): Imp[] {
  if (ones.length === 0) return [];
  if (ones.length + dcs.length === 16 && ones.length > 0) return [{ val: 0, mask: 15 }];
  const primes = primeImplicants([...ones, ...dcs]);
  const chosen: Imp[] = [];
  let left = [...ones];
  for (;;) {
    const ess = left.map((m) => primes.filter((p) => covers(p, m))).find((ps) => ps.length === 1);
    if (!ess) break;
    const p = ess[0];
    if (!chosen.includes(p)) chosen.push(p);
    left = left.filter((m) => !covers(p, m));
  }
  if (left.length) {
    const cand = primes.filter((p) => !chosen.includes(p) && left.some((m) => covers(p, m)));
    let best: Imp[] | null = null;
    const cost = (s: Imp[]) => s.length * 100 + s.reduce((a, p) => a + (4 - bits(p.mask)), 0);
    const n = cand.length;
    for (let mask = 1; mask < 1 << Math.min(n, 14); mask++) {
      const set = cand.filter((_, i) => mask & (1 << i));
      if (best && set.length > best.length) continue;
      if (left.every((m) => set.some((p) => covers(p, m))) && (!best || cost(set) < cost(best))) best = set;
    }
    chosen.push(...(best ?? cand));
  }
  return chosen;
}
export function termSOP(p: Imp): string {
  const lits: string[] = [];
  for (let i = 0; i < 4; i++) { const b = 1 << (3 - i); if (p.mask & b) continue; lits.push(p.val & b ? VARS[i] : VARS[i] + "′"); }
  return lits.length ? lits.join("") : "1";
}
export function termPOS(p: Imp): string {
  const lits: string[] = [];
  for (let i = 0; i < 4; i++) { const b = 1 << (3 - i); if (p.mask & b) continue; lits.push(p.val & b ? VARS[i] + "′" : VARS[i]); }
  return lits.length === 1 ? lits[0] : `(${lits.join(" + ")})`;
}
export function kmap(onesMask: number, dcMask: number, useDc: boolean) {
  const ones: number[] = [], dcs: number[] = [], zeros: number[] = [];
  for (let m = 0; m < 16; m++) {
    const one = (onesMask >> m) & 1, dc = useDc && ((dcMask >> m) & 1) && !one;
    if (one) ones.push(m); else if (dc) dcs.push(m); else zeros.push(m);
  }
  const sopImps = minimise(ones, dcs);
  const posImps = minimise(zeros, dcs);
  const sop = ones.length === 0 ? "0" : sopImps.map(termSOP).join(" + ");
  const pos = zeros.length === 0 ? "1" : ones.length === 0 ? "0" : posImps.map(termPOS).join("");
  const literals = sopImps.reduce((a, p) => a + (4 - bits(p.mask)), 0);
  const multi = sopImps.filter((p) => 4 - bits(p.mask) > 1).length;
  const nand = ones.length === 0 || zeros.length === 0 ? 0 : sopImps.length === 1 ? (multi ? 2 : 1) : multi + 1;
  return { ones, dcs, zeros, sopImps, posImps, sop, pos, literals, nand };
}
/** Evaluates a minimised SOP for minterm m (for checking). */
export const evalSop = (imps: Imp[], m: number) => imps.some((p) => covers(p, m));
/** K-map cell position (row, col) for minterm m with Gray-code order AB rows × CD columns. */
export const GRAY = [0, 1, 3, 2];
export function cellOf(m: number) { const ab = m >> 2, cd = m & 3; return { r: GRAY.indexOf(ab), c: GRAY.indexOf(cd) }; }
export function mintermAt(r: number, c: number) { return (GRAY[r] << 2) | GRAY[c]; }
