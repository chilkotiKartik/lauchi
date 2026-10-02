sylAdd("AHT-001",{
 n:"Engineering Physics", s:"Physics", type:"theory",
 ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "Explore the basic understanding of wave optics and its applications in modern communication systems like Laser and optical fiber communication.",
  "Comprehend the effect of electric and magnetic field in materials and apply Maxwell's equations to understand electromagnetic wave propagation.",
  "Become familiar with the basics of quantum mechanics and its applications.",
  "Understand the basics of semiconductors and their application in electronic devices."
 ],
 out:[
  "CO1 Learn the principles of physical optics and understand their applicability in daily life.",
  "CO2 Apply concepts of physical optics to understand the working of Lasers and optical fiber based communication systems.",
  "CO3 Comprehend the properties of electromagnetic waves with electric and magnetic behavior of materials.",
  "CO4 Understand the behavior of microscopic objects using fundamentals of quantum mechanics.",
  "CO5 Apply and design various electronic devices using semiconductor physics."
 ],
 units:[
  { t:"Interference and Diffraction", h:8,
   topics:[
    "Interference: coherent sources",
    "Conditions of interference (sustained interference)",
    "Fresnel's Biprism experiment",
    "Displacement of fringes",
    "Interference in thin films",
    "Wedge shaped film",
    "Newton's rings",
    "Diffraction: single slit diffraction",
    "n-slit diffraction",
    "Diffraction grating",
    "Rayleigh's criterion of resolution",
    "Resolving power of grating"
   ],
   formulas:[
    "Path difference for reflected light in a film: 2μt cos r; reflected light: bright 2μt cos r = (2n+1)λ/2, dark 2μt cos r = nλ (n = 0,1,2…)",
    "Fresnel biprism: fringe width β = λD/d, with d = 2a(μ−1)α",
    "Displacement of fringes when a sheet of thickness t and index μ is introduced: Δ = (μ−1)tD/d (fringes shift by (μ−1)t/β fringes)",
    "Wedge film: fringe width β = λ/(2μθ)",
    "Newton's rings (reflected, air film): D²ₙ = 4nλR (dark rings); D²ₙ₊ₚ − D²ₙ = 4pλR, so λ = (D²ₙ₊ₚ − D²ₙ)/(4pR)",
    "Single slit: minima at a sin θ = nλ; central maximum width 2λD/a",
    "Grating equation: (a+b) sin θ = nλ; maximum order n ≤ (a+b)/λ",
    "Rayleigh's criterion: sin θ = 1.22λ/D (circular aperture); resolving power of grating R = λ/dλ = nN"
   ],
   hints:[
    "Derive the fringe width in Fresnel's biprism and the condition for bright/dark fringes in thin films (reflected and transmitted light).",
    "Derive the radius of dark and bright Newton's rings and solve numericals for wavelength or radius of curvature of the lens.",
    "Derive the single-slit intensity pattern and the grating equation; practise numericals on missing orders and resolving power of a grating."
   ]},
  { t:"Polarization, Laser and Optical Fiber", h:8,
   topics:[
    "Polarization: phenomenon of double refraction",
    "Ordinary and extra-ordinary rays",
    "Nicol prism",
    "Production and analysis of plane polarized light",
    "Retardation plates (quarter wave and half wave plates)",
    "Circularly and elliptically polarized light",
    "Optical activity",
    "Specific rotation",
    "Polarimeter",
    "Laser: principle of laser action",
    "Einstein's coefficients",
    "Construction and working of He-Ne laser",
    "Construction and working of Ruby laser",
    "Applications of lasers",
    "Optical fiber: fundamental ideas and types of fibers",
    "Acceptance angle and acceptance cone",
    "Numerical aperture",
    "Propagation mechanism in optical fiber",
    "Communication in optical fiber and its advantages",
    "Losses in optical fibers"
   ],
   formulas:[
    "Malus' law: I = I₀ cos²θ",
    "Brewster's law: tan θp = μ",
    "Quarter wave plate thickness: t = λ/[4(μₒ − μₑ)]; half wave plate: t = λ/[2(μₒ − μₑ)]",
    "Specific rotation: [α] = θ/(l c), l in decimetre, c in g/cm³",
    "Einstein's relations: A₂₁/B₂₁ = 8πhν³/c³; B₁₂ = B₂₁; ratio of spontaneous to stimulated emission = A₂₁/(B₂₁ρ) = e^(hν/kT) − 1",
    "Population inversion: N₂ > N₁ (Boltzmann: N₂/N₁ = e^(−hν/kT))",
    "Numerical aperture: NA = sin θ₀ = √(n₁² − n₂²); relative index Δ = (n₁ − n₂)/n₁, NA ≈ n₁√(2Δ)",
    "Fibre loss (attenuation): α = (10/L) log₁₀(Pᵢ/Pₒ) dB/km"
   ],
   hints:[
    "Explain double refraction with Huygens' construction, Nicol prism construction and working, and how to produce and analyse circular and elliptical light.",
    "Write the He-Ne and Ruby laser answers with energy level diagram, pumping, and output; derive Einstein's relations between A and B.",
    "Derive acceptance angle and NA of a step-index fibre; distinguish step-index/graded-index and single-mode/multimode; list attenuation, dispersion and bending losses."
   ]},
  { t:"Electromagnetics and Magnetic Properties of Materials", h:8,
   topics:[
    "Gradient, divergence and curl",
    "Gauss theorem (divergence theorem)",
    "Stokes' theorem",
    "Continuity equation",
    "Ampere's law and displacement current",
    "Maxwell's equations in integral form",
    "Maxwell's equations in differential form",
    "Electromagnetic wave propagation in free space",
    "Electromagnetic wave propagation in conducting media",
    "Poynting theorem",
    "Magnetic properties of materials: basic concept of para-, dia- and ferro-magnetism",
    "Langevin's theory of diamagnetism",
    "Phenomenon of hysteresis and its applications"
   ],
   formulas:[
    "∇·D = ρ; ∇·B = 0; ∇×E = −∂B/∂t; ∇×H = J + ∂D/∂t",
    "Continuity equation: ∇·J + ∂ρ/∂t = 0",
    "Displacement current density: J_d = ∂D/∂t = ε₀ ∂E/∂t",
    "Wave speed in free space: c = 1/√(μ₀ε₀); in a medium v = 1/√(με); E/B = c; refractive index n = √(μᵣεᵣ)",
    "Wave equation: ∇²E = με ∂²E/∂t²",
    "Poynting vector: S = E × H; average intensity ⟨S⟩ = ½ E₀H₀; Poynting theorem: −∂u/∂t = ∇·S + J·E",
    "Conducting medium: skin depth δ = √(2/(ωμσ))",
    "Langevin diamagnetism: χ = −μ₀ N Z e² ⟨r²⟩/(6m) (negative, temperature independent); B = μ₀(H + M), χ = M/H"
   ],
   hints:[
    "Derive Maxwell's four equations from Gauss, Faraday and Ampere laws and show the need for displacement current.",
    "Derive the wave equation and speed c in free space; show transverse nature and E/B = c; derive Poynting theorem.",
    "Compare para-, dia- and ferro-magnetic materials in a table; draw the B-H loop, define retentivity and coercivity, and relate loop area to energy loss."
   ]},
  { t:"Quantum Mechanics", h:8,
   topics:[
    "Introduction to quantum mechanics",
    "Photoelectric effect",
    "Compton effect",
    "Wave nature of particles (de Broglie waves)",
    "Free-particle wave function and wave-packets",
    "Group velocity",
    "Phase velocity and their relation",
    "Uncertainty principle",
    "Wave function and its properties",
    "Operators",
    "Time-dependent Schrodinger equation for wave function",
    "Time-independent Schrodinger equation for wave function",
    "Application: particle in a one dimensional box"
   ],
   formulas:[
    "Photoelectric equation: hν = φ + ½mv²max = φ + eV₀",
    "Compton shift: Δλ = (h/m₀c)(1 − cos θ); h/m₀c = 2.43 × 10⁻¹² m",
    "de Broglie wavelength: λ = h/p = h/√(2mE); for electron accelerated through V volts λ = 12.27/√V Å",
    "Phase velocity vp = ω/k = c²/vg; group velocity vg = dω/dk = v (particle velocity); vp·vg = c²",
    "Uncertainty: Δx Δp ≥ ħ/2; ΔE Δt ≥ ħ/2",
    "Normalisation: ∫|ψ|² dx = 1; probability density P = ψ*ψ",
    "Time-independent SE: −(ħ²/2m) d²ψ/dx² + Vψ = Eψ; time-dependent: iħ ∂ψ/∂t = Ĥψ",
    "Particle in 1D box (width L): ψₙ = √(2/L) sin(nπx/L), Eₙ = n²h²/(8mL²), n = 1,2,3…"
   ],
   hints:[
    "Derive Compton shift and explain why classical wave theory fails for photoelectric effect; note Einstein's equation and stopping potential graph.",
    "Derive vg·vp = c² and the group velocity of a wave packet; solve numericals on de Broglie wavelength and uncertainty in position/momentum.",
    "Derive energy eigenvalues and normalised eigenfunctions of a particle in a 1D infinite box; list properties of a well-behaved wave function (single-valued, finite, continuous, normalisable)."
   ]},
  { t:"Semiconductor Physics", h:8,
   topics:[
    "Introduction to semiconductors",
    "Momentum energy diagram for band gap explanation",
    "P and N type semiconductors",
    "Direct and indirect band gap materials",
    "Hall effect",
    "Barrier formation in P-N junction diode",
    "Forward and reverse biasing of P-N junction diode",
    "Shockley equation",
    "Photodiode",
    "Photovoltaic effect",
    "Solar cell",
    "LED: construction and materials",
    "Diode laser: construction and materials"
   ],
   formulas:[
    "Intrinsic carriers: nᵢ = √(NcNv) e^(−Eg/2kT); law of mass action n·p = nᵢ²",
    "Conductivity: σ = e(nμₙ + pμₚ)",
    "Hall voltage: V_H = BI/(n e t); Hall coefficient R_H = 1/(ne) (n-type: −1/(ne), p-type: +1/(pe)); mobility μ = σR_H",
    "Built-in (barrier) potential: V₀ = (kT/e) ln(N_A N_D/nᵢ²)",
    "Shockley diode equation: I = I₀ (e^(eV/ηkT) − 1); thermal voltage kT/e ≈ 26 mV at 300 K",
    "Solar cell: fill factor FF = (Vm Im)/(Voc Isc); efficiency η = (Vm Im)/Pin",
    "LED emission wavelength: λ (μm) = 1.24/Eg (eV); photodiode responds when hν ≥ Eg"
   ],
   hints:[
    "Draw E-k diagrams for direct (GaAs) and indirect (Si, Ge) semiconductors and say why only direct-gap materials suit LED and diode lasers.",
    "Explain formation of depletion region and barrier potential, then draw forward/reverse I-V curves using the Shockley equation.",
    "Derive Hall coefficient, state uses (type, carrier density, mobility), and write short notes on solar cell (I-V curve, fill factor) and LED materials (GaAsP, GaN, AlGaAs)."
   ]}
 ],
 text:[
  "H.K. Malik, A.K. Singh, Engineering Physics, TMH, New Delhi. ISBN: 9780070671539.",
  "A. Beiser, Concept of Modern Physics, McGraw Hill Education. ISBN: 9780070495531",
  "F. K. Richtmyer, E.H. Kennard, J.N. Cooper, Introduction to Modern Physics, TMH Pub New Delhi.",
  "S.O. Pillai, Solid State Physics, New Age International Pvt Ltd. ISBN: 978-8122436976"
 ],
 ref:[
  "C. Kittel, Solid State Physics, Wiley. ISBN: 978-8126535187",
  "David J. Griffith, Introduction to Electrodynamics, PHI Learning. ISBN: 9780138053260"
 ]
});

