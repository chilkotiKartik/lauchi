import type { Lesson } from "./types";

const diodeVI: Lesson = {
  intro: "The V-I curve of a p-n diode is the most repeated idea in Basic Electronics. It tells you why a diode conducts one way and blocks the other, and it gives you the numbers (cut-in voltage, static and dynamic resistance) that every rectifier and clipper question uses. It is a frequent 5 to 10 mark question, often with a Shockley-equation numerical. After this lesson you can draw the curve, explain each region, and calculate DC and AC resistance.",
  sections: [
    {
      h: "What happens at the junction",
      p: [
        "A p-n junction joins p-type (lots of holes) and n-type (lots of free electrons). Near the join, electrons and holes meet and cancel. This leaves a thin region with no free carriers, only fixed charged atoms. It is called the depletion layer.",
        "The fixed charges make a built-in electric field. It acts like a small hill that stops further flow. This hill is the barrier potential: about 0.7 V for silicon and 0.3 V for germanium.",
      ],
    },
    {
      h: "Forward and reverse bias",
      p: [
        "Forward bias: p side to the positive terminal, n side to the negative. The external voltage opposes the barrier, so the depletion layer shrinks. Once the applied voltage is about the barrier height (the cut-in or knee voltage), current rises very fast.",
        "Reverse bias: p side to negative. The external voltage adds to the barrier, so the depletion layer widens. Only a tiny reverse saturation current I<sub>0</sub> flows, carried by minority carriers. It is nanoamps in silicon and microamps in germanium, and it grows with temperature.",
        "If the reverse voltage becomes large enough, the diode breaks down and the current shoots up. This is the breakdown region, used in Zener diodes.",
      ],
    },
    {
      h: "The diode equation",
      p: [
        "Shockley worked out the current for any bias voltage V (positive for forward, negative for reverse). Use η = 1 for germanium and η ≈ 2 for silicon at small currents, but most textbook problems say take η = 1 unless told otherwise.",
        "Thermal voltage V<sub>T</sub> = kT/q. At room temperature (300 K) it is about 26 mV (some books use 25.85 mV). Check what your question gives.",
        "Quick checks from the equation: for forward V much greater than V<sub>T</sub>, the −1 can be dropped and I grows exponentially. For reverse V of a few V<sub>T</sub> or more, the exponential vanishes and I = −I<sub>0</sub>.",
      ],
      formula: [
        "I = I<sub>0</sub> (e<sup>V/ηV<sub>T</sub></sup> − 1)",
        "V<sub>T</sub> = kT/q = T / 11600 ≈ 26 mV at 300 K",
        "I<sub>0</sub> approximately doubles for every 10 °C rise in temperature",
      ],
    },
    {
      h: "Static and dynamic resistance",
      p: [
        "Static (DC) resistance is the ratio of voltage to current at one fixed point on the curve. It changes from point to point.",
        "Dynamic (AC) resistance is the slope-based resistance for small changes around a point: r<sub>d</sub> = dV/dI. Differentiate the diode equation. For forward bias with V much bigger than V<sub>T</sub>, dI/dV = I/(ηV<sub>T</sub>), so r<sub>d</sub> = ηV<sub>T</sub>/I.",
        "Remember the result: at 26 mV, r<sub>d</sub> ≈ 26 / I(mA) ohms. At 1 mA the dynamic resistance is about 26 Ω. At higher current it falls. In reverse bias it is huge (megaohms).",
      ],
      formula: [
        "R<sub>DC</sub> = V / I (at the operating point)",
        "r<sub>d</sub> = dV/dI = ηV<sub>T</sub> / I",
        "r<sub>d</sub> ≈ 26 mV / I (forward, η = 1, 300 K)",
      ],
    },
  ],
  examples: [
    {
      q: "Draw the V-I characteristic of a p-n junction diode and explain the forward, reverse and breakdown regions. (Theory, 5 marks)",
      steps: [
        "Draw axes: +V and +I to the right and up (forward); −V and −I to the left and down (reverse). Use different scales: mA for forward current and µA for reverse.",
        "Forward curve: almost zero current until the knee (0.7 V Si, 0.3 V Ge), then a steep exponential rise.",
        "Reverse curve: a flat tiny current −I<sub>0</sub> for a wide voltage range.",
        "At the breakdown voltage V<sub>BR</sub> the reverse current rises sharply (avalanche or Zener effect).",
        "Write the equation I = I<sub>0</sub>(e<sup>V/ηV<sub>T</sub></sup> − 1) next to the figure.",
      ],
      ans: "Knee about 0.7 V (Si) and 0.3 V (Ge); reverse current is only I₀ until breakdown.",
    },
    {
      q: "A silicon diode has I<sub>0</sub> = 2 nA at 300 K. It is forward biased at 0.6 V. Find the current, the static resistance and the dynamic resistance. Take η = 1 and V<sub>T</sub> = 26 mV.",
      steps: [
        "V/V<sub>T</sub> = 0.6 / 0.026 = 23.077.",
        "e<sup>23.077</sup> ≈ 1.052 × 10<sup>10</sup>.",
        "I = 2 × 10<sup>−9</sup> × (1.052 × 10<sup>10</sup> − 1) ≈ 21.05 mA.",
        "R<sub>DC</sub> = V/I = 0.6 / 0.02105 ≈ 28.5 Ω.",
        "r<sub>d</sub> = V<sub>T</sub>/I = 0.026 / 0.02105 ≈ 1.24 Ω.",
      ],
      ans: "I ≈ 21.05 mA, R_DC ≈ 28.5 Ω, r_d ≈ 1.24 Ω",
    },
    {
      q: "For the same diode, find the current at a reverse bias of 0.5 V.",
      steps: [
        "V = −0.5 V, so V/V<sub>T</sub> = −19.23.",
        "e<sup>−19.23</sup> ≈ 4.4 × 10<sup>−9</sup>, which is essentially zero.",
        "I = I<sub>0</sub>(0 − 1) = −I<sub>0</sub> = −2 nA.",
      ],
      ans: "I ≈ −2 nA (the reverse saturation current)",
    },
  ],
  mistakes: [
    "Forgetting the −1 in the diode equation, or dropping it in reverse bias where it is the whole answer.",
    "Using V<sub>T</sub> = 26 V instead of 26 mV. Always convert to volts.",
    "Mixing up static and dynamic resistance. Static is V/I; dynamic is ηV<sub>T</sub>/I and is not the same.",
    "Drawing the forward and reverse axes on the same scale. The reverse current is a thousand times smaller.",
    "Saying that reverse current grows with reverse voltage. It stays at I<sub>0</sub> until breakdown.",
  ],
  check: [
    {
      q: "At 300 K the thermal voltage is about",
      o: ["26 mV", "0.7 V", "26 V", "2.6 mV"],
      a: 0,
      why: "V<sub>T</sub> = kT/q = 300 / 11600 ≈ 25.9 mV.",
    },
    {
      q: "A forward biased diode carries 2 mA. Its dynamic resistance (η = 1, V<sub>T</sub> = 26 mV) is",
      o: ["13 Ω", "26 Ω", "52 Ω", "130 Ω"],
      a: 0,
      why: "r<sub>d</sub> = 26 mV / 2 mA = 13 Ω.",
    },
    {
      q: "In reverse bias well below breakdown, the diode current is nearly",
      o: ["−I<sub>0</sub>", "zero exactly", "+I<sub>0</sub>", "proportional to the reverse voltage"],
      a: 0,
      why: "The exponential term vanishes, leaving I = −I<sub>0</sub>.",
    },
    {
      q: "The reverse saturation current of a diode roughly doubles for every",
      o: ["10 °C rise", "1 °C rise", "50 °C rise", "1 V increase"],
      a: 0,
      why: "It is a standard rule of thumb for both Si and Ge.",
    },
  ],
  lab: { id: "tunnel", label: "Compare V-I curves of tunnel and Schottky diodes" },
};

