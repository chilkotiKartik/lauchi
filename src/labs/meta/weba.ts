import type { LabMeta } from "../types";

/** 3D labs for Web Development 101 (basics) and 201 (server side). */
export const WEBA_LABS: LabMeta[] = [
  { id: "httpjourney", title: "One page load, step by step", where: [["WD-101", 1], ["BCA-004", 4]], blurb: "Follow a page request through DNS, TCP, TLS, the server and the download. Change latency, bandwidth and page size to see where the time goes.", topics: ["World Wide Web", "DNS", "HTTP request", "Latency and bandwidth", "Operating Systems (Batch, Multiprogrammed, Time-sharing, Distributed, Real-time)", "DBMS fundamentals"], animated: false,
    presets: [
      { name: "Fast fibre, near server", note: "With a 10 ms round trip, cached DNS and 100 Mbit/s the whole page arrives in 120 ms, and the first byte after 80 ms.", values: { rtt: 10, dns: 0, https: true, server: 50, size: 500, mbps: 100 } },
      { name: "Slow mobile, far server", note: "A 300 ms round trip and 2 Mbit/s stretch a 1.5 MB page to 7.2 s; even the first byte needs 1.2 s of set-up.", values: { rtt: 300, dns: 100, https: true, server: 200, size: 1500, mbps: 2 } },
      { name: "Small page, high latency", note: "A 20 KB page downloads in 1.6 ms yet takes 672 ms in all: nearly everything is round trips (TCP, TLS, the request).", values: { rtt: 200, dns: 50, https: true, server: 20, size: 20, mbps: 100 } },
    ] },
  { id: "domtree", title: "The DOM as a tree", where: [["WD-101", 2]], blurb: "Every HTML element becomes a node in a tree. Choose how deep and how bushy the page is and count nodes, leaves and levels.", topics: ["HTML elements", "Nesting", "Document Object Model", "Browser developer tools"], animated: false,
    presets: [
      { name: "Small page", note: "Depth 2 with 2 children per element gives 1 + 2 + 4 = 7 nodes: one root, two sections, four leaves.", values: { depth: 2, branch: 2 } },
      { name: "Blog layout", note: "Depth 3 with 3 children per element has 1 + 3 + 9 + 27 = 40 nodes; 27 of them are leaves (text, images, links).", values: { depth: 3, branch: 3 } },
      { name: "Bushy and deep", note: "Depth 4 with 4 children per element already has 341 nodes. Bigger DOMs cost more memory and slow every style and layout pass.", values: { depth: 4, branch: 4 } },
    ] },
  { id: "specificity", title: "CSS specificity duel", where: [["WD-101", 3]], blurb: "Two CSS rules fight over one element. Count ids, classes and tags for each and see which rule wins, and why.", topics: ["CSS selectors", "Specificity", "Cascade", "!important"], animated: false,
    presets: [
      { name: "An id beats many classes", note: "Rule A has five classes, (0, 5, 0); rule B has one id, (1, 0, 0). The id column is compared first, so B wins.", values: { id1: 0, cls1: 5, tag1: 0, id2: 1, cls2: 0, tag2: 0, imp: false } },
      { name: "Same score, later rule wins", note: "Both rules score (0, 1, 1), so the cascade falls back to source order and the later rule B wins.", values: { id1: 0, cls1: 1, tag1: 1, id2: 0, cls2: 1, tag2: 1, imp: false } },
      { name: "!important overrides", note: "Rule A is marked !important, so it wins even though rule B has an id. Use it sparingly: it makes later overrides hard.", values: { id1: 0, cls1: 1, tag1: 0, id2: 1, cls2: 0, tag2: 0, imp: true } },
    ] },
  { id: "jsdouble", title: "JavaScript numbers are doubles", where: [["WD-101", 5]], blurb: "See the 64 bits behind a JavaScript Number: sign, exponent and mantissa. Find out why 0.1 + 0.2 is not 0.3 and where integers stop being exact.", topics: ["Number type", "Floating point", "Precision", "Safe integers"], animated: false,
    presets: [
      { name: "0.1 + 0.2", note: "The result is 0.30000000000000004: neither 0.1 nor 0.2 has an exact binary form, so the sum rounds to a neighbour of 0.3, not 0.3 itself.", values: { a: 0.1, b: 0.2, op: "add", n: 53 } },
      { name: "0.5 + 0.25 is exact", note: "Both are sums of powers of two (2⁻¹ and 2⁻²), so the double stores 0.75 exactly and the round trip agrees.", values: { a: 0.5, b: 0.25, op: "add", n: 53 } },
      { name: "0.7 × 3", note: "Multiplying gives 2.0999999999999996, not 2.1. Compare money in whole paise or use a tolerance, never ===.", values: { a: 0.7, b: 3, op: "mul", n: 53 } },
    ] },
  { id: "pipeline", title: "Filter, map and reduce", where: [["WD-101", 6]], blurb: "Send an array through filter, map and reduce. Bars show every value at each stage, so you can see what each array method keeps, changes and adds up.", topics: ["Arrays", "filter", "map", "reduce"], animated: false,
    presets: [
      { name: "Keep values above 50", note: "Of the twelve values, 86, 60, 97, 71 and 82 pass; doubling and adding them gives 792.", values: { n: 12, t: 50, m: 2 } },
      { name: "Keep everything", note: "A threshold of 0 keeps all twelve values. With a multiplier of 1 the reduce is just their sum, 586.", values: { n: 12, t: 0, m: 1 } },
      { name: "Keep almost nothing", note: "Only 97 is above 90; times 5 the sum is 485. filter can return a much shorter array.", values: { n: 12, t: 90, m: 5 } },
    ] },
  { id: "callstack", title: "The call stack", where: [["WD-101", 7]], blurb: "Watch function calls pile up and unwind on the stack, one frame at a time, for factorial, Fibonacci and a running sum.", topics: ["Functions", "Return values", "Recursion", "Call stack"], animated: false,
    presets: [
      { name: "factorial(5)", note: "The stack grows to 6 frames (5, 4, 3, 2, 1, 0) before any call returns; then they unwind, multiplying on the way back.", values: { kind: "fact", n: 5, step: 0 } },
      { name: "fib(5)", note: "fib(5) makes 15 calls but never has more than 5 on the stack at once: it explores one branch of the tree at a time.", values: { kind: "fib", n: 5, step: 0 } },
      { name: "fib(12): explosion", note: "fib(12) makes 465 calls for a single answer, because the same values are recomputed again and again.", values: { kind: "fib", n: 12, step: 0 } },
    ] },
  { id: "formsize", title: "How big is a form submission?", where: [["WD-101", 8]], blurb: "Compare the size of the same form sent as urlencoded, JSON or multipart data, with special characters and a file upload.", topics: ["HTML forms", "Form data", "Percent encoding", "multipart/form-data"], animated: false,
    presets: [
      { name: "Small login form", note: "Two short fields cost 43 bytes urlencoded but 264 bytes as multipart, because each part repeats a 40-byte boundary and headers.", values: { fields: 2, keyLen: 8, valLen: 12, special: 0, fileKB: 0 } },
      { name: "Signup with symbols", note: "With 30% special characters urlencoding pays 2 extra bytes for each one (287 bytes), slightly more than JSON (277).", values: { fields: 6, keyLen: 8, valLen: 24, special: 30, fileKB: 0 } },
      { name: "Profile photo upload", note: "A 200 KB file: multipart sends it raw (about 200 KB), JSON with base64 needs 267 KB, and worst-case percent-encoding 600 KB.", values: { fields: 3, keyLen: 6, valLen: 20, special: 5, fileKB: 200 } },
    ] },
  { id: "eventloop", title: "Node.js event loop order", where: [["WD-201", 1]], blurb: "Predict the order of console output when a program mixes synchronous code, process.nextTick, promises and timers with different delays.", topics: ["Node.js runtime", "Event loop", "Microtasks", "Timers"], animated: false,
    presets: [
      { name: "One of each", note: "The synchronous lines run first, then nextTick callbacks, then promise callbacks, then timers in order of delay (0 ms counts as 1 ms).", values: { ticks: 1, promises: 2, d1: 50, d2: 0, d3: 10 } },
      { name: "Many microtasks", note: "Four nextTicks and four promises all run before any timer, even a 0 ms timer set earlier in the program.", values: { ticks: 4, promises: 4, d1: 0, d2: 0, d3: 0 } },
      { name: "Timers race", note: "With no microtasks the timers fire by delay, not by the order they were written: 10 ms, then 50 ms, then 100 ms.", values: { ticks: 0, promises: 0, d1: 100, d2: 10, d3: 50 } },
    ] },
  { id: "semver", title: "npm version ranges", where: [["WD-201", 2]], blurb: "A grid of one hundred published versions. Choose a caret, tilde, exact or minimum range and see exactly which versions npm would accept.", topics: ["NPM", "Semantic versioning", "package.json", "Version ranges"], animated: false,
    presets: [
      { name: "^1.2.0 (caret)", note: "Accepts anything from 1.2.0 up to but not including 2.0.0: 15 of the 100 versions, with 1.4.4 the highest.", values: { M: 1, m: 2, p: 0, kind: "caret" } },
      { name: "~1.2.3 (tilde)", note: "Accepts only patch updates within 1.2: just 1.2.3 and 1.2.4 here.", values: { M: 1, m: 2, p: 3, kind: "tilde" } },
      { name: "^0.2.3 (0.x is stricter)", note: "For 0.x versions a caret only allows patch updates, because the minor number is the breaking one: 0.2.3 and 0.2.4.", values: { M: 0, m: 2, p: 3, kind: "caret" } },
      { name: ">=2.0.0", note: "A minimum with no ceiling accepts every 2.x and 3.x version (50 of them) and can pull in breaking changes.", values: { M: 2, m: 0, p: 0, kind: "gte" } },
    ] },
  { id: "closure", title: "Closures and private state", where: [["WD-201", 3]], blurb: "A factory function returns counters that each keep private state, or all share one global. Call them round-robin and compare.", topics: ["Closures", "Private state", "Modules", "Encapsulation"], animated: false,
    presets: [
      { name: "Three private counters", note: "After 7 calls in turn the counters read 3, 2 and 2: each closure keeps its own count that nothing outside can touch.", values: { t: 7, n: 3, mode: "closure" } },
      { name: "One shared global", note: "The same 7 calls on a single global variable make every reader see 7, and any code anywhere could overwrite it.", values: { t: 7, n: 3, mode: "global" } },
      { name: "Six counters", note: "Twenty calls spread over six closures leave counts of 4, 4, 3, 3, 3 and 3: independent state costs nothing extra to write.", values: { t: 20, n: 6, mode: "closure" } },
    ] },
  { id: "coverage", title: "Test coverage and hidden bugs", where: [["WD-201", 4], ["BCA-009", 4]], blurb: "A grid of code branches. Each test exercises a few of them; green means covered. Hidden bugs are found only in covered branches.", topics: ["Testing", "Code coverage", "Jest", "Bugs", "White-Box testing: Basis Path testing", "Cyclomatic Complexity", "Control Flow Graphs (CFG)", "debugging", "verification and validation"], animated: false,
    presets: [
      { name: "A few tests", note: "Three tests touch only about a third of the branches, so bugs in the rest go unseen.", values: { tests: 3, branches: 20, per: 2, bugs: 3 } },
      { name: "Broad suite", note: "Thirty tests that each touch three branches reach full coverage of 20 branches and find all three bugs.", values: { tests: 30, branches: 20, per: 3, bugs: 3 } },
      { name: "Redundant tests", note: "Forty tests on 8 branches reach full coverage after a handful; the rest add nothing new. Coverage shows what ran, not whether the checks were good.", values: { tests: 40, branches: 8, per: 1, bugs: 2 } },
    ] },
  { id: "dbindex", title: "Index against full scan", where: [["WD-201", 5], ["BCA-004", 4], ["BCA-006", 5]], blurb: "Find one row among millions. A full table scan reads half the rows on average; a B-tree index reads only a few pages.", topics: ["Databases", "PostgreSQL", "Index", "B-tree", "DBMS fundamentals", "primary vs. secondary storage", "data retrieval methods", "Hashing: hash functions"], animated: false,
    presets: [
      { name: "One million rows", note: "A scan reads 500,000 rows on average; a B-tree with fan-out 100 has 3 levels, so 4 page reads find the row: about 125,000 times fewer.", values: { exp: 6, fanout: 100, index: true } },
      { name: "One hundred million rows", note: "The scan grows 100 times to 50 million rows, but the tree gains only one level (4 levels, 5 page reads in all): indexes scale logarithmically.", values: { exp: 8, fanout: 100, index: true } },
      { name: "A tiny table", note: "With only 100 rows the tree is one level (2 reads against 50 on average), a gain of just 25 times. Small tables barely need an index.", values: { exp: 2, fanout: 100, index: true } },
    ] },
  { id: "apiqueue", title: "Requests waiting for a worker", where: [["WD-201", 6]], blurb: "An Express-style server with a few workers. Raise the request rate or add workers and watch the queue grow or vanish (M/M/c model).", topics: ["Express.js", "Concurrency", "Queueing", "Server load"], animated: false,
    presets: [
      { name: "Comfortable", note: "One worker at 40% load: 40% of requests wait a little, and the average queue is 0.27 requests.", values: { lambda: 10, mu: 25, c: 1 } },
      { name: "Busy at 80%", note: "Two workers at 80% load: 71% of requests have to wait, and about 2.8 are queued on average.", values: { lambda: 40, mu: 25, c: 2 } },
      { name: "Add a worker", note: "A third worker drops the load to 53% and the average queue from 2.8 to 0.31 requests: a big win.", values: { lambda: 40, mu: 25, c: 3 } },
      { name: "Overloaded", note: "60 requests a second against a capacity of 50: the queue grows without limit, so nothing helps except more workers or less load.", values: { lambda: 60, mu: 25, c: 2 } },
    ] },
  { id: "flexbox", title: "Flexbox: grow, shrink, wrap", where: [["WD-201", 7]], blurb: "Lay out equal items in a flex container. Change basis, grow, shrink, gap and wrapping and see the exact width every item gets.", topics: ["Layout", "CSS flexbox", "flex-grow", "flex-shrink", "flex-wrap"], animated: false,
    presets: [
      { name: "Grow to fill", note: "Three items with basis 100 in a 600 px row and grow 1 each end up 193.3 px wide: 100 plus (600 − 300 − 20) / 3 = 93.3 of shared free space.", values: { W: 600, n: 3, basis: 100, grow: 1, shrink: 1, gap: 10, wrap: false } },
      { name: "Shrink to fit", note: "Four items of basis 120 need 510 px in a 300 px row, so each shrinks by 52.5 px to 67.5 px.", values: { W: 300, n: 4, basis: 120, grow: 0, shrink: 1, gap: 10, wrap: false } },
      { name: "No shrink: overflow", note: "With shrink 0 the four items keep 120 px and the row overflows its 300 px container by 210 px.", values: { W: 300, n: 4, basis: 120, grow: 0, shrink: 0, gap: 10, wrap: false } },
      { name: "Wrap onto lines", note: "With wrap on, five items of basis 120 fit two per line in 300 px, giving lines of 2, 2 and 1 items.", values: { W: 300, n: 5, basis: 120, grow: 0, shrink: 1, gap: 10, wrap: true } },
    ] },
  { id: "ssrcsr", title: "Server-side vs client-side rendering", where: [["WD-201", 8]], blurb: "Compare when content appears and when the page becomes interactive if HTML is rendered by the server (as with EJS) or built in the browser.", topics: ["EJS templates", "Server-side rendering", "Client-side rendering", "MVC"], animated: false,
    presets: [
      { name: "Default network", note: "Server-rendered content appears at 266 ms; the client-rendered page shows content only after its 300 KB of JavaScript and an API call, at about 1 s.", values: { rtt: 50, bw: 20, html: 40, js: 300, server: 100, api: 80, cpu: 2 } },
      { name: "Budget phone on 4G", note: "A slow CPU (5×) and 8 Mbit/s stretch client rendering to 3.6 s, while server-rendered content still appears at 0.5 s.", values: { rtt: 120, bw: 8, html: 40, js: 500, server: 100, api: 150, cpu: 5 } },
      { name: "Tiny app", note: "With only 50 KB of JavaScript the two approaches end up close (255 ms against 338 ms): SSR matters more the heavier the client code is.", values: { rtt: 50, bw: 50, html: 30, js: 50, server: 100, api: 80, cpu: 1 } },
    ] },
  { id: "csrf", title: "Can a CSRF token be guessed?", where: [["WD-201", 9]], blurb: "An authenticity token stops forged form posts only if it cannot be guessed. Set its length, the attacker's speed and the token lifetime.", topics: ["CSRF", "Authenticity tokens", "Forms", "Entropy"], animated: false,
    presets: [
      { name: "Random 128-bit token", note: "16 random bytes give 2¹²⁸ possibilities; even at 1000 tries a second for an hour the chance of a hit is below one in 10³⁰.", values: { bytes: 16, rate: 1000, life: 60 } },
      { name: "Weak 2-byte token", note: "Only 65,536 possibilities: at 1000 tries a second an attacker has even odds within 33 seconds and certainty within the hour.", values: { bytes: 2, rate: 1000, life: 60 } },
      { name: "3 bytes, fast attacker", note: "16.7 million possibilities against 100,000 tries a second: a 50% chance in about 84 seconds. Use at least 16 random bytes.", values: { bytes: 3, rate: 100000, life: 60 } },
    ] },
  { id: "passwordcrack", title: "How long a stored password lasts", where: [["WD-201", 10], ["BCA-004", 5]], blurb: "Compare fast hashes (MD5, SHA-256) with bcrypt for stored passwords: length, character set, salting and cost decide how long a cracker needs.", topics: ["Password storage", "Hashing", "bcrypt", "Salting", "Number systems (Positional & Non-Positional): Binary", "Octal", "Decimal", "Hexadecimal", "radix conversions", "binary arithmetic: addition"], animated: false,
    presets: [
      { name: "8 lowercase, MD5", note: "About 2×10¹¹ combinations, and one GPU tries 1.6×10¹¹ MD5 hashes a second: the average password falls in under a second.", values: { len: 8, cs: "lower", scheme: "md5", cost: 10, salt: false } },
      { name: "8 mixed, bcrypt cost 12", note: "218 trillion combinations at roughly 1,400 tries a second: about 2,400 years for one GPU on average. Slow, salted hashes are the point of bcrypt.", values: { len: 8, cs: "alnum", scheme: "bcrypt", cost: 12, salt: true } },
      { name: "4-digit PIN, SHA-256", note: "Only 10,000 combinations: even a good hash falls in a fraction of a millisecond. Short secrets cannot be protected by hashing alone.", values: { len: 4, cs: "digits", scheme: "sha256", cost: 10, salt: false } },
    ] },
];
