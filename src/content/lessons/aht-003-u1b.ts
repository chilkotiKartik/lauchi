import type { Lesson } from "./types";

export const maclaurin: Lesson = {
  intro: "A Maclaurin series rewrites a smooth function as an infinite polynomial in x. Near x = 0, a few terms of the polynomial are already a very good copy of the function. That is how calculators compute sin, cos and e<sup>x</sup>, and it is also a quick way to evaluate hard limits.",
  sections: [
    { h: "The formula", p: ["If f has derivatives of all orders at 0, its Maclaurin series is built from the derivatives at 0. Each term uses one more derivative and one more factorial."], formula: ["f(x) = f(0) + x f′(0) + x<sup>2</sup>/2! f″(0) + x<sup>3</sup>/3! f‴(0) + …"] },
    { h: "Series to remember", p: ["These are worth learning by heart. Then you almost never need to differentiate."], formula: ["e<sup>x</sup> = 1 + x + x<sup>2</sup>/2! + x<sup>3</sup>/3! + …  (all x)", "sin x = x − x<sup>3</sup>/3! + x<sup>5</sup>/5! − …  (all x)", "cos x = 1 − x<sup>2</sup>/2! + x<sup>4</sup>/4! − …  (all x)", "ln(1 + x) = x − x<sup>2</sup>/2 + x<sup>3</sup>/3 − …  (−1 < x ≤ 1)", "(1 + x)<sup>n</sup> = 1 + nx + n(n − 1)/2! x<sup>2</sup> + …  (|x| < 1)", "1/(1 − x) = 1 + x + x<sup>2</sup> + …  (|x| < 1)"] },
    { h: "Building new series", p: ["You can add, multiply and substitute series, keeping only the terms up to the order you need. For example, the series for e<sup>−x<sup>2</sup></sup> comes from putting −x<sup>2</sup> in place of x in the series for e<sup>x</sup>."] },
  ],
  examples: [
    { q: "Expand e<sup>x</sup> sin x up to x<sup>3</sup>.", steps: ["e<sup>x</sup> ≈ 1 + x + x<sup>2</sup>/2 + x<sup>3</sup>/6 and sin x ≈ x − x<sup>3</sup>/6.", "Multiply and collect: x from 1·x; x<sup>2</sup> from x·x; x<sup>3</sup> from (x<sup>2</sup>/2)·x and 1·(−x<sup>3</sup>/6).", "x<sup>3</sup> coefficient: 1/2 − 1/6 = 1/3."], ans: "x + x<sup>2</sup> + x<sup>3</sup>/3 + …" },
    { q: "Evaluate lim<sub>x→0</sub> (x − sin x) / x<sup>3</sup>.", steps: ["sin x = x − x<sup>3</sup>/6 + x<sup>5</sup>/120 − …", "x − sin x = x<sup>3</sup>/6 − x<sup>5</sup>/120 + …", "Divide by x<sup>3</sup>: 1/6 − x<sup>2</sup>/120 + …, which tends to 1/6."], ans: "1/6" },
    { q: "Derive the series of ln(1 + x) from derivatives.", steps: ["f(x) = ln(1 + x), so f(0) = 0.", "f′ = 1/(1 + x), f″ = −1/(1 + x)<sup>2</sup>, f‴ = 2/(1 + x)<sup>3</sup>, so f′(0) = 1, f″(0) = −1, f‴(0) = 2.", "The pattern is f<sup>(n)</sup>(0) = (−1)<sup>n−1</sup>(n − 1)!, so each term is (−1)<sup>n−1</sup> x<sup>n</sup>/n."], ans: "x − x<sup>2</sup>/2 + x<sup>3</sup>/3 − …" },
  ],
  mistakes: ["Forgetting the factorial in the denominator.", "Using a series outside the range where it converges (for example ln(1 + x) with x = 3).", "Keeping too few terms when the leading terms cancel (as in x − sin x): keep one more order than seems necessary."],
  check: [
    { q: "The coefficient of x<sup>2</sup> in the Maclaurin series of e<sup>3x</sup> is", o: ["3", "9/2", "9", "3/2"], a: 1, why: "e<sup>3x</sup> = Σ (3x)<sup>n</sup>/n!, so the x<sup>2</sup> term is 9/2!." },
    { q: "The first two non-zero terms of cos x are", o: ["1 − x<sup>2</sup>/2", "1 − x<sup>2</sup>", "x − x<sup>3</sup>/6", "1 + x<sup>2</sup>/2"], a: 0, why: "cos x = 1 − x<sup>2</sup>/2! + x<sup>4</sup>/4! − …" },
    { q: "lim<sub>x→0</sub> (e<sup>x</sup> − 1 − x)/x<sup>2</sup> equals", o: ["0", "1/2", "1", "∞"], a: 1, why: "e<sup>x</sup> − 1 − x = x<sup>2</sup>/2 + x<sup>3</sup>/6 + …" },
  ],
};

