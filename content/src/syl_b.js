/* ===== Syllabus records: EET-001, ECT-001, CST-001, MET-001, BTT-001, AHT-000, WD-101/201/301/401 ===== */

sylAdd("EET-001",{
 n:"Basic Electrical Engineering", s:"Basic Elec.",
 type:"theory", ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "To explore engineering knowledge of electrical engineering: problem analysis, design development and solution, investigation of complex problems, modern tool usage, engineer and society, environment and sustainability.",
  "To comprehend the effect of electric and magnetic fields in materials and 3-phase AC electrical circuits.",
  "To understand the concept of AC/DC machines."
 ],
 out:[
  "CO1 Analyze the DC circuits and apply network theorems.",
  "CO2 Analyze the 1-phase and 3-phase AC electrical circuits.",
  "CO3 Analyze the magnetic circuits and transformer.",
  "CO4 Explain the construction and working principles of basic DC machines and AC machines.",
  "CO5 Describe the protection requirements of domestic power system."
 ],
 units:[
  { t:"DC Circuits", h:8,
    topics:[
     "Electrical circuit elements (R, L and C)",
     "Voltage sources and current sources (ideal and practical)",
     "Kirchhoff current law (KCL)",
     "Kirchhoff voltage law (KVL)",
     "Analysis of simple circuits with dc excitation (series, parallel, series-parallel)",
     "Mesh and node analysis of dc circuits",
     "Superposition theorem",
     "Thevenin theorem",
     "Norton theorem",
     "Maximum power transfer theorem",
     "Star to Delta conversion (and Delta to Star)",
     "Time-domain analysis of first order RL circuit",
     "Time-domain analysis of first order RC circuit",
     "Time constant, charging and discharging (transient response)"
    ],
    formulas:[
     "V = IR ;  P = VI = I²R = V²/R  (Ohm's law and power)",
     "KCL: ΣI(entering) = ΣI(leaving) at a node ;  KVL: ΣV = 0 around a closed loop",
     "Series: Req = R1 + R2 + …  ;  Parallel: 1/Req = 1/R1 + 1/R2 + …  ; two in parallel: R1R2/(R1+R2)",
     "Voltage divider: V1 = V·R1/(R1+R2) ;  current divider: I1 = I·R2/(R1+R2)",
     "Delta to Star: R1 = RabRca/(Rab+Rbc+Rca) (product of the two adjacent delta arms / sum) ; Star to Delta: Rab = (R1R2+R2R3+R3R1)/R3 (R3 = star arm opposite to a-b)",
     "Balanced case: RΔ = 3RY  and  RY = RΔ/3",
     "Maximum power transfer: RL = Rth (or RN) ;  Pmax = Vth²/(4Rth) ; efficiency at that point = 50 %",
     "Thevenin/Norton: Vth = Voc ;  Rth = Voc/Isc ;  IN = Isc ;  RN = Rth",
     "RL circuit (switch on): i(t) = (V/R)(1 − e^(−t/τ)),  τ = L/R",
     "RC circuit (charging): vc(t) = V(1 − e^(−t/τ)),  τ = RC ;  discharging: vc(t) = V0 e^(−t/τ)",
     "Energy stored: E = ½LI² (inductor), E = ½CV² (capacitor)"
    ],
    hints:[
     "Practise mesh/node analysis on 2- and 3-loop circuits; UTU papers ask a numerical on each of Thevenin, Norton, Superposition and max power transfer.",
     "Learn the standard procedure for Thevenin (remove load, find Voc, deactivate sources, find Rth) and be able to draw the equivalent circuit.",
     "Derive the RL and RC transient responses from the first-order differential equation and sketch the curves marking 63.2 % at t = τ.",
     "Always do a Star-Delta conversion numerical for a bridge circuit (Wheatstone bridge unbalanced)."
    ]},
  { t:"AC Circuits", h:8,
    topics:[
     "Representation of sinusoidal waveforms",
     "Peak value, average value and rms value",
     "Form factor and peak factor",
     "Phasor representation",
     "Real power (active power)",
     "Reactive power",
     "Apparent power",
     "Power factor (lagging and leading)",
     "Analysis of single-phase ac circuits: pure R, pure L, pure C",
     "Series RL, RC and RLC combinations",
     "Parallel RL, RC and RLC combinations",
     "Impedance, admittance, impedance triangle and power triangle",
     "Resonance (series and parallel)",
     "Three phase balanced circuits",
     "Voltage and current relations in star connection",
     "Voltage and current relations in delta connection",
     "Three-phase power measurement (two-wattmeter method)"
    ],
    formulas:[
     "v = Vm sin ωt ;  ω = 2πf ;  T = 1/f",
     "Vrms = Vm/√2 = 0.707 Vm ;  Vavg (half cycle) = 2Vm/π = 0.637 Vm",
     "Form factor = Vrms/Vavg = 1.11 ;  Peak factor = Vm/Vrms = 1.414 (sine wave)",
     "XL = ωL = 2πfL ;  XC = 1/(ωC) = 1/(2πfC)",
     "Z = √(R² + X²) ;  tan φ = X/R ;  Y = 1/Z",
     "P = VI cos φ (W) ;  Q = VI sin φ (VAr) ;  S = VI (VA) ;  S² = P² + Q² ;  pf = cos φ = P/S",
     "Series resonance: f0 = 1/(2π√(LC)) ;  Q-factor = ω0L/R = 1/(ω0CR) ;  BW = f0/Q ;  current is maximum = V/R",
     "Parallel (ideal L-C) resonance: f0 = 1/(2π√(LC)) ; impedance is maximum and line current minimum",
     "Star: VL = √3 Vph, IL = Iph ;  Delta: VL = Vph, IL = √3 Iph",
     "3-phase power: P = √3 VL IL cos φ = 3 Vph Iph cos φ",
     "Two-wattmeter: P = W1 + W2 ;  tan φ = √3 (W1 − W2)/(W1 + W2)"
    ],
    hints:[
     "Draw phasor diagrams for series RL, RC and RLC circuits and derive Z, I, φ and the power triangle.",
     "Derive rms and average values of a sine wave, half-wave and full-wave rectified waveform by integration.",
     "Derive resonant frequency, Q-factor and bandwidth of the series RLC circuit and sketch I versus f.",
     "Learn the two-wattmeter method with phasor derivation and the effect of pf on W1 and W2 (pf = 0.5 gives W2 = 0)."
    ]},
  { t:"Magnetic circuits and Transformers", h:8,
    topics:[
     "Magnetic circuits and materials",
     "Magnetomotive force, flux, reluctance, permeability",
     "Analogy between electric and magnetic circuits",
     "BH characteristics (magnetisation curve)",
     "Hysteresis loop and hysteresis loss; eddy current loss",
     "Basic laws of electromagnetism: Faraday's laws, Lenz's law",
     "Statically and dynamically induced emf; force on a current-carrying conductor",
     "Single phase transformer: construction and working principle",
     "Ideal transformer and practical transformer",
     "EMF equation of transformer; transformation ratio",
     "Equivalent circuit of transformer",
     "Losses in transformers (iron and copper)",
     "Regulation of a transformer",
     "Efficiency of a transformer; condition for maximum efficiency",
     "Open-circuit and short-circuit tests",
     "Introduction to measurements: PMMC instruments",
     "Introduction to measurements: MI (moving iron) meters"
    ],
    formulas:[
     "mmf F = NI (A-t) ;  reluctance S = l/(μ0μr A) ;  flux Φ = F/S  (like I = E/R)",
     "B = Φ/A ;  H = NI/l ;  B = μH ;  μ = μ0μr,  μ0 = 4π×10⁻⁷ H/m",
     "Faraday: e = −N dΦ/dt ;  dynamic emf e = Blv sin θ ;  force F = BIl sin θ",
     "Hysteresis loss Ph = η Bmax^1.6 f V ;  eddy-current loss Pe = k Bmax² f² t² V",
     "EMF equation: E = 4.44 f N Φm = 4.44 f N Bm A ;  E1/E2 = N1/N2 = V1/V2 = I2/I1 = K",
     "Referred to primary: R01 = R1 + R2/K² ;  X01 = X1 + X2/K²",
     "Voltage regulation = (E2 − V2)/E2 × 100 % ≈ (I R02 cos φ ± I X02 sin φ)/V2 × 100 % (+ lagging, − leading)",
     "Efficiency η = (output)/(output + Pi + Pcu) = x·S cos φ /(x·S cos φ + Pi + x²Pcu) ;  maximum when x²Pcu = Pi , i.e. x = √(Pi/Pcu)",
     "kVA rating = V1I1/1000 = V2I2/1000",
     "PMMC: deflection ∝ I (uniform scale, dc only) ;  MI: deflection ∝ I² (non-uniform scale, ac and dc)"
    ],
    hints:[
     "Derive the emf equation and draw the phasor diagram of the transformer at no load and on load (lagging pf).",
     "Numericals: efficiency at given load/pf, maximum efficiency load, regulation, and all-day efficiency; practise 3-4 of each.",
     "Draw and explain the B-H loop; show which area gives hysteresis loss and why soft iron / silicon steel is used for cores.",
     "Compare PMMC and MI meters (principle, scale, ac/dc, sensitivity, use as ammeter/voltmeter)."
    ]},
  { t:"Electrical Machines", h:8,
    topics:[
     "Construction and working principle of DC machines (generator and motor)",
     "Emf equation and back emf; torque equation",
     "Types of DC machine: separately excited, shunt, series, compound",
     "Generation of rotating magnetic fields",
     "Three-phase induction motor: construction, classification (squirrel cage and slip ring) and principle of operation",
     "Slip and rotor frequency",
     "Single-phase induction motor: construction, classification and principle of operation",
     "Starting methods of single-phase induction motors (split-phase, capacitor start)",
     "Construction and working principle of synchronous generators (alternators)",
     "Synchronous speed and emf of alternator"
    ],
    formulas:[
     "DC generator emf: E = PΦZN/(60A)  (P poles, Z conductors, A parallel paths, N rpm)",
     "DC motor: Eb = V − IaRa ;  torque T = PΦZIa/(2πA) = 0.159 PΦZIa/A ;  T ∝ ΦIa",
     "Motor speed N ∝ Eb/Φ ;  Power developed = Eb Ia ;  shaft torque Tsh = P_out/(2πN/60)",
     "Generator: Eg = V + IaRa ;  Ia = IL + Ish (shunt),  Ia = IL (series)",
     "Synchronous speed: Ns = 120f/P rpm",
     "Slip: s = (Ns − N)/Ns ;  rotor speed N = Ns(1 − s) ;  rotor frequency fr = s·f",
     "Induction motor: rotor power input : copper loss : mechanical output = 1 : s : (1 − s)",
     "Alternator: f = PNs/120 ;  E = 4.44 f Φ T Kw (Kw = winding factor)",
     "Rotating field: three-phase windings 120° apart on 3-phase supply give a constant-magnitude field of 1.5 Φm rotating at Ns"
    ],
    hints:[
     "Be able to draw a labelled cut-section of a DC machine and list each part with function (yoke, poles, armature, commutator, brushes).",
     "Explain how a rotating magnetic field is produced by 3 currents 120° apart; give phasor/instant diagrams at ωt = 0°, 60°, 120°, 180°.",
     "Numericals: emf and torque equations, slip, rotor speed and frequency, alternator speed/frequency for a given P.",
     "Compare shunt/series/compound motors (characteristics and applications) and squirrel cage vs slip-ring motors."
    ]},
  { t:"Electrical Installations", h:6,
    topics:[
     "Generalized layout of power system (generation, transmission, distribution)",
     "Standard transmission and distribution voltages",
     "Concept of grid",
     "Introduction to LT switchgear: Switch Fuse Unit (SFU)",
     "Miniature Circuit Breaker (MCB)",
     "Earth Leakage Circuit Breaker (ELCB)",
     "Moulded Case Circuit Breaker (MCCB)",
     "Types of wires and cables",
     "Earthing (need, plate and pipe earthing)",
     "Types of batteries (primary, secondary, lead-acid, Ni-Cd, Li-ion)",
     "Important characteristics for batteries (capacity, Ah, efficiency, C-rate, life, energy density)",
     "Elementary calculations for energy consumption (units, kWh, tariff, bill)"
    ],
    formulas:[
     "Energy (kWh) = power (kW) × time (h) ;  1 unit = 1 kWh ;  bill = units × tariff",
     "Energy of a load: E = P·t /1000 (P in W, t in h)",
     "Battery capacity (Ah) = current (A) × time (h) ;  stored energy (Wh) = V × Ah",
     "Ampere-hour efficiency = Ah discharged / Ah charged ;  Watt-hour efficiency = Wh out / Wh in",
     "Typical voltages (India): generation 11 kV; transmission 132/220/400/765 kV; primary distribution 11/33 kV; LT 415 V (3-phase) and 230 V (1-phase)",
     "Fuse/MCB rating must be ≥ load current and ≤ cable current rating; I = P/(V cos φ) for a single-phase load"
    ],
    hints:[
     "Draw the single-line layout of a power system with voltage levels at every stage.",
     "Know one line on each device: SFU (switch + HRC fuse), MCB (thermal-magnetic overload/short-circuit), ELCB (earth leakage), MCCB (higher rating, adjustable trip).",
     "Practise a monthly electricity bill numerical (several appliances, hours per day, 30 days, given tariff).",
     "Learn why earthing is needed (safety, keeps metal body at zero potential) and how plate/pipe earthing is done."
    ]}
 ],
 text:[],
 note:"The PDF adds: there must be small hands-on hardware demonstrations (for example physical experience with R, L and C components in the 1st/2nd semester), demonstration of cut machine models, a visit to local switch boxes and a substation, and a simulation demo.",
 ref:[
  "D.P. Kothari & I.J. Nagrath, Basic Electrical Engineering, Tata McGraw Hill, latest edition.",
  "S.N. Singh, Basic Electrical Engineering, P.H.I., 2013.",
  "M.S. Sukhija, T. K. Nagsarkar, Basic Electrical and Electronics Engineering, Oxford University Press, 2012.",
  "C.L. Wadhwa, Basic Electrical Engineering, New Age International.",
  "B.L. Theraja & A.K. Theraja, Textbook of Electrical Technology - Vol. 1, S. Chand Publication.",
  "E. Hughes & I.M. Smith, Hughes Electrical Technology, Pearson.",
  "Vincent Del Toro, Electrical Engineering Fundamentals."
 ]
});

