import type { LabMeta } from "../types";

/** Basic Mechanical Engineering (MET-001) labs. */
export const MECH_LABS: LabMeta[] = [
  { id: "incline", title: "Block on an inclined plane (friction)", where: [["MET-001", 1]], blurb: "Tilt a ramp, set the mass, friction coefficients and a pushing force; see the free-body diagram, when the block starts to slide and how fast it accelerates.", topics: ["Free body diagrams", "Static and kinetic friction", "Angle of repose"], animated: true,
    presets: [
      { name: "About to slip", note: "The angle of repose is arctan(μs) = 26.6° for μs = 0.5: just past it the block slides even with no push.", values: { theta: 28, m: 10, muS: 0.5, muK: 0.4, P: 0 } },
      { name: "Held at rest by friction", note: "At 20° the down-slope pull W sinθ is smaller than the limiting friction μs·N, so friction exactly balances it and the block stays put.", values: { theta: 20, m: 10, muS: 0.5, muK: 0.4, P: 0 } },
      { name: "Pushed up the slope", note: "A push of 200 N up the ramp at 30° beats W sinθ plus friction, so the block accelerates up the slope.", values: { theta: 30, m: 10, muS: 0.5, muK: 0.4, P: 200 } },
    ] },
  { id: "moi", title: "Moment of inertia of sections", where: [["MET-001", 1]], blurb: "Pick a rectangle, circle, tube, I-section or T-section and read the area, centroid, I_x, I_y and I about a parallel axis (parallel axis theorem).", topics: ["Moment of inertia (area)", "Parallel axis theorem", "Perpendicular axis theorem"], animated: true,
    presets: [
      { name: "Rectangle 100 × 150", note: "I_x = bd³/12 = 2.81 × 10⁷ mm⁴; the tall way round is stiffer in bending than the flat way (I_y).", values: { b: 100, d: 150, tf: 15, tw: 10, h: 0, sec: "rect" } },
      { name: "Shift the axis by 80 mm", note: "Parallel axis theorem: I = I_x + A·h². The moment of inertia grows fast with distance from the centroid.", values: { b: 100, d: 150, tf: 15, tw: 10, h: 80, sec: "rect" } },
      { name: "I-section beam", note: "Steel is moved to the flanges, far from the neutral axis, so the I-section has a high I_x for very little area.", values: { b: 100, d: 200, tf: 15, tw: 8, h: 0, sec: "isec" } },
    ] },
  { id: "tensile", title: "Tensile test & stress–strain curve", where: [["MET-001", 2]], blurb: "Stretch mild steel, aluminium, copper or cast iron: watch the bar elongate, neck and break while a dot moves along the stress–strain curve.", topics: ["Hooke's law", "Stress–strain diagram for ductile materials", "Brittle fracture"], animated: false,
    presets: [
      { name: "Steel, elastic limit", note: "At about 0.125 % strain, mild steel reaches its yield stress of 250 MPa. Below that Hooke's law σ = Eε holds and the bar springs back.", values: { eps: 0.125, L0: 100, d0: 10, mat: "steel" } },
      { name: "Steel, necking", note: "Beyond the ultimate stress (410 MPa, at 18 % strain) the bar necks down and the engineering stress falls until it breaks at 25 %.", values: { eps: 22, L0: 100, d0: 10, mat: "steel" } },
      { name: "Cast iron snaps", note: "A brittle material: no yield plateau, almost no plastic strain, and fracture at 0.5 % strain.", values: { eps: 0.5, L0: 100, d0: 10, mat: "ci" } },
    ] },
  { id: "bernoulli", title: "Venturi meter & Bernoulli", where: [["MET-001", 3]], blurb: "Pump water through a narrowing pipe: speed rises and pressure falls in the throat; read velocities, pressure drop and the manometer deflection.", topics: ["Bernoulli's equation", "Continuity equation", "Manometer"], animated: true,
    presets: [
      { name: "Gentle flow", note: "5 L/s through a 100 mm pipe narrowing to 50 mm: the water speeds up fourfold in the throat and its pressure drops by about 3 kPa.", values: { Q: 5, D1: 100, D2: 50, Cd: 0.98 } },
      { name: "Tight throat", note: "Halving the throat diameter again multiplies the pressure drop by 16 (v₂ ∝ 1/D²), so the manometer reading soars.", values: { Q: 5, D1: 100, D2: 30, Cd: 0.98 } },
      { name: "Fast, wide pipe", note: "A large flow through a wide pipe: the velocity head and the pressure drop scale with Q².", values: { Q: 20, D1: 150, D2: 100, Cd: 0.95 } },
    ] },
  { id: "carnot", title: "Heat engine, refrigerator & heat pump", where: [["MET-001", 4]], blurb: "Between a hot and a cold reservoir, compare an actual device with the Carnot limit; read efficiency or COP, heat flows, work and entropy generation.", topics: ["Heat engines", "COP of refrigerator and heat pump", "Carnot cycle"], animated: true,
    presets: [
      { name: "Carnot limit engine", note: "Between 600 K and 300 K no engine can beat η = 1 − T_C/T_H = 50 %. Running at 100 % of it generates no entropy.", values: { TH: 600, TC: 300, input: 100, frac: 1, dev: "engine" } },
      { name: "Refrigerator", note: "A refrigerator between 300 K and 270 K has a Carnot COP of 9; real ones reach a fraction of it and generate entropy.", values: { TH: 300, TC: 270, input: 1, frac: 0.5, dev: "fridge" } },
      { name: "Heat pump in winter", note: "Moving heat costs less work than making it: a heat pump between 275 K outside and 300 K inside can deliver several kW of heat per kW of electricity.", values: { TH: 300, TC: 275, input: 2, frac: 0.5, dev: "pump" } },
    ] },
  { id: "diesel", title: "Diesel cycle vs Otto cycle", where: [["MET-001", 5]], blurb: "A piston follows the P–V loop of the air-standard Diesel cycle; change the compression and cut-off ratios and compare efficiency and mean effective pressure with the Otto cycle.", topics: ["Diesel cycle", "Mean effective pressure", "Compression ratio"], animated: true,
    presets: [
      { name: "Typical diesel", note: "r = 18, cut-off ratio 2: η = 1 − r^(1−γ)(ρ^γ − 1)/(γ(ρ − 1)) ≈ 63 %, well above a petrol engine at r = 9.", values: { r: 18, rho: 2, g: 1.4 } },
      { name: "Small cut-off", note: "As the cut-off ratio ρ → 1 the Diesel efficiency approaches the Otto efficiency 1 − r^(1−γ) at the same r.", values: { r: 18, rho: 1.2, g: 1.4 } },
      { name: "Low compression", note: "Lowering r to 10 cuts the efficiency: less compression means less of the heat is turned into work.", values: { r: 10, rho: 2.5, g: 1.4 } },
    ] },
];
