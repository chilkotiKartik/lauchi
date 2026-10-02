import type { Lesson } from "./types";

export const partial: Lesson = {
  intro: "When a quantity depends on several variables, such as pressure on temperature and volume, you ask how it changes when you move one variable and hold the others fixed. That is a partial derivative. Everything else in multivariable calculus is built from it.",
  sections: [
    { h: "Definition", p: ["To find ∂f/∂x, treat y as a constant and differentiate with respect to x. To find ∂f/∂y, treat x as a constant.", "Geometrically, f<sub>x</sub> is the slope of the surface z = f(x, y) in the x-direction and f<sub>y</sub> is the slope in the y-direction."] },
    { h: "Higher-order and mixed derivatives", p: ["Differentiating twice gives f<sub>xx</sub>, f<sub>yy</sub> and the mixed derivatives f<sub>xy</sub>, f<sub>yx</sub>. If they are continuous, the order does not matter (Clairaut's theorem)."], formula: ["f<sub>xy</sub> = f<sub>yx</sub> when the mixed partials are continuous"] },
    { h: "Chain rule, total differential and implicit functions", p: ["If z = f(x, y) and x, y depend on t, add the effect of each path.", "For an implicit relation F(x, y) = 0 the slope of y with respect to x is found from the partials of F."], formula: ["dz/dt = f<sub>x</sub> dx/dt + f<sub>y</sub> dy/dt", "df = f<sub>x</sub> dx + f<sub>y</sub> dy", "F(x, y) = 0  ⇒  dy/dx = − F<sub>x</sub> / F<sub>y</sub>"] },
    { h: "Euler's theorem on homogeneous functions", p: ["If f(tx, ty) = t<sup>n</sup> f(x, y), f is homogeneous of degree n. Then the weighted sum of partials gives back n times f."], formula: ["x f<sub>x</sub> + y f<sub>y</sub> = n f"] },
  ],
  examples: [
    { q: "For u = x<sup>3</sup>y + e<sup>xy</sup>, find u<sub>x</sub> and u<sub>y</sub> and check u<sub>xy</sub> = u<sub>yx</sub>.", steps: ["u<sub>x</sub> = 3x<sup>2</sup>y + y e<sup>xy</sup>, u<sub>y</sub> = x<sup>3</sup> + x e<sup>xy</sup>.", "u<sub>xy</sub> = ∂/∂y (3x<sup>2</sup>y + y e<sup>xy</sup>) = 3x<sup>2</sup> + e<sup>xy</sup> + xy e<sup>xy</sup>.", "u<sub>yx</sub> = ∂/∂x (x<sup>3</sup> + x e<sup>xy</sup>) = 3x<sup>2</sup> + e<sup>xy</sup> + xy e<sup>xy</sup>. They are equal."], ans: "u<sub>xy</sub> = u<sub>yx</sub> = 3x<sup>2</sup> + e<sup>xy</sup>(1 + xy)" },
    { q: "If x<sup>3</sup> + y<sup>3</sup> = 3axy, find dy/dx.", steps: ["Let F = x<sup>3</sup> + y<sup>3</sup> − 3axy.", "F<sub>x</sub> = 3x<sup>2</sup> − 3ay and F<sub>y</sub> = 3y<sup>2</sup> − 3ax.", "dy/dx = −F<sub>x</sub>/F<sub>y</sub> = (ay − x<sup>2</sup>)/(y<sup>2</sup> − ax)."], ans: "(ay − x<sup>2</sup>)/(y<sup>2</sup> − ax)" },
    { q: "If z = x<sup>2</sup>y with x = t<sup>2</sup> and y = t<sup>3</sup>, find dz/dt by the chain rule and check directly.", steps: ["z<sub>x</sub> = 2xy, z<sub>y</sub> = x<sup>2</sup>, dx/dt = 2t, dy/dt = 3t<sup>2</sup>.", "dz/dt = 2xy(2t) + x<sup>2</sup>(3t<sup>2</sup>) = 4t<sup>6</sup> + 3t<sup>6</sup> = 7t<sup>6</sup>.", "Directly, z = t<sup>4</sup> · t<sup>3</sup> = t<sup>7</sup>, so dz/dt = 7t<sup>6</sup>."], ans: "7t<sup>6</sup>" },
  ],
  mistakes: ["Differentiating y as well as x. In f<sub>x</sub>, y is a constant.", "Using dy/dx = F<sub>x</sub>/F<sub>y</sub> and forgetting the minus sign.", "Applying Euler's theorem to a function that is not homogeneous."],
  check: [
    { q: "If f = x<sup>2</sup>y + y<sup>3</sup>, then f<sub>y</sub> equals", o: ["2xy", "x<sup>2</sup> + 3y<sup>2</sup>", "x<sup>2</sup> + y<sup>3</sup>", "2xy + 3y<sup>2</sup>"], a: 1, why: "Treat x as constant: derivative of x<sup>2</sup>y is x<sup>2</sup>, of y<sup>3</sup> is 3y<sup>2</sup>." },
    { q: "For f = x<sup>2</sup> + xy + y<sup>2</sup> (degree 2), x f<sub>x</sub> + y f<sub>y</sub> equals", o: ["f", "2f", "3f", "0"], a: 1, why: "Euler's theorem: n f with n = 2." },
    { q: "If F(x, y) = 0, then dy/dx equals", o: ["F<sub>x</sub>/F<sub>y</sub>", "−F<sub>x</sub>/F<sub>y</sub>", "F<sub>y</sub>/F<sub>x</sub>", "−F<sub>y</sub>/F<sub>x</sub>"], a: 1, why: "From dF = F<sub>x</sub> dx + F<sub>y</sub> dy = 0." },
  ],
  lab: { id: "surface", label: "See f<sub>x</sub> and f<sub>y</sub> on a 3D surface" },
};

