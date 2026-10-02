import type { LabMeta } from "../types";

/** Round-3 labs (group elecy): fills every unit of the core subjects to at least five labs. */
export const ELECY_LABS: LabMeta[] = [
  { id: "kirchhoff", title: "KCL, KVL, mesh & node analysis", where: [["EET-001", 1]], blurb: "Two batteries feed a shared resistor. The circuit is drawn as a potential landscape: batteries lift charges up, resistors let them fall, and every closed loop comes back to the same height (KVL).", topics: ["Kirchhoff current law (KCL)", "Kirchhoff voltage law (KVL)", "Mesh and node analysis of dc circuits", "Voltage sources and current sources (ideal and practical)"], animated: true,
    presets: [
      { name: "PYQ: 10 V and 20 V sources, 40 Ω branch", note: "10 V behind 10 Ω and 20 V behind 20 Ω across 40 Ω: the node equation gives V_A = 80/7 = 11.43 V and 0.286 A in the 40 Ω branch. I₁ comes out negative: the 20 V source is charging the 10 V one.", values: { V1: 10, R1: 10, V2: 20, R2: 20, R3: 40 } },
      { name: "A source that delivers nothing", note: "12 V behind 4 Ω with 12 Ω to ground makes V_A = 9 V. A 9 V second source then sees no voltage across R2, so I₂ = 0: it floats at exactly the node voltage.", values: { V1: 12, R1: 4, V2: 9, R2: 6, R3: 12 } },
      { name: "Opposing polarity", note: "Reverse the second battery (−12 V). It now absorbs power while the 24 V source supplies both it and R3; KCL still balances at node A.", values: { V1: 24, R1: 5, V2: -12, R2: 10, R3: 20 } },
    ] },
  { id: "superposition", title: "Superposition & Norton's theorem", where: [["EET-001", 1]], blurb: "Three stacked copies of one circuit: the voltage source alone, the current source alone, and both. The load currents add up layer by layer, but the powers do not. Then see the Norton equivalent.", topics: ["Superposition theorem", "Norton theorem", "Thevenin theorem", "Voltage sources and current sources (ideal and practical)"], animated: true,
    presets: [
      { name: "Two sources, one load", note: "50 V alone drives 0.476 A through the 10 Ω load and 0.5 A alone drives 0.381 A: together 0.857 A. Yet the load power, 7.35 W, is twice the sum of the separate powers (3.72 W).", values: { V: 50, Is: 0.5, R1: 30, R2: 20, R3: 20, RL: 10 } },
      { name: "Current source only", note: "With V = 0 the voltage source is replaced by a short circuit. All the load current now comes from the 0.5 A source, split between R_L and R3 + R1‖R2.", values: { V: 0, Is: 0.5, R1: 30, R2: 20, R3: 20, RL: 10 } },
      { name: "Load equal to R_N", note: "Seen from the load the network is I_N = 1.125 A in parallel with R_N = R3 + R1‖R2 = 32 Ω. A 32 Ω load takes half of I_N and gets the maximum power.", values: { V: 50, Is: 0.5, R1: 30, R2: 20, R3: 20, RL: 32 } },
    ] },
  { id: "stardelta", title: "Star–delta transformation", where: [["EET-001", 1]], blurb: "A delta and its equivalent star share the same three terminals. Convert either way and check that the resistance between every pair of terminals is identical.", topics: ["Star to Delta conversion (and Delta to Star)", "Analysis of simple circuits with dc excitation (series, parallel, series-parallel)"], animated: true,
    presets: [
      { name: "PYQ: three 10 Ω in star", note: "Equal arms: R_Δ = 3R_Y, so each delta arm is 30 Ω. Between any two terminals both networks measure 20 Ω.", values: { R1: 10, R2: 10, R3: 10, mode: "y2d" } },
      { name: "Unequal delta 5, 10, 15 Ω", note: "Each star arm is the product of the two delta arms touching that terminal over their sum (30 Ω): R_a = 5·15/30 = 2.5 Ω, R_b = 1.67 Ω, R_c = 5 Ω.", values: { R1: 5, R2: 10, R3: 15, mode: "d2y" } },
      { name: "Star 2, 3, 6 Ω", note: "ΣR_aR_b = 36, so R_ab = 36/6 = 6 Ω, R_bc = 36/2 = 18 Ω, R_ca = 36/3 = 12 Ω. The largest delta arm sits opposite the smallest star arm.", values: { R1: 2, R2: 3, R3: 6, mode: "y2d" } },
    ] },
  { id: "acwaveforms", title: "Sinusoids: rms, average, form & peak factor", where: [["EET-001", 2]], blurb: "A rotating phasor traces a sine wave in 3D. Switch to rectified, square or triangular waves and compare their rms and average values, form factor and peak factor.", topics: ["Representation of sinusoidal waveforms", "Peak value, average value and rms value", "Form factor and peak factor", "Phasor representation"], animated: true,
    presets: [
      { name: "230 V household mains", note: "230 V is the rms value: the peak is 230·√2 = 325 V and the half-cycle average 207 V. ω = 2π·50 = 314 rad/s.", values: { Vm: 325.3, f: 50, wave: "sine", th: 45 } },
      { name: "PYQ: e = 141.4 sin 120t", note: "V_m = 141.4 V and ω = 120 rad/s, so V_rms = 141.4/√2 = 100 V and f = 120/2π = 19.1 Hz.", values: { Vm: 141.4, f: 19.1, wave: "sine", th: 30 } },
      { name: "Half-wave rectified", note: "Only the positive half survives: V_rms = V_m/2, V_avg = V_m/π, so the form factor is π/2 = 1.57 and the peak factor 2.", values: { Vm: 10, f: 50, wave: "half", th: 90 } },
    ] },
  { id: "acparallel", title: "Parallel AC, power triangle & pf correction", where: [["EET-001", 2]], blurb: "A coil in parallel with an R–C branch: watch the branch current phasors add, read P, Q, S and the power factor, and add a capacitor to correct a lagging load.", topics: ["Parallel RL, RC and RLC combinations", "Impedance, admittance, impedance triangle and power triangle", "Real power (active power)", "Reactive power", "Apparent power", "Power factor (lagging and leading)"], animated: true,
    presets: [
      { name: "PYQ: coil ‖ R–C branch on 230 V", note: "Coil 50 Ω, 318 mH in parallel with 75 Ω + 159 µF at 230 V, 50 Hz: I₁ = 2.06 A lagging 63°, I₂ = 2.96 A leading 15°, supply current 3.94 A at 0.96 lagging.", values: { V: 230, f: 50, R1: 50, L: 318, R2: 75, C: 159 } },
      { name: "PYQ: coil takes 2 A, 100 W", note: "R = P/I² = 25 Ω, Z = 230/2 = 115 Ω, X_L = 112 Ω, L = 357 mH, pf = 100/460 = 0.22 lagging. No capacitor branch (C = 0).", values: { V: 230, f: 50, R1: 25, L: 357.3, R2: 0, C: 0 } },
      { name: "Corrected to unity pf", note: "A 27 µF capacitor supplies the coil's 449 VAr locally. The power is still 100 W but the supply current falls from 2 A to 0.43 A.", values: { V: 230, f: 50, R1: 25, L: 357.3, R2: 0, C: 27 } },
    ] },
  { id: "magneticgap", title: "Magnetic circuit with an air gap", where: [["EET-001", 3]], blurb: "Flux circulates round an iron core driven by the coil's mmf. Open an air gap and watch its reluctance swamp the iron, just like a big resistor in series.", topics: ["Magnetic circuits and materials", "Magnetomotive force, flux, reluctance, permeability", "Analogy between electric and magnetic circuits"], animated: true,
    presets: [
      { name: "PYQ: iron ring, 200 turns, 2 A", note: "80 cm ring, 12 cm², 1.2 mWb from 400 A-t: B = 1 T, S = 3.33 × 10⁵ A-t/Wb and μ_r = 1592.", values: { N: 200, I: 2, lc: 80, A: 12, mur: 1592, g: 0, ideal: false } },
      { name: "PYQ: ideal core with a 2.3 mm gap", note: "μ_r → ∞, so only the gap counts: S_g = g/(μ₀A) = 1.02 × 10⁶ A-t/Wb, Φ = 124.5/S_g = 0.122 mWb, B = 0.068 T.", values: { N: 83, I: 1.5, lc: 60, A: 18, mur: 1592, g: 2.3, ideal: true } },
      { name: "Cut a 1 mm gap in the ring", note: "1 mm of air has twice the reluctance of 80 cm of iron (μ_r 1592), so the flux falls to a third.", values: { N: 200, I: 2, lc: 80, A: 12, mur: 1592, g: 1, ideal: false } },
    ] },
  { id: "faradaylenz", title: "Faraday's & Lenz's laws: moving conductor", where: [["EET-001", 3]], blurb: "Push a conductor along rails through a magnetic field. The induced emf e = Blv sin θ drives a current whose force opposes the motion (Lenz), with Fleming's right-hand rule shown in 3D.", topics: ["Basic laws of electromagnetism: Faraday's laws, Lenz's law", "Statically and dynamically induced emf; force on a current-carrying conductor"], animated: true,
    presets: [
      { name: "0.8 T, 0.5 m, 10 m/s at 60°", note: "e = Blv sin θ = 0.8 × 0.5 × 10 × 0.866 = 3.46 V. Through 2 Ω that is 1.73 A, and the field pushes back on the rod with 0.6 N.", values: { B: 0.8, l: 0.5, v: 10, th: 60, R: 2 } },
      { name: "Moving along the field", note: "θ = 0: the rod slides parallel to the field lines, cuts no flux, and no emf is induced.", values: { B: 0.8, l: 0.5, v: 10, th: 0, R: 2 } },
      { name: "Light load, little drag", note: "With 100 Ω the current is tiny, so the opposing force (and the work you must do) almost vanishes: the generator is nearly unloaded.", values: { B: 0.8, l: 0.5, v: 10, th: 90, R: 100 } },
    ] },
  { id: "singlephaseim", title: "Single-phase induction motor & starting", where: [["EET-001", 4]], blurb: "A single winding gives a pulsating field: two half-size fields turning opposite ways, so no starting torque. Add a split-phase or capacitor-start auxiliary winding and watch one field win.", topics: ["Single-phase induction motor: construction, classification and principle of operation", "Starting methods of single-phase induction motors (split-phase, capacitor start)", "Generation of rotating magnetic fields"], animated: true,
    presets: [
      { name: "Main winding only, at rest", note: "Forward and backward fields are equal (½ each), their torques cancel at standstill: the motor just hums. Push it either way and it runs that way.", values: { f: 50, poles: 4, s: 1, start: "none" } },
      { name: "Capacitor start", note: "The capacitor makes the auxiliary current lead by about 80°: the forward field is almost full size and the starting torque is ~98 % of a true rotating field.", values: { f: 50, poles: 4, s: 1, start: "capstart" } },
      { name: "Split phase, running", note: "Only about 25° between the currents gives a weak start (sin 25° = 0.42). Above ~75 % speed the centrifugal switch drops the auxiliary winding and the motor runs on the main winding alone.", values: { f: 50, poles: 4, s: 0.05, start: "split" } },
    ] },
  { id: "alternator", title: "Alternator (synchronous generator)", where: [["EET-001", 4]], blurb: "Spin a field rotor inside a three-phase stator. The frequency is fixed by poles and speed, f = PN/120, and the emf per phase is E = 4.44 f Φ T K_w.", topics: ["Construction and working principle of synchronous generators (alternators)", "Synchronous speed and emf of alternator"], animated: true,
    presets: [
      { name: "PYQ: 6 poles at 60 Hz", note: "N = 120f/P = 120 × 60/6 = 1200 rpm. Keep 1200 rpm and set P = 2: the frequency drops to 20 Hz, the paper's second part.", values: { P: 6, N: 1200, phi: 30, T: 240, Kw: 0.96 } },
      { name: "16-pole hydro set, 375 rpm", note: "f = 16 × 375/120 = 50 Hz. With 30 mWb, 240 turns per phase and K_w = 0.96: E_ph = 4.44 × 50 × 0.03 × 240 × 0.96 = 1534 V, line 2657 V in star.", values: { P: 16, N: 375, phi: 30, T: 240, Kw: 0.96 } },
      { name: "2-pole turbo-alternator", note: "Steam turbines run fast: 2 poles at 3000 rpm give 50 Hz. A smooth cylindrical rotor survives the huge centrifugal force.", values: { P: 2, N: 3000, phi: 60, T: 120, Kw: 0.95 } },
    ] },
  { id: "switchgear", title: "Fuse, MCB & ELCB (RCD) protection", where: [["EET-001", 5]], blurb: "Push a current through a fuse, an MCB and an RCD on a distribution board and read off the time–current curves: overload, short circuit and earth leakage each trip a different device.", topics: ["Introduction to LT switchgear: Switch Fuse Unit (SFU)", "Miniature Circuit Breaker (MCB)", "Earth Leakage Circuit Breaker (ELCB)", "Moulded Case Circuit Breaker (MCCB)"], animated: true,
    presets: [
      { name: "Overload at 1.45 × I_n", note: "23 A on a 16 A C-curve MCB: the bimetal heats and trips after about 5 minutes (the standard allows up to 1 h). The fuse would take about 2 h.", values: { I: 23.2, In: 16, curve: "C", leak: 0, rcd: "30" } },
      { name: "Short circuit, 400 A", note: "25 × I_n is above the C-curve magnetic threshold (10 ×): the solenoid trips the MCB in about 10 ms, before the fuse melts.", values: { I: 400, In: 16, curve: "C", leak: 0, rcd: "30" } },
      { name: "Earth leakage through a person", note: "A normal 10 A load, but 40 mA leaks to earth (through a body). Neither the MCB nor the fuse notice; the 30 mA RCD/ELCB trips in under 0.3 s.", values: { I: 10, In: 16, curve: "C", leak: 40, rcd: "30" } },
    ] },
  { id: "batterypack", title: "Battery packs: Ah, C-rate & chemistry", where: [["EET-001", 5]], blurb: "Build a pack from lead–acid, Ni–Cd or Li-ion cells in series and parallel, load it, and read voltage, capacity, energy, C-rate, runtime and recharge energy.", topics: ["Types of batteries (primary, secondary, lead-acid, Ni-Cd, Li-ion)", "Important characteristics for batteries (capacity, Ah, efficiency, C-rate, life, energy density)"], animated: true,
    presets: [
      { name: "12 V 150 Ah inverter battery", note: "Six 2 V lead–acid cells in series: 12 V × 150 Ah = 1.8 kWh. At 10 A (C/15) it lasts 15 h ideally, and recharging needs about 2.25 kWh (80 % efficiency).", values: { Ns: 6, Np: 1, chem: "leadacid", Ah: 150, I: 10 } },
      { name: "E-scooter 13S4P Li-ion", note: "13 cells in series make 48.1 V; 4 strings of 2.5 Ah in parallel make 10 Ah. 481 Wh weighs under 3 kg; 10 A is a 1C discharge (1 hour).", values: { Ns: 13, Np: 4, chem: "liion", Ah: 2.5, I: 10 } },
      { name: "Ni–Cd emergency light", note: "Four 1.2 V cells give 4.8 V. 4 Ah at 0.8 A is 0.2C: 5 hours of light. Ni–Cd has the lowest watt-hour efficiency (~70 %).", values: { Ns: 4, Np: 1, chem: "nicd", Ah: 4, I: 0.8 } },
    ] },
];
