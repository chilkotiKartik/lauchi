import type { LabMeta } from "../types";

/** Engineering Physics (AHT-001) live labs. */
export const PHYSICS_LABS: LabMeta[] = [
  { id: "diffraction", title: "Diffraction by N slits", where: [["AHT-001", 1]], blurb: "Light through one slit or a grating of up to 10: the pattern on the screen, the intensity curve, missing orders and resolving power.", topics: ["Fraunhofer diffraction", "Single slit", "Diffraction grating", "Resolving power"], animated: false,
    presets: [
      { name: "Single slit", note: "N = 1, a = 2 µm, λ = 550 nm: a wide central maximum ends at the first minimum where a sin θ = λ, about 16°.", values: { N: 1, a: 2, nm: 550 } },
      { name: "Young's double slit", note: "Two slits, d/a = 4: fine fringes fill the single-slit envelope, and the 4th order falls exactly on an envelope minimum, so it is missing.", values: { N: 2, a: 1.5, d: 6, nm: 550 } },
      { name: "Diffraction grating", note: "Ten slits: the principal maxima at d sin θ = mλ get sharp (resolving power R = mN = 10 at m = 1) with weak subsidiary maxima between; order 3 is missing because d/a = 3.", values: { N: 10, a: 1, d: 3, nm: 600 } },
    ] },
  { id: "polarization", title: "Polarisation & wave plates", where: [["AHT-001", 2]], blurb: "Unpolarised light through a polariser, an optional wave plate and an analyser: Malus's law, circular light and the E-field helix.", topics: ["Malus's law", "Wave plates", "Circular polarisation", "Brewster angle"], animated: true,
    presets: [
      { name: "Malus's law at 60°", note: "Polariser then analyser at 60°: the fraction passed is cos² 60° = 0.25 of the polarised light, so I/I₀ = 0.125 of the original unpolarised beam.", values: { ang: 60, plate: "none" } },
      { name: "Circular light", note: "A quarter-wave plate with its fast axis at 45° to the polariser gives circular light: the E-vector traces a helix and every analyser angle passes the same I₀/4.", values: { plate: "quarter", fast: 45, ang: 0 } },
      { name: "Half-wave plate rotates E", note: "A half-wave plate with fast axis at 22.5° rotates the polarisation by 2 × 22.5° = 45°, so an analyser at 45° now passes all of the polariser's I₀/2.", values: { plate: "half", fast: 22.5, ang: 45 } },
    ] },
  { id: "fiber", title: "Optical fibre & total internal reflection", where: [["AHT-001", 2]], blurb: "Launch a light pulse into a step-index fibre and see it guided by total internal reflection or lost through the cladding.", topics: ["Total internal reflection", "Numerical aperture", "Acceptance angle", "Optical fibre"], animated: true,
    presets: [
      { name: "Guided ray", note: "n₁ = 1.50, n₂ = 1.45: NA ≈ 0.384, acceptance angle ≈ 22.6°. A 12° launch hits the wall beyond the critical angle (75.2°) every time and is guided.", values: { launch: 12, n1: 1.5, n2: 1.45 } },
      { name: "Beyond the acceptance angle", note: "Launch at 30°, past the 22.6° acceptance angle: at the wall the angle of incidence is below critical, so part of the light refracts into the cladding and the pulse is lost.", values: { launch: 30, n1: 1.5, n2: 1.45 } },
      { name: "Low-contrast fibre", note: "n₁ = 1.46, n₂ = 1.455 has NA ≈ 0.12 and acceptance only ≈ 6.9°: even a 10° launch escapes. Small Δ gives low modal dispersion but a narrow acceptance cone.", values: { launch: 10, n1: 1.46, n2: 1.455 } },
    ] },
  { id: "photoelectric", title: "Photoelectric effect", where: [["AHT-001", 4]], blurb: "Light on a metal plate: threshold wavelength, maximum kinetic energy and the retarding voltage that stops the photoelectrons.", topics: ["Photoelectric effect", "Work function", "Stopping potential", "Einstein's equation"], animated: true,
    presets: [
      { name: "Below threshold", note: "Sodium (φ = 2.28 eV, typical textbook value) in 600 nm light: hν = 2.07 eV is less than φ, so no electrons leave however intense the light.", values: { metal: "na", nm: 600, I: 100 } },
      { name: "Sodium in ultraviolet", note: "300 nm gives hν ≈ 4.13 eV, so K_max = hν − φ ≈ 1.85 eV and the stopping potential is about 1.85 V. More intensity means more electrons, not faster ones.", values: { metal: "na", nm: 300, V: 0 } },
      { name: "Beyond the stopping potential", note: "Caesium (φ = 2.1 eV) at 400 nm: K_max ≈ 1.0 eV. At a retarding 1.5 V (greater than V₀ ≈ 1.0 V) no electron reaches the collector.", values: { metal: "cs", nm: 400, V: 1.5 } },
    ] },
  { id: "compton", title: "Compton scattering", where: [["AHT-001", 4]], blurb: "An X-ray photon scatters off an electron: wavelength shift, scattered energy and the recoil angle of the electron.", topics: ["Compton effect", "Photon momentum", "Compton wavelength"], animated: true,
    presets: [
      { name: "Compton's 90° experiment", note: "Mo Kα X-rays (about 71 pm) scattered at 90°: Δλ = h/mₑc = 2.43 pm, so λ′ ≈ 73.4 pm.", values: { lam: 71, th: 90 } },
      { name: "Backscattering (180°)", note: "The largest shift, Δλ = 2h/mₑc = 4.85 pm. The electron recoils straight ahead (φ = 0) with the most energy it can take.", values: { lam: 20, th: 180 } },
      { name: "Hard γ-ray", note: "λ = 2 pm (620 keV) at 90°: the wavelength more than triples and the photon gives over half its energy to the electron.", values: { lam: 2, th: 90 } },
    ] },
  { id: "pnjunction", title: "P–N junction & energy bands", where: [["AHT-001", 5], ["ECT-001", 1]], blurb: "A silicon junction: depletion width, built-in potential, band bending and the Shockley current under forward and reverse bias.", topics: ["p–n junction", "Depletion region", "Built-in potential", "Energy bands", "Diode equation"], animated: true,
    presets: [
      { name: "Forward bias 0.6 V", note: "Bias opposes the built-in potential: the barrier drops to about 0.09 V, the depletion region narrows to about 0.16 µm and the Shockley current (Iₛ = 10 fA) is about 0.12 mA.", values: { logNa: 16, logNd: 16, V: 0.6 } },
      { name: "Reverse bias −5 V", note: "The barrier grows to about 5.7 V, the depletion region widens to about 1.2 µm and only the tiny saturation current −Iₛ flows.", values: { logNa: 16, logNd: 16, V: -5 } },
      { name: "Heavy p⁺, light n", note: "Nₐ = 10¹⁸, N_d = 10¹⁵: V_bi rises to about 0.75 V and the depletion region, about 1 µm wide, lies almost entirely on the lightly doped n side.", values: { logNa: 18, logNd: 15, V: 0 } },
    ] },
  { id: "hall", title: "Hall effect", where: [["AHT-001", 5]], blurb: "Current through a slab in a magnetic field: carriers pile up on one face and a Hall voltage appears; its sign gives the carrier type.", topics: ["Hall effect", "Hall coefficient", "Carrier density", "Drift velocity"], animated: true,
    presets: [
      { name: "n-type: electrons", note: "I = 10 mA, B = 0.5 T, n = 10²² m⁻³, t = 1 mm: V_H = IB/(nqt) ≈ 3.12 mV in magnitude; for electrons the Hall voltage and R_H are negative.", values: { type: "electron", logn: 22, I: 10, B: 0.5, t: 1 } },
      { name: "p-type: holes", note: "Same numbers but positive carriers: they are pushed to the same face, so the Hall voltage has the same size and the opposite sign (R_H > 0).", values: { type: "hole", logn: 22, I: 10, B: 0.5, t: 1 } },
      { name: "Copper (a metal)", note: "n ≈ 8.5 × 10²⁸ m⁻³ is so large that even with 50 mA, 2 T and a 0.1 mm slab V_H is only tens of nanovolts, which is why the Hall effect suits semiconductors.", values: { type: "electron", logn: 28.93, I: 50, B: 2, t: 0.1 } },
    ] },
];
