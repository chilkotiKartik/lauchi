import type { Equipment, Experiment, Question, Step } from "./types";

/**
 * Guided experiments for eleven Maths I (AHT-003) labs. Every numeric answer is recomputed from src/labs/sim/mathi.ts in mathi.test.ts.
 */

type Opt = { hint?: string; scenario?: string; formulas?: string[]; commonMistake?: string; marks?: number };
const mcq = (id: string, prompt: string, options: string[], answer: number, solution: string[], explanation: string, o: Opt = {}): Question => ({ id, type: "mcq", prompt, options, answer, solution, explanation, marks: o.marks ?? 2, ...o });
const tf = (id: string, prompt: string, answer: boolean, solution: string[], explanation: string, o: Opt = {}): Question => ({ id, type: "tf", prompt, answer, solution, explanation, marks: o.marks ?? 1, ...o });
const nq = (id: string, prompt: string, answer: number, tolerance: number, solution: string[], explanation: string, o: Opt & { unit?: string } = {}): Question => ({ id, type: "numeric", prompt, answer, tolerance, solution, explanation, marks: o.marks ?? 3, ...o });
const st = (id: string, title: string, text: string, check: Step["check"], hint?: string): Step => ({ id, title, text, check, hint });
const eq = (name: string, what: string, where?: string): Equipment => ({ name, what, where });
const RESET = st("reset", "Reset the bench", "Press Reset to return every value to its start.", { kind: "reset" });

const lagrangemult: Experiment = {
  labId: "lagrangemult",
  title: "Constrained minimum by the method of Lagrange multipliers",
  aim: "To find the minimum of x² + y² + z² on a plane and the nearest and farthest points of a sphere from a point, and to see that the extremum is where a level surface just touches the constraint.",
  objectives: ["Write F = f + λφ and solve F<sub>x</sub> = F<sub>y</sub> = F<sub>z</sub> = 0 with φ = 0.", "Interpret the multiplier geometrically: the gradients of f and φ are parallel at the extremum.", "Find the nearest and farthest points of a sphere from an outside point."],
  equipment: [eq("Constraint plane", "The plane ax + by + cz = p.", "Centre of the stage"), eq("Level sphere", "The surface x² + y² + z² = r², which grows with the r slider and turns green when it just touches.", "Around the origin"), eq("Purple constraint sphere", "In the second problem, the sphere x² + y² + z² = R² with the point P outside it.", "Second problem")],
  steps: [
    st("s1", "Load the PYQ", "Press the preset 'PYQ: min x² + y² + z² on x + 2y + 2z = 9'. The plane is at distance 9/3 = 3 from the origin.", { kind: "preset", name: "PYQ: min x² + y² + z² on x + 2y + 2z = 9" }),
    st("s2", "Grow the level sphere", "Drag the level sphere radius r up to 3 or more. It first touches the plane at r = 3 and then cuts a circle out of it.", { kind: "param", key: "r", op: "gte", value: 3 }, "Slider 'Level sphere radius r'."),
    st("s3", "Move the plane away", "Raise the constant p to 18 or more. The plane is now twice as far, so the minimum should be four times larger.", { kind: "param", key: "p", op: "gte", value: 18 }),
    st("s4", "Switch to the sphere problem", "Choose 'Distance from a point to a sphere'. P = (a, b, c) is now a point and the sphere has radius R.", { kind: "param", key: "mode", op: "eq", value: "sphere" }),
    st("s5", "Enlarge the sphere", "Raise R to 4.8 or more so that P sits just inside it: the nearest point swaps to the far side.", { kind: "param", key: "R", op: "gte", value: 4.8 }),
    RESET,
  ],
  questions: [
    mcq("lagrangemult-q1", "At a constrained extremum of f(x, y, z) subject to φ = 0, what is true about the gradients?", ["∇f is perpendicular to ∇φ", "∇f is parallel to ∇φ", "∇f = 0", "∇φ = 0"], 1, ["Moving along the constraint changes f by ∇f · dr = 0 for every dr tangent to the surface.", "So ∇f is normal to the surface, like ∇φ.", "Hence ∇f = −λ∇φ."], "The level surface of f touches the constraint surface, so they share a normal line.", { formulas: ["∇f + λ∇φ = 0"], commonMistake: "Thinking the gradients are perpendicular, which would mean f is changing along the constraint." }),
    nq("lagrangemult-q2", "Find the minimum value of x² + y² + z² subject to x + 2y + 2z = 18.", 36, 0.01, ["F = x² + y² + z² + λ(x + 2y + 2z − 18).", "2x + λ = 0, 2y + 2λ = 0, 2z + 2λ = 0 gives (x, y, z) = (−λ/2, −λ, −λ).", "Plug in: −λ/2 − 2λ − 2λ = 18 gives λ = −4, point (2, 4, 4), value 4 + 16 + 16 = 36."], "The minimum is the squared distance p²/(a² + b² + c²) = 324/9 = 36.", { scenario: "Doubling p from 9 to 18 in the first problem moves the plane twice as far from the origin." }),
    nq("lagrangemult-q3", "For the first plane x + 2y + 2z = 9, what is the value of the multiplier λ in F = f + λ(x + 2y + 2z − 9)?", -2, 0.01, ["Stationary point is (1, 2, 2) from −λ/2 = 1.", "Hence λ = −2.", "Check: 2x + λ = 2 − 2 = 0."], "The sign depends on how you write the constraint; magnitude 2 is |∇f| / |∇φ| = 6/3."),
    nq("lagrangemult-q4", "PYQ: find the maximum distance of the point (1, 2, −1) from the sphere x² + y² + z² = 24.", 7.348, 0.01, ["The distance of P from the origin is √6 ≈ 2.449.", "The sphere has radius R = √24 ≈ 4.899.", "The farthest point lies on the opposite side of the origin: |P| + R = √6 + 2√6 = 3√6 ≈ 7.348."], "The extremes lie on the line through the origin and P."),
    nq("lagrangemult-q5", "Same sphere and point: what is the shortest distance?", 2.449, 0.01, ["P is inside the sphere because |P| = √6 < √24.", "The nearest point is straight out from P: R − |P|.", "That is 2√6 − √6 = √6 ≈ 2.449."], "Inside a sphere the nearest and farthest points are on opposite sides of P.", { commonMistake: "Subtracting in the wrong order and getting a negative distance." }),
    tf("lagrangemult-q6", "When the level sphere is larger than the distance from the origin to the plane, it cuts the plane in a circle.", true, ["Touching happens at r = distance.", "Any larger r means the sphere crosses the plane.", "The cut circle has radius √(r² − d²)."], "At the minimum the circle shrinks to a single point."),
  ],
  summary: ["The method of Lagrange multipliers finds constrained extrema from ∇f = −λ∇φ and φ = 0.", "Geometrically the level surface of f grows until it just touches the constraint.", "Distance problems reduce to minimising or maximising the square of the distance."],
};

