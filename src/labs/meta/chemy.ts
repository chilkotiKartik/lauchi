import type { LabMeta } from "../types";

/** Round-3 labs (group chemy): fills every unit of the core subjects to at least five labs. */
export const CHEMY_LABS: LabMeta[] = [
  { id: "bandtheory", title: "Band theory: conductors, semiconductors, insulators", where: [["AHT-002", 1], ["ECT-001", 1], ["AHT-001", 5]], blurb: "Open or close the forbidden gap between the valence and conduction bands, heat the crystal and dope it, and watch electrons jump the gap as n_i, the Fermi level and the absorption edge respond.", topics: ["Bonding in metals (Band Theory)", "Conductors, semiconductors and insulators", "Forbidden energy gap", "Intrinsic and extrinsic semiconductors"], animated: true,
    presets: [
      { name: "PYQ: silicon (semiconductor)", note: "PYQ Q1.1 band diagram. E_g = 1.12 eV: at 300 K only about 10¹⁰ electrons per cm³ cross the gap, so pure Si barely conducts.", values: { Eg: 1.12, T: 300, dop: "none" } },
      { name: "Copper (conductor)", note: "In a metal the valence and conduction bands overlap (E_g = 0): a sea of ~10²³ free electrons per cm³ conducts at any temperature.", values: { Eg: 0, T: 300, dop: "none" } },
      { name: "Diamond (insulator)", note: "E_g = 5.47 eV is about 200 kT: virtually no electron is excited across the gap, even at 800 K.", values: { Eg: 5.47, T: 300, dop: "none" } },
    ] },
  { id: "hesslaw", title: "Hess's law energy cycle", where: [["AHT-002", 2]], blurb: "Go from reactants to products directly, or round the cycle through their combustion products: both paths give the same ΔH. Type in heats of combustion and read ΔH and ΔU.", topics: ["Hess law", "Energy (internal energy and enthalpy)", "I law of thermodynamics"], animated: true,
    presets: [
      { name: "PYQ: ΔHf of methane", note: "PYQ Q2.8: ΔHc of C, H₂ and CH₄ = −393.50, −285.83 and −890.36 kJ/mol give ΔHf(CH₄) = −74.8 kJ/mol.", values: { rxn: "ch4", a: -393.5, b: -285.83, c: -890.36 } },
      { name: "PYQ: hydrogenation of ethene", note: "PYQ Q2.9: ΔHc of C₂H₄ −1411, H₂ −285.8, C₂H₆ −1560 kJ/mol, so C₂H₄ + H₂ → C₂H₆ has ΔH = −136.8 kJ/mol.", values: { rxn: "hydrog", a: -1411, b: -285.8, c: -1560 } },
      { name: "Graphite to diamond", note: "Diamond burns with 1.9 kJ/mol more heat than graphite, so graphite → diamond is endothermic by +1.9 kJ/mol: a change you cannot measure directly.", values: { rxn: "diamond", a: -393.5, b: -285.83, c: -395.4 } },
    ] },
  { id: "revosmosis", title: "Reverse osmosis desalination", where: [["AHT-002", 3]], blurb: "Push brine against a semi-permeable membrane with a piston: below the osmotic pressure water flows into the brine, above it pure water is squeezed out. Read π = iCRT and the water flux.", topics: ["Reverse osmosis process", "Different processes of water treatment", "Industrial water treatment"], animated: true,
    presets: [
      { name: "Sea-water RO plant", note: "35 g/L NaCl has π ≈ 30 bar at 25 °C; plants run at 55–70 bar so the net pressure drives a strong flux of fresh water.", values: { P: 60, salt: 35, T: 25, A: 1, sol: "nacl" } },
      { name: "Natural osmosis", note: "With no applied pressure the solvent moves from the dilute side into the brine (ordinary osmosis).", values: { P: 0, salt: 35, T: 25, A: 1, sol: "nacl" } },
      { name: "Brackish well water", note: "3 g/L of salt has π of only 2.5 bar, so a low-pressure (15 bar) membrane is enough.", values: { P: 15, salt: 3, T: 25, A: 2, sol: "nacl" } },
    ] },
  { id: "alkalinity", title: "Alkalinity of water: P and M titration", where: [["AHT-002", 3]], blurb: "Titrate a water sample with acid to the phenolphthalein (P) and methyl-orange (M) end points, watch the indicator colours change, and split the alkalinity into OH⁻, CO₃²⁻ and HCO₃⁻.", topics: ["Alkalinity of water", "Hardness of water", "Industrial water treatment"], animated: true,
    presets: [
      { name: "Carbonate + bicarbonate", note: "100 mL needs 5 mL of N/50 acid to P and 15 mL to M: P = 50, M = 150 ppm, so CO₃²⁻ = 2P = 100 and HCO₃⁻ = M − 2P = 50 ppm.", values: { P: 5, M: 15, V: 100, N: 0.02 } },
      { name: "Hydroxide + carbonate", note: "P = 120, M = 150 ppm: P > M/2, so OH⁻ = 2P − M = 90 and CO₃²⁻ = 2(M − P) = 60 ppm. OH⁻ and HCO₃⁻ never coexist.", values: { P: 12, M: 15, V: 100, N: 0.02 } },
      { name: "Only bicarbonate", note: "No pink colour with phenolphthalein (P = 0): all the alkalinity is HCO₃⁻, as in most natural waters.", values: { P: 0, M: 12, V: 100, N: 0.02 } },
    ] },
  { id: "polygrowth", title: "Step-growth vs chain-growth polymerisation", where: [["AHT-002", 4]], blurb: "Link monomers by condensation (step growth) or addition (chain growth) and see why step growth needs 99 % conversion for a useful polymer while chain growth makes long chains from the start.", topics: ["Types of polymerization", "Classification of polymerization", "Polyamides", "Macromolecules: introduction and classification of polymers"], animated: true,
    presets: [
      { name: "Nylon-6,6 at 99 %", note: "Carothers: X̄n = 1/(1 − p) = 100 repeat units (M₀ ≈ 113 per residue), Mn ≈ 11 300 g/mol, PDI ≈ 2.", values: { mode: "step", p: 0.99, r: 1, M0: 113, dpc: 1000 } },
      { name: "Only 90 % reacted", note: "At p = 0.90 step growth has made only oligomers of about 10 units: useless as a fibre. Every extra 9 in the conversion counts.", values: { mode: "step", p: 0.9, r: 1, M0: 113, dpc: 1000 } },
      { name: "Chain growth at low conversion", note: "Addition polymerisation (e.g. polyethylene): even at 50 % conversion the chains are already ~1000 units long; the rest is unreacted monomer.", values: { mode: "chain", p: 0.5, r: 1, M0: 28, dpc: 1000 } },
    ] },
  { id: "visindex", title: "Viscosity index & flash, fire, cloud, pour points", where: [["AHT-002", 4]], blurb: "Drop steel balls through the test oil and two standard oils, heat or cool them, and see the viscosity index and the flash, fire, cloud and pour points come alive.", topics: ["Viscosity index", "Flash and fire point", "Cloud point", "Pour point", "Lubricants: introduction"], animated: true,
    presets: [
      { name: "PYQ: VI of unknown oil", note: "PYQ Q4.13: U = 600 s, H (Pennsylvanian) = 500 s, L (Gulf) = 800 s at 100 °F, all 60 s at 210 °F: VI = (800 − 600)/(800 − 500) × 100 = 66.7.", values: { U: 600, H: 500, L: 800, T: 40, flash: 200, fire: 230, cloud: -5, pour: -12 } },
      { name: "Cold start: below the pour point", note: "At −20 °C the oil is below its pour point: wax has set and the oil will not flow to the bearings.", values: { U: 600, H: 500, L: 800, T: -20, flash: 200, fire: 230, cloud: -5, pour: -12 } },
      { name: "Overheated: past the flash point", note: "At 215 °C vapours above the oil flash when a flame is brought near (flash point 200 °C) but do not yet keep burning (fire point 230 °C).", values: { U: 600, H: 500, L: 800, T: 215, flash: 200, fire: 230, cloud: -5, pour: -12 } },
    ] },
  { id: "beerlambert", title: "UV–Vis spectroscopy & Beer–Lambert law", where: [["AHT-002", 5]], blurb: "Shine light through a cuvette of a chromophore, tune the wavelength and the concentration, and read absorbance A = εcl, %T and λmax for σ→σ*, n→σ*, π→π* and n→π* transitions.", topics: ["Electronic spectroscopy", "Principle of spectroscopy and selection rule", "Applications of spectroscopy"], animated: true,
    presets: [
      { name: "PYQ: butadiene vs ethene", note: "PYQ Q5.5: conjugation lowers the π→π* gap, so 1,3-butadiene absorbs at 217 nm, well beyond ethene (171 nm) and ethane (σ→σ*, ~135 nm).", values: { ch: "butadiene", c: 0.02, l: 1, lam: 217 } },
      { name: "β-Carotene is orange", note: "Eleven conjugated C=C push λmax to 452 nm (blue light is absorbed), so carrots look orange. ε is huge: 139 000 L mol⁻¹ cm⁻¹.", values: { ch: "carotene", c: 0.005, l: 1, lam: 452 } },
      { name: "Weak n→π* of acetone", note: "The n→π* band of a C=O is symmetry-forbidden: ε ≈ 15, so you need a 30 mM solution to get A ≈ 0.45.", values: { ch: "acetone", c: 30, l: 1, lam: 279 } },
    ] },
  { id: "dielsalder", title: "Diels–Alder cycloaddition in 3D", where: [["AHT-002", 5]], blurb: "Watch butadiene and a dienophile meet face to face: three π bonds become two new σ bonds and a ring, in one concerted step. Change the dienophile and the temperature and read ΔG, K and the rate.", topics: ["Cyclization (Diels-Alder reaction)", "Types of organic reactions: addition", "Free energy"], animated: true,
    presets: [
      { name: "Butadiene + ethene", note: "The textbook [4 + 2]: cyclohexene. ΔH ≈ −168 kJ/mol but the barrier is high (~115 kJ/mol), so it needs about 200 °C.", values: { dn: "ethene", T: 470, c0: 1, xi: 0.5 } },
      { name: "Maleic anhydride (fast)", note: "Two C=O groups make the dienophile electron-poor and lower its LUMO: the reaction runs near room temperature and the cis groups stay cis.", values: { dn: "maleic", T: 320, c0: 1, xi: 0.5 } },
      { name: "Retro-Diels–Alder", note: "Above T = ΔH/ΔS ≈ 894 K the −TΔS term wins (two molecules → one ring loses entropy) and cyclohexene falls apart again.", values: { dn: "ethene", T: 1000, c0: 1, xi: 0.5 } },
    ] },
  { id: "irmodes", title: "IR vibrational modes of H₂O and CO₂", where: [["AHT-002", 5]], blurb: "Animate every normal mode of H₂O, CO₂, CS₂ and diatomics, watch the dipole moment oscillate (or not), and see which modes absorb IR. Swap in deuterium for the isotope shift.", topics: ["Vibrational spectroscopy", "Principle of spectroscopy and selection rule", "Applications of spectroscopy"], animated: true,
    presets: [
      { name: "PYQ: H₂O → D₂O", note: "PYQ Q5.14: the 3652 cm⁻¹ O–H stretch of H₂O drops to about 2660 cm⁻¹ for D₂O, since ν̃ ∝ 1/√μ.", values: { mol: "h2o", k: 1, iso: 1.998 } },
      { name: "PYQ: CO₂ symmetric stretch", note: "PYQ Q5.6: the symmetric stretch keeps the dipole at zero, so it is IR inactive (Raman active); the bend (667) and asymmetric stretch (2349) absorb.", values: { mol: "co2", k: 1, iso: 1 } },
      { name: "PYQ: N₂ is IR silent", note: "A homonuclear diatomic has no dipole at any bond length: no IR band at all (only Raman, 2331 cm⁻¹).", values: { mol: "n2", k: 1, iso: 1 } },
    ] },
  { id: "vulcanize", title: "Vulcanisation of rubber", where: [["AHT-002", 4]], blurb: "Add sulphur to natural rubber, form S–S bridges between the chains and stretch the strip: see the modulus, the network density and the stress rise, from sticky raw rubber to hard ebonite.", topics: ["Vulcanization", "Rubber", "Macromolecules: introduction and classification of polymers"], animated: true,
    presets: [
      { name: "Tyre-grade rubber", note: "About 3 phr of sulphur with accelerators (≈ 8 S atoms per cross-link) gives G ≈ 0.5 MPa: soft, elastic and fully recoverable.", values: { S: 3, eff: 8, T: 298, lam: 3 } },
      { name: "Raw rubber", note: "No sulphur, no cross-links: chains slide past each other, so raw rubber is sticky, soft when hot, brittle when cold and does not spring back.", values: { S: 0, eff: 8, T: 298, lam: 3 } },
      { name: "Unaccelerated cure", note: "Without accelerators ~45 S atoms are wasted per cross-link (long polysulphide bridges), so the same sulphur gives a far looser network.", values: { S: 3, eff: 45, T: 298, lam: 3 } },
    ] },
];