export const maxmin2: Lesson = {
  intro: "A maximum or minimum of a surface is a hilltop or the bottom of a bowl. At such a point the surface is flat in every direction. The trick is to find every flat point first, then decide which kind each one is using second derivatives.",
  sections: [
    { h: "Step 1: stationary points", p: ["Solve f<sub>x</sub> = 0 and f<sub>y</sub> = 0 together. Every solution is a stationary point."] },
    { h: "Step 2: classify with r, s, t", p: ["At each stationary point, compute r = f<sub>xx</sub>, s = f<sub>xy</sub>, t = f<sub>yy</sub>. Then use rt − s<sup>2</sup>.", "Saddle points are neither: the surface rises in one direction and falls in another, like a mountain pass."], formula: ["rt − s<sup>2</sup> > 0 and r < 0  →  maximum", "rt − s<sup>2</sup> > 0 and r > 0  →  minimum", "rt − s<sup>2</sup> < 0  →  saddle point", "rt − s<sup>2</sup> = 0  →  test fails, need more work"] },
    { h: "Step 3: the value", p: ["Substitute the point back into f to find the maximum or minimum value."] },
  ],
  examples: [
    { q: "Find the extreme values of f = x<sup>3</sup> + y<sup>3</sup> − 3xy.", steps: ["f<sub>x</sub> = 3x<sup>2</sup> − 3y = 0 gives y = x<sup>2</sup>. f<sub>y</sub> = 3y<sup>2</sup> − 3x = 0 gives x = y<sup>2</sup> = x<sup>4</sup>, so x = 0 or 1. Points: (0, 0) and (1, 1).", "r = 6x, s = −3, t = 6y.", "At (0, 0): rt − s<sup>2</sup> = −9 < 0, a saddle point.", "At (1, 1): rt − s<sup>2</sup> = 36 − 9 = 27 > 0 and r = 6 > 0, so a minimum with f(1, 1) = 1 + 1 − 3 = −1."], ans: "Minimum −1 at (1, 1); saddle at (0, 0)" },
    { q: "Find the maximum of f = xy(a − x − y), a > 0.", steps: ["f<sub>x</sub> = y(a − 2x − y) = 0 and f<sub>y</sub> = x(a − x − 2y) = 0. For x, y ≠ 0: 2x + y = a and x + 2y = a, so x = y = a/3.", "r = −2y = −2a/3, s = a − 2x − 2y = −a/3, t = −2x = −2a/3.", "rt − s<sup>2</sup> = 4a<sup>2</sup>/9 − a<sup>2</sup>/9 = a<sup>2</sup>/3 > 0 and r < 0, so a maximum.", "Value: (a/3)(a/3)(a/3) = a<sup>3</sup>/27."], ans: "Maximum a<sup>3</sup>/27 at (a/3, a/3)" },
  ],
  mistakes: ["Forgetting to solve for all stationary points (missing (0, 0) above).", "Deciding max or min from rt − s<sup>2</sup> alone without checking the sign of r.", "Calling a saddle point a maximum or minimum.", "Reporting the point instead of the value, or the value instead of the point."],
  check: [
    { q: "At a stationary point, rt − s<sup>2</sup> > 0 and r < 0 means", o: ["minimum", "maximum", "saddle point", "no conclusion"], a: 1, why: "Positive determinant with negative r means the surface curves down in all directions." },
    { q: "If rt − s<sup>2</sup> < 0 the point is a", o: ["maximum", "minimum", "saddle point", "point of inflection"], a: 2, why: "The surface rises in one direction and falls in another." },
    { q: "f = x<sup>2</sup> + y<sup>2</sup> has stationary point (0, 0) which is a", o: ["maximum", "minimum", "saddle", "none"], a: 1, why: "r = 2, s = 0, t = 2, so rt − s<sup>2</sup> = 4 > 0 and r > 0." },
  ],
  lab: { id: "surface", label: "Explore maxima, minima and saddles in 3D" },
};