const taylor2var: Experiment = {
  labId: "taylor2var",
  title: "Taylor polynomials of two variables",
  aim: "To expand a function of two variables about the origin up to a chosen degree and to see how the polynomial error depends on the degree and on the distance from the origin.",
  objectives: ["Write the Taylor expansion up to third-degree terms for e<sup>x</sup> sin y.", "Count the non-zero terms of a total-degree-n polynomial.", "Judge where the approximation is good."],
  equipment: [eq("True surface", "The graph of f(x, y).", "Blue-green surface"), eq("Gold polynomial surface", "The Taylor polynomial of the chosen degree.", "Overlaid"), eq("Red error bar", "Vertical bar between the two surfaces at the chosen point.", "At (x, y)")],
  steps: [
    st("s1", "Load the PYQ", "Press 'PYQ: eˣ sin y, degree 3'. The terms read y + xy + x²y/2 − y³/6.", { kind: "preset", name: "PYQ: eˣ sin y, degree 3" }),
    st("s2", "Raise the degree", "Set the degree to 5 or more and watch the polynomial settle onto the true surface.", { kind: "param", key: "n", op: "gte", value: 5 }),
    st("s3", "Go far from the origin", "Move the point so that x is at least 1.2. The error bar grows with distance.", { kind: "param", key: "x", op: "gte", value: 1.2 }),
    st("s4", "Try the logarithm", "Choose e<sup>x</sup> log(1 + y).", { kind: "param", key: "fn", op: "eq", value: "exlog" }),
    st("s5", "Try sin x cos y", "Choose sin x cos y and compare the number of non-zero terms.", { kind: "param", key: "fn", op: "eq", value: "sinxcosy" }),
    RESET,
  ],
  questions: [
    mcq("taylor2var-q1", "Which polynomial is the expansion of e<sup>x</sup> sin y up to third-degree terms?", ["y + xy + x²y/2 − y³/6", "1 + x + y + xy", "x + y + x²/2 + y²/2", "y − y³/6"], 0, ["e^x = 1 + x + x²/2 + …, sin y = y − y³/6 + …", "Multiply and keep total degree ≤ 3: y + xy + x²y/2 − y³/6.", "No other terms of degree ≤ 3 appear."], "Multiply the two one-variable series.", { formulas: ["f(x, y) = Σ f_{x^i y^j}(0,0) x^i y^j / (i! j!)"], commonMistake: "Forgetting that sin y has no constant term." }),
    nq("taylor2var-q2", "Evaluate the third-degree polynomial of e<sup>x</sup> sin y at (x, y) = (0.5, 0.4).", 0.6393, 0.0005, ["y = 0.4, xy = 0.2, x²y/2 = 0.05, −y³/6 = −0.010667.", "Sum: 0.4 + 0.2 + 0.05 − 0.010667.", "= 0.639333."], "The true value is 0.64204, so the error is −0.0027.", { scenario: "Open the PYQ preset. The point is (0.5, 0.4) and the degree is 3." }),
    nq("taylor2var-q3", "What is the error (polynomial minus true value) at the same point for degree 1?", -0.2420, 0.001, ["Degree 1 keeps only y = 0.4.", "True value e^0.5 sin 0.4 = 0.64204.", "0.4 − 0.64204 = −0.24204."], "A low degree leaves a large error even close to the origin."),
    nq("taylor2var-q4", "How many non-zero terms does the third-degree polynomial of e<sup>x</sup> sin y have?", 4, 0, ["Terms: y, xy, x²y/2 and −y³/6.", "Count them.", "The simulator also reports the same number."], "Zero coefficients are dropped."),
    tf("taylor2var-q5", "Raising the degree always reduces the error at a point inside the convergence region.", true, ["Each higher degree adds correction terms.", "For eˣ sin y the series converges everywhere.", "So the polynomial approaches the true value."], "For e^x log(1 + y) it only holds for |y| < 1."),
    mcq("taylor2var-q6", "For e<sup>x</sup> log(1 + y), where does the double series fail to converge?", ["x < 0", "y ≥ 1 or y ≤ −1", "Nowhere", "x > 1"], 1, ["log(1 + y) = y − y²/2 + … converges for −1 < y ≤ 1.", "The factor e^x is entire.", "So the restriction is on y."], "Push y towards −1 in the lab to see the polynomial fail."),
  ],
  summary: ["Taylor's theorem for two variables expands f about a point using partial derivatives.", "A total-degree-n polynomial contains the terms x^i y^j with i + j ≤ n.", "The fit is best near the point of expansion and within the convergence region."],
};

