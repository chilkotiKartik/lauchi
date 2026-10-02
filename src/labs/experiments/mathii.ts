import type { Experiment } from "./types";

/**
 * Guided experiments for ten Analytical Mathematics (AHT-005) labs.
 * Every numeric answer is recomputed from src/labs/sim/mathii.ts in mathii.test.ts.
 */

const exactode: Experiment = {
  labId: "exactode",
  title: "Exact equations and integrating factors",
  aim: "To test M dx + N dy = 0 for exactness, find the integrating factor that repairs a non-exact equation, and read the potential function that solves it.",
  objectives: [
    "Test exactness by comparing ∂M/∂y with ∂N/∂x.",
    "Pick the integrating factor 1/x, 1/y, 1/(x²y²) or 1/y⁴ that makes a PYQ equation exact.",
    "Read the solution φ(x, y) = c from the potential surface.",
  ],
  equipment: [
    { name: "Potential surface", what: "A coloured height surface of φ(x, y) when the equation is exact; a warped red and blue sheet showing the mismatch when it is not.", where: "Centre of the view" },
    { name: "Gold solution curve", what: "The level curve φ = c through the probe point: it is the solution curve of the differential equation.", where: "On the surface" },
    { name: "Readouts", what: "∂M/∂y, ∂N/∂x, their difference and whether the equation is exact.", where: "Panel under the canvas" },
  ],
  steps: [
    { id: "s1", title: "Choose Q1.3(a)", text: "Set the Equation to Q1.3(a). With no integrating factor the readout should say it is exact.", check: { kind: "param", key: "eq", op: "eq", value: "q13a" } },
    { id: "s2", title: "Move the probe", text: "Raise Probe x to 2 or more and watch ∂M/∂y and ∂N/∂x change together: they stay equal everywhere.", check: { kind: "param", key: "x0", op: "gte", value: 2 } },
    { id: "s3", title: "Try a non-exact equation", text: "Set the Equation to Q1.3(b) with no factor. The sheet warps: ∂M/∂y and ∂N/∂x differ.", check: { kind: "param", key: "eq", op: "eq", value: "q13b" } },
    { id: "s4", title: "Apply 1/(x²y²)", text: "Set the factor μ to 1/(x²y²). The equation becomes exact and a potential surface appears.", check: { kind: "param", key: "mu", op: "eq", value: "x2y2" } },
    { id: "s5", title: "Load the 1/y⁴ preset", text: "Press the preset 'Q1.3(d) factor 1/y⁴' and read the solution.", check: { kind: "preset", name: "Q1.3(d) factor 1/y⁴" } },
    { id: "s6", title: "Reset", text: "Press Reset to restore the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "exactode-q1", type: "numeric", prompt: "For (5x⁴ + 3x²y² − 2xy³)dx + (2x³y − 3x²y² − 5y⁴)dy = 0, find ∂M/∂y at (x, y) = (1.2, 1).", answer: 1.44, tolerance: 0.01, marks: 3, hint: "Differentiate M with respect to y only.", formulas: ["∂M/∂y = 6x²y − 6xy²"], solution: ["M = 5x⁴ + 3x²y² − 2xy³ so ∂M/∂y = 6x²y − 6xy².", "At (1.2, 1): 6(1.44)(1) − 6(1.2)(1) = 8.64 − 7.2 = 1.44.", "∂N/∂x = 6x²y − 6xy² is the same, so the equation is exact."], explanation: "Both partial derivatives agree at every point, which is exactly the exactness condition.", commonMistake: "Differentiating with respect to x instead of y." },
    { id: "exactode-q2", type: "mcq", prompt: "Which integrating factor makes (x²y − 2xy²)dx − (x³ − 3x²y)dy = 0 exact?", options: ["1/x", "1/y", "1/(x²y²)", "1/(xy)"], answer: 2, marks: 2, hint: "Try each factor in the lab and watch the 'exact' readout.", solution: ["The equation is homogeneous of degree 3, but Mx + Ny ≠ 0 does not help directly.", "Dividing by x²y² gives M = 1/y − 2/x and N = −x/y² + 3/y.", "Then ∂M/∂y = −1/y² = ∂N/∂x, so it is exact."], explanation: "The solution is x/y − 2 ln x + 3 ln y = c.", commonMistake: "Choosing 1/(Mx + Ny) without checking that the result is exact." },
    { id: "exactode-q3", type: "tf", prompt: "The equation y dx − x dy = 0 is exact as it stands.", answer: false, marks: 1, hint: "Compare ∂M/∂y = 1 with ∂N/∂x.", solution: ["M = y, N = −x.", "∂M/∂y = 1 but ∂N/∂x = −1, so they differ."], explanation: "Multiplying by 1/y², 1/x² or 1/(xy) makes it exact: three different factors for one equation.", commonMistake: "Assuming a simple equation must be exact." },
    { id: "exactode-q4", type: "numeric", prompt: "The solution of Q1.3(a) is φ = x⁵ + x³y² − x²y³ − y⁵ = c. Find φ at (1.2, 1).", answer: 1.7763, tolerance: 0.01, marks: 3, hint: "Substitute x = 1.2, y = 1.", formulas: ["φ = x⁵ + x³y² − x²y³ − y⁵"], solution: ["x⁵ = 2.48832, x³y² = 1.728, x²y³ = 1.44, y⁵ = 1.", "φ = 2.48832 + 1.728 − 1.44 − 1 = 1.77632."], explanation: "The gold curve through the probe is the level curve φ = 1.776.", commonMistake: "Forgetting a term when substituting." },
    { id: "exactode-q5", type: "mcq", prompt: "Which factor makes (2xy⁴eʸ + 2xy³ + y)dx + (x²y⁴eʸ − x²y² − 3x)dy = 0 exact?", options: ["1/y⁴", "1/x²", "1/(xy)", "No factor is needed"], answer: 0, marks: 2, hint: "Look at the powers of y.", solution: ["Divide by y⁴: M = 2xeʸ + 2x/y + 1/y³, N = x²eʸ − x²/y² − 3x/y⁴.", "∂M/∂y = 2xeʸ − 2x/y² − 3/y⁴ = ∂N/∂x.", "The solution is x²eʸ + x²/y + x/y³ = c."], explanation: "It is the last PYQ equation in the list.", commonMistake: "Dividing by y² only." },
  ],
  summary: ["M dx + N dy = 0 is exact when ∂M/∂y = ∂N/∂x.", "If it is not exact, look for a factor 1/x, 1/y, 1/(xy), 1/(x²y²), 1/y⁴ that makes the two partial derivatives agree.", "The solution is the level curve φ(x, y) = c of the potential."],
};

const cooling: Experiment = {
  labId: "cooling",
  title: "Newton's law of cooling",
  aim: "To solve dT/dt = −k(T − Ts) numerically and by formula: find k from two readings, then predict temperatures and times.",
  objectives: ["Find the cooling constant k from two temperature readings.", "Predict T at any time and the time to reach a target.", "Use the half-excess time ln 2 / k."],
  equipment: [
    { name: "Cup and liquid", what: "The liquid colour moves from red to blue as it cools.", where: "Left" },
    { name: "Thermometer column", what: "Falls with time and settles at the room temperature Ts.", where: "Centre" },
    { name: "Cooling curve", what: "T(t) = Ts + (T0 − Ts)e^(−kt) with a marker at the chosen time.", where: "Right" },
  ],
  steps: [
    { id: "s1", title: "Go to 20 minutes", text: "Raise the time t to 20 min or more and read the temperature (the textbook problem: 100 °C to 80 °C in 10 min in a 30 °C room).", check: { kind: "param", key: "t", op: "gte", value: 20 } },
    { id: "s2", title: "Set a target", text: "Raise the target temperature to 60 °C or more and read the time needed.", check: { kind: "param", key: "Tt", op: "gte", value: 60 } },
    { id: "s3", title: "Load the coffee", text: "Press the preset 'Hot coffee 90 °C'.", check: { kind: "preset", name: "Hot coffee 90 °C" } },
    { id: "s4", title: "Cool faster", text: "Raise k to 0.3 or more: the curve drops steeply.", check: { kind: "param", key: "k", op: "gte", value: 0.3 } },
    { id: "s5", title: "Warm the room", text: "Change the surroundings Ts and see the curve's asymptote move.", check: { kind: "param", key: "Ts", op: "changed" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "cooling-q1", type: "numeric", prompt: "A body at 100 °C cools to 80 °C in 10 min in surroundings at 30 °C. Find k in per minute.", answer: 0.03365, tolerance: 0.0005, unit: "/min", marks: 3, hint: "Use the excess temperatures: 50 = 70 e^(−10k).", formulas: ["T − Ts = (T0 − Ts)e^(−kt)"], solution: ["Excess at start: 100 − 30 = 70; after 10 min: 80 − 30 = 50.", "50 = 70 e^(−10k), so k = ln(70/50)/10.", "k = ln 1.4 / 10 = 0.03365 per min."], explanation: "Always work with the excess over the surroundings.", commonMistake: "Using the temperatures 100 and 80 directly." },
    { id: "cooling-q2", type: "numeric", prompt: "With that k, what is the temperature after 20 min?", answer: 65.71, tolerance: 0.2, unit: "°C", marks: 3, hint: "e^(−20k) = (5/7)².", formulas: ["T = Ts + (T0 − Ts)e^(−kt)"], solution: ["e^(−20k) = (50/70)² = 0.5102.", "T = 30 + 70 × 0.5102 = 65.71 °C."], explanation: "Equal time steps multiply the excess by the same ratio 5/7.", commonMistake: "Guessing a linear drop to 60 °C." },
    { id: "cooling-q3", type: "numeric", prompt: "Using k = 0.034 per min, after how many minutes does the body reach 60 °C?", answer: 24.92, tolerance: 0.3, unit: "min", marks: 3, hint: "30 = 70 e^(−kt).", formulas: ["t = ln((T0 − Ts)/(T − Ts))/k"], solution: ["Excess is 30 when T = 60.", "t = ln(70/30)/0.034 = 0.8473/0.034 = 24.9 min."], explanation: "The lab prints the same value as 'time to target'.", commonMistake: "Using ln(100/60)." },
    { id: "cooling-q4", type: "numeric", prompt: "Hot coffee at 90 °C in a 20 °C room has k = 0.1 per min. How long until the excess temperature halves?", answer: 6.93, tolerance: 0.05, unit: "min", marks: 2, hint: "Half-excess time is ln 2 / k.", formulas: ["t½ = ln 2 / k"], solution: ["e^(−kt) = 1/2 gives t = ln 2 / k.", "= 0.6931 / 0.1 = 6.93 min."], explanation: "It does not depend on the starting temperature.", commonMistake: "Halving the temperature itself." },
    { id: "cooling-q5", type: "tf", prompt: "A body at 20 °C placed in a 40 °C oven warms up but never exceeds 40 °C.", answer: true, marks: 1, hint: "Use the 'Warming from below' preset.", solution: ["T = Ts + (T0 − Ts)e^(−kt) with T0 − Ts = −20.", "The term −20e^(−kt) rises to 0 from below."], explanation: "The same law covers heating and cooling.", commonMistake: "Thinking the law only describes cooling." },
  ],
  summary: ["dT/dt = −k(T − Ts) gives T = Ts + (T0 − Ts)e^(−kt).", "Find k from two readings using the excess over the surroundings.", "The half-excess time is ln 2 / k."],
};

const cauchyeuler: Experiment = {
  labId: "cauchyeuler",
  title: "Cauchy-Euler equations",
  aim: "To solve x²y″ + a·x·y′ + b·y = 0 by y = xᵐ and see how the roots decide the shape of the solution.",
  objectives: ["Form the auxiliary equation m(m − 1) + am + b = 0.", "Write the solution for real, repeated and complex roots.", "Link the curve in x to the curve in z = ln x."],
  equipment: [
    { name: "Two graphs", what: "y against x (left) and y against z = ln x (right) for the same solution.", where: "Upper part of the view" },
    { name: "Root plane", what: "A flat complex plane with the two roots as glowing spheres.", where: "Lower part of the view" },
    { name: "Residual readout", what: "Shows that the closed form satisfies the differential equation.", where: "Panel under the canvas" },
  ],
  steps: [
    { id: "s1", title: "Complex roots", text: "Press the preset 'Q2.4 complex: x²y″ − 3xy′ + 5y'. The roots become 2 ± i.", check: { kind: "preset", name: "Q2.4 complex: x²y″ − 3xy′ + 5y" } },
    { id: "s2", title: "Move the point", text: "Raise x to 3 or more and read y.", check: { kind: "param", key: "x", op: "gte", value: 3 } },
    { id: "s3", title: "Change c₂", text: "Change c₂ and see the oscillation amplitude and phase shift.", check: { kind: "param", key: "c2", op: "changed" } },
    { id: "s4", title: "Repeated root", text: "Press the preset 'Repeated root: x²y″ − 3xy′ + 4y'.", check: { kind: "preset", name: "Repeated root: x²y″ − 3xy′ + 4y" } },
    { id: "s5", title: "Split the root", text: "Lower b to 3.5 or less: the double root splits into two real roots.", check: { kind: "param", key: "b", op: "lte", value: 3.5 } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "cauchyeuler-q1", type: "numeric", prompt: "For x²y″ − 3xy′ + 4y = 0 the auxiliary equation has a repeated root. Find it.", answer: 2, tolerance: 0, marks: 2, hint: "m(m − 1) − 3m + 4 = m² − 4m + 4.", formulas: ["m(m − 1) + am + b = 0"], solution: ["m² − m − 3m + 4 = m² − 4m + 4 = (m − 2)².", "So m = 2 twice."], explanation: "The solution is y = x²(c1 + c2 ln x).", commonMistake: "Writing m² − 3m + 4." },
    { id: "cauchyeuler-q2", type: "mcq", prompt: "The roots of x²y″ − 3xy′ + 5y = 0 (PYQ Q2.4) are:", options: ["1 and 5", "2 ± i", "−2 ± i", "3 ± 2i"], answer: 1, marks: 2, hint: "m² − 4m + 5 = 0.", solution: ["m(m − 1) − 3m + 5 = m² − 4m + 5.", "m = (4 ± √(16 − 20))/2 = 2 ± i."], explanation: "y = x²[c1 cos(ln x) + c2 sin(ln x)].", commonMistake: "Forgetting the −m from m(m − 1)." },
    { id: "cauchyeuler-q3", type: "numeric", prompt: "For x²y″ − 3xy′ + 4y = 0 with c₁ = 1 and c₂ = 0, find y at x = 3.", answer: 9, tolerance: 0.01, marks: 2, hint: "y = x² when c₂ = 0.", formulas: ["y = (c₁ + c₂ ln x)x²"], solution: ["With c₂ = 0, y = c₁x² = x².", "y(3) = 9."], explanation: "The lab's value matches.", commonMistake: "Using e^(2x)." },
    { id: "cauchyeuler-q4", type: "tf", prompt: "x²y″ + xy′ − y = 0 has the general solution c₁x + c₂/x.", answer: true, marks: 1, hint: "m² − 1 = 0.", solution: ["m(m − 1) + m − 1 = m² − 1, so m = ±1.", "y = c₁x + c₂x⁻¹."], explanation: "This is the default preset.", commonMistake: "Thinking negative m is not allowed." },
    { id: "cauchyeuler-q5", type: "numeric", prompt: "For x²y″ − y = 0 (a = 0, b = −1) with c₁ = c₂ = 1, find y(2). The roots are (1 ± √5)/2.", answer: 3.7211, tolerance: 0.01, marks: 3, hint: "Add 2^1.618 and 2^(−0.618).", formulas: ["y = c₁x^m₁ + c₂x^m₂"], solution: ["m² − m − 1 = 0 gives m = 1.618 and −0.618.", "y(2) = 2^1.618 + 2^(−0.618) = 3.069 + 0.652 = 3.721."], explanation: "Powers of x with non-integer exponents are fine for x > 0.", commonMistake: "Rounding the roots to 2 and −1." },
  ],
  summary: ["Put y = xᵐ to get m(m − 1) + am + b = 0.", "Real roots: c₁x^m₁ + c₂x^m₂. Repeated: x^m(c₁ + c₂ ln x). Complex α ± iβ: x^α[c₁cos(β ln x) + c₂ sin(β ln x)].", "In z = ln x the equation has constant coefficients."],
};

const varparam: Experiment = {
  labId: "varparam",
  title: "Variation of parameters",
  aim: "To find the particular integral y_p = u₁y₁ + u₂y₂ from the Wronskian and check that it satisfies the equation.",
  objectives: ["Compute the Wronskian W = y₁y₂′ − y₂y₁′.", "Use u₁ = −∫y₂R/W, u₂ = ∫y₁R/W.", "Verify the answer by the residual."],
  equipment: [
    { name: "Four panels", what: "y₁ and y₂, the forcing R(x), the particular solution y_p and the complete solution y.", where: "Standing one behind the other" },
    { name: "Markers", what: "A marker on each panel at the chosen x.", where: "On each panel" },
    { name: "Wronskian and residual", what: "Live values of W and of the residual of the ODE.", where: "Readouts" },
  ],
  steps: [
    { id: "s1", title: "y″ + y = sec x", text: "The default equation is y″ + y = sec x. Slide x to the right end (position 0.9 or more) and watch y_p grow with sec x.", check: { kind: "param", key: "s", op: "gte", value: 0.9 } },
    { id: "s2", title: "Exponential forcing", text: "Set the equation to Q2.1 y″ − 3y′ + 2y = eˣ/(1+eˣ).", check: { kind: "param", key: "eq", op: "eq", value: "q21a" } },
    { id: "s3", title: "Repeated root", text: "Set the equation to Q2.1 y″ − 6y′ + 9y = e³ˣ/x².", check: { kind: "param", key: "eq", op: "eq", value: "q21b" } },
    { id: "s4", title: "Add the complementary function", text: "Change c₁ and see the complete solution y = c₁y₁ + c₂y₂ + y_p shift.", check: { kind: "param", key: "c1", op: "changed" } },
    { id: "s5", title: "Load the sec x preset", text: "Press the preset 'Q2.1 y″ + y = sec x'.", check: { kind: "preset", name: "Q2.1 y″ + y = sec x" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "varparam-q1", type: "numeric", prompt: "For y″ − 3y′ + 2y = eˣ/(1+eˣ), y₁ = eˣ and y₂ = e²ˣ. Find the Wronskian at x = 1.", answer: 20.0855, tolerance: 0.01, marks: 3, hint: "W = y₁y₂′ − y₂y₁′ = e³ˣ.", formulas: ["W = y₁y₂′ − y₂y₁′"], solution: ["W = eˣ·2e²ˣ − e²ˣ·eˣ = e³ˣ.", "At x = 1: e³ = 20.0855."], explanation: "W is never zero, so y₁, y₂ are independent.", commonMistake: "Forgetting the factor 2 from the derivative of e²ˣ." },
    { id: "varparam-q2", type: "numeric", prompt: "For y″ − 6y′ + 9y = e³ˣ/x² take y₁ = e³ˣ, y₂ = xe³ˣ. Find W at x = 1.", answer: 403.43, tolerance: 0.1, marks: 3, hint: "W = e⁶ˣ.", formulas: ["W = y₁y₂′ − y₂y₁′"], solution: ["y₂′ = (1 + 3x)e³ˣ.", "W = e³ˣ(1 + 3x)e³ˣ − xe³ˣ·3e³ˣ = e⁶ˣ.", "At x = 1: e⁶ = 403.43."], explanation: "The repeated-root case still gives W ≠ 0.", commonMistake: "Using y₂′ = e³ˣ." },
    { id: "varparam-q3", type: "numeric", prompt: "For y″ + y = sec x, y_p = cos x ln(cos x) + x sin x. Find y_p(0.6).", answer: 0.1807, tolerance: 0.005, marks: 3, hint: "Use radians.", formulas: ["y_p = cos x ln cos x + x sin x"], solution: ["cos 0.6 = 0.8253, ln 0.8253 = −0.1921, sin 0.6 = 0.5646.", "y_p = 0.8253(−0.1921) + 0.6(0.5646) = −0.1585 + 0.3388 = 0.1803."], explanation: "The lab integrates from x = 0, so it matches this closed form.", commonMistake: "Using degrees." },
    { id: "varparam-q4", type: "mcq", prompt: "Which pair of formulas gives the coefficients in variation of parameters?", options: ["u₁ = ∫y₂R/W, u₂ = ∫y₁R/W", "u₁ = −∫y₂R/W, u₂ = ∫y₁R/W", "u₁ = −∫y₁R/W, u₂ = ∫y₂R/W", "u₁ = ∫R/W, u₂ = ∫R/W"], answer: 1, marks: 2, hint: "The minus sign belongs to the y₁ coefficient.", solution: ["Require u₁′y₁ + u₂′y₂ = 0 and u₁′y₁′ + u₂′y₂′ = R.", "Solving: u₁′ = −y₂R/W, u₂′ = y₁R/W."], explanation: "y_p = −y₁∫(y₂R/W)dx + y₂∫(y₁R/W)dx.", commonMistake: "Swapping y₁ and y₂." },
    { id: "varparam-q5", type: "tf", prompt: "The residual y_p″ + a y_p′ + b y_p − R shown in the lab is (numerically) zero, which proves y_p solves the ODE.", answer: true, marks: 1, hint: "Read the residual readout.", solution: ["Substituting y_p into the left-hand side must give R.", "The residual is the difference, near 10⁻⁶ in the lab."], explanation: "It is a numerical check, not a proof, but it confirms the formulas.", commonMistake: "Expecting exactly 0." },
  ],
  summary: ["y_p = −y₁∫(y₂R/W)dx + y₂∫(y₁R/W)dx.", "W = y₁y₂′ − y₂y₁′ ≠ 0 for independent solutions.", "The complete solution is y = c₁y₁ + c₂y₂ + y_p."],
};

const parseval: Experiment = {
  labId: "parseval",
  title: "Parseval's theorem and series sums",
  aim: "To use the energy of Fourier harmonics to deduce Σ1/n², Σ1/n⁴ and the odd-n sum.",
  objectives: ["State Parseval's identity.", "Deduce π²/6, π⁴/90 and π²/8.", "See that sine-type series converge slowly and n⁻⁴ series quickly."],
  equipment: [
    { name: "Glass tank", what: "Fills with colour as harmonics are added up to the total energy mark.", where: "Left" },
    { name: "Green bars", what: "The energy aₙ² + bₙ² of each harmonic.", where: "Right of the tank" },
    { name: "Graph", what: "The function with its Fourier partial sum behind.", where: "Back" },
  ],
  steps: [
    { id: "s1", title: "Add harmonics", text: "Raise N to 20 or more with f(x) = x and watch the tank fill.", check: { kind: "param", key: "N", op: "gte", value: 20 } },
    { id: "s2", title: "Switch to x²", text: "Set f(x) = x².", check: { kind: "param", key: "fn", op: "eq", value: "xsq" } },
    { id: "s3", title: "Square wave", text: "Set the function to the square wave.", check: { kind: "param", key: "fn", op: "eq", value: "sq" } },
    { id: "s4", title: "Load a preset", text: "Press the preset 'f(x) = x gives π²/6'.", check: { kind: "preset", name: "f(x) = x gives π²/6" } },
    { id: "s5", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "parseval-q1", type: "numeric", prompt: "For f(x) = x on (−π, π), Parseval gives Σ1/n² = π²/6. Evaluate it.", answer: 1.6449, tolerance: 0.0005, marks: 2, hint: "π² ≈ 9.8696.", formulas: ["(1/π)∫f² = Σ bₙ²"], solution: ["bₙ = 2(−1)ⁿ⁺¹/n so Σbₙ² = 4Σ1/n².", "(1/π)∫x²dx = 2π²/3, hence Σ1/n² = π²/6 = 1.6449."], explanation: "The famous Basel sum.", commonMistake: "Forgetting the factor 4." },
    { id: "parseval-q2", type: "numeric", prompt: "The Parseval estimate of Σ1/n² using only N = 5 harmonics is:", answer: 1.4636, tolerance: 0.001, marks: 2, hint: "1 + 1/4 + 1/9 + 1/16 + 1/25.", solution: ["1 + 0.25 + 0.1111 + 0.0625 + 0.04 = 1.4636."], explanation: "The tail 0.18 is large because the terms fall only like 1/n².", commonMistake: "Stopping at N = 4." },
    { id: "parseval-q3", type: "numeric", prompt: "Find (1/π)∫₋π^π x² dx.", answer: 6.5797, tolerance: 0.001, marks: 2, hint: "∫x² = 2π³/3.", solution: ["∫₋π^π x²dx = 2π³/3.", "Divide by π: 2π²/3 = 6.5797."], explanation: "This is the total energy mark on the tank.", commonMistake: "Integrating only from 0 to π." },
    { id: "parseval-q4", type: "numeric", prompt: "The square wave gives Σ over odd n of 1/n² = π²/8. Evaluate it.", answer: 1.2337, tolerance: 0.0005, marks: 2, hint: "π²/8.", solution: ["bₙ = 4/(nπ) for odd n, so Σbₙ² = (16/π²)Σodd 1/n² = 2.", "Σodd 1/n² = π²/8 = 1.2337."], explanation: "Also equal to (3/4)(π²/6).", commonMistake: "Using all n." },
    { id: "parseval-q5", type: "tf", prompt: "With the same number of harmonics, the x² series (terms ~1/n⁴) estimates its sum much more accurately than the f(x) = x series.", answer: true, marks: 1, hint: "Compare the estimates at N = 6.", solution: ["x² gives π⁴/90 with error about 10⁻³ at N = 6.", "x gives π²/6 with an error of 0.15 at N = 5."], explanation: "Smoother functions have faster-decaying coefficients.", commonMistake: "Thinking all series converge equally fast." },
  ],
  summary: ["(1/π)∫f² = a₀²/2 + Σ(aₙ² + bₙ²) on (−π, π).", "Different f give Σ1/n² = π²/6, Σ1/n⁴ = π⁴/90 and Σodd 1/n² = π²/8.", "Smoother f means faster convergence."],
};

const uniformconv: Experiment = {
  labId: "uniformconv",
  title: "Uniform convergence and the M-test",
  aim: "To tell pointwise from uniform convergence by watching the sup-norm of the error and the ε-tube.",
  objectives: ["Compute sup|fₙ − f|.", "Find the n that fits inside a tolerance ε.", "Apply the Weierstrass M-test."],
  equipment: [
    { name: "Function surface", what: "x along one axis and the index n going into the screen.", where: "Centre" },
    { name: "Gold slice", what: "The graph of the chosen fₙ.", where: "On the surface" },
    { name: "Green tube lines", what: "The ε-band around the limit function.", where: "Around the slice" },
  ],
  steps: [
    { id: "s1", title: "Step n up", text: "Raise n to 20 or more for xⁿ on [0, 0.9] and watch the slice flatten into the tube.", check: { kind: "param", key: "n", op: "gte", value: 20 } },
    { id: "s2", title: "Shrink the interval", text: "Lower a to 0.5 or less: the sup falls even faster.", check: { kind: "param", key: "a", op: "lte", value: 0.5 } },
    { id: "s3", title: "Include the end point", text: "Raise a back to 1: the sup stays 1.", check: { kind: "param", key: "a", op: "gte", value: 1 } },
    { id: "s4", title: "Try the hump", text: "Set the sequence to n x e^(−nx).", check: { kind: "param", key: "fn", op: "eq", value: "hump" } },
    { id: "s5", title: "Try the series", text: "Set the series Σ sin kx / k².", check: { kind: "param", key: "fn", op: "eq", value: "sinsum" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "uniformconv-q1", type: "numeric", prompt: "Find sup|xⁿ − 0| on [0, 0.9] for n = 5.", answer: 0.5905, tolerance: 0.001, marks: 2, hint: "The sup is at x = 0.9.", solution: ["xⁿ is increasing, so the sup is 0.9⁵ = 0.59049."], explanation: "As n → ∞ this tends to 0: uniform.", commonMistake: "Taking x = 1." },
    { id: "uniformconv-q2", type: "numeric", prompt: "On [0, 0.9] with ε = 0.1, what is the smallest n with 0.9ⁿ < ε?", answer: 22, tolerance: 0, marks: 3, hint: "n > ln 0.1 / ln 0.9.", formulas: ["n > ln ε / ln a"], solution: ["ln 0.1 / ln 0.9 = 21.85.", "The smallest integer is 22."], explanation: "The same n works for all x on the interval, which is what uniform means.", commonMistake: "Rounding down to 21." },
    { id: "uniformconv-q3", type: "tf", prompt: "xⁿ converges uniformly on [0, 1].", answer: false, marks: 1, hint: "Set a = 1.", solution: ["The limit is 0 for x < 1 and 1 at x = 1.", "sup|xⁿ − f| = 1 for every n."], explanation: "A uniform limit of continuous functions must be continuous.", commonMistake: "Thinking pointwise convergence is enough." },
    { id: "uniformconv-q4", type: "numeric", prompt: "For fₙ(x) = n x e^(−nx), the pointwise limit is 0. What is sup fₙ?", answer: 0.3679, tolerance: 0.001, marks: 3, hint: "The maximum is at x = 1/n.", solution: ["fₙ′ = n(1 − nx)e^(−nx) = 0 at x = 1/n.", "fₙ(1/n) = e⁻¹ = 0.3679, independent of n."], explanation: "The sup does not shrink, so the convergence is not uniform.", commonMistake: "Expecting 1/n." },
    { id: "uniformconv-q5", type: "numeric", prompt: "For fₙ(x) = sin(nx)/n, find the sup of |fₙ| when n = 10.", answer: 0.1, tolerance: 0.001, marks: 2, hint: "|sin| ≤ 1.", solution: ["|sin(nx)/n| ≤ 1/n with equality at some x.", "sup = 1/10 = 0.1 → 0, so uniform."], explanation: "Compare with the M-test idea: bound by 1/n.", commonMistake: "Forgetting to divide by n." },
  ],
  summary: ["Uniform convergence means sup|fₙ − f| → 0.", "xⁿ is uniform on [0, a] for a < 1 but not on [0, 1].", "The M-test: |fₖ| ≤ Mₖ with ΣMₖ convergent gives uniform convergence."],
};

const homopde: Experiment = {
  labId: "homopde",
  title: "Homogeneous linear PDE and its classification",
  aim: "To solve A z_xx + B z_xy + C z_yy = 0 through the auxiliary equation A m² + B m + C = 0 and classify the equation.",
  objectives: ["Find the roots m₁, m₂.", "Write z = f(y + m₁x) + g(y + m₂x).", "Classify with B² − 4AC."],
  equipment: [
    { name: "Wavy surface", what: "The complementary function with sample f and g.", where: "Centre" },
    { name: "Characteristic lines", what: "Gold and white lines on the floor along which each part is constant.", where: "On the floor" },
    { name: "Probe pillar", what: "A pillar at the probe point with its height.", where: "On the surface" },
  ],
  steps: [
    { id: "s1", title: "Load Q4.1", text: "Press the preset 'Q4.1 r + s − 6t = 0'.", check: { kind: "preset", name: "Q4.1 r + s − 6t = 0" } },
    { id: "s2", title: "Equal roots", text: "Press the preset 'Double root D² − 6DD′ + 9D′²'.", check: { kind: "preset", name: "Double root D² − 6DD′ + 9D′²" } },
    { id: "s3", title: "Go elliptic", text: "Raise B to 0 or more: the discriminant turns negative and the roots turn complex.", check: { kind: "param", key: "B", op: "gte", value: 0 } },
    { id: "s4", title: "Move the probe", text: "Change the probe x.", check: { kind: "param", key: "px", op: "changed" } },
    { id: "s5", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "homopde-q1", type: "numeric", prompt: "For (D² − 3DD′ + 2D′²)z = 0 (PYQ Q4.4) find the larger root m of m² − 3m + 2 = 0.", answer: 2, tolerance: 0, marks: 2, hint: "(m − 1)(m − 2).", solution: ["m² − 3m + 2 = (m − 1)(m − 2).", "m = 1, 2; the larger is 2."], explanation: "z = f₁(y + x) + f₂(y + 2x).", commonMistake: "Using m² + 3m + 2." },
    { id: "homopde-q2", type: "numeric", prompt: "For D² − 6DD′ + 9D′² compute B² − 4AC.", answer: 0, tolerance: 0, marks: 2, hint: "36 − 36.", formulas: ["B² − 4AC"], solution: ["B = −6, A = 1, C = 9.", "36 − 36 = 0: parabolic, with the double root m = 3."], explanation: "The solution is f₁(y + 3x) + x f₂(y + 3x).", commonMistake: "Using B = 6 with a sign error in AC." },
    { id: "homopde-q3", type: "mcq", prompt: "z_xx + z_yy = 0 (Laplace) is:", options: ["Hyperbolic", "Parabolic", "Elliptic", "Not classifiable"], answer: 2, marks: 1, hint: "B² − 4AC = −4.", solution: ["A = C = 1, B = 0 gives −4 < 0.", "Elliptic, with complex roots m = ±i."], explanation: "Elliptic equations describe steady states.", commonMistake: "Calling it parabolic." },
    { id: "homopde-q4", type: "numeric", prompt: "For r + s − 6t = 0 (PYQ Q4.1) compute B² − 4AC.", answer: 25, tolerance: 0, marks: 2, hint: "1 + 24.", solution: ["A = 1, B = 1, C = −6.", "B² − 4AC = 1 + 24 = 25 > 0: hyperbolic, roots 2 and −3."], explanation: "z = f₁(y + 2x) + f₂(y − 3x).", commonMistake: "Computing B² + 4AC." },
    { id: "homopde-q5", type: "tf", prompt: "The solution of (D² − 3DD′ + 2D′²)z = 0 is z = f₁(y + x) + f₂(y + 2x).", answer: true, marks: 1, hint: "y + m x.", solution: ["Roots m = 1 and 2 give arguments y + x and y + 2x."], explanation: "Each term is constant along its characteristic line.", commonMistake: "Writing y − mx." },
  ],
  summary: ["Auxiliary equation A m² + B m + C = 0.", "Distinct roots: z = f(y + m₁x) + g(y + m₂x); equal roots: f(y + mx) + x g(y + mx).", "B² − 4AC > 0, = 0, < 0 means hyperbolic, parabolic, elliptic."],
};

const cauchyint: Experiment = {
  labId: "cauchyint",
  title: "Cauchy's integral formula",
  aim: "To see ∮ f(z)/(z − a)ⁿ⁺¹ dz = 2πi f⁽ⁿ⁾(a)/n! when a is inside the contour and 0 when it is outside.",
  objectives: ["Apply the formula for n = 0 and n = 1.", "Use Cauchy-Goursat when the pole is outside.", "Evaluate a few exam integrals."],
  equipment: [
    { name: "Domain-coloured landscape", what: "|f(z)/(z − a)ⁿ⁺¹| as height, argument as hue, with a spike at a.", where: "Centre" },
    { name: "White contour", what: "The circle |z| = R with a moving gold bead.", where: "On the surface" },
    { name: "Pole marker", what: "Green when a is inside, red when outside.", where: "At a" },
  ],
  steps: [
    { id: "s1", title: "Pole inside", text: "With a = 0.5 + 0.3i and R = 2 the pole is inside; read the integral.", check: { kind: "param", key: "R", op: "gte", value: 2 } },
    { id: "s2", title: "Push the pole out", text: "Raise Re a to 2.5 or more so that a lies outside |z| = 2.", check: { kind: "param", key: "ax", op: "gte", value: 2.5 } },
    { id: "s3", title: "Derivative formula", text: "Set the derivative order n to 1 or more.", check: { kind: "param", key: "n", op: "gte", value: 1 } },
    { id: "s4", title: "Try sin z", text: "Set f(z) = sin z.", check: { kind: "param", key: "fn", op: "eq", value: "sinz" } },
    { id: "s5", title: "Load a preset", text: "Press the preset 'sin z / (z − a)² (derivative)'.", check: { kind: "preset", name: "sin z / (z − a)² (derivative)" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "cauchyint-q1", type: "numeric", prompt: "Find Re[(1/2πi)∮ eᶻ/(z − a) dz] on |z| = 2 for a = 0.5 + 0.3i.", answer: 1.5751, tolerance: 0.002, marks: 3, hint: "The answer is e^a.", formulas: ["f(a) = (1/2πi)∮ f(z)/(z − a) dz"], solution: ["The pole is inside (|a| = 0.58 < 2).", "e^a = e^0.5 (cos 0.3 + i sin 0.3) = 1.6487(0.9553 + 0.2955i).", "Re = 1.5751."], explanation: "The lab prints 1.5751 + 0.4872i.", commonMistake: "Giving e^0.5 only." },
    { id: "cauchyint-q2", type: "numeric", prompt: "Find (1/2πi)∮ sin z/(z − 1)² dz around a circle containing z = 1.", answer: 0.5403, tolerance: 0.001, marks: 3, hint: "n = 1: the answer is f′(1) = cos 1.", formulas: ["f′(a) = (1!/2πi)∮ f/(z − a)² dz"], solution: ["f = sin z, f′ = cos z.", "cos 1 = 0.5403."], explanation: "The derivative formula follows from differentiating Cauchy's formula.", commonMistake: "Using sin 1 = 0.8415." },
    { id: "cauchyint-q3", type: "tf", prompt: "If a lies outside the contour, ∮ f(z)/(z − a) dz = 0 for f analytic.", answer: true, marks: 1, hint: "Cauchy-Goursat.", solution: ["The integrand is analytic inside and on C.", "So the integral is 0."], explanation: "Slide the pole across the circle to watch the jump.", commonMistake: "Applying the formula without checking the pole's position." },
    { id: "cauchyint-q4", type: "mcq", prompt: "The value of ∮ eᶻ/z dz over |z| = 2 (counter-clockwise) is:", options: ["0", "2π", "2πi", "πi"], answer: 2, marks: 2, hint: "a = 0, f(0) = 1.", solution: ["Cauchy: 2πi f(0) = 2πi."], explanation: "n = 0 and f = eᶻ.", commonMistake: "Dropping the i." },
    { id: "cauchyint-q5", type: "numeric", prompt: "Find the imaginary part of ∮ eᶻ/z dz over |z| = 2.", answer: 6.2832, tolerance: 0.001, marks: 2, hint: "2π.", solution: ["The integral is 2πi, so its imaginary part is 2π = 6.2832."], explanation: "The lab prints the integral already divided by 2πi.", commonMistake: "Giving 1." },
  ],
  summary: ["f⁽ⁿ⁾(a) = n!/(2πi) ∮ f/(z − a)ⁿ⁺¹ dz for a inside C.", "Outside the contour the integral is 0.", "Check that the pole is inside before using the formula."],
};

const residues: Experiment = {
  labId: "residues",
  title: "Residue theorem",
  aim: "To compute ∮ f dz = 2πi Σ Res for the PYQ function z²/((z−1)(z−2)(z−3)) and its double-pole cousin.",
  objectives: ["Find residues at simple and double poles.", "Count only the poles inside the contour.", "Check the answer against the numeric integral."],
  equipment: [
    { name: "Landscape", what: "Domain-coloured |f| with spikes at the poles.", where: "Centre" },
    { name: "Contour", what: "White circle of radius R with a gold bead.", where: "On the surface" },
    { name: "Pole markers", what: "Green inside, red outside; larger for a double pole.", where: "On the real axis" },
  ],
  steps: [
    { id: "s1", title: "All poles inside", text: "With R = 3.5 all three poles are inside; read the total.", check: { kind: "param", key: "R", op: "gte", value: 3.5 } },
    { id: "s2", title: "Shrink the circle", text: "Lower R to 2.5 or less: the pole at 3 drops out.", check: { kind: "param", key: "R", op: "lte", value: 2.5 } },
    { id: "s3", title: "Only z = 1", text: "Lower R to 1.5 or less.", check: { kind: "param", key: "R", op: "lte", value: 1.5 } },
    { id: "s4", title: "Double pole", text: "Switch the poles to the double-pole form.", check: { kind: "param", key: "mode", op: "eq", value: "double" } },
    { id: "s5", title: "Load the PYQ preset", text: "Press the preset 'Q5.5 double pole'.", check: { kind: "preset", name: "Q5.5 double pole" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "residues-q1", type: "numeric", prompt: "For z²/((z−1)(z−2)(z−3)) find the residue at z = 3.", answer: 4.5, tolerance: 0.001, marks: 2, hint: "N(3)/((3−1)(3−2)).", formulas: ["Res = lim (z − a) f(z)"], solution: ["z² at 3 is 9; (3−1)(3−2) = 2.", "Res = 9/2 = 4.5."], explanation: "The residues at 1, 2, 3 are 1/2, −4, 9/2.", commonMistake: "Dividing by (z − 3)." },
    { id: "residues-q2", type: "numeric", prompt: "Find the sum of all three residues of z²/((z−1)(z−2)(z−3)).", answer: 1, tolerance: 0.001, marks: 2, hint: "0.5 − 4 + 4.5.", solution: ["1/2 − 4 + 9/2 = 1."], explanation: "So ∮ = 2πi on |z| = 3.5.", commonMistake: "Adding absolute values." },
    { id: "residues-q3", type: "numeric", prompt: "For z²/((z−1)²(z+2)) find the residue at the double pole z = 1.", answer: 0.5556, tolerance: 0.001, marks: 3, hint: "d/dz [z²/(z+2)] at z = 1.", formulas: ["Res = d/dz[(z − a)² f(z)] at a"], solution: ["g = z²/(z+2), g′ = (2z(z+2) − z²)/(z+2)².", "g′(1) = (6 − 1)/9 = 5/9 = 0.5556."], explanation: "The residue at z = −2 is 4/9.", commonMistake: "Not differentiating." },
    { id: "residues-q4", type: "tf", prompt: "A pole outside the contour adds nothing to ∮ f dz.", answer: true, marks: 1, hint: "Shrink R.", solution: ["Only poles inside C count in 2πi ΣRes."], explanation: "Poles outside leave f analytic in the region.", commonMistake: "Including all poles." },
    { id: "residues-q5", type: "numeric", prompt: "With R = 1.5 only z = 1 is inside the simple-pole function. Find the imaginary part of ∮ f dz.", answer: 3.1416, tolerance: 0.001, marks: 3, hint: "2π × 1/2.", solution: ["∮ = 2πi × 1/2 = πi.", "Im = π = 3.1416."], explanation: "Check the readout 2πi ΣRes.", commonMistake: "Using 2π." },
  ],
  summary: ["∮ f dz = 2πi Σ Res inside C.", "Simple pole: lim (z − a)f; double pole: derivative of (z − a)²f.", "Poles outside the contour do not count."],
};

const realintegral: Experiment = {
  labId: "realintegral",
  title: "Real integrals by residues",
  aim: "To evaluate ∫₀^2π F(cos θ, sin θ) dθ with z = e^(iθ) and compare with a numeric sum.",
  objectives: ["Convert to a contour integral on |z| = 1.", "Locate the pole inside the unit circle.", "Reproduce the PYQ values π/√2, π/6, π/4."],
  equipment: [
    { name: "Unit circle and landscape", what: "The unit circle under a domain-coloured |G(z)|, with the pole spike.", where: "Centre" },
    { name: "Wall over the circle", what: "The real integrand F(θ) drawn as a height above the unit circle.", where: "Around the circle" },
    { name: "Pole markers", what: "Green inside, red outside.", where: "On the real axis" },
  ],
  steps: [
    { id: "s1", title: "Raise a", text: "Raise a to 4 or more: the integral shrinks as the integrand flattens.", check: { kind: "param", key: "a", op: "gte", value: 4 } },
    { id: "s2", title: "Raise b", text: "Raise b to 3 or more.", check: { kind: "param", key: "b", op: "gte", value: 3 } },
    { id: "s3", title: "cos 2θ integrand", text: "Set the integrand to cos 2θ/(a + b cos θ).", check: { kind: "param", key: "mode", op: "eq", value: "cos2" } },
    { id: "s4", title: "sin²θ integrand", text: "Set the integrand to sin²θ/(a + b cos θ).", check: { kind: "param", key: "mode", op: "eq", value: "sin2" } },
    { id: "s5", title: "Load the first PYQ", text: "Press the preset '∫ dθ/(3 + cos θ) = π/√2'.", check: { kind: "preset", name: "∫ dθ/(3 + cos θ) = π/√2" } },
    { id: "s6", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "realintegral-q1", type: "numeric", prompt: "Evaluate ∫₀^2π dθ/(3 + cos θ).", answer: 2.2214, tolerance: 0.001, marks: 3, hint: "2π/√(a² − b²).", formulas: ["∫ dθ/(a + b cos θ) = 2π/√(a² − b²)"], solution: ["a = 3, b = 1: √8 = 2.828.", "2π/2.828 = 2.2214 = π/√2."], explanation: "The pole inside is z = −3 + 2√2.", commonMistake: "Using 2π/(a + b)." },
    { id: "realintegral-q2", type: "numeric", prompt: "Evaluate ∫₀^2π cos 2θ/(5 + 4 cos θ) dθ.", answer: 0.5236, tolerance: 0.001, marks: 3, hint: "π/6.", solution: ["The pole inside is z = −1/2.", "The residue calculation gives π/6 = 0.5236."], explanation: "PYQ result.", commonMistake: "Forgetting the z⁻² term of cos 2θ." },
    { id: "realintegral-q3", type: "numeric", prompt: "Evaluate ∫₀^2π sin²θ/(5 − 4 cos θ) dθ.", answer: 0.7854, tolerance: 0.001, marks: 3, hint: "π/4.", solution: ["The pole inside is z = 1/2.", "The integral equals π/4 = 0.7854."], explanation: "PYQ result.", commonMistake: "Using the pole z = 2." },
    { id: "realintegral-q4", type: "numeric", prompt: "Evaluate ∫₀^2π dθ/(3 + cos θ)².", answer: 0.833, tolerance: 0.002, marks: 3, hint: "2πa/(a² − b²)^(3/2).", formulas: ["∫ dθ/(a + b cos θ)² = 2πa/(a² − b²)^(3/2)"], solution: ["2π·3/8^1.5 = 18.85/22.63 = 0.833."], explanation: "A double pole inside the circle.", commonMistake: "Squaring the first answer." },
    { id: "realintegral-q5", type: "tf", prompt: "∫₀^2π dθ/(1 + 2 cos θ) exists as a convergent integral.", answer: false, marks: 1, hint: "Needs a > |b|.", solution: ["a = 1 ≤ |b| = 2, so the denominator is zero at some θ.", "The pole lies on or inside in the wrong way and the integral diverges."], explanation: "The lab shows 'diverges'.", commonMistake: "Applying the formula anyway." },
  ],
  summary: ["Put z = e^(iθ), cos θ = (z + 1/z)/2, dθ = dz/(iz).", "The integral is 2πi × (sum of residues inside |z| = 1).", "∫ dθ/(a + b cos θ) = 2π/√(a² − b²) for a > |b|."],
};

export const MATHII_EXPERIMENTS: Experiment[] = [exactode, cooling, cauchyeuler, varparam, parseval, uniformconv, homopde, cauchyint, residues, realintegral];