const fullWave: Lesson = {
  intro: "Rectifiers turn AC into DC and appear in almost every paper, with a long answer on working, efficiency and ripple factor. This is one of the most repeated topics in the whole subject. After this lesson you can explain the centre-tap and bridge circuits, derive I<sub>dc</sub>, efficiency and ripple factor, and do the numerical.",
  sections: [
    {
      h: "How the circuits work",
      p: [
        "A half-wave rectifier uses one diode and conducts for only half of each AC cycle. A full-wave rectifier uses both half-cycles, so the output is smoother and the DC value doubles.",
        "Centre-tap: a transformer with a centre-tapped secondary and two diodes. D1 conducts in the positive half and D2 in the negative half. Here V<sub>m</sub> is the peak voltage of each half of the secondary, and it is the peak of the output.",
        "Bridge: four diodes, no centre tap. In the positive half, D1 and D3 conduct; in the negative half, D2 and D4 conduct. The load current always flows the same way. The price is two diode drops in series.",
      ],
    },
    {
      h: "Derivation for the full wave",
      p: [
        "Let the load voltage be v = V<sub>m</sub> sin ωt for 0 to π, and repeat. Then i = I<sub>m</sub> sin ωt, where I<sub>m</sub> = V<sub>m</sub> / (R<sub>L</sub> + r<sub>f</sub>). For ideal diodes take r<sub>f</sub> = 0.",
        "Step 1. DC value is the average over one period of the output, which repeats every π. I<sub>dc</sub> = (1/π) ∫<sub>0</sub><sup>π</sup> I<sub>m</sub> sin θ dθ = 2I<sub>m</sub>/π ≈ 0.636 I<sub>m</sub>.",
        "Step 2. RMS value is I<sub>rms</sub> = √[(1/π) ∫<sub>0</sub><sup>π</sup> I<sub>m</sub><sup>2</sup> sin<sup>2</sup>θ dθ] = I<sub>m</sub>/√2 ≈ 0.707 I<sub>m</sub>.",
        "Step 3. DC power P<sub>dc</sub> = I<sub>dc</sub><sup>2</sup>R<sub>L</sub>. AC input power P<sub>ac</sub> = I<sub>rms</sub><sup>2</sup>(R<sub>L</sub> + r<sub>f</sub>). Efficiency η = P<sub>dc</sub>/P<sub>ac</sub>.",
        "Step 4. With r<sub>f</sub> = 0, η = (2I<sub>m</sub>/π)<sup>2</sup> / (I<sub>m</sub>/√2)<sup>2</sup> = 8/π<sup>2</sup> = 81.2 %.",
        "Step 5. Ripple factor γ = I<sub>ac</sub>/I<sub>dc</sub>, where the AC part (rms of the ripple) is I<sub>ac</sub> = √(I<sub>rms</sub><sup>2</sup> − I<sub>dc</sub><sup>2</sup>). So γ = √[(I<sub>rms</sub>/I<sub>dc</sub>)<sup>2</sup> − 1] = √[π<sup>2</sup>/8 − 1] = 0.483.",
      ],
      formula: [
        "I<sub>dc</sub> = 2I<sub>m</sub>/π, V<sub>dc</sub> = 2V<sub>m</sub>/π (ideal)",
        "I<sub>rms</sub> = I<sub>m</sub>/√2",
        "η<sub>max</sub> = 81.2 % (full wave) and 40.6 % (half wave)",
        "γ = 0.482 (full wave) and 1.21 (half wave)",
        "PIV = 2V<sub>m</sub> (centre-tap) and V<sub>m</sub> (bridge)",
        "TUF = 0.693 (centre-tap, full wave); 0.287 (half wave)",
      ],
    },
    {
      h: "Comparing the circuits",
      p: [
        "Centre-tap needs a centre-tapped transformer and each diode must withstand 2V<sub>m</sub> (PIV). The bridge needs no special transformer and its PIV is only V<sub>m</sub>, but it uses four diodes and loses about 1.4 V in two silicon diodes.",
        "Ripple frequency of a full wave rectifier is twice the supply frequency (100 Hz for 50 Hz mains). Half wave gives the same frequency as the supply. Higher ripple frequency is easier to filter.",
        "A capacitor filter across the load reduces the ripple further. The lab below shows how the capacitor changes the output.",
      ],
    },
  ],
  examples: [
    {
      q: "Explain the working of a full wave bridge rectifier and derive its efficiency and ripple factor. (Theory, 10 marks)",
      steps: [
        "Draw the bridge: four diodes in a diamond, AC at two opposite corners, R<sub>L</sub> across the other two.",
        "Positive half: D1 and D3 conduct. Negative half: D2 and D4 conduct. Current through R<sub>L</sub> is always in the same direction.",
        "I<sub>dc</sub> = 2I<sub>m</sub>/π and I<sub>rms</sub> = I<sub>m</sub>/√2 (derive by integration).",
        "Efficiency η = P<sub>dc</sub>/P<sub>ac</sub> = 8/π<sup>2</sup> = 81.2 %.",
        "Ripple factor γ = √(I<sub>rms</sub><sup>2</sup>/I<sub>dc</sub><sup>2</sup> − 1) = 0.482.",
        "State PIV = V<sub>m</sub> and ripple frequency = 2f.",
      ],
      ans: "η = 81.2 %, γ = 0.482, PIV = V_m, ripple frequency = 2f",
    },
    {
      q: "A bridge rectifier is fed from a 12 V rms secondary. R<sub>L</sub> = 100 Ω. Assume ideal diodes. Find V<sub>dc</sub>, I<sub>dc</sub>, I<sub>rms</sub>, the efficiency and the PIV.",
      steps: [
        "V<sub>m</sub> = 12 × √2 = 16.97 V.",
        "I<sub>m</sub> = 16.97 / 100 = 0.1697 A.",
        "I<sub>dc</sub> = 2I<sub>m</sub>/π = 0.1080 A = 108 mA. V<sub>dc</sub> = 0.108 × 100 = 10.80 V.",
        "I<sub>rms</sub> = I<sub>m</sub>/√2 = 0.120 A = 120 mA.",
        "P<sub>dc</sub> = (0.108)<sup>2</sup> × 100 = 1.167 W. P<sub>ac</sub> = (0.120)<sup>2</sup> × 100 = 1.44 W.",
        "η = 1.167 / 1.44 = 81.1 % (close to 81.2 %). Check: ripple = √[(0.120/0.108)<sup>2</sup> − 1] = 0.483.",
        "PIV = V<sub>m</sub> = 16.97 V.",
      ],
      ans: "V_dc = 10.8 V, I_dc = 108 mA, I_rms = 120 mA, η = 81.2 %, PIV = 16.97 V",
    },
  ],
  mistakes: [
    "Saying the PIV of a centre-tap rectifier is V<sub>m</sub>. It is 2V<sub>m</sub>. The bridge has PIV = V<sub>m</sub>.",
    "Using the rms secondary voltage as V<sub>m</sub>. Always convert: V<sub>m</sub> = √2 × V<sub>rms</sub>.",
    "Writing the ripple factor as I<sub>ac</sub>/I<sub>rms</sub> instead of I<sub>ac</sub>/I<sub>dc</sub>.",
    "Quoting 40.6 % for the full wave. It is 81.2 % for full wave and 40.6 % for half wave.",
    "Forgetting that the bridge has two diodes in series, so the real output is V<sub>m</sub> − 1.4 V for silicon.",
  ],
  check: [
    {
      q: "The maximum efficiency of a full wave rectifier is",
      o: ["81.2 %", "40.6 %", "50 %", "100 %"],
      a: 0,
      why: "η = 8/π<sup>2</sup> = 0.812 for resistive load.",
    },
    {
      q: "The ripple factor of a full wave rectifier without a filter is about",
      o: ["0.48", "1.21", "0.81", "0.64"],
      a: 0,
      why: "γ = √(π<sup>2</sup>/8 − 1) = 0.483.",
    },
    {
      q: "For a 50 Hz supply, the output ripple frequency of a bridge rectifier is",
      o: ["100 Hz", "50 Hz", "25 Hz", "200 Hz"],
      a: 0,
      why: "Both half cycles produce a pulse, so the ripple frequency is 2f.",
    },
    {
      q: "The PIV of each diode in a centre-tap full wave rectifier is",
      o: ["2V<sub>m</sub>", "V<sub>m</sub>", "V<sub>m</sub>/2", "V<sub>m</sub>/π"],
      a: 0,
      why: "When one diode conducts, the other sees the full secondary, which is 2V<sub>m</sub>.",
    },
  ],
  lab: { id: "bridgerect", label: "Bridge vs centre-tap rectifier" },
};