export const taylor: Lesson = {
  intro: "Taylor's theorem does the same job as Maclaurin's, but around any point a instead of only 0. Use it when the function is easy to evaluate near a and you want values close to a.",
  sections: [
    { h: "The formula", p: ["Write x = a + h, where h is small. The polynomial matches f and its first n derivatives at a.", "The remainder tells you the error when you stop after n terms. In Lagrange's form it looks like the next term, but with the derivative evaluated at an unknown point c between a and x."], formula: ["f(x) = f(a) + (x − a) f′(a) + (x − a)<sup>2</sup>/2! f″(a) + (x − a)<sup>3</sup>/3! f‴(a) + …", "Remainder: R<sub>n</sub> = (x − a)<sup>n+1</sup>/(n + 1)! · f<sup>(n+1)</sup>(c),  c between a and x", "Setting a = 0 gives Maclaurin's series"] },
    { h: "Choosing a", p: ["To approximate f near a point, choose a as the nearby point where f and its derivatives are easy. To approximate √26, use a = 25, not a = 0."] },
  ],
  examples: [
    { q: "Expand ln x in powers of (x − 1) up to (x − 1)<sup>3</sup>.", steps: ["f(1) = 0, f′ = 1/x → 1, f″ = −1/x<sup>2</sup> → −1, f‴ = 2/x<sup>3</sup> → 2.", "Substitute into the formula: (x − 1) − (x − 1)<sup>2</sup>/2! + 2(x − 1)<sup>3</sup>/3!."], ans: "(x − 1) − (x − 1)<sup>2</sup>/2 + (x − 1)<sup>3</sup>/3" },
    { q: "Expand sin x about x = π/2 up to the fourth power.", steps: ["f(π/2) = 1, f′ = cos x → 0, f″ = −sin x → −1, f‴ = −cos x → 0, f⁗ = sin x → 1.", "Odd-order terms vanish."], ans: "1 − (x − π/2)<sup>2</sup>/2! + (x − π/2)<sup>4</sup>/4!" },
    { q: "Estimate √26 using Taylor's theorem about a = 25 (two terms after the first).", steps: ["f(x) = √x, f(25) = 5, f′ = 1/(2√x) = 0.1, f″ = −1/(4x<sup>3/2</sup>) = −1/500.", "With h = 1: 5 + 0.1·1 + (−1/500)·1/2.", "5 + 0.1 − 0.001 = 5.099. The true value is 5.09902."], ans: "≈ 5.099" },
  ],
  mistakes: ["Using powers of x instead of (x − a).", "Mis-evaluating derivatives at a (not at 0).", "Forgetting that the remainder is an error bound, not part of the answer."],
  check: [
    { q: "Taylor's series about x = a with a = 0 is called", o: ["Fourier series", "Maclaurin series", "Laurent series", "binomial series"], a: 1, why: "Maclaurin is the special case a = 0." },
    { q: "Expanding e<sup>x</sup> about a = 1, the first two terms are", o: ["1 + x", "e + e(x − 1)", "1 + (x − 1)", "e + (x − 1)"], a: 1, why: "f(1) = f′(1) = e, so f ≈ e + e(x − 1)." },
    { q: "The Lagrange remainder R<sub>n</sub> involves the derivative of order", o: ["n − 1", "n", "n + 1", "2n"], a: 2, why: "R<sub>n</sub> uses f<sup>(n+1)</sup>(c)." },
  ],
};

