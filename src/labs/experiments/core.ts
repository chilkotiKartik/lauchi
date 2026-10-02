import type { Experiment } from "./types";

/** Guided experiments for the core labs. Every number in a solution was recomputed (see experiments.test.ts). */

const thevenin: Experiment = {
  labId: "thevenin",
  title: "Thevenin equivalent and maximum power transfer",
  aim: "To replace a battery with two resistors by one source V<sub>th</sub> with R<sub>th</sub> in series, and to show that the load gets the most power when R<sub>L</sub> = R<sub>th</sub>.",
  objectives: [
    "Find V<sub>th</sub> and R<sub>th</sub> of a voltage-divider network.",
    "Locate the peak of the load power curve and relate it to R<sub>th</sub>.",
    "Explain why the efficiency is only 50% at maximum power.",
  ],
  equipment: [
    { name: "DC battery V", what: "The source. Its voltage is the first slider.", where: "Battery V slider" },
    { name: "Series resistor R1 and shunt resistor R2", what: "A voltage divider seen by the load.", where: "R1 and R2 sliders" },
    { name: "Load resistor R_L", what: "The resistor whose power you measure.", where: "Load R_L slider" },
    { name: "Power curve and bars", what: "Show P_L against R_L and the voltages and currents.", where: "3D view" },
  ],
  steps: [
    { id: "t1", title: "Move the load resistor", text: "Drag the Load R_L slider. Watch the red marker slide along the power curve.", hint: "The slider is in the controls card under the 3D view.", check: { kind: "param", key: "RL", op: "changed" } },
    { id: "t2", title: "Make the load small", text: "Set R_L to 7 Ω or less. The marker should sit near the top of the green curve.", hint: "R_th = R1‖R2 = 6.67 Ω for the starting values.", check: { kind: "param", key: "RL", op: "lte", value: 7 } },
    { id: "t3", title: "Make the load large", text: "Now set R_L to 100 Ω or more. Power drops again, even though efficiency rises.", hint: "Drag the slider to the right-hand end.", check: { kind: "param", key: "RL", op: "gte", value: 100 } },
    { id: "t4", title: "Change the shunt resistor", text: "Change R2 and see how V_th and the peak position move.", hint: "R_th = R1·R2/(R1+R2).", check: { kind: "param", key: "R2", op: "changed" } },
    { id: "t5", title: "Raise the battery", text: "Set the battery to 24 V or more. The peak power grows with V_th squared.", hint: "Battery V slider, towards the right.", check: { kind: "param", key: "V", op: "gte", value: 24 } },
    { id: "t6", title: "Load the matched-load preset", text: "Press the 'Matched load' preset under 'Try these experiments'. Check that the red and gold markers meet.", hint: "The preset buttons are in the 'Try these experiments' box above the 3D view.", check: { kind: "preset", name: "Matched load" } },
    { id: "t7", title: "Reset the lab", text: "Press Reset to go back to the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "thevenin-q1", type: "mcq", prompt: "A source V feeds R1 in series, and R2 is across the output. What is the Thevenin resistance seen by the load?", options: ["R1 + R2", "R1 in parallel with R2", "R2 only", "R1 only"], answer: 1, marks: 2, hint: "To find R_th, replace the battery by a short circuit and look back from the load.", formulas: ["R<sub>th</sub> = R1·R2 / (R1 + R2)"], solution: ["Switch the source off: the battery becomes a short circuit.", "Looking in from the load terminals, R1 and R2 are then connected between the same two points.", "So they are in parallel: R<sub>th</sub> = R1·R2/(R1+R2)."], explanation: "Shorting the ideal battery puts R1 across R2 from the load's point of view.", commonMistake: "Adding R1 and R2 as if they were in series." },
    { id: "thevenin-q2", type: "mcq", prompt: "For which load resistance is the power delivered to the load a maximum?", options: ["R<sub>L</sub> = 0", "R<sub>L</sub> = R<sub>th</sub>", "R<sub>L</sub> very large", "R<sub>L</sub> = 2R<sub>th</sub>"], answer: 1, marks: 2, hint: "Try the Matched load preset and look for the gold marker.", formulas: ["P<sub>L</sub> = V<sub>th</sub>² R<sub>L</sub> / (R<sub>th</sub> + R<sub>L</sub>)²"], solution: ["Write P<sub>L</sub> = V<sub>th</sub>² R<sub>L</sub>/(R<sub>th</sub>+R<sub>L</sub>)².", "Set dP<sub>L</sub>/dR<sub>L</sub> = 0, which gives R<sub>L</sub> = R<sub>th</sub>.", "At that value P<sub>L</sub> = V<sub>th</sub>²/(4R<sub>th</sub>)."], explanation: "A small load gets a big current but little voltage, a large load gets voltage but little current. The product peaks in between.", commonMistake: "Thinking the smallest load always takes the most power." },
    { id: "thevenin-q3", type: "mcq", prompt: "At maximum power transfer, what fraction of the power given out by the Thevenin source reaches the load?", options: ["25%", "50%", "75%", "100%"], answer: 1, marks: 2, hint: "At R_L = R_th the same current flows through both resistances.", solution: ["At R<sub>L</sub> = R<sub>th</sub> the same current I flows through both.", "Power in R<sub>th</sub> = I²R<sub>th</sub>, power in R<sub>L</sub> = I²R<sub>L</sub>, and these are equal.", "So half of the source power is wasted inside R<sub>th</sub>: efficiency is 50%."], explanation: "Maximum power transfer is not maximum efficiency. Power stations never run like this.", commonMistake: "Assuming a matched load is 100% efficient." },
    { id: "thevenin-q4", type: "tf", prompt: "Increasing R<sub>L</sub> from 7 Ω to 150 Ω always increases the load power.", answer: false, marks: 1, hint: "Look at the shape of the green curve.", solution: ["The power curve rises up to R<sub>L</sub> = R<sub>th</sub> and then falls.", "So going far beyond R<sub>th</sub> reduces the power."], explanation: "The curve has one peak at R_L = R_th.", commonMistake: "Thinking more resistance means more power." },
    { id: "thevenin-q5", type: "tf", prompt: "V<sub>th</sub> is the open-circuit voltage across the load terminals.", answer: true, marks: 1, solution: ["Remove the load, so no current flows through the terminals.", "The voltage left is the divider voltage V·R2/(R1+R2) = V<sub>th</sub>."], explanation: "Open the terminals and measure: that voltage is V_th.", commonMistake: "Measuring V_th with the load connected." },
    { id: "thevenin-q6", type: "numeric", prompt: "A 24 V battery feeds R1 = 10 Ω in series with R2 = 30 Ω across the output. Find V<sub>th</sub>.", answer: 18, tolerance: 0.05, unit: "V", marks: 2, hint: "Voltage divider across R2.", formulas: ["V<sub>th</sub> = V·R2 / (R1 + R2)"], solution: ["The terminals are across R2, so use the divider rule.", "V<sub>th</sub> = 24 × 30 / (10 + 30)", "V<sub>th</sub> = 24 × 0.75 = 18 V."], explanation: "R2 takes 30 of the 40 Ω, so it gets three quarters of the battery voltage.", commonMistake: "Using R1/(R1+R2) instead of R2/(R1+R2)." },
    { id: "thevenin-q7", type: "numeric", prompt: "For the starting values (12 V, R1 = 10 Ω, R2 = 20 Ω) find the maximum power the load can receive.", answer: 2.4, tolerance: 0.02, unit: "W", marks: 3, hint: "First find V_th and R_th, then P_max = V_th²/(4R_th).", formulas: ["V<sub>th</sub> = V·R2/(R1+R2)", "R<sub>th</sub> = R1·R2/(R1+R2)", "P<sub>max</sub> = V<sub>th</sub>² / (4R<sub>th</sub>)"], solution: ["V<sub>th</sub> = 12 × 20/30 = 8 V.", "R<sub>th</sub> = 10 × 20/30 = 6.667 Ω.", "P<sub>max</sub> = 8² / (4 × 6.667) = 64 / 26.67 = 2.4 W."], explanation: "You can check this against the gold marker in the lab with R_L = 6.67 Ω.", commonMistake: "Forgetting the factor 4 in the denominator." },
    { id: "thevenin-q8", type: "numeric", scenario: "A sensor's output behaves like a Thevenin source with V<sub>th</sub> = 9 V and R<sub>th</sub> = 3 Ω. An engineer connects a load of 3 Ω to it.", prompt: "How much power does the load receive?", answer: 6.75, tolerance: 0.02, unit: "W", marks: 3, hint: "The load is matched, so use V_th²/(4R_th).", formulas: ["P = V<sub>th</sub>² / (4R<sub>th</sub>)  (when R<sub>L</sub> = R<sub>th</sub>)"], solution: ["R<sub>L</sub> = R<sub>th</sub> = 3 Ω, so the load is matched.", "The current is I = 9 / (3 + 3) = 1.5 A.", "P = I²R<sub>L</sub> = 1.5² × 3 = 6.75 W."], explanation: "Matched load: 6.75 W reaches the load and another 6.75 W is lost in the sensor's own resistance.", commonMistake: "Using 9²/3 = 27 W, which ignores R_th in the circuit." },
  ],
  summary: [
    "Any linear network seen from two terminals is a source V_th in series with R_th.",
    "V_th is the open-circuit voltage; R_th is found with the sources switched off.",
    "Load power peaks at R_L = R_th with P_max = V_th²/(4R_th).",
    "At that peak the efficiency is only 50%, so power systems do not run matched.",
  ],
};

const rings: Experiment = {
  labId: "rings",
  title: "Newton's rings: wavelength from ring diameters",
  aim: "To see how dark interference rings form in the air wedge between a lens and a flat plate, and to use ring diameters to find the wavelength of light.",
  objectives: [
    "Use r<sub>n</sub> = √(nλR) for the n-th dark ring.",
    "Predict how rings move when λ or R changes.",
    "Find λ from two ring diameters (D<sub>m</sub>, D<sub>n</sub>).",
  ],
  equipment: [
    { name: "Monochromatic source", what: "Light of one wavelength λ.", where: "Wavelength λ slider" },
    { name: "Plano-convex lens", what: "A lens of large radius of curvature R rests on the plate.", where: "Lens radius of curvature R slider" },
    { name: "Glass plate", what: "A flat plate that makes the thin air wedge under the lens." },
    { name: "Travelling microscope", what: "In a real lab it measures ring diameters. Here the readouts give r₁ and r₅.", where: "Readouts under the 3D view" },
  ],
  steps: [
    { id: "r1", title: "Look at the rings", text: "Note the dark centre and read r₁ and r₅ in the readouts.", hint: "Tick this step after you have read the numbers.", check: { kind: "manual" } },
    { id: "r2", title: "Change the wavelength", text: "Drag the Wavelength λ slider and see the rings move.", hint: "The slider is in the controls card.", check: { kind: "param", key: "nm", op: "changed" } },
    { id: "r3", title: "Use red light", text: "Set λ to 650 nm or more. The rings spread outwards.", hint: "Longer wavelength means a bigger ring radius.", check: { kind: "param", key: "nm", op: "gte", value: 650 } },
    { id: "r4", title: "Use blue light", text: "Set λ to 450 nm or less. The rings crowd closer.", hint: "Drag the slider towards 400 nm.", check: { kind: "param", key: "nm", op: "lte", value: 450 } },
    { id: "r5", title: "Change the lens radius", text: "Set the lens radius R to 90 cm or more and see how r₁ changes.", hint: "r is proportional to √R.", check: { kind: "param", key: "R", op: "gte", value: 90 } },
    { id: "r6", title: "Load the sodium light preset", text: "Press 'Sodium light' (589 nm, R = 100 cm) and read r₅. Compare it with √(5λR).", hint: "The presets are in the box above the 3D view.", check: { kind: "preset", name: "Sodium light" } },
    { id: "r7", title: "Reset", text: "Press Reset to restore the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "rings-q1", type: "mcq", prompt: "Why is the centre of the Newton's rings pattern dark in reflected light?", options: ["The air film there is very thick", "Reflection at the glass plate adds a phase change of π, and the film thickness is almost zero", "The lens absorbs light at its centre", "Two rays are exactly in phase there"], answer: 1, marks: 2, hint: "Only one of the two reflections flips the phase.", solution: ["One ray reflects from the lens-air surface (no phase change).", "The other reflects from the air-glass plate surface, a denser medium, so it gains π.", "At the centre the film thickness is about zero, so the path difference is zero but the phase difference is π: destructive interference."], explanation: "Zero thickness plus a π phase jump gives darkness at the centre.", commonMistake: "Forgetting the phase change on reflection and saying the centre is bright." },
    { id: "rings-q2", type: "mcq", prompt: "The radius of the n-th dark ring is proportional to:", options: ["n", "√n", "n²", "1/n"], answer: 1, marks: 2, hint: "Use r² = nλR.", formulas: ["r<sub>n</sub> = √(nλR)"], solution: ["Dark ring condition: 2t = nλ.", "For the lens, t = r²/(2R), so r² = nλR.", "Hence r<sub>n</sub> ∝ √n."], explanation: "That is why rings get closer together as you move outwards.", commonMistake: "Choosing n because the rings look evenly spaced near the centre." },
    { id: "rings-q3", type: "mcq", prompt: "The lens is replaced by one with a radius of curvature four times bigger. The ring radii become:", options: ["4 times larger", "2 times larger", "2 times smaller", "unchanged"], answer: 1, marks: 2, hint: "r ∝ √R.", formulas: ["r<sub>n</sub> ∝ √R"], solution: ["r<sub>n</sub> = √(nλR), so r<sub>n</sub> ∝ √R.", "R becomes 4R, so r becomes √4 = 2 times as big."], explanation: "A flatter lens makes the air wedge thinner, so you must go further out for the same thickness.", commonMistake: "Scaling r with R directly instead of with √R." },
    { id: "rings-q4", type: "tf", prompt: "Switching from red light to blue light makes the rings move outwards.", answer: false, marks: 1, hint: "Blue has the shorter wavelength.", solution: ["r<sub>n</sub> ∝ √λ.", "Blue light has a shorter λ than red, so the rings shrink (move inwards)."], explanation: "You saw this in the lab: 450 nm rings are tighter than 650 nm rings.", commonMistake: "Mixing up which colour has the longer wavelength." },
    { id: "rings-q5", type: "tf", prompt: "The spacing between neighbouring dark rings increases as you move away from the centre.", answer: false, marks: 1, solution: ["Since r ∝ √n, the gap r<sub>n+1</sub> − r<sub>n</sub> gets smaller as n grows.", "The outer rings are therefore closer together."], explanation: "Look at the 3D view: rings crowd at the edge.", commonMistake: "Expecting equal spacing like a ruler." },
    { id: "rings-q6", type: "numeric", prompt: "Sodium light (λ = 589 nm) with R = 100 cm. Find the radius of the 5th dark ring.", answer: 1.716, tolerance: 0.01, unit: "mm", marks: 2, hint: "Convert R to mm and λ to mm before using the formula.", formulas: ["r<sub>n</sub> = √(nλR)"], solution: ["λ = 589 nm = 5.89 × 10⁻⁴ mm and R = 100 cm = 1000 mm.", "r₅² = 5 × 5.89 × 10⁻⁴ × 1000 = 2.945 mm².", "r₅ = √2.945 = 1.716 mm."], explanation: "This matches the r₅ readout when the Sodium light preset is loaded.", commonMistake: "Mixing units: cm for R and nm for λ in the same square root." },
    { id: "rings-q7", type: "numeric", prompt: "With λ = 500 nm and R = 125 cm, find the diameter of the 10th dark ring.", answer: 5, tolerance: 0.03, unit: "mm", marks: 2, hint: "D = 2r, so D² = 4nλR.", formulas: ["D<sub>n</sub>² = 4nλR"], solution: ["λ = 5 × 10⁻⁴ mm, R = 1250 mm.", "D² = 4 × 10 × 5 × 10⁻⁴ × 1250 = 25 mm².", "D = 5 mm."], explanation: "Doubling r to get a diameter is the step students most often forget.", commonMistake: "Reporting the radius instead of the diameter." },
    { id: "rings-q8", type: "numeric", scenario: "In a Newton's rings experiment with R = 100 cm, a student measures the diameter of the 5th dark ring as 3.43 mm and that of the 15th dark ring as 5.95 mm.", prompt: "Find the wavelength of the light.", answer: 591, tolerance: 6, unit: "nm", marks: 3, hint: "Subtract D₅² from D₁₅² so that the unknown zero error cancels.", formulas: ["λ = (D<sub>n</sub>² − D<sub>m</sub>²) / (4(n − m)R)"], solution: ["D₁₅² − D₅² = 5.95² − 3.43² = 35.40 − 11.76 = 23.64 mm².", "4(n − m)R = 4 × 10 × 1000 mm = 40000 mm.", "λ = 23.64 / 40000 = 5.91 × 10⁻⁴ mm = 591 nm (close to sodium light)."], explanation: "Using two rings removes the error from not knowing exactly where the centre is.", commonMistake: "Using radius values in a formula written for diameters." },
  ],
  summary: [
    "Dark rings satisfy r_n² = nλR when the centre is dark (extra phase change of π).",
    "Ring radius grows as √n, √λ and √R.",
    "Using D_n² − D_m² gives λ without needing the exact centre or air-film zero.",
    "Shorter wavelengths give tighter rings.",
  ],
};

const pvwork: Experiment = {
  labId: "pvwork",
  title: "Boundary work of a piston-cylinder system",
  aim: "To find the work done by a gas as the area under the P-V curve for isobaric, isochoric, isothermal, adiabatic and polytropic processes.",
  objectives: [
    "Read boundary work as the area under a P-V path.",
    "Choose the right work formula for each process.",
    "Use the sign convention: expansion work is positive, compression work is negative.",
  ],
  equipment: [
    { name: "Piston-cylinder", what: "Gas trapped behind a frictionless piston.", where: "3D view, left" },
    { name: "P-V diagram", what: "Shows the path and shades the area (the work).", where: "3D view, right" },
    { name: "Process selector", what: "Chooses isobaric, isochoric, isothermal, adiabatic or polytropic.", where: "Process control" },
    { name: "Sliders", what: "Set initial pressure, volumes, index n, temperature and heat.", where: "Controls card" },
  ],
  steps: [
    { id: "p1", title: "Choose an isobaric process", text: "Set the Process to Isobaric. The path is a horizontal line.", hint: "Use the Process control under the 3D view.", check: { kind: "param", key: "proc", op: "eq", value: "isobaric" } },
    { id: "p2", title: "Expand the gas a lot", text: "Raise the final volume V₂ to 0.3 m³ or more and watch the shaded area grow.", hint: "V₂ slider.", check: { kind: "param", key: "V2", op: "gte", value: 0.3 } },
    { id: "p3", title: "Choose isothermal", text: "Set the Process to Isothermal. The curve now bends (pV = constant).", hint: "Same Process control.", check: { kind: "param", key: "proc", op: "eq", value: "isothermal" } },
    { id: "p4", title: "Choose adiabatic", text: "Set the Process to Adiabatic. It falls faster than the isotherm.", hint: "pV^γ = constant.", check: { kind: "param", key: "proc", op: "eq", value: "adiabatic" } },
    { id: "p5", title: "Try a polytropic process", text: "Set the Process to Polytropic and then change the index n.", hint: "Choose the process first, then use the Polytropic index n slider.", check: { kind: "param", key: "n", op: "changed" } },
    { id: "p6", title: "Change the initial pressure", text: "Move the p₁ slider and see how the work scales with it.", check: { kind: "param", key: "p1", op: "changed" } },
    { id: "p7", title: "Load a preset", text: "Press any preset, for example 'PYQ: isothermal', and compare the work with your own calculation.", hint: "Presets are in the box above the 3D view.", check: { kind: "preset" } },
    { id: "p8", title: "Reset", text: "Press Reset to restore the starting setup.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "pvwork-q1", type: "mcq", prompt: "On a P-V diagram the boundary work of a process equals:", options: ["the slope of the path", "the area under the path", "the pressure at the end state", "the temperature change"], answer: 1, marks: 2, hint: "W = ∫p dV.", formulas: ["W = ∫ p dV"], solution: ["For a small volume change dV the work is p·dV, a thin strip under the curve.", "Adding all strips from V₁ to V₂ gives the total area under the path."], explanation: "That is why the shaded area is shown in the lab.", commonMistake: "Using the area inside a loop for a single process." },
    { id: "pvwork-q2", type: "mcq", prompt: "Which process does no boundary work?", options: ["Isobaric", "Isochoric", "Isothermal", "Adiabatic"], answer: 1, marks: 2, hint: "Look at the path when V is constant.", solution: ["Work = ∫p dV.", "When V is constant dV = 0, so W = 0.", "That is the isochoric process: all the heat goes into internal energy."], explanation: "In the lab the isochoric path is a vertical line with no area under it.", commonMistake: "Thinking pressure change alone gives work." },
    { id: "pvwork-q3", type: "mcq", prompt: "A polytropic process pVⁿ = constant becomes isothermal when n equals:", options: ["0", "1", "γ", "∞"], answer: 1, marks: 2, hint: "pV = constant is the ideal-gas isotherm.", solution: ["Put n = 1: pV = constant.", "For an ideal gas, pV = mRT, so T is constant: isothermal.", "(n = 0 is isobaric, n = γ adiabatic, n = ∞ isochoric.)"], explanation: "The index n slides the polytropic curve between the other four processes.", commonMistake: "Choosing γ, which gives the adiabatic." },
    { id: "pvwork-q4", type: "tf", prompt: "For an ideal gas expanding isothermally, the heat added equals the work done by the gas.", answer: true, marks: 1, solution: ["For an ideal gas the internal energy depends only on T.", "T is constant, so ΔU = 0.", "First law: Q = ΔU + W = W."], explanation: "All the heat goes out again as work.", commonMistake: "Assuming some heat always raises U." },
    { id: "pvwork-q5", type: "tf", prompt: "When the gas is compressed (V₂ < V₁), the boundary work done by the gas is positive.", answer: false, marks: 1, solution: ["dV is negative during compression, so ∫p dV is negative.", "The gas has work done on it, so W by the gas is negative."], explanation: "The lab shades compression work red to show it is negative.", commonMistake: "Dropping the sign." },
    { id: "pvwork-q6", type: "numeric", prompt: "Air at 600 kPa expands isothermally from 0.03 m³ to 0.09 m³. Find the work done by the gas.", answer: 19.78, tolerance: 0.1, unit: "kJ", marks: 3, hint: "W = p₁V₁ ln(V₂/V₁), with p in kPa giving kJ.", formulas: ["W = p<sub>1</sub>V<sub>1</sub> ln(V<sub>2</sub>/V<sub>1</sub>)"], solution: ["p₁V₁ = 600 × 0.03 = 18 kJ.", "ln(V₂/V₁) = ln 3 = 1.0986.", "W = 18 × 1.0986 = 19.78 kJ."], explanation: "This is the 'PYQ: isothermal' preset. Check the work readout.", commonMistake: "Using log base 10 instead of the natural logarithm." },
    { id: "pvwork-q7", type: "numeric", prompt: "A gas expands at a constant 200 kPa from 0.1 m³ to 0.3 m³. Find the work done.", answer: 40, tolerance: 0.1, unit: "kJ", marks: 2, hint: "Constant pressure: W = pΔV.", formulas: ["W = p(V<sub>2</sub> − V<sub>1</sub>)"], solution: ["ΔV = 0.3 − 0.1 = 0.2 m³.", "W = 200 kPa × 0.2 m³ = 40 kJ."], explanation: "A rectangle under a horizontal line: height times width.", commonMistake: "Using the final volume only." },
    { id: "pvwork-q8", type: "numeric", scenario: "Air (γ = 1.4) at 100 kPa and 0.4 m³ is compressed adiabatically and reversibly to 0.05 m³ in a cylinder.", prompt: "Find the work done by the gas. A negative sign means work is done on the gas.", answer: -129.7, tolerance: 0.5, unit: "kJ", marks: 3, hint: "First find p₂ = p₁(V₁/V₂)^γ, then W = (p₁V₁ − p₂V₂)/(γ − 1).", formulas: ["p<sub>2</sub> = p<sub>1</sub>(V<sub>1</sub>/V<sub>2</sub>)<sup>γ</sup>", "W = (p<sub>1</sub>V<sub>1</sub> − p<sub>2</sub>V<sub>2</sub>) / (γ − 1)"], solution: ["V₁/V₂ = 8, so p₂ = 100 × 8^1.4 = 100 × 18.38 = 1837.9 kPa.", "p₁V₁ = 40 kJ and p₂V₂ = 1837.9 × 0.05 = 91.9 kJ.", "W = (40 − 91.9) / 0.4 = −129.7 kJ."], explanation: "Compression, so W is negative: 129.7 kJ must be supplied and it raises the gas temperature.", commonMistake: "Forgetting to divide by (γ − 1), or leaving out the minus sign." },
  ],
  summary: [
    "Boundary work is the area under the P-V path, W = ∫p dV.",
    "Isobaric W = pΔV; isochoric W = 0; isothermal W = p₁V₁ ln(V₂/V₁).",
    "Adiabatic and polytropic: W = (p₁V₁ − p₂V₂)/(n − 1), with n = γ for adiabatic.",
    "Expansion work is positive and compression work is negative.",
  ],
};

const nernst: Experiment = {
  labId: "nernst",
  title: "Galvanic cell and the Nernst equation",
  aim: "To find how cell potential changes with ion concentration and temperature, and to link E, ΔG and equilibrium.",
  objectives: [
    "Identify the anode and cathode and write the cell EMF E° = E°(cathode) − E°(anode).",
    "Use E = E° − (RT/nF) ln Q to calculate E at non-standard concentrations.",
    "Calculate ΔG = −nFE.",
  ],
  equipment: [
    { name: "Two half-cells", what: "A metal rod in a solution of its own ions.", where: "Two beakers in the 3D view" },
    { name: "Salt bridge", what: "Completes the circuit by letting ions move." },
    { name: "Voltmeter", what: "Shows the cell potential.", where: "Needle in the 3D view" },
    { name: "Concentration and temperature controls", what: "Set log₁₀ of each ion concentration and T.", where: "Controls card" },
  ],
  steps: [
    { id: "n1", title: "Load the standard Daniell cell", text: "Press 'Daniell cell, standard'. Both solutions are 1 M at 298 K. Read E = E° = 1.10 V.", hint: "The preset is in the box above the 3D view.", check: { kind: "preset", name: "Daniell cell, standard" } },
    { id: "n2", title: "Dilute the cathode solution", text: "Set the cathode ion log M to -2 or lower. E falls, because Q grows.", hint: "Use the slider named after the cathode ion (Cu²⁺).", check: { kind: "param", key: "logC", op: "lte", value: -2 } },
    { id: "n3", title: "Change the anode concentration", text: "Move the anode ion slider and note the opposite effect on E.", hint: "Anode ion is Zn²⁺ for the Daniell cell.", check: { kind: "param", key: "logA", op: "changed" } },
    { id: "n4", title: "Heat the cell", text: "Set the temperature to 340 K or more. The slope RT/nF grows.", hint: "Temperature slider.", check: { kind: "param", key: "T", op: "gte", value: 340 } },
    { id: "n5", title: "Switch to the silver-zinc cell", text: "Change the Cell to Zn | Ag⁺ and compare E°.", hint: "The Cell control is the first control.", check: { kind: "param", key: "cell", op: "eq", value: "znag" } },
    { id: "n6", title: "Try the iron-copper cell", text: "Change the Cell to Fe | Cu²⁺.", check: { kind: "param", key: "cell", op: "eq", value: "fecu" } },
    { id: "n7", title: "Reset", text: "Press Reset to return to the starting cell.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "nernst-q1", type: "mcq", prompt: "In the Daniell cell, at which electrode does oxidation take place?", options: ["Copper", "Zinc", "Both", "The salt bridge"], answer: 1, marks: 2, hint: "The metal with the lower E° is oxidised.", solution: ["E°(Zn²⁺/Zn) = −0.76 V and E°(Cu²⁺/Cu) = +0.34 V.", "The lower (more negative) E° is the better reducing agent, so Zn loses electrons.", "Oxidation happens at the anode, which is zinc."], explanation: "Electrons flow from the zinc anode through the wire to the copper cathode.", commonMistake: "Labelling the anode as positive in a galvanic cell (it is the negative terminal)." },
    { id: "nernst-q2", type: "mcq", prompt: "In the Daniell cell, what happens to E if [Cu²⁺] is reduced and [Zn²⁺] is kept at 1 M?", options: ["E increases", "E decreases", "E stays equal to E°", "E becomes negative immediately"], answer: 1, marks: 2, hint: "Q = [Zn²⁺]/[Cu²⁺] gets bigger.", formulas: ["E = E° − (RT/nF) ln Q"], solution: ["Q = [Zn²⁺]/[Cu²⁺]; a smaller [Cu²⁺] makes Q bigger.", "ln Q is positive, so E = E° − (RT/nF) ln Q goes down."], explanation: "The reaction has less driving force when the reactant ion is scarce.", commonMistake: "Putting the concentrations upside down in Q." },
    { id: "nernst-q3", type: "mcq", prompt: "What is the value of E when the cell reaction has reached equilibrium?", options: ["E°", "1.10 V", "Zero", "Infinity"], answer: 2, marks: 2, hint: "ΔG = 0 at equilibrium.", formulas: ["ΔG = −nFE"], solution: ["At equilibrium ΔG = 0.", "ΔG = −nFE, so E = 0.", "The cell is 'dead' and the voltmeter reads zero."], explanation: "A flat battery is a cell that has reached equilibrium.", commonMistake: "Confusing E with E°, which is a fixed constant." },
    { id: "nernst-q4", type: "tf", prompt: "The standard cell potential E° changes when the ion concentrations change.", answer: false, marks: 1, solution: ["E° is defined at 1 M and is a fixed property of the two half-cells.", "Only E (not E°) depends on concentrations through Q."], explanation: "E° is a constant for a given pair of electrodes at a given temperature.", commonMistake: "Mixing up E and E°." },
    { id: "nernst-q5", type: "tf", prompt: "At a higher temperature the term RT/nF is larger, so concentration changes affect E more.", answer: true, marks: 1, solution: ["RT/nF is directly proportional to T.", "A bigger prefactor means each decade of Q shifts E by a larger amount."], explanation: "You saw the steeper effect with the hot silver-zinc preset.", commonMistake: "Thinking temperature only changes E°." },
    { id: "nernst-q6", type: "numeric", prompt: "Daniell cell at 298 K with [Zn²⁺] = 1 M and [Cu²⁺] = 0.001 M. Find E. Use E° = 1.10 V and n = 2.", answer: 1.011, tolerance: 0.003, unit: "V", marks: 3, hint: "Q = 1/0.001 = 1000, log Q = 3.", formulas: ["E = E° − (0.0592/n) log<sub>10</sub> Q"], solution: ["Q = [Zn²⁺]/[Cu²⁺] = 1/0.001 = 1000, so log Q = 3.", "RT ln10/F at 298 K = 0.0592 V, so the slope is 0.0592/2 = 0.0296 V per decade.", "E = 1.10 − 0.0296 × 3 = 1.011 V."], explanation: "Matches the lab: cathode ion log M = −3, anode log M = 0.", commonMistake: "Using n = 1 or forgetting the factor 3." },
    { id: "nernst-q7", type: "numeric", prompt: "Find the standard free energy change ΔG° of the Daniell cell (E° = 1.10 V, n = 2, F = 96485 C/mol).", answer: -212.3, tolerance: 0.5, unit: "kJ/mol", marks: 2, hint: "ΔG° = −nFE°.", formulas: ["ΔG° = −nFE°"], solution: ["ΔG° = −2 × 96485 × 1.10 J/mol.", "= −212267 J/mol.", "= −212.3 kJ/mol."], explanation: "A negative ΔG° means the cell reaction is spontaneous.", commonMistake: "Leaving the answer in J instead of kJ." },
    { id: "nernst-q8", type: "numeric", scenario: "A student builds a Zn | Zn²⁺ (0.1 M) || Ag⁺ (0.01 M) | Ag cell at 298 K. E°(Ag⁺/Ag) = +0.80 V and E°(Zn²⁺/Zn) = −0.76 V. Two electrons are transferred: Zn + 2Ag⁺ → Zn²⁺ + 2Ag.", prompt: "Find the cell potential E.", answer: 1.471, tolerance: 0.004, unit: "V", marks: 3, hint: "Q = [Zn²⁺]/[Ag⁺]² and n = 2.", formulas: ["E° = E°(cathode) − E°(anode)", "Q = [Zn²⁺]/[Ag⁺]²", "E = E° − (0.0592/n) log Q"], solution: ["E° = 0.80 − (−0.76) = 1.56 V.", "Q = 0.1 / (0.01)² = 0.1 / 0.0001 = 1000, so log Q = 3.", "E = 1.56 − (0.0592/2) × 3 = 1.56 − 0.089 = 1.471 V."], explanation: "The squared concentration in Q comes from the 2 in 2Ag⁺.", commonMistake: "Forgetting to square [Ag⁺] in Q." },
  ],
  summary: [
    "E°cell = E°(cathode) − E°(anode); the cell is spontaneous when E > 0.",
    "Nernst: E = E° − (RT/nF) ln Q, about 0.0592/n V per decade of Q at 298 K.",
    "ΔG = −nFE, and E = 0 at equilibrium.",
    "Temperature changes the slope RT/nF; concentrations change Q.",
  ],
};

const kmap: Experiment = {
  labId: "kmap",
  title: "Minimising logic with a Karnaugh map",
  aim: "To simplify a 4-variable Boolean function by grouping adjacent 1s (SOP) or 0s (POS), using don't-care conditions when they help.",
  objectives: [
    "Place minterms on a Gray-coded K-map.",
    "Form the largest groups of 2, 4 or 8 adjacent cells and read the product terms.",
    "Use don't-cares to get a simpler expression.",
  ],
  equipment: [
    { name: "4-variable K-map", what: "16 cells, one per minterm of A, B, C, D.", where: "Cell grid in the controls card" },
    { name: "Pattern sliders", what: "A 16-bit number whose bits are the minterms (and don't-cares).", where: "Minterm pattern and Don't-care pattern sliders" },
    { name: "Group slabs", what: "Coloured slabs show the groups of the minimal expression.", where: "3D view" },
    { name: "Expression readout", what: "Shows the minimal SOP and POS.", where: "Readouts" },
  ],
  steps: [
    { id: "k1", title: "Change the function", text: "Click map cells or drag the Minterm pattern slider to make your own function.", hint: "Clicking a cell toggles its minterm.", check: { kind: "param", key: "ones", op: "changed" } },
    { id: "k2", title: "Read the minimal SOP", text: "Look at the groups and the 'Minimal SOP' readout. Tick this when you can match each term to a group.", hint: "A bigger group means fewer literals.", check: { kind: "manual" } },
    { id: "k3", title: "Switch to POS", text: "Set 'Show groups for' to POS and see the 0s grouped.", check: { kind: "param", key: "form", op: "eq", value: "pos" } },
    { id: "k4", title: "Turn on don't-cares", text: "Tick 'Use don't-care conditions'.", hint: "The checkbox is below the pattern slider.", check: { kind: "param", key: "useDc", op: "eq", value: true } },
    { id: "k5", title: "Add a don't-care cell", text: "Set a Don't-care pattern above 0, for example by adding cell m7.", hint: "m7 is bit 7, which has the value 128.", check: { kind: "param", key: "dc", op: "gte", value: 1 } },
    { id: "k6", title: "Load the don't-cares preset", text: "Press 'Don't-cares help' and see how m1, m3, m5 and X7 form one quad.", hint: "Presets are above the 3D view.", check: { kind: "preset", name: "Don't-cares help" } },
    { id: "k7", title: "Reset", text: "Press Reset to restore the default map.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "kmap-q1", type: "mcq", prompt: "Why are K-map rows and columns labelled in Gray code (00, 01, 11, 10)?", options: ["To save space", "So neighbouring cells differ in exactly one variable", "Because binary counting is not allowed", "To make the map symmetrical for 3 variables only"], answer: 1, marks: 2, hint: "Adjacency is what makes grouping work.", solution: ["Gray code changes only one bit between neighbours.", "Two adjacent cells therefore differ in a single variable.", "That variable drops out when they are grouped."], explanation: "This also makes the left and right edges (and top and bottom) adjacent.", commonMistake: "Labelling the map 00, 01, 10, 11, which breaks adjacency." },
    { id: "kmap-q2", type: "mcq", prompt: "Which group size is NOT allowed on a K-map?", options: ["2 cells", "4 cells", "6 cells", "8 cells"], answer: 2, marks: 2, hint: "Groups must be powers of two.", solution: ["A group of 2ⁿ cells removes n variables.", "6 is not a power of two, so no single product term covers exactly those six cells."], explanation: "Split six cells into a quad and a pair instead.", commonMistake: "Making a rectangle of 6 or 12 cells." },
    { id: "kmap-q3", type: "mcq", prompt: "For F = Σm(7, 9, 10, 11, 12, 13, 14, 15), the minimal SOP is:", options: ["AB + AC + AD + BCD", "A + BCD", "AB + CD", "A + B + C + D"], answer: 0, marks: 2, hint: "Load the first PYQ preset and read the Minimal SOP.", solution: ["Cells 12-15 form a quad: AB.", "Cells 10, 11, 14, 15 form a quad: AC.", "Cells 9, 11, 13, 15 form a quad: AD.", "Cell 7 only joins 15: BCD. All 1s are covered."], explanation: "Four terms are needed; A + BCD would wrongly include cell 8.", commonMistake: "Choosing A + BCD, which makes m8 a 1 as well." },
    { id: "kmap-q4", type: "tf", prompt: "The leftmost and rightmost columns of a K-map are adjacent (the map wraps around).", answer: true, marks: 1, solution: ["The columns 00 and 10 differ in a single bit.", "So cells in these columns are neighbours and can be grouped."], explanation: "Wrap-around groups are often the key to the minimal answer.", commonMistake: "Ignoring wrap-around groups." },
    { id: "kmap-q5", type: "tf", prompt: "Every don't-care (X) cell must be included in at least one group.", answer: false, marks: 1, solution: ["Don't-cares may be treated as 1 or 0, whichever gives a simpler expression.", "A don't-care need not be covered."], explanation: "Only the 1s must be covered.", commonMistake: "Treating X cells like compulsory 1s." },
    { id: "kmap-q6", type: "numeric", prompt: "F = Σm(1, 3, 5). Bit k of the 16-bit pattern is 1 when minterm k is a 1. What number does the Minterm pattern slider show?", answer: 42, tolerance: 0, marks: 2, hint: "Add 2^1 + 2^3 + 2^5.", solution: ["m1 is bit 1: 2¹ = 2.", "m3 is bit 3: 2³ = 8, and m5 is bit 5: 2⁵ = 32.", "2 + 8 + 32 = 42."], explanation: "This is the starting value of the 'Don't-cares help' preset.", commonMistake: "Counting the first bit as bit 1 instead of bit 0." },
    { id: "kmap-q7", type: "numeric", prompt: "After minimising a 4-variable function, an octet (group of 8 cells) is written as a product term. How many literals does that term contain?", answer: 1, tolerance: 0, marks: 2, hint: "A group of 2ⁿ cells removes n variables.", solution: ["8 = 2³, so 3 variables are eliminated.", "4 − 3 = 1 literal remains."], explanation: "For example the octet of all cells with A = 1 gives just A.", commonMistake: "Counting the number of cells instead of literals." },
    { id: "kmap-q8", type: "mcq", scenario: "A designer needs F = Σm(1, 3, 5) and knows that input combination 7 (ABCD = 0111) can never occur, so m7 is a don't-care.", prompt: "What is the simplest SOP using the don't-care?", options: ["A′D", "A′B′D + A′BD", "A′D + AD′", "BD"], answer: 0, marks: 3, hint: "Cells 1, 3, 5 and 7 form a quad.", formulas: ["Quad removes 2 variables"], solution: ["m1 = 0001, m3 = 0011, m5 = 0101, m7 = 0111 (X).", "With X as 1 they form a quad where A = 0 and D = 1 always, while B and C change.", "So the term is A′D."], explanation: "Without the don't-care you would need two pairs with three literals each.", commonMistake: "Refusing to use the X cell." },
  ],
  summary: [
    "Neighbouring K-map cells differ in one variable (Gray code), including wrap-around.",
    "A group of 2ⁿ cells removes n variables; bigger groups give simpler terms.",
    "SOP groups the 1s; POS groups the 0s and gives a product of sums.",
    "Don't-cares may be used as 1 or 0, whichever gives larger groups.",
  ],
};

const otto: Experiment = {
  labId: "otto",
  title: "Otto cycle: efficiency and compression ratio",
  aim: "To study the air-standard Otto cycle and show how its efficiency depends on the compression ratio and γ.",
  objectives: [
    "Identify the four processes of the cycle on a P-V diagram.",
    "Use η = 1 − r^(1−γ).",
    "Explain why efficiency does not depend on the heat added.",
  ],
  equipment: [
    { name: "P-V diagram", what: "The loop 1-2-3-4 with a moving state point.", where: "3D view" },
    { name: "Piston", what: "Moves with the state point.", where: "3D view" },
    { name: "Compression ratio slider", what: "Sets r = V₁/V₂.", where: "Compression ratio r" },
    { name: "γ and T₃/T₁ sliders", what: "Choose the gas and the peak temperature.", where: "Controls card" },
  ],
  steps: [
    { id: "o1", title: "Follow the cycle", text: "Watch the state point go round the loop once. Tick this step when you can name the four processes.", hint: "1-2 and 3-4 are adiabatic; 2-3 and 4-1 are constant volume.", check: { kind: "manual" } },
    { id: "o2", title: "Raise the compression ratio", text: "Set r to 10 or more. Note how the efficiency readout rises.", hint: "Compression ratio slider.", check: { kind: "param", key: "r", op: "gte", value: 10 } },
    { id: "o3", title: "Lower the compression ratio", text: "Set r to 5 or less and see the efficiency fall.", check: { kind: "param", key: "r", op: "lte", value: 5 } },
    { id: "o4", title: "Change γ", text: "Move the Heat capacity ratio γ slider. A monatomic gas has γ = 1.67.", check: { kind: "param", key: "g", op: "changed" } },
    { id: "o5", title: "Change the peak temperature", text: "Move T₃/T₁. Efficiency does not move, but the work and heat readouts do.", hint: "Watch the efficiency readout while you drag.", check: { kind: "param", key: "tau", op: "changed" } },
    { id: "o6", title: "Load the petrol engine preset", text: "Press 'Petrol engine' (r = 10, γ = 1.4).", check: { kind: "preset", name: "Petrol engine" } },
    { id: "o7", title: "Reset", text: "Press Reset to return to the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "otto-q1", type: "mcq", prompt: "In the Otto cycle, heat is added during which process?", options: ["Isothermal expansion", "Constant-volume process 2-3", "Constant-pressure process 2-3", "Adiabatic compression 1-2"], answer: 1, marks: 2, hint: "The spark happens when the piston is near the top.", solution: ["Process 1-2 is adiabatic compression.", "2-3: the spark adds heat while the volume stays fixed.", "3-4 is adiabatic expansion and 4-1 is constant-volume heat rejection."], explanation: "The Otto cycle is a constant-volume heat-addition cycle.", commonMistake: "Confusing it with the Diesel cycle, where heat is added at constant pressure." },
    { id: "otto-q2", type: "mcq", prompt: "What happens to the Otto cycle efficiency when the compression ratio is increased (γ fixed)?", options: ["It decreases", "It increases", "It stays the same", "It first rises then falls"], answer: 1, marks: 2, hint: "η = 1 − r^(1−γ) with 1 − γ negative.", formulas: ["η = 1 − r<sup>1−γ</sup>"], solution: ["1 − γ is negative, so r^(1−γ) gets smaller when r grows.", "Therefore η = 1 − r^(1−γ) increases."], explanation: "Real engines are limited by knock, not by the formula.", commonMistake: "Thinking the efficiency depends on the heat added." },
    { id: "otto-q3", type: "mcq", prompt: "Which change does NOT alter the Otto efficiency in the air-standard formula?", options: ["Changing r", "Changing γ", "Changing the peak temperature T₃", "Changing both r and γ"], answer: 2, marks: 2, hint: "Look for T₃ in the formula.", solution: ["η = 1 − r^(1−γ) contains only r and γ.", "T₃ changes the heat added and the work, but both scale together, so η is unchanged."], explanation: "You saw this: dragging T₃/T₁ moved the work but not the efficiency.", commonMistake: "Believing a hotter flame always means a better ratio of work to heat." },
    { id: "otto-q4", type: "tf", prompt: "Processes 1-2 and 3-4 of the ideal Otto cycle are adiabatic.", answer: true, marks: 1, solution: ["They are compression and expansion strokes that are too fast for heat to flow.", "In the ideal cycle they are reversible adiabatic, pV^γ = constant."], explanation: "The curved arcs in the 3D view are these.", commonMistake: "Calling them isothermal." },
    { id: "otto-q5", type: "tf", prompt: "For the same compression ratio, a gas with a larger γ gives a higher Otto efficiency.", answer: true, marks: 1, solution: ["With r > 1, a larger γ makes the exponent (1 − γ) more negative.", "r^(1−γ) is smaller, so η is larger."], explanation: "That is why argon (γ = 1.67) would beat air (γ = 1.4) in theory.", commonMistake: "Assuming γ has no effect." },
    { id: "otto-q6", type: "numeric", prompt: "Find the air-standard efficiency of an Otto engine with r = 8 and γ = 1.4, as a percentage.", answer: 56.5, tolerance: 0.3, unit: "%", marks: 2, hint: "8^(−0.4) ≈ 0.435.", formulas: ["η = 1 − r<sup>1−γ</sup>"], solution: ["η = 1 − 8^(1−1.4) = 1 − 8^(−0.4).", "8^(−0.4) = 0.4353.", "η = 1 − 0.4353 = 0.5647, which is 56.5%."], explanation: "Check this with the lab by setting r = 8 and γ = 1.4.", commonMistake: "Forgetting the minus sign in the exponent, which gives 8^0.4 = 2.3." },
    { id: "otto-q7", type: "numeric", prompt: "What compression ratio gives an air-standard efficiency of 60% with γ = 1.4?", answer: 9.88, tolerance: 0.1, marks: 3, hint: "0.4 = r^(−0.4), so r = 0.4^(−2.5).", formulas: ["η = 1 − r<sup>1−γ</sup>"], solution: ["0.60 = 1 − r^(−0.4), so r^(−0.4) = 0.40.", "r = 0.40^(−1/0.4) = 0.40^(−2.5).", "r = 9.88."], explanation: "A petrol engine with r ≈ 10 has about 60% ideal efficiency.", commonMistake: "Inverting the exponent." },
    { id: "otto-q8", type: "numeric", scenario: "A petrol engine cylinder has a swept volume of 540 cm³ and a clearance volume of 60 cm³.", prompt: "What is the compression ratio?", answer: 10, tolerance: 0.05, marks: 2, hint: "r = (swept + clearance)/clearance.", formulas: ["r = (V<sub>s</sub> + V<sub>c</sub>) / V<sub>c</sub>"], solution: ["Total volume at bottom = 540 + 60 = 600 cm³.", "r = 600 / 60 = 10."], explanation: "Using r = 10 and γ = 1.4 gives η ≈ 60%, as in the Petrol engine preset.", commonMistake: "Dividing swept volume by clearance and getting 9." },
  ],
  summary: [
    "The Otto cycle has two adiabats and two constant-volume lines.",
    "η = 1 − r^(1−γ): it depends only on r and γ.",
    "Raising r raises η, but knock limits r in petrol engines.",
    "Changing peak temperature changes the work output, not the efficiency.",
  ],
};

const rlc: Experiment = {
  labId: "rlc",
  title: "Series RLC circuit and resonance",
  aim: "To find the resonant frequency of a series RLC circuit and to see how impedance, phase and current change with frequency.",
  objectives: [
    "Calculate X<sub>L</sub>, X<sub>C</sub>, Z and f₀.",
    "Say whether the circuit is inductive, capacitive or resistive at a given f.",
    "Explain the effect of R on Q.",
  ],
  equipment: [
    { name: "AC source", what: "A 1 V sinusoidal supply whose frequency you control.", where: "Frequency f slider" },
    { name: "Resistor R", what: "Dissipates power and limits the current at resonance.", where: "Resistance R slider" },
    { name: "Inductor L", what: "Reactance X_L = 2πfL.", where: "Inductance L slider (mH)" },
    { name: "Capacitor C", what: "Reactance X_C = 1/(2πfC).", where: "Capacitance C slider (µF)" },
  ],
  steps: [
    { id: "l1", title: "Sweep the frequency", text: "Move the Frequency f slider and watch the phasor diagram.", check: { kind: "param", key: "f", op: "changed" } },
    { id: "l2", title: "Go above resonance", text: "Set f to 400 Hz or more. The current lags the voltage (inductive).", hint: "The readout says 'Phase (V leads I)' is positive.", check: { kind: "param", key: "f", op: "gte", value: 400 } },
    { id: "l3", title: "Go below resonance", text: "Set f to 60 Hz or less. The current leads the voltage (capacitive).", check: { kind: "param", key: "f", op: "lte", value: 60 } },
    { id: "l4", title: "Find resonance", text: "Press the 'At resonance' preset (f ≈ 159 Hz). Impedance falls to R.", hint: "Presets are above the 3D view.", check: { kind: "preset", name: "At resonance" } },
    { id: "l5", title: "Add resistance", text: "Raise R to 100 Ω or more and see the Q factor fall.", hint: "Resistance R slider.", check: { kind: "param", key: "R", op: "gte", value: 100 } },
    { id: "l6", title: "Change the inductance", text: "Move the Inductance L slider and see where f₀ goes.", check: { kind: "param", key: "L", op: "changed" } },
    { id: "l7", title: "Reset", text: "Press Reset to return to the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "rlc-q1", type: "mcq", prompt: "At resonance in a series RLC circuit:", options: ["X<sub>L</sub> = X<sub>C</sub> and Z = R", "X<sub>L</sub> = R and Z = 0", "X<sub>C</sub> = 0", "The current is minimum"], answer: 0, marks: 2, hint: "The reactances cancel.", formulas: ["Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²)"], solution: ["At resonance X<sub>L</sub> = X<sub>C</sub>, so X<sub>L</sub> − X<sub>C</sub> = 0.", "Z = √(R² + 0) = R, the smallest possible impedance.", "So the current V/R is maximum."], explanation: "Resonance makes the circuit purely resistive.", commonMistake: "Saying the impedance is zero at resonance." },
    { id: "rlc-q2", type: "mcq", prompt: "At a frequency above resonance, a series RLC circuit behaves as:", options: ["Capacitive, with current leading", "Inductive, with current lagging", "Purely resistive", "An open circuit"], answer: 1, marks: 2, hint: "X_L grows with f and X_C shrinks.", solution: ["X<sub>L</sub> = 2πfL rises with f, X<sub>C</sub> = 1/(2πfC) falls.", "Above f₀, X<sub>L</sub> > X<sub>C</sub>, so net reactance is inductive.", "The current lags the voltage."], explanation: "Try 400 Hz in the lab: phase is positive.", commonMistake: "Mixing up leading and lagging." },
    { id: "rlc-q3", type: "mcq", prompt: "Increasing R (with L and C fixed) will:", options: ["Raise f₀", "Lower f₀", "Lower the Q factor", "Raise the Q factor"], answer: 2, marks: 2, hint: "Q = (1/R)√(L/C).", formulas: ["Q = (1/R)√(L/C)", "f₀ = 1/(2π√(LC))"], solution: ["f₀ depends only on L and C, not on R.", "Q = (1/R)√(L/C) is inversely proportional to R.", "So raising R lowers Q and widens the resonance peak."], explanation: "More resistance means a flatter, less selective resonance.", commonMistake: "Thinking R changes the resonant frequency." },
    { id: "rlc-q4", type: "tf", prompt: "At resonance the power factor of a series RLC circuit is 1.", answer: true, marks: 1, solution: ["At resonance Z = R, so the phase angle is 0.", "Power factor = cos 0 = R/Z = 1."], explanation: "Voltage and current are in phase.", commonMistake: "Confusing power factor with Q." },
    { id: "rlc-q5", type: "tf", prompt: "Increasing the capacitance C increases the resonant frequency.", answer: false, marks: 1, solution: ["f₀ = 1/(2π√(LC)).", "A bigger C makes the denominator bigger, so f₀ goes down."], explanation: "Bigger L or C slows the oscillation.", commonMistake: "Assuming f₀ rises with C." },
    { id: "rlc-q6", type: "numeric", prompt: "Find the resonant frequency for L = 100 mH and C = 10 µF.", answer: 159.15, tolerance: 0.5, unit: "Hz", marks: 2, hint: "L = 0.1 H and C = 1×10⁻⁵ F.", formulas: ["f₀ = 1/(2π√(LC))"], solution: ["LC = 0.1 × 1×10⁻⁵ = 1×10⁻⁶, so √(LC) = 1×10⁻³.", "f₀ = 1/(2π × 10⁻³) = 159.15 Hz."], explanation: "This is the 'At resonance' preset frequency.", commonMistake: "Not converting mH and µF to H and F." },
    { id: "rlc-q7", type: "numeric", prompt: "For R = 20 Ω, L = 100 mH, C = 10 µF at f = 400 Hz, find the impedance Z.", answer: 212.5, tolerance: 1, unit: "Ω", marks: 3, hint: "X_L = 2πfL, X_C = 1/(2πfC).", formulas: ["X<sub>L</sub> = 2πfL", "X<sub>C</sub> = 1/(2πfC)", "Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²)"], solution: ["X<sub>L</sub> = 2π × 400 × 0.1 = 251.3 Ω.", "X<sub>C</sub> = 1/(2π × 400 × 10⁻⁵) = 39.8 Ω.", "Z = √(20² + (251.3 − 39.8)²) = √(400 + 44 750) = 212.5 Ω."], explanation: "Check the Impedance readout at f = 400 Hz.", commonMistake: "Adding X_L and X_C instead of subtracting." },
    { id: "rlc-q8", type: "numeric", scenario: "A radio tuner uses an inductor L = 200 µH and a variable capacitor. It must resonate at 1000 kHz.", prompt: "What capacitance is needed?", answer: 126.65, tolerance: 0.5, unit: "pF", marks: 3, hint: "C = 1/(4π²f²L).", formulas: ["C = 1 / (4π² f₀² L)"], solution: ["f₀ = 1×10⁶ Hz and L = 2×10⁻⁴ H.", "4π²f₀²L = 39.478 × 10¹² × 2×10⁻⁴ = 7.896 × 10⁹.", "C = 1 / 7.896×10⁹ = 1.2665×10⁻¹⁰ F = 126.65 pF."], explanation: "Turning the tuning knob changes C, and so changes the station f₀.", commonMistake: "Forgetting to square f₀ or the 2π." },
  ],
  summary: [
    "f₀ = 1/(2π√(LC)); at resonance X_L = X_C, Z = R and the current is maximum.",
    "Above f₀ the circuit is inductive (current lags); below f₀ it is capacitive (current leads).",
    "Q = (1/R)√(L/C): more resistance means lower Q and a flatter peak.",
    "Power factor is R/Z, and equals 1 at resonance.",
  ],
};

const transformer: Experiment = {
  labId: "transformer",
  title: "Single-phase transformer: turns ratio and core flux",
  aim: "To verify V₂/V₁ = N₂/N₁ and the EMF equation, and to see when a core saturates.",
  objectives: [
    "Calculate V₂, I₂ and I₁ from the turns ratio and load.",
    "Use B<sub>m</sub> = V₁/(4.44 f N₁ A).",
    "Say why a small core or a low frequency risks saturation.",
  ],
  equipment: [
    { name: "Primary winding (N1)", what: "Connected to the supply V₁.", where: "Primary voltage and N1 sliders" },
    { name: "Secondary winding (N2)", what: "Delivers V₂ to the load.", where: "N2 slider" },
    { name: "Iron core", what: "Carries the flux; turns orange when it saturates.", where: "Core area slider, 3D view" },
    { name: "Load resistor", what: "Sets the secondary current.", where: "Load resistance slider" },
  ],
  steps: [
    { id: "x1", title: "Load the step-down preset", text: "Press '230 V to 46 V step-down'. Read V₂, I₁ and I₂.", check: { kind: "preset", name: "230 V to 46 V step-down" } },
    { id: "x2", title: "Change the secondary turns", text: "Move the Secondary turns N2 slider and watch V₂.", check: { kind: "param", key: "N2", op: "changed" } },
    { id: "x3", title: "Make it a step-up", text: "Set N2 to 1000 or more (more than N1). V₂ is now larger than V₁.", hint: "Keep N1 at its starting value 500 if you can.", check: { kind: "param", key: "N2", op: "gte", value: 1000 } },
    { id: "x4", title: "Shrink the core", text: "Set the core area to 8 cm² or less. B_m rises until the core saturates.", hint: "Core area slider.", check: { kind: "param", key: "A", op: "lte", value: 8 } },
    { id: "x5", title: "Raise the frequency", text: "Set f to 100 Hz or more. B_m falls.", check: { kind: "param", key: "f", op: "gte", value: 100 } },
    { id: "x6", title: "Change the load", text: "Move the load resistance and see I₂ and I₁ follow.", check: { kind: "param", key: "RL", op: "changed" } },
    { id: "x7", title: "Reset", text: "Press Reset to restore the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "transformer-q1", type: "mcq", prompt: "An ideal transformer has N1 = 500 and N2 = 100. It is a:", options: ["step-up transformer, V₂ = 5V₁", "step-down transformer, V₂ = V₁/5", "step-down transformer, V₂ = 5V₁", "isolation transformer"], answer: 1, marks: 2, hint: "V₂/V₁ = N₂/N₁.", formulas: ["V<sub>2</sub>/V<sub>1</sub> = N<sub>2</sub>/N<sub>1</sub>"], solution: ["N₂/N₁ = 100/500 = 0.2.", "So V₂ = 0.2 V₁: the voltage is stepped down."], explanation: "Fewer secondary turns give a lower voltage.", commonMistake: "Inverting the ratio." },
    { id: "transformer-q2", type: "mcq", prompt: "For an ideal transformer, which statement about the secondary of a step-up transformer is correct?", options: ["Higher voltage and higher current", "Higher voltage and lower current", "Lower voltage and lower current", "Same voltage and current"], answer: 1, marks: 2, hint: "Power in = power out.", formulas: ["V<sub>1</sub>I<sub>1</sub> = V<sub>2</sub>I<sub>2</sub>"], solution: ["An ideal transformer keeps V·I constant.", "If V₂ is larger than V₁, then I₂ must be smaller than I₁."], explanation: "This is why power is transmitted at high voltage: smaller current, less I²R loss.", commonMistake: "Expecting both voltage and current to rise." },
    { id: "transformer-q3", type: "mcq", prompt: "If the supply frequency is halved (V₁, N₁ and A fixed), the peak flux density B<sub>m</sub>:", options: ["halves", "doubles", "stays the same", "becomes zero"], answer: 1, marks: 2, hint: "B_m = V₁/(4.44 f N₁ A).", formulas: ["B<sub>m</sub> = V<sub>1</sub> / (4.44 f N<sub>1</sub> A)"], solution: ["B<sub>m</sub> is inversely proportional to f.", "Halving f doubles B<sub>m</sub>, which may saturate the core."], explanation: "A 50 Hz transformer must not be fed at a much lower frequency.", commonMistake: "Thinking flux depends on current only." },
    { id: "transformer-q4", type: "tf", prompt: "A transformer works with a steady DC supply on the primary.", answer: false, marks: 1, solution: ["Induced EMF needs a changing flux.", "DC gives a constant flux, so no voltage is induced in the secondary."], explanation: "Also, the primary would overheat because only its small resistance limits the current.", commonMistake: "Forgetting that EMF = −dΦ/dt." },
    { id: "transformer-q5", type: "tf", prompt: "In an ideal transformer, the secondary current is larger than the primary current when N₂ < N₁.", answer: true, marks: 1, solution: ["I₂/I₁ = N₁/N₂.", "If N₂ < N₁ this ratio is greater than 1, so I₂ > I₁."], explanation: "A step-down transformer delivers a larger current.", commonMistake: "Mixing up which side has more current." },
    { id: "transformer-q6", type: "numeric", prompt: "The transformer is fed 230 V with N1 = 500, N2 = 100 and the load is 10 Ω. Find the primary current I₁.", answer: 0.92, tolerance: 0.01, unit: "A", marks: 3, hint: "V₂ = 46 V; I₂ = V₂/R_L; I₁ = I₂N₂/N₁.", formulas: ["V<sub>2</sub> = V<sub>1</sub>N<sub>2</sub>/N<sub>1</sub>", "I<sub>1</sub> = I<sub>2</sub>N<sub>2</sub>/N<sub>1</sub>"], solution: ["V₂ = 230 × 100/500 = 46 V.", "I₂ = 46/10 = 4.6 A.", "I₁ = 4.6 × 100/500 = 0.92 A."], explanation: "Check: V₁I₁ = 230 × 0.92 = 211.6 W = V₂I₂.", commonMistake: "Using the turns ratio the wrong way round for the current." },
    { id: "transformer-q7", type: "numeric", prompt: "Find the peak flux density B<sub>m</sub> for V₁ = 230 V, f = 50 Hz, N₁ = 500 and a core area of 20 cm².", answer: 1.036, tolerance: 0.01, unit: "T", marks: 3, hint: "A = 20 × 10⁻⁴ m².", formulas: ["B<sub>m</sub> = V<sub>1</sub> / (4.44 f N<sub>1</sub> A)"], solution: ["4.44 × 50 × 500 = 111 000.", "A = 20 cm² = 20 × 10⁻⁴ m² = 0.002 m².", "B<sub>m</sub> = 230 / (111 000 × 0.002) = 1.036 T."], explanation: "Below the roughly 1.6 T saturation limit, so the core is fine.", commonMistake: "Leaving the area in cm²." },
    { id: "transformer-q8", type: "numeric", scenario: "A workshop needs 24 V from a 230 V supply. The primary winding has 920 turns.", prompt: "How many secondary turns are needed (ideal transformer)?", answer: 96, tolerance: 0.5, marks: 2, hint: "N₂ = N₁V₂/V₁.", formulas: ["N<sub>2</sub> = N<sub>1</sub> V<sub>2</sub> / V<sub>1</sub>"], solution: ["N₂/N₁ = V₂/V₁ = 24/230.", "N₂ = 920 × 24/230.", "N₂ = 96 turns."], explanation: "The ratio is 230:24, roughly 9.6:1 step-down.", commonMistake: "Using V₁/V₂ instead of V₂/V₁." },
  ],
  summary: [
    "V₂/V₁ = N₂/N₁ and, for an ideal transformer, I₁/I₂ = N₂/N₁.",
    "Power in equals power out: V₁I₁ = V₂I₂.",
    "B_m = V₁/(4.44 f N₁ A): small cores, few turns or low frequency push the core to saturation (about 1.6 T).",
    "A transformer needs alternating flux, so it does not work on DC.",
  ],
};

export const CORE_EXPERIMENTS: Record<string, Experiment> = { thevenin, rings, pvwork, nernst, kmap, otto, rlc, transformer };