const zenerReg: Lesson = {
  intro: "A Zener diode keeps a nearly constant voltage across a load even when the supply or the load changes. That is the whole idea of the shunt regulator. Examiners ask the circuit, the working, and a design numerical (find R<sub>s</sub> and check the limits). It is repeated almost every year. After this lesson you can do both.",
  sections: [
    {
      h: "Zener breakdown and the flat region",
      p: [
        "A Zener diode is a heavily doped p-n junction designed to be used in reverse breakdown. Two breakdown mechanisms exist. Zener breakdown happens below about 5 V: the strong field at the narrow junction pulls electrons straight out of their bonds. Avalanche breakdown happens above about 7 V: fast carriers knock out more carriers by collision.",
        "In breakdown, the voltage across the diode stays almost fixed at V<sub>Z</sub> while the current changes a lot. A small slope remains. Its inverse is the Zener (dynamic) resistance r<sub>z</sub> = ΔV<sub>Z</sub>/ΔI<sub>Z</sub>, usually a few ohms.",
        "Zener diodes have a minimum current I<sub>Z,min</sub> (knee current) to stay in regulation, and a maximum current I<sub>Z,max</sub> set by power rating: I<sub>Z,max</sub> = P<sub>Z</sub>/V<sub>Z</sub>.",
      ],
    },
    {
      h: "The shunt regulator circuit",
      p: [
        "Connect a series resistor R<sub>s</sub> from the unregulated input V<sub>in</sub>. Put the Zener (reverse biased) across the load R<sub>L</sub>. The load voltage is V<sub>Z</sub>.",
        "KCL at the output node: the current through R<sub>s</sub> splits into the Zener current and the load current. This is the rule you need: I<sub>s</sub> = I<sub>Z</sub> + I<sub>L</sub>.",
        "If the input rises, more current flows in R<sub>s</sub>. The extra goes into the Zener, and the extra drop appears across R<sub>s</sub>, so V<sub>out</sub> stays at V<sub>Z</sub>. If the load current rises, I<sub>Z</sub> falls by the same amount. The diode takes whatever the load does not.",
      ],
      formula: [
        "I<sub>s</sub> = (V<sub>in</sub> − V<sub>Z</sub>) / R<sub>s</sub>",
        "I<sub>L</sub> = V<sub>Z</sub> / R<sub>L</sub>",
        "I<sub>Z</sub> = I<sub>s</sub> − I<sub>L</sub>",
      ],
    },
    {
      h: "Design rules and limits",
      p: [
        "The diode must stay in breakdown in the worst case. The worst case for minimum Zener current is lowest input and largest load current. The worst case for maximum Zener current is highest input and smallest load current (usually no load).",
        "So choose R<sub>s</sub> from the first case, then check the second case does not exceed I<sub>Z,max</sub> or the power rating.",
      ],
      formula: [
        "R<sub>s</sub> = (V<sub>in,min</sub> − V<sub>Z</sub>) / (I<sub>Z,min</sub> + I<sub>L,max</sub>)",
        "I<sub>Z,max (actual)</sub> = (V<sub>in,max</sub> − V<sub>Z</sub>) / R<sub>s</sub> − I<sub>L,min</sub>",
        "Power in Zener = V<sub>Z</sub> × I<sub>Z</sub>",
      ],
    },
  ],
  examples: [
    {
      q: "With a neat circuit, explain how a Zener diode regulates voltage against changes in input and load. (Theory, 5 marks)",
      steps: [
        "Draw: V<sub>in</sub> → R<sub>s</sub> → node. Zener (cathode at the node) and R<sub>L</sub> in parallel to ground.",
        "Use KCL: I<sub>s</sub> = I<sub>Z</sub> + I<sub>L</sub>.",
        "Input rises: I<sub>s</sub> rises, I<sub>Z</sub> takes the extra, V<sub>out</sub> stays at V<sub>Z</sub> as the extra voltage falls across R<sub>s</sub>.",
        "Load current rises: I<sub>s</sub> is nearly fixed, so I<sub>Z</sub> falls by the same amount; V<sub>out</sub> is nearly constant.",
        "Regulation holds only while I<sub>Z,min</sub> ≤ I<sub>Z</sub> ≤ I<sub>Z,max</sub>.",
      ],
      ans: "V_out ≈ V_Z; the Zener absorbs changes of input and load current.",
    },
    {
      q: "A 10 V Zener has I<sub>Z,min</sub> = 5 mA. The input varies from 14 V to 18 V. The load R<sub>L</sub> is 500 Ω (maximum load current) and may be removed. Design R<sub>s</sub> and find the maximum Zener current and power.",
      steps: [
        "I<sub>L,max</sub> = 10 / 500 = 20 mA.",
        "Worst case for the minimum current: V<sub>in</sub> = 14 V, load on. R<sub>s</sub> = (14 − 10) / (5 + 20) mA = 4 / 0.025 = 160 Ω.",
        "Worst case for the maximum current: V<sub>in</sub> = 18 V, no load (I<sub>L</sub> = 0). I<sub>Z,max</sub> = (18 − 10) / 160 = 50 mA.",
        "Zener power = 10 × 0.05 = 0.5 W. So choose a Zener rated at 0.5 W or more (1 W is safer).",
      ],
      ans: "R_s = 160 Ω, I_Z,max = 50 mA, P_Z = 0.5 W",
    },
  ],
  mistakes: [
    "Connecting the Zener in forward bias. It must be reverse biased (cathode towards the positive supply) for regulation.",
    "Leaving out the series resistor. Without R<sub>s</sub> the Zener current is unlimited and the diode burns.",
    "Using the wrong worst case: R<sub>s</sub> comes from minimum input and maximum load; the power check uses maximum input and minimum load.",
    "Taking the load current as (V<sub>in</sub> − V<sub>Z</sub>)/R<sub>s</sub>. That is the current through R<sub>s</sub>, not the load.",
    "Confusing the Zener and avalanche mechanisms: Zener below about 5 V, avalanche above about 7 V.",
  ],
  check: [
    {
      q: "In a Zener shunt regulator the Zener diode is connected",
      o: ["in parallel with the load, reverse biased", "in series with the load, forward biased", "in parallel with the load, forward biased", "in series with R<sub>s</sub> only"],
      a: 0,
      why: "The Zener works in reverse breakdown, across the load.",
    },
    {
      q: "A 12 V supply feeds R<sub>s</sub> = 200 Ω and a 6 V Zener with no load. The Zener current is",
      o: ["30 mA", "60 mA", "20 mA", "0"],
      a: 0,
      why: "I = (12 − 6)/200 = 0.03 A = 30 mA.",
    },
    {
      q: "If the load current increases (input fixed), the Zener current",
      o: ["decreases", "increases", "stays the same", "becomes negative"],
      a: 0,
      why: "I<sub>s</sub> is nearly fixed, so I<sub>Z</sub> = I<sub>s</sub> − I<sub>L</sub> falls.",
    },
    {
      q: "The maximum Zener current of a 5 V, 1 W Zener is",
      o: ["200 mA", "5 mA", "20 mA", "500 mA"],
      a: 0,
      why: "I = P/V = 1/5 = 0.2 A.",
    },
  ],
  lab: { id: "zener", label: "Zener voltage regulator" },
};

