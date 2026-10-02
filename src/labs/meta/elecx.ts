import type { LabMeta } from "../types";

/** Extra Basic Electrical (EET-001) labs built from the PYQ lab blueprints. */
export const ELECX_LABS: LabMeta[] = [
  { id: "transient", title: "RC & RL transients", where: [["EET-001", 1]], blurb: "Close the switch on a DC source and watch a capacitor charge or an inductor's current build up with time constant τ = RC or L/R.", topics: ["First-order circuits", "Time constant", "Transient response"], animated: true,
    presets: [
      { name: "One time constant", note: "1 kΩ and 100 μF give τ = 0.1 s. At t = 100 ms the capacitor has reached 63.2 % of the supply.", values: { mode: "rc", V: 10, R: 1000, C: 100, t: 100 } },
      { name: "Nearly charged (5τ)", note: "After 5τ = 500 ms the capacitor is at 99.3 % and the current has almost stopped: in DC steady state a capacitor is an open circuit.", values: { mode: "rc", V: 10, R: 1000, C: 100, t: 500 } },
      { name: "Coil current rising", note: "500 mH and 1 kΩ: τ = L/R = 0.5 ms. The inductor opposes the change, then behaves as a short circuit.", values: { mode: "rl", V: 10, R: 1000, L: 500, t: 1 } },
    ] },
  { id: "wattmeter", title: "Two-wattmeter method (3-phase)", where: [["EET-001", 2]], blurb: "Measure the power of a balanced three-phase load with two wattmeters. Change the power factor and see why one meter reads negative beyond 60°.", topics: ["Three-phase power", "Two-wattmeter method", "Power factor from readings"], animated: true,
    presets: [
      { name: "Unity power factor", note: "φ = 0: both meters read the same, and the total is √3 V_L I_L.", values: { VL: 415, IL: 20, phi: 0 } },
      { name: "φ = 60° lagging", note: "W₂ = V_L I_L cos(30° + 60°) = 0: all the power shows on one meter.", values: { VL: 415, IL: 20, phi: 60 } },
      { name: "Low power factor", note: "At 75° lag W₂ is negative: reverse its current coil and subtract. tan φ = √3(W₁ − W₂)/(W₁ + W₂) still gives the angle.", values: { VL: 415, IL: 20, phi: 75 } },
    ] },
  { id: "trtest", title: "Transformer OC/SC tests, efficiency & regulation", where: [["EET-001", 3]], blurb: "Run the open-circuit and short-circuit tests to find iron and copper losses, then load the transformer and track efficiency and voltage regulation.", topics: ["OC and SC tests", "Transformer efficiency", "Maximum efficiency", "Voltage regulation"], animated: true,
    presets: [
      { name: "Maximum efficiency", note: "Iron loss 0.25 kW and full-load copper loss 1 kW: efficiency peaks at x = √(0.25/1) = 0.5, where Cu loss = iron loss.", values: { mode: "load", kva: 10, Pi: 0.25, Pcu: 1, x: 0.5, pf: 1, R: 2, X: 4, lead: false } },
      { name: "Open-circuit test", note: "Secondary open: only the small magnetising current flows, so the wattmeter reads the iron loss.", values: { mode: "oc", kva: 10, Pi: 0.25, Pcu: 0.6, x: 0.75, pf: 0.8 } },
      { name: "Leading load", note: "With a leading (capacitive) power factor the regulation can go negative: the terminal voltage rises on load.", values: { mode: "load", kva: 10, Pi: 0.25, Pcu: 0.6, x: 1, pf: 0.6, R: 1, X: 5, lead: true } },
    ] },
  { id: "meters", title: "PMMC vs moving-iron meter", where: [["EET-001", 3]], blurb: "Pass DC or AC through a permanent-magnet moving-coil meter and a moving-iron meter. Compare their scales, see why the PMMC reads zero on AC, and design shunts and multipliers.", topics: ["PMMC instrument", "Moving-iron instrument", "Shunt and multiplier"], animated: true,
    presets: [
      { name: "PMMC on DC", note: "Deflection ∝ I: half the full-scale current gives half-scale deflection on a uniform scale.", values: { kind: "pmmc", I: 10, fsd: 20, ac: false } },
      { name: "PMMC on AC", note: "The torque reverses every half cycle and averages to zero: the needle just trembles at zero.", values: { kind: "pmmc", I: 10, fsd: 20, ac: true } },
      { name: "Moving iron on AC", note: "Torque ∝ I², so it works on AC and reads RMS, but half current gives only a quarter of the deflection.", values: { kind: "mi", I: 10, fsd: 20, ac: true } },
    ] },
  { id: "dcmachine", title: "DC generator & motor", where: [["EET-001", 4]], blurb: "Spin an armature between field poles: E = PΦZN/(60A) as a generator, or apply a voltage and watch the back EMF set the motor's speed.", topics: ["EMF equation", "Back EMF", "Lap and wave winding", "Speed and torque"], animated: true,
    presets: [
      { name: "Wave-wound generator", note: "4 poles, 480 conductors, 25 mWb, 1000 rpm, A = 2: E = 4 × 0.025 × 480 × 1000/120 = 400 V.", values: { mode: "gen", P: 4, Z: 480, phi: 25, lap: false, N: 1000, Ia: 20, Ra: 0.5 } },
      { name: "Shunt motor on load", note: "220 V supply, R_a = 0.5 Ω, 40 A: E_b = 200 V and the speed settles where the back EMF equals that.", values: { mode: "motor", P: 4, Z: 480, phi: 25, lap: true, V: 220, Ia: 40, Ra: 0.5 } },
      { name: "Weak field speeds it up", note: "Cutting the flux to 15 mWb raises the motor speed: N ∝ E_b/Φ.", values: { mode: "motor", P: 4, Z: 480, phi: 15, lap: true, V: 220, Ia: 40, Ra: 0.5 } },
    ] },
  { id: "torqueslip", title: "Induction motor torque–slip curve", where: [["EET-001", 4]], blurb: "Three-phase currents make a rotating field; the rotor follows at a slip. Change rotor resistance, voltage and load and find maximum torque, starting torque and the running speed.", topics: ["Torque–slip characteristic", "Slip", "Maximum torque", "Starting torque"], animated: true,
    presets: [
      { name: "Normal running", note: "A 150 N·m load is carried at a few percent slip on the stable, steep part of the curve.", values: { V: 100, R2: 0.2, X2: 1, TL: 150, f: 50, poles: 4 } },
      { name: "Higher rotor resistance", note: "Doubling R₂ moves maximum torque to a higher slip (s_m = R₂/X₂) without changing its size: better starting torque (slip-ring motors).", values: { V: 100, R2: 0.4, X2: 1, TL: 150, f: 50, poles: 4 } },
      { name: "Voltage sag stalls it", note: "Torque ∝ V². At 60 % voltage the maximum torque falls to 36 % and this load can stall the motor.", values: { V: 60, R2: 0.2, X2: 1, TL: 300, f: 50, poles: 4 } },
    ] },
  { id: "powergrid", title: "Generation to your home: transmission", where: [["EET-001", 5]], blurb: "Send power from a station over a high-voltage line to a substation and on to homes. Raise the line voltage and watch the current and the I²R losses fall.", topics: ["Power transmission", "Why high voltage", "Line losses", "Distribution"], animated: true,
    presets: [
      { name: "220 kV line", note: "100 MW over 150 km at 220 kV: about 290 A and roughly 2–3 % loss.", values: { P: 100, kV: "220", km: 150, r: 0.07, pf: 0.9 } },
      { name: "Same power at 66 kV", note: "At 66 kV the current is 3.3× larger and the loss 11× larger: that is why long lines use high voltage.", values: { P: 100, kV: "66", km: 150, r: 0.07, pf: 0.9 } },
    ] },
  { id: "earthing", title: "Earthing & lead–acid battery", where: [["EET-001", 5]], blurb: "Size a pipe or plate earth for your soil, see the fault current and touch voltage, and check whether the MCB trips. Then discharge a lead–acid battery.", topics: ["Pipe and plate earthing", "Earth resistance", "Touch voltage", "Lead–acid battery"], animated: true,
    presets: [
      { name: "Good pipe earth", note: "A 3 m, 38 mm pipe in 100 Ω·m soil gives about 30 Ω. Salt and charcoal halve the soil resistivity around it.", values: { mode: "pipe", rho: 100, L: 3, d: 38, salt: true, mcb: 16 } },
      { name: "Dry rocky soil", note: "1000 Ω·m soil makes the earth resistance so high that a fault current cannot trip a 16 A MCB: the metal body stays live. Use an RCCB.", values: { mode: "pipe", rho: 1000, L: 3, d: 38, salt: false, mcb: 16 } },
      { name: "Inverter battery", note: "A 100 Ah battery supplying 10 A lasts less than 10 h (Peukert effect), and its acid gets lighter as it discharges.", values: { mode: "battery", Ah: 100, I: 10, soc: 80 } },
    ] },
];