sylAdd("ECT-001",{
 n:"Basic Electronics Engineering", s:"Basic Elex.",
 type:"theory", ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "To explore the basic understanding of semiconductor material and its properties.",
  "To comprehend the PN junction diode, zener diode, bipolar junction transistors and their characteristics.",
  "To familiarize with the basics of field effect transistors and switching theory and logic design.",
  "To understand the basics of operational amplifiers and their application."
 ],
 out:[
  "CO1 Students will be able to understand the operation and terminal behavior of basic electronic devices.",
  "CO2 Students will be able to design the biasing circuits of electronics devices.",
  "CO3 Students will be able to apply the principles of basic amplifier circuits using BJTs and FETs.",
  "CO4 Students will be able to understand the basic principles of the operational amplifier and digital logic design.",
  "CO5 Students will be able to solve engineering problems related to electronics devices and circuits."
 ],
 units:[
  { t:"Semiconductor Materials and Properties; Junction Diode",
    topics:[
     "Group-IV materials (Si, Ge)",
     "Covalent bond",
     "Electron-hole concepts",
     "Basic concepts of energy bands in materials",
     "Forbidden energy gap",
     "Intrinsic semiconductors",
     "Extrinsic semiconductors (n-type and p-type)",
     "Donors and acceptors impurities",
     "Conductivity of semiconductors",
     "p-n junction",
     "Depletion layer",
     "V-I characteristics of diode (forward and reverse bias)",
     "Diode resistance (static and dynamic)",
     "Diode capacitance (transition and diffusion)",
     "Light emitting diode",
     "Varactor diode",
     "Photo diode",
     "Schottky diode",
     "Tunnel diode"
    ],
    formulas:[
     "Intrinsic: n = p = ni ;  ni² = NcNv e^(−Eg/kT)",
     "Mass-action law: n·p = ni² ;  n-type: n ≈ ND, p = ni²/ND ;  p-type: p ≈ NA, n = ni²/NA",
     "Conductivity σ = q(nμn + pμp) ;  resistivity ρ = 1/σ",
     "Diode equation: I = Is(e^(V/ηVT) − 1) ;  VT = kT/q ≈ 26 mV at 300 K",
     "Dynamic resistance: rd = ηVT/I ≈ 26 mV/I (η = 1) ;  static resistance R = V/I",
     "Junction capacitance: CT = εA/W (W = depletion width);  varactor: CT ∝ (V0 + VR)^(−1/2) (abrupt junction)",
     "Barrier potential: about 0.7 V (Si), 0.3 V (Ge) ;  Eg ≈ 1.1 eV (Si), 0.67 eV (Ge)",
     "LED colour: λ (μm) = 1.24/Eg (eV)"
    ],
    hints:[
     "Draw energy-band diagrams for insulator, semiconductor and metal, and for n- and p-type material with donor/acceptor levels.",
     "Explain the formation of the depletion layer and the V-I characteristic of a p-n diode with forward/reverse regions; be ready to compute dynamic resistance.",
     "Prepare one short note (symbol, working principle, characteristic, use) each for LED, varactor, photodiode, Schottky and tunnel diode (negative resistance region)."
    ]},
  { t:"Diode Applications; Breakdown of Diodes",
    topics:[
     "Rectifiers: half wave",
     "Rectifiers: full wave (centre-tap and bridge)",
     "Calculation of ripple factor",
     "Calculation of rectification efficiency",
     "Transformer utilization factor",
     "Capacitor filter",
     "Clipping circuits",
     "Clamping circuits",
     "Voltage multipliers",
     "Breakdown mechanisms (zener and avalanche)",
     "Breakdown characteristics",
     "Zener resistance",
     "Zener diode application as shunt voltage regulator"
    ],
    formulas:[
     "Half wave: Idc = Im/π ;  Irms = Im/2 ;  Vdc = Vm/π ;  PIV = Vm ;  ripple factor r = 1.21 ;  η(max) = 40.6 % ;  TUF = 0.287 ;  ripple frequency = f",
     "Full wave: Idc = 2Im/π ;  Irms = Im/√2 ;  Vdc = 2Vm/π ;  r = 0.482 ;  η(max) = 81.2 % ;  ripple frequency = 2f",
     "PIV: centre-tap = 2Vm ;  bridge = Vm ;  TUF: centre-tap = 0.693, bridge = 0.812",
     "Ripple factor r = √((Irms/Idc)² − 1) = Vac(rms)/Vdc ;  η = Pdc/Pac",
     "Capacitor filter (full wave): r = 1/(4√3 f R C) ;  half wave: r = 1/(2√3 f R C)",
     "Zener regulator: Rs = (Vin − Vz)/(Iz + IL) ;  Iz = Is − IL ;  Iz(min) ≤ Iz ≤ Iz(max)",
     "Zener resistance rz = ΔVz/ΔIz ;  Zener breakdown occurs below about 5 V (tunnelling), avalanche above about 5 V",
     "Voltage doubler: Vdc ≈ 2Vm ;  n-stage multiplier: Vdc ≈ nVm"
    ],
    hints:[
     "Derive Idc, Irms, ripple factor and efficiency of the half wave and full wave rectifier; these come regularly as 10-mark questions.",
     "Draw output waveforms for positive/negative clippers with a reference battery and clampers; practise given input sine wave.",
     "Solve zener regulator numericals for a fixed load and for varying input (find Rs, Iz, power rating).",
     "Distinguish Zener and avalanche breakdown (mechanism, temperature coefficient, voltage range)."
    ]},
  { t:"Bipolar Junction Transistors; Transistor Amplifiers",
    topics:[
     "Basic construction of BJT (npn and pnp)",
     "Transistor action",
     "CB configuration",
     "CE configuration",
     "CC configuration",
     "Input characteristics",
     "Output characteristics (active, cut-off, saturation regions)",
     "Biasing of transistors: fixed bias",
     "Biasing of transistors: emitter bias",
     "Biasing of transistors: potential divider bias",
     "Graphical analysis of CE amplifier (dc and ac load line)",
     "Concept of voltage and current gain",
     "h-parameter model of BJT at low frequency",
     "Calculation of current gain, voltage gain, input resistance and output resistance of single stage BJT amplifier in CE configuration",
     "Same calculations for CC configuration (emitter follower)"
    ],
    formulas:[
     "IE = IB + IC ;  α = IC/IE ;  β = IC/IB ;  β = α/(1 − α) ;  α = β/(1 + β)",
     "IC = βIB + (1 + β)ICBO = αIE + ICBO",
     "Fixed bias: IB = (VCC − VBE)/RB ;  IC = βIB ;  VCE = VCC − ICRC",
     "Emitter bias: IB = (VCC − VBE)/(RB + (1 + β)RE)",
     "Voltage divider: Vth = VCC R2/(R1 + R2) ;  Rth = R1‖R2 ;  IB = (Vth − VBE)/(Rth + (1 + β)RE)",
     "Stability factor S = ∂IC/∂ICO ;  fixed bias S = 1 + β ; voltage-divider S ≈ 1 + Rth/RE (good stability)",
     "CE h-parameters: Ai = −hfe/(1 + hoeRL) ;  Ri = hie + hreAiRL ;  Av = AiRL/Ri ;  Ro = 1/(hoe − hfehre/(hie + Rs))",
     "Approximate CE: Av ≈ −hfeRL/hie ;  Ai ≈ −hfe",
     "CC: Ai = 1 + hfe ;  Av ≈ 1 ;  Ri high, Ro low",
     "Load line: VCE = VCC − ICRC ; saturation IC = VCC/RC (VCE = 0), cut-off VCE = VCC (IC = 0)"
    ],
    hints:[
     "Draw the input and output characteristics of CB and CE with cut-off, active, saturation regions, and compare CB/CE/CC in a table (Ri, Ro, Ai, Av, phase, use).",
     "Practise finding the Q-point (IB, IC, VCE) for fixed, emitter and voltage-divider bias; UTU numericals are standard.",
     "Derive Ai, Ri, Av and Ro for CE amplifier using the h-parameter model and show the equivalent circuit."
    ]},
  { t:"Field Effect Transistors",
    topics:[
     "Junction field-effect transistor: construction and action",
     "Concept of pinch-off",
     "Maximum drain saturation current",
     "Output and transfer characteristics",
     "CG, CS and CD configurations",
     "Self-bias circuit",
     "Fixed-bias circuit",
     "Metal-oxide field-effect transistor (MOSFET)",
     "Depletion and enhancement type: construction, operation and characteristics",
     "Calculation of voltage gain, input and output resistances of single stage FET amplifiers in CG, CS and CD configurations"
    ],
    formulas:[
     "JFET (Shockley): ID = IDSS(1 − VGS/VP)² ;  ID = IDSS at VGS = 0 ;  ID = 0 at VGS = VP",
     "Transconductance: gm = ΔID/ΔVGS = (2IDSS/|VP|)(1 − VGS/VP) = gm0(1 − VGS/VP), gm0 = 2IDSS/|VP|",
     "Drain resistance rd = ΔVDS/ΔID ;  amplification factor μ = gm·rd",
     "Self-bias: VGS = −IDRS ;  VDS = VDD − ID(RD + RS)",
     "Fixed bias: VGS = −VGG ;  ID from Shockley equation",
     "CS amplifier: Av = −gm(rd ‖ RD ‖ RL) ≈ −gmRL′ ;  Ri = RG ;  Ro ≈ RD ‖ rd",
     "CD (source follower): Av = gmRL′/(1 + gmRL′) < 1 ;  Ro ≈ 1/gm",
     "CG amplifier: Av ≈ gmRL′ ;  Ri ≈ 1/gm (low)",
     "Enhancement MOSFET: ID = k(VGS − VT)² for VDS ≥ VGS − VT (saturation)"
    ],
    hints:[
     "Draw the JFET construction with depletion region growing toward the drain, and the output characteristics marking ohmic, saturation (pinch-off) and breakdown regions.",
     "Compare depletion and enhancement MOSFET (symbol, structure, transfer curve) and JFET vs BJT.",
     "Solve self-bias JFET numericals by combining Shockley's equation with VGS = −IDRS (choose the root satisfying |VGS| ≤ |VP|); then find gm and Av."
    ]},
  { t:"Switching Theory and Logic Design; Operational Amplifiers",
    topics:[
     "Number systems (binary, octal, decimal, hexadecimal)",
     "Conversions of bases",
     "Boolean algebra (laws and theorems)",
     "Logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)",
     "Concept of universal gate (NAND and NOR)",
     "K-map (simplification of Boolean expressions)",
     "Concept of ideal operational amplifiers",
     "Ideal op-amp parameters",
     "Inverting amplifier",
     "Non-inverting amplifier",
     "Unity gain amplifier (voltage follower)",
     "Summing amplifier"
    ],
    formulas:[
     "Base conversion: decimal to base r by repeated division (integer) and repeated multiplication (fraction); base r to decimal by Σ dᵢ rⁱ",
     "Boolean laws: A + AB = A ;  A + A′B = A + B ;  A·A′ = 0 ;  A + A′ = 1 ;  De Morgan: (A·B)′ = A′ + B′ ,  (A + B)′ = A′·B′",
     "NAND-only: NOT = A NAND A ;  AND = NAND followed by NOT ;  OR = A′ NAND B′ ; NOR-only: dual",
     "XOR: A⊕B = A′B + AB′ ;  XNOR = AB + A′B′",
     "K-map: group 1s in powers of 2 (1, 2, 4, 8, …) as large as possible; a group of 2ⁿ cells eliminates n variables",
     "Ideal op-amp: Ri = ∞, Ro = 0, A = ∞, BW = ∞, CMRR = ∞, V+ = V− (virtual short), input currents = 0",
     "Inverting: Av = −Rf/R1 ;  Non-inverting: Av = 1 + Rf/R1 ;  Voltage follower: Av = 1",
     "Summing (inverting): Vo = −Rf(V1/R1 + V2/R2 + V3/R3) ;  if all R equal, Vo = −(V1 + V2 + V3) for Rf = R"
    ],
    hints:[
     "Practise binary/octal/hex conversions, 1's and 2's complements and simplification with 3- and 4-variable K-maps (SOP).",
     "Implement basic gates with only NAND and only NOR, and prove De Morgan's theorems with truth tables.",
     "Derive the gain of the inverting and non-inverting amplifiers using virtual short/virtual ground and draw the circuit diagrams."
    ]}
 ],
 text:[
  "Boylestad and Nashelsky, Electronic Devices and Circuit Theory, PHI, 2017.",
  "Milman, Halkias & Jit, Electronic Devices and Circuits, TMH, 2007.",
  "G. Streetman, and S. K. Banerjee, Solid State Electronic Devices, Pearson, 2014.",
  "D. Neamen, D. Biswas, Semiconductor Physics and Devices, McGraw-Hill Education.",
  "Salivahanan, Electronic Devices and Circuits, TMH, 2012.",
  "Deshpande, Electronic Devices and circuits, McGraw-Hill, 2007.",
  "Kulshrestha, Electronic Devices and Circuits, PHI, 2007."
 ],
 ref:[]
});

