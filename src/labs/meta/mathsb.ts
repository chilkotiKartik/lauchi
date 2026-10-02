import type { LabMeta } from "../types";

/** Analytical Mathematics (AHT-005), units 1 to 5. */
export const MATHSB_LABS: LabMeta[] = [
  { id: "slopefield", title: "Slope fields & first-order ODEs", where: [["AHT-005", 1], ["AHT-000", 5]], blurb: "See dy/dx = f(x, y) as a field of tiny tangents and watch the RK4 solution flow through any starting point.", topics: ["First-order ODEs", "Variable separable", "Linear equations", "Exact equations", "Bernoulli's equation", "Runge–Kutta method"], animated: true,
    presets: [
      { name: "Linear: y′ = x + y", note: "Through (0, 0) the solution is y = eˣ − x − 1 (integrating factor e⁻ˣ). At x₁ = 1 it equals e − 2 ≈ 0.7183, and RK4 agrees to about 6 decimals.", values: { id: "linear", x0: 0, y0: 0, x1: 1 } },
      { name: "Logistic S-curve", note: "y′ = y(1 − y) has equilibria y = 0 (unstable) and y = 1 (stable). Start at y₀ = 0.1 and the curve rises like an S towards 1; it is a Bernoulli equation (substitute v = 1/y).", values: { id: "logistic", x0: -2, y0: 0.1, x1: 2 } },
      { name: "Exact: circles", note: "y′ = −x/y is x dx + y dy = 0, an exact equation with solution x² + y² = c. Through (0, 2) the curve is a circle of radius 2; the RK4 path stops where the tangent turns vertical at x = ±2.", values: { id: "circle", x0: 0, y0: 2, x1: 1.5 } },
    ] },
  { id: "oscillator", title: "Forced spring–mass oscillator", where: [["AHT-005", 2]], blurb: "A mass on a coil spring obeying m y″ + c y′ + k y = F₀ cos ωt, with characteristic roots, damping type and resonance.", topics: ["Second-order linear ODEs", "Characteristic equation", "Complementary function", "Particular integral", "Resonance"], animated: true,
    presets: [
      { name: "Resonance", note: "ω = ω₀ = 2 rad/s with light damping c = 0.2: the particular-integral amplitude F₀/(cω) = 2.5 is 2.5 times the static deflection F₀/k, and the phase lag is 90°.", values: { m: 1, c: 0.2, k: 4, F0: 1, w: 2 } },
      { name: "Critical damping", note: "c = 2√(km) = 4 gives a double root r = −2 and ζ = 1: y = (A + Bt)e⁻²ᵗ returns to rest fastest without oscillating (no forcing here).", values: { m: 1, c: 4, k: 4, F0: 0, w: 1.5 } },
      { name: "Over-damped", note: "c = 8 gives two distinct negative real roots (−0.54 and −7.46) and ζ = 2: the mass creeps back to rest without ever crossing zero.", values: { m: 1, c: 8, k: 4, F0: 0, w: 1.5 } },
    ] },
  { id: "series", title: "Series & convergence tests", where: [["AHT-005", 3]], blurb: "Terms as 3D bars, partial sums as a rising line, and the limit plane they approach (or fail to reach).", topics: ["Infinite series", "Ratio test", "p-series", "Alternating series", "Geometric series"], animated: true,
    presets: [
      { name: "Harmonic series diverges", note: "p = 1: Σ 1/n has terms that go to 0, yet S_N ≈ ln N + 0.577 grows without bound (p-series test). The ratio test gives L = 1 and cannot decide.", values: { id: "pseries", p: 1, N: 60 } },
      { name: "Basel problem", note: "p = 2: Σ 1/n² converges to π²/6 ≈ 1.6449, but slowly: after N terms the error is about 1/N.", values: { id: "pseries", p: 2, N: 40 } },
      { name: "Alternating harmonic", note: "Σ (−1)ⁿ⁺¹/n converges to ln 2 ≈ 0.6931 by Leibniz's test, only conditionally: the absolute series is the divergent harmonic series.", values: { id: "altharm", N: 60 } },
    ] },
  { id: "string", title: "Vibrating string & heat flow", where: [["AHT-005", 4]], blurb: "Separation of variables for the 1-D wave and heat equations: a plucked string as a sum of sine modes.", topics: ["Wave equation", "Heat equation", "Separation of variables", "Fourier sine series"], animated: true,
    presets: [
      { name: "Plucked at the middle", note: "Plucking at p = L/2 gives bₙ = 8h(−1)^((n−1)/2)/(n²π²) for odd n and zero for even n: b₁ = 8h/π² ≈ 0.405h and only odd harmonics sound.", values: { mode: "wave", p: 0.5, h: 0.5, N: 25 } },
      { name: "Plucked near the end", note: "Plucking at p = 0.1L excites many harmonics with slowly falling bₙ (about 1/n²), so the shape needs many modes and the sound is bright.", values: { mode: "wave", p: 0.1, h: 0.5, N: 40 } },
      { name: "Heat decay", note: "Same initial shape, but mode n now decays like e^(−(nπ/L)²αt): high modes vanish first, the profile smooths to a single sine and the first mode halves in ln 2 / ((π/L)²α).", values: { mode: "heat", p: 0.3, h: 0.5, N: 30, alpha: 0.05 } },
    ] },
  { id: "complexmap", title: "Conformal maps & Cauchy–Riemann", where: [["AHT-005", 5]], blurb: "Watch a z-plane grid map to the w-plane; angles stay right angles where f′(z) ≠ 0, and the Cauchy–Riemann equations hold.", topics: ["Analytic functions", "Cauchy–Riemann equations", "Conformal mapping", "Möbius transformation", "Residues"], animated: true,
    presets: [
      { name: "z² doubles angles at 0", note: "w = z² at z = 1 + i gives w = 2i, |f′| = 2√2 ≈ 2.83 and a rotation of 45°. The grid maps to orthogonal parabolas; only at z = 0, where f′ = 0, is conformality lost.", values: { id: "sq", px: 1, py: 1 } },
      { name: "Inversion 1/z", note: "w = 1/z swaps inside and outside the unit circle and turns lines into circles. It has a simple pole at 0 with residue 1. At z = 0.5 + 0.5i, w = 1 − i.", values: { id: "inv", px: 0.5, py: 0.5 } },
      { name: "Möbius: half-plane to disc", note: "w = (z − i)/(z + i) sends the real axis to the unit circle and the upper half-plane to the unit disc: z = i goes to w = 0, with f′(i) = −i/2. Its pole at z = −i has residue −2i.", values: { id: "mobius", px: 0, py: 1 } },
    ] },
];