const bjtAction: Lesson = {
  intro: "A transistor is two p-n junctions back to back, and a small base current controls a big collector current. The current-gain relationships α, β and γ with their leakage terms are asked every year. This lesson builds the physical picture so the formulas become easy to remember. After it you can explain transistor action, derive β = α/(1 − α), and solve gain numericals.",
  sections: [
    {
      h: "Construction and the three regions",
      p: [
        "A BJT has three doped regions: emitter, base and collector. An npn type has n-p-n layers; a pnp has p-n-p.",
        "The emitter is heavily doped, because it must supply many carriers. The base is very thin and lightly doped, so most carriers pass straight through it. The collector is moderately doped and the largest, to collect carriers and dissipate heat.",
      ],
    },
    {
      h: "Transistor action (npn, active region)",
      p: [
        "Active region: the emitter-base junction is forward biased and the collector-base junction is reverse biased.",
        "Step 1. The forward bias pushes many electrons from the emitter into the base.",
        "Step 2. The base is thin and lightly doped, so only a few electrons (a percent or two) recombine with holes. This small loss is the base current I<sub>B</sub>.",
        "Step 3. The rest reach the collector-base junction. The reverse bias field sweeps them into the collector. This is the collector current I<sub>C</sub>.",
        "So I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>. A small change in I<sub>B</sub> changes I<sub>C</sub> by a large amount. That is amplification.",
      ],
      formula: ["I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>"],
    },
    {
      h: "Current gains",
      p: [
        "α (common-base current gain) is the fraction of the emitter current that reaches the collector: α = I<sub>C</sub>/I<sub>E</sub>. It is slightly less than 1 (0.95 to 0.99).",
        "β (common-emitter current gain) is I<sub>C</sub>/I<sub>B</sub>, usually 50 to 300.",
        "Derivation of the link: I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>. Divide by I<sub>C</sub>: 1/α = 1/β + 1. So 1/β = 1/α − 1 = (1 − α)/α, giving β = α/(1 − α) and α = β/(1 + β).",
        "Leakage: even with the emitter open, a small reverse current I<sub>CBO</sub> flows in the collector-base junction. In CE it is amplified: I<sub>CEO</sub> = (1 + β) I<sub>CBO</sub>.",
        "γ (common-collector gain) = I<sub>E</sub>/I<sub>B</sub> = 1 + β.",
      ],
      formula: [
        "α = I<sub>C</sub>/I<sub>E</sub>, β = I<sub>C</sub>/I<sub>B</sub>, γ = I<sub>E</sub>/I<sub>B</sub> = 1 + β",
        "β = α/(1 − α), α = β/(1 + β)",
        "I<sub>C</sub> = αI<sub>E</sub> + I<sub>CBO</sub>",
        "I<sub>C</sub> = βI<sub>B</sub> + (1 + β)I<sub>CBO</sub> = βI<sub>B</sub> + I<sub>CEO</sub>",
      ],
    },
  ],
  examples: [
    {
      q: "Explain the action of an npn transistor in the active region and derive the relation between α and β. (Theory, 10 marks)",
      steps: [
        "Draw the npn structure with biases: V<sub>EE</sub> forward biases the emitter-base; V<sub>CC</sub> reverse biases the collector-base.",
        "Explain the emitter injecting electrons, a small recombination in the thin base, and the collector collecting the rest.",
        "Write I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>.",
        "Define α = I<sub>C</sub>/I<sub>E</sub> and β = I<sub>C</sub>/I<sub>B</sub>.",
        "Divide I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> by I<sub>C</sub> to get 1/α = 1/β + 1.",
        "Rearrange: β = α/(1 − α).",
      ],
      ans: "β = α/(1 − α) and α = β/(1 + β)",
    },
    {
      q: "A transistor has α = 0.98 and I<sub>E</sub> = 5 mA. Find β, I<sub>C</sub> and I<sub>B</sub>.",
      steps: [
        "β = α/(1 − α) = 0.98 / 0.02 = 49.",
        "I<sub>C</sub> = αI<sub>E</sub> = 0.98 × 5 = 4.9 mA.",
        "I<sub>B</sub> = I<sub>E</sub> − I<sub>C</sub> = 5 − 4.9 = 0.1 mA. Check: I<sub>C</sub>/I<sub>B</sub> = 49. ✓",
      ],
      ans: "β = 49, I_C = 4.9 mA, I_B = 0.1 mA",
    },
    {
      q: "In a CE circuit β = 100, I<sub>B</sub> = 40 µA and I<sub>CBO</sub> = 5 µA. Find I<sub>CEO</sub>, I<sub>C</sub> and I<sub>E</sub>.",
      steps: [
        "I<sub>CEO</sub> = (1 + β) I<sub>CBO</sub> = 101 × 5 µA = 505 µA.",
        "I<sub>C</sub> = βI<sub>B</sub> + I<sub>CEO</sub> = 100 × 40 µA + 505 µA = 4000 + 505 = 4505 µA ≈ 4.505 mA.",
        "I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> = 0.040 + 4.505 = 4.545 mA.",
      ],
      ans: "I_CEO = 505 µA, I_C ≈ 4.505 mA, I_E ≈ 4.545 mA",
    },
  ],
  mistakes: [
    "Writing β = α/(1 + α). The correct form is β = α/(1 − α).",
    "Saying α can be greater than 1. It is always just below 1, because some carriers recombine in the base.",
    "Forgetting the leakage term. In CE it is (1 + β)I<sub>CBO</sub>, not I<sub>CBO</sub>.",
    "Giving wrong biasing: the active region needs emitter-base forward and collector-base reverse.",
    "Writing I<sub>B</sub> = I<sub>C</sub> + I<sub>E</sub>. The emitter current is the sum: I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>.",
  ],
  check: [
    {
      q: "If α = 0.99, then β is",
      o: ["99", "9.9", "0.99", "100"],
      a: 0,
      why: "β = 0.99/(1 − 0.99) = 99.",
    },
    {
      q: "In the active region the junction biasing is",
      o: ["EB forward, CB reverse", "EB reverse, CB forward", "both forward", "both reverse"],
      a: 0,
      why: "Active needs a forward emitter junction and a reverse collector junction.",
    },
    {
      q: "I<sub>CEO</sub> equals",
      o: ["(1 + β) I<sub>CBO</sub>", "β I<sub>CBO</sub>", "I<sub>CBO</sub>/(1 + β)", "α I<sub>CBO</sub>"],
      a: 0,
      why: "The CBO leakage is amplified through the base: I<sub>CEO</sub> = (1 + β)I<sub>CBO</sub>.",
    },
    {
      q: "Why is the base made thin and lightly doped?",
      o: ["So few carriers recombine and most reach the collector", "To increase base current", "To raise the breakdown voltage", "To make the emitter smaller"],
      a: 0,
      why: "Low recombination keeps I<sub>B</sub> small and α close to 1.",
    },
  ],
  lab: { id: "bjtconfig", label: "BJT in CB, CE & CC: characteristics" },
};

