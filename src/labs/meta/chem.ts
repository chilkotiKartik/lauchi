import type { LabMeta } from "../types";

/** Engineering Chemistry (AHT-002) labs. */
export const CHEM_LABS: LabMeta[] = [
  { id: "orbitals", title: "Hydrogen orbitals as clouds", where: [["AHT-002", 1]], blurb: "See 1s, 2s, 2p, 3s, 3p and 3d orbitals as 3D probability clouds sampled from |ψ|², with both lobe signs and a cut-away to reveal radial nodes.", topics: ["Schrödinger equation for hydrogen", "Quantum numbers", "Radial and angular nodes"], animated: true,
    presets: [
      { name: "2s with cut-away", note: "Cut the cloud open: 2s has one spherical radial node at r = 2a₀, with a small inner blob of opposite sign (blue inside, red outside).", values: { orbital: "2s", cut: true, pts: 5000 } },
      { name: "2p dumbbell", note: "2pz has one angular node (the xy plane); the two lobes have opposite signs of ψ, shown in two colours.", values: { orbital: "2pz", cut: false, pts: 4000 } },
      { name: "3dz² shape", note: "Two angular nodes (cone-shaped) give a dumbbell with a doughnut ring around the waist: l = 2 means 2 angular nodes.", values: { orbital: "3dz2", cut: false, pts: 6000 } },
    ] },
  { id: "motheory", title: "Molecular orbital diagrams", where: [["AHT-002", 1]], blurb: "Fill the MO energy ladder of homonuclear diatomics and ions electron by electron; read bond order, magnetism and stability.", topics: ["Molecular orbital theory", "Bond order", "Paramagnetism"], animated: true,
    presets: [
      { name: "O₂ is paramagnetic", note: "Bond order 2, and the last two electrons sit unpaired in the degenerate π*2p pair (Hund's rule): O₂ is attracted to a magnet.", values: { mol: "O2", charge: 0 } },
      { name: "N₂ triple bond", note: "N₂ has 10 bonding and 4 antibonding electrons: bond order 3, diamagnetic. Note the s–p mixed order: π2p lies below σ2pz.", values: { mol: "N2", charge: 0 } },
      { name: "He₂⁺ half-bond", note: "Three electrons: σ1s² σ*1s¹ gives bond order 0.5, so the ion exists but is weakly bound; neutral He₂ has bond order 0.", values: { mol: "He2", charge: 1 } },
    ] },
  { id: "nernst", title: "Galvanic cell & Nernst equation", where: [["AHT-002", 2]], blurb: "Build a cell from Zn, Fe, Cu and Ag half-cells, change ion concentrations and temperature, and watch E, ΔG and the electron flow respond.", topics: ["EMF and cell potential", "Nernst equation", "Free energy and equilibrium constant"], animated: true,
    presets: [
      { name: "Daniell cell, standard", note: "Both solutions 1 M at 298 K: E = E° = 1.10 V, ΔG = −212 kJ/mol and K ≈ 10³⁷.", values: { cell: "daniell", logA: 0, logC: 0, T: 298 } },
      { name: "Dilute cathode ion", note: "Cu²⁺ at 0.0001 M makes Q large, so E falls by about 0.03 V per decade of Q (n = 2).", values: { cell: "daniell", logA: 0, logC: -4, T: 298 } },
      { name: "Silver–zinc, hot", note: "Zn | Ag⁺ has the largest E° (1.56 V). Higher T raises the RT/nF slope, so concentration matters more.", values: { cell: "znag", logA: -1, logC: -2, T: 348 } },
    ] },
  { id: "gibbs", title: "Gibbs energy & spontaneity", where: [["AHT-002", 2]], blurb: "Slide the temperature and watch ΔG = ΔH − TΔS change sign at the crossover temperature; a balance tips toward products or reactants.", topics: ["Free energy", "Entropy", "Spontaneity"], animated: true,
    presets: [
      { name: "Water boils at 373 K", note: "ΔH = +40.7 kJ, ΔS = +109 J/K: ΔG = 0 at T = ΔH/ΔS ≈ 373 K. Below it liquid wins, above it vapour.", values: { rxn: "vap", T: 373 } },
      { name: "Limestone kiln", note: "CaCO₃ → CaO + CO₂ is endothermic but entropy-driven: it only becomes spontaneous above about 1106 K.", values: { rxn: "caco3", T: 1200 } },
      { name: "Haber process", note: "Exothermic with ΔS < 0, so ΔG turns positive above about 464 K: heat favours the reverse reaction (hence catalysts and pressure).", values: { rxn: "haber", T: 700 } },
    ] },
  { id: "hardness", title: "Hardness of water", where: [["AHT-002", 3]], blurb: "Add Ca²⁺, Mg²⁺ and HCO₃⁻ to a beaker; read total, temporary and permanent hardness and see boiling precipitate the carbonate.", topics: ["Hardness of water", "Temporary and permanent hardness", "Units of hardness"], animated: true,
    presets: [
      { name: "Soft rain water", note: "Very few Ca²⁺ and Mg²⁺ ions: well under 75 ppm as CaCO₃, so the water is soft and lathers easily.", values: { ca: 5, mg: 2, hco3: 20, boil: false } },
      { name: "Boil temporary hardness", note: "Here HCO₃⁻ covers all the hardness, so boiling settles it all as CaCO₃ scale: Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂.", values: { ca: 80, mg: 24, hco3: 400, boil: true } },
      { name: "Permanent (sulphate) hardness", note: "Little bicarbonate, so most of the hardness comes from dissolved CaSO₄ and MgCl₂. Boiling would not soften it; lime–soda or zeolite is needed.", values: { ca: 90, mg: 40, hco3: 60, boil: false } },
    ] },
  { id: "polymer", title: "Addition polymer chains", where: [["AHT-002", 4]], blurb: "Watch monomers link into random-coil chains and see how average chain length and spread set Mn, Mw and the PDI.", topics: ["Addition polymerisation", "Molecular weight of polymers", "Polydispersity"], animated: true,
    presets: [
      { name: "PVC, nearly uniform", note: "A very narrow distribution: Mw is almost equal to Mn and PDI ≈ 1.", values: { monomer: "vinylchloride", n: 100, spread: 0.1 } },
      { name: "Polyethylene, broad", note: "A wide spread of chain lengths pushes Mw well above Mn: PDI = Mw/Mn is about 2.2, like a typical free-radical polymer.", values: { monomer: "ethylene", n: 200, spread: 0.9 } },
      { name: "PMMA, monodisperse", note: "With zero spread every chain has exactly n units, so Mn = Mw and PDI = 1 (an idealised living polymerisation).", values: { monomer: "mma", n: 40, spread: 0 } },
    ] },
  { id: "spectro", title: "Vibration & rotation of diatomics", where: [["AHT-002", 5]], blurb: "A vibrating, rotating diatomic with live wavenumber, rotational constant and line spacing from the harmonic oscillator and rigid rotor.", topics: ["Vibrational spectroscopy", "Rotational spectroscopy", "Selection rules"], animated: true,
    presets: [
      { name: "HCl fundamental", note: "k ≈ 516 N/m and μ ≈ 0.98 amu give ν̃ ≈ 2990 cm⁻¹ and lines about 21 cm⁻¹ apart (2B).", values: { mol: "HCl", k: 516, r: 127.5 } },
      { name: "Carbon monoxide", note: "A strong triple bond (k ≈ 1900 N/m) but heavy atoms: ν̃ ≈ 2170 cm⁻¹ with closely spaced rotational lines (B ≈ 1.9 cm⁻¹).", values: { mol: "CO", k: 1902, r: 112.8 } },
      { name: "N₂ is IR-silent", note: "Homonuclear molecules have no changing dipole, so their vibration does not absorb infrared, however stiff the bond.", values: { mol: "N2", k: 2295, r: 109.8 } },
    ] },
];