sylAdd("CST-001",{
 n:"Programming for Problem Solving", s:"PPS (C)",
 type:"theory", ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[],
 out:[
  "CO1 Formulate simple algorithms for arithmetic and logical problems.",
  "CO2 Test and execute the programs and correct syntax and logical errors.",
  "CO3 Implement conditional branching, iteration and recursion.",
  "CO4 Use functions, arrays, pointers, strings and structures to formulate algorithms and programs.",
  "CO5 Apply programming to solve problems related to matrices, searching, sorting and use files to perform read and write operations."
 ],
 units:[
  { t:"Introduction",
    topics:[
     "Introduction to programming: computer system",
     "Components of a computer system",
     "Computing environments",
     "Computer languages (machine, assembly, high level)",
     "Creating and running programs",
     "Algorithms",
     "Flowcharts",
     "Introduction to C language: history of C",
     "Basic structure of C programs",
     "Process of compiling and running a C program",
     "C tokens",
     "Keywords",
     "Identifiers",
     "Constants",
     "Strings",
     "Special symbols",
     "Variables",
     "Data types",
     "I/O statements (printf, scanf, getchar, putchar, gets, puts)"
    ],
    formulas:[
     "Structure: #include <stdio.h> ;  int main(void) { declarations; statements; return 0; }",
     "Compilation steps: source (.c) → preprocessor → compiler → assembler → linker → executable (a.out / .exe)",
     "Identifier rules: letters, digits, underscore; must not start with a digit; case-sensitive; not a keyword (C has 32 keywords)",
     "Typical sizes (32/64-bit GCC): char 1 B, short 2 B, int 4 B, long 4 or 8 B, float 4 B, double 8 B",
     "Format specifiers: %d int, %u unsigned, %ld long, %f float, %lf double, %c char, %s string, %x hex, %o octal, %p pointer",
     "scanf needs the address: scanf(\"%d\", &x) ;  printf takes the value: printf(\"%d\", x)",
     "Escape sequences: \\n newline, \\t tab, \\\\ backslash, \\0 null character",
     "Algorithm: finite, definite, has input/output, effective; flowchart symbols: oval (start/stop), parallelogram (I/O), rectangle (process), diamond (decision)"
    ],
    hints:[
     "Write algorithms and flowcharts for simple problems: largest of three numbers, factorial, prime check, sum of digits.",
     "Learn the basic structure of a C program and be able to explain each line; UTU asks the compilation process and 'features of C' frequently.",
     "Remember the difference between constants and variables, and between primary data types with size/range."
    ]},
  { t:"Operators, Expressions and Control Structures",
    topics:[
     "Operators and expressions",
     "Arithmetic operators",
     "Relational and logical operators",
     "Assignment operators",
     "Increment and decrement operators",
     "Bitwise operators",
     "Conditional operators (?:)",
     "Special operators (sizeof, comma)",
     "Operator precedence and associativity",
     "Evaluation of expressions",
     "Type conversions in expressions (implicit and explicit casting)",
     "Decision statements: if, if-else, nested if, else-if ladder",
     "switch statement",
     "Loop control statements: while",
     "Loop control statements: for",
     "Loop control statements: do-while",
     "Jump statements: break",
     "Jump statements: continue",
     "goto statement and labels"
    ],
    formulas:[
     "Precedence (high to low): () [] -> . ; ++ -- ! ~ sizeof unary +/- (cast) * & ; * / % ; + - ; << >> ; < <= > >= ; == != ; & ; ^ ; | ; && ; || ; ?: ; = += -= … ; ,",
     "Associativity: left-to-right for most binary operators; right-to-left for unary, ?: and assignment",
     "Integer division truncates: 7/2 = 3, −7/2 = −3 ;  % gives remainder with the sign of the dividend: −7 % 3 = −1 ;  % works only on integers",
     "Pre-increment ++x uses new value; post-increment x++ uses old value then increments",
     "Bitwise: & | ^ ~ << >> ;  x << n = x·2ⁿ ;  x >> n = x/2ⁿ (integer) ;  x & 1 tests odd/even",
     "Logical && and || short-circuit: right operand is not evaluated if the result is already known; true = non-zero, false = 0",
     "Ternary: cond ? a : b ;  switch works on integer/char constants, needs break to avoid fall-through, default optional",
     "for (init; cond; update) body ;  do-while executes body at least once ;  while tests first (entry-controlled)",
     "Implicit conversion order: char/short → int → unsigned → long → float → double ;  (float)a/b avoids integer division"
    ],
    hints:[
     "Trace expressions with mixed operators and increments by hand (e.g. a = b++ * 2 + c); avoid modifying the same variable twice in one expression such as a = b++ + ++b, which is undefined behaviour; UTU asks output prediction questions.",
     "Write programs on patterns (pyramids, triangles), series sums, Armstrong/palindrome/prime checks, and menu-driven programs using switch.",
     "Know difference between break, continue and goto, and between entry- and exit-controlled loops."
    ]},
  { t:"Arrays and Functions",
    topics:[
     "Arrays: concepts",
     "One dimensional array: declaration and initialization",
     "Two dimensional arrays: initialization and accessing",
     "Multi dimensional arrays",
     "Basic Algorithms: searching (linear and binary search)",
     "Basic sorting algorithms: bubble sort",
     "Basic sorting algorithms: insertion sort",
     "Basic sorting algorithms: selection sort",
     "User defined and built-in functions",
     "Storage classes (auto, extern, static, register)",
     "Parameter passing in functions: call by value",
     "Passing arrays to functions: idea of call by reference",
     "Recursion as a different way of solving problems",
     "Example programs: finding factorial",
     "Example programs: Fibonacci series",
     "Example programs: Ackermann function",
     "Quick sort or Merge sort"
    ],
    formulas:[
     "Declaration: int a[10]; ;  index runs 0 to n−1 ;  no bounds checking in C ;  int a[5] = {1,2}; leaves the rest 0",
     "2-D: int m[r][c]; stored row-major ;  address of m[i][j] = base + (i·c + j)·size",
     "Element address: &a[i] = a + i = base + i·sizeof(type)",
     "Bubble sort: n(n−1)/2 comparisons, O(n²) ;  selection sort O(n²) ;  insertion sort O(n²), best O(n) ;  linear search O(n) ;  binary search O(log₂ n) (sorted array only) ;  quick/merge sort average O(n log n)",
     "Function form: return_type name(param list) { body } ;  prototype: return_type name(types);",
     "Storage classes: auto (default local, stack), register (CPU register hint), static (retains value between calls, default 0), extern (global across files)",
     "Call by value: copies of arguments passed, callee cannot change caller's variables; arrays decay to pointers so changes to elements are visible to the caller",
     "Recursion needs a base case and a recursive step: fact(n) = n·fact(n−1), fact(0) = 1 ;  fib(n) = fib(n−1) + fib(n−2)",
     "Ackermann: A(0,n) = n+1 ;  A(m,0) = A(m−1,1) ;  A(m,n) = A(m−1, A(m, n−1))  (A(2,3) = 9)"
    ],
    hints:[
     "Write from memory: bubble, selection and insertion sort, linear and binary search, matrix addition/multiplication/transpose.",
     "Trace the recursive call stack of factorial(4), fib(5) and A(1,2) on paper.",
     "Explain the four storage classes with a small example each, and the difference between call by value and call by reference (using pointers)."
    ]},
  { t:"Strings and Pointers",
    topics:[
     "Strings: arrays of characters",
     "Variable length character strings",
     "Inputting character strings (scanf, gets, fgets)",
     "Character library functions (ctype.h: isalpha, isdigit, toupper, tolower, …)",
     "String handling functions (strlen, strcpy, strcat, strcmp, strncpy, strstr)",
     "Pointers: pointer basics",
     "Pointer arithmetic",
     "Pointers to pointers",
     "Generic pointers (void *)",
     "Array of pointers",
     "Functions returning pointers",
     "Dynamic memory allocation (malloc, calloc, realloc, free)"
    ],
    formulas:[
     "A string is a char array ending with '\\0' ;  char s[6] = \"hello\"; needs 6 bytes ;  strlen excludes '\\0'",
     "scanf(\"%s\") stops at whitespace ; fgets reads a whole line safely (gets does too but is unsafe and removed in C11); strcmp(a,b) = 0 if equal, <0 if a<b, >0 if a>b",
     "strcpy(dest, src) ;  strcat(dest, src) ;  strlen(s) ;  strncpy, strncat ;  a == b compares addresses, not contents",
     "Pointer declaration: int *p = &x; ;  *p is the value at address p (dereference) ;  &x is the address of x",
     "Pointer arithmetic: p + n moves by n·sizeof(*p) bytes ;  p2 − p1 = number of elements between them ;  a[i] ≡ *(a + i) ≡ i[a]",
     "Pointer to pointer: int **pp = &p; ;  **pp = x",
     "void *: no arithmetic or dereference without a cast ;  NULL pointer = 0",
     "malloc(n·sizeof(T)) returns uninitialised memory ;  calloc(n, size) zero-initialises ;  realloc(p, newsize) resizes ;  free(p) releases; always check for NULL and avoid dangling pointers/leaks",
     "Function returning pointer: int *f(); never return the address of a local (automatic) variable"
    ],
    hints:[
     "Write your own strlen, strcpy, strcat, strcmp, string reverse and palindrome check using both arrays and pointers.",
     "Practise swap(int *a, int *b), and pointer expressions such as *p++ , (*p)++ , *++p and pointer-to-array traversal.",
     "Write a program that uses malloc to build a dynamic array (read n, allocate, sum, free) and explain memory leaks."
    ]},
  { t:"Structures and File Handling",
    topics:[
     "Structures and unions: structure definition",
     "Structure initialization",
     "Accessing structures (. and -> operators)",
     "Nested structures",
     "Arrays of structures",
     "Structures and functions",
     "Self referential structures",
     "Unions",
     "typedef",
     "Enumerations",
     "File handling: command line arguments",
     "File modes",
     "Basic file operations: read",
     "Basic file operations: write",
     "Basic file operations: append",
     "Example programs"
    ],
    formulas:[
     "struct tag { type member; … }; ;  struct tag v; ;  v.member or p->member (p is a pointer to struct)",
     "sizeof(struct) ≥ sum of member sizes (padding/alignment); sizeof(union) = size of its largest member; only one union member holds a value at a time",
     "Self-referential: struct node { int data; struct node *next; }; (used for linked lists)",
     "typedef struct tag Name; ;  enum colour {RED, GREEN, BLUE}; assigns 0, 1, 2 by default",
     "main(int argc, char *argv[]) : argc = number of arguments (including program name), argv[0] = program name",
     "FILE *fp = fopen(\"name\", \"mode\"); returns NULL on failure ;  fclose(fp)",
     "Modes: r read ; w write (truncate/create) ; a append ; r+ read+write ; w+ ; a+ ; add b for binary (rb, wb)",
     "fprintf/fscanf, fgetc/fputc, fgets/fputs, fread/fwrite, fseek/ftell/rewind, feof(fp)"
    ],
    hints:[
     "Write a student-record program with an array of structures (read, display, search, sort by marks).",
     "Know the difference between struct and union with a memory diagram, and where typedef/enum help readability.",
     "Practise file programs: copy one file to another, count characters/words/lines, append records, and read numbers from a file."
    ]}
 ],
 text:[
  "Byron Gottfried, Programming with C, Schaums Outline Series, TMH education, 3rd edition 2017.",
  "E. Balagurusamy, Programming in ANSI C, TMH education, 6th edition 2012."
 ],
 ref:[
  "W. Kernighan Brian, Dennis M. Ritchie, The C Programming language, PHI learning, 2nd edition, 1998.",
  "Yashwant Kanetkar, Exploring C, BPB publisher, 2nd edition, 2003.",
  "Schildt Herbert, C: The complete reference, TMH, 4th edition, 2014.",
  "R.S. Bichkar, Programming With C, Universities Press, 2nd edition, 2012.",
  "Stephen G. Kochan, Programming in C, Addison Wesley Professional, 4th edition 2014.",
  "B.A. Forouzan, R.F. Gillberg, C programming in data structures, Cengage Learning India, 3rd edition 2014."
 ]
});

