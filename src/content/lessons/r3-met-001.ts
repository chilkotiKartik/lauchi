import type { Lesson } from "./types";

const trussJoints: Lesson = {
  intro: "A truss is a frame of straight bars pinned at the ends, like a bridge or a roof. The method of joints finds the force in each bar by balancing forces at one pin at a time. It is the most repeated topic in Unit 1, usually as a 5-mark definition and a 10-mark numerical. After this lesson you can classify a truss, find the reactions, and solve a simple truss joint by joint.",
  sections: [
    {
      h: "What a truss is and the assumptions",
      p: [
        "A truss is made of slender straight members joined at their ends by smooth pins. Loads and supports act only at the joints.",
        "Because of this, each member carries only an axial force. It is either tension (the member is pulled and tries to stretch) or compression (pushed and tries to shorten). The weight of the members is neglected.",
        "Convention: draw tension as an arrow pointing away from the joint. Draw compression as an arrow pointing towards the joint.",
      ],
    },
    {
      h: "Perfect, deficient and redundant trusses",
      p: [
        "Let m be the number of members and j the number of joints. Start with one triangle: 3 joints and 3 members. Each new joint needs two new members to stay rigid. So a rigid truss has m = 2j − 3.",
        "Perfect truss: m = 2j − 3. It is just rigid and statically determinate. Deficient truss: m < 2j − 3. It is not rigid and can collapse. Redundant truss: m > 2j − 3. It has extra members and cannot be solved with equilibrium equations alone.",
      ],
      formula: ["Perfect: m = 2j − 3", "Deficient: m < 2j − 3", "Redundant: m > 2j − 3"],
    },
    {
      h: "Method of joints",
      p: [
        "The idea: if the whole truss is in equilibrium, every joint is also in equilibrium. All forces at a pin pass through one point, so only two equations apply: ΣF<sub>x</sub> = 0 and ΣF<sub>y</sub> = 0. So you can find at most two unknown member forces at a joint.",
        "Step 1. Draw the free-body diagram of the whole truss. Find the support reactions using ΣM = 0, ΣF<sub>x</sub> = 0, ΣF<sub>y</sub> = 0.",
        "Step 2. Start at a joint with at most two unknown forces (usually a support).",
        "Step 3. Assume every unknown member force is tension (arrow away from the joint). Resolve each into x and y components using the member angle.",
        "Step 4. Apply ΣF<sub>y</sub> = 0 and ΣF<sub>x</sub> = 0 and solve. A positive answer means tension. A negative answer means compression.",
        "Step 5. Move to the next joint using the forces already found. Use the last joint as a check.",
      ],
    },
    {
      h: "Zero-force members",
      p: [
        "Two checks save time. (1) At a joint of two non-collinear members with no external load or reaction, both members carry zero force. (2) At a joint of three members, two of them in a straight line, with no external load, the third member carries zero force.",
      ],
    },
  ],
  examples: [
    {
      q: "Define a perfect truss. Test whether a truss with 6 joints and 9 members, and another with 5 joints and 6 members, are perfect. (5 marks)",
      steps: [
        "A perfect truss has just enough members to be rigid and statically determinate: m = 2j − 3.",
        "First truss: 2j − 3 = 12 − 3 = 9. Since m = 9, it is perfect.",
        "Second truss: 2j − 3 = 10 − 3 = 7. Since m = 6 < 7, it is deficient (not rigid).",
      ],
      ans: "The first is perfect; the second is deficient.",
    },
    {
      q: "A triangular truss ABC has a hinge at A and a roller at C. AC = 8 m is horizontal. The apex B is 3 m above the mid-point of AC. A load of 12 kN acts vertically down at B. Find the force in each member by the method of joints.",
      steps: [
        "Geometry: the horizontal run from A to B is 4 m and the rise is 3 m, so AB = BC = 5 m. The angle at A has sin θ = 3/5 = 0.6 and cos θ = 4/5 = 0.8.",
        "Reactions: by symmetry R<sub>A</sub> = R<sub>C</sub> = 12/2 = 6 kN upward. (Check by moments about A: R<sub>C</sub> × 8 = 12 × 4, R<sub>C</sub> = 6 kN.) No horizontal load, so the horizontal reaction at A is zero.",
        "Joint A. Assume F<sub>AB</sub> is tension (pointing up and to the right) and F<sub>AC</sub> is tension (pointing to the right).",
        "ΣF<sub>y</sub> = 0: 6 + F<sub>AB</sub> sin θ = 0, so F<sub>AB</sub> = −6/0.6 = −10 kN. The negative sign means compression.",
        "ΣF<sub>x</sub> = 0: F<sub>AC</sub> + F<sub>AB</sub> cos θ = 0, so F<sub>AC</sub> = −(−10)(0.8) = +8 kN (tension).",
        "Joint C is the mirror image, so F<sub>BC</sub> = 10 kN (compression) and F<sub>AC</sub> = 8 kN (tension).",
        "Check at joint B: vertical components of the two inclined members are 2 × 10 × 0.6 = 12 kN upward, balancing the 12 kN load. ✓",
      ],
      ans: "AB = BC = 10 kN (compression), AC = 8 kN (tension)",
    },
  ],
  mistakes: [
    "Using the angle wrongly. Write sin and cos from the actual triangle sides, not from a guess.",
    "Starting at a joint with three unknowns. Always begin where only two members are unknown.",
    "Mixing signs: assume tension for every member first, then read a negative answer as compression. Do not flip the arrow halfway.",
    "Forgetting to find the support reactions first. The joint equations need them.",
    "Applying the moment equation at a joint. At a pin only ΣF<sub>x</sub> and ΣF<sub>y</sub> are useful, since all forces pass through the same point.",
  ],
  check: [
    {
      q: "A truss with 7 joints is perfect when it has this many members:",
      o: ["11", "12", "14", "10"],
      a: 0,
      why: "m = 2j − 3 = 14 − 3 = 11.",
    },
    {
      q: "In the method of joints, the maximum number of unknown forces that can be solved at a joint is",
      o: ["2", "1", "3", "4"],
      a: 0,
      why: "A joint has only two independent equations: ΣF<sub>x</sub> = 0 and ΣF<sub>y</sub> = 0.",
    },
    {
      q: "A negative value for a member force (when tension was assumed) means the member is in",
      o: ["compression", "tension", "zero force", "shear"],
      a: 0,
      why: "The real force points opposite to the assumed direction, which is compression.",
    },
    {
      q: "A truss with m > 2j − 3 is called",
      o: ["redundant", "deficient", "perfect", "unstable"],
      a: 0,
      why: "Extra members make it statically indeterminate (redundant).",
    },
  ],
  lab: { id: "truss", label: "Truss forces by the method of joints" },
};