const vdivBias: Lesson = {
  intro: "A transistor amplifier only works well if its DC operating point (the Q-point) is steady. Potential divider (voltage divider) bias is the circuit that holds the Q-point steady, and it is the best-asked biasing question. Expect a derivation of the stability factor or a numerical for I<sub>C</sub> and V<sub>CE</sub>. After this lesson you can solve both.",
  sections: [
    {
      h: "Why biasing and the Q-point",
      p: [
        "Biasing means setting DC currents and voltages so that the transistor sits in the active region. The Q-point is the pair (V<sub>CE</sub>, I<sub>C</sub>) with no signal. It lies on the DC load line: V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>) (taking I<sub>E</sub> ≈ I<sub>C</sub>).",
        "Fixed bias is the simplest: one resistor from V<sub>CC</sub> to the base. But I<sub>C</sub> then depends directly on β, and β changes from device to device and with temperature. The Q-point wanders and the output may clip or saturate.",
      ],
    },
    {
      h: "The potential divider circuit",
      p: [
        "R<sub>1</sub> from V<sub>CC</sub> to the base and R<sub>2</sub> from the base to ground make a voltage divider. An emitter resistor R<sub>E</sub> provides negative feedback.",
        "Why it is stable: if I<sub>C</sub> rises (higher β or temperature), the drop I<sub>E</sub>R<sub>E</sub> rises. The base voltage is held by the divider, so V<sub>BE</sub> falls. The base current falls and pulls I<sub>C</sub> back down.",
      ],
    },
    {
      h: "Exact analysis using Thevenin",
      p: [
        "Step 1. Replace the divider by its Thevenin equivalent seen from the base: V<sub>TH</sub> = V<sub>CC</sub> R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>) and R<sub>TH</sub> = R<sub>1</sub> ∥ R<sub>2</sub>.",
        "Step 2. KVL around the base-emitter loop: V<sub>TH</sub> = I<sub>B</sub>R<sub>TH</sub> + V<sub>BE</sub> + I<sub>E</sub>R<sub>E</sub>, with I<sub>E</sub> = (1 + β)I<sub>B</sub>.",
        "Step 3. Solve for I<sub>B</sub>, then I<sub>C</sub> = βI<sub>B</sub>. Then use the collector loop for V<sub>CE</sub>.",
        "Shortcut: if R<sub>TH</sub> is much smaller than (1 + β)R<sub>E</sub> (the thumb rule R<sub>TH</sub> ≤ 0.1βR<sub>E</sub>), then I<sub>E</sub> ≈ (V<sub>TH</sub> − V<sub>BE</sub>)/R<sub>E</sub>, which does not depend on β at all.",
      ],
      formula: [
        "V<sub>TH</sub> = V<sub>CC</sub> R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>), R<sub>TH</sub> = R<sub>1</sub>R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)",
        "I<sub>B</sub> = (V<sub>TH</sub> − V<sub>BE</sub>) / (R<sub>TH</sub> + (1 + β)R<sub>E</sub>)",
        "V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub> − I<sub>E</sub>R<sub>E</sub>",
      ],
    },
    {
      h: "Stability factor",
      p: [
        "The stability factor S = ∂I<sub>C</sub>/∂I<sub>CO</sub> says how much I<sub>C</sub> changes for a change in the leakage current. The lower S is, the more stable the circuit. The lowest possible value is 1.",
        "For fixed bias, S = 1 + β (bad). For the potential divider, with the base resistance R<sub>B</sub> = R<sub>TH</sub>, the result is the formula below. Make R<sub>TH</sub>/R<sub>E</sub> small and S approaches 1.",
      ],
      formula: [
        "S = (1 + β)(1 + R<sub>TH</sub>/R<sub>E</sub>) / (1 + β + R<sub>TH</sub>/R<sub>E</sub>)",
        "Fixed bias: S = 1 + β",
      ],
    },
  ],
  examples: [
    {
      q: "Explain why the potential divider bias gives a stable Q-point and derive the expression for the stability factor S. (Theory, 10 marks)",
      steps: [
        "Draw the circuit and the Thevenin equivalent: V<sub>TH</sub>, R<sub>TH</sub>, R<sub>E</sub>, R<sub>C</sub>.",
        "KVL: V<sub>TH</sub> = I<sub>B</sub>R<sub>TH</sub> + V<sub>BE</sub> + I<sub>E</sub>R<sub>E</sub>, and I<sub>C</sub> = βI<sub>B</sub> + (1 + β)I<sub>CBO</sub>, I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>.",
        "Differentiate w.r.t. I<sub>C</sub> (treating I<sub>CBO</sub> as the variable): 0 = R<sub>TH</sub> dI<sub>B</sub>/dI<sub>C</sub> + R<sub>E</sub>(dI<sub>B</sub>/dI<sub>C</sub> + 1).",
        "So dI<sub>B</sub>/dI<sub>C</sub> = −R<sub>E</sub> / (R<sub>TH</sub> + R<sub>E</sub>).",
        "Differentiate I<sub>C</sub> = βI<sub>B</sub> + (1 + β)I<sub>CBO</sub> w.r.t. I<sub>C</sub>: 1 = β dI<sub>B</sub>/dI<sub>C</sub> + (1 + β) dI<sub>CBO</sub>/dI<sub>C</sub>. Put in step 4 and note S = dI<sub>C</sub>/dI<sub>CBO</sub>: 1/S = [1 + βR<sub>E</sub>/(R<sub>TH</sub> + R<sub>E</sub>)]/(1 + β).",
        "Simplify: S = (1 + β)(1 + R<sub>TH</sub>/R<sub>E</sub>) / (1 + β + R<sub>TH</sub>/R<sub>E</sub>).",
        "Conclude: smaller R<sub>TH</sub>/R<sub>E</sub> gives smaller S and a more stable Q-point.",
      ],
      ans: "S = (1 + β)(1 + R_TH/R_E) / (1 + β + R_TH/R_E)",
    },
    {
      q: "In a potential divider circuit V<sub>CC</sub> = 12 V, R<sub>1</sub> = 40 kΩ, R<sub>2</sub> = 10 kΩ, R<sub>C</sub> = 2 kΩ, R<sub>E</sub> = 1 kΩ, β = 100, V<sub>BE</sub> = 0.7 V. Find the Q-point and the stability factor.",
      steps: [
        "V<sub>TH</sub> = 12 × 10/(40 + 10) = 2.4 V. R<sub>TH</sub> = 40 × 10/50 = 8 kΩ.",
        "I<sub>B</sub> = (2.4 − 0.7) / (8 k + 101 × 1 k) = 1.7 / 109 k = 15.6 µA.",
        "I<sub>C</sub> = βI<sub>B</sub> = 100 × 15.6 µA = 1.56 mA. I<sub>E</sub> = 101 × 15.6 µA = 1.575 mA.",
        "V<sub>CE</sub> = 12 − (1.56 mA)(2 k) − (1.575 mA)(1 k) = 12 − 3.12 − 1.575 = 7.30 V.",
        "S = 101 × (1 + 8)/(101 + 8) = 909/109 = 8.34. Compare with fixed bias S = 101.",
      ],
      ans: "I_C = 1.56 mA, V_CE = 7.3 V, S = 8.34",
    },
  ],
  mistakes: [
    "Using V<sub>B</sub> = V<sub>CC</sub>R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>) when the base current is not small. The exact way is Thevenin with R<sub>TH</sub>.",
    "Forgetting to multiply R<sub>E</sub> by (1 + β) in the base loop.",
    "Using I<sub>C</sub> instead of I<sub>E</sub> in the R<sub>E</sub> drop when exact accuracy is needed. They are close but not equal.",
    "Saying a larger S is better. A smaller S means more stable.",
    "Leaving out V<sub>BE</sub> (0.7 V for Si) in the KVL.",
  ],
  check: [
    {
      q: "The stability factor of fixed bias is",
      o: ["1 + β", "1", "β", "1/β"],
      a: 0,
      why: "With no emitter feedback, S = 1 + β, which is large (poor stability).",
    },
    {
      q: "A good stable biasing circuit has a stability factor",
      o: ["as close to 1 as possible", "as large as possible", "equal to β", "zero"],
      a: 0,
      why: "S = 1 is the ideal: I<sub>C</sub> does not change with I<sub>CO</sub>.",
    },
    {
      q: "In the potential divider circuit, R<sub>E</sub> stabilises I<sub>C</sub> because it provides",
      o: ["negative feedback", "positive feedback", "voltage gain", "higher β"],
      a: 0,
      why: "A rise in I<sub>E</sub> raises the emitter voltage and reduces V<sub>BE</sub>, pulling I<sub>C</sub> down.",
    },
    {
      q: "V<sub>CC</sub> = 12 V, R<sub>2</sub> = 10 kΩ, R<sub>1</sub> = 40 kΩ. The Thevenin voltage is",
      o: ["2.4 V", "9.6 V", "3 V", "1.2 V"],
      a: 0,
      why: "V<sub>TH</sub> = 12 × 10/50 = 2.4 V.",
    },
  ],
  lab: { id: "biasstab", label: "BJT bias stability & CE amplifier" },
};