const reverseorder: Experiment = {
  labId: "reverseorder",
  title: "Changing the order of integration",
  aim: "To evaluate a double integral that is impossible in one order by switching to the other, and to see the strip sums approach the exact value.",
  objectives: ["Sketch the region from its limits and re-describe it with the roles of x and y swapped.", "Evaluate ∫∫ (sin y)/y dy dx by changing order.", "Compare the strip-sum approximation with the exact value."],
  equipment: [eq("Region", "The domain of integration on the floor.", "Centre"), eq("Strips", "Thin vertical or horizontal slabs, each with a bar showing its inner integral.", "Over the region"), eq("Order selector", "Switches between dy dx and dx dy.", "Controls")],
  steps: [
    st("s1", "Load the PYQ", "Press the first preset: ∫₀^π ∫ₓ^π (sin y)/y dy dx.", { kind: "preset", name: "PYQ: ∫∫ sin y / y over 0 ≤ x ≤ y ≤ π" }),
    st("s2", "Use dx dy", "The order must be dx dy: x runs from 0 to y.", { kind: "param", key: "order", op: "eq", value: "dxdy" }),
    st("s3", "Refine the strips", "Set the number of strips to 20 or more.", { kind: "param", key: "n", op: "gte", value: 20 }),
    st("s4", "Try the parabola region", "Choose the region x² ≤ y ≤ 2 − x.", { kind: "param", key: "id", op: "eq", value: "pyq" }),
    st("s5", "Try e^(y²)", "Choose ∫₀¹∫ₓ¹ e^(y²) dy dx.", { kind: "param", key: "id", op: "eq", value: "exp" }),
    RESET,
  ],
  questions: [
    nq("reverseorder-q1", "Evaluate ∫₀^π ∫ₓ^π (sin y)/y dy dx.", 2, 0.001, ["The region is 0 ≤ x ≤ y ≤ π.", "Switch: for each y, x runs from 0 to y, so the integral is ∫₀^π (sin y / y) · y dy.", "= ∫₀^π sin y dy = 2."], "In the original order the inner integral has no elementary antiderivative.", { scenario: "A student tries to integrate (sin y)/y with respect to y first and is stuck." }),
    nq("reverseorder-q2", "With only 6 strips in dx dy order, what does the lab's strip sum give for that integral?", 2.023, 0.01, ["Each strip is the exact inner integral, times its width.", "With six strips the midpoint rule is slightly high.", "The lab reports 2.023."], "More strips reduce the error."),
    nq("reverseorder-q3", "What is the area of the region x² ≤ y ≤ 2 − x for 0 ≤ x ≤ 1?", 1.1667, 0.001, ["Area = ∫₀¹ (2 − x − x²) dx.", "= 2 − 1/2 − 1/3.", "= 7/6 ≈ 1.1667."], "Area is the double integral of 1."),
    nq("reverseorder-q4", "PYQ: evaluate ∫₀¹ ∫ₓ²^(2−x) xy dy dx.", 0.375, 0.001, ["Inner: x [y²/2] from x² to 2 − x = x((2 − x)² − x⁴)/2.", "Expand: (1/2) ∫₀¹ (4x − 4x² + x³ − x⁵) dx = (1/2)(2 − 4/3 + 1/4 − 1/6).", "= (1/2)(9/12) = 3/8 = 0.375."], "In the other order the region needs two pieces (y ≤ 1 and 1 ≤ y ≤ 2)."),
    nq("reverseorder-q5", "Evaluate ∫₀¹ ∫ₓ¹ e^(y²) dy dx.", 0.8591, 0.001, ["Region 0 ≤ x ≤ y ≤ 1.", "Switch: ∫₀¹ e^(y²) · y dy.", "= (e − 1)/2 ≈ 0.8591."], "A one-line integral after the switch.", { formulas: ["∫ y e^{y²} dy = e^{y²}/2"] }),
    tf("reverseorder-q6", "For a continuous integrand on a bounded region, the value of the double integral depends on the order of integration.", false, ["Fubini's theorem says both orders give the same value.", "Only the difficulty of the calculation changes."], "Changing the order is a method of making the integral easy."),
    mcq("reverseorder-q7", "Why do we change the order of integration in ∫∫ (sin y)/y dy dx?", ["To make the region smaller", "Because (sin y)/y has no elementary antiderivative in y", "To change the answer", "Because dx dy is always easier"], 1, ["The inner integral over y cannot be written in closed form.", "After switching, the inner variable is x and (sin y)/y is a constant.", "The integral becomes ∫ sin y dy."], "Choose the order that makes the inner integral elementary.", { commonMistake: 'Changing the limits without redrawing the region.' }),
  ],
  summary: ["Describe the region by x-limits for each y instead of y-limits for each x.", "Fubini's theorem guarantees the same value for continuous integrands.", "Integrals like (sin y)/y and e^(y²) are solvable only after the switch."],
};