const friction: Lesson = {
  intro: "Friction questions are about one idea: friction is only as big as it needs to be, up to a limit of μN. Block-on-incline and ladder problems fill many UTU papers (5 or 10 marks each, usually repeated). After this lesson you can define the friction terms and solve a block on a slope and a ladder against a wall.",
  sections: [
    {
      h: "Friction and its laws",
      p: [
        "Friction is the force that resists sliding between two surfaces in contact. It acts along the surface, opposite to the motion (or the tendency to move).",
        "Static friction adjusts itself to match the push, up to a maximum. This maximum is limiting friction: F<sub>max</sub> = μ<sub>s</sub>N. Once sliding starts, kinetic friction F = μ<sub>k</sub>N acts, a little less than the limiting value.",
        "Laws of dry friction: it acts opposite to the motion; it depends on the nature of the surfaces and the normal reaction N; it does not depend on the contact area (to a good approximation).",
      ],
      formula: ["F ≤ μN (static); at the point of slipping F = μN", "μ = tan φ"],
    },
    {
      h: "Angle of friction, cone of friction, angle of repose",
      p: [
        "Combine N and F into one total reaction R. The angle between R and N is at most φ, where tan φ = F/N = μ at the point of slipping. φ is the angle of friction.",
        "Spin this limiting reaction around N and it traces a cone with half-angle φ. This is the cone of friction. If the resultant of the applied loads lies inside the cone, the body does not slide.",
        "Angle of repose is the steepest incline on which a body just stays at rest with no other force. Its value is equal to φ. So tan(angle of repose) = μ.",
      ],
    },
    {
      h: "Block on an inclined plane",
      p: [
        "Weight W resolves into W sin θ along the plane and W cos θ perpendicular to it. So N = W cos θ (with no other forces) and the limiting friction is μW cos θ.",
        "To push the block up the plane, a force P parallel to the plane must beat both the sliding component and friction. Friction now acts down the plane. To hold it from sliding down, friction acts up the plane.",
        "If P acts at an angle α above the plane, then N = W cos θ − P sin α. Write the two equations and solve.",
      ],
      formula: [
        "P (up the plane, parallel) = W (sin θ + μ cos θ)",
        "P (just prevents sliding down) = W (sin θ − μ cos θ)",
        "P (angle α above the plane, just moves up) = W (sin θ + μ cos θ) / (cos α + μ sin α)",
      ],
    },
    {
      h: "Ladder friction",
      p: [
        "A uniform ladder of length L and weight W rests with its foot A on the floor and its top B against a wall. The angle with the floor is θ.",
        "Forces: at the wall, a normal reaction N<sub>B</sub> (and friction if the wall is rough). At the floor, a normal reaction N<sub>A</sub> upward and friction F<sub>A</sub> towards the wall. Weight W acts at the middle.",
        "Step 1. ΣF<sub>y</sub> = 0 gives N<sub>A</sub> = W (smooth wall).",
        "Step 2. ΣF<sub>x</sub> = 0 gives F<sub>A</sub> = N<sub>B</sub>.",
        "Step 3. ΣM<sub>A</sub> = 0: N<sub>B</sub> × L sin θ = W × (L/2) cos θ, so N<sub>B</sub> = W/(2 tan θ).",
        "Step 4. For equilibrium F<sub>A</sub> ≤ μN<sub>A</sub>, i.e. W/(2 tan θ) ≤ μW. The ladder is just about to slip when tan θ = 1/(2μ).",
      ],
      formula: ["Smooth wall, rough floor: tan θ<sub>min</sub> = 1/(2μ)"],
    },
  ],
  examples: [
    {
      q: "A 50 kg block rests on a rough plane inclined at 30°. μ = 0.3. Find the force P applied parallel to the plane, upward, that just starts the block moving up. (g = 9.81 m/s²)",
      steps: [
        "W = 50 × 9.81 = 490.5 N.",
        "Normal reaction N = W cos 30° = 490.5 × 0.866 = 424.8 N.",
        "Limiting friction F = μN = 0.3 × 424.8 = 127.4 N, acting down the plane (opposing motion).",
        "Component of weight along the plane = W sin 30° = 245.25 N, also down the plane.",
        "P = 245.25 + 127.4 = 372.7 N.",
      ],
      ans: "P ≈ 372.7 N up the plane",
    },
    {
      q: "A uniform ladder 4 m long weighs 200 N. It leans against a smooth vertical wall at 60° to the floor. The floor has μ = 0.25. A man weighing 800 N climbs the ladder. How far along the ladder from its foot can he go before it slips?",
      steps: [
        "Let the man be at distance x from the foot A. Smooth wall, so only N<sub>B</sub> acts at the top, horizontally.",
        "Vertical: N<sub>A</sub> = 200 + 800 = 1000 N. So the maximum friction is μN<sub>A</sub> = 0.25 × 1000 = 250 N.",
        "Horizontal: F<sub>A</sub> = N<sub>B</sub>. At the limit N<sub>B</sub> = 250 N.",
        "Moments about A: N<sub>B</sub> × (4 sin 60°) = 200 × (2 cos 60°) + 800 × (x cos 60°).",
        "250 × 3.464 = 200 × 1 + 800 × 0.5x, so 866.0 = 200 + 400x.",
        "x = (866.0 − 200)/400 = 1.665 m.",
      ],
      ans: "x ≈ 1.67 m along the ladder from the foot",
    },
    {
      q: "A uniform ladder rests on a rough floor (μ = 0.4) against a smooth wall. Find the smallest angle with the floor at which it will not slip. (Theory with a short calculation.)",
      steps: [
        "From the derivation, the ladder is in limiting equilibrium when tan θ = 1/(2μ).",
        "tan θ = 1/(2 × 0.4) = 1.25.",
        "θ = tan<sup>−1</sup>(1.25) = 51.3°.",
      ],
      ans: "θ<sub>min</sub> ≈ 51.3°",
    },
  ],
  mistakes: [
    "Using N = W instead of N = W cos θ on an inclined plane.",
    "Pointing friction the wrong way. It always opposes the actual or the tending motion.",
    "Writing F = μN when the body is not about to slip. In general F ≤ μN; use the equals sign only for limiting friction.",
    "Taking moments about the wrong point on a ladder. Choose the foot A so the floor forces vanish from the moment equation.",
    "Forgetting that the ladder's weight acts at its mid-point (L/2), not at the top.",
  ],
  check: [
    {
      q: "The angle of friction φ and the coefficient μ are related by",
      o: ["tan φ = μ", "sin φ = μ", "cos φ = μ", "φ = μ"],
      a: 0,
      why: "tan φ = F/N = μ at the point of slipping.",
    },
    {
      q: "A body just stays at rest on a slope of 25°. The coefficient of friction is about",
      o: ["0.47", "0.25", "0.42", "0.90"],
      a: 0,
      why: "μ = tan(angle of repose) = tan 25° = 0.466.",
    },
    {
      q: "For a ladder against a smooth wall, it stays in equilibrium when",
      o: ["tan θ ≥ 1/(2μ)", "tan θ ≤ 1/(2μ)", "θ = 0", "tan θ = 2μ"],
      a: 0,
      why: "Required friction W/(2 tan θ) must not exceed μW, so tan θ ≥ 1/(2μ).",
    },
    {
      q: "Limiting friction depends on",
      o: ["the normal reaction and the surfaces", "the area of contact", "the speed of sliding", "the colour of the surface"],
      a: 0,
      why: "F<sub>max</sub> = μN: surface nature and normal reaction decide it.",
    },
  ],
  lab: { id: "ladder", label: "Ladder friction & impending slip" },
};

