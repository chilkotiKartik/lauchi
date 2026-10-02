import type { LabMeta } from "../types";

/** Analytical Mathematics (AHT-005, Maths II), units 1 to 5: ODEs, series and Fourier, PDEs, complex variables. */
const K = <T extends object>(base: T, over: Partial<T>): T => ({ ...base, ...over });

const EX = { x0: 1.2, y0: 1, eq: "q13b", mu: "one" };
const OR = { n: 2, c: 1, xi: 1.2 };
const CO = { t: 10, T0: 100, Ts: 30, k: 0.034, Tt: 60 };
const CL = { c: 1, kind: "parab", a: 1, b: 2 };
const VP = { s: 0.6, eq: "secx", c1: 0, c2: 0 };
const CE = { a: 1, b: -1, x: 1.5, c1: 1, c2: 0.5 };
const SY = { a: 0, b: 1, c: -1, d: 0, x0: 1, y0: 0, T: 4 };
const HR = { u: 0.4, fn: "x", kind: "sine", N: 6, L: 3.1416 };
const PA = { N: 5, fn: "x" };
const UC = { n: 5, fn: "xn", a: 0.9, eps: 0.1 };
const LP = { l: 1, m: 1, n: 1, mode: "rot", s0: 0.5, k: 0.3, h: 0.4, th: 60 };
const HT = { U: 100, mode: "steady", b: 1, m: 1, n: 1, a2: 0.2, t: 0.1, px: 0.5, py: 0.5 };
const DA = { t: 1, mode: "pulses", c: 1, w: 0.5, amp: 1, xp: 3 };
const HP = { A: 1, B: -3, C: 2, px: 0.4, py: -0.7 };
const HA = { px: 0.8, py: 0.6, fn: "cube" };
const CI = { ax: 0.5, ay: 0.3, R: 2, n: 0, fn: "ez" };
const RS = { n2: 1, n1: 0, n0: 0, p1: 1, p2: 2, p3: 3, R: 3.5, mode: "simple" };
const RI = { a: 3, b: 1, mode: "inv" };
const SG = { m: 3, fn: "ez", rho: 0.6 };