const jfetChar: Lesson = {
  intro: "A JFET is a voltage-controlled device. Its gate voltage squeezes a channel and so controls the drain current. JFET construction, pinch-off and the characteristics are asked almost every year, along with a self-bias numerical. After this lesson you can explain the curves, use the Shockley equation, and solve a self-bias problem.",
  sections: [
    {
      h: "Construction and basic action",
      p: [
        "An n-channel JFET has a bar of n-type silicon (the channel) with a source at one end and a drain at the other. Two p-type regions diffused on the sides form the gate.",
        "The gate-channel junction is always reverse biased, so the gate draws almost no current. The input resistance is very high (10<sup>8</sup> to 10<sup>10</sup> Ω).",
        "A more negative V<sub>GS</sub> widens the depletion layers into the channel, so the channel narrows and the drain current falls. This is why the JFET is a voltage-controlled device.",
      ],
    },
    {
      h: "Pinch-off",
      p: [
        "Put V<sub>GS</sub> = 0 and raise V<sub>DS</sub> slowly. The drain current rises almost linearly (ohmic region).",
        "Current flowing down the channel makes the drain end more reverse biased than the source end. So the depletion layers are thicker near the drain and the channel narrows there.",
        "At a particular V<sub>DS</sub>, the two layers nearly touch at the drain end. This is pinch-off. The voltage V<sub>DS</sub> at which this happens (with V<sub>GS</sub> = 0) is the pinch-off voltage V<sub>P</sub> in magnitude.",
        "Beyond pinch-off, I<sub>D</sub> stops increasing (saturation). The current stays at I<sub>DSS</sub> (drain current with V<sub>GS</sub> = 0, the maximum drain saturation current). Carriers still flow through the narrow neck, but V<sub>DS</sub> now drops across the pinched part.",
      ],
    },
    {
      h: "Characteristics",
      p: [
        "Drain (output) characteristics: plot I<sub>D</sub> against V<sub>DS</sub> for several fixed V<sub>GS</sub>. Three regions: ohmic (linear rise), saturation or pinch-off (flat; the amplifier region) and breakdown (sharp rise at high V<sub>DS</sub>). More negative V<sub>GS</sub> gives lower curves and an earlier knee. The cut-off point is V<sub>GS</sub> = V<sub>P</sub>, where I<sub>D</sub> = 0.",
        "Transfer characteristic: plot I<sub>D</sub> against V<sub>GS</sub> at fixed V<sub>DS</sub> in saturation. It is a parabola from I<sub>DSS</sub> (at V<sub>GS</sub> = 0) down to zero (at V<sub>GS</sub> = V<sub>P</sub>).",
        "Transconductance g<sub>m</sub> = ∂I<sub>D</sub>/∂V<sub>GS</sub> is the slope of the transfer curve. It is largest at V<sub>GS</sub> = 0 and falls to zero at cut-off.",
      ],
      formula: [
        "I<sub>D</sub> = I<sub>DSS</sub> (1 − V<sub>GS</sub>/V<sub>P</sub>)<sup>2</sup> (saturation)",
        "g<sub>m0</sub> = 2I<sub>DSS</sub>/|V<sub>P</sub>|",
        "g<sub>m</sub> = g<sub>m0</sub> (1 − V<sub>GS</sub>/V<sub>P</sub>) = (2/|V<sub>P</sub>|) √(I<sub>DSS</sub> I<sub>D</sub>)",
        "r<sub>d</sub> = ΔV<sub>DS</sub>/ΔI<sub>D</sub> at constant V<sub>GS</sub>, and μ = g<sub>m</sub> r<sub>d</sub>",
      ],
    },
    {
      h: "Self-bias",
      p: [
        "A source resistor R<sub>S</sub> makes the circuit set its own bias. The gate is tied to ground through R<sub>G</sub>, with no DC current, so V<sub>G</sub> = 0. The drain current gives V<sub>S</sub> = I<sub>D</sub>R<sub>S</sub>, so V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>. This is automatically negative, as the n-channel JFET needs.",
        "Put this into the Shockley equation and you get a quadratic in I<sub>D</sub>. Two roots come out. Reject the one that gives |V<sub>GS</sub>| greater than |V<sub>P</sub>|.",
      ],
      formula: ["V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>", "V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>)"],
    },
  ],
  examples: [
    {
      q: "Explain pinch-off in a JFET and draw its drain characteristics. (Theory, 10 marks)",
      steps: [
        "Draw the n-channel JFET cross section, with the two p-gates and depletion layers.",
        "Say that the gate junction is reverse biased, so a wide depletion layer cuts the channel.",
        "With V<sub>GS</sub> = 0, increasing V<sub>DS</sub> makes the depletion layer wider near the drain. At V<sub>DS</sub> = |V<sub>P</sub>| the channel nearly closes there: pinch-off.",
        "After that I<sub>D</sub> saturates at I<sub>DSS</sub>.",
        "Draw the curves for V<sub>GS</sub> = 0, −1, −2 V and so on, each lower than the last, showing the ohmic, saturation and breakdown regions.",
        "Mark I<sub>D</sub> = 0 at V<sub>GS</sub> = V<sub>P</sub>.",
      ],
      ans: "Channel pinches at V_DS = |V_P|; beyond it I_D = I_DSS (for V_GS = 0).",
    },
    {
      q: "A JFET has I<sub>DSS</sub> = 10 mA and V<sub>P</sub> = −4 V. Find I<sub>D</sub>, g<sub>m0</sub> and g<sub>m</sub> at V<sub>GS</sub> = −2 V.",
      steps: [
        "I<sub>D</sub> = 10 (1 − (−2)/(−4))<sup>2</sup> = 10 (1 − 0.5)<sup>2</sup> = 2.5 mA.",
        "g<sub>m0</sub> = 2 × 10 mA/4 V = 5 mS.",
        "g<sub>m</sub> = 5 × (1 − 0.5) = 2.5 mS.",
      ],
      ans: "I_D = 2.5 mA, g_m0 = 5 mS, g_m = 2.5 mS",
    },
    {
      q: "A self-biased n-channel JFET has I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = −4 V and R<sub>S</sub> = 500 Ω. Find I<sub>D</sub> and V<sub>GS</sub>.",
      steps: [
        "Let I<sub>D</sub> = x mA. Then V<sub>GS</sub> = −0.5x volts.",
        "x = 8 (1 − 0.5x/4)<sup>2</sup> = 8 (1 − 0.125x)<sup>2</sup> = 8 − 2x + 0.125x<sup>2</sup>.",
        "Rearrange: 0.125x<sup>2</sup> − 3x + 8 = 0, or x<sup>2</sup> − 24x + 64 = 0.",
        "x = [24 ± √(576 − 256)]/2 = (24 ± 17.89)/2, so x = 3.06 mA or 20.9 mA.",
        "x = 20.9 mA would give V<sub>GS</sub> = −10.4 V, beyond V<sub>P</sub> (and above I<sub>DSS</sub>), so reject it.",
        "I<sub>D</sub> = 3.06 mA and V<sub>GS</sub> = −0.5 × 3.06 = −1.53 V.",
      ],
      ans: "I_D ≈ 3.06 mA, V_GS ≈ −1.53 V",
    },
  ],
  mistakes: [
    "Forward biasing the gate junction. In a JFET the gate-channel junction is always reverse biased.",
    "Confusing the pinch-off voltage V<sub>P</sub> (a gate voltage, negative for n-channel) with the V<sub>DS</sub> at which pinch-off happens (positive, equal to |V<sub>P</sub>| at V<sub>GS</sub> = 0).",
    "Dropping the squared bracket or the sign: (1 − V<sub>GS</sub>/V<sub>P</sub>) is positive when both are negative.",
    "Not rejecting the second root of the self-bias quadratic. Check that |V<sub>GS</sub>| &lt; |V<sub>P</sub>| and I<sub>D</sub> &lt; I<sub>DSS</sub>.",
    "Saying that a JFET is current controlled. It is voltage controlled, with a very high input resistance.",
  ],
  check: [
    {
      q: "The drain current of a JFET at V<sub>GS</sub> = 0 in saturation is",
      o: ["I<sub>DSS</sub>", "zero", "I<sub>DSS</sub>/2", "I<sub>DSS</sub> × V<sub>P</sub>"],
      a: 0,
      why: "I<sub>DSS</sub> is defined as the saturation current at V<sub>GS</sub> = 0.",
    },
    {
      q: "I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V. At V<sub>GS</sub> = −3 V, I<sub>D</sub> is",
      o: ["3 mA", "6 mA", "12 mA", "1.5 mA"],
      a: 0,
      why: "I<sub>D</sub> = 12(1 − 0.5)<sup>2</sup> = 3 mA.",
    },
    {
      q: "Which statement about a JFET is true?",
      o: ["The gate-channel junction is reverse biased", "It has a low input resistance", "It is a current-controlled device", "The gate current is large"],
      a: 0,
      why: "Reverse bias gives a tiny gate current and a very high input resistance.",
    },
    {
      q: "The slope of the transfer characteristic is the",
      o: ["transconductance g<sub>m</sub>", "drain resistance r<sub>d</sub>", "amplification factor μ", "pinch-off voltage"],
      a: 0,
      why: "g<sub>m</sub> = ΔI<sub>D</sub>/ΔV<sub>GS</sub> at constant V<sub>DS</sub>.",
    },
  ],
  lab: { id: "jfet", label: "JFET channel & pinch-off" },
};