const betagamma: Experiment = {
  labId: "betagamma",
  title: "Beta and Gamma functions",
  aim: "To evaluate Beta and Gamma values, and to convert trigonometric integrals into Beta functions.",
  objectives: ["State B(m, n) = Γ(m)Γ(n)/Γ(m + n) and B(m, n) = B(n, m).", "Evaluate Γ(5) and Γ(1/2).", "Evaluate ∫ sin<sup>p</sup>θ cos<sup>q</sup>θ dθ by Beta."],
  equipment: [eq("Beta bars", "Bars whose total area is B(m, n).", "Left"), eq("Gamma curve", "Γ(x) with m, n and m + n marked.", "Right"), eq("View selector", "Switches between the Beta integrand and the sine-cosine form.", "Controls")],
  steps: [
    st("s1", "B(1/2, 1/2)", "Press the preset 'B(½, ½) = π'.", { kind: "preset", name: "B(½, ½) = π" }),
    st("s2", "B(2, 3)", "Press the preset 'B(2, 3) = 1/12' and read the area.", { kind: "preset", name: "B(2, 3) = 1/12" }),
    st("s3", "Swap m and n", "Raise m to 3 or more while n stays fixed. Then check B(n, m) = B(m, n) by swapping the values.", { kind: "param", key: "m", op: "gte", value: 3 }),
    st("s4", "Sine-cosine view", "Choose the sin-cos view.", { kind: "param", key: "view", op: "eq", value: "sincos" }),
    st("s5", "PYQ", "Press the PYQ preset: ∫₀^(2π) sin⁴θ cos²θ dθ.", { kind: "preset", name: "PYQ: ∫₀^(2π) sin⁴θ cos²θ dθ" }),
    RESET,
  ],
  questions: [
    nq("betagamma-q1", "Find B(2, 3).", 0.0833, 0.0005, ["B(2, 3) = Γ(2)Γ(3)/Γ(5).", "= 1 · 2 / 24.", "= 1/12."], "For integers B(m, n) = (m−1)!(n−1)!/(m+n−1)!."),
    nq("betagamma-q2", "Find Γ(5).", 24, 0.001, ["Γ(n) = (n − 1)! for a positive integer.", "Γ(5) = 4!.", "= 24."], "A common slip is to use 5!.", { commonMistake: "Confusing Γ(n) = (n − 1)! with n!." }),
    nq("betagamma-q3", "Find Γ(1/2).", 1.7725, 0.001, ["Γ(1/2)² = B(1/2, 1/2) Γ(1) = π.", "So Γ(1/2) = √π.", "≈ 1.7725."], "This links Gamma to the Gaussian integral."),
    nq("betagamma-q4", "Find ∫₀^(π/2) sin⁴θ cos²θ dθ.", 0.09817, 0.0005, ["Use ½ B((p + 1)/2, (q + 1)/2) with p = 4, q = 2.", "= ½ B(5/2, 3/2) = ½ Γ(5/2)Γ(3/2)/Γ(4).", "= π/32 ≈ 0.09817."], "Match the formula, do not expand the powers.", { formulas: ["∫₀^{π/2} sin^p θ cos^q θ dθ = ½ B((p+1)/2, (q+1)/2)"] }),
    nq("betagamma-q5", "PYQ: find ∫₀^(2π) sin⁴θ cos²θ dθ.", 0.3927, 0.001, ["Over [0, 2π] the integrand repeats four times the [0, π/2] integral.", "4 · π/32.", "= π/8 ≈ 0.3927."], "Check the symmetry before using the formula.", { scenario: "Your exam question runs from 0 to 2π, not to π/2." }),
    tf("betagamma-q6", "B(m, n) = B(n, m).", true, ["The formula Γ(m)Γ(n)/Γ(m + n) is symmetric in m and n.", "Equivalently substitute x → 1 − x in the integral."], "You can verify it by swapping the sliders in the lab."),
    mcq("betagamma-q7", "∫₀^{π/2} sin<sup>p</sup>θ cos<sup>q</sup>θ dθ equals…", ["B(p, q)", "½ B((p+1)/2, (q+1)/2)", "B(p+1, q+1)", "Γ(p)Γ(q)"], 1, ["Put x = sin²θ.", "dx = 2 sinθ cosθ dθ, giving ½ ∫ x^{(p−1)/2}(1 − x)^{(q−1)/2} dx.", "That is ½ B((p+1)/2, (q+1)/2)."], "Add one to the power and halve it.", { commonMistake: "Forgetting the factor ½." }),
  ],
  summary: ["B(m, n) = Γ(m)Γ(n)/Γ(m + n) and Γ(n + 1) = nΓ(n).", "Γ(1/2) = √π.", "Trigonometric power integrals over [0, π/2] reduce to ½ B((p + 1)/2, (q + 1)/2)."],
};

const jacobian: Experiment = {
  labId: "jacobian",
  title: "Jacobian as an area-scaling factor",
  aim: "To see that a small cell of area du dv maps to a region of area |J| du dv, and to compute Jacobians of standard changes of variables.",
  objectives: ["Compute J = ∂(x, y)/∂(u, v) for polar and linear maps.", "Predict the image area of a small cell.", "State J · J′ = 1."],
  equipment: [eq("Left plane (blue)", "The uv-plane with a small rectangular cell.", "Left"), eq("Right plane (orange)", "The xy-plane with the image of the cell.", "Right"), eq("Green balls", "Walk round the cell and its image together.", "Both planes")],
  steps: [
    st("s1", "Polar map", "Press the preset 'Polar: J = r'.", { kind: "preset", name: "Polar: J = r" }),
    st("s2", "Move outwards", "Raise u₀ to 2.5 or more. The image of the same cell gets bigger.", { kind: "param", key: "u0", op: "gte", value: 2.5 }),
    st("s3", "Shrink the cell", "Set du to 0.1 or less and compare the measured area with |J| du dv.", { kind: "param", key: "du", op: "lte", value: 0.1 }),
    st("s4", "x = u, y = uv", "Choose the substitution x = u, y = uv.", { kind: "param", key: "map", op: "eq", value: "ux" }),
    st("s5", "Linear map", "Choose x = u + v, y = u − v. The image is an exact parallelogram.", { kind: "param", key: "map", op: "eq", value: "shear" }),
    RESET,
  ],
  questions: [
    nq("jacobian-q1", "Find J for x = u cos v, y = u sin v at u = 2.", 2, 0.001, ["J = x_u y_v − x_v y_u = cos v · u cos v + u sin v · sin v.", "= u (cos²v + sin²v) = u.", "At u = 2, J = 2."], "This is the r in r dr dθ."),
    nq("jacobian-q2", "Find J for x = u, y = uv at u = 3.", 3, 0.001, ["x_u = 1, x_v = 0, y_u = v, y_v = u.", "J = 1 · u − 0 · v = u.", "At u = 3, J = 3."], "PYQ-style substitution for integrals over triangles."),
    nq("jacobian-q3", "Find J for x = u + v, y = u − v.", -2, 0.001, ["x_u = 1, x_v = 1, y_u = 1, y_v = −1.", "J = (1)(−1) − (1)(1).", "= −2."], "The negative sign means the orientation flips; the area scale factor is |J| = 2."),
    nq("jacobian-q4", "A cell du = dv = 0.1 at u = 2 in polar form: what area does |J| du dv predict for its image?", 0.02, 0.0005, ["|J| = 2.", "du dv = 0.01.", "Predicted area = 0.02."], "The lab's measured area is 0.0205: it differs by a second-order amount.", { scenario: "The cell corner is at u₀ = 2, v₀ = 0.5 with du = dv = 0.1 in polar form." }),
    nq("jacobian-q5", "Find J for x = 2u cos v, y = 1.5u sin v at u = 2.", 6, 0.001, ["Scale factors 2 and 1.5 multiply the polar Jacobian: 2 · 1.5 · u.", "= 3u.", "= 6 at u = 2."], "Elliptic polar coordinates."),
    tf("jacobian-q6", "J · J′ = 1, where J′ = ∂(u, v)/∂(x, y).", true, ["The Jacobian matrices of inverse maps are inverses.", "The determinants multiply to 1."], "The lab's J · J′ readout stays at 1 for every cell."),
    mcq("jacobian-q7", "When a double integral is changed from (x, y) to (u, v), the area element dx dy becomes…", ["J du dv", "|J| du dv", "du dv / J", "J² du dv"], 1, ["A cell du dv maps to an area |J| du dv.", "Area is positive, so the modulus is used.", "dx dy = |J| du dv."], "Remember the modulus when J is negative.", { commonMistake: "Dropping the modulus when J < 0." }),
  ],
  summary: ["dx dy = |J| du dv.", "Polar J = r, x = u, y = uv has J = u, a linear map has a constant J.", "J and J′ are reciprocal."],
};