sylAdd("AHT-002",{
 n:"Engineering Chemistry", s:"Chemistry", type:"theory",
 ltp:"3-1-0", cr:4, sem:"I or II (group-wise)",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "Lay foundation for the application of chemistry in engineering and technology disciplines.",
  "Build upon chemistry and materials developed in the properties of matter and extend the principles of quantum chemistry to real chemical systems in the inorganic and organic chemistry domain.",
  "Introduce latest (R&D oriented) topics like water and corrosion chemistry, fuel, lubricants, pollution, NMR and MRI spectroscopy to upgrade engineering students with new technologies."
 ],
 out:[
  "CO1 Bridge the knowledge of chemical science with the technical aspect of engineering chemistry.",
  "CO2 Give technical knowledge of several industries where engineering chemistry is an integral part, like polymer chemistry, paints, lubricants, fuel, glass etc.",
  "CO3 Give knowledge of the chemical aspect of water and its treatment.",
  "CO4 Give knowledge of different types of corrosion and pollution and their minimization.",
  "CO5 Give brief knowledge of advanced techniques of instrumental chemistry like principle of spectroscopy, NMR and MRI spectroscopy; elementary idea about organic reactions and synthesis of drugs."
 ],
 units:[
  { t:"Atomic and Molecular Structure", h:8,
   topics:[
    "Introduction to atomic theory and initial idea as atomic nuclear models",
    "Heisenberg's uncertainty principle",
    "de Broglie concept",
    "Schrodinger wave equation for hydrogen",
    "Valence bond theory (VBT)",
    "Molecular orbital theory (MOT) of diatomic molecules",
    "MOT and VBT of H2",
    "MOT and VBT of O2",
    "MOT and VBT of N2",
    "MOT and VBT of H2O",
    "MOT and VBT of NH3",
    "MOT and VBT of XeO3",
    "MOT and VBT of XeO4",
    "Crystal field theory",
    "Magnetic properties of transition metal ions",
    "Bonding in metals (Band Theory)"
   ],
   formulas:[
    "de Broglie: λ = h/mv; Heisenberg: Δx·Δp ≥ h/4π",
    "Bond order = ½(Nb − Na); bond order > 0 means stable molecule",
    "Bond orders: H₂ = 1, N₂ = 3, O₂ = 2 (O₂ has two unpaired electrons, hence paramagnetic)",
    "Hybridisation: NH₃ sp³ (pyramidal, one lone pair), H₂O sp³ (bent, two lone pairs), XeO₃ sp³ pyramidal, XeO₄ sp³ tetrahedral",
    "Octahedral CFT: Δo splits d-orbitals into t₂g (lower, −0.4Δo each) and e_g (upper, +0.6Δo each)",
    "CFSE = (−0.4 n(t₂g) + 0.6 n(e_g))Δo + pairing energy terms",
    "Spin-only magnetic moment: μ = √(n(n+2)) BM, n = number of unpaired electrons"
   ],
   hints:[
    "Draw MO energy level diagrams for H₂, N₂, O₂ (with σ2p/π2p order difference for N₂) and write bond order and magnetic behaviour.",
    "Explain shapes of NH₃, H₂O, XeO₃, XeO₄ using VBT hybridisation; contrast with MOT description.",
    "Draw d-orbital splitting in octahedral and tetrahedral fields, explain high-spin/low-spin and calculate μ for Fe, Co, Ni, Mn ions; draw band diagram to separate conductors, semiconductors and insulators."
   ]},
  { t:"Thermodynamic Functions", h:8,
   topics:[
    "I law of thermodynamics",
    "II law of thermodynamics",
    "Energy (internal energy and enthalpy)",
    "Entropy",
    "Free energy",
    "EMF and cell potential",
    "Nernst equation and applications",
    "Acid and base",
    "Use of free energy consideration in metallurgy through Ellingham diagram",
    "Hess law"
   ],
   formulas:[
    "First law: ΔU = q + w (w = −PΔV by system); ΔH = ΔU + Δn_g RT",
    "Entropy: ΔS = q_rev/T; for a phase change ΔS = ΔH/T; second law: ΔS_universe ≥ 0",
    "Gibbs free energy: ΔG = ΔH − TΔS; spontaneous if ΔG < 0; ΔG° = −RT ln K",
    "ΔG = −nFE; ΔG° = −nFE°",
    "Nernst equation: E = E° − (RT/nF) ln Q = E° − (0.0591/n) log Q at 25 °C",
    "E°cell = E°cathode − E°anode; log K = nE°/0.0591 at 298 K",
    "Ellingham diagram: ΔG° = ΔH° − TΔS° plotted against T (straight line, slope = −ΔS°); a metal whose oxide line lies lower reduces the oxide of a metal above it",
    "Hess law: ΔH_reaction = Σ ΔH_f(products) − Σ ΔH_f(reactants); pH = −log[H⁺], pH + pOH = 14"
   ],
   hints:[
    "Solve numericals on Nernst equation, EMF of concentration cells and equilibrium constant from E°.",
    "Explain Ellingham diagram features (why C line slopes down, reduction of oxides by carbon, choice of reductant) with sketch.",
    "Practise Hess law problems (enthalpy of formation/combustion) and state clearly Kelvin-Planck and Clausius statements of the second law."
   ]},
  { t:"Water Chemistry and Corrosion", h:8,
   topics:[
    "Hardness of water",
    "Different processes of water treatment",
    "Clark's process",
    "Lime-Soda process",
    "Zeolite process",
    "Reverse osmosis process",
    "Industrial water treatment",
    "Alkalinity of water",
    "Theories of corrosion",
    "Types of corrosion",
    "Mechanism of corrosion",
    "Control of corrosion"
   ],
   formulas:[
    "Hardness in ppm as CaCO₃ equivalent = (mass of salt × 100 / molar mass of salt) per 10⁶ parts water",
    "Equivalent CaCO₃: Ca(HCO₃)₂ ×100/162, Mg(HCO₃)₂ ×100/146, CaCl₂ ×100/111, MgCl₂ ×100/95, CaSO₄ ×100/136, MgSO₄ ×100/120",
    "Lime required (L) = 74/100 [Temp Ca²⁺ + 2 Temp Mg²⁺ + Perm Mg²⁺ + CO₂ + H⁺ (all as CaCO₃ eq.) − NaAlO₂] × volume; soda (S) = 106/100 [Perm Ca²⁺ + Perm Mg²⁺ + H⁺ (as CaCO₃ eq.)] × volume, less HCO₃⁻ if present",
    "Zeolite: Na₂Z + Ca²⁺ → CaZ + 2Na⁺; regeneration with 10% NaCl brine",
    "Alkalinity: P = phenolphthalein, M = methyl orange; OH⁻ = 2P − M, CO₃²⁻ = 2(M − P), HCO₃⁻ = 0 when P > M/2",
    "Osmotic pressure π = CRT; in RO applied pressure > π forces solvent through the semi-permeable membrane",
    "Dry (chemical) corrosion: M → Mⁿ⁺ + ne⁻; wet corrosion: anode Fe → Fe²⁺ + 2e⁻; cathode ½O₂ + H₂O + 2e⁻ → 2OH⁻ (oxygen absorption) or 2H⁺ + 2e⁻ → H₂ (hydrogen evolution)"
   ],
   hints:[
    "Practise hardness numericals (ppm as CaCO₃), lime-soda requirement, and zeolite exhausted-capacity numericals.",
    "Compare Clark's, Lime-Soda, Zeolite and RO methods (principle, reactions, advantages, limits).",
    "Explain dry vs wet corrosion, pitting, galvanic, waterline, stress corrosion; list control methods (coatings, cathodic protection by sacrificial anode and impressed current, inhibitors, alloying)."
   ]},
  { t:"Chemistry of Engineering Materials (Macromolecules, Glass, Fuels and Lubricants)", h:8,
   topics:[
    "Macromolecules: introduction and classification of polymers",
    "Types of polymerization",
    "Copolymers",
    "Classification of polymerization",
    "Vulcanization",
    "PVC",
    "Polyamides",
    "Polyurethane",
    "Polyethylene",
    "Polypropylene",
    "PET",
    "Resins",
    "PMMA",
    "PAN",
    "Rubber",
    "Conducting polymers",
    "Biodegradable polymers",
    "Toughened glass",
    "Strengthening of glass",
    "Fuels: gross and net calorific value",
    "Determination of calorific value using Bomb Calorimeter",
    "Biomass",
    "Biogas",
    "Bio fuel",
    "Introduction to environment and air pollution",
    "Lubricants: introduction",
    "Mechanism of lubrication: fluid film (complete fluid), boundary and extreme pressure lubrication",
    "Classification of lubricants",
    "Flash and fire point",
    "Pour point",
    "Cloud point",
    "Aniline point",
    "Viscosity index"
   ],
   formulas:[
    "Degree of polymerization: DP = M_polymer/M_monomer; Mn = ΣNᵢMᵢ/ΣNᵢ; Mw = ΣNᵢMᵢ²/ΣNᵢMᵢ; PDI = Mw/Mn ≥ 1",
    "Gross (higher) calorific value − net (lower) calorific value = 0.09 H × 587 cal/g (H = % hydrogen; latent heat of steam 587 cal/g)",
    "Bomb calorimeter: GCV = (W + w)(t₂ − t₁)/x, W = mass of water, w = water equivalent of calorimeter, x = mass of fuel (plus cooling, acid and fuse corrections)",
    "Dulong: GCV = 1/100 [8080 C + 34500 (H − O/8) + 2240 S] kcal/kg",
    "Viscosity index: VI = (L − U)/(L − H) × 100 (L, H reference oils, U test oil)",
    "Monomers: PVC – vinyl chloride; PAN – acrylonitrile; PMMA – methyl methacrylate; PET – ethylene glycol + terephthalic acid; Nylon-6,6 – hexamethylenediamine + adipic acid; polyurethane – diisocyanate + diol",
    "Vulcanization: heating rubber with 3–5% sulphur at 100–140 °C creates sulphur cross-links",
    "Fluid film lubrication: friction is due only to internal viscosity of the lubricant"
   ],
   hints:[
    "Classify polymerization (addition, condensation; free radical, ionic) with mechanism steps and give preparation, properties and uses of each polymer named in the syllabus.",
    "Solve calorific value numericals (Dulong formula, bomb calorimeter) and state gross vs net value; describe biogas composition and production.",
    "Explain toughened glass (thermal tempering) vs chemical strengthening; tabulate the lubricant properties (flash, fire, pour, cloud, aniline points, viscosity index) with their significance."
   ]},
  { t:"Spectroscopic Techniques and Applications, Organic Reactions and Synthesis of a Drug", h:8,
   topics:[
    "Principle of spectroscopy and selection rule",
    "Electronic spectroscopy",
    "Vibrational spectroscopy",
    "Rotational spectroscopy",
    "Applications of spectroscopy",
    "NMR spectroscopy",
    "MRI",
    "Types of organic reactions: addition",
    "Elimination",
    "Substitution",
    "Cyclization (Diels-Alder reaction)",
    "Drug synthesis: any one of Aspirin, Phenacetin, Melubrin and Novalgin"
   ],
   formulas:[
    "Beer-Lambert law: A = log₁₀(I₀/I) = εcl",
    "Planck: ΔE = hν = hc/λ = hcν̃; E_total = E_electronic + E_vibrational + E_rotational (order of energy: electronic ≫ vibrational ≫ rotational)",
    "Rotational levels: E_J = BJ(J+1); selection rule ΔJ = ±1 (molecule must have permanent dipole moment)",
    "Vibrational: E_v = (v + ½)hν; selection rule Δv = ±1 (dipole moment must change during vibration)",
    "NMR: resonance condition ν = γB₀/2π; chemical shift δ (ppm) = (ν_sample − ν_TMS)/ν_operating × 10⁶; TMS is the reference (δ = 0)",
    "n+1 rule: n equivalent neighbouring protons split a signal into n+1 lines",
    "Aspirin: salicylic acid + acetic anhydride —(H⁺)→ acetylsalicylic acid + acetic acid"
   ],
   hints:[
    "State selection rules for rotational, vibrational and electronic transitions and why homonuclear diatomics are IR/microwave inactive.",
    "Explain NMR principle (nuclear spin, chemical shift, shielding, splitting) and how MRI uses proton NMR for imaging soft tissue.",
    "Write mechanism and example for each of addition, elimination, substitution (SN1/SN2) and Diels-Alder; learn the synthesis route of one drug fully (aspirin is easiest)."
   ]}
 ],
 text:[
  "B.H. Mahan, University Chemistry",
  "M.J. Sienko and R.A. Plane, Chemistry: Principal and Applications.",
  "C.N. Banwell, Fundamentals of Molecular spectroscopy.",
  "B.L. Temble, Kamaluddin and M.S. Krishnan, Engineering Chemistry, NPTEL web book.",
  "P.W. Atkins, Physical Chemistry, Oxford.",
  "Silverstein and Bassler, Spectrometric identification of organic compound, John Wiley and sons.",
  "Morrison and Boyd, Organic Chemistry, Pearson Education.",
  "Sen Gupta, Organic Chemistry, Oxford.",
  "R.N. Goyal and H. Goel, Engineering Chemistry, Ane publication.",
  "A.K. Pahari and B.S. Chauhan, Engineering Chemistry, Laxmi Publication.",
  "S.K. Singh, Fundamental of Engineering Chemistry, New Age.",
  "Malik, Tuli and Madan, Selected topics in Inorganic Chemistry, Ramnath publication.",
  "A.K. De, Environmental Chemistry, New Age International."
 ],
 ref:[]
});