const opampAmp: Lesson = {
  intro: "Op-amp circuits are the most scoring part of Unit 5. The inverting amplifier, the non-inverting amplifier and the summing amplifier come every year, and all use the same two ideas: infinite gain and virtual ground. After this lesson you can derive each gain in a few lines and solve the numericals.",
  sections: [
    {
      h: "The ideal op-amp",
      p: [
        "An op-amp has two inputs (inverting − and non-inverting +) and one output. The ideal values: open-loop gain A = ∞, input resistance = ∞, output resistance = 0, bandwidth = ∞, CMRR = ∞, and zero offset.",
        "Two rules follow for any circuit with negative feedback. Rule 1: no current enters either input (infinite input resistance). Rule 2: the two input voltages are equal, V<sub>+</sub> = V<sub>−</sub>, because V<sub>out</sub> = A(V<sub>+</sub> − V<sub>−</sub>) is finite while A = ∞. If one input is grounded, the other is at 0 V. That is a virtual ground (a point at ground potential but not physically grounded).",
        "In real circuits the output cannot exceed the supply (saturation, about ±13 V on ±15 V supplies).",
      ],
    },
    {
      h: "Inverting amplifier",
      p: [
        "Signal V<sub>in</sub> goes through R<sub>1</sub> to the − input. Feedback R<sub>f</sub> runs from the output to the − input. The + input is grounded.",
        "Step 1. The + input is at 0 V, so by Rule 2 the − input is a virtual ground, 0 V.",
        "Step 2. Current in R<sub>1</sub> is I = V<sub>in</sub>/R<sub>1</sub>.",
        "Step 3. By Rule 1 this current cannot enter the op-amp, so it all passes through R<sub>f</sub>. The voltage across R<sub>f</sub> is V<sub>in</sub>R<sub>f</sub>/R<sub>1</sub>.",
        "Step 4. The − input is at 0 V, so V<sub>out</sub> = 0 − I R<sub>f</sub> = −(R<sub>f</sub>/R<sub>1</sub>) V<sub>in</sub>.",
        "The minus sign means a 180° phase shift. The input resistance of the circuit is R<sub>1</sub>.",
      ],
      formula: ["A<sub>v</sub> = V<sub>out</sub>/V<sub>in</sub> = −R<sub>f</sub>/R<sub>1</sub>", "R<sub>in</sub> = R<sub>1</sub>"],
    },
    {
      h: "Non-inverting amplifier",
      p: [
        "Signal V<sub>in</sub> goes to the + input. R<sub>1</sub> goes from the − input to ground, and R<sub>f</sub> from the output to the − input.",
        "Step 1. Rule 2: V<sub>−</sub> = V<sub>+</sub> = V<sub>in</sub>.",
        "Step 2. R<sub>1</sub> and R<sub>f</sub> form a divider on the output: V<sub>−</sub> = V<sub>out</sub> R<sub>1</sub>/(R<sub>1</sub> + R<sub>f</sub>).",
        "Step 3. Equate: V<sub>in</sub> = V<sub>out</sub> R<sub>1</sub>/(R<sub>1</sub> + R<sub>f</sub>), so V<sub>out</sub> = (1 + R<sub>f</sub>/R<sub>1</sub>) V<sub>in</sub>.",
        "Output is in phase with the input and the gain is always 1 or more. Input resistance is ideally infinite. If R<sub>f</sub> = 0 (or R<sub>1</sub> = ∞), the gain is 1 and the circuit is a voltage follower (buffer).",
      ],
      formula: ["A<sub>v</sub> = 1 + R<sub>f</sub>/R<sub>1</sub>", "Voltage follower: A<sub>v</sub> = 1"],
    },
    {
      h: "Summing amplifier",
      p: [
        "Connect several inputs V<sub>1</sub>, V<sub>2</sub>, V<sub>3</sub> through resistors R<sub>1</sub>, R<sub>2</sub>, R<sub>3</sub> to the − input of an inverting amplifier.",
        "The − input is a virtual ground, so the currents are V<sub>1</sub>/R<sub>1</sub>, V<sub>2</sub>/R<sub>2</sub> and V<sub>3</sub>/R<sub>3</sub>. They add at the node and all flow through R<sub>f</sub>. Therefore V<sub>out</sub> = −R<sub>f</sub>(V<sub>1</sub>/R<sub>1</sub> + V<sub>2</sub>/R<sub>2</sub> + V<sub>3</sub>/R<sub>3</sub>).",
        "With all resistors equal to R<sub>f</sub>, the output is −(V<sub>1</sub> + V<sub>2</sub> + V<sub>3</sub>). The inputs do not interfere with one another because the node is a virtual ground.",
      ],
      formula: ["V<sub>out</sub> = −(R<sub>f</sub>/R<sub>1</sub> V<sub>1</sub> + R<sub>f</sub>/R<sub>2</sub> V<sub>2</sub> + R<sub>f</sub>/R<sub>3</sub> V<sub>3</sub>)"],
    },
  ],
  examples: [
    {
      q: "Derive the gain of an inverting op-amp amplifier. What is a virtual ground? (Theory, 5 marks)",
      steps: [
        "Draw the circuit with R<sub>1</sub>, R<sub>f</sub>, and the + input grounded.",
        "State the two ideal rules: I<sub>in</sub> = 0 and V<sub>+</sub> = V<sub>−</sub>.",
        "V<sub>−</sub> = 0 (virtual ground), so I = V<sub>in</sub>/R<sub>1</sub>.",
        "The same current goes through R<sub>f</sub>: V<sub>out</sub> = −I R<sub>f</sub>.",
        "A<sub>v</sub> = −R<sub>f</sub>/R<sub>1</sub>.",
      ],
      ans: "A_v = −R_f/R_1",
    },
    {
      q: "An inverting amplifier has R<sub>1</sub> = 10 kΩ and R<sub>f</sub> = 100 kΩ. For V<sub>in</sub> = 0.5 V, find the gain and V<sub>out</sub>. Then find the gain of a non-inverting amplifier with R<sub>f</sub> = 47 kΩ and R<sub>1</sub> = 4.7 kΩ.",
      steps: [
        "Inverting gain = −100/10 = −10.",
        "V<sub>out</sub> = −10 × 0.5 = −5 V.",
        "Non-inverting gain = 1 + 47/4.7 = 1 + 10 = 11.",
      ],
      ans: "−10 and V_out = −5 V; non-inverting gain = 11",
    },
    {
      q: "A summing amplifier has R<sub>f</sub> = 10 kΩ and inputs V<sub>1</sub> = 1 V via 5 kΩ, V<sub>2</sub> = 0.5 V via 2 kΩ, V<sub>3</sub> = 2 V via 10 kΩ. Find V<sub>out</sub>.",
      steps: [
        "Gains: 10/5 = 2, 10/2 = 5, 10/10 = 1.",
        "V<sub>out</sub> = −(2 × 1 + 5 × 0.5 + 1 × 2) = −(2 + 2.5 + 2) = −6.5 V.",
      ],
      ans: "V_out = −6.5 V",
    },
  ],
  mistakes: [
    "Writing the inverting gain as 1 + R<sub>f</sub>/R<sub>1</sub>, or the non-inverting gain as −R<sub>f</sub>/R<sub>1</sub>. Learn them as a pair.",
    "Forgetting the minus sign in the inverting and summing amplifiers.",
    "Claiming that the inverting input is physically grounded. It is a virtual ground: at 0 V but not connected to ground.",
    "Saying that the non-inverting gain can be below 1. The minimum is 1 (voltage follower).",
    "Forgetting output saturation. A calculated output beyond the supply rails is clipped at about ±V<sub>sat</sub>.",
  ],
  check: [
    {
      q: "The gain of an inverting amplifier with R<sub>1</sub> = 2 kΩ and R<sub>f</sub> = 20 kΩ is",
      o: ["−10", "10", "11", "−11"],
      a: 0,
      why: "A<sub>v</sub> = −R<sub>f</sub>/R<sub>1</sub> = −10.",
    },
    {
      q: "A non-inverting amplifier with R<sub>f</sub> = 9 kΩ and R<sub>1</sub> = 1 kΩ has gain",
      o: ["10", "9", "−9", "−10"],
      a: 0,
      why: "A<sub>v</sub> = 1 + 9/1 = 10.",
    },
    {
      q: "The voltage follower has a gain of",
      o: ["1", "0", "∞", "−1"],
      a: 0,
      why: "With R<sub>f</sub> = 0 the output follows the input exactly, A<sub>v</sub> = 1.",
    },
    {
      q: "Virtual ground means that the inverting input is",
      o: ["at 0 V but draws no current", "connected to ground", "at the supply voltage", "open circuited"],
      a: 0,
      why: "It is held at the same potential as the grounded + input, with no current into the op-amp.",
    },
  ],
  lab: { id: "opamp", label: "Op-amp amplifier circuits" },
};

export const L_ECT001: Record<string, Lesson> = {
  "ECT-001:1:12": diodeVI,
  "ECT-001:2:2": fullWave,
  "ECT-001:2:13": zenerReg,
  "ECT-001:3:2": bjtAction,
  "ECT-001:3:10": vdivBias,
  "ECT-001:4:4": jfetChar,
  "ECT-001:5:9": opampAmp,
};