sylAdd("MET-001",{
 n:"Basic Mechanical Engineering", s:"Basic Mech.",
 type:"theory", ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "To familiarize students with basic concepts of thermodynamics, mechanics, IC engines, measurement and fluid mechanics.",
  "To develop ability among the students to solve mathematical problems related to basic mechanical engineering knowledge."
 ],
 out:[
  "CO1 To understand Engineering Mechanics and analysis of forces in simple structures.",
  "CO2 To give the basic understanding of engineering materials, mechanical properties of materials and basic knowledge of stress-strain and their analysis.",
  "CO3 To gain the knowledge of fluid properties, working of hydraulic machines and understanding of mechanical measurement.",
  "CO4 To gain fundamental knowledge of Engineering Thermodynamics and its analysis.",
  "CO5 To know the basics of Internal combustion engines and their working."
 ],
 units:[
  { t:"Engineering Mechanics", h:8,
    topics:[
     "Review of laws of motion (Newton's three laws)",
     "Transfer of force to parallel position (force-couple system)",
     "Resultant of planar force system (concurrent, parallel, general)",
     "Free Body Diagrams",
     "Equilibrium (conditions, Lami's theorem)",
     "Moment of inertia (area), parallel axis and perpendicular axis theorems",
     "Friction (static, limiting, angle of friction, cone of friction)",
     "Trusses: introduction, perfect, deficient and redundant trusses",
     "Simple trusses",
     "Determination of forces in simple truss members: method of joints",
     "Determination of forces in simple truss members: method of section"
    ],
    formulas:[
     "Resultant of two forces: R = √(P² + Q² + 2PQ cos θ) ;  tan α = Q sin θ/(P + Q cos θ)",
     "Moment of force M = F × d (perpendicular distance) ;  couple moment = F × arm ;  Varignon: moment of resultant = sum of moments",
     "Equilibrium (coplanar): ΣFx = 0, ΣFy = 0, ΣM = 0 ;  Lami: P/sin α = Q/sin β = R/sin γ",
     "Transfer of force F to a parallel position at distance d: same force F + couple M = F·d",
     "Friction: F ≤ μN ;  tan φ = μ (φ = angle of friction) ;  on incline: motion impends when tan θ = μ",
     "MI: rectangle about centroidal axis Ixx = bh³/12 ;  circle Ixx = πd⁴/64 ;  triangle about base = bh³/12, centroidal = bh³/36",
     "Parallel axis: I = IG + Ah² ;  perpendicular axis: Iz = Ix + Iy ;  radius of gyration k = √(I/A)",
     "Truss (perfect): m = 2j − 3 (m members, j joints) ;  method of joints: ΣFx = 0, ΣFy = 0 at each joint ;  method of section: ΣM = 0 about a point on the cut"
    ],
    hints:[
     "Draw FBDs for blocks on rough planes and ladders; practise equilibrium and limiting friction numericals.",
     "Numericals on resultant of concurrent force systems, and MI of composite sections (T, L, I) using the parallel-axis theorem.",
     "Solve 2-3 simple truss problems by both the method of joints and the method of sections; state each member as tension or compression."
    ]},
  { t:"Engineering Materials; Simple Stress and Strain", h:8,
    topics:[
     "Classification of engineering materials (metals, ceramics, polymers, composites)",
     "Cast iron",
     "Carbon steels (low, medium, high)",
     "Alloy steels and their applications",
     "Mechanical properties: strength",
     "Mechanical properties: hardness",
     "Mechanical properties: toughness",
     "Mechanical properties: ductility",
     "Mechanical properties: brittleness",
     "Mechanical properties: malleability etc. (elasticity, plasticity, stiffness, fatigue, creep)",
     "Introduction to stress and strain",
     "Hooke's law",
     "Normal and shear stresses",
     "Stress-strain diagrams for ductile materials",
     "Stress-strain diagrams for brittle materials",
     "Elastic constants and their relationship"
    ],
    formulas:[
     "Normal stress σ = P/A ;  shear stress τ = P/A ;  linear strain e = ΔL/L ;  shear strain γ = deformation/height",
     "Hooke's law: σ = E·e for σ ≤ proportional limit ;  ΔL = PL/(AE)",
     "Modulus of rigidity G = τ/γ ;  bulk modulus K = p/(ΔV/V)",
     "Poisson's ratio ν = lateral strain/longitudinal strain (≈ 0.25 to 0.33 for metals)",
     "Relations: E = 2G(1 + ν) = 3K(1 − 2ν) = 9KG/(3K + G)",
     "Thermal stress (fully restrained): σ = EαΔT",
     "Factor of safety = ultimate stress / working (allowable) stress",
     "Stress-strain points: proportional limit → elastic limit → yield point → ultimate stress → fracture (necking) ;  percentage elongation = (Lf − L0)/L0 × 100",
     "Carbon steel classes: low carbon (mild) ≤ 0.25 % C, medium 0.25–0.6 %, high 0.6–1.5 % ; cast iron 2–4 % C"
    ],
    hints:[
     "Draw the stress-strain curve of mild steel with all the labelled points and compare with a brittle material (cast iron, no yield point).",
     "Give definitions with one example of each mechanical property, and applications of cast iron and alloy steels (stainless, Ni, Cr, Mn steels).",
     "Numericals on axial deformation ΔL = PL/AE, stepped bars, and elastic constants: given E and ν find G and K."
    ]},
  { t:"Measurement and Fluids", h:8,
    topics:[
     "Concept of measurements",
     "Errors in measurement",
     "Introduction to measuring instruments for temperature (thermometers, thermocouple, RTD)",
     "Introduction to measuring instruments for pressure (manometer, Bourdon gauge)",
     "Introduction to measuring instruments for velocity (Pitot tube)",
     "Introduction to measuring instruments for force and torque measurement",
     "Fluid properties (density, specific weight, specific gravity, viscosity, surface tension, compressibility)",
     "Types of fluids (ideal, real, Newtonian, non-Newtonian)",
     "Newton's law of viscosity",
     "Pascal's law",
     "Bernoulli's equation",
     "Working principle of hydraulic turbines (Pelton, Francis, Kaplan)",
     "Working principle of centrifugal pumps",
     "Working principle of reciprocating pumps"
    ],
    formulas:[
     "Density ρ = m/V ;  specific weight w = ρg ;  specific gravity = ρ/ρwater ;  ρwater = 1000 kg/m³",
     "Newton's law of viscosity: τ = μ du/dy ;  kinematic viscosity ν = μ/ρ",
     "Pressure at depth: p = ρgh ;  absolute = gauge + atmospheric ;  Pascal's law: F2/A2 = F1/A1 (hydraulic press)",
     "Continuity: Q = A1V1 = A2V2",
     "Bernoulli: p/(ρg) + V²/(2g) + z = constant (pressure head + velocity head + datum head)",
     "Pitot tube: V = √(2gh)",
     "Hydraulic turbine power = ρ g Q H η ;  pump power P = ρ g Q H/η",
     "Error = measured − true value ;  % error = (error/true value) × 100 ;  accuracy, precision, sensitivity, resolution, range",
     "Torque T = F × r ;  power P = 2πNT/60"
    ],
    hints:[
     "Learn Bernoulli's assumptions (steady, incompressible, inviscid, along a streamline) and solve numericals with venturimeter/pipe of changing area.",
     "Draw and label a centrifugal pump and a reciprocating pump (single acting); compare them and note where priming/air vessels are used.",
     "Classify hydraulic turbines (impulse: Pelton; reaction: Francis, Kaplan) with head range and applications.",
     "Write short notes on types of errors (gross, systematic, random) and sources of measurement error."
    ]},
  { t:"Thermodynamics", h:8,
    topics:[
     "Zeroth law of thermodynamics",
     "First law of thermodynamics",
     "Processes: flow and non-flow",
     "Control volume",
     "Flow work and non-flow work",
     "Steady flow energy equation",
     "Second law: limitations of first law of thermodynamics",
     "Essence of second law",
     "Thermal reservoir",
     "Heat engines",
     "COP of heat pump and refrigerator",
     "Statements of second law (Kelvin-Planck and Clausius) and their equivalence",
     "Carnot cycle"
    ],
    formulas:[
     "First law (closed system): Q = ΔU + W ;  for a cycle ∮dQ = ∮dW",
     "Non-flow work W = ∫p dV ;  isochoric W = 0 ;  isobaric W = p(V2 − V1) ;  isothermal W = p1V1 ln(V2/V1) ;  polytropic (pVⁿ = C) W = (p1V1 − p2V2)/(n − 1) ;  adiabatic n = γ",
     "Enthalpy h = u + pv ;  flow work = pv",
     "Steady flow energy equation: h1 + V1²/2 + gz1 + q = h2 + V2²/2 + gz2 + w",
     "Heat engine efficiency η = W/QH = 1 − QL/QH ;  Carnot: η = 1 − TL/TH (temperatures in K)",
     "Refrigerator COP = QL/W = TL/(TH − TL) (Carnot) ;  heat pump COP = QH/W = TH/(TH − TL) ;  COPHP = COPR + 1",
     "Zeroth law: two bodies in thermal equilibrium with a third are in equilibrium with each other (basis of temperature)",
     "Kelvin-Planck: no engine can work in a cycle and produce net work exchanging heat with a single reservoir ;  Clausius: heat cannot flow from cold to hot without external work",
     "Ideal gas: pV = mRT ;  cp − cv = R ;  γ = cp/cv"
    ],
    hints:[
     "Derive work for isothermal, polytropic and adiabatic processes and draw all on a p-V diagram.",
     "Apply SFEE to a nozzle, turbine, compressor and boiler by dropping the negligible terms; practise 2-3 numericals.",
     "Prove the equivalence of Kelvin-Planck and Clausius statements (violation of one gives violation of the other).",
     "Numericals on Carnot efficiency/COP with temperatures converted to kelvin."
    ]},
  { t:"Internal Combustion Engine", h:8,
    topics:[
     "Introduction to I.C. engines (classification, parts)",
     "Two stroke S.I. engine and its working",
     "Four stroke S.I. engine and its working",
     "Two stroke C.I. engine and its working",
     "Four stroke C.I. engine and its working",
     "Efficiency and mean effective pressure of Otto cycle",
     "Efficiency and mean effective pressure of Diesel cycle",
     "Efficiency and mean effective pressure of Dual cycle"
    ],
    formulas:[
     "Compression ratio r = (Vs + Vc)/Vc = V1/V2",
     "Otto cycle: η = 1 − 1/r^(γ−1) ;  depends only on r and γ",
     "Diesel cycle: η = 1 − (1/r^(γ−1))·[(ρ^γ − 1)/(γ(ρ − 1))] ;  ρ = cut-off ratio = V3/V2",
     "Dual cycle: η = 1 − (1/r^(γ−1))·[(αβ^γ − 1)/((α − 1) + γα(β − 1))] ;  α = pressure ratio, β = cut-off ratio",
     "Mean effective pressure: pm = Wnet/Vs (Vs = swept volume)",
     "Indicated power IP = pm L A n K/60 (n = rpm for 2-stroke; n/2 for 4-stroke; K = number of cylinders)",
     "Brake power BP = 2πNT/60 ;  mechanical efficiency ηm = BP/IP ;  brake thermal efficiency = BP/(ṁf × CV)",
     "For same r, Otto is more efficient than Diesel ;  for same peak pressure and heat rejection, Diesel is more efficient",
     "Four-stroke: one power stroke per two revolutions (suction, compression, power, exhaust) ;  two-stroke: one per revolution"
    ],
    hints:[
     "Draw p-V and T-s diagrams for Otto, Diesel and Dual cycles and derive the air-standard efficiencies.",
     "Explain the working of a 4-stroke petrol engine and a 4-stroke diesel engine with valve timing and compare S.I. and C.I. engines in a table.",
     "Numericals: efficiency for given r and γ, mean effective pressure, indicated and brake power, mechanical efficiency."
    ]}
 ],
 text:[],
 ref:[
  "I H Shames, Engineering Mechanics, PHI publishing.",
  "Singh Onkar, Bhavikatti S.S., Chandra Suresh: Introduction to Mechanical Engineering: Thermodynamics, Mechanics and Strength of Materials, New Age International Publishers.",
  "Dr. R.K. Bansal, Fluid Mechanics & Hydraulic Machines, Laxmi publication.",
  "A. K. Sawhney and P. Sawhney, A Course in Mechanical Measurements and Instrumentation, Dhanpat Rai Pub. New Delhi.",
  "P.K Nag, Engineering Thermodynamics, TMH.",
  "V Ganesan, Internal Combustion Engines, TMH.",
  "C M Agrawal, Basic Mechanical Engineering, Wiley Publication."
 ]
});