const revcurves: Experiment = {
  labId: "revcurves",
  title: "Volumes and surfaces of revolution of parametric curves",
  aim: "To sweep a parametric curve about the x-axis and compute the volume and surface area of the solid.",
  objectives: ["Write V = π∫ y² dx and S = 2π∫ y ds for parametric curves.", "Recall standard results for the astroid and the cycloid.", "Explain how V and S scale with a."],
  equipment: [eq("Curve", "The generating curve in the xy-plane.", "Centre"), eq("Solid", "The surface swept as the sweep angle goes to 360°.", "Around the x-axis"), eq("Sweep slider", "Controls how far the curve has rotated.", "Controls")],
  steps: [
    st("s1", "Astroid", "Press the preset 'PYQ: astroid about the x-axis'.", { kind: "preset", name: "PYQ: astroid about the x-axis" }),
    st("s2", "Double a", "Raise a to 2 or more.", { kind: "param", key: "a", op: "gte", value: 2 }),
    st("s3", "Half sweep", "Set the sweep angle to 180° or less. You see the cross section.", { kind: "param", key: "sweep", op: "lte", value: 180 }),
    st("s4", "Cycloid", "Choose one arch of the cycloid.", { kind: "param", key: "curve", op: "eq", value: "cycloid" }),
    st("s5", "Loop curve", "Choose the loop of y² = x²(x + 4).", { kind: "param", key: "curve", op: "eq", value: "loop" }),
    RESET,
  ],
  questions: [
    nq("revcurves-q1", "Volume obtained by revolving the astroid x = cos³t, y = sin³t about the x-axis (a = 1).", 0.9574, 0.001, ["V = π∫ y² |dx| = π ∫₀^π sin⁶t · 3cos²t sin t dt.", "Evaluate with Beta functions to get 32πa³/105.", "= 0.9574 for a = 1."], "Use symmetry: twice the quarter.", { formulas: ["V = 32πa³/105"] }),
    nq("revcurves-q2", "Surface area for the same astroid.", 7.5398, 0.001, ["S = 2π ∫ y ds with ds = 3 sin t |cos t| dt (a = 1).", "= 12πa²/5.", "= 7.5398."], "Both results follow a Beta-function evaluation."),
    nq("revcurves-q3", "Volume generated by one arch of the cycloid x = t − sin t, y = 1 − cos t about the x-axis.", 49.348, 0.01, ["V = π ∫₀^{2π} (1 − cos t)³ dt.", "= π · 5π.", "= 5π² a³ ≈ 49.348."], "The surface area of the same solid is 64π/3.", { scenario: "A cycloid arch has its base on the x-axis and revolves about the same axis." }),
    nq("revcurves-q4", "PYQ: volume of the solid when the loop of y² = x²(x + 4) revolves about the x-axis.", 67.02, 0.05, ["The loop lies between x = −4 and 0.", "V = π ∫₋₄⁰ x²(x + 4) dx.", "= π (64/3) ≈ 67.02."], "The loop is a closed region symmetric about the x-axis."),
    nq("revcurves-q5", "Volume for the astroid when a = 2.", 7.659, 0.01, ["V scales as a³.", "8 × 0.9574.", "= 7.659."], "Volumes scale with the cube of length."),
    tf("revcurves-q6", "Doubling the scale a of a curve multiplies its surface of revolution by 4.", true, ["Areas scale with the square of lengths.", "2² = 4."], "The lab shows S going from 7.54 to 30.16."),
    mcq("revcurves-q7", "The surface area of revolution about the x-axis of a curve x(t), y(t) is…", ["π ∫ y² dx", "2π ∫ y √(x′² + y′²) dt", "2π ∫ x dx", "π ∫ y ds"], 1, ["A thin band of arc ds at height y sweeps a ring of area 2πy ds.", "ds = √(x′² + y′²) dt.", "S = 2π ∫ y ds."], "The first option is the volume formula.", { commonMistake: "Using the volume formula for the surface area." }),
  ],
  summary: ["V = π∫ y² dx and S = 2π∫ y ds, both in parameter form.", "Volume scales as a³ and surface area as a².", "Standard results: astroid V = 32πa³/105, S = 12πa²/5; cycloid arch V = 5π²a³, S = 64πa²/3."],
};

