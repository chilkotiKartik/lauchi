import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Web Development 301 and 401 labs. */
export const WEBB_SPECS = {
  rerender: { depth: num(3, 1, 4), branch: num(3, 1, 4), level: num(0, 0, 4), memo: flag(false) },
  statebatch: { clicks: num(5, 1, 10), sets: num(3, 1, 5), mode: opt("direct", ["direct", "updater"] as const), batch: flag(true) },
  effectdeps: { renders: num(20, 5, 40), every: num(4, 1, 10), mode: opt("dep", ["none", "empty", "dep", "object"] as const) },
  router: { page: num(2, 1, 50), size: num(10, 5, 50), total: num(95, 0, 500), pattern: opt("user", ["user", "userpost", "files", "about"] as const), url: opt("u42", ["u42", "u42p7", "users", "fileab", "about", "aboutslash"] as const) },
  typesets: { bools: num(3, 1, 8), valid: num(3, 1, 10) },
  reducer: { step: num(10, 0, 40), n: num(20, 5, 40), add: num(60, 20, 90) },
  backoff: { base: num(100, 50, 2000), factor: num(2, 1, 4), attempts: num(5, 1, 10), cap: num(10000, 500, 60000), fail: num(50, 0, 100) },
  contrast: { fr: num(118, 0, 255), fg: num(118, 0, 255), fb: num(118, 0, 255), br: num(255, 0, 255), bg: num(255, 0, 255), bb: num(255, 0, 255) },
  codesplit: { routes: num(8, 2, 12), routeKB: num(100, 20, 500), vendor: num(300, 50, 1000), visited: num(3, 1, 12), mbps: num(8, 1, 100) },
  gitgraph: { f: num(4, 1, 6), m0: num(3, 1, 6), m1: num(2, 0, 6), strategy: opt("merge", ["merge", "squash", "rebase"] as const) },
  bundle: { mods: num(200, 10, 500), kb: num(8, 1, 50), used: num(40, 10, 100), minify: num(60, 30, 90), gzip: num(30, 15, 50) },
  vlq: { n: num(16, -1000, 1000) },
  testpyramid: { unit: num(200, 0, 500), integ: num(20, 0, 200), e2e: num(10, 0, 100) },
  cicd: { e2e: num(7, 1, 30), unitFail: num(8, 0, 40), e2eFail: num(10, 0, 40), cache: flag(false), parallel: flag(false) },
  canary: { rps: num(1000, 100, 10000), roll: num(5, 1, 100), err: num(20, 1, 100), detect: num(5, 1, 30), staging: num(50, 0, 100) },
  layers: { base: num(80, 5, 500), tools: num(200, 0, 800), deps: num(150, 0, 800), app: num(20, 1, 200), changed: opt("app", ["app", "deps", "base"] as const), multi: flag(false) },
  plural: { n: num(1, 0, 100), lang: opt("ru", ["en", "fr", "ru", "pl", "ar", "ja"] as const) },
} satisfies Record<string, ParamSpec>;
