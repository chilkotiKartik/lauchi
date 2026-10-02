import type { LabMeta } from "../types";

/** Environmental Studies (AHT-004), Biology for Engineers (BTT-001) and Web Development (WD-101) labs. */
export const LIFE_LABS: LabMeta[] = [
  { id: "ecosystem", title: "Energy flow & ecological pyramids", where: [["AHT-004", 2]], blurb: "Build an energy pyramid with the 10 % law, change the transfer efficiency and the number of trophic levels, and compare it with pyramids of numbers.", topics: ["Food chains and food webs", "Energy flow in the ecosystem", "Ecological pyramids"], animated: true,
    presets: [
      { name: "The 10 % law", note: "Only about 10 % of the energy at one level reaches the next, so 10 000 kcal of plants feed just 1 000 of herbivores and 10 of top carnivores.", values: { E0: 10000, eff: 10, levels: 4, kind: "energy" } },
      { name: "Efficient chain", note: "At 20 % transfer efficiency the fourth level gets 8 times more energy than at 10 %, but a longer chain still loses most of it.", values: { E0: 10000, eff: 20, levels: 5, kind: "energy" } },
      { name: "Inverted pyramid of numbers", note: "One large tree feeds thousands of insects: a pyramid of numbers can be inverted, but a pyramid of energy never can.", values: { E0: 10000, eff: 10, levels: 5, kind: "tree" } },
    ] },
  { id: "population", title: "Population growth: exponential vs logistic", where: [["AHT-004", 6]], blurb: "Grow a population with a chosen rate and carrying capacity, compare unlimited exponential growth with the S-shaped logistic curve and read doubling time and growth rate.", topics: ["Population growth", "Carrying capacity", "Doubling time"], animated: true,
    presets: [
      { name: "5 % per year", note: "Exponential growth doubles every ln 2/r = 13.9 years (the rule of 70 says 14) and would soon be off the chart.", values: { t: 60, r: 5, N0: 100, K: 10000 } },
      { name: "Approaching the limit", note: "The logistic curve flattens as the population nears K: growth is fastest at K/2 and then falls to zero.", values: { t: 150, r: 5, N0: 100, K: 10000 } },
      { name: "Slow growth, small start", note: "At 1.5 % per year the doubling time is 46 years, and it takes centuries for a small population to reach capacity.", values: { t: 200, r: 1.5, N0: 50, K: 5000 } },
    ] },
  { id: "greenhouse", title: "Greenhouse effect & global warming", where: [["AHT-004", 4]], blurb: "A simple energy-balance model: raise CO₂ from the pre-industrial 280 ppm, change the climate sensitivity or the reflectivity of Earth, and read the radiative forcing and warming.", topics: ["Greenhouse effect", "Global warming", "Radiative forcing"], animated: true,
    presets: [
      { name: "Today, about 420 ppm", note: "ΔF = 5.35 ln(420/280) = 2.17 W/m²; with λ = 0.8 K per W/m² the equilibrium warming is about 1.7 °C above pre-industrial.", values: { C: 420, lambda: 0.8, dAlb: 0 } },
      { name: "Doubled CO₂", note: "Doubling CO₂ from 280 to 560 ppm adds 3.71 W/m²: the equilibrium warming is λ × 3.71 ≈ 3 °C (the climate sensitivity).", values: { C: 560, lambda: 0.8, dAlb: 0 } },
      { name: "Reflect more sunlight", note: "Raising Earth's albedo by 0.005 (brighter clouds, ice or roofs) reflects 1.7 W/m² of sunlight, offsetting almost half of the forcing from doubled CO₂.", values: { C: 560, lambda: 0.8, dAlb: 0.005 } },
    ] },
  { id: "dna", title: "DNA to protein & point mutations", where: [["BTT-001", 4]], blurb: "Pick a gene, mutate one base, and follow the mutation through the double helix, the mRNA and the amino-acid chain: silent, missense or nonsense.", topics: ["DNA structure", "Transcription and translation", "Mutations"], animated: true,
    presets: [
      { name: "Missense: Ala → Thr", note: "A transition G→A at position 4 turns GCU (Ala) into ACU (Thr): one amino acid changes and the rest of the protein is unaltered.", values: { pos: 4, kind: "ts", sample: "s1" } },
      { name: "Silent mutation", note: "A third-base change in a codon often gives the same amino acid (the code is degenerate), so the protein is unchanged.", values: { pos: 6, kind: "ts", sample: "s1" } },
      { name: "Nonsense mutation", note: "Some substitutions create a stop codon early, so translation ends and the protein is cut short.", values: { pos: 10, kind: "tv", sample: "s1" } },
    ] },
  { id: "microbe", title: "Bacterial growth curve", where: [["BTT-001", 2]], blurb: "Watch a culture pass through lag, exponential, stationary and death phases on a Petri dish and on a log-scale growth curve; change growth rate, lag and nutrients.", topics: ["Bacterial growth curve", "Generation time", "Microbial culture"], animated: true,
    presets: [
      { name: "E. coli-like growth", note: "μ = 0.7 per hour gives a generation time of ln 2/μ ≈ 1 hour: the culture grows a million-fold in about 20 generations.", values: { t: 8, mu: 0.7, lag: 2, log0: 3, logK: 9, kd: 0.2, stat: 6 } },
      { name: "Long lag phase", note: "Cells moved to a new medium spend a long lag phase making the enzymes they need before dividing: no growth at all until then.", values: { t: 6, mu: 0.7, lag: 8, log0: 3, logK: 9, kd: 0.2, stat: 6 } },
      { name: "Decline after the plateau", note: "When nutrients run out and waste builds up, the stationary phase ends and the living count falls first-order in the death phase.", values: { t: 30, mu: 0.9, lag: 1, log0: 4, logK: 9, kd: 0.4, stat: 4 } },
    ] },
  { id: "boxmodel", title: "CSS box model", where: [["WD-101", 4]], blurb: "Set width, height, padding, border and margin and see the nested layers of an element in 3D, with the exact sizes the browser renders for content-box and border-box.", topics: ["CSS box model", "box-sizing", "Margin, border and padding"], animated: true,
    presets: [
      { name: "content-box surprise", note: "With the default content-box, width 200 px means content only, so the rendered box is 200 + 2×20 + 2×6 = 252 px wide.", values: { w: 200, h: 120, pad: 20, bor: 6, mar: 20, sizing: "content" } },
      { name: "border-box keeps width", note: "border-box makes width include padding and border, so the element stays exactly 200 px wide and the content shrinks to 148 px.", values: { w: 200, h: 120, pad: 20, bor: 6, mar: 20, sizing: "border" } },
      { name: "Thick border, no margin", note: "Margin sits outside the border and does not add to the element's own box; it only pushes neighbours away.", values: { w: 200, h: 120, pad: 10, bor: 24, mar: 0, sizing: "content" } },
    ] },
];
