import type { LabMeta } from "../types";

/** 3D labs for Web Development 301 (React and TypeScript) and 401 (production). */
export const WEBB_LABS: LabMeta[] = [
  { id: "rerender", title: "Which components re-render?", where: [["WD-301", 1]], blurb: "A tree of React components: change state at one level and see which components render again, with and without React.memo.", topics: ["React components", "State", "Re-rendering", "React.memo"], animated: false,
    presets: [
      { name: "State at the root", note: "State at the top of a 3-level tree with 3 children each re-renders all 40 components, because every child renders again with its parent.", values: { depth: 3, branch: 3, level: 0, memo: false } },
      { name: "State one level down", note: "Moving the state to a level-1 component re-renders only its own subtree: 1 + 3 + 9 = 13 of 40. Keep state close to where it is used.", values: { depth: 3, branch: 3, level: 1, memo: false } },
      { name: "React.memo on children", note: "With memo on, the changed component renders but its children skip because their props did not change: 1 of 40, saving 97.5%.", values: { depth: 3, branch: 3, level: 0, memo: true } },
    ] },
  { id: "statebatch", title: "State updates in one click", where: [["WD-301", 2]], blurb: "Call the state setter several times in one click. See why setCount(count + 1) loses updates, how the updater form keeps them, and what batching saves.", topics: ["useState", "Updater functions", "Batching", "Callbacks"], animated: false,
    presets: [
      { name: "setCount(count + 1) ×3", note: "Each of the three calls in a click reads the same stale count, so a click adds only 1: after 5 clicks the count is 5 and 10 updates were lost.", values: { clicks: 5, sets: 3, mode: "direct", batch: true } },
      { name: "setCount(c => c + 1) ×3", note: "The updater form gets the latest value each time, so a click adds 3: 5 clicks give 15 and nothing is lost, with still only 5 renders.", values: { clicks: 5, sets: 3, mode: "updater", batch: true } },
      { name: "Without batching", note: "If every setState rendered on its own (as in old React outside event handlers) 5 clicks would cost 15 renders instead of 5.", values: { clicks: 5, sets: 3, mode: "updater", batch: false } },
    ] },
  { id: "effectdeps", title: "How often does an effect run?", where: [["WD-301", 3]], blurb: "Watch a timeline of renders and see on which ones useEffect runs for no array, an empty array, a dependency, or an object made fresh each render.", topics: ["useEffect", "Dependency array", "Cleanup", "Common pitfalls"], animated: false,
    presets: [
      { name: "Empty array []", note: "An empty dependency array runs the effect once after the first render: 1 run in 20 renders, 19 skipped.", values: { renders: 20, every: 4, mode: "empty" } },
      { name: "No array at all", note: "Without a dependency array the effect runs after every single render: 20 runs in 20 renders.", values: { renders: 20, every: 4, mode: "none" } },
      { name: "[count] changing every 4th render", note: "The effect runs only when the dependency changes: on renders 1, 5, 9, 13 and 17, that is 5 of 20.", values: { renders: 20, every: 4, mode: "dep" } },
      { name: "A new object in the array", note: "A fresh object or function on each render is never equal to the last, so the effect re-runs every time: a classic pitfall fixed with useMemo or useCallback.", values: { renders: 20, every: 4, mode: "object" } },
    ] },
  { id: "router", title: "Client-side routes and query paging", where: [["WD-301", 4]], blurb: "Match a URL against a route pattern, see the path parameters, and turn the page and page-size query parameters into an offset.", topics: ["Client-side routing", "Path parameters", "Query parameters", "Pagination"], animated: false,
    presets: [
      { name: "Path parameter", note: "/users/:id matches /users/42 and gives id = 42. The colon marks a variable segment.", values: { page: 2, size: 10, total: 95, pattern: "user", url: "u42" } },
      { name: "Nested route", note: "/users/:id/posts/:postId matches /users/42/posts/7 with two parameters, id = 42 and postId = 7.", values: { page: 3, size: 20, total: 95, pattern: "userpost", url: "u42p7" } },
      { name: "No match", note: "/users has no id segment, so /users/:id does not match it. A router would fall through to the next route or a not-found page.", values: { page: 1, size: 10, total: 95, pattern: "user", url: "users" } },
      { name: "Last page", note: "Page 10 with 10 per page and 95 items starts at offset 90 and shows the last 5 items; there is no next page.", values: { page: 10, size: 10, total: 95, pattern: "files", url: "fileab" } },
    ] },
  { id: "typesets", title: "Types shrink the state space", where: [["WD-301", 5]], blurb: "Three separate booleans allow 8 combinations but only a few make sense. A union type lists just the legal states. See the impossible ones disappear.", topics: ["Union types", "Discriminated unions", "Type safety", "Impossible states"], animated: false,
    presets: [
      { name: "loading, error, data flags", note: "Three booleans give 8 states but only 3 are meaningful (loading, error, success); 5 are impossible, such as loading and error at once.", values: { bools: 3, valid: 3 } },
      { name: "Two flags, three states", note: "Two booleans give 4 combinations for 3 real states, so one combination is still illegal.", values: { bools: 2, valid: 3 } },
      { name: "Eight flags", note: "Eight booleans give 256 combinations; if only 4 are legal, 252 (98.4%) are bugs waiting to happen. A union of four tags removes them all.", values: { bools: 8, valid: 4 } },
    ] },
  { id: "reducer", title: "A reducer replays its actions", where: [["WD-301", 6]], blurb: "A shopping cart changed only by dispatching actions. Step through a log of add, remove and clear actions and see that the same log always gives the same state.", topics: ["Reducer pattern", "useReducer", "Actions", "Pure functions"], animated: false,
    presets: [
      { name: "Empty cart", note: "Before any action the state is empty: no items and a total of 0. The reducer starts from this initial state.", values: { step: 0, n: 20, add: 60 } },
      { name: "After 10 actions", note: "Replaying 10 actions (adds, removes and a clear) leaves 2 items, 14 and 27, for a total of 41. Replaying again gives exactly the same result.", values: { step: 10, n: 20, add: 60 } },
      { name: "Add-heavy log", note: "With 90% of the actions adds, 20 actions leave 16 items worth 588 in total.", values: { step: 20, n: 20, add: 90 } },
    ] },
  { id: "backoff", title: "Retrying an API call", where: [["WD-301", 7]], blurb: "When a call to a server fails, wait longer before each retry. Set the start delay, growth factor, cap and failure rate and see the waits and the odds.", topics: ["APIs", "Retries", "Exponential backoff", "Error handling"], animated: false,
    presets: [
      { name: "Classic doubling", note: "100 ms doubling each time waits 100, 200, 400 and 800 ms (1.5 s at worst). At 50% failure, all 5 attempts fail only 3.1% of the time.", values: { base: 100, factor: 2, attempts: 5, cap: 10000, fail: 50 } },
      { name: "Capped at 5 seconds", note: "Tripling from 1 s would reach 27 s, but the cap holds each wait to 5 s: waits of 1, 3, 5, 5 and 5 seconds, 19 s in the worst case.", values: { base: 1000, factor: 3, attempts: 6, cap: 5000, fail: 50 } },
      { name: "A very flaky service", note: "At 90% failure even 8 attempts succeed only 57% of the time, and the worst case is 22.6 s of waiting. Retrying cannot fix a broken service.", values: { base: 200, factor: 2, attempts: 8, cap: 10000, fail: 90 } },
    ] },
  { id: "contrast", title: "Colour contrast (WCAG)", where: [["WD-301", 8]], blurb: "Mix a text colour and a background and get the exact WCAG contrast ratio, with the AA and AAA pass marks for normal and large text.", topics: ["Accessibility", "WCAG contrast", "WAI-ARIA", "Best practices"], animated: false,
    presets: [
      { name: "#767676 on white", note: "This is the lightest grey that passes AA for normal text on white: a ratio of 4.54, just over the 4.5 needed.", values: { fr: 118, fg: 118, fb: 118, br: 255, bg: 255, bb: 255 } },
      { name: "#777777 on white", note: "One step lighter gives 4.48, just under 4.5, so it fails AA for normal text. A tiny change can decide compliance.", values: { fr: 119, fg: 119, fb: 119, br: 255, bg: 255, bb: 255 } },
      { name: "White on light blue", note: "White text on #2ba6f5 has a ratio of only 2.67, failing every level. Darken the blue to #1476b8 and it becomes 4.87.", values: { fr: 255, fg: 255, fb: 255, br: 43, bg: 166, bb: 245 } },
      { name: "Black on white", note: "The maximum possible ratio is 21:1, which passes every level including AAA.", values: { fr: 0, fg: 0, fb: 0, br: 255, bg: 255, bb: 255 } },
    ] },
  { id: "codesplit", title: "Code splitting for production", where: [["WD-301", 9]], blurb: "Compare one big JavaScript bundle with route-by-route chunks. See the first-load time saved and the code a visitor never has to download.", topics: ["Production optimisation", "Code splitting", "Lazy loading", "Build and deployment"], animated: false,
    presets: [
      { name: "Eight routes", note: "One 1100 KB bundle takes 1.1 s at 8 Mbit/s; splitting so the first page loads only shared code plus its own route (400 KB) takes 0.4 s, 63.6% less.", values: { routes: 8, routeKB: 100, vendor: 300, visited: 3, mbps: 8 } },
      { name: "Big app, slow network", note: "A 3.5 MB single bundle needs 7 s at 4 Mbit/s; with splitting the first route arrives in 1.5 s.", values: { routes: 12, routeKB: 250, vendor: 500, visited: 2, mbps: 4 } },
      { name: "Tiny app", note: "With three small routes splitting still saves 40% on the first load, but a visitor who opens all three downloads everything anyway.", values: { routes: 3, routeKB: 50, vendor: 100, visited: 3, mbps: 50 } },
    ] },
  { id: "gitgraph", title: "Merge, squash or rebase", where: [["WD-401", 1]], blurb: "A feature branch meets a main branch that has moved on. See the commit graph before and after merging by merge commit, squash or rebase.", topics: ["Git branches", "Pull requests", "Merge strategies", "Peer review"], animated: false,
    presets: [
      { name: "Merge commit", note: "With 3 + 2 commits on main and 4 on the feature branch, a merge keeps all 4 and adds one merge commit: 10 commits, history has a fork and join.", values: { f: 4, m0: 3, m1: 2, strategy: "merge" } },
      { name: "Squash and merge", note: "Squashing folds the 4 feature commits into one new commit: main gets 6 commits in a straight line, but the individual steps are gone.", values: { f: 4, m0: 3, m1: 2, strategy: "squash" } },
      { name: "Rebase and merge", note: "A rebase replays the 4 feature commits on top of main as 4 new commits (new hashes): 9 commits in a straight line, no merge commit.", values: { f: 4, m0: 3, m1: 2, strategy: "rebase" } },
    ] },
  { id: "bundle", title: "What a bundler removes", where: [["WD-401", 2]], blurb: "Follow your JavaScript through tree-shaking, minification and compression, and see how many kilobytes are left at each stage.", topics: ["JS bundling", "Tree shaking", "Minification", "Compression"], animated: false,
    presets: [
      { name: "Typical app", note: "200 modules of 8 KB (1600 KB) shrink to 640 KB after tree-shaking 40% used code, 384 KB minified and 115 KB gzipped: 13.9 times smaller.", values: { mods: 200, kb: 8, used: 40, minify: 60, gzip: 30 } },
      { name: "Big library, little used", note: "Importing 4000 KB of a library but using 25% of it: tree-shaking removes 3000 KB and the download is 154 KB, 26 times smaller.", values: { mods: 400, kb: 10, used: 25, minify: 55, gzip: 28 } },
      { name: "Everything is used", note: "If every module is used tree-shaking removes nothing; minifying and gzip still reduce 250 KB to 61 KB.", values: { mods: 50, kb: 5, used: 100, minify: 70, gzip: 35 } },
    ] },
  { id: "vlq", title: "Source maps: VLQ numbers", where: [["WD-401", 3]], blurb: "Source maps let a browser show your TypeScript for compiled JavaScript. Encode any number as the base64 VLQ text they use and see every bit.", topics: ["Compile-to-JS languages", "TypeScript", "Source maps", "Base64 VLQ"], animated: false,
    presets: [
      { name: "16 needs two characters", note: "16 becomes 32 after moving the sign to the lowest bit; 5 bits fit in one character, so it needs a continuation bit and the text is gB.", values: { n: 16 } },
      { name: "Negative numbers", note: "−1 is stored as 3 (sign bit set) and encodes to D; source maps use negative offsets to move backwards through a file.", values: { n: -1 } },
      { name: "123", note: "123 is 246 after the shift: low five bits 10110 plus a continuation bit gives 2, then 7 gives H, so 123 encodes to 2H.", values: { n: 123 } },
    ] },
  { id: "testpyramid", title: "The test pyramid", where: [["WD-401", 4]], blurb: "Unit, integration and end-to-end tests cost very different amounts of time and flake at different rates. Shape your suite and see the run time and odds.", topics: ["Unit testing", "Integration testing", "Testing pitfalls", "Test libraries"], animated: false,
    presets: [
      { name: "A healthy pyramid", note: "200 unit, 20 integration and 10 end-to-end tests: 214 s to run, of which 93% is the 10 slow end-to-end tests; a clean pass is 78.5% likely.", values: { unit: 200, integ: 20, e2e: 10 } },
      { name: "Upside-down (ice cream cone)", note: "20 unit tests and 100 end-to-end tests take 33.5 minutes and pass cleanly only 12.7% of the time because of flaky slow tests.", values: { unit: 20, integ: 20, e2e: 100 } },
      { name: "Only unit tests", note: "500 unit tests run in 10 s and never flake, but they cannot show that the parts work together.", values: { unit: 500, integ: 0, e2e: 0 } },
    ] },
  { id: "cicd", title: "A CI/CD pipeline", where: [["WD-401", 5]], blurb: "Lint, unit tests, build, end-to-end tests and deploy in a row. Change durations and failure rates, add caching or parallel stages, and see how long a push takes.", topics: ["Continuous integration", "Continuous delivery", "Pipeline stages", "Automated deployment"], animated: false,
    presets: [
      { name: "Default pipeline", note: "Run in sequence, a passing push takes 13.5 minutes and 77.9% of pushes go green first time; failing early stops the rest, so the average is 12.0 minutes.", values: { e2e: 7, unitFail: 8, e2eFail: 10, cache: false, parallel: false } },
      { name: "Cache and parallel stages", note: "Caching the build (1 min) and running lint, unit tests and build side by side cuts a passing push to 10 minutes.", values: { e2e: 7, unitFail: 8, e2eFail: 10, cache: true, parallel: true } },
      { name: "Slow and unreliable", note: "25 minutes of end-to-end tests with 25% failures: 31.5 minutes to green and only 60% of pushes pass first time.", values: { e2e: 25, unitFail: 15, e2eFail: 25, cache: false, parallel: false } },
    ] },
  { id: "canary", title: "Staging and canary releases", where: [["WD-401", 6]], blurb: "A buggy release reaches production. See how many requests fail if you send it to 5% of users first, versus everyone, and how staging tests cut the risk.", topics: ["Environments", "Staging", "Canary release", "Blast radius"], animated: false,
    presets: [
      { name: "5% canary", note: "At 1000 requests a second, a 20% error bug caught after 5 minutes fails 3000 requests on a 5% canary against 60,000 for everyone: 95% fewer.", values: { rps: 1000, roll: 5, err: 20, detect: 5, staging: 50 } },
      { name: "Everyone at once", note: "At 100% rollout the whole 60,000 failed requests land; only staging (here 0%) could have stopped it.", values: { rps: 1000, roll: 100, err: 20, detect: 5, staging: 0 } },
      { name: "Good staging and a 1% canary", note: "With staging catching 90% of bugs and a 1% canary, the expected damage from a 50% error bug is about 450 requests instead of 45,000.", values: { rps: 5000, roll: 1, err: 50, detect: 3, staging: 90 } },
    ] },
  { id: "layers", title: "Container image layers (concept)", where: [["WD-401", 7]], blurb: "An image is a stack of layers and a change rebuilds its layer and every layer above it. See how ordering and multi-stage builds cut rebuild size. No Docker needed here.", topics: ["Containerization", "Image layers", "Build cache", "Multi-stage builds"], animated: false,
    presets: [
      { name: "Change the app code", note: "Only the top application layer rebuilds: 20 MB of a 450 MB image, so 95.6% of it is reused from the cache.", values: { base: 80, tools: 200, deps: 150, app: 20, changed: "app", multi: false } },
      { name: "Change a dependency", note: "The dependencies layer and the application layer above it rebuild: 170 MB, and the cache still saves 62%.", values: { base: 80, tools: 200, deps: 150, app: 20, changed: "deps", multi: false } },
      { name: "New base, multi-stage", note: "Changing the base rebuilds everything, but a multi-stage build leaves the 200 MB of build tools out of the final image, which is 250 MB instead of 450.", values: { base: 80, tools: 200, deps: 150, app: 20, changed: "base", multi: true } },
    ] },
  { id: "plural", title: "Plural rules across languages", where: [["WD-401", 8]], blurb: "English has two plural forms, Arabic six. Pick a language and a number and see which CLDR plural category applies, coloured across 0 to 100.", topics: ["Internationalisation", "Localisation", "Plural categories", "CLDR"], animated: false,
    presets: [
      { name: "Russian: 2", note: "Russian uses the 'few' form for 2, 3 and 4 (but not 12–14), 'one' for 1, 21, 31, and 'many' for the rest, so it needs three forms.", values: { n: 2, lang: "ru" } },
      { name: "Arabic: 5", note: "Arabic has all six categories (zero, one, two, few, many, other); 5 is 'few', which covers 3 to 10 and 103 to 110.", values: { n: 5, lang: "ar" } },
      { name: "Japanese: 1", note: "Japanese has a single form, 'other', for every number, so translations need no plural switch at all.", values: { n: 1, lang: "ja" } },
      { name: "English: 1", note: "English distinguishes only 'one' (exactly 1) from 'other', which is why a simple n === 1 check is not enough for other languages.", values: { n: 1, lang: "en" } },
    ] },
];
