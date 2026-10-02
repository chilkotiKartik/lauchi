import type { Lesson } from "./types";

export const limit: Lesson = {
  intro: "A limit answers one question: as x gets closer and closer to a, what value does f(x) get closer and closer to? The value of f at a itself does not matter, and f does not even have to be defined there. Every derivative and every integral you will meet is built on this idea.",
  sections: [
    { h: "The idea", p: ["Write lim<sub>x→a</sub> f(x) = L when f(x) can be made as close to L as you like by taking x close enough to a (but x ≠ a). The limit exists only if you get the same answer approaching from the left and from the right.", "Left limit: lim<sub>x→a−</sub> f(x). Right limit: lim<sub>x→a+</sub> f(x). The limit exists exactly when both exist and are equal."] },
    { h: "Limit laws", p: ["If both limits exist, limits of sums, differences, products and quotients (denominator limit ≠ 0) are the sums, differences, products and quotients of the limits. For a polynomial or any function that is continuous at a, just substitute x = a."] },
    { h: "Standard limits to memorise", p: ["These appear again and again in exams. They all come from Maclaurin series, which you will see in a later topic."], formula: ["lim<sub>x→0</sub> sin x / x = 1 and lim<sub>x→0</sub> tan x / x = 1 (x in radians)", "lim<sub>x→0</sub> (1 − cos x) / x<sup>2</sup> = 1/2", "lim<sub>x→0</sub> (e<sup>x</sup> − 1) / x = 1 and lim<sub>x→0</sub> ln(1 + x) / x = 1", "lim<sub>x→0</sub> (a<sup>x</sup> − 1) / x = ln a", "lim<sub>x→0</sub> (1 + x)<sup>1/x</sup> = e and lim<sub>x→∞</sub> (1 + k/x)<sup>x</sup> = e<sup>k</sup>"] },
    { h: "Indeterminate forms and L'Hôpital's rule", p: ["Substituting can give 0/0 or ∞/∞. These are not answers, they mean more work is needed. First try to factorise and cancel. If that fails, L'Hôpital's rule says: for 0/0 or ∞/∞, lim f/g = lim f′/g′, provided the second limit exists. You may apply it repeatedly, checking the form each time.", "Other forms (0·∞, ∞ − ∞, 1<sup>∞</sup>, 0<sup>0</sup>, ∞<sup>0</sup>) are first rewritten as a quotient, or by taking logarithms, and then treated the same way."] },
  ],
  examples: [
    { q: "Find lim<sub>x→0</sub> sin 3x / x.", steps: ["Substituting gives 0/0, so rewrite to use sin u / u → 1.", "sin 3x / x = 3 · (sin 3x / 3x).", "As x → 0, 3x → 0, so sin 3x / 3x → 1."], ans: "3" },
    { q: "Find lim<sub>x→0</sub> (e<sup>x</sup> − 1 − x) / x<sup>2</sup>.", steps: ["At x = 0 the form is 0/0, so use L'Hôpital.", "Differentiate top and bottom: (e<sup>x</sup> − 1) / 2x. Still 0/0.", "Apply again: e<sup>x</sup> / 2. Now substitute x = 0: 1/2."], ans: "1/2" },
    { q: "Find lim<sub>x→∞</sub> (1 + 2/x)<sup>x</sup>.", steps: ["This is the form 1<sup>∞</sup>, matching lim (1 + k/x)<sup>x</sup> with k = 2.", "The result is e<sup>k</sup>."], ans: "e<sup>2</sup>" },
  ],
  mistakes: ["Using L'Hôpital when the form is not 0/0 or ∞/∞. Always substitute first.", "Differentiating the whole fraction with the quotient rule instead of top and bottom separately.", "Using sin x / x → 1 with x in degrees. It only works in radians.", "Thinking the limit is f(a). The limit can exist even when f(a) is undefined."],
  check: [
    { q: "lim<sub>x→1</sub> (x<sup>2</sup> − 1) / (x − 1) equals", o: ["0", "1", "2", "does not exist"], a: 2, why: "Factorise: (x − 1)(x + 1)/(x − 1) = x + 1 → 2." },
    { q: "lim<sub>x→0</sub> (1 − cos x) / x<sup>2</sup> equals", o: ["0", "1/2", "1", "2"], a: 1, why: "It is a standard limit. Using L'Hôpital twice: sin x / 2x → 1/2." },
    { q: "Which form allows L'Hôpital's rule directly?", o: ["1/0", "0/0", "5/0", "0 · 5"], a: 1, why: "Only 0/0 or ∞/∞ (quotients) can use it directly." },
  ],
};