sylAdd("BTT-001",{
 n:"Biology for Engineers", s:"Biology",
 type:"bridge", ltp:"2-1-0", cr:0, sem:"I (bridge course for B.Tech Biotechnology, for maths students)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:["To convey to students that Biology is as important a scientific discipline as Mathematics, Physics and Chemistry."],
 out:[
  "CO1 To understand the fundamentals of living things, their classification, cell structure.",
  "CO2 To convey that all forms of life have the same building blocks and yet the manifestations are as diverse as one can imagine, and learn about molecules of life.",
  "CO3 To convey that without catalysis life would not have existed on earth; importance of enzymes.",
  "CO4 The molecular basis of coding and decoding genetic information is universal; learn the molecular basis of gene.",
  "CO5 The fundamental principles of energy transactions are the same in physical and biological world."
 ],
 units:[
  { t:"Introduction to Biotechnology and Classification of Organisms", h:8,
    topics:[
     "Introduction to Biotechnology",
     "Different areas of Biotechnology",
     "Fundamental difference between science and engineering with some examples",
     "Cell as basic unit of life",
     "Hierarchical classification of organisms based on cellularity",
     "Classification based on ultra structure (prokaryote and eukaryote)",
     "Classification based on energy and carbon utilization (autotroph, heterotroph, phototroph, chemotroph)",
     "Classification based on ammonia excretion (ammonotelic, ureotelic, uricotelic)",
     "Classification based on habitat"
    ],
    formulas:[
     "Prokaryote: no membrane-bound nucleus, 70S ribosomes, e.g. bacteria ;  eukaryote: true nucleus and organelles, 80S ribosomes",
     "Cell theory: all living things are made of cells; the cell is the basic unit; cells arise from pre-existing cells",
     "Energy/carbon: photoautotroph (light, CO₂), chemoautotroph (chemicals, CO₂), photoheterotroph, chemoheterotroph (organic carbon)",
     "Ammonia excretion: ammonotelic (fish, aquatic), ureotelic (mammals, amphibians), uricotelic (birds, reptiles, insects)",
     "Five-kingdom classification (Whittaker): Monera, Protista, Fungi, Plantae, Animalia ;  three-domain: Bacteria, Archaea, Eukarya"
    ],
    hints:[
     "Draw and compare a prokaryotic and an animal/plant cell (with organelle functions) in a table.",
     "Memorise one example each for every classification criterion (cellularity, ultrastructure, energy source, ammonia excretion, habitat).",
     "Prepare a short answer on the branches of biotechnology (medical, agricultural, industrial, environmental) with examples."
    ]},
  { t:"Single-celled Organisms and Microbial Techniques", h:8,
    topics:[
     "Concept of single celled organisms",
     "Concept of species and strains",
     "Bacterial identification and classifications",
     "Molecular taxonomy",
     "Pure culture techniques",
     "Media compositions",
     "Sterilization kinetics of media",
     "Growth kinetics of microbes"
    ],
    formulas:[
     "Binary fission: N = N0·2ⁿ ;  number of generations n = (log N − log N0)/log 2 = 3.32 (log N − log N0)",
     "Generation (doubling) time g = t/n ;  specific growth rate μ = ln 2/g = 0.693/g",
     "Exponential phase: dN/dt = μN ;  N = N0 e^(μt)",
     "Growth phases: lag → log (exponential) → stationary → death (decline)",
     "Sterilization (first-order kill): N = N0 e^(−kt) ;  decimal reduction time D = 2.303/k ;  autoclave 121 °C, 15 psi, 15–20 min",
     "Pure culture techniques: streak plate, spread plate, pour plate ;  Gram stain: Gram-positive (purple), Gram-negative (pink)",
     "Molecular taxonomy: 16S rRNA gene sequencing, G+C content, DNA-DNA hybridisation ;  medium = carbon, nitrogen, minerals, growth factors (+ agar 1.5 % for solid medium)"
    ],
    hints:[
     "Solve numericals on number of generations, doubling time and final population after time t.",
     "Draw the bacterial growth curve and explain each phase; relate to batch culture in fermenters.",
     "Learn the streak-plate procedure, and the difference between complex/defined and selective/differential media."
    ]},
  { t:"Biomolecules", h:8,
    topics:[
     "Amino acids",
     "Peptide bond and proteins",
     "Hierarchy of structure in proteins (primary, secondary, tertiary, quaternary)",
     "General structure and function of nucleotides",
     "Nucleic acids: DNA and RNA",
     "Carbohydrates: monosaccharides",
     "Carbohydrates: disaccharides",
     "Carbohydrates: polysaccharides",
     "Lipids",
     "Enzymes"
    ],
    formulas:[
     "Amino acid: H₂N–CHR–COOH (amino group, carboxyl group, H and side chain R on the α-carbon) ;  20 standard amino acids",
     "Peptide bond: –CO–NH– formed by condensation (loss of H₂O) between COOH and NH₂ ;  polypeptide with n residues has (n − 1) peptide bonds",
     "Protein structure: primary (sequence), secondary (α-helix, β-sheet; H-bonds), tertiary (3-D fold), quaternary (multiple subunits)",
     "Nucleotide = nitrogenous base + pentose sugar + phosphate ;  DNA: A, T, G, C, deoxyribose ;  RNA: A, U, G, C, ribose ;  Chargaff: A = T, G = C",
     "Carbohydrates: glucose/fructose (monosaccharides) ; sucrose = glucose + fructose, maltose = glucose + glucose, lactose = glucose + galactose ; starch, glycogen, cellulose (polysaccharides)",
     "Lipids: triglyceride = glycerol + 3 fatty acids (ester bonds); phospholipids form membranes",
     "Enzyme kinetics (Michaelis-Menten): v = Vmax[S]/(Km + [S]) ;  v = Vmax/2 when [S] = Km ;  Lineweaver-Burk: 1/v = (Km/Vmax)(1/[S]) + 1/Vmax",
     "Enzymes lower activation energy, are specific, are not consumed ;  active site, lock-and-key and induced-fit models"
    ],
    hints:[
     "Draw the general amino acid, a dipeptide with the peptide bond marked, and the four levels of protein structure.",
     "Draw the structures of nucleotide, DNA double helix (antiparallel, 10 bp per turn) and list DNA vs RNA differences.",
     "Learn the M-M equation, the meaning of Km and Vmax, and what competitive/non-competitive inhibitors do to them."
    ]},
  { t:"Genetic Material and Heredity", h:8,
    topics:[
     "DNA as a genetic material",
     "Central dogma of life (replication, transcription, translation)",
     "Genetic code and its concept",
     "Universality and degeneracy of genetic code",
     "Principles of Heredity",
     "Concept of allele and gene",
     "Mendel and his experiments"
    ],
    formulas:[
     "Central dogma: DNA → (transcription) → RNA → (translation) → protein ;  replication is semi-conservative (Meselson-Stahl)",
     "Genetic code: triplet codons, 4³ = 64 codons ;  61 sense codons + 3 stop (UAA, UAG, UGA) ;  AUG = start (Met)",
     "Degeneracy: more than one codon for most amino acids ;  universality: same code in nearly all organisms ;  non-overlapping, commaless",
     "Evidence for DNA as genetic material: Griffith (transformation), Avery-MacLeod-McCarty, Hershey-Chase (³²P in DNA, ³⁵S in protein)",
     "Mendel: monohybrid F2 phenotypic ratio 3 : 1, genotypic 1 : 2 : 1 ;  test cross 1 : 1 ;  dihybrid 9 : 3 : 3 : 1",
     "Laws: dominance, segregation (one allele per gamete), independent assortment ;  gametes of AaBb: 2ⁿ = 4",
     "Genotype vs phenotype ;  homozygous vs heterozygous ;  allele = alternative form of a gene at a locus"
    ],
    hints:[
     "Work out monohybrid and dihybrid crosses with Punnett squares and state the ratios.",
     "Explain the three steps of the central dogma with the enzymes involved (DNA polymerase, RNA polymerase, ribosome/tRNA).",
     "Given an mRNA sequence, split into codons and write the amino acid sequence using a codon table."
    ]},
  { t:"Metabolism and Bioenergetics", h:8,
    topics:[
     "Basic concept of metabolism (anabolism and catabolism)",
     "Thermodynamics: basic concepts",
     "ATP as an energy currency",
     "Energy yielding and energy consuming reactions",
     "Glycolysis",
     "Krebs cycle"
    ],
    formulas:[
     "Gibbs free energy: ΔG = ΔH − TΔS ;  ΔG < 0 spontaneous (exergonic), ΔG > 0 non-spontaneous (endergonic) ;  ΔG = ΔG° + RT ln Q",
     "ATP + H₂O → ADP + Pᵢ ;  ΔG°′ ≈ −30.5 kJ/mol (−7.3 kcal/mol) ;  coupling exergonic and endergonic reactions",
     "Glycolysis (cytoplasm): glucose (6C) → 2 pyruvate (3C) ;  net 2 ATP (4 made − 2 used) + 2 NADH",
     "Link reaction: pyruvate → acetyl-CoA + CO₂ + NADH",
     "Krebs (TCA) cycle (mitochondrial matrix): per acetyl-CoA 3 NADH + 1 FADH₂ + 1 GTP/ATP + 2 CO₂ ;  per glucose 6 NADH, 2 FADH₂, 2 ATP, 4 CO₂ (with 2 turns)",
     "Overall aerobic respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O ;  about 30–32 ATP per glucose (older texts: 36–38)",
     "First law: energy is conserved ;  second law: entropy of the universe increases"
    ],
    hints:[
     "Draw the 10 steps of glycolysis (key enzymes hexokinase, PFK, pyruvate kinase) with ATP/NADH balance.",
     "Draw the Krebs cycle with input/output of each turn and where NADH, FADH₂, GTP and CO₂ are produced.",
     "Explain why ATP is the energy currency and how coupled reactions drive biosynthesis."
    ]}
 ],
 text:[
  "Principles of Biochemistry: A.L. Lehninger, Nelson and Cox, McMillan Worth Publishers.",
  "Concept of Genetics: P.K. Gupta, Rastogi Publications.",
  "Text book of Microbiology: R. C. Dubey and D. K. Maheshwari, S. Chand and Company."
 ],
 ref:["Microbiology: Prescott's."]
});