const stressStrain: Lesson = {
  intro: "The stress-strain curve of mild steel is the single most repeated drawing in Unit 2 (8 repeats, often 10 marks). One diagram tells you the proportional limit, yield point, ultimate strength and fracture, and it ends with E and ductility numbers. After this lesson you can draw it, label every point, and calculate stress, strain and E from a tensile test.",
  sections: [
    {
      h: "Stress and strain",
      p: [
        "Stress σ is the internal resisting force per unit area: σ = P/A. Units are N/mm² = MPa. Strain ε is the change in length per unit original length: ε = ΔL/L. It has no units.",
        "Hooke's law: up to a limit, stress is proportional to strain. The constant is Young's modulus E (for steel about 200 GPa).",
      ],
      formula: ["σ = P / A", "ε = ΔL / L", "E = σ / ε"],
    },
    {
      h: "The tensile test",
      p: [
        "A standard round specimen of known gauge length is pulled in a testing machine. The load and the extension are recorded, and converted to engineering stress (load / original area) and strain.",
        "Plot stress on the vertical axis and strain on the horizontal axis. For mild steel (a ductile material) the curve has these points in order:",
        "O to A, proportional limit: a straight line. Hooke's law holds. The slope is E.",
        "B, elastic limit: the largest stress from which the material returns fully to its original length when unloaded. It is very close to A.",
        "C and D, upper and lower yield points: the stress drops slightly and the material stretches a lot with no extra load. This is yielding. Plastic (permanent) strain begins.",
        "D to E, strain hardening: the material becomes stronger and the stress rises again.",
        "E, ultimate tensile strength (UTS): the highest point on the curve. The load divided by the original area is the UTS.",
        "E to F, necking: the cross-section shrinks locally at a neck. The engineering stress falls because the load is divided by the original area. Finally the bar breaks at F, the fracture point.",
      ],
    },
    {
      h: "Measures of ductility and design values",
      p: [
        "Percentage elongation = (final gauge length − original gauge length) / original gauge length × 100. Percentage reduction in area = (original area − final area at the neck) / original area × 100. Large values mean a ductile material.",
        "Materials like aluminium have no clear yield point. Use a proof stress: draw a line parallel to the straight part, starting at 0.2 % strain. Where it meets the curve is the 0.2 % proof stress.",
        "Design uses a working (allowable) stress, kept below yield for safety: σ<sub>w</sub> = σ<sub>y</sub> / factor of safety (FOS).",
      ],
      formula: [
        "% elongation = (L<sub>f</sub> − L<sub>0</sub>)/L<sub>0</sub> × 100",
        "% reduction in area = (A<sub>0</sub> − A<sub>f</sub>)/A<sub>0</sub> × 100",
        "σ<sub>w</sub> = σ<sub>y</sub> / FOS",
      ],
    },
  ],
  examples: [
    {
      q: "Draw the stress-strain curve for mild steel and name the salient points. (Theory, 10 marks)",
      steps: [
        "Draw axes: strain on x, stress on y. Start at the origin.",
        "Straight line O to A (proportional limit). B is the elastic limit, just after A.",
        "Yield region C to D: a small drop (upper yield, then lower yield), then a flat portion.",
        "Rise through strain hardening to E, the ultimate tensile strength.",
        "Falling part E to F (necking) to fracture F.",
        "Write the meaning of each point and the slope of OA = E.",
      ],
      ans: "O–A proportional, B elastic limit, C/D yield, E UTS, F fracture.",
    },
    {
      q: "A mild steel bar of 12 mm diameter and 60 mm gauge length is tested. The yield load is 30 kN and the maximum load is 45 kN. After fracture the gauge length is 75 mm and the neck diameter is 7.5 mm. In the elastic range a load of 20 kN gives an extension of 0.056 mm. Find the yield stress, UTS, % elongation, % reduction in area and E.",
      steps: [
        "A<sub>0</sub> = π/4 × 12<sup>2</sup> = 113.10 mm².",
        "Yield stress = 30000 / 113.10 = 265.3 MPa.",
        "UTS = 45000 / 113.10 = 397.9 MPa.",
        "% elongation = (75 − 60)/60 × 100 = 25 %.",
        "A<sub>f</sub> = π/4 × 7.5<sup>2</sup> = 44.18 mm². % reduction = (113.10 − 44.18)/113.10 × 100 = 60.9 %.",
        "Elastic stress = 20000/113.10 = 176.8 MPa. Strain = 0.056/60 = 9.333 × 10<sup>−4</sup>.",
        "E = 176.8 / 9.333 × 10<sup>−4</sup> = 189 400 MPa ≈ 189 GPa.",
      ],
      ans: "σ_y = 265.3 MPa, UTS = 397.9 MPa, 25 %, 60.9 %, E ≈ 189 GPa",
    },
    {
      q: "For the same steel, find the maximum safe load on a 12 mm bar using a factor of safety of 2 on yield.",
      steps: [
        "σ<sub>w</sub> = 265.3 / 2 = 132.6 MPa.",
        "P<sub>safe</sub> = σ<sub>w</sub> × A = 132.6 × 113.10 = 15 000 N.",
      ],
      ans: "P ≈ 15 kN",
    },
  ],
  mistakes: [
    "Using the diameter instead of the area. Always compute A = πd²/4 first.",
    "Calling the UTS the breaking stress. For ductile steel the fracture stress is lower than the UTS because of necking.",
    "Forgetting to convert units. N/mm² is the same as MPa, but kN must be converted to N.",
    "Mixing up the elastic limit and the proportional limit. They are close but not identical.",
    "Writing the percentage elongation formula with the final length only. It uses the increase in length.",
  ],
  check: [
    {
      q: "The slope of the straight part of a stress-strain curve gives",
      o: ["Young's modulus", "yield stress", "UTS", "Poisson's ratio"],
      a: 0,
      why: "E = σ/ε in the elastic region.",
    },
    {
      q: "The highest point on the engineering stress-strain curve is",
      o: ["ultimate tensile strength", "yield point", "proportional limit", "fracture point"],
      a: 0,
      why: "It is the maximum load divided by the original area.",
    },
    {
      q: "A 10 mm diameter rod carries 7854 N. The stress is",
      o: ["100 MPa", "785 MPa", "10 MPa", "1000 MPa"],
      a: 0,
      why: "A = π/4 × 100 = 78.54 mm²; σ = 7854/78.54 = 100 MPa.",
    },
    {
      q: "Necking occurs",
      o: ["after the ultimate stress", "before the proportional limit", "at the elastic limit", "at zero strain"],
      a: 0,
      why: "After the UTS the strain localises at one section and the neck forms.",
    },
  ],
  lab: { id: "tensile", label: "Tensile test & stress-strain curve" },
};