sylAdd("AHT-003",{
 n:"Introduction to Engineering Mathematics", s:"Intro Maths", type:"theory",
 ltp:"3-1-0", cr:4, sem:"I",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "Familiarize prospective engineers with techniques of applied mathematics, standard concepts, tools and mathematical software at an intermediate level.",
  "Introduce the notion of differential calculus and its related properties and applications.",
  "Present the notion of integral calculus and its properties.",
  "Familiarize with applications of differential and integral calculus.",
  "Develop the essential tool of vector calculus to deal with higher order problems.",
  "Comprehend the idea of matrices and their applications in solving systems of equations."
 ],
 out:[
  "CO1 Visualize and conceptualize engineering problems.",
  "CO2 Model the engineering problem mathematically using the theory of calculus and matrices.",
  "CO3 Determine the solution of the studied engineering problem from the application point of view.",
  "CO4 Validate the solution.",
  "CO5 Implement the solution for the engineering problem."
 ],
 units:[
  { t:"Calculus I", h:8,
   topics:[
    "Limit",
    "Continuity and differentiability",
    "Rolle's theorem",
    "Mean-value theorems (Lagrange and Cauchy)",
    "Expansion of functions by Maclaurin's theorem for one variable",
    "Expansion of functions by Taylor's theorem for one variable",
    "Taylor's theorem for function of two variables",
    "Partial differentiation",
    "Maxima and minima (two variables)",
    "Maxima and minima (three variables)",
    "Method of Lagrange's multipliers"
   ],
   formulas:[
    "Rolle: f continuous on [a,b], differentiable on (a,b), f(a) = f(b) ⇒ ∃c: f′(c) = 0",
    "Lagrange MVT: f(b) − f(a) = (b − a) f′(c); Cauchy MVT: [f(b) − f(a)]/[g(b) − g(a)] = f′(c)/g′(c)",
    "Maclaurin: f(x) = f(0) + x f′(0) + x²/2! f″(0) + x³/3! f‴(0) + …",
    "Taylor: f(x) = f(a) + (x−a) f′(a) + (x−a)²/2! f″(a) + …",
    "Two variables: f(a+h, b+k) = f + (h fx + k fy) + 1/2!(h² fxx + 2hk fxy + k² fyy) + …",
    "Extremum test: with r = fxx, s = fxy, t = fyy at a stationary point: rt − s² > 0 and r < 0 maximum; rt − s² > 0 and r > 0 minimum; rt − s² < 0 saddle; = 0 doubtful",
    "Lagrange multipliers: F = f + λφ; Fx = Fy = Fz = 0 together with φ = 0",
    "Euler's theorem (homogeneous degree n): x fx + y fy = n f"
   ],
   hints:[
    "Verify Rolle's and Lagrange's theorems on given functions and find c; use MVT for inequalities.",
    "Practise Maclaurin series of eˣ, sin x, cos x, log(1+x), (1+x)ⁿ and Taylor expansions about a point.",
    "Solve maxima-minima of two variables and constrained problems (box of maximum volume, distance to a surface) with Lagrange multipliers."
   ]},
  { t:"Calculus II", h:8,
   topics:[
    "Definite integral and its properties",
    "Curve tracing",
    "Multiple integral: double integral",
    "Multiple integral: triple integral",
    "Change of the order of integration",
    "Change of variables",
    "Beta function and its properties",
    "Gamma function and its properties"
   ],
   formulas:[
    "∫ₐᵇ f(x)dx = ∫ₐᵇ f(a+b−x)dx; ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a−x)dx; ∫₋ₐᵃ f dx = 2∫₀ᵃ f dx (f even), 0 (f odd)",
    "Change to polar: dx dy = r dr dθ; spherical: dx dy dz = r² sin θ dr dθ dφ; cylindrical: ρ dρ dφ dz",
    "General change of variables: dx dy = |J| du dv, J = ∂(x,y)/∂(u,v)",
    "Gamma: Γ(n) = ∫₀^∞ e^(−x) xⁿ⁻¹ dx; Γ(n+1) = nΓ(n) = n! (integer n); Γ(1/2) = √π",
    "Beta: B(m,n) = ∫₀¹ x^(m−1)(1−x)^(n−1) dx = Γ(m)Γ(n)/Γ(m+n); B(m,n) = B(n,m)",
    "∫₀^(π/2) sin^p θ cos^q θ dθ = ½ B((p+1)/2, (q+1)/2)",
    "Wallis: ∫₀^(π/2) sinⁿx dx = (n−1)(n−3)…/(n(n−2)…) × (π/2 if n even else 1)"
   ],
   hints:[
    "Sketch the region and reverse the order of integration in every double-integral problem; evaluate areas via double integrals.",
    "Rehearse curve tracing checklist: symmetry, origin, asymptotes, intercepts, tangents at origin, region of existence.",
    "Convert integrals to Beta/Gamma form and evaluate; solve triple integrals by spherical/cylindrical substitution."
   ]},
  { t:"Calculus III", h:8,
   topics:[
    "Jacobians",
    "Approximation of error",
    "Applications of definite integrals to evaluate surface areas of revolution",
    "Applications of definite integrals to evaluate volumes of revolution",
    "Centre of mass",
    "Centre of gravity"
   ],
   formulas:[
    "Jacobian: J = ∂(u,v)/∂(x,y) = |ux uy; vx vy|; J·J′ = 1 where J′ = ∂(x,y)/∂(u,v)",
    "Error: δf ≈ fx δx + fy δy; relative error δf/f; percentage error 100 δf/f",
    "Volume of revolution about x-axis: V = π∫ₐᵇ y² dx; about y-axis: V = π∫ x² dy",
    "Surface area of revolution about x-axis: S = 2π∫ y √(1 + (dy/dx)²) dx",
    "Arc length: s = ∫ √(1 + (dy/dx)²) dx",
    "Centre of mass: x̄ = ∫x dm/∫dm = ∫∫x ρ dA/∫∫ρ dA (uniform density: centroid x̄ = ∫∫x dA/A)",
    "Centroid of semicircular lamina radius a: ȳ = 4a/3π"
   ],
   hints:[
    "Compute Jacobians for polar, cylindrical, spherical maps and for u = f(x,y), v = g(x,y) problems.",
    "Practise error problems (area/volume/resistance formulas) with given percentage error.",
    "Solve revolution volume/surface problems for standard curves (circle, parabola, cycloid, astroid) and centroid of lamina."
   ]},
  { t:"Vector Calculus", h:8,
   topics:[
    "Vector and its properties",
    "Scalar and vector point function",
    "Differentiation of vectors",
    "Gradient",
    "Geometrical meaning of gradient",
    "Directional derivative",
    "Divergence and curl",
    "Line integral",
    "Surface integral",
    "Volume integral",
    "Gauss divergence theorem (without proof)",
    "Stokes theorem (without proof)",
    "Green theorem (without proof)"
   ],
   formulas:[
    "∇ = i ∂/∂x + j ∂/∂y + k ∂/∂z; grad φ = ∇φ; div F = ∇·F; curl F = ∇×F",
    "Directional derivative of φ along unit vector a: ∇φ·a = |∇φ| cos θ (max = |∇φ|); ∇φ is normal to the level surface φ = c",
    "Unit normal n̂ = ∇φ/|∇φ|; angle between surfaces: cos θ = (∇φ₁·∇φ₂)/(|∇φ₁||∇φ₂|)",
    "Identities: div(curl F) = 0; curl(grad φ) = 0; ∇²φ = div grad φ; curl curl F = grad div F − ∇²F",
    "Gauss: ∬_S F·n̂ dS = ∭_V ∇·F dV",
    "Stokes: ∮_C F·dr = ∬_S (∇×F)·n̂ dS",
    "Green (plane): ∮_C (P dx + Q dy) = ∬_R (∂Q/∂x − ∂P/∂y) dx dy",
    "F conservative ⇔ curl F = 0 ⇔ F = ∇φ; work W = ∫F·dr"
   ],
   hints:[
    "Find grad, div, curl of given fields and check solenoidal (div = 0) and irrotational (curl = 0).",
    "Verify Green, Stokes and Gauss theorems on a square, triangle, cube or sphere.",
    "Practise directional derivative, angle between surfaces and work done along a curve."
   ]},
  { t:"Matrices", h:8,
   topics:[
    "Matrix and their types and properties",
    "Rank of a matrix",
    "Consistency of system of linear equations",
    "Solution of simultaneous linear equations by elementary transformations",
    "Eigen values and Eigen vectors",
    "Cayley-Hamilton theorem and its applications to find inverse",
    "Diagonalization of matrices"
   ],
   formulas:[
    "Rank = order of the largest non-vanishing minor = number of non-zero rows in row echelon form",
    "AX = B consistent iff rank(A) = rank([A|B]); unique if rank = n; infinitely many if rank < n; no solution if rank(A) ≠ rank([A|B])",
    "Homogeneous AX = 0: non-trivial solution iff |A| = 0 (rank < n)",
    "Characteristic equation: |A − λI| = 0; sum of eigenvalues = trace(A), product = |A|",
    "Cayley-Hamilton: A satisfies its own characteristic equation; for 2×2: A² − (tr A)A + |A|I = O, so A⁻¹ = [(tr A)I − A]/|A|",
    "Diagonalisation: P⁻¹AP = D with P = matrix of eigenvectors; Aⁿ = P Dⁿ P⁻¹",
    "Eigenvalues of Aᵏ are λᵏ, of A⁻¹ are 1/λ; symmetric matrices have real eigenvalues and orthogonal eigenvectors"
   ],
   hints:[
    "Reduce to row echelon form/normal form to find rank and test consistency of AX = B.",
    "Practise finding eigenvalues/eigenvectors of 3×3 matrices and verifying Cayley-Hamilton with inverse and higher powers.",
    "Diagonalise a matrix and use it to compute Aⁿ."
   ]}
 ],
 text:[
  "G.B. Thomas and R.L. Finney, Calculus and Analytic geometry, Pearson, 9th Edition.",
  "Erwin Kreyszig, Advanced Engineering Mathematics, John Wiley & Sons, 10th edition.",
  "T. Veerarajan, Engineering Mathematics for first year, Tata McGraw-Hill, 5th edition.",
  "B.V. Ramana, Higher Engineering Mathematics, Tata McGraw-Hill, 1st edition.",
  "B.S. Grewal, Higher Engineering Mathematics, Khanna Publishers, 44th edition."
 ],
 ref:[],
 note:"Units 1, 2 and 5 are marked * in the PDF: practical visual demo with mathematical software (MATLAB, Maple, Mathematica etc.) (non-evaluative)."
});