sylAdd("AHT-000",{
 n:"Basic Mathematics", s:"Basic Maths",
 type:"bridge", ltp:"2-1-0", cr:0, sem:"I (bridge course for B.Tech Biotechnology, for bio students)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "Learn distinct intermediate-level mathematical concepts involved in engineering problems.",
  "Get knowledge for geometrical perspective of engineering problems.",
  "Become well-versed with partial fractions.",
  "Acquire the knowledge of limit, continuity, derivatives, and integrations and their applications.",
  "Acquaintance with ordinary and partial differential equations."
 ],
 out:[
  "LO1 Comprehend intermediate-level mathematical domain included in engineering problems.",
  "LO2 Learn basic analytical methods to conceptualize the engineering problems.",
  "LO3 Understand how to proceed the engineering problems.",
  "LO4 Learn to determine the solutions for mathematical problems.",
  "LO5 Apprehend mathematical methodology."
 ],
 units:[
  { t:"Analytical Geometry", h:8,
    topics:[
     "Introduction to coordinate geometry",
     "Signs of the coordinates (quadrants)",
     "Distance formula",
     "Straight line",
     "Slope or gradient of a straight line",
     "Conditions for parallelism and perpendicularity of two lines",
     "Slope of a line joining two points",
     "Slope-intercept form of a straight line"
    ],
    formulas:[
     "Distance: d = √((x2 − x1)² + (y2 − y1)²) ;  from origin d = √(x² + y²)",
     "Slope m = tan θ = (y2 − y1)/(x2 − x1)",
     "Parallel lines: m1 = m2 ;  perpendicular lines: m1·m2 = −1",
     "Slope-intercept form: y = mx + c ;  point-slope: y − y1 = m(x − x1) ;  two-point: (y − y1) = [(y2 − y1)/(x2 − x1)](x − x1)",
     "Angle between two lines: tan θ = |(m1 − m2)/(1 + m1m2)|",
     "Section formula (internal, ratio m:n): x = (mx2 + nx1)/(m + n), y = (my2 + ny1)/(m + n) ;  midpoint = ((x1+x2)/2, (y1+y2)/2)",
     "Signs: quadrant I (+,+), II (−,+), III (−,−), IV (+,−)"
    ],
    hints:[
     "Practise finding the slope and equation of a line through two points and converting to y = mx + c.",
     "Verify parallel/perpendicular lines from equations, and use the distance formula to check for collinearity or a right triangle.",
     "Solve 5-6 problems on finding the intercepts and plotting the line."
    ]},
  { t:"Partial Fraction, Limits and Continuity", h:8,
    topics:[
     "Introduction to polynomials",
     "Rational fractions",
     "Proper and improper fractions",
     "Partial fraction",
     "Resolving into partial fraction",
     "Introduction and definition of limit of a function",
     "Continuity of a function"
    ],
    formulas:[
     "Proper fraction: degree of numerator < degree of denominator ;  improper: divide first to get polynomial + proper fraction",
     "Distinct linear factors: P(x)/((x − a)(x − b)) = A/(x − a) + B/(x − b)",
     "Repeated linear factor: P(x)/(x − a)² = A/(x − a) + B/(x − a)²",
     "Irreducible quadratic: (Ax + B)/(x² + px + q)",
     "Limit: lim x→a f(x) = L if left-hand limit = right-hand limit = L",
     "Standard limits: lim x→0 sin x/x = 1 ;  lim x→0 (eˣ − 1)/x = 1 ;  lim x→0 (1 + x)^(1/x) = e ;  lim x→a (xⁿ − aⁿ)/(x − a) = n·aⁿ⁻¹",
     "Continuity at x = a: lim x→a f(x) = f(a) (limit exists, function defined, and they are equal)"
    ],
    hints:[
     "Practise the cover-up (Heaviside) method for distinct linear factors and the comparing-coefficients method for repeated/quadratic factors.",
     "Evaluate limits by factorisation, rationalisation and standard limits; check LHL and RHL for piecewise functions.",
     "For continuity questions, find the constant k that makes a piecewise function continuous."
    ]},
  { t:"Derivative and its Properties", h:8,
    topics:[
     "First principle of differentiation",
     "Differentiation of standard functions",
     "Basic rule of differentiation: product rule",
     "Basic rule of differentiation: quotient rule",
     "Basic rule of differentiation: chain rule",
     "Derivatives of exponential and logarithmic functions",
     "Differentiation of infinite series",
     "Basic applications of derivatives"
    ],
    formulas:[
     "First principle: f′(x) = lim h→0 [f(x + h) − f(x)]/h",
     "d/dx (xⁿ) = nxⁿ⁻¹ ;  d/dx (sin x) = cos x ;  d/dx (cos x) = −sin x ;  d/dx (tan x) = sec²x",
     "d/dx (eˣ) = eˣ ;  d/dx (aˣ) = aˣ ln a ;  d/dx (ln x) = 1/x ;  d/dx (log_a x) = 1/(x ln a)",
     "Product: (uv)′ = u′v + uv′ ;  quotient: (u/v)′ = (u′v − uv′)/v² ;  chain: d/dx f(g(x)) = f′(g(x))·g′(x)",
     "Series: d/dx (Σ aₙxⁿ) = Σ n aₙ xⁿ⁻¹ (term-by-term, within radius of convergence), e.g. eˣ = Σ xⁿ/n!",
     "Applications: slope of tangent = f′(a) ;  maxima/minima where f′(x) = 0 (f″ < 0 maximum, f″ > 0 minimum) ;  velocity v = ds/dt, acceleration a = dv/dt ;  rate of change dy/dt = (dy/dx)(dx/dt)"
    ],
    hints:[
     "Derive the derivative of xⁿ, sin x and eˣ from first principle.",
     "Practise mixed product/quotient/chain rule problems (e.g. x²eˣ sin x, ln(x² + 1)).",
     "Do applications: tangent/normal equations, rate of change and simple maximum-minimum word problems."
    ]},
  { t:"Integration and its Properties", h:8,
    topics:[
     "Antiderivative",
     "Integration of standard functions",
     "Basic properties of integrals",
     "Integration by substitution",
     "Integration by using trigonometric identities",
     "Integration by parts",
     "Integration by partial fractions",
     "Basic applications of integration"
    ],
    formulas:[
     "∫xⁿ dx = xⁿ⁺¹/(n + 1) + C (n ≠ −1) ;  ∫(1/x) dx = ln|x| + C ;  ∫eˣ dx = eˣ + C ;  ∫aˣ dx = aˣ/ln a + C",
     "∫sin x dx = −cos x + C ;  ∫cos x dx = sin x + C ;  ∫sec²x dx = tan x + C",
     "Linearity: ∫[af + bg] dx = a∫f dx + b∫g dx ;  ∫ₐᵇ f dx = F(b) − F(a) (fundamental theorem)",
     "By parts: ∫u dv = uv − ∫v du (choose u by ILATE: Inverse, Log, Algebraic, Trig, Exponential)",
     "Substitution: ∫f(g(x))g′(x) dx = ∫f(t) dt with t = g(x) ;  ∫f′(x)/f(x) dx = ln|f(x)| + C",
     "Trig identities: sin²x = (1 − cos 2x)/2 ;  cos²x = (1 + cos 2x)/2 ;  2 sin A cos B = sin(A+B) + sin(A−B)",
     "Area under y = f(x) from a to b: A = ∫ₐᵇ f(x) dx"
    ],
    hints:[
     "Practise substitution and by-parts integrals (x eˣ, x sin x, ln x) until the ILATE rule is automatic.",
     "Integrate rational functions by first resolving into partial fractions (link to unit 2).",
     "Do area-under-a-curve problems using definite integrals."
    ]},
  { t:"Differential Equations", h:8,
    topics:[
     "Types of differential equations",
     "Order and degree of a differential equation",
     "Ordinary differential equations",
     "First order and first degree ordinary differential equations and their solutions",
     "Order and degree of partial differential equations",
     "Classification of partial differential equations"
    ],
    formulas:[
     "Order = highest derivative present ;  degree = power of the highest-order derivative after clearing radicals/fractions (must be polynomial in derivatives)",
     "ODE: one independent variable ;  PDE: two or more independent variables with partial derivatives",
     "Variable separable: dy/dx = f(x)g(y) ⟹ ∫dy/g(y) = ∫f(x)dx + C",
     "Homogeneous: dy/dx = f(y/x) ;  put y = vx ⟹ dy/dx = v + x dv/dx",
     "Linear first order: dy/dx + Py = Q ;  IF = e^(∫P dx) ;  y·IF = ∫Q·IF dx + C",
     "Exact: M dx + N dy = 0 is exact if ∂M/∂y = ∂N/∂x",
     "General solution has as many arbitrary constants as the order ;  a particular solution fixes them using initial conditions",
     "PDE classification: order, linear vs non-linear, homogeneous vs non-homogeneous"
    ],
    hints:[
     "Given a differential equation, state its order and degree; practise 8-10 examples (watch for roots and fractions).",
     "Solve separable, homogeneous and linear first-order equations; check answers by differentiating.",
     "Learn the classification of PDEs: e.g. uxx + uyy = 0 (2nd order, linear, homogeneous)."
    ]}
 ],
 text:[
  "Mathematics-I and II, NCERT text book, NCERT Publisher, 2014.",
  "R.D. Sharma, Mathematics (Vol 1 and 2), Dhanpat Rai Publications, 2021.",
  "R.S. Agarwal, Senior Secondary School Mathematics, Bharti Bhawan, 2015.",
  "M.L. Bhargava, Elementary Mathematics, Jeevan Son Publications, 2017."
 ],
 ref:[]
});

