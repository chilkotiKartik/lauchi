import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Maths I labs: default, then allowed range. Presets, saved setups and share links are clamped to these. */
export const MATHI_SPECS = {
  taylor2var: { fn: opt("exsiny", ["exsiny", "exlog", "sinxcosy"] as const), n: num(3, 1, 6), x: num(0.8, -1.5, 1.5), y: num(0.6, -0.9, 1.5) },
  partialeuler: { fn: opt("h2", ["h2", "h3", "root", "ratio", "zero", "nonh"] as const), px: num(1.5, 0.2, 3), py: num(1, 0.2, 3), t: num(1.5, 0.5, 2.5) },
  lagrangemult: { mode: opt("plane", ["plane", "sphere"] as const), a: num(1, -13, 13), b: num(2, -13, 13), c: num(2, -13, 13), p: num(9, -30, 30), R: num(2, 0.5, 8), r: num(2, 0, 10) },
  reverseorder: { id: opt("sin", ["sin", "exp", "pyq", "quarter"] as const), order: opt("dydx", ["dydx", "dxdy"] as const), n: num(6, 2, 40) },
  betagamma: { view: opt("beta", ["beta", "sincos"] as const), m: num(2, 0.5, 6), n: num(3, 0.5, 6) },
  curvetrace: { curve: opt("strophoid", ["strophoid", "folium", "cissoid", "astroid"] as const), a: num(1.5, 0.5, 2.5), show: num(1, 0.05, 1) },
  jacobian: { map: opt("polar", ["polar", "ellipse", "shear", "ux", "hyper"] as const), u0: num(1.5, 0.5, 3), v0: num(0.8, 0.2, 3), du: num(0.4, 0.05, 1), dv: num(0.4, 0.05, 1) },
  errorapprox: { fn: opt("par", ["par", "cyl", "box", "rect"] as const), x: num(20, 0.5, 100), y: num(30, 0.5, 100), z: num(60, 0.5, 100), ex: num(1.2, 0, 10), ey: num(1.2, 0, 10), ez: num(1.2, 0, 10) },
  centroid: { shape: opt("tri", ["tri", "semi", "rect", "quarter"] as const), rho: opt("lin", ["uniform", "lin", "height"] as const), px: num(1, -1, 4), py: num(1, -1, 4.5) },
  revcurves: { curve: opt("astroid", ["astroid", "cycloid", "circle", "loop"] as const), a: num(1, 0.5, 2.5), sweep: num(360, 0, 360) },
  gradient: { phi: opt("f1", ["f1", "f2", "f3", "f4"] as const), px: num(1, -3, 3), py: num(-2, -3, 3), pz: num(1, -3, 3), dx: num(2, -3, 3), dy: num(-1, -3, 3), dz: num(-2, -3, 3) },
  divcurl3d: { field: opt("poly", ["radial", "yzx", "mix", "rot", "src", "poly"] as const), px: num(1, -2, 2), py: num(1, -2, 2), pz: num(1, -2, 2) },
  lineintegral: { field: opt("cons", ["cons", "rot", "mix"] as const), bx: num(1, 0.5, 2), by: num(1, 0.5, 2), k: num(2, 1, 3), loop: flag(false) },
  gaussflux: { field: opt("pyq1", ["pyq1", "pyq2", "rad", "const"] as const), a: num(1, 0.5, 3), b: num(1, 0.5, 3), c: num(1, 0.5, 3) },
  stokesloop: { field: opt("pyq1", ["pyq1", "pyq2", "rot", "grad"] as const), a: num(1, 0.5, 3), b: num(2, 0.5, 3), tilt: num(0, 0, 80) },
  planes3: { sys: opt("pyq2", ["pyq1", "pyq2", "unique"] as const), lam: num(6, -5, 12), mu: num(26, -10, 40) },
  rowreduce: { mat: opt("rk1", ["rk1", "rk3", "sys1", "sys2", "sys3"] as const), mode: opt("echelon", ["echelon", "gj"] as const), step: num(0, 0, 30) },
  caleyham: { mat: opt("m33a", ["m33a", "m33b", "m22a", "m22b", "custom"] as const), k: num(3, 0, 12), a: num(2, -4, 4), b: num(1, -4, 4), c: num(1, -4, 4), d: num(3, -4, 4) },
  diagonalize: { a: num(4, -4, 4), b: num(1, -4, 4), c: num(2, -4, 4), d: num(3, -4, 4), n: num(3, 0, 8), ang: num(30, 0, 360) },
  eigen3d: { mat: opt("sym1", ["sym1", "tri", "sym2", "ch33"] as const), k: num(1, 0.5, 2), t: num(1, 0, 1) },
} satisfies Record<string, ParamSpec>;