export const taylor2: Lesson = {
  intro: "Functions of two variables have a Taylor series too. Instead of a curve, you approximate a surface near a point (a, b) with a plane, then a curved correction. This is the tool behind the second-derivative test for maxima and minima.",
  sections: [
    { h: "The formula", p: ["Move from (a, b) to (a + h, b + k). The first-order terms give the tangent plane, and the second-order terms add the curvature.", "All the partial derivatives are evaluated at (a, b)."], formula: ["f(a + h, b + k) = f + (h f<sub>x</sub> + k f<sub>y</sub>) + (1/2!)(h<sup>2</sup> f<sub>xx</sub> + 2hk f<sub>xy</sub> + k<sup>2</sup> f<sub>yy</sub>) + …"] },
    { h: "Expanding about a point other than the origin", p: ["Put h = x − a and k = y − b to get a series in (x − a) and (y − b). About the origin, h = x and k = y."] },
  ],
  examples: [
    { q: "Expand f(x, y) = e<sup>x</sup> sin y about (0, 0) up to second degree.", steps: ["f = e<sup>x</sup> sin y → 0; f<sub>x</sub> = e<sup>x</sup> sin y → 0; f<sub>y</sub> = e<sup>x</sup> cos y → 1.", "f<sub>xx</sub> → 0; f<sub>xy</sub> = e<sup>x</sup> cos y → 1; f<sub>yy</sub> = −e<sup>x</sup> sin y → 0.", "f ≈ 0 + (x·0 + y·1) + ½(2xy·1) = y + xy."], ans: "y + xy + …" },
    { q: "Use a second-degree expansion of f(x, y) = x<sup>y</sup> about (1, 1) to estimate (1.02)<sup>1.03</sup>.", steps: ["At (1, 1): f = 1, f<sub>x</sub> = y x<sup>y−1</sup> = 1, f<sub>y</sub> = x<sup>y</sup> ln x = 0.", "f<sub>xx</sub> = y(y − 1)x<sup>y−2</sup> = 0, f<sub>xy</sub> = x<sup>y−1</sup>(1 + y ln x) = 1, f<sub>yy</sub> = x<sup>y</sup>(ln x)<sup>2</sup> = 0.", "With h = 0.02 and k = 0.03: f ≈ 1 + 0.02 + ½(2 · 0.02 · 0.03 · 1) = 1.0206."], ans: "≈ 1.0206 (true value 1.02061)" },
  ],
  mistakes: ["Forgetting the factor 2 on the mixed term 2hk f<sub>xy</sub>.", "Evaluating partial derivatives at (x, y) rather than at (a, b).", "Mixing up h and k."],
  check: [
    { q: "In the second-order term, the mixed derivative appears as", o: ["hk f<sub>xy</sub>", "2hk f<sub>xy</sub>", "h<sup>2</sup> f<sub>xy</sub>", "k f<sub>xy</sub>"], a: 1, why: "The two mixed partials f<sub>xy</sub> = f<sub>yx</sub> combine to 2hk f<sub>xy</sub>." },
    { q: "The first-order part of the expansion is the equation of the", o: ["tangent plane", "normal line", "level curve", "gradient"], a: 0, why: "f + h f<sub>x</sub> + k f<sub>y</sub> is the tangent plane at (a, b)." },
    { q: "Expanding about the origin, h and k equal", o: ["a and b", "x and y", "f<sub>x</sub> and f<sub>y</sub>", "0 and 0"], a: 1, why: "With (a, b) = (0, 0), h = x and k = y." },
  ],
  lab: { id: "surface", label: "Open the 3D surface lab" },
};
