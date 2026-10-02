import type { LabMeta } from "../types";

/** Maths I (AHT-003) labs, units 1 to 5. Presets reproduce numericals from the previous-year papers. */
export const MATHI_LABS: LabMeta[] = [
  { id: "taylor2var", title: "Taylor series in two variables", where: [["AHT-003", 1]], blurb: "Lay the Taylor polynomial of f(x, y) over the true surface, raise the degree and watch the error bar shrink.", topics: ["Taylor's theorem for function of two variables", "Partial differentiation"], animated: false,
    presets: [
      { name: "PYQ: eˣ sin y, degree 3", note: "PYQ: expand e^x sin y about the origin up to third-degree terms: y + xy + x²y/2 − y³/6. The gold polynomial hugs the true surface near (0, 0).", values: { fn: "exsiny", n: 3, x: 0.5, y: 0.4 } },
      { name: "PYQ: eˣ log(1 + y)", note: "PYQ: expand e^x log(1 + y) in powers of x and y. Six terms are exactly the terms up to degree 3. Push y towards −1 and the fit fails.", values: { fn: "exlog", n: 3, x: 0.6, y: 0.5 } },
      { name: "sin x cos y, degree 5", note: "A higher degree keeps the polynomial accurate much farther from the origin.", values: { fn: "sinxcosy", n: 5, x: 1.2, y: 0.9 } },
    ] },
  { id: "partialeuler", title: "Euler's theorem on homogeneous functions", where: [["AHT-003", 1]], blurb: "Slide a point along a ray and watch x fx + y fy equal n f exactly when f is homogeneous of degree n.", topics: ["Partial differentiation", "Euler's theorem (homogeneous degree n)"], animated: true,
    presets: [
      { name: "x² + xy + y² (degree 2)", note: "x fx + y fy = 2f at every point: the two readouts agree.", values: { fn: "h2", px: 1.5, py: 1, t: 1.5 } },
      { name: "(x − y)/(x + y) (degree 0)", note: "PYQ type: for a degree-0 function x fx + y fy = 0; f is constant along every ray from the origin.", values: { fn: "zero", px: 1.5, py: 1, t: 2 } },
      { name: "x² + y³ is not homogeneous", note: "Not homogeneous, so Euler's relation fails: the two sides differ.", values: { fn: "nonh", px: 1.5, py: 1, t: 1.5 } },
    ] },
  { id: "lagrangemult", title: "Lagrange multipliers in 3D", where: [["AHT-003", 1]], blurb: "Inflate a level sphere until it just touches the constraint plane or sphere: that tangent point is the constrained extremum.", topics: ["Method of Lagrange's multipliers", "Maxima and minima (three variables)"], animated: true,
    presets: [
      { name: "PYQ: min x² + y² + z² on x + 2y + 2z = 9", note: "PYQ: minimum of x² + y² + z² subject to ax + by + cz = p. Distance 3, so the minimum is 9 at (1, 2, 2). Grow r until the sphere turns green.", values: { mode: "plane", a: 1, b: 2, c: 2, p: 9, R: 2, r: 3 } },
      { name: "PYQ: distance of (1, 2, −1) from x² + y² + z² = 24", note: "PYQ: maximum and minimum distance of a point from a sphere. They lie on the line through the origin and P at |P| ± R.", values: { mode: "sphere", a: 1, b: 2, c: -1, p: 9, R: 4.899, r: 2 } },
    ] },
  { id: "reverseorder", title: "Change the order of integration", where: [["AHT-003", 2]], blurb: "Cut the same region into vertical or horizontal strips; the answer does not change, but the work might.", topics: ["Change of the order of integration", "Multiple integral: double integral"], animated: true,
    presets: [
      { name: "PYQ: ∫∫ sin y / y over 0 ≤ x ≤ y ≤ π", note: "PYQ: sin y / y has no elementary antiderivative in y. Switch to dx dy order and the integral is just ∫ sin y dy = 2.", values: { id: "sin", order: "dxdy", n: 20 } },
      { name: "PYQ: x² ≤ y ≤ 2 − x", note: "PYQ: the region between a parabola and a line. The other order needs two pieces (y ≤ 1 and y ≥ 1).", values: { id: "pyq", order: "dydx", n: 16 } },
      { name: "∫∫ e^(y²) over the triangle 0 ≤ x ≤ y ≤ 1", note: "Another integrand that is only integrable in one order.", values: { id: "exp", order: "dxdy", n: 20 } },
    ] },
  { id: "betagamma", title: "Beta and Gamma functions", where: [["AHT-003", 2]], blurb: "See B(m, n) as the area under x^(m−1)(1 − x)^(n−1) and as Γ(m)Γ(n)/Γ(m + n); turn sin and cos powers into Beta.", topics: ["Beta function and its properties", "Gamma function and its properties"], animated: false,
    presets: [
      { name: "B(½, ½) = π", note: "Γ(½)² / Γ(1) = π, so Γ(½) = √π.", values: { view: "beta", m: 0.5, n: 0.5 } },
      { name: "PYQ: ∫₀^(2π) sin⁴θ cos²θ dθ", note: "PYQ: use ½ B((p+1)/2, (q+1)/2) with p = 4, q = 2, i.e. m = 2.5, n = 1.5, then multiply by 4 quarter-periods: π/8.", values: { view: "sincos", m: 2.5, n: 1.5 } },
      { name: "B(2, 3) = 1/12", note: "Integer arguments give factorials: 1!2!/4! = 1/12.", values: { view: "beta", m: 2, n: 3 } },
    ] },
  { id: "curvetrace", title: "Curve tracing", where: [["AHT-003", 2]], blurb: "Draw strophoid, folium, cissoid and astroid with their asymptotes, tangents at the origin and loop areas.", topics: ["Curve tracing"], animated: true,
    presets: [
      { name: "PYQ: y²(a − x) = x²(a + x)", note: "PYQ: strophoid. Symmetric about the x-axis, node at the origin with tangents y = ±x, asymptote x = a, loop area a²(2 − π/2).", values: { curve: "strophoid", a: 1.5, show: 1 } },
      { name: "Folium x³ + y³ = 3axy", note: "Loop in the first quadrant (area 3a²/2) and the asymptote x + y + a = 0.", values: { curve: "folium", a: 1.5, show: 1 } },
      { name: "Astroid x^(2/3) + y^(2/3) = a^(2/3)", note: "Four cusps, symmetric about both axes. Drag tracing progress to watch the branches appear.", values: { curve: "astroid", a: 1.5, show: 0.6 } },
    ] },
  { id: "jacobian", title: "Jacobian and change of variables", where: [["AHT-003", 3], ["AHT-003", 2]], blurb: "A tiny uv rectangle is bent into its xy image; the area ratio is exactly |J|.", topics: ["Jacobians", "Change of variables"], animated: true,
    presets: [
      { name: "Polar: J = r", note: "x = u cos v, y = u sin v gives J = u, the r in r dr dθ.", values: { map: "polar", u0: 1.5, v0: 0.8, du: 0.4, dv: 0.4 } },
      { name: "PYQ: x = u, y = uv", note: "PYQ: a standard substitution with J = u. The image of a rectangle is a curved quadrilateral.", values: { map: "ux", u0: 1.5, v0: 0.8, du: 0.3, dv: 0.3 } },
      { name: "Linear: x = u + v, y = u − v", note: "J = −2 everywhere, so areas double and the image is an exact parallelogram.", values: { map: "shear", u0: 1.5, v0: 0.8, du: 0.4, dv: 0.4 } },
    ] },
  { id: "errorapprox", title: "Approximation of error", where: [["AHT-003", 3]], blurb: "Put percentage errors on measured quantities and see how they propagate into area, volume or resistance.", topics: ["Approximation of error", "Partial differentiation"], animated: false,
    presets: [
      { name: "PYQ: three resistors in parallel", note: "PYQ: r₁ = 20 Ω, r₂ = 30 Ω, r₃ = 60 Ω in parallel (r = 10 Ω), each 1.2 % in error: r is also 1.2 % off.", values: { fn: "par", x: 20, y: 30, z: 60, ex: 1.2, ey: 1.2, ez: 1.2 } },
      { name: "Cylinder volume", note: "V = πr²h: a 1 % error in r counts twice, so it dominates a 1 % error in h.", values: { fn: "cyl", x: 5, y: 12, z: 60, ex: 1, ey: 1, ez: 1 } },
      { name: "Box with one bad measurement", note: "Only the length is off by 5 %; read the largest contributor.", values: { fn: "box", x: 20, y: 30, z: 60, ex: 5, ey: 0, ez: 0 } },
    ] },
  { id: "centroid", title: "Centre of mass of a lamina", where: [["AHT-003", 3]], blurb: "A plate of varying density tips about a pivot you place; find the point where it balances.", topics: ["Centre of mass", "Centre of gravity"], animated: true,
    presets: [
      { name: "PYQ: triangle with ρ = 1 + x + y", note: "PYQ: triangle (0,0), (2,0), (2,4): M = 44/3 and centre (16/11, 18/11) ≈ (1.455, 1.636). Put the pivot there and the plate sits level.", values: { shape: "tri", rho: "lin", px: 1.455, py: 1.636 } },
      { name: "Uniform semicircle", note: "Radius 2: ȳ = 4r/3π ≈ 0.849 above the diameter.", values: { shape: "semi", rho: "uniform", px: 0, py: 0.849 } },
      { name: "Uniform triangle", note: "Centroid of (0,0), (2,0), (2,4): (4/3, 4/3).", values: { shape: "tri", rho: "uniform", px: 1.333, py: 1.333 } },
    ] },
  { id: "revcurves", title: "Revolution of parametric curves", where: [["AHT-003", 3]], blurb: "Spin an astroid, a cycloid arch or a loop about the x-axis and read the exact volume and surface area.", topics: ["Applications of definite integrals to evaluate volumes of revolution", "Applications of definite integrals to evaluate surface areas of revolution"], animated: true,
    presets: [
      { name: "PYQ: astroid about the x-axis", note: "PYQ: x = a cos³t, y = a sin³t. V = 32πa³/105 and S = 12πa²/5.", values: { curve: "astroid", a: 1, sweep: 360 } },
      { name: "One arch of the cycloid", note: "V = 5π²a³ and S = 64πa²/3.", values: { curve: "cycloid", a: 1, sweep: 360 } },
      { name: "PYQ: loop of y² = x²(x + 4)", note: "PYQ: the loop revolved about the x-axis gives V = 64π/3 ≈ 67.02.", values: { curve: "loop", a: 1, sweep: 360 } },
    ] },
  { id: "gradient", title: "Gradient and directional derivative", where: [["AHT-003", 4]], blurb: "A cloud of values with the gradient arrow, the tangent plane and a direction you choose: the derivative is the shadow of the gradient.", topics: ["Gradient", "Geometrical meaning of gradient", "Directional derivative"], animated: false,
    presets: [
      { name: "PYQ: φ = x²yz + 4xz² at (1, −2, 1)", note: "PYQ: direction 2i − j − 2k. ∇φ = (0, 1, 6) and the derivative is −13/3 ≈ −4.33.", values: { phi: "f1", px: 1, py: -2, pz: 1, dx: 2, dy: -1, dz: -2 } },
      { name: "Steepest ascent", note: "Point the direction along the gradient (0, 1, 6): the angle is 0° and the derivative reaches |∇φ|.", values: { phi: "f1", px: 1, py: -2, pz: 1, dx: 0, dy: 1, dz: 3 } },
    ] },
  { id: "divcurl3d", title: "Divergence and curl", where: [["AHT-003", 4]], blurb: "A paddle wheel spins with the curl and a bubble pulses with the divergence of a vector field at the point you choose.", topics: ["Divergence and curl", "Scalar and vector point function"], animated: true,
    presets: [
      { name: "PYQ: (y + z, z + x, x + y)", note: "PYQ: both solenoidal and irrotational: the sphere does not pulse and the wheel does not turn.", values: { field: "mix", px: 1, py: 1, pz: 1 } },
      { name: "(−y, x, 0): pure rotation", note: "Curl 2k, divergence 0: a fast spinning wheel.", values: { field: "rot", px: 1, py: 1, pz: 1 } },
      { name: "r⃗: a source", note: "Divergence 3 and curl 0: the sphere pulses, the wheel is still.", values: { field: "radial", px: 1, py: 1, pz: 1 } },
    ] },
  { id: "lineintegral", title: "Line integrals and work", where: [["AHT-003", 4]], blurb: "Walk a path through a force field and see the work accumulate; conservative fields do not care about the path.", topics: ["Line integral", "Green theorem (without proof)"], animated: true,
    presets: [
      { name: "Conservative F = (2xy, x²)", note: "F = ∇(x²y): the work depends only on the end points, so it is the same for every path exponent k and zero round a loop.", values: { field: "cons", bx: 1, by: 1, k: 2, loop: false } },
      { name: "Rotational F = (−y, x), round trip", note: "The round trip equals the curl times the enclosed area (Green's theorem). Tick the loop to see the region.", values: { field: "rot", bx: 1, by: 1, k: 2, loop: true } },
    ] },
  { id: "gaussflux", title: "Gauss divergence theorem", where: [["AHT-003", 4]], blurb: "Add up the flux through the six faces of a box and compare with the triple integral of the divergence.", topics: ["Surface integral", "Volume integral", "Gauss divergence theorem (without proof)"], animated: true,
    presets: [
      { name: "PYQ: F = 4xz i − y² j + yz k, unit cube", note: "PYQ: ∇·F = 4z − y, so the volume integral and the six face fluxes both give 3/2.", values: { field: "pyq1", a: 1, b: 1, c: 1 } },
      { name: "F = (x, y, z) on a box", note: "Divergence 3, so the flux is 3abc, three times the volume.", values: { field: "rad", a: 1, b: 2, c: 1 } },
      { name: "Constant field", note: "Divergence 0: what enters leaves, the net flux is 0.", values: { field: "const", a: 1, b: 1, c: 1 } },
    ] },
  { id: "stokesloop", title: "Stokes theorem", where: [["AHT-003", 4]], blurb: "Circulation round a tilted rectangle equals the flux of the curl through it, whatever the tilt.", topics: ["Stokes theorem (without proof)", "Line integral", "Surface integral"], animated: true,
    presets: [
      { name: "PYQ: (x² + y²)i − 2xy j, rectangle", note: "PYQ: round x = ±a, y = 0 to b. For a = 1, b = 2: ∇×F = −4y k and both sides give −4ab² = −16.", values: { field: "pyq1", a: 1, b: 2, tilt: 0 } },
      { name: "Same loop, tilted 40°", note: "The same loop in 3D: the circulation changes with the tilt but the surface integral follows it exactly.", values: { field: "pyq1", a: 1, b: 2, tilt: 40 } },
      { name: "Gradient field", note: "curl(grad φ) = 0, so the circulation is zero for every tilt.", values: { field: "grad", a: 1, b: 2, tilt: 30 } },
    ] },
  { id: "planes3", title: "Linear systems as three planes", where: [["AHT-003", 5]], blurb: "Each equation is a plane: they meet in a point, a line, or not at all depending on λ and μ.", topics: ["Consistency of system of linear equations", "Rank of a matrix", "Solution of simultaneous linear equations by elementary transformations"], animated: true,
    presets: [
      { name: "PYQ: λ = 6, μ = 26 (infinitely many)", note: "PYQ: x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + λz = μ. At λ = 6, μ = 26 the three planes share a line.", values: { sys: "pyq2", lam: 6, mu: 26 } },
      { name: "PYQ: λ = 6, μ = 20 (no solution)", note: "Same system, μ ≠ 26: the planes cross pairwise in a triangular prism and never meet together.", values: { sys: "pyq2", lam: 6, mu: 20 } },
      { name: "Unique solution (λ ≠ 6)", note: "λ = 8: the determinant is non-zero, so there is a single point.", values: { sys: "pyq2", lam: 8, mu: 26 } },
    ] },
  { id: "rowreduce", title: "Rank by row reduction", where: [["AHT-003", 5]], blurb: "Step through Gauss and Gauss-Jordan elimination and watch a matrix drawn in bars flatten into echelon form.", topics: ["Rank of a matrix", "Solution of simultaneous linear equations by elementary transformations", "Consistency of system of linear equations"], animated: true,
    presets: [
      { name: "PYQ: rank of a 4×4 matrix", note: "PYQ Q5.1: [1 2 3 0; 2 4 3 2; 3 2 1 3; 6 8 7 5] has rank 3: one zero row appears at the end.", values: { mat: "rk1", mode: "echelon", step: 30 } },
      { name: "PYQ: system with a free variable", note: "x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + 6z = 26: rank A = rank [A|B] = 2 < 3, so infinitely many solutions.", values: { mat: "sys2", mode: "echelon", step: 30 } },
      { name: "Inconsistent system", note: "Change the last right side to 20: the last row becomes 0 0 0 | −6, rank A ≠ rank [A|B].", values: { mat: "sys3", mode: "echelon", step: 30 } },
    ] },
  { id: "caleyham", title: "Cayley-Hamilton theorem", where: [["AHT-003", 5], ["BCA-011", 1]], blurb: "The terms of the characteristic polynomial, evaluated at A, add up to the zero matrix: use it to find the inverse and high powers.", topics: ["Cayley-Hamilton theorem and its applications to find inverse", "Eigen values and Eigen vectors"], animated: true,
    presets: [
      { name: "PYQ: 3×3 inverse by Cayley-Hamilton", note: "PYQ: A = [2 −1 1; −1 2 −1; 1 −1 2] has λ³ − 6λ² + 9λ − 4 = 0 and A⁻¹ = ¼[3 1 −1; 1 3 1; −1 1 3].", values: { mat: "m33a", k: 3, a: 2, b: 1, c: 1, d: 3 } },
      { name: "2×2: A² − 4A − 5I = 0", note: "A = [1 4; 2 3]: trace 4, determinant −5, so A⁻¹ = (A − 4I)/5 = (1/5)[−3 4; 2 −1]. Check it with the readout.", values: { mat: "m22b", k: 4, a: 2, b: 1, c: 1, d: 3 } },
      { name: "Singular matrix: no inverse", note: "[1 2; 2 4] has |A| = 0: the theorem still holds but there is no inverse.", values: { mat: "m22a", k: 2, a: 2, b: 1, c: 1, d: 3 } },
    ] },
  { id: "diagonalize", title: "Diagonalisation and powers of a matrix", where: [["AHT-003", 5]], blurb: "See how A^n squeezes the unit circle onto the dominant eigenvector, and why P D^n P⁻¹ is a shortcut.", topics: ["Diagonalization of matrices", "Eigen values and Eigen vectors"], animated: true,
    presets: [
      { name: "A = [4 1; 2 3], A⁴", note: "Eigenvalues 5 and 2 (trace 7, determinant 10). A⁴ = P D⁴ P⁻¹ with D⁴ = diag(625, 16).", values: { a: 4, b: 1, c: 2, d: 3, n: 4, ang: 30 } },
      { name: "Symmetric: orthogonal eigenvectors", note: "A = [2 1; 1 2] has eigenvalues 3, 1 and perpendicular eigenvectors.", values: { a: 2, b: 1, c: 1, d: 2, n: 3, ang: 30 } },
      { name: "Defective matrix", note: "[2 1; 0 2]: repeated eigenvalue but only one eigenvector, so it cannot be diagonalised.", values: { a: 2, b: 1, c: 0, d: 2, n: 3, ang: 30 } },
    ] },
  { id: "eigen3d", title: "Eigenvalues of a 3×3 matrix", where: [["AHT-003", 5]], blurb: "A 3×3 matrix stretches a sphere into an ellipsoid; the eigenvectors are the axes that do not turn.", topics: ["Eigen values and Eigen vectors", "Matrix and their types and properties"], animated: true,
    presets: [
      { name: "PYQ: [−2 5 4; 5 7 5; 4 5 −2]", note: "PYQ: eigenvalues 12, −3, −6 (trace 3, determinant 216). Symmetric, so the three axes are perpendicular.", values: { mat: "sym1", k: 1, t: 1 } },
      { name: "Repeated eigenvalue 2, 2, 8", note: "[6 −2 2; −2 3 −1; 2 −1 3]: a repeated root, yet three independent eigenvectors (the orange ring is the eigen-plane).", values: { mat: "sym2", k: 1, t: 1 } },
      { name: "Triangular matrix", note: "[3 1 4; 0 2 6; 0 0 5]: the eigenvalues are the diagonal entries 3, 2, 5.", values: { mat: "tri", k: 1, t: 1 } },
    ] },
];