export const continuity: Lesson = {
  intro: "A function is continuous if you can draw its graph without lifting your pen. Differentiable means the graph is also smooth: no corners, no cusps and no vertical tangents. Every differentiable function is continuous, but the reverse is false, and this is a favourite exam question.",
  sections: [
    { h: "Continuity at a point", p: ["f is continuous at x = a when three things hold: f(a) is defined, lim<sub>x→a</sub> f(x) exists, and the two are equal.", "Discontinuities come in kinds. Removable: the limit exists but differs from f(a) or f(a) is missing. Jump: left and right limits both exist but differ. Infinite: the function blows up."], formula: ["Continuous at a ⇔ lim<sub>x→a−</sub> f(x) = lim<sub>x→a+</sub> f(x) = f(a)"] },
    { h: "Differentiability", p: ["The derivative at a is the limit of the slope of secant lines. f is differentiable at a when this limit exists, meaning the left-hand derivative (LHD) equals the right-hand derivative (RHD)."], formula: ["f′(a) = lim<sub>h→0</sub> [f(a + h) − f(a)] / h", "Differentiable at a ⇔ LHD = RHD (both finite)"] },
    { h: "How they connect", p: ["Differentiable at a ⇒ continuous at a. To see why: f(a + h) − f(a) = h · [f(a + h) − f(a)]/h, and as h → 0 this is 0 · f′(a) = 0.", "The converse fails. f(x) = |x| is continuous at 0, but its graph has a corner, so the left and right slopes are −1 and +1."] },
  ],
  examples: [
    { q: "For what k is f(x) = (x<sup>2</sup> − 4)/(x − 2) for x ≠ 2, f(2) = k, continuous at x = 2?", steps: ["For x ≠ 2, f(x) = (x − 2)(x + 2)/(x − 2) = x + 2.", "So lim<sub>x→2</sub> f(x) = 4.", "Continuity needs f(2) = 4."], ans: "k = 4" },
    { q: "Show f(x) = |x| is not differentiable at 0.", steps: ["RHD = lim<sub>h→0+</sub> (|h| − 0)/h = h/h = 1.", "LHD = lim<sub>h→0−</sub> |h|/h = −h/h = −1.", "LHD ≠ RHD, so f′(0) does not exist, even though f is continuous at 0."], ans: "Not differentiable at 0" },
    { q: "Find a and b so that f(x) = x<sup>2</sup> for x ≤ 1 and ax + b for x > 1 is differentiable at x = 1.", steps: ["Continuity at 1: 1 = a + b.", "Slopes match: derivative of x<sup>2</sup> at 1 is 2, so a = 2.", "Then b = 1 − a = −1."], ans: "a = 2, b = −1" },
  ],
  mistakes: ["Checking only that the left and right limits agree and forgetting to compare with f(a).", "Claiming continuity implies differentiability.", "Forgetting that for a piecewise function, differentiability needs continuity first and then equal slopes."],
  check: [
    { q: "If f is differentiable at a, then f is", o: ["continuous at a", "discontinuous at a", "constant near a", "not necessarily continuous"], a: 0, why: "Differentiability implies continuity." },
    { q: "f(x) = |x − 3| at x = 3 is", o: ["continuous and differentiable", "continuous but not differentiable", "differentiable but not continuous", "neither"], a: 1, why: "There is a corner at x = 3, but no break in the graph." },
    { q: "A jump discontinuity means", o: ["the limit is infinite", "left and right limits exist but differ", "the limit exists but f(a) is different", "f is not defined anywhere"], a: 1, why: "Both one-sided limits are finite but unequal." },
  ],
};

export const rolle: Lesson = {
  intro: "Rolle's theorem says something you can see: if a smooth curve starts and ends at the same height, then somewhere in between it must level off. The tangent there is horizontal. It is the seed from which the mean value theorems grow.",
  sections: [
    { h: "Statement", p: ["Let f be (1) continuous on the closed interval [a, b], (2) differentiable on the open interval (a, b), and (3) f(a) = f(b). Then there is at least one point c in (a, b) with f′(c) = 0."], formula: ["f continuous on [a, b], differentiable on (a, b), f(a) = f(b)  ⇒  ∃ c ∈ (a, b): f′(c) = 0"] },
    { h: "Why it is true", p: ["A continuous function on [a, b] reaches a maximum and a minimum. If both happen at the endpoints, f is constant and f′ = 0 everywhere. Otherwise one of them is inside the interval, and at an interior extreme point of a differentiable function the slope must be 0."] },
    { h: "All three conditions matter", p: ["Drop one and the theorem can fail. f(x) = |x| on [−1, 1] has f(−1) = f(1) but no horizontal tangent, because it is not differentiable at 0. Always check the conditions before you apply the theorem in an answer."] },
    { h: "A useful consequence", p: ["Between any two roots of a differentiable function there is a root of its derivative. So if a polynomial has n real roots, its derivative has at least n − 1."] },
  ],
  examples: [
    { q: "Verify Rolle's theorem for f(x) = x<sup>2</sup> − 4x + 3 on [1, 3] and find c.", steps: ["f is a polynomial, so continuous and differentiable everywhere.", "f(1) = 1 − 4 + 3 = 0 and f(3) = 9 − 12 + 3 = 0, so f(1) = f(3).", "f′(x) = 2x − 4 = 0 gives x = 2, which lies in (1, 3)."], ans: "c = 2" },
    { q: "Verify Rolle's theorem for f(x) = x(x + 3)e<sup>−x/2</sup> on [−3, 0].", steps: ["f(−3) = 0 and f(0) = 0, and f is smooth, so the conditions hold.", "f′(x) = e<sup>−x/2</sup> [ (2x + 3) − x(x + 3)/2 ].", "Setting the bracket to 0 and multiplying by 2: 4x + 6 − x<sup>2</sup> − 3x = 0, so x<sup>2</sup> − x − 6 = 0.", "x = 3 or x = −2. Only −2 lies in (−3, 0)."], ans: "c = −2" },
  ],
  mistakes: ["Forgetting to verify f(a) = f(b).", "Applying it on an interval where f is not differentiable at some interior point (like |x|).", "Giving a value of c that is outside the open interval."],
  check: [
    { q: "Rolle's theorem needs which conditions on f?", o: ["continuous on [a, b] only", "continuous on [a, b], differentiable on (a, b), f(a) = f(b)", "differentiable on [a, b] only", "f(a) ≠ f(b)"], a: 1, why: "All three conditions are required." },
    { q: "For f(x) = x<sup>2</sup> on [−2, 2], the value of c is", o: ["−1", "0", "1", "2"], a: 1, why: "f(−2) = f(2) = 4 and f′(c) = 2c = 0, so c = 0." },
    { q: "Why does Rolle's theorem fail for f(x) = |x| on [−1, 1]?", o: ["f is not continuous", "f(−1) ≠ f(1)", "f is not differentiable at 0", "the interval is too small"], a: 2, why: "There is a corner at x = 0, so condition 2 fails." },
  ],
};