const bernoulli: Lesson = {
  intro: "Bernoulli's equation is energy conservation for a flowing fluid. It explains how a Venturi meter, a pitot tube and an aircraft wing work. Expect a 10-mark derivation with assumptions, or a numerical on pressure and velocity at two sections. It repeats almost every year. After this lesson you can derive it, state the assumptions, and solve pipe-flow numericals.",
  sections: [
    {
      h: "The idea: three kinds of energy",
      p: [
        "A fluid particle has energy for three reasons: its pressure, its speed, and its height. For an ideal fluid that does not lose energy to friction, the total stays constant along a streamline.",
        "Per unit weight these energies become heads (lengths in metres): pressure head p/ρg, velocity head v<sup>2</sup>/2g and datum (elevation) head z.",
      ],
      formula: ["p/ρg + v<sup>2</sup>/2g + z = constant (along a streamline)"],
    },
    {
      h: "Assumptions",
      p: [
        "The fluid is ideal (no viscosity), incompressible (constant density), the flow is steady, and it is along a streamline. No energy is added or removed by pumps or turbines, and there is no heat transfer.",
      ],
    },
    {
      h: "Derivation from Newton's second law",
      p: [
        "Step 1. Take a small cylinder of fluid, area dA and length ds, moving along a streamline. The streamline makes an angle θ with the vertical, so dz = ds cos θ.",
        "Step 2. Forces along the streamline: pressure force p dA on one face, (p + dp) dA on the other, opposing; weight component ρ g dA ds cos θ, also opposing the upward flow. Net force = −dp dA − ρ g dA ds cos θ.",
        "Step 3. Mass = ρ dA ds and acceleration along the streamline = v dv/ds (steady flow). Newton: −dp dA − ρ g dA dz = ρ dA ds × v dv/ds.",
        "Step 4. Divide by ρ dA: −dp/ρ − g dz = v dv. Rearranged: dp/ρ + v dv + g dz = 0 (Euler's equation).",
        "Step 5. Integrate for constant ρ: p/ρ + v<sup>2</sup>/2 + g z = constant. Divide by g to get the head form.",
      ],
      formula: [
        "dp/ρ + v dv + g dz = 0 (Euler)",
        "p<sub>1</sub>/ρg + v<sub>1</sub><sup>2</sup>/2g + z<sub>1</sub> = p<sub>2</sub>/ρg + v<sub>2</sub><sup>2</sup>/2g + z<sub>2</sub>",
        "Continuity: A<sub>1</sub>v<sub>1</sub> = A<sub>2</sub>v<sub>2</sub> = Q",
      ],
    },
    {
      h: "Using it, and what changes in real life",
      p: [
        "Continuity and Bernoulli are used together. Where the pipe narrows, velocity rises (continuity) and pressure falls (Bernoulli). This is the principle of the Venturi meter. A pitot tube measures a velocity from the pressure rise at a stagnation point. Torricelli's law for a tank orifice comes from taking p equal at the surface and the jet: v = √(2gh).",
        "Real fluids lose energy to friction, so a head loss h<sub>L</sub> is added on the downstream side. Also the equation applies only along one streamline, in steady flow, and with no work done between the two points.",
      ],
      formula: ["Torricelli: v = √(2gh)"],
    },
  ],
  examples: [
    {
      q: "State Bernoulli's theorem and derive the equation, giving its assumptions. (Theory, 10 marks)",
      steps: [
        "Statement: for steady, incompressible, non-viscous flow along a streamline, the sum of pressure head, velocity head and elevation head is constant.",
        "Assumptions: ideal fluid, incompressible, steady, flow along a streamline, only gravity and pressure forces.",
        "Take a fluid element and apply Newton's second law along the streamline to get dp/ρ + v dv + g dz = 0.",
        "Integrate with constant ρ: p/ρ + v<sup>2</sup>/2 + g z = constant.",
        "Divide by g: p/ρg + v<sup>2</sup>/2g + z = constant.",
      ],
      ans: "p/ρg + v²/2g + z = constant along a streamline",
    },
    {
      q: "Water (ρ = 1000 kg/m³) flows at 0.12 m³/s through a horizontal pipe that narrows from 300 mm to 150 mm diameter. The gauge pressure at the wide section is 200 kPa. Find the pressure at the narrow section, neglecting losses.",
      steps: [
        "A<sub>1</sub> = π/4 × 0.3<sup>2</sup> = 0.07069 m². A<sub>2</sub> = π/4 × 0.15<sup>2</sup> = 0.01767 m².",
        "v<sub>1</sub> = Q/A<sub>1</sub> = 0.12/0.07069 = 1.698 m/s. v<sub>2</sub> = 0.12/0.01767 = 6.791 m/s.",
        "Horizontal, so z<sub>1</sub> = z<sub>2</sub>. Bernoulli: p<sub>2</sub> = p<sub>1</sub> + ½ρ(v<sub>1</sub><sup>2</sup> − v<sub>2</sub><sup>2</sup>).",
        "p<sub>2</sub> = 200000 + 0.5 × 1000 × (2.883 − 46.12) = 200000 − 21 620 = 178 380 Pa.",
      ],
      ans: "p₂ ≈ 178.4 kPa (pressure falls as the water speeds up)",
    },
    {
      q: "A large tank has water 5 m above a small orifice of 20 mm diameter. Find the ideal jet speed and discharge.",
      steps: [
        "Take the free surface as point 1 (v ≈ 0, p atmospheric) and the jet as point 2 (p atmospheric). Heights differ by h = 5 m.",
        "Bernoulli gives v = √(2gh) = √(2 × 9.81 × 5) = 9.90 m/s.",
        "A = π/4 × 0.02<sup>2</sup> = 3.142 × 10<sup>−4</sup> m².",
        "Q = A v = 3.142 × 10<sup>−4</sup> × 9.90 = 3.11 × 10<sup>−3</sup> m³/s ≈ 3.1 L/s.",
      ],
      ans: "v ≈ 9.90 m/s, Q ≈ 3.11 L/s",
    },
  ],
  mistakes: [
    "Using the equation with a mix of gauge pressure at one point and absolute pressure at the other. Use the same type at both.",
    "Forgetting the continuity equation. You usually need A<sub>1</sub>v<sub>1</sub> = A<sub>2</sub>v<sub>2</sub> to get the velocities first.",
    "Using diameters instead of areas in continuity.",
    "Dropping the assumptions. The examiner awards marks for steady, incompressible, non-viscous, along a streamline.",
    "Mixing head and pressure units. If you use p, write ρ in kg/m³; if you use heads, write in metres.",
  ],
  check: [
    {
      q: "Bernoulli's equation expresses the conservation of",
      o: ["energy", "momentum only", "mass only", "charge"],
      a: 0,
      why: "It is an energy balance per unit weight (pressure, kinetic and potential).",
    },
    {
      q: "When water speeds up in a narrowing horizontal pipe, the pressure",
      o: ["decreases", "increases", "stays the same", "becomes zero"],
      a: 0,
      why: "Higher velocity head must be paid for by a lower pressure head.",
    },
    {
      q: "The jet speed from a tank orifice 2 m below the surface is about",
      o: ["6.26 m/s", "2 m/s", "19.6 m/s", "9.81 m/s"],
      a: 0,
      why: "v = √(2 × 9.81 × 2) = 6.26 m/s.",
    },
    {
      q: "Which is NOT an assumption of Bernoulli's equation?",
      o: ["The flow is turbulent and viscous", "The fluid is incompressible", "The flow is steady", "The fluid is non-viscous"],
      a: 0,
      why: "Viscous losses are neglected; the fluid is assumed ideal.",
    },
  ],
  lab: { id: "bernoulli", label: "Venturi meter & Bernoulli" },
};