sylAdd("AHT-005",{
 n:"Analytical Mathematics", s:"Analytical M", type:"theory",
 ltp:"3-1-0", cr:4, sem:"II",
 marks:{ct:30,ta:20,ese:100,total:150},
 obj:[
  "Familiarize prospective engineers with techniques in ordinary, partial differential equations and complex variables.",
  "Introduce effective mathematical tools for the solutions of ordinary and partial differential equations that model physical processes.",
  "Introduce the tools of differentiation and integration of functions of complex variable used in various techniques dealing with engineering problems.",
  "Acquaint the student with mathematical tools available in sequence and series needed in various fields of science and engineering.",
  "Develop the tool of Fourier series for learning advanced engineering mathematics.",
  "Formulate the dynamic real-time problem."
 ],
 out:[
  "CO1 Remember the concept of ordinary differential equations and apply it in solving real-life problems.",
  "CO2 Apply the concept of partial differential equations to evaluate complex engineering problems.",
  "CO3 Understand and test the convergence of sequence and series.",
  "CO4 Solve the problems related to complex variable.",
  "CO5 Design and formulate a mathematical model, and implement mathematical tools."
 ],
 units:[
  { t:"First Order Ordinary Differential Equations", h:8,
   topics:[
    "Classification of differential equation",
    "Order and degree",
    "Ordinary differential equations of first order",
    "Variable separable form",
    "Homogeneous differential equations",
    "Exact differential equations",
    "Linear differential equations",
    "Reducible to homogeneous, exact and linear equation (Bernoulli)",
    "Equations not of first degree: equations solvable for p",
    "Equations solvable for y",
    "Equations solvable for x",
    "Clairaut's type"
   ],
   formulas:[
    "Separable: f(x)dx = g(y)dy ⇒ ∫f dx = ∫g dy + c",
    "Homogeneous: dy/dx = F(y/x); put y = vx",
    "Exact: M dx + N dy = 0 with ∂M/∂y = ∂N/∂x; solution ∫M dx (y const) + ∫(terms of N free of x) dy = c",
    "Integrating factors: (∂M/∂y − ∂N/∂x)/N = f(x) ⇒ IF = e^∫f dx; (∂N/∂x − ∂M/∂y)/M = g(y) ⇒ IF = e^∫g dy; homogeneous M dx + N dy: IF = 1/(Mx + Ny)",
    "Linear: dy/dx + Py = Q ⇒ y·e^∫P dx = ∫Q e^∫P dx dx + c",
    "Bernoulli: dy/dx + Py = Qyⁿ; put z = y^(1−n) to get a linear equation",
    "Solvable for p: factorise (p − f₁)(p − f₂)… = 0; Clairaut: y = px + f(p), general solution y = cx + f(c), singular solution by eliminating p from x + f′(p) = 0",
    "Lagrange (d'Alembert): y = xφ(p) + ψ(p), differentiate w.r.t. x and treat x as a function of p"
   ],
   hints:[
    "Identify the type first (separable, homogeneous, exact, linear, Bernoulli); practise finding integrating factors.",
    "Solve equations of first order and higher degree in p using the three methods and Clairaut's form with singular solutions.",
    "Model orthogonal trajectories, Newton's law of cooling and growth/decay problems as first-order ODEs."
   ]},
  { t:"Ordinary Differential Equations of Higher Orders", h:8,
   topics:[
    "Linear differential equations of nth order with constant coefficients",
    "Linear differential equations of nth order with variable coefficients (Cauchy-Euler, Legendre)",
    "Complementary functions and particular integrals",
    "Solving simultaneous linear differential equations of first degree with constant coefficients",
    "Method of variation of parameters",
    "Applications to engineering problems"
   ],
   formulas:[
    "Auxiliary equation f(m) = 0: real distinct roots CF = c₁e^(m₁x) + c₂e^(m₂x); repeated root (c₁ + c₂x)e^(mx); complex α ± iβ: e^(αx)(c₁cos βx + c₂ sin βx)",
    "PI for X = e^(ax): e^(ax)/f(a) if f(a) ≠ 0; else x e^(ax)/f′(a)",
    "PI for X = sin(ax+b) or cos(ax+b): replace D² by −a², provided f(−a²) ≠ 0",
    "PI for X = xᵐ: [f(D)]⁻¹ xᵐ expanded in ascending powers of D",
    "PI for e^(ax)V: e^(ax) [f(D+a)]⁻¹ V",
    "Cauchy-Euler: x²y″ + axy′ + by = f(x); put x = e^z, D = d/dz: x d/dx = D, x² d²/dx² = D(D−1)",
    "Variation of parameters: y_p = −y₁∫(y₂R/W)dx + y₂∫(y₁R/W)dx, W = y₁y₂′ − y₂y₁′",
    "Mechanical oscillator: m x″ + c x′ + kx = F(t); overdamped/critical/underdamped from c² − 4mk; LC circuit: L q″ + q/C = E(t)"
   ],
   hints:[
    "Memorise the CF rules and PI shortcuts; when f(a) = 0 use the multiplication by x rule.",
    "Solve Cauchy-Euler and Legendre equations through substitution and simultaneous equations via elimination using D operator.",
    "Apply variation of parameters to y″ + y = tan x, sec x etc., and set up spring-mass and LCR problems."
   ]},
  { t:"Sequences and Series", h:8,
   topics:[
    "Introduction to sequence and series",
    "Tests for convergence: Comparison test",
    "Ratio test",
    "D'Alembert's ratio test",
    "Raabe's test",
    "Logarithmic test",
    "Cauchy root test",
    "Weierstrass M-test",
    "Alternating series",
    "Uniform convergence",
    "Fourier series",
    "Half range sine and cosine series",
    "Parseval's theorem"
   ],
   formulas:[
    "p-series Σ1/nᵖ converges iff p > 1; geometric Σrⁿ converges iff |r| < 1",
    "Comparison (limit form): lim uₙ/vₙ = finite non-zero ⇒ both converge or diverge together",
    "D'Alembert: L = lim uₙ₊₁/uₙ; L < 1 converges, L > 1 diverges, L = 1 fails",
    "Raabe: lim n(uₙ/uₙ₊₁ − 1) = k; k > 1 converges, k < 1 diverges",
    "Cauchy root: lim (uₙ)^(1/n) < 1 converges; Logarithmic test: lim n log(uₙ/uₙ₊₁) = k",
    "Leibnitz alternating test: uₙ decreasing and uₙ → 0 ⇒ Σ(−1)ⁿ⁻¹uₙ converges",
    "Weierstrass M-test: |fₙ(x)| ≤ Mₙ with ΣMₙ convergent ⇒ Σfₙ converges uniformly",
    "Fourier series on (−π, π) or (0, 2π): f = a₀/2 + Σ(aₙ cos nx + bₙ sin nx), aₙ = (1/π)∫f cos nx dx, bₙ = (1/π)∫f sin nx dx",
    "Half range on (0, l): cosine series aₙ = (2/l)∫₀ˡ f cos(nπx/l)dx; sine series bₙ = (2/l)∫₀ˡ f sin(nπx/l)dx",
    "Parseval: (1/2l)∫₋ₗˡ [f(x)]² dx = a₀²/4 + ½Σ(aₙ² + bₙ²); Dirichlet: at a jump the series converges to [f(x+) + f(x−)]/2"
   ],
   hints:[
    "Choose the test: ratio for factorials/powers, Raabe when ratio gives 1, root for nth powers, Leibnitz for alternating series.",
    "Compute Fourier series of f(x) = x, x², |x|, and of piecewise functions; use even/odd symmetry to drop terms.",
    "Use Fourier series values to sum numerical series (Σ1/n², Σ1/n⁴) via Parseval's theorem."
   ]},
  { t:"Partial Differential Equations", h:8,
   topics:[
    "Formulation of partial differential equations",
    "Classification of partial differential equations",
    "Linear and non-linear partial differential equations and their solutions",
    "Homogeneous linear partial differential equation with constant coefficients and its solution",
    "Method of separation of variables",
    "Solutions of one-dimensional wave equation (without proof)",
    "Heat conduction equations of one dimension (without proof)",
    "Heat conduction equations of two dimension (without proof)"
   ],
   formulas:[
    "Formation: eliminate arbitrary constants (a, b) or an arbitrary function; p = ∂z/∂x, q = ∂z/∂y",
    "Lagrange linear PDE: Pp + Qq = R; auxiliary equations dx/P = dy/Q = dz/R",
    "Non-linear standard forms: f(p,q) = 0 ⇒ z = ax + by + c with f(a,b) = 0; Clairaut z = px + qy + f(p,q) ⇒ z = ax + by + f(a,b)",
    "Homogeneous linear constant coefficients: f(D,D′)z = 0; CF = Σφᵢ(y + mᵢx) for distinct roots mᵢ of f(m,1) = 0",
    "Classification of A uxx + B uxy + C uyy: B² − 4AC > 0 hyperbolic (wave), = 0 parabolic (heat), < 0 elliptic (Laplace)",
    "Wave equation: ∂²u/∂t² = c² ∂²u/∂x²; with u(0,t) = u(L,t) = 0: u = Σ(Aₙ cos(nπct/L) + Bₙ sin(nπct/L)) sin(nπx/L)",
    "Heat equation: ∂u/∂t = α² ∂²u/∂x²; with ends at 0: u = ΣBₙ sin(nπx/L) e^(−α²n²π²t/L²)",
    "Laplace equation: ∇²u = uxx + uyy = 0; separation u = X(x)Y(y) gives X″/X = −Y″/Y = constant"
   ],
   hints:[
    "Classify the PDE, choose the separation constant sign (−k², 0, k²) that satisfies the boundary conditions.",
    "Solve the vibrating string with given initial shape and the temperature in a rod with fixed-end temperatures.",
    "Practise formation of PDEs and Lagrange's method with auxiliary equations."
   ]},
  { t:"Functions of Complex Variable", h:8,
   topics:[
    "Functions of complex variables",
    "Analytic functions",
    "Harmonic conjugate",
    "Cauchy-Riemann equations (without proof)",
    "Complex integration",
    "Line integral",
    "Cauchy-Goursat theorem (without proof)",
    "Cauchy integral formula (without proof)",
    "Singular points",
    "Poles and residues",
    "Residue theorem",
    "Application of residue theorem for evaluation of real integral (unit circle)"
   ],
   formulas:[
    "f(z) = u(x,y) + i v(x,y) is analytic ⇒ ux = vy and uy = −vx (Cauchy-Riemann); polar form: u_r = v_θ/r, v_r = −u_θ/r",
    "Harmonic: uxx + uyy = 0 and vxx + vyy = 0; v is the harmonic conjugate of u if u + iv is analytic; Milne-Thomson: f′(z) = ux(z,0) − i uy(z,0)",
    "f′(z) = ux + i vx = vy − i uy",
    "Cauchy-Goursat: ∮_C f(z)dz = 0 if f is analytic inside and on C",
    "Cauchy integral formula: f(a) = (1/2πi)∮ f(z)/(z − a) dz; f⁽ⁿ⁾(a) = (n!/2πi)∮ f(z)/(z − a)ⁿ⁺¹ dz",
    "Residue at a simple pole z = a: lim (z − a)f(z); at pole of order m: 1/(m−1)! lim d^(m−1)/dz^(m−1) [(z−a)ᵐ f(z)]; for f = φ/ψ: φ(a)/ψ′(a)",
    "Residue theorem: ∮_C f(z)dz = 2πi Σ Res f(z) inside C",
    "Real integral over 0 to 2π: put z = e^(iθ), cos θ = (z + 1/z)/2, sin θ = (z − 1/z)/2i, dθ = dz/(iz), then integrate on |z| = 1"
   ],
   hints:[
    "Test analyticity via C-R equations, find the harmonic conjugate and construct f(z) by Milne-Thomson.",
    "Practise Cauchy integral formula and residue theorem on circles like |z| = 2 with poles inside/outside.",
    "Evaluate ∫₀^(2π) dθ/(a + b cos θ) and similar integrals by converting to a unit circle contour."
   ]}
 ],
 text:[
  "G.B. Thomas and R.L. Finney, Calculus and Analytic geometry, Pearson, 9th edition.",
  "Erwin Kreyszig, Advanced Engineering Mathematics, John Wiley & Sons, 10th edition.",
  "W.E. Boyce, R.C. DiPrima and D. Meade, Boyce's Elementary Differential Equations and Boundary Value Problems, Wiley India, Global edition.",
  "S.L. Ross, Differential Equations, Wiley India, 3rd edition.",
  "E.A. Coddington, An Introduction to Ordinary Differential Equations, Dover Publication.",
  "J.W. Brown and R.V. Churchill, Complex Variables and Applications, McGraw Hill, 9th edition.",
  "B.S. Grewal, Higher Engineering Mathematics, Khanna Publishers, 44th Edition."
 ],
 ref:[],
 note:"Units 1, 2 and 4 are marked * in the PDF: practical visual demo with mathematical software (MATLAB, Maple, Mathematica, etc.) (non-evaluative)."
});