export const mvt: Lesson = {
  intro: "The mean value theorem says that somewhere between two points, the instantaneous slope equals the average slope. If your average speed on a trip was 60 km/h, at some moment your speedometer read exactly 60. Rolle's theorem is the special case where the average slope is 0.",
  sections: [
    { h: "Lagrange's mean value theorem", p: ["If f is continuous on [a, b] and differentiable on (a, b), there is c in (a, b) with f′(c) equal to the slope of the chord joining (a, f(a)) and (b, f(b))."], formula: ["f(b) − f(a) = (b − a) f′(c),  a < c < b", "Equivalent form: f(a + h) = f(a) + h f′(a + θh),  0 < θ < 1"] },
    { h: "Cauchy's mean value theorem", p: ["For two functions f and g, both continuous on [a, b] and differentiable on (a, b), with g′(x) ≠ 0 on (a, b), the ratio of the changes equals the ratio of the derivatives at some common point c. Lagrange's theorem is the case g(x) = x."], formula: ["[f(b) − f(a)] / [g(b) − g(a)] = f′(c) / g′(c),  a < c < b"] },
    { h: "What it is used for", p: ["Proving inequalities (bound f′(c) between two values), showing that a function with f′ = 0 is constant, and showing that f′ > 0 means f is increasing."] },
  ],
  examples: [
    { q: "Find c for f(x) = x<sup>2</sup> on [1, 3] (Lagrange).", steps: ["Average slope = (9 − 1)/(3 − 1) = 4.", "f′(c) = 2c = 4, so c = 2, inside (1, 3)."], ans: "c = 2" },
    { q: "Show that x/(1 + x) < ln(1 + x) < x for x > 0.", steps: ["Apply Lagrange to f(t) = ln(1 + t) on [0, x]: ln(1 + x) − 0 = x · 1/(1 + c) for some 0 < c < x.", "Since 0 < c < x, we have 1/(1 + x) < 1/(1 + c) < 1.", "Multiply by x: x/(1 + x) < ln(1 + x) < x."], ans: "Proved" },
    { q: "Verify Cauchy's theorem for f(x) = x<sup>2</sup>, g(x) = x<sup>3</sup> on [1, 2] and find c.", steps: ["Left side: (4 − 1)/(8 − 1) = 3/7.", "Right side: f′(c)/g′(c) = 2c / 3c<sup>2</sup> = 2/(3c).", "Set 2/(3c) = 3/7, so c = 14/9 ≈ 1.556, which lies in (1, 2)."], ans: "c = 14/9" },
  ],
  mistakes: ["Assuming c is the midpoint of the interval. It usually is not (only for quadratics).", "Forgetting that the theorem only promises that such a c exists, not how many.", "In Cauchy's theorem, dividing by g′ without checking that g′(x) ≠ 0."],
  check: [
    { q: "For f(x) = ln x on [1, e], Lagrange's c satisfies", o: ["c = 1", "c = e − 1", "c = e/2", "c = 2"], a: 1, why: "Average slope = (1 − 0)/(e − 1); f′(c) = 1/c, so c = e − 1 ≈ 1.72, inside (1, e)." },
    { q: "Lagrange's theorem is Cauchy's theorem with g(x) equal to", o: ["1", "x", "x<sup>2</sup>", "e<sup>x</sup>"], a: 1, why: "With g(x) = x we have g(b) − g(a) = b − a and g′ = 1." },
    { q: "If f′(x) = 0 for all x in an interval, the mean value theorem shows that f is", o: ["increasing", "decreasing", "constant", "periodic"], a: 2, why: "f(b) − f(a) = (b − a) · 0 = 0 for every pair of points." },
  ],
};
