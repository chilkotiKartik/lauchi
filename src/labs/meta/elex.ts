import type { LabMeta } from "../types";

/** Basic Electronics Engineering (ECT-001) labs. */
export const ELEX_LABS: LabMeta[] = [
  { id: "diodeiv", title: "Diode I–V curve & load line", where: [["ECT-001", 1], ["ECT-001", 2]], blurb: "Shockley diode with a series resistor: change silicon or germanium, temperature and the Zener voltage, and find the operating point on the load line.", topics: ["PN junction diode", "Forward and reverse bias", "Zener breakdown"], animated: true,
    presets: [
      { name: "Silicon, forward", note: "3 V through 1 kΩ: the diode sits near 0.6 V with about 2.4 mA, so most of the supply drops across the resistor.", values: { Vs: 3, R: 1000, mat: "si", T: 300, n: 1, Vz: 5.1 } },
      { name: "Germanium knee", note: "Germanium conducts from about 0.2 V, because its saturation current is a million times larger than silicon's.", values: { Vs: 3, R: 1000, mat: "ge", T: 300, n: 1, Vz: 5.1 } },
      { name: "Zener regulator", note: "Reverse-biased past −5.1 V the diode breaks down and the voltage stays clamped near −5.1 V however far the supply rises.", values: { Vs: -12, R: 1000, mat: "si", T: 300, n: 1, Vz: 5.1 } },
    ] },
  { id: "bjt", title: "BJT fixed bias & load line", where: [["ECT-001", 3]], blurb: "Set V_CC, R_B, R_C and β; see the output characteristics, the DC load line and whether the transistor is cut off, active or saturated.", topics: ["Bipolar junction transistor", "Fixed bias", "DC load line and Q point"], animated: true,
    presets: [
      { name: "Active amplifier", note: "I_B = (12 − 0.7)/240 kΩ = 47 µA and I_C = βI_B = 4.7 mA, so V_CE ≈ 2.6 V: a comfortable Q point in the active region.", values: { VCC: 12, RB: 240, RC: 2, beta: 100, early: false } },
      { name: "Saturated switch", note: "Too much base current: I_C cannot exceed V_CC/R_C, so V_CE collapses to about 0.2 V and the transistor acts as a closed switch.", values: { VCC: 12, RB: 60, RC: 2, beta: 100, early: false } },
      { name: "Cut-off and Early effect", note: "With no base drive the transistor is an open switch. With the Early effect on, the active-region curves also slope upward.", values: { VCC: 12, RB: 1000, RC: 2, beta: 200, early: true } },
    ] },
  { id: "mosfet", title: "n-MOSFET channel & characteristics", where: [["ECT-001", 4]], blurb: "Watch the inversion channel narrow and pinch off as V_DS grows; read the region, drain current and transconductance from the square-law model.", topics: ["MOSFET operation", "Triode and saturation regions", "Transconductance"], animated: true,
    presets: [
      { name: "Triode (resistor-like)", note: "V_DS is below V_GS − V_t, so the channel reaches the drain and the device acts like a voltage-controlled resistor.", values: { VGS: 4, VDS: 1, Vt: 1.5, k: 2, lambda: 0.02 } },
      { name: "Saturation (amplifier)", note: "V_DS ≥ V_GS − V_t: the channel pinches off at the drain and I_D = (k/2)(V_GS − V_t)² barely changes with V_DS.", values: { VGS: 3, VDS: 6, Vt: 1.5, k: 2, lambda: 0.02 } },
      { name: "Cut-off", note: "V_GS below the threshold V_t: no channel forms, I_D = 0.", values: { VGS: 1, VDS: 5, Vt: 1.5, k: 2, lambda: 0.02 } },
    ] },
  { id: "opamp", title: "Op-amp amplifier circuits", where: [["ECT-001", 5]], blurb: "Inverting, non-inverting, follower, summing and integrator circuits driven by a sine wave; see the gain, phase flip and clipping at the supply rails.", topics: ["Operational amplifier", "Inverting and non-inverting amplifiers", "Integrator"], animated: true,
    presets: [
      { name: "Inverting ×(−4.7)", note: "Gain = −R_f/R_in = −47k/10k = −4.7, so a 1 V input gives a 4.7 V output, 180° out of phase; the inverting input is a virtual ground.", values: { A: 1, mode: "inv", Rin: 10, Rf: 47, C: 0.1, f: 1000, V2: 0.5, Vsat: 12 } },
      { name: "Clipping at the rails", note: "Non-inverting gain 1 + R_f/R_in = 48 would need a 48 V output for 1 V in, but it flat-tops at ±V_sat = 12 V.", values: { A: 1, mode: "noninv", Rin: 10, Rf: 470, C: 0.1, f: 1000, V2: 0.5, Vsat: 12 } },
      { name: "Integrator", note: "The output is −(1/RC)∫v dt: a sine becomes a cosine (90° shift) with amplitude A/(2πfRC).", values: { A: 1, mode: "integrator", Rin: 10, Rf: 47, C: 0.1, f: 200, V2: 0.5, Vsat: 12 } },
    ] },
  { id: "logic", title: "Logic gates & number systems", where: [["ECT-001", 5]], blurb: "Flick inputs A and B on any gate, see the output and the row of its truth table light up, and convert numbers between binary, octal, hex and BCD.", topics: ["Logic gates", "Truth tables", "Binary, octal, hexadecimal and BCD"], animated: false,
    presets: [
      { name: "XOR: odd inputs", note: "XOR is 1 only when the inputs differ, which makes it the sum bit of a half adder.", values: { n: 173, gate: "xor", a: true, b: false } },
      { name: "NAND: the universal gate", note: "NAND is 0 only when both inputs are 1. Every other gate can be built from NAND alone.", values: { n: 255, gate: "nand", a: true, b: true } },
      { name: "BCD of 92", note: "Binary-coded decimal writes each decimal digit in its own 4 bits, so 92 = 1001 0010, while pure binary gives 0101 1100.", values: { n: 92, gate: "nor", a: false, b: false } },
    ] },
];