export const maxmin3: Lesson = {
  intro: "With three variables you cannot draw the graph, so you rely on algebra. The stationary point condition is the same as before, and the second derivative test uses a small table of second derivatives called the Hessian.",
  sections: [
    { h: "Stationary points", p: ["Solve f<sub>x</sub> = 0, f<sub>y</sub> = 0, f<sub>z</sub> = 0 together."] },
    { h: "The Hessian test", p: ["Build the symmetric matrix of second derivatives at the point and look at the determinants of its top-left blocks: Δ<sub>1</sub> = f<sub>xx</sub>, Δ<sub>2</sub> = f<sub>xx</sub>f<sub>yy</sub> − f<sub>xy</sub><sup>2</sup>, and Δ<sub>3</sub> = det H (the full determinant)."], formula: ["Minimum: Δ<sub>1</sub> > 0, Δ<sub>2</sub> > 0, Δ<sub>3</sub> > 0", "Maximum: Δ<sub>1</sub> < 0, Δ<sub>2</sub> > 0, Δ<sub>3</sub> < 0 (signs alternate)", "Any other pattern with Δ<sub>3</sub> ≠ 0: saddle point"] },
  ],
  examples: [
    { q: "Find the extreme value of f = x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> − 2x + 4y − 6z.", steps: ["f<sub>x</sub> = 2x − 2, f<sub>y</sub> = 2y + 4, f<sub>z</sub> = 2z − 6, so the point is (1, −2, 3).", "The Hessian is diag(2, 2, 2): Δ<sub>1</sub> = 2, Δ<sub>2</sub> = 4, Δ<sub>3</sub> = 8, all positive, so a minimum.", "f(1, −2, 3) = 1 + 4 + 9 − 2 − 8 − 18 = −14."], ans: "Minimum −14 at (1, −2, 3)" },
    { q: "Classify the stationary point of f = x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> + xy + yz + zx at the origin.", steps: ["The Hessian is [[2, 1, 1], [1, 2, 1], [1, 1, 2]].", "Δ<sub>1</sub> = 2; Δ<sub>2</sub> = 4 − 1 = 3; Δ<sub>3</sub> = 2(4 − 1) − 1(2 − 1) + 1(1 − 2) = 4.", "All positive: a minimum, with value 0."], ans: "Minimum 0 at the origin" },
  ],
  mistakes: ["Testing only Δ<sub>1</sub> and Δ<sub>2</sub> and skipping Δ<sub>3</sub>.", "Mixing up the sign patterns for maximum and minimum.", "Making arithmetic mistakes in the 3 × 3 determinant: write it out in full."],
  check: [
    { q: "For a minimum in three variables, the leading determinants Δ<sub>1</sub>, Δ<sub>2</sub>, Δ<sub>3</sub> must be", o: ["all positive", "all negative", "alternating starting negative", "zero"], a: 0, why: "A positive definite Hessian gives a minimum." },
    { q: "For a maximum, the signs of Δ<sub>1</sub>, Δ<sub>2</sub>, Δ<sub>3</sub> are", o: ["+ + +", "− + −", "− − −", "+ − +"], a: 1, why: "They alternate starting with a negative sign." },
    { q: "Stationary points of f(x, y, z) satisfy", o: ["f = 0", "f<sub>x</sub> = f<sub>y</sub> = f<sub>z</sub> = 0", "f<sub>xx</sub> = 0", "f<sub>x</sub> + f<sub>y</sub> + f<sub>z</sub> = 0"], a: 1, why: "All three first partial derivatives vanish together." },
  ],
};