const copLesson: Lesson = {
  intro: "Heat engines, refrigerators and heat pumps all move heat between a hot and a cold place. The only difference is which result you want. This topic gives you a definition question (5 marks) and a numerical with reservoirs and COP (10 marks) almost every year. After this lesson you can write efficiency and COP for each device, relate them, and use the Carnot limit to check a claim.",
  sections: [
    {
      h: "Three devices, one picture",
      p: [
        "A thermal reservoir is a body so large that its temperature does not change when it gives or takes heat.",
        "Heat engine: takes Q<sub>H</sub> from a hot source, converts part to work W, and rejects Q<sub>L</sub> to a cold sink. Efficiency η = W/Q<sub>H</sub> = 1 − Q<sub>L</sub>/Q<sub>H</sub>.",
        "Refrigerator: uses work W to take Q<sub>L</sub> out of a cold space and dump Q<sub>H</sub> = Q<sub>L</sub> + W to the surroundings. The aim is to remove Q<sub>L</sub>.",
        "Heat pump: same cycle as the refrigerator, but the aim is to deliver Q<sub>H</sub> to a warm space such as a room.",
      ],
    },
    {
      h: "Efficiency and COP",
      p: [
        "COP (coefficient of performance) is useful effect divided by work input. Unlike efficiency, it can be greater than 1. For the same cycle, the heat pump COP is always one more than the refrigerator COP. Proof: COP<sub>HP</sub> = Q<sub>H</sub>/W = (Q<sub>L</sub> + W)/W = Q<sub>L</sub>/W + 1 = COP<sub>R</sub> + 1.",
      ],
      formula: [
        "η = W / Q<sub>H</sub> = 1 − Q<sub>L</sub> / Q<sub>H</sub>",
        "COP<sub>R</sub> = Q<sub>L</sub> / W = Q<sub>L</sub> / (Q<sub>H</sub> − Q<sub>L</sub>)",
        "COP<sub>HP</sub> = Q<sub>H</sub> / W = Q<sub>H</sub> / (Q<sub>H</sub> − Q<sub>L</sub>)",
        "COP<sub>HP</sub> = COP<sub>R</sub> + 1",
      ],
    },
    {
      h: "Carnot limits",
      p: [
        "No device can beat a reversible (Carnot) device working between the same two temperatures. For a reversible cycle Q<sub>H</sub>/Q<sub>L</sub> = T<sub>H</sub>/T<sub>L</sub>, using absolute temperatures in kelvin.",
        "These are the best possible values. Use them to check whether a claim is possible. If the claimed efficiency or COP is greater than the Carnot value, the claim is impossible.",
      ],
      formula: [
        "η<sub>Carnot</sub> = 1 − T<sub>L</sub>/T<sub>H</sub>",
        "COP<sub>R,Carnot</sub> = T<sub>L</sub> / (T<sub>H</sub> − T<sub>L</sub>)",
        "COP<sub>HP,Carnot</sub> = T<sub>H</sub> / (T<sub>H</sub> − T<sub>L</sub>)",
      ],
    },
  ],
  examples: [
    {
      q: "Define heat engine, refrigerator and heat pump. Show that COP of a heat pump = COP of a refrigerator + 1. (Theory, 5 marks)",
      steps: [
        "Heat engine: a cyclic device that receives heat from a source, converts part into work, and rejects the rest to a sink. η = W/Q<sub>H</sub>.",
        "Refrigerator: a cyclic device that removes heat Q<sub>L</sub> from a cold body using work W. COP<sub>R</sub> = Q<sub>L</sub>/W.",
        "Heat pump: the same, but the desired output is Q<sub>H</sub> given to a warm body. COP<sub>HP</sub> = Q<sub>H</sub>/W.",
        "Energy balance: Q<sub>H</sub> = Q<sub>L</sub> + W.",
        "So COP<sub>HP</sub> = (Q<sub>L</sub> + W)/W = COP<sub>R</sub> + 1.",
      ],
      ans: "COP_HP = COP_R + 1",
    },
    {
      q: "A reversible heat engine takes 1000 kJ from a 800 K source and rejects heat at 300 K. Its work output drives a reversible refrigerator working between 270 K and 300 K. Find the work, and the heat removed from the cold space by the refrigerator.",
      steps: [
        "Engine efficiency = 1 − 300/800 = 0.625.",
        "Work W = 0.625 × 1000 = 625 kJ. (Heat rejected = 375 kJ.)",
        "Refrigerator COP = T<sub>L</sub>/(T<sub>H</sub> − T<sub>L</sub>) = 270/(300 − 270) = 9.",
        "Heat removed from the cold space Q<sub>L</sub> = COP × W = 9 × 625 = 5625 kJ.",
        "Heat rejected by the refrigerator to the 300 K surroundings = 5625 + 625 = 6250 kJ.",
      ],
      ans: "W = 625 kJ, Q_L = 5625 kJ (6250 kJ rejected at 300 K)",
    },
    {
      q: "A refrigerator has COP = 4 and uses 2 kW of power. Find the cooling rate, the heat rejected, and the COP if the same machine is used as a heat pump.",
      steps: [
        "Q<sub>L</sub> = COP<sub>R</sub> × W = 4 × 2 = 8 kW.",
        "Q<sub>H</sub> = Q<sub>L</sub> + W = 8 + 2 = 10 kW.",
        "COP<sub>HP</sub> = Q<sub>H</sub>/W = 10/2 = 5 (= 4 + 1).",
      ],
      ans: "Cooling 8 kW, heat rejected 10 kW, COP as heat pump = 5",
    },
  ],
  mistakes: [
    "Using °C in Carnot formulas. Always convert to kelvin (add 273).",
    "Writing COP<sub>R</sub> = Q<sub>H</sub>/W. The refrigerator's useful effect is Q<sub>L</sub>.",
    "Saying COP must be below 1 like efficiency. Refrigerator and heat pump COPs are usually above 1.",
    "Forgetting the sign convention: Q<sub>H</sub> = Q<sub>L</sub> + W for a refrigerator, but W = Q<sub>H</sub> − Q<sub>L</sub> for an engine.",
    "Mixing up which COP formula uses Q<sub>L</sub> and which uses Q<sub>H</sub> in the numerator. Ask: what do I want, cooling (Q<sub>L</sub>) or heating (Q<sub>H</sub>)?",
  ],
  check: [
    {
      q: "A Carnot engine works between 600 K and 300 K. Its efficiency is",
      o: ["50 %", "33 %", "100 %", "75 %"],
      a: 0,
      why: "η = 1 − 300/600 = 0.5.",
    },
    {
      q: "If COP of a refrigerator is 3, the COP of the same device as a heat pump is",
      o: ["4", "3", "2", "1/3"],
      a: 0,
      why: "COP<sub>HP</sub> = COP<sub>R</sub> + 1 = 4.",
    },
    {
      q: "A refrigerator removes 6 kW from the cold space using 2 kW of work. It rejects",
      o: ["8 kW", "4 kW", "6 kW", "12 kW"],
      a: 0,
      why: "Q<sub>H</sub> = Q<sub>L</sub> + W = 6 + 2 = 8 kW.",
    },
    {
      q: "The maximum COP of a refrigerator between 250 K and 300 K is",
      o: ["5", "6", "0.2", "1.2"],
      a: 0,
      why: "COP = 250/(300 − 250) = 5.",
    },
  ],
  lab: { id: "carnot", label: "Heat engine, refrigerator & heat pump" },
};

