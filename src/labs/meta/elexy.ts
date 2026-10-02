import type { LabMeta } from "../types";

/** Round-3 labs (group elexy): fills every unit of the core subjects to at least five labs. */
export const ELEXY_LABS: LabMeta[] = [
  { id: "tunnel", title: "Tunnel & Schottky diodes", where: [["ECT-001", 1]], blurb: "Sweep the bias across a tunnel diode, a Schottky diode and a silicon p–n diode side by side: find the peak, the negative-resistance stretch and the valley, and see why a Schottky turns on at 0.3 V.", topics: ["Tunnel diode", "Schottky diode", "V-I characteristics of diode (forward and reverse bias)", "Diode resistance (static and dynamic)"], animated: true,
    presets: [
      { name: "Negative resistance", note: "At 0.15 V the germanium tunnel diode is past its peak (65 mV): current falls as voltage rises, so its dynamic resistance is negative.", values: { V: 0.15, Ip: 10, mat: "ge", phiB: 0.65 } },
      { name: "Peak point", note: "At V = V_p the tunnelling current is at its maximum I_p and dI/dV = 0, so r is effectively infinite.", values: { V: 0.065, Ip: 10, mat: "ge", phiB: 0.65 } },
      { name: "Schottky vs silicon at 0.3 V", note: "At 0.3 V the Schottky diode already carries milliamps while the silicon p–n diode is still almost off; the GaAs tunnel diode is in its negative-resistance region.", values: { V: 0.3, Ip: 5, mat: "gaas", phiB: 0.6 } },
    ] },
  { id: "multiplier", title: "Voltage doubler, tripler & quadrupler", where: [["ECT-001", 2]], blurb: "A 3-D diode–capacitor ladder pumps charge up one rung each half-cycle. Pick a doubler, tripler or quadrupler, load it and see the output sag and ripple.", topics: ["Voltage multipliers", "Capacitor filter"], animated: true,
    presets: [
      { name: "Ideal tripler (PYQ topic)", note: "With no load and ideal diodes the tripler's output, taken across C1 + C3, is exactly 3V_m = 30 V; each diode still needs a 2V_m = 20 V PIV rating.", values: { Vm: 10, n: 3, C: 100, IL: 0, f: 50, VD: 0 } },
      { name: "Half-wave doubler", note: "2V_m minus two diode drops; a 5 mA load on 100 µF at 50 Hz sags it by I/fC = 1 V and adds 1 V of ripple.", values: { Vm: 100, n: 2, C: 100, IL: 5, f: 50, VD: 0.7 } },
      { name: "Overloaded quadrupler", note: "10 mA from 10 µF at 50 Hz: I/fC = 20 V, and the quadrupler's sag is 7 times that, so most of the 4V_m is lost. Multipliers need light loads, big C or high f.", values: { Vm: 50, n: 4, C: 10, IL: 10, f: 50, VD: 0.7 } },
    ] },
  { id: "bridgerect", title: "Bridge vs centre-tap rectifier", where: [["ECT-001", 2]], blurb: "Watch the current take two paths through a 3-D bridge, or one through a centre-tap rectifier, always the same way through the load. Compare I_dc, I_rms, η, PIV and TUF.", topics: ["Rectifiers: full wave (centre-tap and bridge)", "Calculation of ripple factor", "Calculation of rectification efficiency", "Transformer utilization factor"], animated: true,
    presets: [
      { name: "PYQ: 220 sin 314t, r_d = 10 Ω", note: "I_m = 220/(1000 + 2×10) = 215.7 mA, I_dc = 137.3 mA, I_rms = 152.5 mA, γ = 0.482 and η = 81.2 %/(1 + 2r_d/R_L) = 79.5 %.", values: { Vm: 220, topo: "bridge", RL: 1000, rd: 10, Vg: 0 } },
      { name: "PYQ: 120 V rms, silicon diodes", note: "V_m = 169.7 V; two 0.7 V drops leave V_dc = 2(169.7 − 1.4)/π ≈ 107 V; each diode needs PIV ≥ V_m ≈ 170 V and carries I_m ≈ 168 mA.", values: { Vm: 169.7, topo: "bridge", RL: 1000, rd: 0, Vg: 0.7 } },
      { name: "Same job, centre-tap", note: "One diode per half-cycle, so slightly higher η, but the secondary must be 2V_m end to end and each diode must block 2V_m = 440 V; TUF falls to 0.693.", values: { Vm: 220, topo: "ct", RL: 1000, rd: 10, Vg: 0 } },
    ] },
  { id: "bjtconfig", title: "BJT in CB, CE & CC: characteristics", where: [["ECT-001", 3]], blurb: "Electrons cross a 3-D npn slab while you switch the common terminal. Read α, β, γ and I_C = βI_B + I_CEO, and see the input and output characteristics with their active, cut-off and saturation regions.", topics: ["Transistor action", "CB configuration", "CE configuration", "CC configuration", "Input characteristics", "Output characteristics (active, cut-off, saturation regions)"], animated: true,
    presets: [
      { name: "PYQ: β = 98, I_CEO = 40 µA", note: "I_C = βI_B + I_CEO = 98 × 0.3 mA + 0.04 mA = 29.44 mA and I_E = I_C + I_B = 29.74 mA.", values: { beta: 98, cfg: "ce", IB: 0.3, ICEO: 40, Vout: 6 } },
      { name: "PYQ: α = 0.997 (CB)", note: "β = α/(1 − α) = 0.997/0.003 ≈ 332. In CB the output current is αI_E, flat even at V_CB = 0.", values: { beta: 332, cfg: "cb", IB: 0.02, ICEO: 0, Vout: 5 } },
      { name: "CE in saturation", note: "Below V_CE ≈ 0.2 V both junctions are forward-biased and I_C can no longer follow βI_B: the saturation (switch-on) region.", values: { beta: 100, cfg: "ce", IB: 0.3, ICEO: 10, Vout: 0.1 } },
    ] },
  { id: "hparam", title: "h-parameter CE amplifier & emitter follower", where: [["ECT-001", 3]], blurb: "Build the low-frequency h-parameter model in 3-D and get A_i, R_i, A_v and R_o exactly, for a common-emitter stage or an emitter follower.", topics: ["h-parameter model of BJT at low frequency", "Calculation of current gain, voltage gain, input resistance and output resistance of single stage BJT amplifier in CE configuration", "Same calculations for CC configuration (emitter follower)"], animated: true,
    presets: [
      { name: "Classic CE example", note: "h_ie = 1.1 kΩ, h_re = 2.5×10⁻⁴, h_fe = 50, h_oe = 24 µA/V, R_L = 10 kΩ, R_s = 1 kΩ: A_i = −40.3, R_i ≈ 999 Ω, A_v ≈ −404, A_vs ≈ −202, R_o ≈ 55 kΩ.", values: { hfe: 50, cfg: "ce", hie: 1.1, hre: 2.5, hoe: 24, RL: 10, Rs: 1 } },
      { name: "Approximate model", note: "With h_re = h_oe = 0: A_i = −h_fe = −50 and A_v = −h_fe R_L/h_ie = −50 × 10/1.1 ≈ −455; R_o becomes infinite.", values: { hfe: 50, cfg: "ce", hie: 1.1, hre: 0, hoe: 0, RL: 10, Rs: 1 } },
      { name: "Emitter follower", note: "Same transistor as CC: A_i = (1 + h_fe)/(1 + h_oe R_L) ≈ 41, A_v ≈ 0.998, R_i ≈ 412 kΩ and R_o ≈ 41 Ω.", values: { hfe: 50, cfg: "cc", hie: 1.1, hre: 2.5, hoe: 24, RL: 10, Rs: 1 } },
    ] },
  { id: "acload", title: "DC & AC load lines, maximum swing", where: [["ECT-001", 3]], blurb: "Graphical analysis of a CE amplifier: the DC load line, the steeper AC load line through Q, the operating point sliding along it and the output clipping at cut-off or saturation.", topics: ["Graphical analysis of CE amplifier (dc and ac load line)", "Concept of voltage and current gain"], animated: true,
    presets: [
      { name: "Q too low: cut-off clipping", note: "I_CQ = 2 mA, r_ac = 1 kΩ: the swing towards cut-off is only I_CQ r_ac = 2 V, so a 3 mA signal peak is flattened at I_C = 0.", values: { ICQ: 2, VCC: 12, RC: 2, RE: 0.5, RL: 2, ip: 3 } },
      { name: "Q too high: saturation clipping", note: "I_CQ = 4 mA leaves V_CEQ = 2 V, so the output bottoms out at V_CE = 0 after only 2 V of swing.", values: { ICQ: 4, VCC: 12, RC: 2, RE: 0.5, RL: 2, ip: 3 } },
      { name: "Optimum Q: biggest swing", note: "I_CQ = V_CC/(r_dc + r_ac) = 12/3.5 = 3.43 mA puts Q at the middle of the AC line: about 6.9 V peak-to-peak without clipping.", values: { ICQ: 3.43, VCC: 12, RC: 2, RE: 0.5, RL: 2, ip: 3.4 } },
    ] },
  { id: "mosdepenh", title: "Depletion vs enhancement MOSFET", where: [["ECT-001", 4]], blurb: "A 3-D MOSFET cross-section where the channel is induced (E-MOSFET) or built in (D-MOSFET). Compare the transfer characteristics and watch the channel pinch off at the drain.", topics: ["Metal-oxide field-effect transistor (MOSFET)", "Depletion and enhancement type: construction, operation and characteristics", "Concept of pinch-off"], animated: true,
    presets: [
      { name: "Textbook E-MOSFET", note: "V_T = 2 V, k = 0.278 mA/V²: I_D = 0.278(8 − 2)² ≈ 10 mA at V_GS = 8 V. Below 2 V no inversion layer forms and I_D = 0.", values: { VGS: 8, type: "enh", VDS: 15, VT: 2, k: 0.278, IDSS: 6, VP: -3 } },
      { name: "D-MOSFET, depletion mode", note: "I_DSS = 6 mA, V_P = −3 V: at V_GS = −1 V the built-in channel is partly depleted, I_D = 6(1 − 1/3)² = 2.67 mA.", values: { VGS: -1, type: "dep", VDS: 10, VT: 2, k: 0.278, IDSS: 6, VP: -3 } },
      { name: "D-MOSFET, enhancement mode", note: "A positive gate pulls extra electrons into the channel: I_D = 6(1 + 1/3)² = 10.67 mA, more than I_DSS.", values: { VGS: 1, type: "dep", VDS: 10, VT: 2, k: 0.278, IDSS: 6, VP: -3 } },
    ] },
  { id: "jfetbias", title: "JFET bias: fixed, self & divider", where: [["ECT-001", 4]], blurb: "Find the JFET's Q point where the bias line crosses Shockley's parabola, for fixed, self and voltage-divider bias, and see V_DD shared between R_D, the FET and R_S.", topics: ["Self-bias circuit", "Fixed-bias circuit", "Output and transfer characteristics", "Concept of pinch-off"], animated: true,
    presets: [
      { name: "PYQ: self-bias", note: "V_GS = −I_D × 1 kΩ with I_D = 10(1 − V_GS/(−4))²: I_D ≈ 2.15 mA, V_GS ≈ −2.15 V and V_DS = 20 − 2.15 × 7 ≈ 4.97 V.", values: { RS: 1, mode: "self", VDD: 20, RD: 6, VGG: 2, R1: 2.1, R2: 0.27, IDSS: 10, VP: -4 } },
      { name: "Fixed bias", note: "V_GS = −V_GG = −2 V directly, so I_D = 10(1 − 2/8)² = 5.625 mA and V_DS = 16 − 5.625 × 1.2 = 9.25 V.", values: { RS: 1, mode: "fixed", VDD: 16, RD: 1.2, VGG: 2, R1: 2.1, R2: 0.27, IDSS: 10, VP: -8 } },
      { name: "Voltage-divider bias", note: "V_G = 16 × 0.27/2.37 = 1.82 V and V_GS = 1.82 − 1.5I_D: I_D ≈ 2.4 mA, V_GS ≈ −1.8 V.", values: { RS: 1.5, mode: "divider", VDD: 16, RD: 2.4, VGG: 2, R1: 2.1, R2: 0.27, IDSS: 8, VP: -4 } },
    ] },
  { id: "fetamp", title: "FET amplifiers: CS, CD & CG", where: [["ECT-001", 4]], blurb: "Ground the source, drain or gate of a 3-D FET and watch the input and output waves: voltage gain, phase, input and output impedance for each configuration.", topics: ["CG, CS and CD configurations", "Calculation of voltage gain, input and output resistances of single stage FET amplifiers in CG, CS and CD configurations"], animated: true,
    presets: [
      { name: "Common source (textbook)", note: "g_m = 1.875 mS, r_d = 25 kΩ, R_D = 2 kΩ: A_v = −g_m(r_d ‖ R_D) ≈ −3.47 (180° phase), Z_i = R_G = 1 MΩ, Z_o ≈ 1.85 kΩ.", values: { gm: 1.875, cfg: "cs", rd: 25, RD: 2, RS: 2.2, load: false, RL: 10, RG: 1, vin: 50 } },
      { name: "Source follower", note: "A_v = g_m R′/(1 + g_m R′) ≈ 0.83 with no phase shift, and Z_o ≈ 360 Ω: a buffer.", values: { gm: 2.275, cfg: "cd", rd: 40, RD: 2, RS: 2.2, load: false, RL: 10, RG: 1, vin: 50 } },
      { name: "Common gate", note: "A_v ≈ 7.5 in phase (g_m R_D = 7.9 if r_d were infinite), but the input impedance is only R_S ‖ (r_d + R_D)/(1 + g_m r_d) ≈ 340 Ω.", values: { gm: 2.2, cfg: "cg", rd: 50, RD: 3.6, RS: 1.1, load: false, RL: 10, RG: 1, vin: 50 } },
    ] },
  { id: "universal", title: "Universal gates: NAND & NOR builder", where: [["ECT-001", 5]], blurb: "Build NOT, AND, OR, NAND, NOR, XOR or XNOR from NAND gates only or NOR gates only, in 3-D, and flip the inputs to watch every wire.", topics: ["Concept of universal gate (NAND and NOR)", "Logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)", "Boolean algebra (laws and theorems)"], animated: true,
    presets: [
      { name: "XOR from four NANDs", note: "X = (AB)′ feeds two more NANDs with A and B; a fourth NAND combines them. A = 1, B = 0 gives Y = 1.", values: { tpd: 10, base: "nand", target: "xor", a: true, b: false } },
      { name: "PYQ: OR from NAND only", note: "Invert each input with a NAND, then NAND them: (A′·B′)′ = A + B by De Morgan's theorem (3 gates, 2 levels).", values: { tpd: 10, base: "nand", target: "or", a: false, b: true } },
      { name: "PYQ: AND from NOR only", note: "Invert each input with a NOR, then NOR them: (A′ + B′)′ = A·B (3 gates).", values: { tpd: 10, base: "nor", target: "and", a: true, b: true } },
    ] },
  { id: "numbase", title: "Number systems with fractions", where: [["ECT-001", 5]], blurb: "Convert integers and fractions between decimal, binary, octal and hexadecimal by repeated division and multiplication, with 3-D bit cubes grouped in threes or fours.", topics: ["Number systems (binary, octal, decimal, hexadecimal)", "Conversions of bases"], animated: true,
    presets: [
      { name: "PYQ: (229.225)₁₀", note: "229 = 1110 0101₂ = E5₁₆; 0.225 × 2 → .0011 1001 1… (does not terminate), so 229.225 ≈ 11100101.0011100110₂ ≈ E5.399₁₆.", values: { n: 229, frac: 0.225, group: "hex" } },
      { name: "PYQ: (1BD.A0)₁₆", note: "1×256 + 11×16 + 13 + 10/16 = 445.625; in binary each hex digit is four bits: 0001 1011 1101 . 1010.", values: { n: 445, frac: 0.625, group: "hex" } },
      { name: "PYQ: (436.21)₈ to binary", note: "Each octal digit becomes three bits: 100 011 110 . 010 001₂ = 286.265625₁₀.", values: { n: 286, frac: 0.265625, group: "oct" } },
    ] },
  { id: "opreal", title: "Ideal vs real op-amp: virtual ground & slew rate", where: [["ECT-001", 5]], blurb: "An inverting or non-inverting amplifier with a finite open-loop gain and slew rate: see the virtual ground, the gain error and the output turning into a triangle above f_max.", topics: ["Concept of ideal operational amplifiers", "Ideal op-amp parameters", "Inverting amplifier", "Non-inverting amplifier", "Unity gain amplifier (voltage follower)"], animated: true,
    presets: [
      { name: "PYQ: design a gain of −3", note: "Inverting amplifier with R_f = 30 kΩ and R_1 = 10 kΩ: A_v = −R_f/R_1 = −3. With A = 10⁵ the real gain is −2.99988.", values: { Rf: 30, cfg: "inv", R1: 10, logA: 5, vin: 1, f: 1, SR: 0.5 } },
      { name: "PYQ: 741 slew-rate limit", note: "Gain −10 gives a 10 V peak; f_max = SR/2πV_m = 0.5 V/µs ÷ (2π × 10 V) ≈ 7.96 kHz, so at 20 kHz the output becomes a smaller triangle.", values: { Rf: 100, cfg: "inv", R1: 10, logA: 5.3, vin: 1, f: 20, SR: 0.5 } },
      { name: "Voltage follower", note: "Non-inverting with R_f = 0: gain 1 (β = 1), so even a modest A = 10³ gives 0.999. Used as a buffer.", values: { Rf: 0, cfg: "noninv", R1: 10, logA: 3, vin: 2, f: 1, SR: 0.5 } },
    ] },
];