export const lagrange: Lesson = {
  intro: "Often you want the biggest or smallest value of something while obeying a rule: the largest area with a fixed perimeter, or the cheapest box with a fixed volume. Lagrange's method turns such a constrained problem into ordinary stationary point equations.",
  sections: [
    { h: "The method", p: ["To find extreme values of f(x, y, z) subject to the condition φ(x, y, z) = 0, build the helper function F = f + λφ, where λ is a new unknown called the Lagrange multiplier.", "Set all partial derivatives of F to zero, together with the constraint, and solve for x, y, z and λ."], formula: ["F = f + λφ", "F<sub>x</sub> = 0, F<sub>y</sub> = 0, F<sub>z</sub> = 0, and φ = 0"] },
    { h: "Why it works", p: ["At a constrained extreme, the level curves of f touch the constraint curve without crossing it, so the gradients of f and φ point along the same line. λ is the proportionality factor."] },
    { h: "Tips", p: ["Often you can eliminate λ by dividing one equation by another. If there are several constraints, add one multiplier for each."] },
  ],
  examples: [
    { q: "Minimise x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> subject to x + y + z = 3.", steps: ["F = x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> + λ(x + y + z − 3).", "F<sub>x</sub> = 2x + λ = 0, F<sub>y</sub> = 2y + λ = 0, F<sub>z</sub> = 2z + λ = 0, so x = y = z = −λ/2.", "The constraint gives 3x = 3, so x = y = z = 1.", "Minimum value: 1 + 1 + 1 = 3."], ans: "3 at (1, 1, 1)" },
    { q: "Find the rectangle of largest area with perimeter P.", steps: ["Maximise A = xy subject to 2x + 2y = P. F = xy + λ(2x + 2y − P).", "F<sub>x</sub> = y + 2λ = 0 and F<sub>y</sub> = x + 2λ = 0, so x = y.", "Then 4x = P, so x = y = P/4: a square, with area P<sup>2</sup>/16."], ans: "A square of side P/4; area P<sup>2</sup>/16" },
    { q: "Maximise xyz subject to x + y + z = 6.", steps: ["F = xyz + λ(x + y + z − 6).", "F<sub>x</sub> = yz + λ = 0, F<sub>y</sub> = xz + λ = 0, F<sub>z</sub> = xy + λ = 0, so yz = xz = xy.", "For positive values, this means x = y = z, and the constraint gives 2 each."], ans: "Maximum 8 at (2, 2, 2)" },
  ],
  mistakes: ["Forgetting to use the constraint equation to find the values after solving the F equations.", "Writing the constraint with the wrong sign, or leaving it as φ = c instead of φ = 0.", "Not checking whether the point found is a maximum or a minimum. The method only finds candidates."],
  check: [
    { q: "The Lagrange function for maximising f subject to φ = 0 is", o: ["f − φ", "f + λφ", "fφ", "f/φ"], a: 1, why: "F = f + λφ, with λ the multiplier." },
    { q: "Minimum of x<sup>2</sup> + y<sup>2</sup> subject to x + y = 1 is", o: ["0", "1/2", "1", "2"], a: 1, why: "By symmetry x = y = 1/2, so the value is 1/4 + 1/4 = 1/2." },
    { q: "The number of unknowns to solve for with 3 variables and 1 constraint is", o: ["3", "4", "5", "1"], a: 1, why: "x, y, z and λ." },
  ],
  lab: { id: "surface", label: "See constrained extremes on a 3D surface" },
};