export const MATHII_LABS: LabMeta[] = [
  { id: "exactode", title: "Exact equations & integrating factors", where: [["AHT-005", 1]], blurb: "Test M dx + N dy = 0 for exactness with a live check of ∂M/∂y and ∂N/∂x, multiply by 1/x, 1/y or 1/(x²y²), and watch the potential surface φ(x, y) appear.", topics: ["Exact differential equations", "Integrating factors", "Reducible to exact equation"], animated: true,
    presets: [
      { name: "Q1.3(a) exact as given", note: "PYQ Q1.3(a): (5x⁴ + 3x²y² − 2xy³)dx + (2x³y − 3x²y² − 5y⁴)dy = 0 already has ∂M/∂y = ∂N/∂x = 6x²y − 6xy², and the solution is x⁵ + x³y² − x²y³ − y⁵ = c.", values: K(EX, { eq: "q13a", mu: "one" }) },
      { name: "Q1.3(b) factor 1/(x²y²)", note: "PYQ Q1.3(b): (x²y − 2xy²)dx − (x³ − 3x²y)dy is not exact; multiplying by 1/(x²y²) makes it exact and gives x/y − 2 ln x + 3 ln y = c. Try the other factors and see them fail.", values: K(EX, { eq: "q13b", mu: "x2y2" }) },
      { name: "Q1.3(d) factor 1/y⁴", note: "PYQ Q1.3(d): (2xy⁴eʸ + 2xy³ + y)dx + (x²y⁴eʸ − x²y² − 3x)dy = 0 becomes exact on dividing by y⁴: x²eʸ + x²/y + x/y³ = c.", values: K(EX, { eq: "q13d", mu: "y4" }) },
    ] },
  { id: "orthotraj", title: "Orthogonal trajectories", where: [["AHT-005", 1]], blurb: "Draw the family y = c xⁿ and the curves that cut it at exactly 90°; the slope product at the meeting point is always −1.", topics: ["Orthogonal trajectories", "First order ODEs", "Geometrical applications"], animated: true,
    presets: [
      { name: "Parabolas y = c x²", note: "n = 2: the differential equation is y′ = 2y/x, so the orthogonal family has y′ = −x/(2y), i.e. the ellipses x² + 2y² = k. Check that the slopes multiply to −1.", values: OR },
      { name: "Lines y = c x", note: "n = 1: orthogonal trajectories are the circles x² + y² = k. The angle readout stays at 90° wherever you move the meeting point.", values: K(OR, { n: 1 }) },
      { name: "Hyperbolas xy = c", note: "n = −1: the family is rectangular hyperbolas xy = c and its orthogonal trajectories are x² − y² = k.", values: K(OR, { n: -1, c: 1.5 }) },
    ] },
  { id: "cooling", title: "Newton's law of cooling", where: [["AHT-005", 1]], blurb: "A hot body in a cooler room obeys dT/dt = −k(T − Ts): watch the exponential curve, the half-excess time and the time to reach any target temperature.", topics: ["Newton's law of cooling", "Growth and decay", "Variable separable form"], animated: true,
    presets: [
      { name: "100 °C to 80 °C in 10 min", note: "Textbook model: a body at 100 °C falls to 80 °C in 10 minutes in a 30 °C room, so k = ln(70/50)/10 ≈ 0.034 per min. Read the temperature at 20 min (about 65.7 °C) and the time to reach 60 °C.", values: CO },
      { name: "Hot coffee 90 °C", note: "T0 = 90 °C in a 20 °C room with k = 0.1 per min: half of the excess 70 °C is gone after ln 2 / k ≈ 6.9 min. Drag the target to 40 °C.", values: K(CO, { t: 7, T0: 90, Ts: 20, k: 0.1, Tt: 40 }) },
      { name: "Warming from below", note: "A cold body at 20 °C placed in a 40 °C oven has T0 below Ts: the same equation gives an exponential rise to Ts, never beyond it.", values: K(CO, { t: 15, T0: 20, Ts: 40, k: 0.08, Tt: 35 }) },
    ] },
  { id: "clairaut", title: "Clairaut's equation & singular solution", where: [["AHT-005", 1]], blurb: "Roll the straight line y = cx + f(c) around its envelope: the general solution is a family of tangents and the singular solution is the curve they wrap.", topics: ["Clairaut's type", "Equations not of first degree", "Singular solution"], animated: true,
    presets: [
      { name: "y = px + a p²", note: "General solution y = cx + a c²; eliminating p from x + 2ap = 0 gives the singular solution x² = −4ay, a parabola touched by every line.", values: CL },
      { name: "PYQ y = px + a/p", note: "PYQ Q1.8: the lines y = cx + a/c are tangent to the parabola y² = 4ax. Slide c and see the intercept a/c change while the gold line stays tangent.", values: K(CL, { c: 2, kind: "inv" }) },
      { name: "Ellipse envelope", note: "y = px + √(a²p² + b²): the general solution is the line family and the singular solution is the ellipse x²/a² + y²/b² = 1.", values: K(CL, { c: 0.5, kind: "ellipse", a: 2, b: 1 }) },
    ] },
  { id: "varparam", title: "Variation of parameters", where: [["AHT-005", 2]], blurb: "Build the particular integral yp = u₁y₁ + u₂y₂ from the Wronskian and see the residual prove that it solves y″ + ay′ + by = R(x).", topics: ["Method of variation of parameters", "Complementary functions and particular integrals", "Wronskian"], animated: true,
    presets: [
      { name: "Q2.1 y″ + y = sec x", note: "PYQ Q2.1 (asked seven times): y1 = cos x, y2 = sin x, W = 1, giving yp = cos x ln cos x + x sin x. Slide x and read the Wronskian and the zero residual.", values: VP },
      { name: "Q2.1 y″ − 3y′ + 2y = eˣ/(1+eˣ)", note: "PYQ Q2.1: roots 1 and 2, W = e³ˣ. The integrals of y2R/W and y1R/W give logarithmic terms; the solution is yc + yp.", values: K(VP, { s: 0.5, eq: "q21a" }) },
      { name: "Q2.1 y″ − 6y′ + 9y = e³ˣ/x²", note: "PYQ Q2.1: repeated root 3, y1 = e³ˣ, y2 = x e³ˣ and W = e⁶ˣ. Add c1 and c2 to see the complete solution y = yc + yp.", values: K(VP, { s: 0.5, eq: "q21b", c1: 1, c2: 0.5 }) },
    ] },
  { id: "cauchyeuler", title: "Cauchy-Euler equation", where: [["AHT-005", 2]], blurb: "For x²y″ + a x y′ + b y = 0 the substitution y = xᵐ gives m(m−1) + am + b = 0; watch real, repeated and complex roots change the solution curves.", topics: ["Cauchy-Euler equation", "Linear equations with variable coefficients", "Auxiliary equation"], animated: true,
    presets: [
      { name: "Real roots: x²y″ + xy′ − y", note: "m² − 1 = 0 gives m = ±1, so y = c1 x + c2 / x. The residual readout confirms that the closed form satisfies the equation.", values: CE },
      { name: "Q2.4 complex: x²y″ − 3xy′ + 5y", note: "PYQ Q2.4: m² − 4m + 5 = 0 gives m = 2 ± i, so y = x²[c1 cos(ln x) + c2 sin(ln x)]. The curve oscillates in ln x.", values: K(CE, { a: -3, b: 5 }) },
      { name: "Repeated root: x²y″ − 3xy′ + 4y", note: "m² − 4m + 4 = 0 gives m = 2 twice, so y = x²(c1 + c2 ln x).", values: K(CE, { a: -3, b: 4 }) },
    ] },
  { id: "coupledode", title: "Simultaneous linear ODEs", where: [["AHT-005", 2]], blurb: "Solve x′ = ax + by, y′ = cx + dy: eigenvalues, the (x, y) phase portrait and the two curves x(t), y(t) in 3D, with node, saddle, spiral and centre cases.", topics: ["Simultaneous linear differential equations", "Eigenvalues", "Phase portrait"], animated: true,
    presets: [
      { name: "Spring (centre)", note: "x′ = y, y′ = −x has eigenvalues ±i, trace 0 and determinant 1: closed circles, a pure oscillation.", values: SY },
      { name: "PYQ Q2.3 spiral (scaled)", note: "PYQ Q2.3: dx/dt = 7x − y, dy/dt = 2x + 5y has τ = 12, Δ = 37 and λ = 6 ± i, an unstable spiral. The sliders stop at 3, so this uses the matrix divided by 3: same type, slower growth.", values: K(SY, { a: 2.3, b: -0.3, c: 0.7, d: 1.7, x0: 0.5, y0: 0.5, T: 3 }) },
      { name: "Saddle", note: "x′ = x + 2y, y′ = 2x + y has eigenvalues 3 and −1 with Δ < 0: orbits approach along one eigenvector and leave along the other.", values: K(SY, { a: 1, b: 2, c: 2, d: 1, x0: 0.5, y0: 0.2, T: 2 }) },
    ] },
  { id: "halfrange", title: "Half-range Fourier series", where: [["AHT-005", 3]], blurb: "Extend f(x) on (0, L) as an odd or an even function and watch the sine or cosine partial sum converge, with the Gibbs overshoot at jumps.", topics: ["Half range sine and cosine series", "Fourier series", "Dirichlet conditions"], animated: true,
    presets: [
      { name: "Sine series of f(x) = x", note: "PYQ Q3.5: on (0, π) the sine series has bₙ = 2(−1)ⁿ⁺¹/n. The odd extension jumps at x = π so the sum goes to 0 there and shows a Gibbs overshoot.", values: HR },
      { name: "Cosine series of x²", note: "PYQ Q3.5: a₀ = 2π²/3 and aₙ = 4(−1)ⁿ/n². The even extension is continuous, so convergence is fast and there is no overshoot.", values: K(HR, { fn: "xsq", kind: "cosine", N: 8 }) },
      { name: "Cosine series of |cos x|", note: "PYQ Q3.5: |cos x| on (0, π) has the cosine series 2/π + (4/π) Σ (−1)ⁿ⁺¹ cos 2nx / (4n² − 1); only even harmonics appear.", values: K(HR, { fn: "abscos", kind: "cosine", N: 10 }) },
    ] },
  { id: "parseval", title: "Parseval's theorem", where: [["AHT-005", 3]], blurb: "The energy of the first N harmonics adds up to (1/π)∫f² and deduces famous sums such as Σ1/n² = π²/6.", topics: ["Parseval's theorem", "Fourier series", "Deduction of series sums"], animated: true,
    presets: [
      { name: "f(x) = x gives π²/6", note: "PYQ Q3.3: bₙ = 2(−1)ⁿ⁺¹/n, so Parseval gives 4Σ1/n² = 2π²/3, i.e. Σ1/n² = π²/6. Raise N and watch the estimate close in.", values: PA },
      { name: "f(x) = x² gives π⁴/90", note: "PYQ Q3.5: x² on (−π, π) has a₀ = 2π²/3, aₙ = 4(−1)ⁿ/n². Parseval yields Σ1/n⁴ = π⁴/90, converging very fast.", values: K(PA, { N: 6, fn: "xsq" }) },
      { name: "Square wave gives π²/8", note: "The square wave has bₙ = 4/(nπ) for odd n, so Parseval gives Σ over odd n of 1/n² = π²/8.", values: K(PA, { N: 8, fn: "sq" }) },
    ] },
  { id: "uniformconv", title: "Pointwise vs uniform convergence", where: [["AHT-005", 3]], blurb: "See the sequence xⁿ or the series Σ sin kx / k² flatten under an ε-tube, and the Weierstrass M-test bound the error.", topics: ["Uniform convergence", "Weierstrass M-test", "Sequences and series of functions"], animated: true,
    presets: [
      { name: "xⁿ on [0, 0.9]", note: "sup |xⁿ − 0| = 0.9ⁿ → 0, so the convergence is uniform on [0, a] for a < 1. The readout gives the n needed to fit inside the ε-tube.", values: UC },
      { name: "xⁿ on [0, 1] is not uniform", note: "At a = 1 the limit jumps from 0 to 1 at x = 1 and sup |xⁿ − f| stays 1 for every n: pointwise but not uniform.", values: K(UC, { n: 20, a: 1 }) },
      { name: "M-test: Σ sin kx / k²", note: "Since |sin kx / k²| ≤ 1/k² and Σ1/k² converges, the Weierstrass M-test gives uniform convergence; the real error stays under the tail of Σ1/k².", values: K(UC, { n: 8, fn: "sinsum" }) },
    ] },
  { id: "lagrangepde", title: "Lagrange linear PDE: characteristics", where: [["AHT-005", 4]], blurb: "Solve Pp + Qq = R by following the characteristic curves dx/P = dy/Q = dz/R and build the solution surface from a seed curve.", topics: ["Lagrange's linear equation", "Auxiliary equations", "Formation of partial differential equations"], animated: true,
    presets: [
      { name: "Q4.2 rotation about (1, 1, 1)", note: "PYQ Q4.2: (mz − ny)p + (nx − lz)q = ly − mx has integrals lx + my + nz = c1 and x² + y² + z² = c2, so the characteristics are circles about the axis (l, m, n).", values: LP },
      { name: "Rotation about the z axis", note: "With (l, m, n) = (0, 0, 1) the equation is −y p + x q = 0: horizontal circles, the surface of revolution z = f(x² + y²).", values: K(LP, { l: 0, m: 0, n: 1 }) },
      { name: "Cone x p + y q = z", note: "dx/x = dy/y = dz/z gives the integrals y/x = c1 and z/x = c2: straight rays through the origin, so every solution surface is a cone.", values: K(LP, { mode: "cone", s0: 0.8, th: 120 }) },
    ] },
  { id: "heat2d", title: "Two-dimensional heat on a plate", where: [["AHT-005", 4]], blurb: "A rectangular plate with three edges at 0 and one at U: steady-state Laplace temperature, decaying single modes, and a cooling plate with Fourier series.", topics: ["Heat conduction equations of two dimension", "Laplace equation", "Method of separation of variables"], animated: true,
    presets: [
      { name: "Steady state, top edge hot", note: "u_xx + u_yy = 0 with the top edge at U and the other edges at 0: u = Σ bₙ sin(nπx) sinh(nπy)/sinh(nπb). The centre of a square plate is U/4 by symmetry.", values: HT },
      { name: "Decay of the (1, 1) mode", note: "u = sin(πx) sin(πy/b) e^(−λt) with λ = α²π²(m² + n²/b²): for a square plate the rate is 2α²π². Higher modes die faster.", values: K(HT, { mode: "decay", t: 0.3 }) },
      { name: "Cooling plate", note: "A plate at U with all edges held at 0 cools from the edges inward; at late times only the fundamental mode is left.", values: K(HT, { mode: "cool", t: 0.2 }) },
    ] },
  { id: "dalembert", title: "d'Alembert's wave solution", where: [["AHT-005", 4]], blurb: "u = ½[f(x − ct) + f(x + ct)]: a pulse splits into two travelling halves, a plucked string reflects at its ends, and a hammer blow leaves a plateau.", topics: ["One-dimensional wave equation", "d'Alembert's solution", "Classification of partial differential equations"], animated: true,
    presets: [
      { name: "Pulse splits in two", note: "A pulse released at rest splits into two halves of height amp/2 travelling left and right at speed c. The wave equation is hyperbolic: B² − 4AC = 4c² > 0.", values: DA },
      { name: "Plucked string", note: "Fixed ends reflect the waves with a sign change; the motion repeats with period 2L/c and the string is inverted at half a period.", values: K(DA, { t: 2, mode: "string", xp: 1.5 }) },
      { name: "Hammer blow", note: "Starting from zero displacement with an initial velocity, the string rises to a plateau of height amp·w/c that spreads outward.", values: K(DA, { t: 2, mode: "hammer" }) },
    ] },
  { id: "homopde", title: "Homogeneous linear PDE & classification", where: [["AHT-005", 4]], blurb: "A z_xx + B z_xy + C z_yy = 0: find the roots m of the auxiliary equation, read off z = f(y + m₁x) + g(y + m₂x) and classify it as hyperbolic, parabolic or elliptic.", topics: ["Homogeneous linear partial differential equation with constant coefficients", "Classification of partial differential equations", "Complementary function"], animated: true,
    presets: [
      { name: "Q4.4 D² − 3DD′ + 2D′²", note: "PYQ Q4.4: m² − 3m + 2 = 0 gives m = 1, 2 (hyperbolic, B² − 4AC = 1), so z = f1(y + x) + f2(y + 2x).", values: HP },
      { name: "Q4.1 r + s − 6t = 0", note: "PYQ Q4.1 runs backwards: z = f1(y + 2x) + f2(y − 3x) comes from m² + m − 6 = 0, i.e. the equation z_xx + z_xy − 6z_yy = 0.", values: K(HP, { B: 1, C: -6 }) },
      { name: "Double root D² − 6DD′ + 9D′²", note: "Equal roots m = 3 (parabolic, B² − 4AC = 0): z = f1(y + 3x) + x f2(y + 3x). Try B = 0, C = 1 for Laplace (elliptic, complex roots).", values: K(HP, { B: -6, C: 9 }) },
    ] },
  { id: "harmonic", title: "Harmonic functions & conjugates", where: [["AHT-005", 5]], blurb: "Check ∇²u = 0 and the Cauchy-Riemann equations on a live surface, find the conjugate v and the analytic function f(z) = u + iv.", topics: ["Analytic functions", "Harmonic conjugate", "Cauchy-Riemann equations"], animated: true,
    presets: [
      { name: "u = x³ − 3xy² (f = z³)", note: "PYQ Q5.1: u_xx + u_yy = 6x − 6x = 0, v = 3x²y − y³ and f(z) = z³. The gradients of u and v are perpendicular.", values: HA },
      { name: "u = ½ log(x² + y²) (f = log z)", note: "PYQ Q5.1: harmonic away from the origin; the conjugate is v = arctan(y/x) and f(z) = log z.", values: K(HA, { px: 1, py: 0.5, fn: "logr" }) },
      { name: "u = x² + y² is not harmonic", note: "∇²u = 4 ≠ 0, so no analytic function has this real part: the Cauchy-Riemann equations cannot be satisfied.", values: K(HA, { fn: "notharm" }) },
    ] },
  { id: "cauchyint", title: "Cauchy's integral formula", where: [["AHT-005", 5]], blurb: "Slide a pole a across a circular contour and watch ∮ f(z)/(z − a)ⁿ⁺¹ dz jump between 2πi f⁽ⁿ⁾(a)/n! and zero.", topics: ["Cauchy integral formula", "Cauchy-Goursat theorem", "Complex integration"], animated: true,
    presets: [
      { name: "∮ eᶻ/(z − a) dz inside", note: "a = 0.5 + 0.3i lies inside |z| = 2, so the integral/2πi equals e^a ≈ 1.575 + 0.487i (Cauchy integral formula).", values: CI },
      { name: "sin z / (z − a)² (derivative)", note: "With n = 1 the formula gives f′(a) = cos a: the integral of sin z/(z − a)² divided by 2πi is cos a.", values: K(CI, { n: 1, fn: "sinz" }) },
      { name: "Pole outside: Cauchy-Goursat", note: "Move a to 2.5: it is outside |z| = 2, the integrand is analytic inside the contour, and the integral is 0.", values: K(CI, { ax: 2.5, ay: 0, R: 2 }) },
    ] },
  { id: "residues", title: "Residue theorem", where: [["AHT-005", 5]], blurb: "Poles on a landscape and a circular contour: ∮ f dz = 2πi Σ Res of the poles inside, computed by formula and checked by numerical integration.", topics: ["Poles and residues", "Residue theorem", "Singular points"], animated: true,
    presets: [
      { name: "Q5.5 three simple poles", note: "PYQ Q5.5: z²/((z−1)(z−2)(z−3)) on |z| = 3.5 has residues 1/2, −4 and 9/2; their sum is 1 so ∮ = 2πi. Shrink R to 2.5 and 1.5 to drop poles out.", values: RS },
      { name: "Q5.5 double pole", note: "PYQ Q5.5: z²/((z−1)²(z+2)) on |z| = 3: residue 5/9 at the double pole z = 1 and 4/9 at z = −2, again summing to 1.", values: K(RS, { p1: 1, p2: -2, R: 3, mode: "double" }) },
      { name: "Only z = 1 inside", note: "With R = 1.5 only the pole at z = 1 is inside, so ∮ = 2πi times its residue 1/2 = πi.", values: K(RS, { R: 1.5 }) },
    ] },
  { id: "realintegral", title: "Real integrals by residues", where: [["AHT-005", 5]], blurb: "Turn ∫₀^2π F(cos θ, sin θ) dθ into a contour integral on |z| = 1 with z = e^(iθ), find the one pole inside and match the numeric integral.", topics: ["Application of residue theorem for evaluation of real integral", "Residue theorem", "Unit circle contour"], animated: true,
    presets: [
      { name: "∫ dθ/(3 + cos θ) = π/√2", note: "PYQ: with z = e^(iθ) the poles of 1/(3 + cos θ) solve z² + 6z + 1 = 0; only z = −3 + 2√2 lies inside |z| = 1, giving 2π/√(a² − b²) = π/√2 ≈ 2.221.", values: RI },
      { name: "∫ cos 2θ/(5 + 4cos θ) = π/6", note: "PYQ: the pole inside is z = −1/2 and the answer is π/6. Use the cos 2θ integrand with a = 5, b = 4.", values: K(RI, { a: 5, b: 4, mode: "cos2" }) },
      { name: "∫ sin²θ/(5 − 4cos θ) = π/4", note: "PYQ: the pole inside is z = 1/2; the integral is π/4. Check that the numeric sum agrees.", values: K(RI, { a: 5, b: -4, mode: "sin2" }) },
    ] },
  { id: "singular", title: "Singularities & Laurent series", where: [["AHT-005", 5]], blurb: "Classify the singular point at 0 as removable, a pole of order m or essential, read the Laurent coefficients as bars and find the residue a₋₁.", topics: ["Singular points", "Poles and residues", "Laurent series"], animated: true,
    presets: [
      { name: "sin z / z⁴: pole of order 3", note: "sin z = z − z³/6 + … so sin z / z⁴ = z⁻³ − z⁻¹/6 + …: a pole of order 3 with residue −1/6.", values: K(SG, { m: 4, fn: "sinz" }) },
      { name: "eᶻ / z³: residue 1/2", note: "eᶻ/z³ = z⁻³ + z⁻² + z⁻¹/2 + …: pole of order 3, residue 1/2. The numeric ∮ f dz / 2πi agrees for every radius ρ.", values: SG },
      { name: "z² e^(1/z): essential", note: "Infinitely many negative powers: an essential singularity. The residue is the coefficient of z⁻¹, which is 1/3! = 1/6.", values: K(SG, { m: 2, fn: "essen" }) },
    ] },
];
