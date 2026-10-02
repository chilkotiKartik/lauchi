import type { LabMeta } from "../types";

/** Round-3 labs (group phyy): fills every unit of the core subjects to at least five labs. */
export const PHYY_LABS: LabMeta[] = [
  { id: "biprism", title: "Fresnel's biprism & fringe shift", where: [["AHT-001", 1]], blurb: "One slit, a thin double prism and two virtual sources: measure the fringe width β = λD/d, then slip a thin sheet into one beam and count how far the fringes slide.", topics: ["Fresnel's Biprism experiment", "Interference: coherent sources", "Displacement of fringes", "Conditions of interference (sustained interference)"], animated: true,
    presets: [
      { name: "Sodium light, standard set-up", note: "a = 20 cm, b = 80 cm, α = 1°, μ = 1.5: the virtual sources are d = 2a(μ − 1)α = 3.49 mm apart and β = λD/d = 0.169 mm, about 83 fringes in the field.", values: { lam: 589.3, alpha: 1, mu: 1.5, a: 20, b: 80, sheet: false, t: 5, ms: 1.58 } },
      { name: "Mica sheet in one beam", note: "A mica sheet (μ = 1.58, t = 6.44 µm) adds (μ − 1)t = 3.74 µm of path: the pattern slides by (μ − 1)t/λ = 6.34 fringes, x₀ = (μ − 1)tD/d = 1.07 mm, towards the covered beam.", values: { lam: 589.3, alpha: 1, mu: 1.5, a: 20, b: 80, sheet: true, t: 6.44, ms: 1.58 } },
      { name: "Gentler prism, slit close by", note: "α = 0.5° and a = 10 cm bring the virtual sources to d = 0.87 mm; with b = 140 cm the fringes widen to β = 1.01 mm, but only about 12 fit in the narrower overlap field.", values: { lam: 589.3, alpha: 0.5, mu: 1.5, a: 10, b: 140, sheet: false } },
    ] },
  { id: "wedge", title: "Wedge-shaped air film", where: [["AHT-001", 1]], blurb: "Two glass plates propped apart by a thin wire make a wedge of air: straight, evenly spaced fringes with β = λ/2μθ, dark at the contact edge, complementary in transmitted light.", topics: ["Wedge shaped film", "Interference in thin films", "Fringe width β = λ/2μθ"], animated: true,
    presets: [
      { name: "Air wedge in sodium light", note: "A 20 µm wire 5 cm from the edge: θ = 0.4 mrad, β = λ/2θ = 0.736 mm, and 2t/λ gives 68 dark fringes across the wedge.", values: { lam: 589, D: 20, L: 5, mu: 1, trans: false } },
      { name: "Fill the wedge with water", note: "With μ = 1.33 the optical path doubles faster: β = λ/2μθ shrinks to 0.554 mm and 91 dark fringes fit in.", values: { lam: 589, D: 20, L: 5, mu: 1.33, trans: false } },
      { name: "Look in transmitted light", note: "The transmitted pattern is complementary: the edge (t = 0) is now bright and every dark fringe becomes bright, though the contrast is poorer.", values: { lam: 589, D: 20, L: 5, mu: 1, trans: true } },
    ] },
  { id: "einstein", title: "Einstein coefficients & the ruby laser", where: [["AHT-001", 2]], blurb: "Absorption, spontaneous and stimulated emission in balance: A₂₁/B₂₁ = 8πhν³/c³, why thermal light never lases, and how a flash-pumped three-level ruby rod reaches population inversion.", topics: ["Einstein's coefficients", "Laser: principle of laser action", "Population inversion", "Construction and working of Ruby laser"], animated: true,
    presets: [
      { name: "PYQ: 6930 Å laser photon", note: "A laser emits 6930 Å light on a transition to the ground state (E = 0). E = hc/λ = 2.87 × 10⁻¹⁹ J = 1.79 eV, so the excited state sits 1.79 eV above the ground state.", values: { lam: 693, T: 300, w: 0.6 } },
      { name: "Ruby pumped past threshold", note: "With W = 3A₂₁ the steady state has N₂/N₁ = 3: inversion (N₂ − N₁)/N = 50 %, and stimulated emission at 694.3 nm builds a beam between the mirrors.", values: { lam: 694.3, T: 300, w: 3 } },
      { name: "Even as hot as the Sun", note: "At 6000 K e^(hν/kT) − 1 is still about 31 for 694.3 nm: spontaneous emission wins and N₂ ≪ N₁. Heating can never make a laser; only pumping can.", values: { lam: 694.3, T: 6000, w: 0 } },
    ] },
  { id: "calcite", title: "Double refraction & the Nicol prism", where: [["AHT-001", 2]], blurb: "Unpolarised light splits in calcite into ordinary and extraordinary rays polarised at right angles. Turn the crystal, tilt the optic axis and use an analyser to tell them apart.", topics: ["Polarization: phenomenon of double refraction", "Ordinary and extra-ordinary rays", "Nicol prism", "Production and analysis of plane polarized light"], animated: true,
    presets: [
      { name: "Largest walk-off", note: "Near θ = 42° to the optic axis the E ray walks off by 6.26°: a 10 mm rhomb puts the two spots 1.10 mm apart.", values: { th: 42, psi: 0, t: 10, an: 45 } },
      { name: "Along the optic axis", note: "With θ = 0 both waves travel at the same speed (n = n_o) and there is no double refraction: one spot.", values: { th: 0, psi: 0, t: 10, an: 45 } },
      { name: "Analyser crossed with the E ray", note: "E vibrates in the principal section (0° here). An analyser at 90° blocks it completely and passes the O ray (50 % of the incident light): this is how the two rays are shown to be polarised at right angles.", values: { th: 45, psi: 0, t: 10, an: 90 } },
    ] },
  { id: "poynting", title: "Poynting vector & energy flow", where: [["AHT-001", 3]], blurb: "A source radiates P watts through spheres around it: intensity ⟨S⟩ = P/4πr², with the E and H fields of the wave and its energy density. Covers a lamp and the Sun on one slider.", topics: ["Poynting theorem", "Poynting vector S = E × H", "Electromagnetic wave propagation in free space"], animated: true,
    presets: [
      { name: "PYQ: 100 W bulb at 2 m", note: "⟨S⟩ = 100/(4π × 2²) = 1.99 W/m². Then E₀ = √(2⟨S⟩Z₀) = 38.7 V/m (rms 27.4 V/m) and H₀ = E₀/377 = 0.103 A/m.", values: { lgP: 2, lgr: 0.30103, er: 1 } },
      { name: "PYQ: at the Sun's surface", note: "P = 3.8 × 10²⁶ W through a sphere of radius 7 × 10⁸ m: S = P/4πR² = 6.17 × 10⁷ W/m².", values: { lgP: 26.5798, lgr: 8.8451, er: 1 } },
      { name: "PYQ: sunlight at the Earth", note: "At 1.49 × 10¹¹ m the same power gives 1365 W/m² (the solar constant, 2 cal min⁻¹ cm⁻²): E₀ = √(2SZ₀) ≈ 1014 V/m and B₀ = E₀/c ≈ 3.38 µT.", values: { lgP: 26.5798, lgr: 11.1727, er: 1 } },
    ] },
  { id: "dispcurrent", title: "Displacement current in a capacitor", where: [["AHT-001", 3]], blurb: "An AC current charges a parallel-plate capacitor: no charge crosses the gap, yet a magnetic field circles it. Maxwell's displacement current ε₀∂E/∂t makes Ampère's law work again.", topics: ["Ampere's law and displacement current", "Maxwell's equations in integral form", "Continuity equation"], animated: true,
    presets: [
      { name: "Loop inside the plates", note: "r = 5 cm with 10 cm plates encloses r²/a² = ¼ of the displacement current: 5 mA of the 20 mA, so B = μ₀I_d/2πr = 2.0 × 10⁻⁸ T.", values: { I: 20, f: 200, a: 10, d: 2, r: 5 } },
      { name: "Loop outside: same as the wire", note: "At r = 15 cm (> a) the loop encloses all 20 mA of displacement current, and B = 2.67 × 10⁻⁸ T, exactly the field at 15 cm round the wire.", values: { I: 20, f: 200, a: 10, d: 2, r: 15 } },
      { name: "Five times the frequency", note: "At 1 MHz the same current needs only a fifth of the field: E₀ drops from 5.7 × 10⁴ to 1.1 × 10⁴ V/m, but B is unchanged because it depends only on I_d = I.", values: { I: 20, f: 1000, a: 10, d: 2, r: 5 } },
    ] },
  { id: "magnetism", title: "Dia-, para- & ferromagnetism", where: [["AHT-001", 3]], blurb: "Atomic moments in a field: induced opposing moments in diamagnets, thermally jostled dipoles obeying Curie's law in paramagnets, and domains in iron that vanish above the Curie temperature.", topics: ["Magnetic properties of materials: basic concept of para-, dia- and ferro-magnetism", "Langevin's theory of diamagnetism", "Curie law and Curie temperature", "Magnetic susceptibility"], animated: true,
    presets: [
      { name: "PYQ: Al₂O₃ in 10 A/m", note: "χ = −5 × 10⁻⁵ and H = 10 A/m: M = χH = −5 × 10⁻⁴ A/m and B = μ₀(H + M) = 1.2566 × 10⁻⁵ T, a hair below μ₀H.", values: { mat: "al2o3", H: 10, T: 300 } },
      { name: "Paramagnet near absolute zero", note: "At 4 K, χ = C/T = 0.80/4 = 0.20, 75 times its room-temperature value, and in 10⁵ A/m the moments start to line up (⟨cos θ⟩ ≈ 0.06).", values: { mat: "gd", H: 100000, T: 4 } },
      { name: "Iron above its Curie point", note: "At 1100 K iron has lost its domains: χ = C/(T − T_C) ≈ 3.3/57 ≈ 0.058, paramagnetic. Drag T below 1043 K and the domains snap back.", values: { mat: "fe", H: 1000, T: 1100 } },
    ] },
  { id: "wavepacket", title: "de Broglie wave packet & uncertainty", where: [["AHT-001", 4]], blurb: "A particle as a bundle of matter waves: crests run at the phase velocity, the packet at the group velocity (the particle's speed), and squeezing it in space spreads its momentum, Δx·Δp ≥ ħ/2.", topics: ["Wave nature of particles (de Broglie waves)", "Free-particle wave function and wave-packets", "Group velocity", "Phase velocity and their relation", "Uncertainty principle"], animated: true,
    presets: [
      { name: "PYQ: electron at 500 m/s ± 0.002 %", note: "Δp = mΔv = 9.11 × 10⁻³¹ × 0.01 = 9.11 × 10⁻³³ kg m/s, so Δx ≥ ħ/2Δp = 5.79 mm: a slow electron with a well-known speed cannot be pinned down.", values: { lgv: 2.69897, sp: 0.002, pt: "e", conv: "rel" } },
      { name: "Fast electron: v_p > c", note: "At v = 10⁸ m/s the crests race ahead at v_p = c²/v = 9 × 10⁸ m/s, three times light speed, yet v_p·v_g = c² and the packet (the electron) moves at v.", values: { lgv: 8, sp: 10, pt: "e", conv: "rel" } },
      { name: "Kinetic-energy convention", note: "With E = p²/2m, v_p = v/2: the crests drift backwards through the packet. Phase velocity depends on where you put the zero of energy; group velocity does not.", values: { lgv: 6, sp: 10, pt: "e", conv: "kin" } },
    ] },
  { id: "davisson", title: "Davisson–Germer electron diffraction", where: [["AHT-001", 4]], blurb: "Electrons fired at a nickel crystal come off strongly at 50°: a diffraction peak that proves λ = h/p. Change the voltage and swing the detector to find the orders.", topics: ["Wave nature of particles (de Broglie waves)", "de Broglie wavelength λ = h/p", "Davisson–Germer experiment"], animated: true,
    presets: [
      { name: "Classic: 54 V on nickel", note: "λ = 12.27/√54 = 1.67 Å; the rows of nickel atoms (d = 2.15 Å) send the first-order beam to sin φ = λ/d, φ ≈ 51° (measured: 50°).", values: { V: 54, d: 2.15, phi: 50 } },
      { name: "200 V: a second order", note: "λ = 0.867 Å: the first order moves in to 23.8° and a second order appears at 53.8°, where the detector is parked.", values: { V: 200, d: 2.15, phi: 53.8 } },
      { name: "Too slow to diffract", note: "At 25 V, λ = 2.45 Å is longer than d = 2.15 Å, so d sin φ = λ has no solution: only the straight-back zero order survives.", values: { V: 25, d: 2.15, phi: 50 } },
    ] },
  { id: "ekband", title: "E–k diagram: direct & indirect band gaps", where: [["AHT-001", 5], ["ECT-001", 1]], blurb: "Conduction and valence bands as 3-D surfaces over crystal momentum. In GaAs electrons drop straight down and shine; in silicon they need a phonon. Heat the crystal and watch E_g and nᵢ change.", topics: ["Momentum energy diagram for band gap explanation", "Direct and indirect band gap materials", "LED: construction and materials", "Forbidden energy gap"], animated: true,
    presets: [
      { name: "GaAs: direct gap, infrared LED", note: "E_g = 1.42 eV at 300 K with the conduction minimum right above the valence maximum: recombination emits 0.87 µm photons efficiently (IR LEDs, laser diodes).", values: { mat: "gaas", T: 300, E: 1.5 } },
      { name: "Silicon: why no Si LEDs", note: "E_g = 1.12 eV but the minimum sits at 0.85 of the way to the zone edge: the electron must shed ~1700 photon momenta via a phonon, so light emission is very weak and 1.5 eV light is absorbed only weakly.", values: { mat: "si", T: 300, E: 1.5 } },
      { name: "GaN: ultraviolet / blue LED", note: "E_g ≈ 3.39 eV gives λ = 1.24/3.39 = 0.365 µm. Alloyed with indium (InGaN) the gap narrows to make the blue LEDs behind white LED lamps.", values: { mat: "gan", T: 300, E: 3.5 } },
    ] },
];
