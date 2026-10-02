import type { LabMeta } from "../types";

/** The first 18 labs. */
export const CORE_LABS: LabMeta[] = [
  { id: "surface", title: "Surface, gradient & Lagrange", where: [["AHT-003", 1]], blurb: "Rotate z = f(x, y), drag a probe to see the gradient, find maxima, minima and saddles, then add a constraint.", topics: ["Partial derivatives", "Maxima and minima", "Lagrange multipliers"], animated: false,
    presets: [
      { name: "Saddle point", note: "Pick the saddle surface and put the probe at the origin: the gradient vanishes but it is neither a max nor a min.", values: { id: "saddle", px: 0, py: 0 } },
      { name: "Constrained maximum", note: "Turn on the circle constraint: the green and red dots are where f is largest and smallest on the circle, where the gradient is parallel to the constraint normal.", values: { id: "cubic", lagr: true, r: 1.2 } },
    ] },
  { id: "volume", title: "Volume under a surface", where: [["AHT-003", 2]], blurb: "Fill the volume with Riemann columns and watch the sum close in on the exact double integral.", topics: ["Double integrals", "Riemann sums"], animated: false,
    presets: [
      { name: "Coarse grid", note: "Only 2 × 2 columns: the error is large.", values: { n: 2 } },
      { name: "Fine grid", note: "Many columns: the Riemann sum is almost the exact integral.", values: { n: 24 } },
    ] },
  { id: "eigen", title: "Matrices & eigenvectors", where: [["AHT-003", 5]], blurb: "Change a 2×2 matrix and see the whole plane deform, with eigenvectors and eigenvalues.", topics: ["Linear transformations", "Eigenvalues"], animated: false,
    presets: [
      { name: "Pure rotation", note: "A = [[0, −1], [1, 0]] turns every vector: there are no real eigenvectors.", values: { a: 0, b: -1, c: 1, d: 0 } },
      { name: "Shear", note: "A = [[1, 1], [0, 1]] has one repeated eigenvalue 1 and a single eigen-direction.", values: { a: 1, b: 1, c: 0, d: 1 } },
      { name: "Symmetric stretch", note: "A symmetric matrix: the eigenvectors are perpendicular.", values: { a: 2, b: 1, c: 1, d: 2 } },
    ] },
  { id: "polar", title: "Polar curves & area", where: [["AHT-003", 2]], blurb: "Trace roses, cardioids and limaçons and read the enclosed area.", topics: ["Polar coordinates", "Area in polar form", "Curve tracing"], animated: true,
    presets: [
      { name: "Cardioid", note: "r = a(1 + cos θ): area 3πa²/2.", values: { a: 2, b: 2, k: 1 } },
      { name: "Four-petal rose", note: "r = a cos 2θ has 4 petals (even n gives 2n petals).", values: { a: 0, b: 2, k: 2 } },
    ] },
  { id: "fourier", title: "Fourier series", where: [["AHT-005", 3]], blurb: "Add harmonics one at a time and watch a square wave appear, including the Gibbs overshoot.", topics: ["Fourier series", "Harmonics", "Gibbs phenomenon"], animated: true,
    presets: [
      { name: "One harmonic", note: "Just the fundamental sine.", values: { n: 1 } },
      { name: "Gibbs overshoot", note: "Even with many terms the peak overshoots by about 9% near the jump.", values: { n: 40 } },
    ] },
  { id: "taylor", title: "Taylor polynomials", where: [["AHT-003", 1]], blurb: "Raise the degree and watch the polynomial hug sin x, eˣ or ln(1 + x); see where the series stops converging.", topics: ["Taylor series", "Maclaurin series", "Error of approximation"], animated: false,
    presets: [
      { name: "ln(1 + x) diverges", note: "Past x = 1 the ln(1 + x) series stops converging, however high the degree.", values: { id: "ln", n: 15, a: 0, x0: 1.5 } },
      { name: "sin x, degree 7", note: "A degree-7 polynomial is accurate far from 0.", values: { id: "sin", n: 7, a: 0, x0: 3 } },
    ] },
  { id: "projectile", title: "Projectile motion & drag", where: [["MET-001", 1]], blurb: "Launch a ball, change angle, gravity and air drag, and compare with the vacuum parabola.", topics: ["Laws of motion", "Projectile motion"], animated: true,
    presets: [
      { name: "45° in vacuum", note: "No drag: 45° gives the longest range.", values: { ang: 45, k: 0 } },
      { name: "Heavy drag", note: "With drag the best angle drops below 45° and the path is no longer symmetric.", values: { ang: 45, k: 0.4 } },
      { name: "On the Moon", note: "g = 1.62 m/s²: the same throw goes six times further.", values: { g: 1.62, k: 0 } },
    ] },
  { id: "field", title: "Electric field of charges", where: [["AHT-001", 3]], blurb: "Two point charges with live field lines and vector arrows.", topics: ["Electric field", "Field lines", "Gauss's law"], animated: true,
    presets: [
      { name: "Dipole", note: "Equal and opposite charges: lines leave + and end on −.", values: { q1: 1, q2: -1 } },
      { name: "Like charges", note: "Two + charges repel: a null point appears between them.", values: { q1: 1, q2: 1 } },
    ] },
  { id: "interference", title: "Wave interference", where: [["AHT-001", 1]], blurb: "Coherent sources on a live water surface; fringes move as you change λ and spacing.", topics: ["Interference", "Superposition", "Diffraction grating"], animated: true,
    presets: [
      { name: "Young's double slit", note: "Two sources: bright fringes where d sin θ = mλ.", values: { n: 2, lambda: 1, sep: 2 } },
      { name: "Grating-like", note: "Five sources: the maxima become sharp, like a diffraction grating.", values: { n: 5, lambda: 0.8, sep: 1.2 } },
    ] },
  { id: "emwave", title: "Electromagnetic wave", where: [["AHT-001", 3]], blurb: "E and B fields travelling together, with real frequency and photon energy.", topics: ["EM waves", "Maxwell's equations", "Photon energy"], animated: true,
    presets: [
      { name: "Red light", note: "700 nm: the lowest photon energy in the visible range, about 1.77 eV.", values: { nm: 700 } },
      { name: "Violet light", note: "400 nm: shorter wavelength, higher frequency and about 3.1 eV per photon.", values: { nm: 400 } },
      { name: "Vertically polarised", note: "Rotate the polarisation 90°: E and B turn together and stay perpendicular.", values: { pol: 90 } },
    ] },
  { id: "vsepr", title: "Molecular shapes (VSEPR)", where: [["AHT-002", 1]], blurb: "Choose electron domains and lone pairs and see the 3D molecule form.", topics: ["VSEPR theory", "Molecular geometry"], animated: true,
    presets: [
      { name: "Water (bent)", note: "4 domains, 2 lone pairs: bent, about 104.5°.", values: { dom: 4, lone: 2 } },
      { name: "Ammonia (pyramidal)", note: "4 domains, 1 lone pair: trigonal pyramidal, about 107°.", values: { dom: 4, lone: 1 } },
      { name: "SF₆ (octahedral)", note: "6 bonding domains, no lone pairs: 90° bonds.", values: { dom: 6, lone: 0 } },
    ] },
  { id: "rlc", title: "Series RLC & resonance", where: [["EET-001", 2]], blurb: "A rotating phasor diagram with live voltage and current waves; sweep frequency through resonance.", topics: ["AC circuits", "Impedance", "Resonance", "Power factor"], animated: true,
    presets: [
      { name: "At resonance", note: "f = f₀ ≈ 159 Hz: X_L = X_C, Z = R, current is maximum and the power factor is 1.", values: { R: 20, L: 100, C: 10, f: 159 } },
      { name: "Inductive (lagging)", note: "Above resonance the current lags the voltage.", values: { f: 400 } },
      { name: "Capacitive (leading)", note: "Below resonance the current leads the voltage.", values: { f: 60 } },
    ] },
  { id: "rectifier", title: "Rectifier & filter capacitor", where: [["ECT-001", 2]], blurb: "Half-wave and full-wave rectifying with a smoothing capacitor; watch ripple respond to the load.", topics: ["Diodes", "Rectifiers", "Ripple factor", "Capacitor filter"], animated: true,
    presets: [
      { name: "Half-wave only", note: "Only one half of each cycle gets through: ripple factor 1.21.", values: { mode: "half" } },
      { name: "Big capacitor", note: "2200 µF with a light load: almost pure DC.", values: { mode: "smooth", C: 2200, R: 2000 } },
      { name: "Heavy load", note: "A small load resistance drains the capacitor between peaks: ripple grows.", values: { mode: "smooth", C: 100, R: 50 } },
    ] },
  { id: "otto", title: "Otto engine cycle", where: [["MET-001", 5]], blurb: "P–V loop with a moving state point and piston; compression ratio and efficiency, live.", topics: ["Otto cycle", "Adiabatic processes", "Efficiency"], animated: true,
    presets: [
      { name: "Petrol engine", note: "r ≈ 10 with air: about 60% ideal efficiency.", values: { r: 10, g: 1.4 } },
      { name: "Low compression", note: "r = 5: efficiency falls to about 47%.", values: { r: 5, g: 1.4 } },
    ] },
  { id: "pendulum", title: "Damped pendulum", where: [["AHT-005", 2], ["MET-001", 1]], blurb: "Non-linear pendulum solved by RK4, with angle graph and measured versus small-angle period.", topics: ["Second-order ODEs", "Damping", "Simple harmonic motion"], animated: true,
    presets: [
      { name: "Small swing", note: "10°: the measured period matches 2π√(L/g).", values: { th0: 10, damp: 0 } },
      { name: "Huge swing", note: "160°: the real period is much longer than the formula.", values: { th0: 160, damp: 0 } },
      { name: "On the Moon", note: "g = 1.6 m/s²: the period is about 2.5× longer.", values: { g: 1.6 } },
    ] },
  { id: "rings", title: "Newton's rings", where: [["AHT-001", 1]], blurb: "Dark interference rings between a lens and a flat plate; vary wavelength and lens radius.", topics: ["Thin-film interference", "Newton's rings"], animated: false,
    presets: [
      { name: "Sodium light", note: "λ = 589 nm, the lab standard.", values: { nm: 589, R: 100 } },
      { name: "Blue light", note: "Shorter λ: the rings crowd closer together.", values: { nm: 450 } },
    ] },
  { id: "box", title: "Particle in a box", where: [["AHT-001", 4]], blurb: "Standing-wave wavefunctions, probability density and energy levels of a confined electron.", topics: ["Schrödinger equation", "Wavefunction", "Energy quantisation"], animated: true,
    presets: [
      { name: "Ground state", note: "n = 1: no nodes, the electron is most likely in the middle.", values: { n: 1 } },
      { name: "Quantum dot", note: "A 1 nm box: the n = 2 → 1 drop emits visible-ish light.", values: { n: 2, L: 1 } },
    ] },
  { id: "titration", title: "Acid–base titration", where: [["AHT-002", 2]], blurb: "Add base drop by drop, read the pH curve and equivalence point for strong and weak acids.", topics: ["Acids and bases", "pH", "Equivalence point"], animated: true,
    presets: [
      { name: "Strong acid at equivalence", note: "25 mL of base neutralises 25 mL of 0.1 M HCl: pH 7.", values: { kind: "strong", Vb: 25, Cb: 0.1 } },
      { name: "Weak acid half-way", note: "At half-equivalence pH = pKa ≈ 4.74 — the buffer region.", values: { kind: "weak", Vb: 12.5, Cb: 0.1 } },
      { name: "Weak acid at equivalence", note: "The salt hydrolyses, so the equivalence pH is above 7.", values: { kind: "weak", Vb: 25, Cb: 0.1 } },
    ] },
];
