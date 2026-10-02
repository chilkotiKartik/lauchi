import type { LabMeta } from "../types";

/** Labs that give the remaining units of environment, electrical, C, biology and basic maths their own 3D lab. */
export const EXTRA_LABS: LabMeta[] = [
  { id: "resources", title: "Running out of resources", where: [["AHT-004", 1]], blurb: "A reserve drains as yearly use grows. Compare steady use, growing use and growing use with recycling, and see the exact year it runs out.", topics: ["Natural resources", "Exponential growth of use", "Recycling", "Sustainable use"], animated: false,
    presets: [
      { name: "Steady use", note: "With no growth in use, a reserve of 1000 lasting at 20 per year is gone in R / c = 50 years. This is the simple estimate.", values: { R: 1000, c0: 20, g: 0, rec: 0 } },
      { name: "Use grows 3% a year", note: "If yearly use grows by 3% the same reserve lasts only ln(1 + Rg/c)/g = 30.5 years, about 20 years sooner than the steady estimate.", values: { R: 1000, c0: 20, g: 3, rec: 0 } },
      { name: "Growth plus 40% recycling", note: "Recycling 40% cuts the fresh material needed to 12 per year, so growing use lasts 41.8 years instead of 30.5.", values: { R: 1000, c0: 20, g: 3, rec: 40 } },
    ] },
  { id: "speciesarea", title: "Species–area law", where: [["AHT-004", 3]], blurb: "Shrink a habitat and watch the number of species fall along S = S₀ (A/A₀)^z, the rule ecologists use to forecast extinctions.", topics: ["Biodiversity", "Habitat loss", "Species–area relationship", "Extinction"], animated: false,
    presets: [
      { name: "Half the forest cleared", note: "With z = 0.25 keeping 50% of the area keeps 0.5^0.25 = 84% of the species, so 16% are lost even though half the forest remains.", values: { hab: 50, z: 0.25, S0: 1000 } },
      { name: "Lose 90% of the habitat", note: "Keeping only 10% of the area keeps 0.1^0.25 = 56% of the species: the well-known result that 90% habitat loss costs about 44% of species.", values: { hab: 10, z: 0.25, S0: 1000 } },
      { name: "Island (z = 0.35)", note: "Islands have a steeper curve. With z = 0.35, keeping 25% of the area keeps 0.25^0.35 = 62% of the species, so 38% are lost.", values: { hab: 25, z: 0.35, S0: 1000 } },
    ] },
  { id: "rainwater", title: "Rainwater harvesting tank", where: [["AHT-004", 5]], blurb: "Roof area × rainfall × runoff coefficient fills a tank through a monsoon year. Size the tank and see overflow, shortfall and how much of the demand is met.", topics: ["Rainwater harvesting", "Runoff coefficient", "Storage tank sizing", "Water conservation"], animated: false,
    presets: [
      { name: "Small urban roof", note: "A 50 m² roof with 700 mm of rain and a coefficient 0.8 gives 28,000 litres a year, enough for only about 140 days at 200 litres a day.", values: { area: 50, rain: 700, coeff: 0.8, tank: 5000, use: 200 } },
      { name: "Big tank, wet region", note: "200 m² × 1200 mm × 0.85 = 204,000 litres a year. A 50,000 litre tank stores the monsoon so the dry months are covered.", values: { area: 200, rain: 1200, coeff: 0.85, tank: 50000, use: 400 } },
      { name: "Dry region", note: "100 m² × 300 mm × 0.7 gives just 21,000 litres a year, so demand of 150 litres a day is mostly unmet however large the tank.", values: { area: 100, rain: 300, coeff: 0.7, tank: 10000, use: 150 } },
    ] },
  { id: "loadbill", title: "Household load, MCB and bill", where: [["EET-001", 5]], blurb: "Add bulbs, fans and air conditioners to a home. See the connected load, the current, the MCB rating and wire size to choose, and the monthly bill.", topics: ["Electrical load", "MCB rating", "Wire size", "Energy and tariff"], animated: false,
    presets: [
      { name: "One-room flat", note: "4 bulbs, 2 fans and a fridge draw about 336 W, roughly 1.5 A at 230 V, so a 6 A MCB and 1.5 mm² wire is enough.", values: { bulbs: 4, fans: 2, acs: 0, acHours: 0, fridge: true, tariff: 6, fixed: 100 } },
      { name: "Family home with one AC", note: "One 1.5 kW air conditioner dominates: the load passes 2 kW, the current is close to 9 A and the bill is mostly the AC.", values: { bulbs: 10, fans: 4, acs: 1, acHours: 6, fridge: true, tariff: 7, fixed: 150 } },
      { name: "Heavy summer use", note: "Three ACs running 10 hours push the connected load beyond 5 kW and 22 A, so a larger MCB and thicker wire are needed.", values: { bulbs: 15, fans: 6, acs: 3, acHours: 10, fridge: true, tariff: 8, fixed: 200 } },
    ] },
  { id: "gcdflow", title: "Algorithm as a flowchart: GCD", where: [["CST-001", 1]], blurb: "Step through Euclid's greatest-common-divisor algorithm on a real flowchart. Choose the modulus or subtraction version and watch a and b shrink.", topics: ["Algorithm", "Flowchart", "Loop and decision", "Euclid's GCD"], animated: false,
    presets: [
      { name: "gcd(48, 18)", note: "48 mod 18 = 12, 18 mod 12 = 6, 12 mod 6 = 0, so the answer is 6 after three passes through the loop.", values: { a: 48, b: 18, method: "mod", step: 0 } },
      { name: "Coprime numbers", note: "gcd(35, 64) = 1: the numbers share no factor. The remainder chain still ends at 0 and the last non-zero remainder is 1.", values: { a: 35, b: 64, method: "mod", step: 0 } },
      { name: "Subtraction method", note: "The same gcd(48, 18) by repeated subtraction takes more steps than the modulus version. That is why the remainder form is preferred.", values: { a: 48, b: 18, method: "sub", step: 0 } },
    ] },
  { id: "cellsize", title: "Why cells are small", where: [["BTT-001", 1]], blurb: "Grow a cell and watch surface area to volume fall and the time for a molecule to diffuse to the centre rise. Fold the membrane to win it back.", topics: ["Cell size", "Surface area to volume", "Diffusion", "Microvilli"], animated: false,
    presets: [
      { name: "Bacterium", note: "A cell of radius 1 μm has SA:V = 3/r = 3 per μm and a diffusion time under a millisecond, so no transport system is needed.", values: { r: 1, D: 500, fold: 1 } },
      { name: "Large animal cell", note: "At r = 50 μm the SA:V falls to 0.06 per μm and diffusion to the centre takes about 0.8 s, too slow for a working cell.", values: { r: 50, D: 500, fold: 1 } },
      { name: "Folded membrane", note: "A cell of radius 20 μm with a 20-fold folded membrane (like intestinal microvilli) regains a surface to volume ratio of 3 per μm.", values: { r: 20, D: 500, fold: 20 } },
    ] },
  { id: "enzyme", title: "Enzyme kinetics & inhibition", where: [["BTT-001", 3]], blurb: "Michaelis–Menten curve with competitive, non-competitive and uncompetitive inhibitors. Read Vmax and Km from the graph and see how each inhibitor changes them.", topics: ["Enzymes", "Michaelis–Menten equation", "Km and Vmax", "Enzyme inhibition"], animated: false,
    presets: [
      { name: "No inhibitor", note: "At S = Km the rate is exactly Vmax/2. With Vmax = 100 and Km = 20, v(20) = 50. The curve saturates at Vmax.", values: { S: 20, Vmax: 100, Km: 20, I: 0, Ki: 10, mode: "none" } },
      { name: "Competitive inhibitor", note: "Km rises by the factor 1 + [I]/Ki = 3 while Vmax is unchanged: at high substrate the inhibitor is outcompeted.", values: { S: 20, Vmax: 100, Km: 20, I: 20, Ki: 10, mode: "competitive" } },
      { name: "Non-competitive inhibitor", note: "Vmax falls by 1 + [I]/Ki = 3 while Km stays the same. More substrate cannot fix it because the inhibitor binds elsewhere.", values: { S: 20, Vmax: 100, Km: 20, I: 20, Ki: 10, mode: "noncompetitive" } },
    ] },
  { id: "bioenergy", title: "Free energy & ATP coupling", where: [["BTT-001", 5]], blurb: "ΔG = ΔG°′ + RT ln Q for a reaction, and how coupling an uphill reaction to ATP hydrolysis makes the pair spontaneous.", topics: ["Free energy", "ATP hydrolysis", "Coupled reactions", "Metabolism"], animated: false,
    presets: [
      { name: "Uphill on its own", note: "Glucose + Pi → glucose-6-phosphate has ΔG°′ = +13.8 kJ/mol, so it does not run spontaneously by itself.", values: { dG0: 13.8, logQ: 0, T: 310, logQatp: -3.3, couple: false } },
      { name: "Coupled to ATP (standard)", note: "Coupling to ATP hydrolysis (−30.5 kJ/mol) gives a net −16.7 kJ/mol: the hexokinase step now runs spontaneously.", values: { dG0: 13.8, logQ: 0, T: 310, logQatp: 0, couple: true } },
      { name: "ATP inside a living cell", note: "With [ADP][Pi]/[ATP] near 5 × 10⁻⁴ M the real ΔG of ATP hydrolysis is about −50 kJ/mol, more negative than the standard −30.5.", values: { dG0: -30.5, logQ: 0, T: 310, logQatp: -3.3, couple: false } },
    ] },
  { id: "limits", title: "Limits & continuity explorer", where: [["AHT-000", 2]], blurb: "Approach a point from the left and right on four classic curves: a removable hole, a jump, sin x / x and a pole. See when the limit exists and when the function is continuous.", topics: ["Limit of a function", "Left and right limits", "Continuity", "Removable discontinuity"], animated: false,
    presets: [
      { name: "Removable hole", note: "f(x) = (x² − 1)/(x − 1) is undefined at x = 1 but both one-sided limits equal 2, so the limit exists and the gap can be filled.", values: { kind: "hole", a: 1, k: 1, j: 1, h: 0.5 } },
      { name: "Jump", note: "The left limit is 0 and the right limit is 1.5, so the limit at 0 does not exist even though f(0) is defined.", values: { kind: "jump", a: 0, k: 0, j: 1.5, h: 0.5 } },
      { name: "sin x / x at 0", note: "The value at 0 is undefined, yet both limits equal 1. This standard limit is used all through calculus.", values: { kind: "sinc", a: 0, k: 0, j: 1, h: 0.5 } },
      { name: "Infinite pole", note: "1/(x − 0) goes to −∞ from the left and +∞ from the right, so there is no finite limit.", values: { kind: "pole", a: 0, k: 0, j: 1, h: 0.5 } },
    ] },
  { id: "partialfrac", title: "Partial fractions", where: [["AHT-000", 2]], blurb: "Split (px + q) / ((x − r₁)(x − r₂)) into A/(x − r₁) + B/(x − r₂), with the cover-up numbers A and B and a check that the two sides agree everywhere.", topics: ["Partial fractions", "Rational functions", "Cover-up method", "Integration of rational functions"], animated: false,
    presets: [
      { name: "(3x + 5)/((x − 1)(x + 2))", note: "Cover-up: A = (3·1 + 5)/(1 + 2) = 8/3 and B = (3·(−2) + 5)/(−2 − 1) = 1/3. Their sum reproduces the original at every x.", values: { p: 3, q: 5, r1: 1, r2: -2, x0: 0.5 } },
      { name: "1/((x − 1)(x − 3))", note: "With p = 0 and q = 1 the answer is A = −1/2 and B = 1/2, so 1/((x−1)(x−3)) = ½[1/(x−3) − 1/(x−1)].", values: { p: 0, q: 1, r1: 1, r2: 3, x0: 2 } },
      { name: "x/((x + 1)(x − 1))", note: "A = 1/2 and B = 1/2, so x/(x² − 1) = ½[1/(x − 1) + 1/(x + 1)]. Each piece integrates to a logarithm.", values: { p: 1, q: 0, r1: 1, r2: -1, x0: 2 } },
    ] },
];