const secondLaw: Lesson = {
  intro: "The first law says energy is conserved. It does not say which way a process can go. The second law fills this gap, and its two statements, Kelvin-Planck and Clausius, are the most repeated 10-mark theory question in Unit 4 (8 repeats). After this lesson you can state both, prove they are equivalent, and use them to test whether a claimed machine is possible.",
  sections: [
    {
      h: "Why the first law is not enough",
      p: [
        "A hot cup of tea cools in a cold room. The first law is satisfied: heat leaves the cup and enters the air. The reverse process (tea heats itself using heat from cold air) would also satisfy energy conservation, but it never happens.",
        "Likewise, all the work of a paddle wheel can become heat, but heat alone cannot turn all back into work. Nature has a direction. The second law states it.",
      ],
    },
    {
      h: "The two statements",
      p: [
        "Kelvin-Planck: it is impossible for a device operating in a cycle to receive heat from a single reservoir and produce a net amount of work. In short, no heat engine can have 100 % efficiency; some heat must be rejected to a sink. A device that breaks this is called a perpetual motion machine of the second kind (PMM-2).",
        "Clausius: it is impossible to construct a device operating in a cycle whose only effect is to transfer heat from a colder body to a hotter body. In short, a refrigerator needs work input.",
        "Both are negative statements. They have never been contradicted by an experiment, so we accept them as laws.",
      ],
    },
    {
      h: "Equivalence of the two statements",
      p: [
        "The two statements look different but say the same thing. We show that breaking one breaks the other.",
        "Part 1. Suppose a Kelvin-Planck violator exists: an engine E takes Q from a hot reservoir at T<sub>H</sub> and converts all of it to work W = Q. Use this W to run an ordinary refrigerator R between a cold reservoir T<sub>L</sub> and T<sub>H</sub>. R takes Q<sub>L</sub> from the cold body and dumps Q<sub>L</sub> + Q to the hot reservoir. Overall effect: the cold body loses Q<sub>L</sub> and the hot reservoir gains net Q<sub>L</sub> (it supplied Q and received Q<sub>L</sub> + Q). Heat moved from cold to hot with no work, which violates Clausius.",
        "Part 2. Suppose a Clausius violator exists: it moves Q<sub>L</sub> from cold to hot with no work. Run an ordinary engine between the same reservoirs. It takes Q<sub>H</sub> from the hot body, produces W, and rejects Q<sub>L</sub> to the cold body. The violator returns that Q<sub>L</sub> to the hot body. Overall: the hot reservoir loses only Q<sub>H</sub> − Q<sub>L</sub>, which is all converted to work. The cold body is unchanged. This is a single-reservoir engine, which violates Kelvin-Planck.",
        "So violating either one violates the other. They are equivalent.",
      ],
    },
    {
      h: "Practical use: is the claim possible?",
      p: [
        "Compare any claim with the Carnot limit for the same temperatures. A heat engine cannot beat 1 − T<sub>L</sub>/T<sub>H</sub>. A refrigerator cannot beat T<sub>L</sub>/(T<sub>H</sub> − T<sub>L</sub>). Always use kelvin.",
      ],
      formula: ["η ≤ 1 − T<sub>L</sub>/T<sub>H</sub>", "COP<sub>R</sub> ≤ T<sub>L</sub>/(T<sub>H</sub> − T<sub>L</sub>)"],
    },
  ],
  examples: [
    {
      q: "State the Kelvin-Planck and Clausius statements and prove that they are equivalent. (Theory, 10 marks)",
      steps: [
        "Kelvin-Planck: no cyclic device can take heat from one reservoir and give out net work. Clausius: no cyclic device can pass heat from cold to hot as its only effect.",
        "Draw a figure with a hot reservoir, a cold reservoir, a KP-violating engine and an ordinary refrigerator.",
        "Show that a KP violator driving a refrigerator makes a Clausius violator (cold-to-hot, no net work).",
        "Draw a second figure with a Clausius violator and an ordinary engine.",
        "Show that together they form a KP violator (heat from one reservoir fully converted to work).",
        "Conclude: violation of one means violation of the other, so the two statements are equivalent.",
      ],
      ans: "Violation of either statement implies violation of the other.",
    },
    {
      q: "An inventor claims an engine that takes 500 kJ from a source at 500 K and rejects 200 kJ to a sink at 300 K. Is the claim possible?",
      steps: [
        "Work = 500 − 200 = 300 kJ. Claimed efficiency = 300/500 = 60 %.",
        "Carnot efficiency between the same reservoirs = 1 − 300/500 = 40 %.",
        "60 % is more than 40 %, so it would violate the Kelvin-Planck statement.",
      ],
      ans: "Impossible (60 % > 40 %)",
    },
    {
      q: "A refrigerator is claimed to remove 200 kJ from a space at 250 K using 20 kJ of work, rejecting heat to surroundings at 300 K. Is this possible?",
      steps: [
        "Claimed COP = 200/20 = 10.",
        "Maximum COP (Carnot) = 250/(300 − 250) = 5.",
        "10 > 5, so the claim violates the second law (the Clausius statement).",
      ],
      ans: "Impossible (COP 10 > 5)",
    },
  ],
  mistakes: [
    "Mixing the two statements up: Kelvin-Planck is about engines (no 100 % efficiency), Clausius is about refrigerators (no free cold-to-hot heat flow).",
    "Leaving out the words 'operating in a cycle' and 'only effect'. These are needed for full marks.",
    "Using Celsius in the Carnot check. Use kelvin.",
    "Saying the second law forbids heat flow from cold to hot altogether. A refrigerator does it, but using work.",
    "Writing the equivalence proof for only one direction. Show both: KP violation gives a Clausius violation, and the reverse.",
  ],
  check: [
    {
      q: "The Kelvin-Planck statement says that",
      o: ["no heat engine can be 100 % efficient", "heat flows from hot to cold", "energy is conserved", "no refrigerator can work"],
      a: 0,
      why: "A cyclic engine must reject some heat to a sink.",
    },
    {
      q: "A device that takes heat from one reservoir and gives equal work in a cycle is a",
      o: ["PMM-2", "PMM-1", "Carnot engine", "heat pump"],
      a: 0,
      why: "This is a perpetual motion machine of the second kind.",
    },
    {
      q: "Which statement says heat cannot flow from cold to hot as the only effect of a cycle?",
      o: ["Clausius", "Kelvin-Planck", "Zeroth law", "First law"],
      a: 0,
      why: "That is the Clausius statement.",
    },
    {
      q: "An engine between 400 K and 300 K is claimed to have 30 % efficiency. The Carnot limit is 25 %. The claim is",
      o: ["impossible", "possible", "possible only at 0 °C", "reversible"],
      a: 0,
      why: "No engine can exceed the Carnot efficiency of 1 − 300/400 = 25 %.",
    },
  ],
  lab: { id: "secondlaw", label: "Kelvin–Planck vs Clausius: why they are equivalent" },
};