sylAdd("WD-101",{
 n:"Web Development 101 (Minor: Advance Web Development)", s:"WD 101",
 type:"minor", ltp:"0-1-0", cr:1, sem:"Minor Degree Program (Advance Web Development)",
 obj:[
  "For students without prior programming experience (or with a light background) to build a robust foundation for computational thinking.",
  "Deconstruct what software applications do and reason about computation as the transformation of data from one shape to another.",
  "Set up a development environment, be introduced to HTML & CSS and learn to program in a functional subset of JavaScript.",
  "Build an Online Registration form that runs on the browser and stores/retrieves submissions using browser native web storage; create and deploy a simple website to the internet."
 ],
 out:[
  "Set up a development environment.",
  "Create and style basic web pages.",
  "Transform data with JavaScript.",
  "Use computational abstractions.",
  "Work with the HTML Forms.",
  "Work on native HTML Form Validations.",
  "Understand Web Storage for saving and retrieving data."
 ],
 units:[
  { t:"Welcome to the course",
    topics:[
     "Introduction to the World Wide Web",
     "Setting up a development environment on the computer",
     "Visual Studio Code as the editor",
     "Prettier extension for code formatting",
     "ESLint extension for code quality"
    ],
    formulas:[
     "Web = browser (client) requests → server responds with HTML/CSS/JS over HTTP/HTTPS",
     "URL = scheme://host:port/path?query#fragment",
     "Prettier formats code style (spacing, quotes, line length); ESLint finds bugs and rule violations (unused variables, undeclared names)"
    ],
    hints:[
     "Install VS Code, Prettier and ESLint and enable format-on-save.",
     "Be able to explain client, server, browser and what happens when you type a URL."
    ]},
  { t:"Let's create our own websites!",
    topics:[
     "Developing a simple website using HTML",
     "Experimenting with useful HTML tags",
     "Learning how to look inside websites (browser developer tools / view source)",
     "Deploying the website",
     "Sharing the website over the Internet"
    ],
    formulas:[
     "Skeleton: <!DOCTYPE html><html><head><title>…</title></head><body>…</body></html>",
     "Common tags: h1–h6, p, a href, img src alt, ul/ol/li, div, span, table",
     "Element = opening tag + content + closing tag ;  attributes: name=\"value\""
    ],
    hints:[
     "Build a personal page with headings, paragraph, image, list and links, then inspect it with DevTools.",
     "Deploy the page to a static host and share the link."
    ]},
  { t:"Basic Introduction to HTML and CSS",
    topics:[
     "Basic introduction to HTML",
     "Basic introduction to CSS",
     "Putting together a web page that contains HTML, CSS, and JavaScript"
    ],
    formulas:[
     "CSS rule: selector { property: value; }",
     "Ways to add CSS: inline style, <style> in head, external <link rel=\"stylesheet\" href=\"…\">",
     "JavaScript in page: <script src=\"app.js\"></script> (or inline <script>) ;  HTML = structure, CSS = presentation, JS = behaviour"
    ],
    hints:[
     "Make a single page using all three languages: an HTML button, CSS styling, a JS click handler."
    ]},
  { t:"Style Matters",
    topics:[
     "Styling web pages using CSS",
     "Using Tailwind CSS to add custom styling to webpages",
     "Utility classes for colour, spacing and typography"
    ],
    formulas:[
     "Selectors: element, .class, #id, descendant (a b), child (a > b), :hover",
     "Box model: content + padding + border + margin",
     "Tailwind uses utility classes, e.g. class=\"p-4 bg-blue-500 text-white rounded\""
    ],
    hints:[
     "Restyle the same page once with plain CSS and once with Tailwind utility classes and compare.",
     "Practise colours, fonts, spacing (margin/padding), flexbox layout."
    ]},
  { t:"Working with JavaScript data types",
    topics:[
     "Different data types: Number",
     "Different data types: Boolean",
     "Different data types: String",
     "Carrying out various operations on data types",
     "Understanding the difference between data types",
     "Deciding suitability of a data type for a task or operation"
    ],
    formulas:[
     "typeof 42 → \"number\" ;  typeof true → \"boolean\" ;  typeof \"a\" → \"string\"",
     "Operators: + − * / % ** ;  comparison === !== < > ;  logical && || !",
     "Beware: \"5\" + 1 = \"51\" (string concatenation) but \"5\" − 1 = 4 ;  === does not coerce, == does",
     "String methods: length, toUpperCase(), slice(), includes(), split(), template literal `Hello ${name}`"
    ],
    hints:[
     "Try each operation in the browser console and note the result type.",
     "Practise number-to-string and string-to-number conversions (Number(), parseInt(), String())."
    ]},
  { t:"Working with JavaScript data structures",
    topics:[
     "Iterating with arrays using the forEach method",
     "Generating an HTML list from an array",
     "Performing transformations on an array using the map method",
     "Filtering of arrays",
     "Introduction to objects in JavaScript",
     "Creating objects",
     "Adding and accessing properties of objects",
     "Performing various operations on objects"
    ],
    formulas:[
     "arr.forEach(fn) runs fn for each element (returns undefined) ;  arr.map(fn) returns a new array of results ;  arr.filter(fn) returns elements for which fn is true",
     "Object literal: const p = { name: \"Asha\", age: 20 } ;  access p.name or p[\"name\"] ;  add p.city = \"Dehradun\" ;  delete p.age",
     "Object.keys(p), Object.values(p), Object.entries(p) ;  spread {...p}",
     "Building a list: items.forEach(i => { const li = document.createElement(\"li\"); li.textContent = i; ul.appendChild(li); })"
    ],
    hints:[
     "Given an array of numbers, use map for squares, filter for evens, and forEach to print them.",
     "Model a student as an object and render an array of students as an HTML list."
    ]},
  { t:"Functions - code we can call multiple times",
    topics:[
     "Using functions to modularize the codebase",
     "Returning values from a function",
     "Treating functions as values",
     "Passing functions as arguments"
    ],
    formulas:[
     "function add(a, b) { return a + b; } ;  arrow: const add = (a, b) => a + b;",
     "A function with no return gives undefined ;  parameters (in definition) vs arguments (in call)",
     "Functions are first-class values: can be stored in variables, passed as callbacks (arr.map(square)), returned from other functions"
    ],
    hints:[
     "Refactor repeated code into a function; write a function that takes another function as an argument.",
     "Understand callbacks by rewriting a map/filter call with a named function."
    ]},
  { t:"Create a form with validations",
    topics:[
     "HTML form element and form data",
     "Creating a user form",
     "Adding validations",
     "Storing and retrieving data (browser web storage)",
     "Developing and deploying a personal website including the form",
     "Displaying the data submitted by users on the website"
    ],
    formulas:[
     "<form> with <input type=\"text|email|password|number|date\" name=\"…\" required minlength maxlength pattern min max>, <label for>, <button type=\"submit\">",
     "Native validation attributes: required, minlength/maxlength, min/max, pattern (regex), type=\"email\"",
     "Web storage: localStorage.setItem(key, value) / getItem(key) / removeItem(key) ;  stores strings, so use JSON.stringify()/JSON.parse() for objects ;  sessionStorage is cleared when the tab closes",
     "Form submit handler: form.addEventListener(\"submit\", e => { e.preventDefault(); … })"
    ],
    hints:[
     "Build the registration form with name, email, date of birth and terms checkbox; validate natively; save entries to localStorage; render them in a table.",
     "Deploy the final website to the internet as the course project."
    ]}
 ],
 text:[],
 ref:["Original open-source course material (videos, text, images) under Creative Commons Attribution-ShareAlike 4.0 International License, (c) Freshworks Inc. & Pupilfirst Pvt. Ltd."]
});

sylAdd("WD-201",{
 n:"Web Development 201: Server-side programming with Node.js", s:"WD 201",
 type:"minor", ltp:"0-6-0", cr:6, sem:"Minor Degree Program (Advance Web Development)",
 obj:["To teach students how to build web applications using the Express.js framework, with focus on industry practices like functional programming, object-oriented design, programming style guides, security, and version control."],
 out:[
  "Build web applications using Express.js.",
  "Manipulate data using both imperative and functional programming techniques.",
  "Model real-world systems using object-oriented design.",
  "Write HTML & CSS to create elegant web pages.",
  "Build database applications using Sequelize."
 ],
 units:[
  { t:"Introduction to Node.js",
    topics:[
     "Installing Node.js",
     "Writing programs on Node.js",
     "Using the Node.js REPL",
     "Using GitHub",
     "Collaborating on code with others using the git tool"
    ],
    formulas:[
     "node file.js runs a script ;  node (no args) opens the REPL ;  node -v shows the version",
     "Git basics: git init, git add, git commit -m, git status, git log, git push, git pull, git clone, git branch, git checkout -b"
    ],
    hints:["Push a first Node.js program to GitHub and clone it on another folder to practise collaboration."]},
  { t:"Working with NPM",
    topics:[
     "Introduction to the Node.js package manager (NPM)",
     "Writing custom NPM modules",
     "Exploring and using built-in modules of Node.js"
    ],
    formulas:[
     "npm init -y creates package.json ;  npm install pkg (dependencies) ;  npm install -D pkg (devDependencies) ;  npm run script",
     "CommonJS: module.exports = fn ;  const x = require(\"./x\") ;  built-ins: fs, path, http, os, events",
     "Semantic versioning MAJOR.MINOR.PATCH ;  ^1.2.3 allows minor/patch updates"
    ],
    hints:["Write a small module, export functions, and use it from another file; explore fs and path."]},
  { t:"Node.js deep dive",
    topics:[
     "Building the first application",
     "Using closures to emulate private methods",
     "Structuring the application code into modules"
    ],
    formulas:[
     "Closure: an inner function keeps access to variables of the outer function even after the outer function returns",
     "Private emulation: const counter = () => { let n = 0; return { inc: () => ++n, get: () => n }; }"
    ],
    hints:["Build a small module (e.g. todo list functions) whose internal state is only accessible via returned methods."]},
  { t:"Testing",
    topics:[
     "Introduction to testing",
     "Writing tests for the application",
     "Using Jest to run the tests",
     "Using pre-commit hooks to run the tests automatically before each commit"
    ],
    formulas:[
     "Jest: test(\"name\", () => { expect(fn(2)).toBe(4); }) ;  matchers toBe, toEqual, toBeTruthy, toThrow ;  describe/beforeAll/afterAll",
     "Run with npx jest or npm test ;  pre-commit hooks via Husky run the tests before git commit succeeds"
    ],
    hints:["Write tests first for a function (red), make them pass (green), then refactor."]},
  { t:"Databases and Sequelize",
    topics:[
     "Introduction to databases",
     "Setting up a PostgreSQL database",
     "Connecting to a database from a Node.js application",
     "Creating Sequelize models to manipulate data"
    ],
    formulas:[
     "SQL: CREATE TABLE, INSERT, SELECT … WHERE, UPDATE, DELETE ;  primary key uniquely identifies a row",
     "Sequelize: new Sequelize(db, user, pass, {dialect: \"postgres\"}) ;  Model.init / sequelize.define ;  Model.create, findAll, findByPk, update, destroy",
     "Migrations create/alter tables with sequelize-cli (npx sequelize-cli db:migrate)"
    ],
    hints:["Create a Todo model with title and dueDate and perform all CRUD operations from a script."]},
  { t:"Backend Web development with Express.js",
    topics:[
     "Developing the first application",
     "Connecting the application to a PostgreSQL database",
     "Basics of the CRUD pattern",
     "Building additional features on the application"
    ],
    formulas:[
     "const app = express(); app.get(\"/todos\", (req, res) => res.json(list)); app.listen(3000)",
     "CRUD ↔ HTTP: Create = POST, Read = GET, Update = PUT/PATCH, Delete = DELETE ;  req.params, req.query, req.body ;  app.use(express.json())",
     "Status codes: 200 OK, 201 Created, 404 Not Found, 422 Unprocessable, 500 Server Error"
    ],
    hints:["Expose REST endpoints for todos and test them with curl or Postman."]},
  { t:"Add User Interface for To-do Application",
    topics:[
     "Creating interfaces for the application",
     "Converting a given visual design into working HTML and CSS",
     "Practising layout and styling of the to-do interface"
    ],
    formulas:[
     "Semantic HTML: header, nav, main, section, footer ;  CSS layout: flexbox, grid ;  box model",
     "Responsive design: <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> and media queries"
    ],
    hints:["Take a screenshot mock-up and reproduce it pixel-close with HTML and CSS (or Tailwind)."]},
  { t:"EJS Templating",
    topics:[
     "Basics of the MVC pattern",
     "Rendering dynamic data inside HTML pages using EJS templates",
     "Deploying the work to a remote server"
    ],
    formulas:[
     "MVC: Model (data/DB), View (EJS templates), Controller (route handlers)",
     "app.set(\"view engine\", \"ejs\") ;  res.render(\"index\", { todos }) ;  EJS tags: <%= value %> (escaped output), <% code %> (scriptlet), <%- html %> (raw), <%- include('partial') %>",
     "Static files: app.use(express.static(path.join(__dirname, \"public\")))"
    ],
    hints:["Render the todo list from the database into an EJS page and deploy it on a cloud host."]},
  { t:"HTML forms to save and accept user inputs",
    topics:[
     "Accepting user input via the form element in HTML",
     "The CRUD pattern: creation of resources using forms",
     "Deletion of existing resources",
     "Cross Site Request Forgery (CSRF)",
     "Using authenticity tokens to prevent CSRF attacks",
     "Introduction to APIs"
    ],
    formulas:[
     "<form action=\"/todos\" method=\"post\"> ; body parsing: app.use(express.urlencoded({extended: true}))",
     "HTML forms only support GET and POST, so PUT/DELETE use fetch() or method override",
     "CSRF: a malicious site makes the browser send an authenticated request ;  defence: unique per-session token in a hidden field verified on the server (csurf / csrf-tokens)",
     "API: a defined interface for programs to talk to each other, usually JSON over HTTP"
    ],
    hints:["Add create and delete features with forms and protect them with CSRF tokens."]},
  { t:"User Authentication and final wrap-up",
    topics:[
     "Sequelize association",
     "Migration and validation",
     "Building a functional user sign-up page",
     "Password storage",
     "Browser cookies and sessions",
     "User authentication and related best practices",
     "One-off flash messages"
    ],
    formulas:[
     "Association: User.hasMany(Todo) ;  Todo.belongsTo(User) ;  foreign key userId",
     "Never store plain-text passwords ;  hash with bcrypt: bcrypt.hash(pw, saltRounds) and bcrypt.compare(pw, hash) (salted, slow hash)",
     "Session: server stores session data; browser holds session-id cookie ;  Passport.js local strategy for login ;  connect-ensure-login protects routes",
     "Flash messages: stored in the session and shown once (connect-flash)"
    ],
    hints:["Add sign-up/login/logout, ensure each user sees only their own todos, and show flash messages for errors."]}
 ],
 text:[],
 ref:["Original open-source course material (videos, text, images) under Creative Commons Attribution-ShareAlike 4.0 International License, (c) Freshworks Inc. & Pupilfirst Pvt. Ltd."]
});