const gradient: Experiment = {
  labId: "gradient",
  title: "Gradient and directional derivative",
  aim: "To compute the gradient of a scalar field, use it to find directional derivatives, and see why it points along the steepest ascent.",
  objectives: ["Compute ∇φ at a point.", "Find the derivative along a given direction.", "Recognise that the gradient is normal to level surfaces."],
  equipment: [eq("Value cloud", "Points coloured by φ.", "Around the point"), eq("Gradient arrow", "Points along ∇φ, normal to the level surface.", "At P"), eq("Direction arrow and tangent plane", "The chosen direction and the plane tangent to the level surface.", "At P")],
  steps: [
    st("s1", "Load the PYQ", "Press the preset 'PYQ: φ = x²yz + 4xz² at (1, −2, 1)'.", { kind: "preset", name: "PYQ: φ = x²yz + 4xz² at (1, −2, 1)" }),
    st("s2", "Steepest ascent", "Press the preset 'Steepest ascent' to point the direction along the gradient.", { kind: "preset", name: "Steepest ascent" }),
    st("s3", "Another field", "Choose φ = x² + y² + z².", { kind: "param", key: "phi", op: "eq", value: "f3" }),
    st("s4", "Direction along x", "Set the direction's i component to at least 2.", { kind: "param", key: "dx", op: "gte", value: 2 }),
    st("s5", "xyz", "Choose φ = xyz.", { kind: "param", key: "phi", op: "eq", value: "f4" }),
    RESET,
  ],
  questions: [
    nq("gradient-q1", "For φ = x²yz + 4xz², find |∇φ| at (1, −2, 1).", 6.0828, 0.001, ["∇φ = (2xyz + 4z², x²z, x²y + 8xz).", "At (1, −2, 1): (−4 + 4, 1, −2 + 8) = (0, 1, 6).", "|∇φ| = √37 ≈ 6.083."], "This is the largest possible directional derivative."),
    nq("gradient-q2", "PYQ: directional derivative of that φ at (1, −2, 1) along 2i − j − 2k.", -4.3333, 0.001, ["Unit vector: (2, −1, −2)/3.", "(0, 1, 6) · (2, −1, −2)/3 = (0 − 1 − 12)/3.", "= −13/3 ≈ −4.333."], "The negative sign means φ decreases in that direction.", { scenario: "At (1, −2, 1) a small bug walks along the direction 2i − j − 2k." }),
    nq("gradient-q3", "Angle between that direction and the gradient, in degrees.", 135.43, 0.05, ["cos θ = D/|∇φ| = −4.333/6.083 = −0.7124.", "θ = arccos(−0.7124).", "≈ 135.4°."], "An angle above 90° means a decrease.", { unit: "°" }),
    nq("gradient-q4", "For φ = x² + y² + z² at (1, 2, 2), what is the derivative along the unit vector i?", 2, 0.001, ["∇φ = (2x, 2y, 2z) = (2, 4, 4).", "Dot with (1, 0, 0).", "= 2."], "Derivative along i is just φ_x."),
    mcq("gradient-q5", "The gradient of φ at a point is…", ["tangent to the level surface", "normal to the level surface and points to increasing φ", "parallel to the x-axis", "always zero"], 1, ["Along the level surface φ does not change.", "So ∇φ · dr = 0 for tangent dr.", "Hence ∇φ is normal, pointing the way φ increases."], "The unit normal is ∇φ/|∇φ|."),
    tf("gradient-q6", "The directional derivative is largest when the direction is along ∇φ.", true, ["D = |∇φ| cos θ.", "cos θ = 1 gives the maximum |∇φ|."], "Use the steepest-ascent preset to see the angle fall to 0°."),
  ],
  summary: ["D_u φ = ∇φ · û = |∇φ| cos θ.", "∇φ is normal to the level surface and points uphill.", "The maximum rate of change is |∇φ|."],
};

const gaussflux: Experiment = {
  labId: "gaussflux",
  title: "Verifying the Gauss divergence theorem on a box",
  aim: "To add the fluxes through the six faces of a box and compare the total with the triple integral of the divergence.",
  objectives: ["Compute the divergence of a field.", "Evaluate the flux through each face.", "Confirm that surface flux equals volume integral."],
  equipment: [eq("Box", "A rectangular box with 0 ≤ x ≤ a, 0 ≤ y ≤ b, 0 ≤ z ≤ c.", "Centre"), eq("Orange and blue faces", "Orange where the field flows out, blue where it flows in.", "Surface"), eq("Balls inside", "Sized by the divergence at their position.", "Inside")],
  steps: [
    st("s1", "Load the PYQ", "Press 'PYQ: F = 4xz i − y² j + yz k, unit cube'.", { kind: "preset", name: "PYQ: F = 4xz i − y² j + yz k, unit cube" }),
    st("s2", "Radial field", "Choose F = (x, y, z).", { kind: "param", key: "field", op: "eq", value: "rad" }),
    st("s3", "Elongate the box", "Raise the width b to 2 or more.", { kind: "param", key: "b", op: "gte", value: 2 }),
    st("s4", "Constant field", "Choose the constant field F = i + 2j + 3k.", { kind: "param", key: "field", op: "eq", value: "const" }),
    st("s5", "Back to the PYQ", "Choose the PYQ field again.", { kind: "param", key: "field", op: "eq", value: "pyq1" }),
    RESET,
  ],
  questions: [
    nq("gaussflux-q1", "PYQ: find the outward flux of F = 4xz i − y² j + yz k through the unit cube.", 1.5, 0.001, ["∇·F = 4z − 2y + y = 4z − y.", "∭ (4z − y) dV over the unit cube = 2 − 1/2.", "= 3/2."], "Gauss: surface integral equals volume integral.", { formulas: ["∬ F·n dS = ∭ ∇·F dV"] }),
    nq("gaussflux-q2", "Flux of that field through the face x = 1 only.", 2, 0.001, ["On x = 1, n = i and F·n = 4z.", "∫₀¹∫₀¹ 4z dy dz.", "= 2."], "Faces x = 0, y = 0, z = 0 and z = 1 give 0, 0, 0 and 1/2; y = 1 gives −1.", { scenario: "The six faces contribute 0, 2, 0, −1, 0 and 1/2." }),
    nq("gaussflux-q3", "Flux of F = (x, y, z) out of the box 1 × 2 × 3.", 18, 0.001, ["∇·F = 3.", "Flux = 3 × volume = 3 × 6.", "= 18."], "A uniform source."),
    nq("gaussflux-q4", "Net flux of the constant field F = i + 2j + 3k out of the unit cube.", 0, 0.0001, ["∇·F = 0.", "Everything that enters leaves.", "Net flux 0."], "A solenoidal field has no net flux through any closed surface."),
    mcq("gaussflux-q5", "Gauss's divergence theorem relates…", ["a line integral and a surface integral", "a closed surface integral and a volume integral", "two line integrals", "a volume integral and its gradient"], 1, ["It converts the outward flux through a closed surface.", "Into the integral of div F over the enclosed volume.", "Stokes's theorem is the one with a line integral."], "Without proof."),
    tf("gaussflux-q6", "If ∇·F = 0 everywhere inside a closed surface, the net flux through it is zero.", true, ["The volume integral of 0 is 0.", "Gauss's theorem then gives zero flux."], "Magnetic fields satisfy this law."),
  ],
  summary: ["Flux through a closed surface = ∭ ∇·F dV.", "Compute face by face using the outward normal.", "Divergence 0 means net flux 0."],
};

