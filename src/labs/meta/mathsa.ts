import type { LabMeta } from "../types";

export const MATHSA_LABS: LabMeta[] = [
  { id: "revolution", title: "Solids of revolution", where: [["AHT-003", 3]], blurb: "Spin the region under x², √x, sin x or a line about the x-axis and watch a 3D solid form, with its exact volume and surface area.", topics: ["Volumes of revolution", "Surface area of revolution", "Centroid", "Pappus's theorem"], animated: true,
    presets: [
      { name: "Cone from a line", note: "y = x/2 on [0, 4] turns into a cone of radius r = 2 and height h = 4: V = πr²h/3 = 16π/3 ≈ 16.755 and curved area πrl = 4√5 π ≈ 28.099.", values: { fn: "line", a: 0, b: 4, sweep: 360 } },
      { name: "Paraboloid", note: "y = √x on [0, 4]: V = π∫x dx = 8π ≈ 25.133 — exactly half of the cylinder πr²h = 16π that encloses it.", values: { fn: "sqrt", a: 0, b: 4, sweep: 360 } },
      { name: "sin x on [0, π], cut open", note: "V = π∫sin²x dx = π²/2 ≈ 4.935. Only 270° is swept so you can look inside the hollow shell.", values: { fn: "sin", a: 0, b: Math.PI, sweep: 270 } },
    ] },
  { id: "vectorfield", title: "Vector fields & Green's theorem", where: [["AHT-003", 4]], blurb: "Arrows and flowing tracers for rotation, source, shear and saddle fields; measure divergence, curl, circulation and flux round a probe circle.", topics: ["Vector fields", "Divergence and curl", "Line integrals", "Green's theorem"], animated: true,
    presets: [
      { name: "Pure rotation", note: "F = (−y, x) has curl 2 everywhere, so ∮F·dr = 2 × area = 2π for the unit circle, and zero flux.", values: { field: "rotation", r: 1, px: 0, py: 0, fence: "tan" } },
      { name: "Shear hides a curl", note: "F = (y, 0) flows in straight lines yet has curl −1: the top of the circle is pushed harder than the bottom, so ∮F·dr = −πr² anywhere you put it.", values: { field: "shear", r: 1, px: 0.5, py: 0.5, fence: "tan" } },
      { name: "Limit cycle, zero flux", note: "Tracers settle onto the unit circle. The divergence 2 − 4r² is positive inside and negative outside, and through r = 1 the net flux is exactly 0.", values: { field: "cycle", r: 1, px: 0, py: 0, fence: "norm" } },
    ] },
  { id: "mvt", title: "Mean value theorem", where: [["AHT-003", 1]], blurb: "Draw the chord from a to b and find every point c where the tangent is parallel to it — Rolle's and Lagrange's theorems live.", topics: ["Rolle's theorem", "Lagrange's mean value theorem", "Tangents"], animated: true,
    presets: [
      { name: "Rolle: x³ − 3x on [−√3, √3]", note: "f(−√3) = f(√3) = 0, so the chord is flat and Rolle guarantees f′(c) = 0: here c = ±1, the turning points.", values: { fn: "cubic", a: -Math.sqrt(3), b: Math.sqrt(3) } },
      { name: "Rolle: sin x on [0, π]", note: "sin 0 = sin π = 0, and the tangent is horizontal at the top, c = π/2.", values: { fn: "sin", a: 0, b: Math.PI } },
      { name: "x² on [0, 2]", note: "Chord slope (4 − 0)/2 = 2 and f′(c) = 2c = 2 gives c = 1. For any parabola, c is the midpoint of [a, b].", values: { fn: "x2", a: 0, b: 2 } },
    ] },
  { id: "calculus", title: "Derivative & area under a curve", where: [["AHT-000", 3], ["AHT-000", 4]], blurb: "Shrink h and watch the secant turn into the tangent; add Riemann rectangles and watch the sum close in on the exact integral.", topics: ["Derivative from first principles", "Tangent line", "Riemann sums", "Definite integral"], animated: true,
    presets: [
      { name: "Tangent from first principles", note: "For x² at x₀ = 1 the quotient is exactly 2 + h: with h = 0.01 it reads 2.01, and it reaches f′(1) = 2 as h → 0.", values: { fn: "x2", x0: 1, h: 0.01 } },
      { name: "Midpoint rule on sin x", note: "∫₀^π sin x dx = 2. With only 4 strips the midpoint sum is 2.052; switch to left or right to see a worse 1.896.", values: { fn: "sin", a: 0, b: Math.PI, n: 4, rule: "mid", x0: 1.5 } },
      { name: "Area under 1/x is ln", note: "∫₁^e dx/x = ln e = 1. Right-end rectangles sit under the falling curve, so the sum is too small.", values: { fn: "inv", a: 1, b: Math.E, n: 10, rule: "right", x0: 2, h: 0.2 } },
    ] },
  { id: "lines", title: "Straight lines", where: [["AHT-000", 1]], blurb: "Two lines on a coordinate grid: slope, distance, midpoint, angle between them, intersection and parallel/perpendicular tests.", topics: ["Slope of a line", "Distance and section formula", "Angle between two lines", "Point of intersection"], animated: true,
    presets: [
      { name: "Perpendicular lines", note: "Line 1 has slope 1/2 and line 2 has slope −2: m₁m₂ = −1, so 1 + m₁m₂ = 0 and tan θ is infinite — θ = 90°.", values: { x1: -2, y1: -1, x2: 2, y2: 1, m: -2, c: 1 } },
      { name: "Parallel lines", note: "Equal slopes (1/2) and different intercepts never meet. Their gap is |c₁ − c₂|/√(1 + m²) = 1.5/√1.25 ≈ 1.342.", values: { x1: -3, y1: -1, x2: 3, y2: 2, m: 0.5, c: 2 } },
      { name: "Vertical line", note: "x₁ = x₂ makes line 1 vertical: its slope is undefined, yet it still meets the horizontal line y = 1 at 90°.", values: { x1: 2, y1: -3, x2: 2, y2: 3, m: 0, c: 1 } },
    ] },
];
