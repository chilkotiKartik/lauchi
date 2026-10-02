import type { LabMeta } from "../types";

/** Extra Basic Mechanical (MET-001) labs built from the PYQ lab blueprints. */
export const MECHX_LABS: LabMeta[] = [
  { id: "truss", title: "Truss forces by the method of joints", where: [["MET-001", 1]], blurb: "Load a Pratt, Howe or Warren truss and see every member go into tension (blue) or compression (red), solved joint by joint.", topics: ["Trusses", "Method of joints", "Perfect truss", "Tension and compression"], animated: false,
    presets: [
      { name: "Pratt bridge", note: "In a Pratt truss the diagonals are in tension and the verticals in compression under gravity loads: good for steel.", values: { type: "pratt", bays: 4, span: 12, h: 3, P: 10, W: 0 } },
      { name: "Howe roof", note: "The Howe layout flips the diagonals, putting them in compression (timber diagonals, steel verticals).", values: { type: "howe", bays: 4, span: 12, h: 3, P: 10, W: 0 } },
      { name: "Warren with a heavy load", note: "A Warren truss with a 60 kN extra load at mid-span: the top chord carries the biggest compression near the middle.", values: { type: "warren", bays: 4, span: 16, h: 3, P: 10, W: 60 } },
    ] },
  { id: "ladder", title: "Ladder friction & impending slip", where: [["MET-001", 1]], blurb: "Lean a ladder on a wall, send a person up it and check whether the floor friction can hold it. Find the minimum safe angle.", topics: ["Coulomb friction", "Ladder friction", "Equilibrium of rigid bodies", "Free body diagram"], animated: true,
    presets: [
      { name: "PYQ: smooth wall", note: "A 100 N ladder on a smooth wall with μ = 0.3 at the floor and no climber starts to slip at tan θ = 1/(2μ): θ = 59°.", values: { th: 59.5, k: 0, muf: 0.3, muw: 0, W: 100, Wm: 0, L: 5 } },
      { name: "Climber at the top", note: "PYQ Q1.5 (iii): 180 N ladder, 900 N man at the top, μ = 0.35 floor, 0.25 wall: at 60° it slips, so a horizontal push or a steeper angle is needed.", values: { th: 60, k: 1, muf: 0.35, muw: 0.25, W: 180, Wm: 900, L: 5 } },
      { name: "Safe and steep", note: "At 75° the same ladder holds the climber with a good margin.", values: { th: 75, k: 1, muf: 0.35, muw: 0.25, W: 180, Wm: 900, L: 5 } },
    ] },
  { id: "beam", title: "Beam SFD, BMD & bending", where: [["MET-001", 2]], blurb: "Put point loads and a UDL on a simply supported beam: the reactions, shear force and bending moment diagrams and the deflected shape update live.", topics: ["Shear force diagram", "Bending moment diagram", "Bending stress", "Point of maximum moment"], animated: false,
    presets: [
      { name: "PYQ: partial UDL", note: "9 m span with 10 kN/m over the first 6 m: R_A = 40 kN, shear is zero at 4 m where M_max = 80 kN·m.", values: { L: 9, w: 10, u1: 0, u2: 6, W: 0, a: 4.5 } },
      { name: "Central point load", note: "A single 40 kN load at mid-span of 6 m: triangular BMD with M_max = WL/4 = 60 kN·m.", values: { L: 6, w: 0, u1: 0, u2: 0, W: 40, a: 3 } },
      { name: "Full-span UDL", note: "20 kN/m over 8 m: parabolic BMD with wL²/8 = 160 kN·m at the centre.", values: { L: 8, w: 20, u1: 0, u2: 8, W: 0, a: 4 } },
    ] },
  { id: "pelton", title: "Pelton wheel", where: [["MET-001", 3]], blurb: "A high-head jet hits the split buckets of a Pelton wheel. Change the head, nozzle, wheel size and speed, and find the bucket speed that gives the best efficiency.", topics: ["Impulse turbine", "Pelton wheel", "Hydraulic efficiency", "Jet velocity"], animated: true,
    presets: [
      { name: "Best speed", note: "Efficiency peaks when the bucket speed is about half the jet speed (u/V ≈ 0.46–0.5).", values: { H: 300, d: 100, D: 1.5, rpm: 470 } },
      { name: "Too slow", note: "At low rpm the buckets barely move: lots of force but little power.", values: { H: 300, d: 100, D: 1.5, rpm: 150 } },
      { name: "High head", note: "1000 m of head gives a 136 m/s jet: Pelton wheels suit high-head, low-flow sites.", values: { H: 1000, d: 80, D: 2.5, rpm: 500 } },
    ] },
  { id: "pvwork", title: "Piston–cylinder boundary work", where: [["MET-001", 4]], blurb: "Expand or compress air behind a piston along isobaric, isochoric, isothermal, adiabatic or polytropic paths. The area under the P–V curve is the work.", topics: ["Displacement work", "First law for a closed system", "Polytropic process", "P–V diagram"], animated: true,
    presets: [
      { name: "PYQ: isothermal", note: "600 kPa, 0.03 → 0.09 m³ at constant temperature: W = p₁V₁ ln 3 = 19.8 kJ, and Q = W.", values: { proc: "isothermal", p1: 600, V1: 0.03, V2: 0.09, T1: 300 } },
      { name: "Adiabatic compression", note: "No heat crosses the boundary, so all the work input raises the internal energy and temperature.", values: { proc: "adiabatic", p1: 100, V1: 0.4, V2: 0.05, T1: 300 } },
      { name: "Constant pressure", note: "W = pΔV. Heat added at constant pressure both does work and raises internal energy.", values: { proc: "isobaric", p1: 200, V1: 0.1, V2: 0.3, T1: 300 } },
    ] },
  { id: "engine4s", title: "Four-stroke engine", where: [["MET-001", 5]], blurb: "A cut-away four-stroke engine: piston, connecting rod, crank and valves move through suction, compression, power and exhaust while a dot tracks the P–V diagram.", topics: ["Four-stroke cycle", "SI and CI engines", "Compression ratio", "Valve timing"], animated: true,
    presets: [
      { name: "Petrol engine", note: "Spark ignition at r = 9: air-standard Otto efficiency 58.5 %.", values: { fuel: "si", r: 9, rpm: 600, bore: 80, stroke: 90 } },
      { name: "Diesel engine", note: "Compression ignition needs r ≈ 18 so the air gets hot enough to light the injected fuel.", values: { fuel: "ci", r: 18, rpm: 600, bore: 100, stroke: 120 } },
      { name: "Power stroke", note: "Paused at 450°: both valves shut, burning gas pushes the piston down.", values: { fuel: "si", r: 9, rpm: 60, bore: 80, stroke: 90, crank: 450 } },
    ] },
  { id: "dualcycle", title: "Otto vs Diesel vs Dual cycle", where: [["MET-001", 5]], blurb: "Plot the three air-standard cycles on one P–V diagram for the same compression ratio and heat input and see why Otto > Dual > Diesel in efficiency.", topics: ["Otto cycle", "Diesel cycle", "Dual combustion cycle", "Mean effective pressure"], animated: false,
    presets: [
      { name: "Same r = 12", note: "Same compression ratio and heat: Otto adds all its heat at the smallest volume, so it is the most efficient.", values: { r: 12, q: 1200, rp: 1.5, T1: 300 } },
      { name: "Diesel-like r = 18", note: "Higher r raises every efficiency; real diesels win because they can use higher r than petrol engines.", values: { r: 18, q: 1200, rp: 1.5, T1: 300 } },
    ] },
];