const planes3: Experiment = {
  labId: "planes3",
  title: "Consistency of three linear equations",
  aim: "To see how rank A and rank [A | B] decide whether three planes meet in a point, a line or not at all.",
  objectives: ["State the consistency conditions.", "Find the values of λ and μ for each case.", "Interpret each case geometrically."],
  equipment: [eq("Three coloured planes", "One for each equation.", "In the cube"), eq("Gold ball or line", "The common solution.", "Intersection"), eq("Purple lines", "Where two planes meet when there is no common point.", "Triangular prism")],
  steps: [
    st("s1", "Infinitely many", "Press 'PYQ: λ = 6, μ = 26 (infinitely many)'.", { kind: "preset", name: "PYQ: λ = 6, μ = 26 (infinitely many)" }),
    st("s2", "No solution", "Press 'PYQ: λ = 6, μ = 20 (no solution)'.", { kind: "preset", name: "PYQ: λ = 6, μ = 20 (no solution)" }),
    st("s3", "Unique solution", "Raise λ to 8 or more.", { kind: "param", key: "lam", op: "gte", value: 8 }),
    st("s4", "The other PYQ system", "Choose the system 2x − 5y + 2z = 8, ….", { kind: "param", key: "sys", op: "eq", value: "pyq1" }),
    st("s5", "Back", "Choose the first system again.", { kind: "param", key: "sys", op: "eq", value: "pyq2" }),
    RESET,
  ],
  questions: [
    nq("planes3-q1", "For x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + λz = μ, find det A at λ = 8.", 2, 0.001, ["det = λ − 6 (expand).", "At λ = 8, det = 2.", "Non-zero, so unique solution."], "The determinant vanishes only at λ = 6."),
    nq("planes3-q2", "Find x for λ = 8, μ = 26.", 22, 0.001, ["Eliminate: x = 22, y = −6, z = 0 satisfies all three.", "Check: 22 − 6 = 16; 22 − 12 = 10; 44 − 18 = 26.", "x = 22."], "Use Cramer's rule since det ≠ 0."),
    nq("planes3-q3", "What is rank A when λ = 6?", 2, 0, ["At λ = 6 the third row of A is (2, 3, 6) = row 1 + row 2.", "So R3 − R1 − R2 is a zero row and two independent rows remain.", "Rank A = 2."], "The planes are dependent in A, so either they share a line or form a prism."),
    mcq("planes3-q4", "For λ = 6, μ = 20 the system has…", ["a unique solution", "infinitely many solutions", "no solution", "exactly two solutions"], 2, ["Rank A = 2 but rank [A | B] = 3.", "Inconsistent.", "The planes form a prism."], "μ must be 26 for consistency at λ = 6.", { scenario: "Set λ = 6 and μ = 20 in the lab and look at the three purple lines.", commonMistake: "Only looking at rank A." }),
    nq("planes3-q5", "For the system 2x − 5y + 2z = 8, 2x + 4y + 6z = 5, x + 2y + λz = μ, what is det A at the critical value λ = 3?", 0, 0.0001, ["det A is proportional to λ − 3.", "At λ = 3 it is 0.", "Then μ = 5/2 gives infinitely many solutions."], "The preset in the lab shows the line when μ = 2.5."),
    tf("planes3-q6", "A system AX = B is consistent if and only if rank A = rank [A | B].", true, ["If ranks differ, a row reads 0 = non-zero.", "If equal, a solution exists."], "Equal ranks smaller than the unknowns give infinitely many solutions."),
  ],
  summary: ["Consistency needs rank A = rank [A | B].", "Rank equal to the unknowns gives a unique solution; less gives infinitely many.", "Geometrically: a point, a line, or a prism."],
};

const caleyham: Experiment = {
  labId: "caleyham",
  title: "Cayley-Hamilton theorem and the inverse",
  aim: "To verify that a matrix satisfies its own characteristic equation and to use the theorem to find an inverse and a power.",
  objectives: ["Form the characteristic equation.", "Use it to find A⁻¹.", "Reduce higher powers."],
  equipment: [eq("Term grids", "One grid for each c_i Aⁱ.", "Back row"), eq("Green grid", "Their sum: the zero matrix.", "Back right"), eq("Gold and purple grids", "A⁻¹ and Aᵏ.", "Front row")],
  steps: [
    st("s1", "Load the PYQ", "Press 'PYQ: 3×3 inverse by Cayley-Hamilton'.", { kind: "preset", name: "PYQ: 3×3 inverse by Cayley-Hamilton" }),
    st("s2", "Higher power", "Raise k to 6 or more.", { kind: "param", key: "k", op: "gte", value: 6 }),
    st("s3", "Second matrix", "Choose the 3×3 matrix [4 3 1; 2 1 −2; 1 2 1].", { kind: "param", key: "mat", op: "eq", value: "m33b" }),
    st("s4", "A 2×2", "Choose the 2×2 matrix [1 4; 2 3].", { kind: "param", key: "mat", op: "eq", value: "m22b" }),
    st("s5", "Singular matrix", "Press the preset 'Singular matrix: no inverse'.", { kind: "preset", name: "Singular matrix: no inverse" }),
    RESET,
  ],
  questions: [
    nq("caleyham-q1", "Find |A| for A = [2 −1 1; −1 2 −1; 1 −1 2].", 4, 0.001, ["Characteristic polynomial λ³ − 6λ² + 9λ − 4.", "The constant term is −|A|.", "|A| = 4."], "Also trace = 6 = coefficient of −λ²."),
    nq("caleyham-q2", "PYQ: for the same matrix, find the top-left entry of A⁻¹.", 0.75, 0.001, ["A³ − 6A² + 9A − 4I = 0.", "Rearrange: 4I = A(A² − 6A + 9I), so A⁻¹ = (A² − 6A + 9I)/4.", "Top-left entry: (6 − 12 + 9)/4 = 3/4."], "The full inverse is ¼[3 1 −1; 1 3 1; −1 1 3].", { scenario: "You must find A⁻¹ without row reduction." }),
    nq("caleyham-q3", "Find the trace of A⁴ for the same matrix.", 258, 0.01, ["Eigenvalues are 1, 1 and 4.", "1⁴ + 1⁴ + 4⁴ = 258.", "The lab reads 258 at k = 4."], "Trace of Aᵏ is the sum of the kth powers of the eigenvalues."),
    nq("caleyham-q4", "For A = [1 4; 2 3], find the entry (1,1) of A⁻¹.", -0.6, 0.001, ["tr A = 4 and |A| = −5.", "A² − 4A − 5I = 0 so A⁻¹ = (A − 4I)/5.", "Entry (1,1) = (1 − 4)/5 = −0.6."], "The formula A⁻¹ = [(tr A)I − A]/|A| is the same."),
    nq("caleyham-q5", "For A = [1 4; 2 3], find the (2,2) entry of A².", 17, 0.001, ["A² = 4A + 5I.", "(2,2): 4 · 3 + 5.", "= 17."], "Use the characteristic equation to avoid multiplication."),
    tf("caleyham-q6", "The Cayley-Hamilton theorem fails for singular matrices.", false, ["It holds for every square matrix.", "A singular matrix just has no inverse."], "Try the singular matrix in the lab: the green grid is still flat."),
    mcq("caleyham-q7", "For a 2×2 matrix, Cayley-Hamilton gives A⁻¹ =", ["(tr A · I − A)/|A|", "(A − tr A · I)/|A|", "A/|A|", "(A² − I)/|A|"], 0, ["A² − (tr A)A + |A|I = O.", "Rearrange: A((tr A)I − A) = |A|I.", "So A⁻¹ = ((tr A)I − A)/|A|."], "This needs |A| ≠ 0.", { commonMistake: "Getting the sign of A the wrong way round." }),
  ],
  summary: ["Every matrix satisfies its characteristic equation.", "A⁻¹ comes from dividing p(A) = 0 by A.", "Higher powers reduce to lower ones."],
};

