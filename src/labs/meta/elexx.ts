import type { LabMeta } from "../types";

/** Extra Basic Electronics (ECT-001) labs built from the PYQ lab blueprints. */
export const ELEXX_LABS: LabMeta[] = [
  { id: "semicond", title: "Semiconductor bands, doping & drift", where: [["ECT-001", 1], ["AHT-001", 5]], blurb: "A silicon lattice with thermally freed carriers, donors and acceptors. Heat it, dope it and apply a field: watch n, p, the Fermi level and the conductivity change.", topics: ["Intrinsic and extrinsic semiconductors", "Law of mass action", "Fermi level", "Drift current and conductivity"], animated: true,
    presets: [
      { name: "PYQ: 10¹⁷ phosphorus", note: "n ≈ N_D = 10¹⁷ cm⁻³, p = n_i²/n ≈ 2250 cm⁻³, σ = qnμ_n ≈ 22 S/cm. E_F moves up towards E_c.", values: { mat: "si", T: 300, type: "n", logN: 17, E: 100 } },
      { name: "Intrinsic silicon", note: "Only thermally broken bonds: n = p = n_i = 1.5×10¹⁰ cm⁻³, E_F in the middle of the gap, σ ≈ 4×10⁻⁶ S/cm.", values: { mat: "si", T: 300, type: "intrinsic", logN: 16, E: 100 } },
      { name: "Hot germanium", note: "Germanium's smaller gap gives many more carriers, and at 400 K intrinsic carriers swamp light doping.", values: { mat: "ge", T: 400, type: "p", logN: 14, E: 100 } },
    ] },
  { id: "clipper", title: "Clippers & clampers", where: [["ECT-001", 2]], blurb: "Feed a sine wave through diode wave-shaping circuits: clip off the top or bottom at a reference level, or clamp the whole wave up or down.", topics: ["Clipper circuits", "Clamper circuits", "Transfer characteristic"], animated: true,
    presets: [
      { name: "PYQ: biased clipper", note: "5 sin ωt with a 1 V reference and a silicon diode: the output is clipped flat at 1.7 V.", values: { mode: "posclip", Vm: 5, Vref: 1, ideal: false } },
      { name: "Negative clamper", note: "The capacitor charges to the peak, holding the top of the wave at +0.7 V: the 20 V peak-to-peak is kept but shifted down.", values: { mode: "negclamp", Vm: 10, Vref: 0, ideal: false } },
      { name: "Two-level limiter", note: "Two biased diodes clip both halves at ±(V_ref + 0.7) V: a crude square wave.", values: { mode: "dualclip", Vm: 8, Vref: 2, ideal: false } },
    ] },
  { id: "zener", title: "Zener voltage regulator", where: [["ECT-001", 2]], blurb: "Vary the input and the load current of a Zener shunt regulator and watch the Zener absorb the change to hold the output steady, until it drops out or overheats.", topics: ["Zener diode", "Line regulation", "Load regulation", "Zener power rating"], animated: true,
    presets: [
      { name: "Regulating", note: "16 V in, 220 Ω, 10 V Zener, 20 mA load: the Zener takes the extra ~7 mA and the output stays at 10 V.", values: { Vin: 16, Rs: 220, Vz: 10, IL: 20, Pz: 500 } },
      { name: "Drop-out", note: "With 12 V in and 30 mA load the resistor drops too much: the Zener turns off and the output sags below 10 V.", values: { Vin: 12, Rs: 220, Vz: 10, IL: 30, Pz: 500 } },
      { name: "No load, high input", note: "30 V with no load dumps ~90 mA into the Zener: about 0.9 W, beyond a 500 mW part.", values: { Vin: 30, Rs: 220, Vz: 10, IL: 0, Pz: 500 } },
    ] },
  { id: "biasstab", title: "BJT bias stability & CE amplifier", where: [["ECT-001", 3]], blurb: "Heat a transistor and watch the Q-point of a fixed-bias stage run towards saturation while a voltage-divider stage barely moves. Then read the small-signal gain.", topics: ["Transistor biasing", "Stability factor", "Thermal runaway", "CE amplifier gain"], animated: true,
    presets: [
      { name: "Divider bias at 25 °C", note: "R₁ = 47 kΩ, R₂ = 10 kΩ, R_E = 1 kΩ: I_C ≈ 1.3 mA, set mostly by the resistors, not by β.", values: { kind: "divider", T: 25 } },
      { name: "Fixed bias gets hot", note: "At 120 °C β and I_CBO have grown, and the fixed-bias Q-point slides towards saturation.", values: { kind: "fixed", T: 120, RB: 470 } },
      { name: "Divider bias at 120 °C", note: "The same heat moves the divider-biased Q-point only a little: R_E gives negative feedback.", values: { kind: "divider", T: 120 } },
    ] },
  { id: "jfet", title: "JFET channel & pinch-off", where: [["ECT-001", 4]], blurb: "An n-channel JFET in 3D: reverse-bias the gate and raise V_DS and watch the depletion regions squeeze the channel until it pinches off.", topics: ["JFET", "Pinch-off voltage", "Drain characteristics", "Shockley's equation"], animated: true,
    presets: [
      { name: "Ohmic region", note: "Low V_DS: the channel is open along its length and acts like a resistor.", values: { VGS: 0, VDS: 1.5, IDSS: 10, VP: -4 } },
      { name: "Pinched off", note: "V_DS beyond V_GS − V_P: the depletion regions meet at the drain end and I_D saturates at I_DSS(1 − V_GS/V_P)².", values: { VGS: -1, VDS: 12, IDSS: 10, VP: -4 } },
      { name: "Gate at cut-off", note: "V_GS = V_P = −4 V: the whole channel is depleted and no current flows.", values: { VGS: -4, VDS: 12, IDSS: 10, VP: -4 } },
    ] },
  { id: "kmap", title: "Karnaugh map minimiser", where: [["ECT-001", 5]], blurb: "Click cells of a 4-variable K-map, add don't-cares, and see the minimal SOP and POS groups light up with the NAND-gate count.", topics: ["Karnaugh map", "SOP and POS", "Don't-care conditions", "Universal gates"], animated: false,
    presets: [
      { name: "PYQ: Σm(7,9,…,15)", note: "Σm(7,9,10,11,12,13,14,15) minimises to AB + AC + AD + BCD: four quads/pairs.", values: { ones: 65152, dc: 0, useDc: false, form: "sop" } },
      { name: "PYQ: Σm(0,1,2,3,7,8,9,10,11,12,13)", note: "A different PYQ map: an octet B′ helps cover most cells.", values: { ones: 16271, dc: 0, useDc: false, form: "sop" } },
      { name: "Don't-cares help", note: "Σm(1,3,5) with d(7): using the don't-care turns three cells into one quad, A′D.", values: { ones: 42, dc: 128, useDc: true, form: "sop" } },
    ] },
];
