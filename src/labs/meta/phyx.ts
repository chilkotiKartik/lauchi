import type { LabMeta } from "../types";

/** Extra Engineering Physics (AHT-001) labs built from the PYQ lab blueprints. */
export const PHYX_LABS: LabMeta[] = [
  { id: "rayleigh", title: "Grating resolving power & Rayleigh's criterion", where: [["AHT-001", 1]], blurb: "Two close spectral lines through a diffraction grating: change the number of lines and the order and watch them go from blurred to just resolved to clearly split.", topics: ["Diffraction grating", "Rayleigh's criterion", "Resolving power R = nN"], animated: true,
    presets: [
      { name: "Sodium D lines, too few lines", note: "589.0 and 589.6 nm need R = λ/dλ ≈ 982. With 400 lines in the first order R = 400: the two peaks merge into one.", values: { N: 400, dlam: 0.6, lam: 589, lpm: 500, m: 1 } },
      { name: "Just resolved", note: "1000 lines give R = 1000, just above 982: one peak's maximum sits on the other's first minimum (Rayleigh's criterion).", values: { N: 1000, dlam: 0.6, lam: 589, lpm: 500, m: 1 } },
      { name: "Higher order helps", note: "The same 400 lines in the third order give R = 3 × 400 = 1200, enough to separate the sodium doublet.", values: { N: 400, dlam: 0.6, lam: 589, lpm: 500, m: 3 } },
    ] },
  { id: "laser", title: "He–Ne laser: pumping, gain & threshold", where: [["AHT-001", 2]], blurb: "A discharge excites helium, helium hands its energy to neon, and photons bounce between two mirrors. Change the current, gas mix, cavity length and output mirror and find the lasing threshold.", topics: ["Population inversion", "Stimulated emission", "He–Ne laser", "Optical resonator"], animated: true,
    presets: [
      { name: "Typical lab laser", note: "5 mA, He:Ne = 7:1, 30 cm cavity, 99 % output mirror: gain beats the losses and a red 632.8 nm beam comes out.", values: { I: 5, mix: 7, L: 30, R2: 99 } },
      { name: "Below threshold", note: "With only 1 mA the discharge cannot keep enough neon atoms inverted: the gain is less than the mirror loss, so there is only weak spontaneous glow.", values: { I: 1, mix: 7, L: 30, R2: 99 } },
      { name: "Leaky output mirror", note: "A 90 % mirror loses too much per round trip in a short tube: no lasing even at full current.", values: { I: 10, mix: 7, L: 15, R2: 90 } },
    ] },
  { id: "polarimeter", title: "Laurent's half-shade polarimeter", where: [["AHT-001", 2]], blurb: "A sugar solution rotates the plane of polarisation. Turn the analyser until both halves of the field look equally dark and read off the specific rotation.", topics: ["Optical activity", "Specific rotation", "Half-shade polarimeter"], animated: true,
    presets: [
      { name: "10 % cane sugar", note: "θ = S l c = 66.5 × 2 dm × 0.10 = 13.3°. The halves match when the analyser is at 90° + 13.3° = 103.3°.", values: { c: 10, l: 20, an: 103.3, sample: "sucrose" } },
      { name: "Pure water (zero)", note: "Water is optically inactive: the halves match at exactly 90°. This is how the instrument is zeroed first.", values: { c: 10, l: 20, an: 90, sample: "water" } },
      { name: "Fructose turns left", note: "Fructose is laevorotatory (S = −92.4°): a 15 % solution in 20 cm turns the plane by −27.7°, so the match is near 62.3°.", values: { c: 15, l: 20, an: 62.3, sample: "fructose" } },
    ] },
  { id: "solarcell", title: "Solar cell & LED", where: [["AHT-001", 5], ["ECT-001", 1]], blurb: "One p–n junction, two jobs. In sunlight it separates electron–hole pairs and drives a load; forward-biased it recombines them and glows at λ = hc/E_g.", topics: ["Photovoltaic effect", "Fill factor", "LED and band gap", "I–V characteristics"], animated: true,
    presets: [
      { name: "Full sun, matched load", note: "1000 W/m² on a 100 cm² silicon cell: I_sc ≈ 3.5 A, V_oc ≈ 0.65 V. A 0.15 Ω load sits close to the maximum-power point.", values: { mode: "solar", G: 1000, A: 100, T: 300, R: 0.15 } },
      { name: "Hot afternoon", note: "At 345 K the dark current rises a lot, V_oc drops by about 2 mV/K and the efficiency falls even though the light is the same.", values: { mode: "solar", G: 1000, A: 100, T: 345, R: 0.15 } },
      { name: "Red LED", note: "GaAsP (E_g = 1.9 eV) at 1.95 V: it turns on and glows red near 650 nm.", values: { mode: "led", mat: "gaasp", V: 1.95 } },
    ] },
];
