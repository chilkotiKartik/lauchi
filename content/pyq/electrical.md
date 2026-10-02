# BASIC ELECTRICAL ENGINEERING (EET-001 / BEET-101 / TEE-101 / TEE-201)
## Master Syllabus, Complete PYQ Archive with Marks & Repetition Counts, Predicted Topics, and 3D Virtual Lab Blueprints (Units I to V)

---

# UNIT I: DC CIRCUITS

## 1. Syllabus Topics
* **Circuit Fundamentals:** Electrical circuit elements: Resistor ($R$), Inductor ($L$), and Capacitor ($C$); voltage, current, and energy relationships in $R$, $L$, and $C$[cite: 1, 54].
* **Sources & Laws:** Independent and dependent voltage and current sources, linear vs. non-linear, unilateral vs. bilateral, active vs. passive elements[cite: 1, 56, 58, 60]. Kirchhoff's Current Law (KCL) and Kirchhoff's Voltage Law (KVL)[cite: 1, 51, 56, 58, 59]. Analysis of simple DC circuits with mesh and nodal methods[cite: 1, 55, 56, 58, 59].
* **Network Theorems:** Superposition theorem, Thevenin's theorem, Norton's theorem, and Maximum Power Transfer theorem (statements, derivations, proofs, and circuit applications with DC sources)[cite: 1, 51, 53, 54, 55, 56, 58, 59, 60].
* **Network Transformations:** Star-to-Delta ($Y\text{-}\Delta$) and Delta-to-Star ($\Delta\text{-}Y$) transformation equations and equivalent derivations[cite: 1, 53, 55].
* **Transient Analysis:** Time-domain analysis of first-order $RL$ and $RC$ circuits, derivation of time constant ($\tau = L/R$ and $\tau = RC$) under DC excitation, steady-state behavior of inductors (short circuit) and capacitors (open circuit)[cite: 1, 55, 56].

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q1.1 [Kirchhoff's Laws & Circuit Elements | Repeated 6x]:**
  * State and explain Kirchhoff's Current Law (KCL) and Kirchhoff's Voltage Law (KVL) with suitable circuit diagrams[cite: 51, 52, 56, 58]. Define electrical resistance and explain the effect of temperature on the resistance of conductors, semiconductors, and insulators[cite: 56]. *(5 to 10 Marks)*
  * Define and explain: (i) Unilateral elements, (ii) Bilateral elements, (iii) Active elements, (iv) Passive elements, (v) Linear and non-linear elements[cite: 60]. *(5 Marks)*
  * Define and explain dependent and independent voltage and current sources with neat circuit symbols[cite: 56, 58]. *(5 Marks)*
  * Define voltage, current, and stored energy relations in an inductor ($E = \frac{1}{2}Li^2$) and a capacitor ($E = \frac{1}{2}Cv^2$)[cite: 54]. *(5 Marks)*
* **Q1.2 [Thevenin's & Norton's Theorems | Repeated 7x]:**
  * State and explain Thevenin's theorem with a suitable circuit example[cite: 53, 55, 59, 60]. Explain step-by-step how to calculate Thevenin's equivalent voltage ($V_{\text{th}}$) and Thevenin's equivalent resistance ($R_{\text{th}}$)[cite: 54, 55, 58, 60]. *(5 to 10 Marks)*
  * State and explain Norton's theorem with a suitable circuit example[cite: 51, 52, 53]. Show the dual relationship between Thevenin's and Norton's equivalent models[cite: 53]. *(5 to 10 Marks)*
* **Q1.3 [Superposition Theorem | Repeated 5x]:** State and explain the Superposition theorem with its limitations (applicability to linear bilateral networks and inapplicability to non-linear power calculations)[cite: 56, 58, 59]. *(5 to 10 Marks)*
* **Q1.4 [Maximum Power Transfer Theorem | Repeated 4x]:** State and prove the Maximum Power Transfer theorem for a variable resistive load connected to a DC network ($R_L = R_{\text{th}}$)[cite: 53, 58, 60]. Derive the expression for maximum power transferred ($P_{\max} = \frac{V_{\text{th}}^2}{4R_{\text{th}}}$) and calculate its operational efficiency ($\eta = 50\%$)[cite: 58, 60]. *(10 Marks)*
* **Q1.5 [Star-Delta Transformations | Repeated 3x]:** How is a star-connected resistive network converted into an equivalent delta-connected network and vice versa[cite: 53]? Derive the conversion formulas: $R_{AB} = R_A + R_B + \frac{R_A R_B}{R_C}$ and $R_A = \frac{R_{AB} R_{CA}}{R_{AB} + R_{BC} + R_{CA}}$[cite: 53, 55]. *(5 to 10 Marks)*
* **Q1.6 [First-Order Circuits & Time Constants | Repeated 3x]:** What is a first-order circuit[cite: 55]? How do an inductor and a capacitor behave in DC steady-state conditions[cite: 55]? Derive the mathematical expressions for transient response and time constants of first-order series $R\text{-}L$ and $R\text{-}C$ circuits under DC excitation[cite: 56]. *(10 Marks)*

### B. Analytical & Numerical Problems
* **Q1.7 [Superposition Theorem Calculations | 10 Marks | Repeated 4x]:**
  * In the circuit shown, use the Superposition theorem to determine the branch current flowing through the $40\ \Omega$ resistor connected between terminals A and B: Two independent DC voltage sources of $10\text{ V}$ (series with $10\ \Omega$) and $20\text{ V}$ (series with $20\ \Omega$) act across a central parallel $40\ \Omega$ resistor[cite: 55].
  * State the Superposition theorem[cite: 56]. Using it, determine the voltage across and current through the $3.3\text{ k}\Omega$ resistor connected between two active branches: Branch 1 with an $8\text{ V}$ source and $2.0\text{ k}\Omega$ resistor, and Branch 2 with a $5\text{ V}$ source and $4.7\text{ k}\Omega$ resistor[cite: 56, 57].
* **Q1.8 [Thevenin's Theorem Calculations | 10 Marks | Repeated 4x]:**
  * In the bridge/ladder circuit shown, obtain the Thevenin equivalent circuit across load terminals A-B ($R_L = 2\text{ k}\Omega$)[cite: 60]. Source $V_{S1} = 40\text{ V DC}$ with $R_1 = 4\text{ k}\Omega, R_3 = 20\text{ k}\Omega$, and source $V_{S2} = 15\text{ V DC}$ with $R_2 = 5\text{ k}\Omega, R_4 = 80\text{ k}\Omega$[cite: 60]. Find load current $I_L$[cite: 60].
  * Find the current $i$ flowing through the $10\ \Omega$ branch using Thevenin's theorem for the network containing a $50\text{ V}$ independent voltage source, a $0.5\text{ A}$ independent current source, and resistors of $30\ \Omega$, $20\ \Omega$, $20\ \Omega$, and $10\ \Omega$[cite: 58].
  * Using Thevenin's theorem, determine: (i) Current through the $5\ \Omega$ load resistor, and (ii) The condition and value for maximum power transfer to the load resistor[cite: 54].
* **Q1.9 [Maximum Power Transfer Calculation | 10 Marks | Repeated 3x]:** In the DC circuit shown ($6\text{ V}$ source in series with $6\ \Omega$, parallel branches of $8\ \Omega$, $5\ \Omega$, and $12\ \Omega$), calculate the value of load resistance $R_L$ connected across designated terminals for maximum power transfer, and calculate the maximum power transferred $P_{\max}$[cite: 60].
* **Q1.10 [KVL / KCL & Series-Parallel Networks | 5 to 10 Marks | Repeated 4x]:**
  * Determine the current flowing in branch A-B using KVL for a dual-loop circuit containing a $15\text{ V}$ source in series with $10\ \Omega$ and $15\ \Omega$, and a $20\text{ V}$ source in series with $20\ \Omega$ and $30\ \Omega$[cite: 59].
  * Two equal resistances consume $60\text{ W}$ when connected in series across a constant battery source[cite: 54]. If these same resistances are now reconnected in parallel across the same battery, determine the total electric power consumed[cite: 54].
  * Two resistors of $20\ \Omega$ and $30\ \Omega$ are connected in parallel, and this parallel combination is connected in series with a $15\ \Omega$ resistor[cite: 59]. If the current flowing through the $15\ \Omega$ resistor is $3\text{ A}$, calculate the current in the $20\ \Omega$ and $30\ \Omega$ resistors and the total voltage applied across the entire circuit[cite: 59].
* **Q1.11 [Star-Delta Numerical Conversion | 10 Marks | Repeated 2x]:** Three equal resistors $R_1 = R_2 = R_3 = 10\ \Omega$ are connected in a star configuration[cite: 55]. Compute the equivalent resistance of each branch when transformed into a delta configuration[cite: 55].

## 3. Dedicated 3D Virtual Lab Model: Unit I

### LAB 1.1: DC Network Theorems & Transient Response Workbench
* **Physical 3D Assets:**
  * Modular breadboard workstation equipped with dual-channel DC power supplies ($0\text{--}30\text{ V}$), variable DC current sources ($0\text{--}2\text{ A}$), precision decade resistance boxes, inductive coils, electrolytic capacitor banks, digital multimeters, and a dual-trace storage oscilloscope[cite: 54, 56, 58].
* **Interactive Controls:**
  * Source voltage ($V_s$) and source current ($I_s$) control dials[cite: 56, 58].
  * Network Theorem Mode Toggle: Verification of Superposition vs. Thevenin's vs. Norton's vs. Maximum Power Transfer[cite: 51, 54, 56, 58].
  * Load resistance slider $R_L$ ($0.1\ \Omega$ to $10\text{ k}\Omega$)[cite: 54, 60].
  * Transient Step Excitation Switch: Connects an $R\text{-}L$ or $R\text{-}C$ branch to observe charging and discharging profiles[cite: 56].
* **Real-Time Visual Mechanics:**
  * **Superposition Mode:** Shows current vectors through branch meshes; users turn off source 1 (replacing with a short circuit) to measure $I'$, turn off source 2 to measure $I''$, and observe real-time summation vector $I = I' + I''$ on digital meters[cite: 55, 56].
  * **Thevenin/Maximum Power Mode:** Dynamically decouples load $R_L$ to display open-circuit voltage $V_{\text{th}}$, shorts voltage sources to evaluate $R_{\text{th}}$, and plots an interactive curve of power delivered ($P_L$) vs. load resistance ($R_L$), showing a peak at $R_L = R_{\text{th}}$ with $50\%$ efficiency[cite: 54, 58, 60].
  * **Transient Scope Mode:** Oscilloscope renders exponential charging curves: $v_C(t) = V_s(1 - e^{-t/RC})$ and $i_L(t) = \frac{V_s}{R}(1 - e^{-tR/L})$, showing asymptotic steady-state behavior where $C$ acts as an open circuit and $L$ acts as a short circuit[cite: 55, 56].

---
---

# UNIT II: AC CIRCUITS

## 1. Syllabus Topics
* **Sinusoidal Waveforms:** Representation of sinusoidal alternating waveforms, cycle, time period, frequency, instantaneous value, peak value, peak-to-peak value, average value, Root Mean Square (RMS) value, form factor, and peak factor (definitions and mathematical derivations)[cite: 1, 51, 53, 54, 56, 59, 60].
* **Phasor Representation:** Phasor algebra, polar and rectangular forms, complex impedance ($Z = R + jX$), admittance, phase difference, leading and lagging power factor, real/active power ($P = VI\cos\phi$), reactive power ($Q = VI\sin\phi$), and apparent power ($S = VI$)[cite: 1, 51, 55, 56, 58].
* **Single-Phase AC Circuits:** Analysis of series and parallel combinations: $R\text{-}L$, $R\text{-}C$, and $R\text{-}L\text{-}C$ circuits, phasor diagrams, power triangle, causes and effects of low power factor, and power factor improvement methods[cite: 1, 51, 53, 54, 58, 59, 60].
* **Resonance:** Series resonance in $R\text{-}L\text{-}C$ circuits, derivation of resonant frequency ($f_0 = \frac{1}{2\pi\sqrt{LC}}$), impedance curve, current curve, half-power bandwidth ($\Delta f$), Quality factor ($Q$-factor), voltage magnification, and comparison with parallel resonance circuits[cite: 1, 51, 54, 55, 56, 58, 59].
* **Three-Phase Balanced Circuits:** Generation of three-phase EMFs, phase sequence, balanced Star ($Y$) and Delta ($\Delta$) connected systems, derivation of mathematical and phasor relationships between line and phase voltages and currents ($V_L = \sqrt{3}V_{\text{ph}}$ in star, $I_L = \sqrt{3}I_{\text{ph}}$ in delta)[cite: 1, 51, 53, 56, 58, 59, 60].
* **Three-Phase Power Measurement:** Three-phase active and reactive power expressions, measurement of three-phase power using the Two-Wattmeter method, mathematical derivation of total power ($P = W_1 + W_2$) and load power factor angle ($\tan\phi = \sqrt{3}\frac{W_1 - W_2}{W_1 + W_2}$)[cite: 1, 53, 55, 58, 60].

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q2.1 [Sinusoidal Parameters & RMS Derivations | Repeated 6x]:**
  * Define the terms: (i) Instantaneous value, (ii) Peak value, (iii) Average value, (iv) RMS value, (v) Form factor, and (vi) Peak factor of an alternating sinusoidal waveform[cite: 51, 52, 53, 56, 60]. Derive the mathematical expressions for the RMS value ($I_{\text{rms}} = I_{\max}/\sqrt{2}$) and average value ($I_{\text{avg}} = 2I_{\max}/\pi$) of a sinusoidal wave[cite: 53, 59]. *(10 Marks)*
* **Q2.2 [Power in AC Circuits & Power Factor | Repeated 6x]:**
  * Define and explain: True/Active power ($P$), Reactive power ($Q$), Apparent power ($S$), and Power Factor ($\cos\phi$)[cite: 55, 56]. Draw the power triangle[cite: 1].
  * What are the primary causes and economic disadvantages of a low power factor in commercial and industrial systems[cite: 51, 52]? How is power factor improved using shunt capacitor banks[cite: 1, 58]? *(5 to 10 Marks)*
* **Q2.3 [Series RLC Resonance & Curves | Repeated 8x]:**
  * What is electrical resonance[cite: 55, 56]? Derive the condition and expression for the resonant frequency of a series $R\text{-}L\text{-}C$ circuit ($f_0 = \frac{1}{2\pi\sqrt{LC}}$)[cite: 55, 56, 58].
  * Discuss series resonance in an $R\text{-}L\text{-}C$ circuit and sketch the variations of inductive reactance ($X_L$), capacitive reactance ($X_C$), resistance ($R$), total impedance ($Z$), and circuit current ($I$) as a function of frequency[cite: 51, 52, 54].
  * Define half-power bandwidth ($\Delta f$) and Quality factor ($Q$)[cite: 56]. Explain voltage magnification across $L$ and $C$ at resonance[cite: 56]. *(10 Marks)*
* **Q2.4 [Three-Phase Star and Delta Relations | Repeated 7x]:**
  * For a balanced three-phase star-connected and delta-connected system, derive the relationship between line voltage and phase voltage, and line current and phase current, by constructing clear phasor diagrams[cite: 51, 52, 56, 58, 59, 60]. *(10 Marks)*
* **Q2.5 [Two-Wattmeter Method for 3-Phase Power | Repeated 6x]:**
  * Explain the Two-Wattmeter method for measuring total active power in a balanced 3-phase star-connected and delta-connected load[cite: 53, 58, 60].
  * Draw the circuit diagram and complete phasor diagram for an inductive load ($R\text{-}L$)[cite: 60]. Derive the expression: $\tan\phi = \sqrt{3}\left(\frac{W_1 - W_2}{W_1 + W_2}\right)$ and discuss wattmeter readings when: (i) $\text{p.f.} = 1$, (ii) $\text{p.f.} = 0.5$, (iii) $\text{p.f.} = 0$[cite: 53, 55, 60]. *(10 Marks)*

### B. Analytical & Numerical Problems
* **Q2.6 [Series RLC Resonance Calculations | 10 Marks | Repeated 4x]:**
  * A series resonance network consists of a resistor $R = 30\ \Omega$, capacitor $C = 2\ \mu\text{F}$, and inductor $L = 20\text{ mH}$ connected across a sinusoidal voltage supply having a constant output of $9\text{ V}$ at all frequencies[cite: 56, 57]. Calculate: (i) Resonant frequency ($f_0$), (ii) Current at resonance, (iii) Voltages across inductor and capacitor at resonance ($V_L, V_C$), (iv) Quality factor ($Q$), and (v) Bandwidth of the circuit[cite: 56, 57].
* **Q2.7 [Single-Phase Series & Parallel AC Circuits | 10 Marks | Repeated 6x]:**
  * A circuit containing a resistance $R = 5\text{ k}\Omega$ and inductance $L = 1.0\text{ H}$ in series is supplied by $150\text{ V}$ at $400\text{ Hz}$[cite: 55]. Determine: (i) Voltages across resistance and inductance, (ii) Magnitude and phase angle of current, (iii) Active power taken from the supply[cite: 55].
  * A voltage source $v_i = 10\cos(\omega t)\text{ V}$ operates at $f = 1\text{ kHz}$ across a series branch of $R = 100\ \Omega$ and $C = 0.47\ \mu\text{F}$[cite: 54]. Find the magnitude and phase shift in polar form of the current through and voltages across resistor $R$ and capacitor $C$[cite: 54].
  * A coil having resistance $R = 50\ \Omega$ and inductance $L = 318\text{ mH}$ is connected in parallel with a branch consisting of a $75\ \Omega$ resistor in series with a $159\ \mu\text{F}$ capacitor across a $230\text{ V}, 50\text{ Hz}$ supply[cite: 51, 52]. Determine total supply current and overall circuit power factor[cite: 51, 52].
  * An inductive coil draws $2\text{ A}$ when connected across a $230\text{ V}, 50\text{ Hz}$ supply, consuming $100\text{ W}$[cite: 53]. Calculate resistance, inductance, and power factor of the coil[cite: 53].
  * A resistance of $100\ \Omega$ is connected in series with a $56\ \mu\text{F}$ capacitor across a $230\text{ V}, 50\text{ Hz}$ line[cite: 53]. Calculate: (i) Impedance, (ii) Current, (iii) Power factor, (iv) Voltage across resistor and capacitor[cite: 53].
  * An AC voltage $e(t) = 141.4\sin(120t)\text{ V}$ applied to a series circuit produces current $i(t) = 14.14\sin(120t + 30^\circ)\text{ A}$[cite: 59]. Determine resistance, capacitance/inductance, and power factor[cite: 59].
  * A circuit of $R = 50\ \Omega$ and $X_L = 25.12\ \Omega$ in series with an unknown capacitor draws $3.8\text{ A}$ from a $200\text{ V}, 50\text{ Hz}$ supply[cite: 59]. Calculate capacitance value, power factor, and voltage drop across each element[cite: 59].
  * In the network shown ($1.6\ \Omega$ and $7.2\ \Omega$ inductor in series with parallel branches of $4\ \Omega + 3\ \Omega$ inductor and $6\ \Omega + 8\ \Omega$ capacitor across $100\text{ V}, 50\text{ Hz}$), find total impedance, supply current, and power factor[cite: 53].
* **Q2.8 [Three-Phase Balanced Star/Delta Loads | 10 Marks | Repeated 5x]:**
  * Three identical coils, each having resistance $20\ \Omega$ and inductive reactance $15\ \Omega$, are connected in star across a $400\text{ V}$, 3-phase, $50\text{ Hz}$ AC supply[cite: 51, 52]. Calculate: (i) Line current, (ii) Power factor, (iii) Total active power supplied[cite: 51, 52].
  * Three identical coils of resistance $8\ \Omega$ and inductive reactance $6\ \Omega$ are star-connected across a $400\text{ V}, 50\text{ Hz}$ supply[cite: 60]. Determine line current, power factor, total active power, and total reactive power[cite: 60].
  * Three identical coils connected in star draw a total power of $1.5\text{ kW}$ at a power factor of $0.2$ lagging from a $400\text{ V}, 50\text{ Hz}$ supply[cite: 53]. Calculate resistance $R$ and inductance $L$ of each coil[cite: 53].
* **Q2.9 [Two-Wattmeter Calculations | 10 Marks | Repeated 4x]:**
  * In a two-wattmeter measurement of a balanced 3-phase load, one wattmeter reads $20\text{ kW}$ and the other reads $5\text{ kW}$[cite: 55]. Calculate the total active power and the operating power factor of the load when both readings are positive[cite: 55].
  * Two wattmeters connected to measure power in a balanced star-connected load across a $400\text{ V}, 50\text{ Hz}$ supply indicate $8000\text{ W}$ and $4000\text{ W}$[cite: 60]. Find the line current and power factor of the load[cite: 60].

## 3. Dedicated 3D Virtual Lab Model: Unit II

### LAB 2.1: AC Resonance & Frequency Response Analyzer
* **Physical 3D Assets:**
  * Variable-frequency sine wave signal generator ($10\text{ Hz}$ to $100\text{ kHz}$), breadboard module with precision inductors, metal-film resistors, non-polarized capacitors, digital phase-angle meter, and dual-channel storage oscilloscope[cite: 54, 56].
* **Interactive Controls:**
  * Supply frequency sweep slider ($f = 10\text{ Hz}$ to $50\text{ kHz}$)[cite: 54, 56].
  * Resistance ($R$), Inductance ($L$), and Capacitance ($C$) parameter tuning knobs[cite: 56, 57].
  * Mode Switch: Series $R\text{-}L\text{-}C$ vs. Parallel $R\text{-}L\text{-}C$[cite: 54].
* **Real-Time Visual Mechanics:**
  * Oscilloscope screen shows input voltage $v(t)$ and branch current $i(t)$ waveforms in real time: As frequency sweeps below resonance, current leads voltage (capacitive regime); as frequency increases, current aligns with voltage at $\phi = 0^\circ$ (resonance); above resonance, current lags voltage (inductive regime)[cite: 51, 55, 56, 59].
  * Dynamic Spectrum Plotter: Traces impedance $Z(f)$ and current $I(f)$ curves, highlighting maximum resonant current $I_0 = V/R$, lower half-power cutoff $f_1$, upper cutoff $f_2$, and calculating Quality Factor ($Q = \frac{\omega_0 L}{R}$)[cite: 56, 57].

### LAB 2.2: Balanced 3-Phase Star/Delta & Two-Wattmeter Measurement Bench
* **Physical 3D Assets:**
  * Three-phase AC supply terminal block ($R, Y, B, N$) with line-to-line voltmeter ($400\text{ V}$) and line-to-neutral voltmeter ($230\text{ V}$)[cite: 51, 53, 60].
  * 3D load bank of 3 balanced impedance branches (configurable in Star or Delta via busbars)[cite: 51, 56, 58].
  * Two precision electrodynamic wattmeter assemblies ($W_1$ and $W_2$) with current coils (CC) in lines $R$ and $B$, and pressure coils (PC) referenced to line $Y$[cite: 58, 60].
* **Interactive Controls:**
  * Connection Selector: Star ($Y$) configuration vs. Delta ($\Delta$) configuration[cite: 56, 58].
  * Load impedance parameters: Resistance $R$ and inductive reactance $X_L$ knobs[cite: 51, 60].
  * Power Factor control slider: Allows adjusting $\cos\phi$ from $1.0$ down to $0.0$ lagging[cite: 53, 55, 60].
* **Real-Time Visual Mechanics:**
  * Displays a 3D rotating phasor diagram showing line voltage vectors ($\vec{V}_{RY}, \vec{V}_{YB}, \vec{V}_{BR}$) and phase voltage vectors ($\vec{V}_{RN}, \vec{V}_{YN}, \vec{V}_{BN}$)[cite: 53, 56, 58, 60].
  * Wattmeter needles deflect dynamically: At $\cos\phi = 1.0$, $W_1 = W_2$; at $\cos\phi = 0.5$, one wattmeter reads zero ($W_2 = 0$); below $0.5$, $W_2$ reverses deflection, demonstrating the need for potential coil reversal[cite: 53, 55, 60].
  * Output display calculates: $P_{\text{total}} = W_1 + W_2$ and $\cos\phi = \cos\left[\tan^{-1}\left(\sqrt{3}\frac{W_1 - W_2}{W_1 + W_2}\right)\right]$[cite: 55, 60].

---
---

# UNIT III: MAGNETIC CIRCUITS & TRANSFORMERS

## 1. Syllabus Topics
* **Magnetic Circuits:** Magnetic circuit fundamentals: Magnetomotive force (MMF), magnetic flux ($\Phi$), reluctance ($S$), permeance, magnetic field intensity ($H$), flux density ($B$), absolute and relative permeability ($\mu_0, \mu_r$), Faraday's laws of electromagnetic induction, Lenz's law, similarities and dissimilarities between electric and magnetic circuits, composite magnetic circuits with air gaps, leakage flux, and fringing effect[cite: 1, 51, 53, 54, 55, 56, 60].
* **Single-Phase Transformer Fundamentals:** Core-type and shell-type construction, operating principle, EMF equation derivation ($E = 4.44 f N \Phi_m$), transformation ratio ($K$), ideal transformer vs. practical transformer, and characteristics of an ideal transformer[cite: 1, 51, 53, 54, 55, 56, 58, 59, 60].
* **Transformer on Load & Phasor Diagrams:** Magnetizing and core loss current components, operation on no-load and on-load with resistive, inductive (lagging p.f.), and capacitive (leading p.f.) loads, and construction of complete phasor diagrams[cite: 1, 53, 55, 60].
* **Equivalent Circuit & Testing:** Exact and approximate equivalent circuits referred to primary and secondary windings, Open Circuit (OC) test and Short Circuit (SC) test for parameter determination ($R_c, X_m, R_{eq}, X_{eq}$)[cite: 1, 53, 54, 55, 58, 59, 60].
* **Losses, Regulation & Efficiency:** Core/iron losses (hysteresis and eddy current losses) and copper losses ($I^2R$), condition for maximum efficiency ($P_{\text{copper}} = P_{\text{iron}}$), voltage regulation calculation, and comparison between two-winding transformers and autotransformers[cite: 1, 51, 53, 56, 58, 60].
* **Electrical Measuring Instruments:** Classification of analog measuring instruments, operating torques in indicating instruments (deflecting, controlling, damping torques), Permanent Magnet Moving Coil (PMMC) instruments, and Moving Iron (MI: attraction and repulsion types) instruments (construction, working, torque equations, scale characteristics, merits, and demerits)[cite: 1, 53, 54, 56, 60].

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q3.1 [Electric vs. Magnetic Circuits & Reluctance | Repeated 6x]:**
  * State and explain the similarities and dissimilarities between an electric circuit and a magnetic circuit in a structured comparative table[cite: 51, 52, 53, 60].
  * State Faraday's laws of electromagnetic induction and Lenz's law[cite: 54, 56]. Define MMF, reluctance, permeance, and flux density[cite: 53, 55, 60].
  * Draw the electrical dual equivalent circuit for a composite parallel-limb magnetic circuit showing MMF source and branch reluctances ($S, S_1, S_2$)[cite: 55]. *(5 to 10 Marks)*
* **Q3.2 [Transformer Principle & EMF Equation | Repeated 6x]:**
  * Describe the working principle and construction (core-type and shell-type) of a single-phase transformer[cite: 58, 59, 60]. Derive the EMF equation: $E_1 = 4.44 f N_1 \Phi_m$[cite: 59]. *(10 Marks)*
* **Q3.3 [Ideal vs. Practical Transformer & Phasor Diagrams | Repeated 7x]:**
  * Differentiate between an ideal transformer and a practical transformer[cite: 51, 52]. Enumerate all characteristics and boundary conditions of an ideal transformer[cite: 54, 55, 56, 58]. *(5 Marks)*
  * Draw the complete phasor diagram of a practical single-phase transformer on load operating at: (i) Unity power factor, (ii) Lagging power factor ($R\text{-}L$ inductive load)[cite: 53, 55, 60]. Provide expressions for induced EMF and terminal voltages[cite: 55]. *(10 Marks)*
* **Q3.4 [Transformer Losses & Maximum Efficiency Condition | Repeated 6x]:**
  * What are the various losses occurring in a practical transformer[cite: 56, 60]? Explain how hysteresis and eddy current losses are minimized through material selection and core lamination[cite: 1].
  * Derive the condition for a transformer to achieve maximum operating efficiency ($P_{\text{copper}} = P_{\text{iron}}$) and deduce the expression for load current at maximum efficiency[cite: 56, 60]. *(10 Marks)*
* **Q3.5 [Autotransformer vs. Two-Winding Transformer | Repeated 2x]:** Compare a conventional two-winding transformer with an autotransformer, highlighting copper savings, efficiency, electrical isolation, and applications[cite: 58]. *(5 Marks)*
* **Q3.6 [Measuring Instruments: PMMC vs. MI Meters | Repeated 5x]:**
  * Give the general classification of electrical measuring instruments[cite: 56]. Explain the three types of operating torques (deflecting torque, controlling torque, and damping torque) required for the operation of indicating instruments[cite: 56]. *(10 Marks)*
  * With the help of a neat diagram, explain the construction, working principle, and torque equation of a Permanent Magnet Moving Coil (PMMC) instrument[cite: 53, 54, 60]. Why can PMMC instruments operate only on DC supplies[cite: 53]? State its advantages, disadvantages, and reasons for its uniform linear scale[cite: 53, 60]. *(10 Marks)*

### B. Analytical & Numerical Problems
* **Q3.7 [OC and SC Test Equivalent Circuit Parameters | 10 Marks | Repeated 5x]:**
  * An open circuit (OC) test on the LV side of an $8\text{ kVA}, 400/100\text{ V}, 50\text{ Hz}$ transformer yields: $100\text{ V}, 4\text{ A}, 60\text{ W}$[cite: 53]. A short circuit (SC) test on the HV side yields: $10\text{ V}, 20\text{ A}, 100\text{ W}$[cite: 53]. Calculate: (i) Equivalent circuit parameters referred to primary and secondary, (ii) Efficiency at full load and half load at $0.8$ lagging power factor, (iii) The load kVA at which maximum efficiency occurs and value of maximum efficiency at $0.8$ p.f. lagging[cite: 53].
  * A $200\text{ kVA}, 50\text{ Hz}, 2000/200\text{ V}$ distribution transformer yields test data: OC test (HV open): $200\text{ V}, 4\text{ A}, 120\text{ W}$; SC test (LV shorted): $60\text{ V}, 10\text{ A}, 300\text{ W}$[cite: 54]. Draw the approximate equivalent circuit referred to HV and LV sides[cite: 54].
  * A $30\text{ kVA}, 200/2000\text{ V}, 50\text{ Hz}, 1\text{-phase}$ transformer gives test results: OC test (LV side): $200\text{ V}, 6.2\text{ A}, 360\text{ W}$; SC test (HV side): $75\text{ V}, 15\text{ A}, 600\text{ W}$[cite: 58]. Obtain the approximate equivalent circuit parameters referred to LV side[cite: 58].
  * A $5\text{ kVA}, 500/250\text{ V}, 50\text{ Hz}$ single-phase transformer gives test results: OC test (LV side): $250\text{ V}, 1\text{ A}, 50\text{ W}$; SC test (HV side): $25\text{ V}, 10\text{ A}, 60\text{ W}$[cite: 59]. Calculate equivalent circuit parameters and efficiency at full load $0.8$ p.f. lagging[cite: 59].
* **Q3.8 [Transformer Regulation & Efficiency Calculations | 10 Marks | Repeated 4x]:**
  * The efficiency of a $400\text{ kVA}$, single-phase transformer is $98.77\%$ when delivering full load at $0.8$ p.f. lagging and $99.13\%$ at half full load at unity power factor[cite: 51, 52]. Calculate: (i) Core/iron loss ($P_i$), and (ii) Full-load copper loss ($P_{cu}$)[cite: 51, 52].
  * A $150\text{ kVA}, 2400/240\text{ V}$ transformer has parameters: $R_1 = 0.2\ \Omega, R_2 = 0.002\ \Omega, X_1 = 0.45\ \Omega, X_2 = 0.0045\ \Omega, R_c = 10\text{ k}\Omega, X_m = 1.55\text{ k}\Omega$[cite: 56, 57]. Operating at rated load with $0.8$ lagging p.f., determine: (i) Percentage voltage regulation, (ii) Total power losses, (iii) Efficiency[cite: 56, 57].
  * A $100\text{ kVA}$ transformer has full-load copper loss of $1200\text{ W}$ and iron loss of $960\text{ W}$[cite: 60]. Calculate efficiency at: (i) Full load at unity p.f., (ii) Half load at $0.8$ p.f. lagging[cite: 60].
* **Q3.9 [Composite Magnetic Circuit Calculations | 10 Marks | Repeated 3x]:**
  * A magnetic circuit with an air gap has dimensions: Core cross-sectional area $A_c = 1.8 \times 10^{-3}\text{ m}^2$, mean core length $l_c = 0.6\text{ m}$, air gap length $g = 2.3 \times 10^{-3}\text{ m}$, coil turns $N = 83$[cite: 54]. Assuming infinite core permeability and neglecting fringing and leakage, calculate for a coil current of $1.5\text{ A}$: (i) Reluctance of core, (ii) Reluctance of air gap, (iii) Total magnetic flux, (iv) Coil flux linkages, (v) Self-inductance of the coil[cite: 54].
  * An iron ring of mean circumference $80\text{ cm}$ and uniform cross-sectional area $12\text{ cm}^2$ is wound with a magnetizing coil of 200 turns[cite: 53]. A current of $2\text{ A}$ produces a total magnetic flux of $1.2\text{ mWb}$[cite: 53]. Calculate: (i) Magnetic flux density ($B$), (ii) Reluctance of the circuit, (iii) Absolute and relative permeability of iron[cite: 53].

## 3. Dedicated 3D Virtual Lab Model: Unit III

### LAB 3.1: Virtual Single-Phase Transformer OC/SC Testing & Loading Bench
* **Physical 3D Assets:**
  * Laminated silicon steel core transformer assembly showing primary and secondary copper coil windings wound over core limbs[cite: 58].
  * Open Circuit (OC) Test Panel: Variac autotransformer, low-power-factor wattmeter, analog voltmeter, and ammeter connected to the LV side[cite: 53, 54, 58].
  * Short Circuit (SC) Test Panel: Variable step-down AC source, high-current ammeter, and wattmeter connected to the HV side with LV terminals shorted by a thick copper busbar[cite: 53, 54, 58].
  * Loading Bank: Adjustable resistive, inductive ($R\text{-}L$), and capacitive ($R\text{-}C$) load banks[cite: 53, 56].
* **Interactive Controls:**
  * Test Selector Toggle: OC Test vs. SC Test vs. On-Load Operation[cite: 53, 54, 58].
  * Primary voltage variac control slider ($0$ to $240\text{ V}$)[cite: 56].
  * Load current slider ($0$ to rated kVA) and Load Power Factor slider ($-0.5$ leading to $+0.5$ lagging)[cite: 53, 56].
* **Real-Time Visual Mechanics:**
  * **OC Test Mode:** Rated voltage applied to LV winding; core shows animated alternating magnetic flux loops; extracts shunt parameters live:
    $$R_c = \frac{V_1^2}{P_0}, \quad I_c = I_0 \cos\phi_0, \quad I_m = I_0 \sin\phi_0, \quad X_m = \frac{V_1}{I_m}$$[cite: 53, 54, 58]
  * **SC Test Mode:** Reduced voltage circulates full-load current; extracts series winding parameters live:
    $$R_{eq} = \frac{P_{sc}}{I_{sc}^2}, \quad Z_{eq} = \frac{V_{sc}}{I_{sc}}, \quad X_{eq} = \sqrt{Z_{eq}^2 - R_{eq}^2}$$[cite: 53, 54, 58]
  * **On-Load Phasor Workspace:** Live polar display draws primary and secondary voltage/current phasors, showing voltage drop vectors ($I_2 R_{eq}$ and $I_2 X_{eq}$) to illustrate voltage regulation differences under lagging, leading, and unity power factors[cite: 53, 55, 56].

### LAB 3.2: PMMC vs. Moving Iron Meter Electromechanical Rig
* **Physical 3D Assets:**
  * Cutaway transparent casings of:
    1. **PMMC Meter:** Permanent horseshoe magnet, soft iron cylindrical core, aluminum former with moving coil, phosphor bronze hairsprings, and knife-edge pointer[cite: 53, 60].
    2. **Moving Iron (MI) Repulsion Meter:** Stationary cylindrical field coil enclosing one fixed and one moving soft-iron vane attached to a spindle[cite: 1].
* **Interactive Controls:**
  * Electrical supply toggle: DC mode vs. AC sinusoidal mode ($50\text{ Hz}$)[cite: 53].
  * Input current amplitude slider ($0\text{ mA}$ to $500\text{ mA}$).
  * Damping mechanism toggle: Air friction damping chamber vs. Eddy current aluminum disc damping[cite: 56].
* **Real-Time Visual Mechanics:**
  * **DC Injection:** PMMC coil experiences Lorentz force ($\tau_d = BINA$), deflecting against spring torque ($\tau_c = C\theta$) to produce a linear, uniform scale deflection ($\theta \propto I$)[cite: 53, 60].
  * **AC Injection on PMMC:** Pointer vibrates around zero mark due to alternating torque, demonstrating why PMMC cannot read AC[cite: 53].
  * **AC Injection on MI Meter:** Both iron vanes magnetize with identical polarity each half-cycle, repelling each other with unidirectional torque ($\tau_d \propto I^2$), demonstrating true RMS response and a non-linear cramped scale at lower values[cite: 1, 53].

---
---

# UNIT IV: ELECTRICAL MACHINES

## 1. Syllabus Topics
* **DC Machines:** Constructional components (yoke, pole cores, pole shoes, field windings, armature core, armature windings: lap vs. wave, commutator, brushes), working principle of DC generator, derivation of generated EMF equation ($E_g = \frac{P \Phi Z N}{60 A}$), methods of excitation (separately excited vs. self-excited: shunt, series, compound)[cite: 1, 51, 53, 55, 56, 58, 60].
* **DC Motors:** Working principle of DC motor, concept and importance of back EMF ($E_b = V - I_a R_a$), torque equation derivation ($T_a = \frac{1}{2\pi} \frac{P \Phi Z I_a}{A}$), torque-speed and torque-current characteristics of shunt and series DC motors, necessity of starters (3-point starter operation), and methods of speed control (armature voltage control and field flux control)[cite: 1, 51, 52, 53, 58, 59, 60].
* **Three-Phase Induction Motors:** Generation of rotating magnetic field (RMF) by balanced 3-phase stator currents, mathematical proof of constant magnitude ($1.5 \Phi_m$) rotating at synchronous speed ($N_s = \frac{120f}{P}$), construction (stator, squirrel-cage rotor vs. wound/slip-ring rotor), slip ($s = \frac{N_s - N}{N_s}$), slip speed, frequency of rotor currents ($f_r = s f$)[cite: 1, 51, 53, 54, 56, 58, 59, 60].
* **Induction Motor Characteristics & Starters:** Operating principle of 3-phase induction motor, torque-slip and torque-speed characteristics across motoring, generating, and braking regions, condition for maximum torque, necessity of starters: Direct-On-Line (DOL) and Star-Delta ($Y\text{-}\Delta$) starters[cite: 1, 51, 52, 53, 54, 58, 59, 60].
* **Single-Phase Induction Motors:** Double-revolving field theory, explanation of why single-phase induction motors are not self-starting, and starting methods (split-phase, capacitor-start, capacitor run, shaded-pole)[cite: 1, 55, 59, 60].
* **Synchronous Machines:** Construction and principle of operation of synchronous generators (alternators: cylindrical rotor vs. salient-pole rotor), synchronous speed relation ($N_s = \frac{120f}{P}$), principle of synchronous motors, and reasons why synchronous motors are not self-starting[cite: 1, 51, 53, 54, 55, 58, 60].

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q4.1 [DC Machine Construction, EMF & Back EMF | Repeated 7x]:**
  * Describe the construction and operating principle of a DC generator[cite: 53, 55, 60]. Derive the expression for the generated EMF equation: $E_g = \frac{P \Phi Z N}{60 A}$[cite: 53, 55].
  * Explain the working principle of a DC motor[cite: 60]. What is the physical importance of Back EMF ($E_b$) in self-regulating mechanical power delivery[cite: 53, 59]? *(10 Marks)*
* **Q4.2 [DC Motor Characteristics & Speed Control | Repeated 6x]:**
  * Draw and explain the torque-speed and torque-current characteristics of a separately excited and shunt DC motor[cite: 51, 52, 60].
  * Explain methods of speed control for a separately excited DC motor: (i) Armature resistance/voltage control, (ii) Field flux weakening control[cite: 58, 60].
  * Why are starters necessary for starting DC motors[cite: 53]? Explain the construction and working of a Three-Point Starter with No-Volt Coil (NVC) and Overload Release (OLR)[cite: 53]. *(10 Marks)*
* **Q4.3 [Rotating Magnetic Field (RMF) Derivation | Repeated 6x]:**
  * What is a rotating magnetic field (RMF)[cite: 56]? Derive mathematically that a balanced three-phase winding excited by balanced three-phase AC currents produces a magnetic field of constant amplitude ($1.5 \Phi_m$) rotating at synchronous speed ($N_s$)[cite: 54, 56, 58]. How can the direction of the rotating magnetic field be reversed[cite: 56]? *(10 Marks)*
* **Q4.4 [Three-Phase Induction Motor Operation & Rotor Types | Repeated 8x]:**
  * Explain the construction and working principle of a three-phase induction motor[cite: 51, 52, 54, 56, 59, 60]. Why is it referred to as an asynchronous motor, and why can the rotor never run at synchronous speed[cite: 53, 60]?
  * Explain the two types of rotors: Squirrel-Cage rotor and Phase-Wound (Slip-Ring) rotor[cite: 54].
  * Draw and explain the complete torque-slip and torque-speed characteristics of a 3-phase induction motor across motoring, generating, and braking modes[cite: 51, 52, 53, 54, 58, 59, 60]. *(10 Marks)*
* **Q4.5 [Induction Motor Starters | Repeated 3x]:** Why are starters required for three-phase induction motors[cite: 53]? Explain the working of Direct-On-Line (DOL) and Star-Delta ($Y\text{-}\Delta$) starters[cite: 53]. *(10 Marks)*
* **Q4.6 [Single-Phase Induction Motor Non-Self-Starting Nature | Repeated 6x]:**
  * Explain why a single-phase induction motor is not self-starting based on double-revolving field theory[cite: 55, 59, 60].
  * Describe the starting methods used to make it self-starting (split-phase, capacitor-start, capacitor-run, shaded pole)[cite: 55, 59, 60]. *(5 to 10 Marks)*
* **Q4.7 [Synchronous Machines Construction & Working | Repeated 5x]:**
  * Classify synchronous generators (alternators)[cite: 54, 55]. Provide constructional details (salient pole vs. cylindrical rotor) and explain their operating principle[cite: 54, 55, 58].
  * Explain the principle of operation of a synchronous motor[cite: 53]. Why is a synchronous motor not self-starting, and how is it started[cite: 60]? Differentiate between a 3-phase induction motor and a 3-phase synchronous motor[cite: 51, 52, 53]. *(10 Marks)*

### B. Analytical & Numerical Problems
* **Q4.8 [DC Motor & Generator Numerical Calculations | 10 Marks | Repeated 4x]:**
  * A $4\text{-pole}, 500\text{ V}$, wave-wound DC shunt motor has 720 conductors on its armature[cite: 59]. Full-load armature current is $60\text{ A}$ and flux per pole is $0.03\text{ Wb}$[cite: 59]. Armature resistance is $1.2\ \Omega$ and brush contact drop is $1\text{ V}$ per brush[cite: 59]. Calculate full-load operational speed in RPM[cite: 59].
  * A DC shunt machine connected to a $230\text{ V}$ supply has an armature resistance of $0.115\ \Omega$ and field winding resistance of $115\ \Omega$[cite: 53]. Find the ratio of the speed as a generator to the speed as a motor with the line current in each case being $100\text{ A}$[cite: 53].
  * A $4\text{-pole}, 50\text{ kW}, 250\text{ V}$ DC shunt generator with a wave-wound armature has armature resistance $R_a = 0.06\ \Omega$ and shunt field resistance $R_{sh} = 100\ \Omega$[cite: 60]. Find the speed in RPM at which the generator must be driven if the flux per pole is $30\text{ mWb}$ and total number of armature conductors is 400[cite: 60].
* **Q4.9 [Induction Motor Slip & Rotor Speed Calculations | 10 Marks | Repeated 3x]:**
  * A 3-phase, 6-pole, $50\text{ Hz}$ induction motor operates with a slip of $5\%$ at a certain load[cite: 60]. Find: (i) Synchronous speed ($N_s$), (ii) Operating speed of the motor ($N$), (iii) Frequency of rotor currents ($f_r$), (iv) Speed of rotor magnetic field with respect to the rotor, and with respect to the stator[cite: 60].
* **Q4.10 [Synchronous Generator Frequency-Speed Relations | 10 Marks | Repeated 2x]:**
  * A 6-pole AC synchronous generator runs and produces a supply frequency of $60\text{ Hz}$[cite: 56, 57]. Calculate the speed of the generator in revolutions per minute (RPM)[cite: 56, 57]. If the generated frequency is decreased to $20\text{ Hz}$, how many poles will be required if the generator is driven at the same speed[cite: 56, 57]?

## 3. Dedicated 3D Virtual Lab Model: Unit IV

### LAB 4.1: DC Machine Cutaway & Electromechanical Dynamometer Rig
* **Physical 3D Assets:**
  * Full cutaway 3D DC machine exposing cast steel yoke, laminated main pole cores with copper field coils, armature core with insulated copper windings in slots, commutator copper segments separated by mica, and carbon brushes in spring-loaded brush holders[cite: 56, 58, 60].
  * Coupled mechanical eddy-current brake dynamometer load[cite: 1].
* **Interactive Controls:**
  * Machine Function Toggle: DC Generator vs. DC Motor[cite: 53, 56, 60].
  * Armature terminal voltage slider ($0\text{ to } 300\text{ V}$)[cite: 53, 59].
  * Field winding rheostat slider ($R_{\text{field}}$ control)[cite: 53, 58].
  * Mechanical braking load torque slider ($0\text{ to } 150\text{ Nm}$)[cite: 51, 52].
* **Real-Time Visual Mechanics:**
  * Shows magnetic flux lines passing from north poles through armature core into south poles[cite: 59, 60].
  * **Motor Mode:** Current injection creates tangential Lorentz forces on conductors ($F = BIl$), spinning the armature; calculates back EMF ($E_b = V - I_a R_a$) live[cite: 53, 59].
  * **Speed Control:** Visualizes armature resistance control vs. field weakening, plotting real-time torque-speed curves:
    $$\omega = \frac{V - I_a R_a}{K \Phi}$$[cite: 51, 52, 58, 60]

### LAB 4.2: 3-Phase Induction Motor RMF & Torque-Slip Simulator
* **Physical 3D Assets:**
  * 3-phase induction motor housing with stator slots containing 3-phase distributed windings (spaced 120° apart)[cite: 54, 56, 58].
  * Interchangeable rotor modules: Squirrel-Cage rotor (skewed copper bars shorted by end rings) vs. Wound/Slip-Ring rotor with external rotor resistance bank[cite: 54].
* **Interactive Controls:**
  * 3-phase stator supply frequency slider ($10\text{ to } 60\text{ Hz}$)[cite: 60].
  * Mechanical shaft load torque slider ($0\text{ to } 200\text{ Nm}$)[cite: 51, 52].
  * External rotor resistance slider ($R_{\text{ext}}$ for slip-ring rotor)[cite: 54].
* **Real-Time Visual Mechanics:**
  * Stator core visualizes the continuous rotation of the 3D net flux vector ($\vec{\Phi}_{\text{net}} = 1.5 \Phi_m$) rotating at $N_s = 120f/P$[cite: 54, 56, 58].
  * Traces induced rotor currents and induced rotor pole rotation trailing stator RMF at slip speed ($s N_s$)[cite: 53, 60].
  * Real-time torque-slip charting workspace: Plots the complete characteristic across Motoring ($0 < s < 1$), Generating ($s < 0$), and Braking ($s > 1$) regions, showing peak torque displacement as rotor resistance varies[cite: 51, 52, 54, 58, 59, 60].

---
---

# UNIT V: ELECTRICAL INSTALLATIONS & POWER SYSTEMS

## 1. Syllabus Topics
* **Power System Structure:** Generalized layout and single-line diagram of an electric power system, functional stages: Generation, Transmission, and Distribution (primary and secondary)[cite: 1, 54, 55, 56, 57]. Standard transmission and distribution voltage levels in India (AC/DC), and the concept of national/regional electrical grids[cite: 1, 55, 56, 57].
* **Low-Tension (LT) Switchgear:** Working principle, construction, ratings, and comparative applications of: Switch Fuse Unit (SFU), Miniature Circuit Breaker (MCB), Earth Leakage Circuit Breaker (ELCB), and Moulded Case Circuit Breaker (MCCB)[cite: 1, 51, 52, 54, 55, 56, 58, 59].
* **Wires & Cables:** Classification of electrical wires and cables, conductor materials (copper vs. aluminum), insulation materials (PVC, XLPE, VIR), and single-core vs. multi-core armored cables[cite: 1, 51, 52, 54, 59].
* **Earthing Systems:** Purpose, necessity, and importance of grounding/earthing in domestic and industrial installations, methods of neutral grounding, plate earthing, and pipe earthing (construction, salt-charcoal layers, earth resistance limits)[cite: 1, 54, 56, 58, 59].
* **Batteries:** Primary vs. secondary batteries, classification of secondary batteries based on electrochemistry: Lead-Acid battery, Nickel-Cadmium (Ni-Cd), and Lithium-Ion batteries, construction, chemical reactions during charging and discharging, and key battery specifications (capacity in Ah, rating, state of charge, depth of discharge)[cite: 1, 51, 52, 54, 55, 56, 58, 59].
* **Power Electronics & Energy Calculations:** Elementary calculations for domestic energy consumption (kWh units and billing), basic working principles of single-phase DC-DC buck converters and single-phase voltage source inverters (VSI)[cite: 1, 51, 52, 54, 58, 59].

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q5.1 [Power System Layout & Transmission Voltages | Repeated 5x]:**
  * With the help of a neat single-line diagram, explain the generalized layout of an electrical power system from the generating station to the consumer terminal[cite: 54, 55, 56, 57].
  * In a tabular format, list the standard voltage levels in India for: (i) AC Generation, (ii) Primary and Secondary Transmission, and (iii) Primary and Secondary Distribution[cite: 55, 56, 57]. Explain the economic advantages of high-voltage transmission[cite: 55]. *(10 Marks)*
* **Q5.2 [LT Switchgear: SFU, MCB, ELCB, MCCB | Repeated 6x]:**
  * Describe the working principle, construction, and applications of the following low-tension (LT) switchgear devices: (i) Switch Fuse Unit (SFU), (ii) Miniature Circuit Breaker (MCB), (iii) Earth Leakage Circuit Breaker (ELCB), and (iv) Moulded Case Circuit Breaker (MCCB)[cite: 51, 52, 54, 55, 58, 59].
  * Clearly differentiate among MCB, ELCB, and MCCB based on operating principle, current ratings, and protection types (overload, short circuit, earth leakage)[cite: 55, 56]. *(10 Marks)*
* **Q5.3 [Earthing Methods & Domestic Safety | Repeated 5x]:**
  * Discuss the fundamental importance and safety necessity of earthing in residential and commercial premises[cite: 56, 59]. What are the hazards of operating ungrounded electrical equipment[cite: 56]?
  * Explain in detail with neat sectional diagrams the construction and installation of: (i) Pipe earthing, and (ii) Plate earthing[cite: 56, 58, 59]. Explain why a mixture of charcoal and salt is packed around the earth electrode[cite: 56]. *(10 Marks)*
* **Q5.4 [Battery Classification & Lead-Acid Electrochemistry | Repeated 6x]:**
  * What do you understand by primary and secondary batteries[cite: 56, 58]? Explain the electrochemical differences between them[cite: 56, 58].
  * Classify secondary batteries based on chemistries (Lead-Acid, Nickel-Cadmium, Lithium-Ion)[cite: 56]. Explain the chemical reactions during charging and discharging of a lead-acid battery[cite: 51, 52]. State its advantages and disadvantages[cite: 51, 52].
  * Discuss important technical specifications considered when selecting a battery for a specific engineering installation (ampere-hour capacity, energy density, cycle life, C-rating, self-discharge rate)[cite: 55]. *(10 Marks)*
* **Q5.5 [Wires & Cables Classification | Repeated 4x]:** Explain different types of wires and cables used in internal wiring installations[cite: 51, 52, 54, 59]. Discuss the construction of an armored power cable, detailing conductor, insulation, bedding, armor, and serving layers[cite: 51, 54]. *(10 Marks)*
* **Q5.6 [Power Electronic Converters & Inverters | Repeated 3x]:**
  * Explain the working principle and circuit configuration of a DC-DC Buck Converter[cite: 51, 52].
  * Explain the operation of a single-phase Voltage Source Inverter (VSI) using a bridge configuration[cite: 51, 52, 59]. Differentiate between single-phase and three-phase inverters[cite: 59]. *(10 Marks)*

### B. Analytical & Numerical Problems
* **Q5.7 [Energy Consumption & Utility Billing | 5 to 10 Marks | Repeated 3x]:**
  * Three electric lamps rated at $10\text{ W}$, $20\text{ W}$, and $30\text{ W}$ operate for $1\text{ hour}$, $2\text{ hours}$, and $3\text{ hours}$ daily, respectively[cite: 54]. Evaluate the total electrical energy consumed and calculate the monthly electricity bill (30-day month) at the rate of Rs. 10 per unit (kWh)[cite: 54].
  * Find the total cost of electricity consumed by a $1500\text{ W}$ electric heater used for 3 hours daily during the month of November (30 days)[cite: 58]. The commercial electricity tariff is Rs. 4 per unit (kWh)[cite: 58].

## 3. Dedicated 3D Virtual Lab Model: Unit V

### LAB 5.1: 3D Substation & Residential Power Distribution Grid
* **Physical 3D Assets:**
  * **Grid Substation:** Step-up generator transformer yard ($11\text{ kV} \to 132\text{ kV}$), high-voltage lattice transmission towers, distribution step-down transformer ($11\text{ kV} \to 415\text{ V} / 230\text{ V}$), busbars, and lightning arresters[cite: 55, 56, 57].
  * **Residential Consumer Panel:** Cutaway home consumer unit showing main service fuse, energy meter, double-pole isolator switch, MCB distribution board, and earth busbar[cite: 54, 55, 56].
* **Interactive Controls:**
  * Grid Transmission Voltage Selector: Step-up levels ($66\text{ kV}, 132\text{ kV}, 400\text{ kV}$)[cite: 55, 56, 57].
  * Fault Injection Simulator: Toggle Overload Condition vs. Phase-to-Neutral Dead Short Circuit vs. Human Body Touch Leakage ($30\text{ mA}$)[cite: 55, 56].
  * Protection Device Selector: Fuse wire vs. MCB vs. ELCB/RCCB[cite: 54, 55, 58].
* **Real-Time Visual Mechanics:**
  * **High-Voltage Economy:** Visualizes current density and power line losses ($I^2R$); stepping up transmission voltage lowers current proportionally, proving copper savings[cite: 55].
  * **Switchgear Tripping Action:**
    * *Overload:* MCB bimetallic strip heats up, bends gradually, and unlatches the contact mechanism[cite: 55].
    * *Short Circuit:* High current through MCB solenoid coil pulls the plunger instantaneously ($< 10\text{ ms}$), driving the arc into the deionizing arc chute[cite: 55].
    * *Earth Leakage:* Current imbalance between phase and neutral energizes the Core Balance Current Transformer (CBCT) in the ELCB, tripping the circuit to prevent fatal electric shock[cite: 55, 56].

### LAB 5.2: Virtual Pipe/Plate Earthing & Lead-Acid Battery Station
* **Physical 3D Assets:**
  * **Earthing Installation:** Underground cross-sectional excavation revealing vertical perforated galvanized iron (GI) pipe, alternate charcoal and salt backfill layers, watering funnel, and GI earthing lead wire connected to household ground sockets[cite: 56, 59].
  * **Lead-Acid Battery Cell:** Transparent container exposing spongy lead ($\text{Pb}$) negative plates, lead dioxide ($\text{PbO}_2$) positive plates, microporous separators, and dilute sulfuric acid ($\text{H}_2\text{SO}_4$) electrolyte with hydrometer hydrometric tube[cite: 51, 56].
* **Interactive Controls:**
  * Soil moisture slider ($5\%$ to $80\%$) and salt-charcoal layer thickness slider[cite: 56].
  * Earth electrode tester dial: Executes a 3-point fall-of-potential test measuring earth resistance ($R_e$)[cite: 56].
  * Battery cycle controller: Discharging mode (supplying DC load) vs. Charging mode (connected to DC alternator)[cite: 51, 56].
* **Real-Time Visual Mechanics:**
  * **Earthing Chamber:** Shows electrical fault current discharging radially from pipe into ground soil; illustrates how water poured into the funnel ionizes salt-charcoal layers, lowering total earth resistance below the $5\ \Omega$ safety threshold[cite: 56].
  * **Battery Electrochemistry:**
    * *Discharge:* Shows $\text{Pb}$ and $\text{PbO}_2$ reacting with $\text{H}_2\text{SO}_4$ to form lead sulfate ($\text{PbSO}_4$) on both plates; electrolyte specific gravity drops toward $1.15$ on hydrometer[cite: 51].
    * *Charge:* Reverses current; converts $\text{PbSO}_4$ back to $\text{Pb}$ and $\text{PbO}_2$; releases hydrogen and oxygen gas bubbles, raising specific gravity to $1.28$[cite: 51].

---
---

# CONSOLIDATED MASTER REPETITION & PRIORITY TABLE

| Rank | Topic / Question Title | Unit | Historical Frequency | Exam Marks Category |
|:---:|---|:---:|:---:|:---:|
| **1** | **Three-Phase Induction Motor: Working Principle, RMF, and Torque-Slip Characteristics**[cite: 51, 52, 53, 54, 56, 58, 59, 60] | Unit IV | **8 Times** | 10 Marks |
| **2** | **Series RLC Resonance: Frequency Derivation, Curves, and Parameter Calculations**[cite: 51, 52, 54, 55, 56, 58, 59] | Unit II | **8 Times** | 10 Marks |
| **3** | **Single-Phase Transformer: OC/SC Tests, Equivalent Circuit, and Efficiency Calculations**[cite: 53, 54, 56, 58, 59, 60] | Unit III | **7 Times** | 10 Marks |
| **4** | **DC Machines: Construction, Operating Principles, EMF Equation, and Back EMF**[cite: 53, 55, 56, 58, 59, 60] | Unit IV | **7 Times** | 10 Marks |
| **5** | **Thevenin's and Norton's Network Theorems: Statements, Proofs, and Circuit Solutions**[cite: 51, 52, 53, 54, 55, 58, 60] | Unit I | **7 Times** | 10 Marks |
| **6** | **Three-Phase Systems: Star-Delta Phase/Line Derivations and Phasor Diagrams**[cite: 51, 52, 56, 58, 59, 60] | Unit II | **7 Times** | 10 Marks |
| **7** | **Single-Phase Transformer: Losses, Maximum Efficiency Condition, and Phasor Diagrams**[cite: 51, 52, 53, 55, 56, 60] | Unit III | **6 Times** | 10 Marks |
| **8** | **Single-Phase Induction Motors: Double-Revolving Field Theory and Starting Methods**[cite: 55, 59, 60] | Unit IV | **6 Times** | 5 to 10 Marks |
| **9** | **LT Switchgear: Working, Comparison, and Applications of SFU, MCB, ELCB, MCCB**[cite: 51, 52, 54, 55, 58, 59] | Unit V | **6 Times** | 10 Marks |
| **10** | **Two-Wattmeter Method: Circuit, Phasors, Total Power, and Power Factor Derivation**[cite: 53, 55, 58, 60] | Unit II | **6 Times** | 10 Marks |
| **11** | **Kirchhoff's Laws (KCL & KVL), Circuit Elements, and Dependent/Independent Sources**[cite: 51, 52, 56, 58, 59, 60] | Unit I | **6 Times** | 5 to 10 Marks |
| **12** | **Secondary Batteries: Classifications, Lead-Acid Chemistry, and Technical Specifications**[cite: 51, 52, 54, 55, 56, 58, 59] | Unit V | **6 Times** | 5 to 10 Marks |
| **13** | **Magnetic Circuits: Reluctance, Comparisons with Electric Circuits, and Composite Air Gaps**[cite: 51, 52, 53, 54, 55, 60] | Unit III | **6 Times** | 5 to 10 Marks |
| **14** | **Sinusoidal Waveforms: RMS, Average Values, Form Factor, and Power Triangle**[cite: 51, 52, 53, 55, 56, 59, 60] | Unit II | **6 Times** | 5 to 10 Marks |
| **15** | **Superposition Theorem: Statements, Step-by-Step Circuit Verification**[cite: 55, 56, 58, 59] | Unit I | **5 Times** | 10 Marks |
| **16** | **Earthing Systems: Purpose, Pipe Earthing, Plate Earthing, and Neutral Grounding**[cite: 54, 56, 58, 59] | Unit V | **5 Times** | 10 Marks |
| **17** | **Measuring Instruments: PMMC and Moving Iron (MI) Working, Torques, and Scales**[cite: 53, 54, 56, 60] | Unit III | **5 Times** | 10 Marks |
| **18** | **Synchronous Generator & Motor: Construction, Operating Principles, and Speed Formula**[cite: 51, 53, 54, 55, 56, 58, 60] | Unit IV | **5 Times** | 10 Marks |
| **19** | **Maximum Power Transfer Theorem: Proof, Condition ($R_L = R_{\text{th}}$), and Circuit Solutions**[cite: 53, 54, 58, 60] | Unit I | **4 Times** | 10 Marks |
| **20** | **Generalized Power System Layout: Line Diagram and Indian Transmission Voltages**[cite: 54, 55, 56, 57] | Unit V | **5 Times** | 5 to 10 Marks |