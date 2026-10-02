import type { LabMeta } from "../types";

/** Basic Electrical Engineering (EET-001) labs. */
export const ELEC_LABS: LabMeta[] = [
  { id: "thevenin", title: "Thevenin equivalent & maximum power", where: [["EET-001", 1]], blurb: "Replace a source and two resistors by V_th in series with R_th, slide the load, and watch the power curve peak exactly where R_L = R_th.", topics: ["Thevenin's theorem", "Maximum power transfer", "Kirchhoff's laws"], animated: true,
    presets: [
      { name: "Matched load", note: "R_th = R1‖R2 = 6.67 Ω. Setting R_L to about 6.7 Ω delivers the most power, P_max = V_th²/4R_th, but only half the battery power reaches the load.", values: { V: 12, R1: 10, R2: 20, RL: 6.67 } },
      { name: "Light load, high efficiency", note: "A large R_L takes little current, so little power is lost in the source: efficiency is high but the load power is far from the peak.", values: { V: 12, R1: 10, R2: 20, RL: 150 } },
      { name: "Heavy 48 V feed", note: "Higher supply and a smaller R1 raise both V_th and the peak power; the curve keeps its maximum at R_L = R_th.", values: { V: 48, R1: 4, R2: 12, RL: 3 } },
    ] },
  { id: "threephase", title: "Three-phase star and delta", where: [["EET-001", 2]], blurb: "Rotating phasors and sine waves for a balanced three-phase load; switch star and delta and read line values, real, reactive and apparent power.", topics: ["Three-phase AC", "Star and delta connection", "Power factor and power"], animated: true,
    presets: [
      { name: "400 V supply, star, 0.87 pf", note: "On a 400 V line supply each star phase sees V_ph = 400/√3 ≈ 231 V and I_L = I_ph. A 30° lagging load has cos φ ≈ 0.87.", values: { VL: 400, Z: 20, phi: 30, conn: "star", lead: false } },
      { name: "Same load in delta", note: "Delta puts the full 400 V across each phase, so I_ph is √3 times bigger and I_L = √3·I_ph: three times the power of the same load connected in star on the same supply.", values: { VL: 400, Z: 20, phi: 30, conn: "delta", lead: false } },
      { name: "Leading (capacitive) load", note: "A capacitive load makes each current lead its voltage; Q changes sign to negative (leading) while P stays the same.", values: { VL: 400, Z: 20, phi: 45, conn: "star", lead: true } },
    ] },
  { id: "hysteresis", title: "B–H hysteresis loop & core loss", where: [["EET-001", 3]], blurb: "Drive a magnetic core around its B–H loop, choose the material and peak field, and read retentivity, coercivity, loop area and the hysteresis loss.", topics: ["Magnetic circuits", "Hysteresis loss", "Soft and hard magnetic materials"], animated: true,
    presets: [
      { name: "Silicon steel core", note: "A narrow loop (H_c ≈ 40 A/m) means little loss per cycle, which is why transformer cores are silicon steel.", values: { hpk: 1.5, f: 50, vol: 100, mat: "silicon" } },
      { name: "Hard steel magnet", note: "H_c = 5000 A/m: a very wide loop with large retentivity, ideal for a permanent magnet and terrible for a core (huge loss).", values: { hpk: 1.5, f: 50, vol: 100, mat: "hardsteel" } },
      { name: "Small-amplitude loop", note: "Not driven into saturation, the loop is a thin minor loop, so the loss per cycle drops much faster than the peak field.", values: { hpk: 0.3, f: 50, vol: 100, mat: "softiron" } },
    ] },
  { id: "transformer", title: "Single-phase transformer", where: [["EET-001", 3]], blurb: "Change the turns, supply voltage, frequency and core area; watch the flux circulate and check V₂, I₁, I₂ and the flux density against saturation.", topics: ["Transformer EMF equation", "Turns ratio", "Core saturation"], animated: true,
    presets: [
      { name: "230 V to 46 V step-down", note: "N1:N2 = 500:100 = 5:1 gives V₂ = 46 V and I₁ = I₂/5. B_m ≈ 1.04 T on a 20 cm² core.", values: { V1: 230, N1: 500, N2: 100, f: 50, RL: 10, A: 20 } },
      { name: "Step-up to 2300 V", note: "Ten times more secondary turns give ten times the voltage and a tenth of the current.", values: { V1: 230, N1: 200, N2: 2000, f: 50, RL: 500, A: 30 } },
      { name: "Saturated core", note: "Halving the turns or the core area doubles B_m = V₁/(4.44 f N₁ A): above about 1.6 T the core saturates and a real transformer would draw a huge magnetising current.", values: { V1: 230, N1: 120, N2: 60, f: 50, RL: 20, A: 10 } },
    ] },
  { id: "rotatingfield", title: "Rotating magnetic field & induction motor", where: [["EET-001", 4]], blurb: "Three currents 120° apart make a field that turns; change frequency, poles and slip, and swap two phases to reverse the motor.", topics: ["Rotating magnetic field", "Synchronous speed", "Slip of an induction motor"], animated: true,
    presets: [
      { name: "2-pole, 50 Hz", note: "N_s = 120f/P = 3000 rpm. At 4 % slip the rotor turns at 2880 rpm and the rotor currents have frequency s·f = 2 Hz.", values: { f: 50, poles: 2, slip: 0.04, slow: 0.5, reverse: false } },
      { name: "6-pole, slower motor", note: "Three pole pairs make the field turn three times slower: N_s = 1000 rpm at 50 Hz.", values: { f: 50, poles: 6, slip: 0.05, slow: 0.5, reverse: false } },
      { name: "Reverse two phases", note: "Swapping any two supply lines reverses the phase sequence, and the field, and so the rotor, turn the other way.", values: { f: 50, poles: 4, slip: 0.03, slow: 0.5, reverse: true } },
    ] },
];
