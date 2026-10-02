import type { LabMeta } from "../types";

/** Extra Engineering Chemistry (AHT-002) labs built from the PYQ lab blueprints. */
export const CHEMX_LABS: LabMeta[] = [
  { id: "cft", title: "Crystal field splitting & magnetism", where: [["AHT-002", 1]], blurb: "Bring ligands up to a metal ion in octahedral, tetrahedral or square-planar geometry, split the d-orbitals and fill electrons high-spin or low-spin.", topics: ["Crystal field theory", "High and low spin", "CFSE", "Magnetic moment"], animated: true,
    presets: [
      { name: "[Co(NH₃)₆]³⁺ low spin", note: "Co³⁺ is d⁶. NH₃ gives Δₒ ≈ 22 900 cm⁻¹, more than the pairing energy, so all six electrons pair in t₂g: diamagnetic.", values: { d: 6, geo: "oct", D: 22900, P: 21000 } },
      { name: "[CoF₆]³⁻ high spin", note: "F⁻ is a weak-field ligand (Δₒ ≈ 13 000 cm⁻¹ < P): t₂g⁴e_g², four unpaired electrons, μ ≈ 4.9 BM.", values: { d: 6, geo: "oct", D: 13000, P: 21000 } },
      { name: "[Ni(CN)₄]²⁻ square planar", note: "d⁸ with strong-field CN⁻: the d_x²−y² orbital is left empty, all 8 electrons pair, so it is diamagnetic.", values: { d: 8, geo: "sqp", D: 35000, P: 20000 } },
    ] },
  { id: "ellingham", title: "Ellingham diagram & smelting", where: [["AHT-002", 2]], blurb: "Plot ΔG° against temperature for metal oxides and for carbon: find the temperature where carbon or CO can reduce an ore, and light up the furnace.", topics: ["Ellingham diagram", "Gibbs energy", "Reduction of oxides", "Metallurgy"], animated: true,
    presets: [
      { name: "Iron in a blast furnace", note: "Above about 1000 K the 2C → 2CO line lies below the FeO line, so coke reduces iron oxide.", values: { ox: "feo", red: "c_co", T: 1300 } },
      { name: "Aluminium resists carbon", note: "The Al₂O₃ line is so low that carbon cannot reduce it below ~2000 K; aluminium is made by electrolysis instead.", values: { ox: "al2o3", red: "c_co", T: 1800 } },
      { name: "Zinc boils", note: "The ZnO line bends upward at 1180 K (zinc boils, ΔS drops), helping carbon reduce ZnO at high temperature.", values: { ox: "zno", red: "c_co", T: 1400 } },
    ] },
  { id: "softening", title: "Water softening: ion exchange & lime–soda", where: [["AHT-002", 3]], blurb: "Feed hard water through cation and anion exchange columns until the resin is exhausted, or dose lime and soda to precipitate the hardness.", topics: ["Hardness of water", "Ion-exchange process", "Lime–soda process", "Regeneration"], animated: true,
    presets: [
      { name: "Fresh resin", note: "350 ppm hardness and 100 L of resin (40 g/L capacity) can soften about 11 400 L before breakthrough.", values: { mode: "ion", ca: 150, mg: 100, pca: 60, pmg: 40, vol: 4000, resin: 100, cap: 40 } },
      { name: "Breakthrough", note: "Past the exhaustion volume, hardness leaks through. The column must be regenerated with HCl (cation) and NaOH (anion).", values: { mode: "ion", ca: 150, mg: 100, pca: 60, pmg: 40, vol: 14000, resin: 100, cap: 40 } },
      { name: "Lime–soda (PYQ)", note: "PYQ Q3.13 values as CaCO₃: temporary Ca 10, Mg 5; permanent Ca 10, Mg 10 ppm, 50 m³: lime ≈ 1.2 kg and soda ≈ 1.1 kg (90 % and 95 % pure).", values: { mode: "lime", ca: 10, mg: 5, pca: 10, pmg: 10, m3: 50 } },
    ] },
  { id: "corrosion", title: "Corrosion & cathodic protection", where: [["AHT-002", 3]], blurb: "A steel pipe in water rusts at a rate set by acidity and dissolved oxygen. Bolt on a zinc or magnesium anode, or drive an impressed current, and stop it.", topics: ["Electrochemical corrosion", "Hydrogen evolution and oxygen absorption", "Sacrificial anode", "Impressed current cathodic protection"], animated: true,
    presets: [
      { name: "Unprotected in sea water", note: "Neutral, aerated water: oxygen absorption at the cathode drives about 0.5 mm of rust a year.", values: { prot: "none", pH: 7, o2: 8, area: 1, I: 1 } },
      { name: "Zinc anode", note: "A zinc block corrodes instead of the steel: the pipe becomes the cathode. Zinc is used up at about 11 kg per ampere-year.", values: { prot: "zinc", pH: 7, o2: 8, area: 1, I: 1 } },
      { name: "Acid attack", note: "At pH 3 hydrogen evolution takes over and the rate jumps. ICCP needs a bigger current to protect the same area.", values: { prot: "iccp", pH: 3, o2: 8, area: 1, I: 1 } },
    ] },
  { id: "calorimeter", title: "Bomb calorimeter: GCV and NCV", where: [["AHT-002", 4]], blurb: "Burn a coal pellet in oxygen inside a steel bomb, read the temperature rise of the water and work out the gross and net calorific values.", topics: ["Calorific value", "Bomb calorimeter", "Dulong's formula", "Corrections"], animated: true,
    presets: [
      { name: "Good steam coal", note: "1 g with 80 % C and 5 % H heats 2500 g water-equivalent by about 3.3 °C: GCV ≈ 8190 cal/g.", values: { m: 1, C: 80, H: 5, W: 2000, w: 500 } },
      { name: "High-hydrogen fuel", note: "15 % hydrogen raises the GCV, but more of it is lost as latent heat of the steam, so the NCV gap grows to ~790 cal/g.", values: { m: 0.98, C: 80, H: 15, W: 1000, w: 2500 } },
    ] },
  { id: "lubrication", title: "Lubrication regimes (Stribeck curve)", where: [["AHT-002", 4]], blurb: "A shaft turning in an oiled bearing: change the oil grade, viscosity index, temperature, speed and load and slide between boundary, mixed and hydrodynamic lubrication.", topics: ["Lubrication mechanisms", "Viscosity index", "Hydrodynamic lubrication", "Boundary lubrication"], animated: true,
    presets: [
      { name: "Fluid film", note: "Thick oil, high speed, light load: the shaft floats on a full film and friction is tiny.", values: { nu40: 220, VI: 100, T: 40, rpm: 3000, load: 500 } },
      { name: "Start-up under load", note: "Slow speed and heavy load squeeze the film out: metal asperities touch (boundary lubrication) and friction is high.", values: { nu40: 15, VI: 100, T: 120, rpm: 50, load: 9000 } },
      { name: "Low-VI oil gets hot", note: "A VI-0 oil thins sharply at 130 °C and drops into mixed lubrication; a high-VI oil holds up better.", values: { nu40: 68, VI: 0, T: 130, rpm: 1000, load: 3000 } },
    ] },
  { id: "nmr", title: "¹H NMR spectrometer", where: [["AHT-002", 5]], blurb: "Put a sample in the magnet, choose the field strength and read the spectrum: chemical shifts, n + 1 splitting and integration, against TMS at 0 ppm.", topics: ["NMR spectroscopy", "Chemical shift", "Spin–spin coupling", "Structure elucidation"], animated: true,
    presets: [
      { name: "Ethanol", note: "Three signals: CH₃ triplet (1.2 ppm), CH₂ quartet (3.7 ppm, next to O so deshielded) and the OH singlet.", values: { mol: "ethanol", B0: 7.05, J: 7, width: 1.5 } },
      { name: "PYQ: C₄H₉Br", note: "6H doublet at 1.04, 1H multiplet at 1.95, 2H doublet at 3.33 ppm: isobutyl bromide, (CH₃)₂CHCH₂Br.", values: { mol: "isobutylbr", B0: 7.05, J: 7, width: 1.5 } },
      { name: "Low-field magnet", note: "At 60 MHz (1.41 T) the same 7 Hz coupling spans 0.12 ppm, so multiplets spread out and can overlap.", values: { mol: "isobutylbenz", B0: 1.41, J: 7, width: 1.5 } },
    ] },
  { id: "snmech", title: "S_N1 vs S_N2 mechanisms", where: [["AHT-002", 5]], blurb: "Watch a nucleophile attack an alkyl halide: back-side attack with Walden inversion, or a carbocation and a racemic mix. Change substrate, nucleophile and solvent.", topics: ["Nucleophilic substitution", "S_N1 and S_N2", "Walden inversion", "Racemisation"], animated: true,
    presets: [
      { name: "Primary + strong Nu (S_N2)", note: "CH₃CH₂Br with OH⁻ in acetone: one step, rate = k[RX][Nu⁻], full inversion of configuration.", values: { sub: "primary", nu: "strong", solv: "aprotic", conc: 1, T: 298 } },
      { name: "Tertiary in water (S_N1)", note: "(CH₃)₃CBr in a polar protic solvent ionises first to a planar carbocation; attack from both faces gives a racemic product.", values: { sub: "tertiary", nu: "weak", solv: "protic", conc: 1, T: 298 } },
      { name: "Secondary: borderline", note: "Secondary halides sit in between: a strong nucleophile in an aprotic solvent pushes towards S_N2, water pushes towards S_N1.", values: { sub: "secondary", nu: "weak", solv: "protic", conc: 0.5, T: 320 } },
    ] },
];