sylAdd("WD-301",{
 n:"Web Development 301: Front-end with React & TypeScript", s:"WD 301",
 type:"minor", ltp:"0-6-0", cr:6, sem:"Minor Degree Program (Advance Web Development)",
 obj:[
  "Understand the basic architecture of front end applications and create web applications using the React TypeScript front-end stack.",
  "Interaction between a client-side application and server-side app via an API.",
  "Industry practices for state management and usage of static types.",
  "Best practices with regard to the development of a modern client-side application.",
  "Learn to build TypeScript projects from scratch to scale."
 ],
 out:[
  "Be able to create Single Page Applications (SPA) using React, TypeScript and TailwindCSS.",
  "Have a solid understanding of static types, and know how to port untyped JavaScript to TypeScript.",
  "Learn typed state management that is in line with a backend data model."
 ],
 units:[
  { t:"React fundamentals",
    topics:[
     "Setting up a development environment for TypeScript",
     "Introduction to the TypeScript programming language",
     "Introduction to the React framework",
     "Basic concepts underpinning React for dynamic reactive user interfaces"
    ],
    formulas:[
     "Component: function App() { return <h1>Hello</h1>; } ;  JSX = JavaScript + XML-like syntax, compiled to React.createElement",
     "Props: <Card title=\"x\" /> read in the child as props.title ;  props are read-only",
     "React renders UI = function(state, props) ;  virtual DOM diffing updates only changed nodes"
    ],
    hints:["Create a Vite + React + TypeScript project and build a few nested components passing typed props."]},
  { t:"State management",
    topics:[
     "Hooks feature of React",
     "Usage of callback functions",
     "Building dynamic components that maintain an internal state",
     "State management by building a form and accepting user input"
    ],
    formulas:[
     "const [count, setCount] = useState<number>(0) ;  setCount(c => c + 1) (functional update)",
     "Controlled input: <input value={v} onChange={e => setV(e.target.value)} />",
     "Rules of Hooks: call hooks only at the top level of a component/custom hook; never in loops or conditions"
    ],
    hints:["Build a task-list form with useState and an add/remove callback passed to children."]},
  { t:"A deeper dive into React Hooks",
    topics:[
     "Common pitfalls of state management",
     "In-browser persistent storage",
     "Additional standard hooks (useEffect, useRef, useContext, useMemo, useCallback)",
     "Creation and use of custom hooks"
    ],
    formulas:[
     "useEffect(() => { … return cleanup; }, [deps]) ;  empty [] runs once after mount",
     "Pitfalls: mutating state directly, stale closures, missing dependencies, infinite effect loops",
     "Custom hook: function useLocalStorage<T>(key: string, init: T) { … } must start with 'use'",
     "Persistence: localStorage.setItem(key, JSON.stringify(v)) / JSON.parse(localStorage.getItem(key)!)"
    ],
    hints:["Write a useLocalStorage custom hook and use it to persist app state across reloads."]},
  { t:"Client-side routing",
    topics:[
     "Client-side routing as a separate behaviour from server-side route management",
     "Use of path parameters",
     "Query parameters",
     "Programmatic navigation",
     "Operation of links and URLs handled client-side"
    ],
    formulas:[
     "React Router: <Route path=\"/tasks/:id\" element={<Task/>} /> ;  useParams() reads :id",
     "Query: useSearchParams() for /tasks?status=done ;  navigation: <Link to=\"/x\"> and useNavigate()",
     "SPA routing changes the URL via the History API without a full page reload"
    ],
    hints:["Add /projects/:id and /projects/:id/tasks routes with links and a redirect after login."]},
  { t:"Types in depth and Variants",
    topics:[
     "Function types",
     "Custom-defined types (type aliases and interfaces)",
     "Generics",
     "Union types",
     "Why the 'any' type should be avoided in practice",
     "TypeScript's type inference behaviour"
    ],
    formulas:[
     "function f(x: number): string ;  type Fn = (a: number) => void ;  interface User { id: number; name?: string }",
     "Union: type Id = string | number ;  narrowing with typeof / in / discriminated unions",
     "Generics: function first<T>(a: T[]): T ;  Array<T>, Promise<T>",
     "any disables type checking; prefer unknown or precise types ;  inference: let n = 5 is typed number automatically (const n = 5 gets the literal type 5)"
    ],
    hints:["Port a small untyped JavaScript module to TypeScript without using any."]},
  { t:"Modelling and managing complex states",
    topics:[
     "Managing complex states using the state reducer pattern",
     "Implementing the reducer pattern using React's useReducer hook",
     "Dispatching typed actions to update state"
    ],
    formulas:[
     "Reducer: (state, action) => newState (pure function) ;  const [state, dispatch] = useReducer(reducer, initial)",
     "Typed actions: type Action = { type: \"add\"; task: Task } | { type: \"remove\"; id: number } (discriminated union)",
     "Use useReducer over useState when next state depends on several sub-values or complex transitions"
    ],
    hints:["Rewrite a multi-useState component with useReducer and a typed action union."]},
  { t:"APIs and state modelling",
    topics:[
     "Using APIs to interface client-side code with the server-side",
     "Modelling types to allow the interaction with the API",
     "Maintaining a session with the backend",
     "Working with pageable APIs"
    ],
    formulas:[
     "fetch(url, { method: \"POST\", headers: {\"Content-Type\": \"application/json\", Authorization: `Bearer ${token}`}, body: JSON.stringify(data) })",
     "Model responses with interfaces: interface ApiResponse<T> { data: T; total: number }",
     "Pagination: query params page and limit/offset ;  load more or page controls",
     "Session/auth token stored client-side and sent with every request ;  handle loading, success and error states"
    ],
    hints:["Fetch a paginated list from a backend API with typed responses and loading/error states."]},
  { t:"Best practices and npm packages",
    topics:[
     "Best practices of front-end development",
     "Importance of accessibility",
     "WAI-ARIA standards",
     "Using third-party packages from the NodeJS ecosystem"
    ],
    formulas:[
     "Accessibility: semantic elements, alt text on images, labels for form inputs, keyboard focus, colour contrast (WCAG AA ≥ 4.5:1 for normal text)",
     "WAI-ARIA attributes: role, aria-label, aria-labelledby, aria-live, aria-expanded",
     "Add packages with npm install pkg ;  check maintenance, licence, bundle size and types (@types/pkg)"
    ],
    hints:["Audit your app using keyboard-only navigation and a screen-reader/Lighthouse check."]},
  { t:"Production React Apps",
    topics:[
     "Production-specific optimizations of a React application",
     "Best practices for build & deployment process",
     "Configuration of a progressive web app (PWA)"
    ],
    formulas:[
     "Build: npm run build produces minified, hashed static assets ;  code splitting with React.lazy() and Suspense",
     "Performance: React.memo, useMemo, useCallback, lazy loading images, caching",
     "PWA = HTTPS + web app manifest + service worker (offline caching, installable)"
    ],
    hints:["Deploy the built app to a static host and turn it into an installable PWA."]}
 ],
 text:[],
 ref:["Original open-source course material under Creative Commons Attribution-ShareAlike 4.0 International License."]
});

sylAdd("WD-401",{
 n:"Web Development 401: Getting ready for production", s:"WD 401",
 type:"minor", ltp:"0-0-14", cr:7, sem:"Minor Degree Program (Advance Web Development)",
 obj:[
  "To allow the student to learn more about production-ready deployments.",
  "Achieved either via the WD401 course material (deploy an application of choice that integrates learnings from earlier courses) or through an internship at a company working on a similar skill-set."
 ],
 out:[
  "Be able to bundle a codebase with non-trivial JS dependencies and code.",
  "Know how to differentiate between popular JS flavours and pick one that is suitable for a task.",
  "Understand why testing is important, what TDD is, and be able to write both unit and integration tests for applications that use JS in the front-end.",
  "Be able to set up a CI/CD pipeline for a server-side application, ensuring the code reaches production automatically after tests pass.",
  "Know how to organise & communicate development work using pull requests.",
  "Be aware of container-based deployments, be able to build a Docker image for their web application and then deploy that image to a web server.",
  "Know how to set up a web application to support localization.",
  "Set up error-logging for their web application to capture runtime errors, both in the back-end and in the front-end, and write tests that replicate errors before implementing a fix to prevent regressions."
 ],
 units:[
  { t:"Workflow using pull-requests",
    topics:[
     "Advanced usage of git in development teams",
     "Developing on branches",
     "Peer-review",
     "Re-work based on reviews before merging",
     "Opening a pull request",
     "Making changes and submitting work for review",
     "Updating code based on review"
    ],
    formulas:[
     "Flow: git checkout -b feature → commit → git push origin feature → open PR → review → update → merge (squash/rebase/merge commit)",
     "Good PR: small, focused, descriptive title/body, linked issue, passing CI ;  git rebase main / git merge main to sync"
    ],
    hints:["Practise a full PR cycle with a partner including review comments and follow-up commits."]},
  { t:"JS Bundling - integration of JS into non-JS backends",
    topics:[
     "History of why bundling exists in the JS ecosystem",
     "Most common bundling tools",
     "General bundling methodology",
     "Import maps feature as a bundler-free alternative"
    ],
    formulas:[
     "Bundler: combines many modules and dependencies into few optimised files (minify, tree-shake, transpile) ;  examples: webpack, esbuild, Rollup, Parcel, Vite",
     "Import map: <script type=\"importmap\">{ \"imports\": { \"lodash\": \"/vendor/lodash.js\" } }</script> lets bare specifiers resolve in the browser"
    ],
    hints:["Bundle a small app with esbuild/webpack, then replace it with import maps and compare."]},
  { t:"Compile to JS languages - options & approaches",
    topics:[
     "Reasons why languages that compile to JS exist",
     "Different purposes that compile-to-JS languages serve",
     "Popular options (e.g. TypeScript, CoffeeScript, Elm, ReScript) and the differences between each"
    ],
    formulas:[
     "Transpiler/compiler: source in another language → JavaScript ;  TypeScript = superset with static types; Babel converts modern JS to older JS",
     "Why: type safety, newer syntax on old browsers, functional purity, better tooling"
    ],
    hints:["Compile the same small program from two languages to JS and compare the output and tooling."]},
  { t:"Testing",
    topics:[
     "Importance of testing",
     "Unit testing",
     "Integration testing",
     "Hybrid testing",
     "Popular testing libraries",
     "Common pitfalls in the practice of testing and how to avoid them",
     "Test-driven development (TDD)"
    ],
    formulas:[
     "Testing pyramid: many fast unit tests, fewer integration tests, few end-to-end tests",
     "TDD cycle: write failing test (red) → make it pass (green) → refactor",
     "Pitfalls: flaky/brittle tests, shared state, over-mocking, testing implementation details rather than behaviour"
    ],
    hints:["Write unit tests and one integration test (e.g. with Jest/Cypress/Playwright) for a feature developed test-first."]},
  { t:"CI/CD - Continuous integration & delivery",
    topics:[
     "Modern development processes for frequent releases",
     "Setting up an automated system that detects code changes and runs tests",
     "Linking successful builds to deployment on a remote server",
     "Continuous integration",
     "Continuous delivery / deployment"
    ],
    formulas:[
     "CI: every push/PR triggers build + tests ;  CD: automatically deliver/deploy code that passes the test suite",
     "Pipeline as code: e.g. .github/workflows/ci.yml with triggers (on: push), jobs, steps ;  fail fast, keep secrets in encrypted variables"
    ],
    hints:["Create a GitHub Actions workflow that tests every push and deploys on merge to main."]},
  { t:"Application environments",
    topics:[
     "Different environments an application is expected to run in",
     "Development environment",
     "Testing environment",
     "Production environment",
     "Staging environment as a gateway to production"
    ],
    formulas:[
     "Environment configuration via environment variables (NODE_ENV=production, DATABASE_URL) ;  never commit secrets",
     "Promotion path: development → testing → staging (production-like) → production"
    ],
    hints:["Configure separate databases and settings for dev, test and production of the same app."]},
  { t:"Containerization",
    topics:[
     "Containerization: packaging applications to run in isolated containers",
     "Docker (OCI) standard",
     "Building a Docker image for a web application",
     "Deploying the image to different targets"
    ],
    formulas:[
     "Dockerfile: FROM node:20 → WORKDIR /app → COPY package*.json → RUN npm ci → COPY . . → EXPOSE 3000 → CMD [\"node\", \"server.js\"]",
     "docker build -t app . ;  docker run -p 3000:3000 app ;  docker push registry/app ;  image = template, container = running instance",
     "Containers share the host kernel (lighter than VMs) ;  use .dockerignore to exclude node_modules and secrets"
    ],
    hints:["Containerise the todo app, run it locally, then deploy the image to a cloud service."]},
  { t:"Internationalisation and localisation",
    topics:[
     "Internationalisation (i18n): designing the app to support multiple languages and regions",
     "Localisation (l10n): adapting the app to a specific locale",
     "Setting up a web application to support localization",
     "Runtime error logging in back-end and front-end and writing tests that replicate errors (from course outcomes)"
    ],
    formulas:[
     "i18n = preparing the code (externalise strings, locale-aware formats) ;  l10n = supplying the translations and regional conventions",
     "Locale codes: language-REGION e.g. en-IN, hi-IN ;  use Intl.DateTimeFormat / Intl.NumberFormat for dates and numbers",
     "Translation files keyed by message id (e.g. en.json, hi.json) ;  handle plurals and right-to-left scripts"
    ],
    hints:["Extract all UI strings into locale files, add Hindi, and switch language at runtime.",
           "Also set up an error tracker (front-end and back-end) and add a regression test for each captured bug, as the course outcomes ask."]}
 ],
 text:[],
 ref:[]
});