const eigen3d: Experiment = {
  labId: "eigen3d",
  title: "Eigenvalues and eigenvectors of a 3×3 matrix",
  aim: "To find eigenvalues from the characteristic equation and to see eigenvectors as the axes of the image ellipsoid.",
  objectives: ["Find eigenvalues of a 3×3 matrix.", "Use trace and determinant checks.", "Recognise repeated eigenvalues."],
  equipment: [eq("Grey sphere", "The unit sphere.", "Centre"), eq("Blue ellipsoid", "The image of the sphere under the matrix.", "Centre"), eq("Glowing rods", "The eigenvector directions with dots at λ·v.", "Through the origin")],
  steps: [
    st("s1", "Load the PYQ", "Press the preset 'PYQ: [−2 5 4; 5 7 5; 4 5 −2]'.", { kind: "preset", name: "PYQ: [−2 5 4; 5 7 5; 4 5 −2]" }),
    st("s2", "Morph", "Drag the morph slider to 0.2 or less to see the sphere.", { kind: "param", key: "t", op: "lte", value: 0.2 }),
    st("s3", "Scale the matrix", "Raise k to 1.5 or more: every eigenvalue is scaled.", { kind: "param", key: "k", op: "gte", value: 1.5 }),
    st("s4", "Repeated root", "Choose the matrix with a repeated eigenvalue.", { kind: "param", key: "mat", op: "eq", value: "sym2" }),
    st("s5", "Triangular", "Choose the triangular matrix.", { kind: "param", key: "mat", op: "eq", value: "tri" }),
    RESET,
  ],
  questions: [
    nq("eigen3d-q1", "Largest eigenvalue of [−2 5 4; 5 7 5; 4 5 −2].", 12, 0.001, ["|A − λI| = 0 gives λ³ − 3λ² − 90λ − 216 = 0.", "Roots 12, −3, −6.", "Largest 12."], "The factorisation (λ − 12)(λ + 3)(λ + 6)."),
    nq("eigen3d-q2", "The sum of the three eigenvalues of that matrix.", 3, 0.001, ["Sum = trace.", "−2 + 7 − 2.", "= 3."], "12 − 3 − 6 = 3."),
    nq("eigen3d-q3", "The product of the three eigenvalues.", 216, 0.01, ["Product = |A|.", "12 · (−3) · (−6).", "= 216."], "A quick check on your roots."),
    nq("eigen3d-q4", "The triangular matrix [3 1 4; 0 2 6; 0 0 5] is multiplied by 2. What is its largest eigenvalue?", 10, 0.001, ["The eigenvalues of a triangular matrix are its diagonal entries 3, 2, 5.", "Scaling by 2 scales each.", "Largest = 10."], "Eigenvectors do not change with k.", { scenario: "Set the lab to the triangular matrix with k = 2." }),
    nq("eigen3d-q5", "For the first matrix, what is the product of the two negative eigenvalues?", 18, 0.001, ["(−3)(−6) = 18.", "Also 216/12 = 18.", "Product 18."], "Use |A| and the known root to avoid solving a quadratic."),
    mcq("eigen3d-q6", "The eigenvectors of a real symmetric matrix belonging to different eigenvalues are…", ["parallel", "orthogonal", "equal", "undefined"], 1, ["For symmetric A, v₁ · Av₂ = Av₁ · v₂.", "So (λ₂ − λ₁) v₁ · v₂ = 0.", "Hence v₁ · v₂ = 0."], "The three rods in the lab are perpendicular for the symmetric matrices."),
    tf("eigen3d-q7", "A matrix with a repeated eigenvalue can still have three independent eigenvectors.", true, ["[6 −2 2; −2 3 −1; 2 −1 3] has eigenvalues 8, 2, 2.", "The eigenspace of 2 is a plane.", "So there are three independent eigenvectors."], "The orange ring marks the plane."),
  ],
  summary: ["Eigenvalues solve |A − λI| = 0.", "Sum of roots = trace; product = determinant.", "Eigenvectors are the directions the matrix only stretches."],
};

export const MATHI_EXPERIMENTS: Record<string, Experiment> = { lagrangemult, taylor2var, reverseorder, betagamma, jacobian, revcurves, gradient, gaussflux, planes3, caleyham, eigen3d };