const otto: Lesson = {
  intro: "The Otto cycle is the ideal model of a petrol (spark-ignition) engine. Its efficiency derivation and an air-standard numerical are among the most repeated 10-mark questions in the whole subject (8 and 6 repeats). After this lesson you can derive η = 1 − 1/r<sup>γ−1</sup>, find the mean effective pressure, and run a full cycle calculation.",
  sections: [
    {
      h: "The cycle in four steps",
      p: [
        "The air-standard Otto cycle treats the working fluid as air (an ideal gas with fixed γ) and the combustion as heat added from outside. It has four processes:",
        "1 → 2 isentropic compression of the air. The volume falls from v<sub>1</sub> to v<sub>2</sub>.",
        "2 → 3 heat addition at constant volume (the spark). Pressure and temperature jump.",
        "3 → 4 isentropic expansion (the power stroke).",
        "4 → 1 heat rejection at constant volume (exhaust). The cycle closes.",
        "The compression ratio is r = v<sub>1</sub>/v<sub>2</sub> = (swept volume + clearance volume) / clearance volume.",
      ],
    },
    {
      h: "Derivation of the efficiency",
      p: [
        "Step 1. Heat added at constant volume: q<sub>in</sub> = c<sub>v</sub>(T<sub>3</sub> − T<sub>2</sub>). Heat rejected: q<sub>out</sub> = c<sub>v</sub>(T<sub>4</sub> − T<sub>1</sub>).",
        "Step 2. Efficiency = net work / heat added = 1 − q<sub>out</sub>/q<sub>in</sub> = 1 − (T<sub>4</sub> − T<sub>1</sub>)/(T<sub>3</sub> − T<sub>2</sub>).",
        "Step 3. Process 1-2 is isentropic: T<sub>2</sub>/T<sub>1</sub> = (v<sub>1</sub>/v<sub>2</sub>)<sup>γ−1</sup> = r<sup>γ−1</sup>.",
        "Step 4. Process 3-4 is isentropic and v<sub>3</sub> = v<sub>2</sub>, v<sub>4</sub> = v<sub>1</sub>: T<sub>3</sub>/T<sub>4</sub> = (v<sub>4</sub>/v<sub>3</sub>)<sup>γ−1</sup> = r<sup>γ−1</sup>.",
        "Step 5. From steps 3 and 4: T<sub>2</sub>/T<sub>1</sub> = T<sub>3</sub>/T<sub>4</sub>, so T<sub>3</sub>/T<sub>2</sub> = T<sub>4</sub>/T<sub>1</sub>. Subtract 1 and cross-multiply: (T<sub>3</sub> − T<sub>2</sub>)/T<sub>2</sub> = (T<sub>4</sub> − T<sub>1</sub>)/T<sub>1</sub>, hence (T<sub>4</sub> − T<sub>1</sub>)/(T<sub>3</sub> − T<sub>2</sub>) = T<sub>1</sub>/T<sub>2</sub> = 1/r<sup>γ−1</sup>.",
        "Step 6. So the efficiency depends only on r and γ. A higher compression ratio gives a higher efficiency (limited in practice by knocking).",
      ],
      formula: [
        "η<sub>Otto</sub> = 1 − 1 / r<sup>γ−1</sup>",
        "T<sub>2</sub> = T<sub>1</sub> r<sup>γ−1</sup>, p<sub>2</sub> = p<sub>1</sub> r<sup>γ</sup>",
        "T<sub>3</sub> = T<sub>2</sub> + q<sub>in</sub>/c<sub>v</sub>, T<sub>4</sub> = T<sub>3</sub> / r<sup>γ−1</sup>",
      ],
    },
    {
      h: "Mean effective pressure",
      p: [
        "The mean effective pressure (mep) is the constant pressure that would give the same net work as the cycle during the piston's swept volume. It is a way to compare engines of different size.",
        "mep = net work per kg / (v<sub>1</sub> − v<sub>2</sub>), where v<sub>1</sub> = RT<sub>1</sub>/p<sub>1</sub> and v<sub>2</sub> = v<sub>1</sub>/r.",
      ],
      formula: ["mep = w<sub>net</sub> / (v<sub>1</sub> − v<sub>2</sub>) = w<sub>net</sub> / [v<sub>1</sub>(1 − 1/r)]"],
    },
  ],
  examples: [
    {
      q: "Derive the air-standard efficiency of the Otto cycle with p-v and T-s sketches. (Theory, 10 marks)",
      steps: [
        "Sketch the p-v diagram: two adiabats (1-2, 3-4) and two constant-volume lines (2-3, 4-1). Sketch T-s with two vertical lines for the isentropic processes.",
        "q<sub>in</sub> = c<sub>v</sub>(T<sub>3</sub> − T<sub>2</sub>), q<sub>out</sub> = c<sub>v</sub>(T<sub>4</sub> − T<sub>1</sub>).",
        "η = 1 − (T<sub>4</sub> − T<sub>1</sub>)/(T<sub>3</sub> − T<sub>2</sub>).",
        "Use T<sub>2</sub>/T<sub>1</sub> = T<sub>3</sub>/T<sub>4</sub> = r<sup>γ−1</sup> to get the ratio equal to 1/r<sup>γ−1</sup>.",
        "η = 1 − 1/r<sup>γ−1</sup>.",
      ],
      ans: "η = 1 − 1/r^(γ−1)",
    },
    {
      q: "Find the air-standard efficiency of an Otto engine with compression ratio 8 (γ = 1.4).",
      steps: [
        "r<sup>γ−1</sup> = 8<sup>0.4</sup> = 2.297.",
        "η = 1 − 1/2.297 = 1 − 0.4353 = 0.5647.",
      ],
      ans: "η ≈ 56.5 %",
    },
    {
      q: "An Otto cycle has r = 8. Air at the start of compression is at 1 bar and 300 K. Heat added is 1000 kJ/kg. Take c<sub>v</sub> = 0.718 kJ/kg·K, R = 0.287 kJ/kg·K, γ = 1.4. Find the maximum temperature and pressure, the net work, the efficiency and the mep.",
      steps: [
        "T<sub>2</sub> = 300 × 8<sup>0.4</sup> = 300 × 2.2974 = 689.2 K. p<sub>2</sub> = 1 × 8<sup>1.4</sup> = 18.38 bar.",
        "T<sub>3</sub> = T<sub>2</sub> + q<sub>in</sub>/c<sub>v</sub> = 689.2 + 1000/0.718 = 689.2 + 1392.7 = 2082 K (maximum temperature).",
        "p<sub>3</sub> = p<sub>2</sub> × T<sub>3</sub>/T<sub>2</sub> = 18.38 × 2082/689.2 = 55.5 bar (maximum pressure).",
        "T<sub>4</sub> = T<sub>3</sub>/8<sup>0.4</sup> = 2082/2.2974 = 906.2 K.",
        "q<sub>out</sub> = c<sub>v</sub>(T<sub>4</sub> − T<sub>1</sub>) = 0.718 × (906.2 − 300) = 435.3 kJ/kg.",
        "w<sub>net</sub> = 1000 − 435.3 = 564.7 kJ/kg. η = 564.7/1000 = 56.5 %, matching 1 − 1/r<sup>0.4</sup>. ✓",
        "v<sub>1</sub> = RT<sub>1</sub>/p<sub>1</sub> = 0.287 × 300 / 100 = 0.861 m³/kg. v<sub>1</sub> − v<sub>2</sub> = 0.861 × (1 − 1/8) = 0.7534 m³/kg.",
        "mep = 564.7 / 0.7534 = 749.6 kPa ≈ 7.50 bar.",
      ],
      ans: "T_max ≈ 2082 K, p_max ≈ 55.5 bar, w_net ≈ 564.7 kJ/kg, η ≈ 56.5 %, mep ≈ 7.5 bar",
    },
  ],
  mistakes: [
    "Using r<sup>γ</sup> instead of r<sup>γ−1</sup> in the efficiency. The exponent is γ − 1.",
    "Adding heat at constant pressure. In the Otto cycle heat is added at constant volume (use c<sub>v</sub>, not c<sub>p</sub>).",
    "Using °C in the temperature ratios. Use kelvin.",
    "Dividing the net work by the total volume v<sub>1</sub> in the mep. Divide by the swept volume v<sub>1</sub> − v<sub>2</sub>.",
    "Forgetting that the efficiency does not depend on the heat added or on the maximum temperature. It depends only on r and γ.",
  ],
  check: [
    {
      q: "The efficiency of an Otto cycle depends on",
      o: ["compression ratio and γ", "cut-off ratio", "peak pressure only", "heat input only"],
      a: 0,
      why: "η = 1 − 1/r<sup>γ−1</sup>.",
    },
    {
      q: "For γ = 1.4, the Otto efficiency at r = 6 is about",
      o: ["51.2 %", "56.5 %", "60.2 %", "40 %"],
      a: 0,
      why: "6<sup>0.4</sup> = 2.048, so η = 1 − 0.488 = 0.512.",
    },
    {
      q: "In the Otto cycle, heat is added at",
      o: ["constant volume", "constant pressure", "constant temperature", "constant entropy"],
      a: 0,
      why: "The spark ignites the charge near top dead centre while volume is almost constant.",
    },
    {
      q: "Increasing the compression ratio of an Otto engine",
      o: ["raises the ideal efficiency", "lowers the ideal efficiency", "does not change it", "makes it 100 %"],
      a: 0,
      why: "r appears in the denominator of the loss term 1/r<sup>γ−1</sup>.",
    },
  ],
  lab: { id: "otto", label: "Otto engine cycle" },
};

export const L_MET001: Record<string, Lesson> = {
  "MET-001:1:10": trussJoints,
  "MET-001:1:7": friction,
  "MET-001:2:14": stressStrain,
  "MET-001:3:11": bernoulli,
  "MET-001:4:11": copLesson,
  "MET-001:4:12": secondLaw,
  "MET-001:5:6": otto,
};