sylAdd("AHT-004",{
 n:"Environmental Studies", s:"EVS", type:"theory",
 ltp:"2-0-0", cr:0, sem:"I or II (group-wise)",
 marks:{ct:15,ta:10,ese:50,total:75},
 obj:[
  "Develop a world population that is aware of and concerned about the environment and its associated problems, and which has the knowledge, skills, attitudes, motivation and commitment to work individually and collectively towards solutions of current problems and prevention of new ones.",
  "Awareness: help social groups and individuals acquire awareness of and sensitivity to the total environment and its allied problems.",
  "Knowledge: help social groups and individuals gain a variety of experiences and acquire a basic understanding of the environment and its associated problems.",
  "Attitudes: help social groups and individuals acquire a set of values and feelings of concern for the environment.",
  "Skills: help individuals acquire skills for identifying and solving environmental problems.",
  "Participation: provide social groups and individuals with an opportunity to be actively involved at all levels in working towards the resolution of environmental problems."
 ],
 out:[],
 units:[
  { t:"Introduction and Natural Resources",
   topics:[
    "Introduction to environmental studies",
    "Multidisciplinary nature of environmental studies",
    "Scope and importance",
    "The need for environmental education",
    "Concept of sustainability and sustainable development",
    "Renewable and non-renewable resources: natural resources and associated problems",
    "Forest resources: use and over-exploitation, deforestation, case studies",
    "Timber extraction, mining, dams and their effects on forest and tribal people",
    "Water resources: use and over-utilization of surface and ground water",
    "Floods, drought, conflicts over water, dams-benefits and problems",
    "Mineral resources: use and exploitation, environmental effects of extracting and using mineral resources, case studies",
    "Food resources: world food problems",
    "Changes caused by agriculture and overgrazing",
    "Effects of modern agriculture, fertilizer-pesticide problems, water logging, salinity, case studies",
    "Energy resources: growing energy needs, renewable and non renewable energy sources, use of alternate energy sources, case studies",
    "Land resources: land as a resource, land degradation, man induced landslides, soil erosion and desertification",
    "Role of an individual in conservation of natural resources",
    "Equitable use of resources for sustainable lifestyles"
   ],
   formulas:[
    "Sustainable development (Brundtland 1987): meeting present needs without compromising the ability of future generations to meet theirs",
    "Renewable: solar, wind, hydro, biomass, geothermal, tidal; non-renewable: coal, petroleum, natural gas, minerals",
    "Water logging and salinity arise from over-irrigation with poor drainage; deforestation causes soil erosion, floods, loss of biodiversity and climate change",
    "Desertification = degradation of land in arid, semi-arid and dry sub-humid areas (overgrazing, deforestation, poor irrigation)"
   ],
   hints:[
    "Write short answers on the three pillars of sustainability (environment, economy, society) with an example.",
    "Prepare case studies: Sardar Sarovar/Tehri dam, Chipko movement, Aral Sea, Green Revolution side effects.",
    "Make a table comparing effects of mining, dams and deforestation on forests and tribal people."
   ]},
  { t:"Ecosystems",
   topics:[
    "Concept of an ecosystem",
    "Structure and function of an ecosystem",
    "Producers, consumers and decomposers",
    "Energy flow in the ecosystem",
    "Ecological succession",
    "Food chains, food webs and ecological pyramids",
    "Introduction, types, characteristic features, structure and function of forest ecosystem",
    "Introduction, types, characteristic features, structure and function of grassland ecosystem",
    "Introduction, types, characteristic features, structure and function of desert ecosystem",
    "Aquatic ecosystems (ponds, streams, lakes, rivers, oceans, estuaries)"
   ],
   formulas:[
    "Lindeman's 10% law: only about 10% of energy passes from one trophic level to the next",
    "Trophic levels: producers (autotrophs) → primary consumers (herbivores) → secondary → tertiary consumers; decomposers recycle nutrients",
    "Ecological pyramids: numbers (may be inverted, e.g. tree ecosystem), biomass (inverted in ocean), energy (always upright)",
    "Succession: pioneer species → seral stages → climax community; primary (bare rock) vs secondary (after disturbance)",
    "Gross primary productivity − respiration = net primary productivity"
   ],
   hints:[
    "Draw a grassland food chain and a food web and mark trophic levels and energy transfer with 10% law.",
    "Tabulate forest, grassland, desert and aquatic ecosystems with abiotic factors, flora, fauna.",
    "Explain hydrosere/xerosere succession stages to the climax."
   ]},
  { t:"Biodiversity and Conservation",
   topics:[
    "Introduction and definition: genetic, species and ecosystem diversity",
    "Biogeographical classification of India",
    "Value of biodiversity: consumptive use, productive use, social, ethical, aesthetic and option values",
    "Biodiversity at global, national and local levels",
    "India as a mega-diversity nation",
    "Hot-spots of biodiversity",
    "Threats to biodiversity: habitat loss, poaching of wildlife, man-wildlife conflicts",
    "Endangered and endemic species of India",
    "Conservation of biodiversity: in-situ and ex-situ conservation"
   ],
   formulas:[
    "Three levels of diversity: genetic (within species), species (between species), ecosystem (habitats)",
    "India's biogeographic zones: Trans-Himalaya, Himalaya, Desert, Semi-arid, Western Ghats, Deccan Peninsula, Gangetic Plain, North-East, Islands, Coasts",
    "India's hot-spots: Himalaya, Indo-Burma, Western Ghats and Sri Lanka, Sundaland (Nicobar Islands)",
    "In-situ: national parks, sanctuaries, biosphere reserves; ex-situ: zoos, botanical gardens, gene banks, seed banks, cryopreservation",
    "Threat mnemonic HIPPO: Habitat loss, Invasive species, Pollution, Population growth, Over-exploitation"
   ],
   hints:[
    "Learn 10 endangered and endemic Indian species (tiger, snow leopard, lion-tailed macaque, Great Indian Bustard, etc.).",
    "Differentiate in-situ and ex-situ conservation with examples.",
    "Be ready to explain criteria for a biodiversity hot-spot (endemic plants and habitat loss) and why India is mega-diverse."
   ]},
  { t:"Environmental Pollution",
   topics:[
    "Definition of pollution",
    "Cause, effects and control measures of air pollution",
    "Cause, effects and control measures of water pollution",
    "Cause, effects and control measures of soil pollution",
    "Cause, effects and control measures of marine pollution",
    "Cause, effects and control measures of noise pollution",
    "Cause, effects and control measures of thermal pollution",
    "Cause, effects and control measures of nuclear hazards",
    "Solid waste management: causes, effects and control measures of urban and industrial wastes",
    "Role of an individual in prevention of pollution",
    "Pollution case studies",
    "Disaster management: floods, earthquake, cyclone and landslides"
   ],
   formulas:[
    "Primary air pollutants: CO, SO₂, NOx, particulates, hydrocarbons; secondary: ozone, PAN, acid rain",
    "BOD = oxygen needed by microbes to decompose organic matter (5 days at 20 °C); COD = oxygen for chemical oxidation; DO drops in polluted water",
    "Sound level in decibels: L = 10 log₁₀(I/I₀), I₀ = 10⁻¹² W/m²; WHO limit about 55 dB day and 45 dB night (residential)",
    "Air pollution control devices: electrostatic precipitator, cyclone separator, bag filter, scrubber, catalytic converter",
    "Waste hierarchy: reduce, reuse, recycle; disposal by sanitary landfill, incineration, composting",
    "Eutrophication: nutrient (N, P) enrichment leads to algal bloom, oxygen depletion"
   ],
   hints:[
    "For each pollutant type write cause, effect, control in a three-column table.",
    "Prepare disaster management cycle (mitigation, preparedness, response, recovery) for flood, earthquake, cyclone, landslide.",
    "Learn one case study each: Bhopal gas tragedy, Chernobyl/Fukushima, Minamata, Ganga pollution."
   ]},
  { t:"Social Issues and the Environment",
   topics:[
    "From unsustainable to sustainable development",
    "Urban problems related to energy",
    "Water conservation, rain water harvesting, watershed management",
    "Resettlement and rehabilitation of people; its problems and concerns, case studies",
    "Environmental ethics: issues and possible solutions",
    "Climate change, global warming, acid rain, ozone layer depletion, nuclear accidents and holocaust, case studies",
    "Wasteland reclamation",
    "Consumerism and waste products",
    "Environment Protection Act",
    "Air (Prevention and Control of Pollution) Act",
    "Water (Prevention and Control of Pollution) Act",
    "Wildlife Protection Act",
    "Forest Conservation Act",
    "Issues involved in enforcement of environmental legislation",
    "Public awareness"
   ],
   formulas:[
    "Greenhouse gases: CO₂, CH₄, N₂O, CFCs, water vapour; global warming potential relative to CO₂",
    "Ozone depletion: CFCl₃ + UV → Cl + CFCl₂; Cl + O₃ → ClO + O₂ (one Cl destroys about 10⁵ ozone molecules)",
    "Acid rain: pH < 5.6; SO₂ + H₂O → H₂SO₃, NO₂ → HNO₃",
    "Acts: Wildlife Protection Act 1972, Water Act 1974, Forest Conservation Act 1980, Air Act 1981, Environment Protection Act 1986"
   ],
   hints:[
    "Explain rainwater harvesting and watershed management with methods (roof-top, check dams, percolation pits).",
    "Write a compact table of the five Acts: year, objective, key authority (CPCB/SPCB, MoEFCC).",
    "Prepare notes on global warming, acid rain, ozone depletion with causes, effects and remedies; one case study of resettlement (Narmada, Tehri)."
   ]},
  { t:"Human Population and the Environment",
   topics:[
    "Population growth, variation among nations",
    "Population explosion - Family Welfare Programme",
    "Environment and human health",
    "Human rights",
    "Value education",
    "HIV/AIDS",
    "Women and child welfare",
    "Role of Information Technology in environment and human health",
    "Case studies"
   ],
   formulas:[
    "Population growth rate: r = (births − deaths + immigration − emigration)/population; exponential growth N = N₀e^(rt), doubling time ≈ 70/r(%)",
    "Demographic transition: high birth and death rates → falling death rate → falling birth rate → low, stable rates",
    "Total fertility rate: replacement level about 2.1 children per woman",
    "Human Development Index combines life expectancy, education and income"
   ],
   hints:[
    "Prepare notes on the population growth curve and how population explosion stresses resources.",
    "List causes, transmission and prevention of HIV/AIDS and the role of value education.",
    "Give two examples of IT in environment (GIS, remote sensing, environmental databases) and health (telemedicine)."
   ]}
 ],
 note:"Note (introduce and familiarize students with): Global Environmental Issues and Environmental Laws. Pollution Tragedies: Love canal, Bhopal Gas, Endosulfan, Minamata and Flint water. UN Initiatives and International agreements: Montreal and Kyoto protocols, Paris Climate Summit (2015) and Convention on Biological Diversity (CBD). Environment Laws: Environment Protection Act (1986); Air (Prevention & Control of Pollution) Act (1981); Forest Conservation Act (1980); Water (Prevention and control of Pollution) Act (1974); Wildlife Protection Act (1972). FIELD WORK: (1) Visit to a local area to document environmental assets river / forest / grassland / hill / mountain. (2) Visit to a local polluted site - Urban / Rural / Industrial / Agricultural. (3) Study of common plants, insects, birds. (4) Study of simple ecosystems - pond, river, hill slopes, etc. (5) Plantation of at least 2 fruit trees in surroundings; picture is taken. (6) Any useful daily good from waste materials. (7) Taking at least 5 pics of surroundings by mobile in relation to environmental/social issues. (8) Development of detailed list of flora and fauna of college campus. (9) Manufacturing of any technical prototype/model in relation to climatic change mitigation. Minimum five activities shall be done by each class and reports shall be submitted to the institute after verification by the department.",
 text:[
  "Basu, M. and Xavier, S., Fundamentals of Environmental Studies, Cambridge University Press, 2016.",
  "Mitra, A.K. and Chakraborty, R., Introduction to Environmental Studies, Book Syndicate, 2016.",
  "Enger, E. and Smith, B., Environmental Science: A Study of Interrelationships, McGraw-Hill Higher Education, 12th edition, 2010.",
  "Basu, R.N., Environment, University of Calcutta, 2000."
 ],
 ref:[
  "Odum, E.P., Odum, H.T. & Andrews, J. 1971. Fundamentals of Ecology. Philadelphia: Saunders.",
  "Pepper, I.L., Gerba, C.P. & Brusseau, M.L. 2011. Environmental and Pollution Science. Academic Press.",
  "Gleeson, B. and Low, N. (eds.) 1999. Global Ethics and Environment, London, Routledge.",
  "Gleick, P. H. 1993. Water in Crisis. Pacific Institute for Studies in Dev., Environment & Security. Stockholm Env. Institute, Oxford Univ. Press.",
  "Grumbine, R. Edward, and Pandit, M.K. 2013. Threats from India's Himalaya dams. Science, 339: 36-37.",
  "McCully, P. 1996. Rivers no more: the environmental effects of dams (pp. 29-64). Zed Books.",
  "McNeill, John R. 2000. Something New Under the Sun: An Environmental History of the Twentieth Century.",
  "Ghosh Roy, MK, Sustainable Development (Environment, Energy and Water Resources), Ane Books Pvt. Ltd., 2011.",
  "Karpagam, M and Geetha Jaikumar, Green Management, Theory and Applications, Ane Books Pvt. Ltd., 2010.",
  "Bala Krishnamoorthy, Environmental Management, PHI Learning Pvt Ltd, 2012."
 ]
});
