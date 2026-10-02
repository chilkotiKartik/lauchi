# INTRODUCTION TO ENGINEERING MATHEMATICS (AHT-003 / BAST-102 / BAST-103 / BSCT-101 / TMA-101)
## Master Syllabus, Complete PYQ Archive with Marks & Repetition Counts, Predicted Topics, and 3D Virtual Lab Blueprints (Units I to V)

---

# UNIT I: CALCULUS I (DIFFERENTIAL CALCULUS)

## 1. Syllabus Topics
* **Limits, Continuity & Differentiability:** Limits, indeterminate forms, continuity, and differentiability of single and multivariable functions[cite: 1, 193, 198].
* **Mean Value Theorems:** Rolle's Theorem, Lagrange's Mean Value Theorem (LMVT), Cauchy's Mean Value Theorem (CMVT), and geometric/algebraic interpretations[cite: 1, 185, 187, 191, 193, 194, 196, 198, 200].
* **Expansion of Functions:** Taylor's Theorem and Maclaurin's Theorem for functions of one variable, Taylor's Theorem for functions of two variables (multivariable Taylor expansions)[cite: 1, 185, 187, 189, 191, 194, 196, 198, 200].
* **Partial Differentiation:** Partial derivatives of first and higher orders, Euler's theorem on homogeneous functions, composite functions, total derivative, and change of variables in partial derivatives[cite: 1, 185, 187, 189, 192, 196, 198, 200].
* **Maxima and Minima:** Maxima and minima of functions of two and three variables, stationary points, saddle points, and Method of Lagrange Multipliers for constrained optimization[cite: 1, 185, 187, 189, 191, 193, 194, 196, 200].

---

## 2. Previous Years Questions (PYQs)

### A. Mean Value Theorems & Taylor's Expansions
* **Q1.1 [Rolle's & Mean Value Theorems | Repeated 8x]:**
  * Verify Rolle's Theorem for the function $f(x) = \log\left(\frac{x^2 + ab}{x(a+b)}\right)$ in the interval $[a, b]$[cite: 185, 187]. *(5 Marks)*
  * Discuss the applicability of Lagrange's Mean Value Theorem for the function $f(x) = \begin{cases} 2 + x^2, & x \le 1 \\ 3x, & x > 1 \end{cases}$ on $[-1, 2]$[cite: 185, 187]. *(5 Marks)*
  * Verify Rolle's Theorem for $f(x) = \frac{\sin x}{e^x}$ (or $e^{-x}\sin x$) in $[0, \pi]$[cite: 191, 194]. *(5 Marks)*
  * Verify Mean Value Theorem for $f(x) = x(x-1)(x-2)$ in $[0, 1/2]$[cite: 191, 194]. *(5 Marks)*
  * Verify Rolle's Theorem for the function $f(x) = \sin x + \cos x - 1$ in $[0, \pi/2]$[cite: 196]. *(5 Marks)*
  * Find the value of $c$ using Lagrange's Mean Value Theorem for $f(x) = Ax^2 + Bx + C$ in $[a, b]$, or for $f(x) = 2x^2 + 3x + 4$ in $[1, 2]$[cite: 193, 198]. *(5 Marks)*
  * Show that $c$ of the Cauchy Mean Value Theorem for the interval $(a, b)$ is the geometric mean of $a$ and $b$ if $f(x) = \sqrt{x}$ and $g(x) = \frac{1}{\sqrt{x}}$[cite: 193, 200]. *(5 Marks)*
* **Q1.2 [Taylor's Series for Single and Two Variables | Repeated 8x]:**
  * Find the first six terms of the expansion of the function $e^x \log(1+y)$ in a Taylor series in the neighborhood of the point $(0, 0)$[cite: 185, 187, 191]. *(5 Marks)*
  * Expand $\sin x$ in powers of $(x - \pi/2)$. Hence find the value of $\sin 91^\circ$, given $1^\circ = 0.0174\text{ rad}$[cite: 185, 187]. *(5 Marks)*
  * State Taylor's theorem in two variables. Expand $e^x \sin y$ in powers of $x$ and $y$ about $(0, 0)$ up to third-degree terms[cite: 189, 198]. *(10 Marks)*
  * Expand $y^x$ at $(1, 1)$ up to the second-degree term by Taylor's Theorem[cite: 194]. *(10 Marks)*
  * Express $x^4 + 3x^3 - 8x + 20$ in powers of $(x + 1)$ using Taylor's theorem[cite: 196]. *(5 Marks)*
  * Expand $x^2 y + 3y - 2$ in powers of $(x - 1)$ and $(y + 2)$ using Taylor's theorem[cite: 200]. *(5 Marks)*
* **Q1.3 [Continuity, Differentiability & Limits | Repeated 2x]:**
  * Show that the function $f(x) = \begin{cases} x\sin(1/x), & x \neq 0 \\ 0, & x = 0 \end{cases}$ is continuous but not differentiable at $x = 0$[cite: 198]. *(5 Marks)*
  * Find the values of $a$ and $b$ if $\lim_{x \to 0} \frac{x(1 + a\cos x) - b\sin x}{x^3} = 1$[cite: 193]. *(10 Marks)*

### B. Partial Differentiation & Constrained Optimization
* **Q1.4 [Partial Derivatives Identities | Repeated 6x]:**
  * If $x^x y^y z^z = c$, show that at $x = y = z$, $\frac{\partial^2 z}{\partial x \partial y} = -(x \log_e(ex))^{-1}$[cite: 185, 187]. *(5 Marks)*
  * If $u = \log(x^3 + y^3 + z^3 - 3xyz)$, show that:
    1. $\frac{\partial u}{\partial x} + \frac{\partial u}{\partial y} + \frac{\partial u}{\partial z} = \frac{3}{x+y+z}$[cite: 198].
    2. $\left(\frac{\partial}{\partial x} + \frac{\partial}{\partial y} + \frac{\partial}{\partial z}\right)^2 u = -\frac{9}{(x+y+z)^2}$[cite: 191, 198]. *(10 Marks)*
  * If $z(x+y) = x^2 + y^2$, show that $\left(\frac{\partial z}{\partial x} - \frac{\partial z}{\partial y}\right)^2 = 4\left(1 - \frac{\partial z}{\partial x} - \frac{\partial z}{\partial y}\right)$[cite: 189]. *(10 Marks)*
  * If $z = x\log(x+r) - r$, where $x = r\cos\theta, y = r\sin\theta$, prove that $\frac{\partial^2 z}{\partial x^2} + \frac{\partial^2 z}{\partial y^2} = \frac{1}{x+r}$[cite: 196]. *(5 Marks)*
  * If $u = f(r)$ and $x = r\cos\theta, y = r\sin\theta$, prove that $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = f''(r) + \frac{1}{r}f'(r)$[cite: 200]. *(10 Marks)*
* **Q1.5 [Constrained Maxima & Minima via Lagrange Multipliers | Repeated 7x]:**
  * Find the minimum value of $x^2 + y^2 + z^2$, given the constraint $ax + by + cz = p$[cite: 185, 187]. *(5 Marks)*
  * If $u = ax^2 + by^2 + cz^2$ subject to $x^2 + y^2 + z^2 = 1$ and $lx + my + nz = 0$, prove that the stationary values of $u$ satisfy the determinantal relation $\frac{l^2}{a-u} + \frac{m^2}{b-u} + \frac{n^2}{c-u} = 0$[cite: 193, 196]. *(10 Marks)*
  * Find the maximum and minimum distances of the point $(3, 4, 12)$ or $(1, 2, -1)$ from the sphere $x^2 + y^2 + z^2 = 1$ (or $x^2 + y^2 + z^2 = 24$) using Lagrange's method of multipliers[cite: 194, 200]. *(10 Marks)*
  * The temperature $T$ at any point $(x, y, z)$ in space is $T = 400xyz^2$[cite: 189]. Find the highest temperature on the surface of the unit sphere $x^2 + y^2 + z^2 = 1$[cite: 189]. *(10 Marks)*
  * Divide 24 into three parts such that the continued product of the first, square of the second, and cube of the third is a maximum ($f = x y^2 z^3$ subject to $x + y + z = 24$)[cite: 193]. *(10 Marks)*
  * Find the area of the greatest rectangle that can be inscribed in an ellipse $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$[cite: 196]. *(5 Marks)*
  * Examine the function $\sin x + \sin y + \sin(x+y)$ for maximum and minimum values[cite: 191]. *(5 Marks)*

---

## 3. Predicted Must-Do Exam Topics
1. **Method of Lagrange Multipliers for Stationary Values:** Extreme values of $u = ax^2 + by^2 + cz^2$ on intersecting planes/spheres, and shortest/farthest distance from an external point to a sphere[cite: 185, 189, 193, 194, 196, 200].
2. **Multivariable Taylor's Expansion (2 Variables):** Series expansion of $e^x\sin y$ or $e^x\log(1+y)$ up to second- and third-degree terms[cite: 185, 187, 189, 191, 198].
3. **Logarithmic Symmetrical Partial Differentiation:** Proof that $\left(\frac{\partial}{\partial x} + \frac{\partial}{\partial y} + \frac{\partial}{\partial z}\right)^2 \log(x^3+y^3+z^3-3xyz) = -\frac{9}{(x+y+z)^2}$[cite: 191, 198].
4. **Cauchy & Lagrange Mean Value Theorem Deductions:** Proving $c = \sqrt{ab}$ for $f(x) = \sqrt{x}, g(x) = 1/\sqrt{x}$ and evaluating $c$ for quadratic/trigonometric expressions[cite: 185, 191, 193, 194, 198, 200].

---

## 4. 3D Virtual Lab Architecture: Unit I

### LAB 1.1: 3D Surface Topography & Lagrange Multipliers Constraint Optimizer
* **Physical 3D Assets:**
  * 3D multivariable surface canvas plotting $z = f(x, y)$ or 4D implicit isosurfaces ($u = f(x, y, z)$) as a semi-transparent topographical terrain[cite: 185, 189].
  * 3D intersecting constraint curve/plane (e.g., plane $lx + my + nz = 0$ intersecting sphere $x^2 + y^2 + z^2 = 1$) rendered as a bright red spatial path[cite: 193, 196].
* **Interactive Controls:**
  * Objective function selector: $f(x, y, z) = x^2 + y^2 + z^2$ vs. $T = 400xyz^2$ vs. $u = ax^2 + by^2 + cz^2$[cite: 185, 189, 193, 196].
  * External point coordinate drag-handles for distance minimization (e.g., $(3, 4, 12)$ or $(1, 2, -1)$)[cite: 194, 200].
  * Multiplier slider ($\lambda$) balancing constraint gradients[cite: 185, 194].
* **Real-Time Visual Mechanics:**
  * **Gradient Alignment:** At every point along the constraint curve, renders gradient vectors $\nabla f$ (blue) and $\nabla g$ (orange); visually locks when the vectors become parallel ($\nabla f = \lambda \nabla g$), identifying critical constrained stationary points[cite: 185, 194].
  * **Hessian Eigenvalue Matrix:** Color-codes local critical points live: Green for local maxima, blue for local minima, and yellow for saddle points[cite: 1, 191].

---
---

# UNIT II: CALCULUS II (INTEGRAL CALCULUS & MULTIPLE INTEGRALS)

## 1. Syllabus Topics
* **Definite Integrals & Beta-Gamma Functions:** Definite integrals, properties, Beta and Gamma functions, fundamental relations ($B(m, n) = \frac{\Gamma(m)\Gamma(n)}{\Gamma(m+n)}$, $\Gamma(1/2) = \sqrt{\pi}$, Legendre's duplication formula), and definite integral evaluations[cite: 1, 185, 187, 189, 191, 193, 194, 196, 198, 200].
* **Curve Tracing:** Principles of tracing Cartesian, polar, and parametric curves (symmetry, origin, tangents, asymptotes, intercepts, nodal loops)[cite: 1, 185, 187, 198].
* **Multiple Integrals:** Double and triple integrals, evaluation over Cartesian and polar domains, Dirichlet's integral for volume calculations[cite: 1, 185, 187, 189, 194, 196, 198, 200].
* **Change of Order & Coordinate Transformations:** Changing the order of integration in double integrals, transformation of variables (Cartesian to polar, cylindrical, and spherical coordinates)[cite: 1, 185, 187, 189, 191, 194, 196, 198, 200].

---

## 2. Previous Years Questions (PYQs)

### A. Beta and Gamma Functions
* **Q2.1 [Beta-Gamma Proofs & Definite Integrals | Repeated 7x]:**
  * Prove that $\int_0^1 \frac{x^{m-1} + x^{n-1}}{(1+x)^{m+n}} dx = B(m, n)$[cite: 185, 187]. *(5 Marks)*
  * Prove the relation $B(m, n) = \frac{\Gamma(m)\Gamma(n)}{\Gamma(m+n)}$ and show that $\Gamma(1/2) = \sqrt{\pi}$[cite: 194, 200]. *(5 to 10 Marks)*
  * Evaluate the integral $\int_0^{2\pi} \sin^4\theta \cos^2\theta \, d\theta$ using Beta and Gamma functions[cite: 189]. *(5 Marks)*
  * Evaluate $\int_0^\infty \frac{x^4 (1 + x^5)}{(1 + x)^{15}} dx$ using properties of Beta functions[cite: 191]. *(5 Marks)*
  * Show that $\int_0^1 \frac{x^2}{\sqrt{1 - x^4}} dx \times \int_0^1 \frac{dx}{\sqrt{1 + x^4}} = \frac{\pi}{4\sqrt{2}}$[cite: 193, 196]. *(10 Marks)*
  * Evaluate $\int_0^\infty e^{-x^2} dx$ using Gamma functions[cite: 198]. *(5 Marks)*

### B. Change of Order of Integration
* **Q2.2 [Change of Order Evaluations | Repeated 8x]:**
  * Change the order of integration in $\int_0^\infty \int_0^x x e^{-x^2 / y} dy dx$ and evaluate it[cite: 185, 187]. *(5 Marks)*
  * Evaluate the double integral $\int_0^\pi \int_x^\pi \frac{\sin y}{y} dy dx$ by changing the order of integration[cite: 189]. *(5 Marks)*
  * Evaluate by changing the order of integration: $\int_0^\infty \int_x^\infty \frac{e^{-y}}{y} dy dx$[cite: 191]. *(5 Marks)*
  * Change the order of integration for $\int_0^1 \int_{x^2}^{2-x} xy \, dy dx$ and hence evaluate the integral[cite: 191, 198, 200]. *(10 Marks)*
  * Evaluate by changing the order of integration: $\int_0^{2a} \int_{x^2 / a}^{2a - x} xy \, dy dx$[cite: 194]. *(10 Marks)*
  * Solve $\int_0^1 \int_x^{\sqrt{2 - x^2}} \frac{x \, dy dx}{\sqrt{x^2 + y^2}}$ by changing the order of integration[cite: 196]. *(10 Marks)*

### C. Double & Triple Integrals and Coordinate Transformations
* **Q2.3 [Double & Triple Integration in Cartesian & Polar | Repeated 6x]:**
  * Change to polar coordinates and evaluate $\iint \frac{x^2 y^2}{x^2 + y^2} dx dy$ over the annular region between concentric circles $x^2 + y^2 = a^2$ and $x^2 + y^2 = b^2$ ($a > b > 0$)[cite: 185, 187]. *(5 Marks)*
  * Evaluate $\iint (x + y)^2 dx dy$ over the area bounded by the ellipse $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$[cite: 200]. *(10 Marks)*
  * Evaluate $\iint xy \, dx dy$ over the first quadrant of the circle $x^2 + y^2 = a^2$ ($x \ge 0, y \ge 0$)[cite: 198]. *(5 Marks)*
  * Evaluate $\iint y \, dx dy$ over the area bounded by the parabolas $y^2 = 4x$ and $x^2 = 4y$[cite: 196]. *(5 Marks)*
  * Evaluate the triple integral $\iiint (x^2 + y^2 + z^2) dx dy dz$ over the tetrahedral region bounded by $x = 0, y = 0, z = 0$ and $x + y + z = a$ ($a > 0$)[cite: 198]. *(10 Marks)*
  * Using triple integrals, find the volume of the tetrahedron bounded by the coordinate planes $x = 0, y = 0, z = 0$ and $x + y + z = 1$[cite: 189, 194]. *(5 to 10 Marks)*

### D. Curve Tracing
* **Q2.4 [Curve Tracing Analysis | Repeated 3x]:**
  * Trace the curve $y^2(a - x) = x^2(a + x)$ by giving all its features in detail (symmetry, origin, tangents, asymptotes, and regions of existence)[cite: 185, 187]. *(5 Marks)*
  * Trace the Folium of Descartes / nodal curve $x^3 + y^3 = a^2 x$[cite: 198]. *(10 Marks)*

---

## 3. Predicted Must-Do Exam Topics
1. **Change of Order of Integration:** Converting $\int_0^1 \int_{x^2}^{2-x} xy \, dy dx$ or $\int_0^\pi \int_x^\pi \frac{\sin y}{y} dy dx$ by sketching intersection strips[cite: 189, 191, 194, 198, 200].
2. **Definite Integral Products via Beta-Gamma Substitution:** Proving $\int_0^1 \frac{x^2}{\sqrt{1-x^4}}dx \times \int_0^1 \frac{dx}{\sqrt{1+x^4}} = \frac{\pi}{4\sqrt{2}}$[cite: 193, 196].
3. **Volume of Tetrahedron via Triple Integration:** Evaluating $\int_0^1 \int_0^{1-x} \int_0^{1-x-y} dz dy dx = \frac{1}{6}$[cite: 189, 194, 198].
4. **Cartesian to Polar Coordinate Transformations:** Converting double integrals over circles and annular rings using $x = r\cos\theta, y = r\sin\theta, dx dy = r dr d\theta$[cite: 185, 187, 198].

---

## 4. 3D Virtual Lab Architecture: Unit II

### LAB 2.1: 3D Multiple Integral Volume & Reordered Region Visualizer
* **Physical 3D Assets:**
  * 3D volumetric space displaying bounding surfaces of integration (e.g., planes $x=0, y=0, z=0, x+y+z=1$, or paraboloids $y=x^2$ and planes $y=2-x$)[cite: 189, 194, 198].
  * Mobile infinitesimal elemental volume block $dx dy dz$ (Cartesian) or cylindrical wedge $r dr d\theta dz$ (Polar)[cite: 185, 198].
* **Interactive Controls:**
  * Order of Integration Toggle: Vertical slicing ($dy$ then $dx$) vs. Horizontal slicing ($dx$ then $dy$)[cite: 189, 191, 198, 200].
  * Boundary parameter sliders: Domain bounds ($a, b$)[cite: 185, 198].
  * Dimension Toggle: Double Integral Surface Area vs. Triple Integral Bounded Volume[cite: 189, 194].
* **Real-Time Visual Mechanics:**
  * **Reordering Animation:** When toggling the integration order, the virtual sampling strip transforms from a vertical vertical-spanning bar ($y = x^2$ to $y = 2-x$) into two piecewise horizontal sweeps ($x = 0$ to $\sqrt{y}$ and $x = 0$ to $2-y$), illustrating why the integral splits into two regions[cite: 191, 198, 200].
  * **Volume Accumulator:** Sweeps the elemental block across 3D space, integrating volume and plotting the accumulation curve in real time[cite: 189, 194].

---
---

# UNIT III: CALCULUS III (JACOBIANS, REVOLUTIONS & ERROR ANALYSIS)

## 1. Syllabus Topics
* **Jacobians:** Definition, properties of Jacobians ($J \cdot J' = 1$, chain rule for Jacobians), Jacobian of implicit functions, transformation of coordinates[cite: 1, 186, 188, 198].
* **Approximation of Errors:** Partial differentials applied to approximation of errors, relative errors, and percentage errors in physical and engineering systems[cite: 1, 185, 187, 193].
* **Applications of Definite Integrals:** Evaluation of area of plane curves, length of curves (rectification), volumes and surface areas of solids of revolution (Cartesian, polar, and parametric forms)[cite: 1, 186, 188, 189, 193, 196, 200].
* **Centroids & Centers of Gravity:** Calculation of mass, first moments of area, center of gravity (CG), and center of mass of thin plates and laminae with variable density[cite: 1, 186, 188, 198].

---

## 2. Previous Years Questions (PYQs)

### A. Jacobians of Explicit and Implicit Functions
* **Q3.1 [Jacobians Computations | Repeated 4x]:**
  * If $u^3 + v^3 + w^3 = x + y + z$, $u^2 + v^2 + w^2 = x^3 + y^3 + z^3$, and $u + v + w = x^2 + y^2 + z^2$, find the Jacobian $\frac{\partial(u, v, w)}{\partial(x, y, z)}$[cite: 186, 188]. *(10 Marks)*
  * If $x + y + z = u$, $y + z = uv$, $z = uvw$, show that the Jacobian $\frac{\partial(x, y, z)}{\partial(u, v, w)} = u^2 v$[cite: 198]. *(5 Marks)*

### B. Approximation of Percentage Errors
* **Q3.2 [Percentage Error in Electrical Circuits | Repeated 3x]:** Find the possible percentage error in computing the parallel resistance $r$ of three resistances $r_1, r_2, r_3$ from the formula $\frac{1}{r} = \frac{1}{r_1} + \frac{1}{r_2} + \frac{1}{r_3}$, if $r_1, r_2, r_3$ are each in error by $+1.2\%$[cite: 185, 187, 193]. *(5 Marks)*

### C. Volumes and Surface Areas of Solids of Revolution
* **Q3.3 [Volumes & Surfaces of Revolution | Repeated 6x]:**
  * Find the volume and surface area generated by the revolution of the Astroid $x = a\cos^3\theta, y = a\sin^3\theta$ about the $x$-axis[cite: 186, 188]. *(10 Marks)*
  * Find the volume of the solid generated by revolving the semicircle $x^2 + y^2 = a^2$ ($y \ge 0$) about the $x$-axis[cite: 189]. *(5 Marks)*
  * Find the volume generated when the loop of the curve $y^2 = x^2(x + 4)$ is revolved about the $x$-axis[cite: 193, 196, 200]. *(5 Marks)*
  * Find the area of the region bounded by the curves $y = x$ and $y = x^2$ in the first quadrant using double integration[cite: 189, 198]. *(5 Marks)*

### D. Center of Gravity & Mass of Laminae
* **Q3.4 [Mass and Center of Gravity of Lamina | Repeated 3x]:** A triangular thin plate with vertices at $(0, 0)$, $(2, 0)$, and $(2, 4)$ has a variable density $\rho(x, y) = 1 + x + y$[cite: 186, 188, 198]. Find:
  1. The total mass of the plate ($M = \iint \rho \, dx dy$)[cite: 186, 188, 198].
  2. The position coordinates of its center of gravity $(\bar{x}, \bar{y})$[cite: 186, 188, 198]. *(10 Marks)*

---

## 3. Predicted Must-Do Exam Topics
1. **Implicit Function Jacobians:** Evaluating $\frac{\partial(u, v, w)}{\partial(x, y, z)}$ using the implicit matrix ratio $(-1)^n \frac{\partial(f_1, f_2, f_3)/\partial(x, y, z)}{\partial(f_1, f_2, f_3)/\partial(u, v, w)}$[cite: 186, 188].
2. **Revolution of Astroid & Loops:** Volume ($V = \pi \int y^2 dx$) and surface area ($S = 2\pi \int y \, ds$) for $x = a\cos^3\theta, y = a\sin^3\theta$ and $y^2 = x^2(x+4)$[cite: 186, 188, 193, 196, 200].
3. **Center of Gravity of Variable-Density Triangular Plate:** Calculating moments $M_y = \iint x\rho \, dx dy$ and $M_x = \iint y\rho \, dx dy$ for $\rho = 1+x+y$[cite: 186, 188, 198].
4. **Percentage Error Differentials:** Computing total differentials $dr = \sum \frac{\partial r}{\partial r_i} dr_i$ for parallel components[cite: 185, 187, 193].

---

## 4. 3D Virtual Lab Architecture: Unit III

### LAB 3.1: 3D Solid of Revolution & Centroid Mechanics Workbench
* **Physical 3D Assets:**
  * 3D lathe rotation spindle centered on the $x$-axis and $y$-axis[cite: 186, 188].
  * 2D generator profile curve (Astroid, Parabolic loop, Semicircle) mounted on a transparent revolving frame[cite: 186, 188, 189, 193].
  * 3D triangular lamina testbed displaying center-of-gravity balance needle[cite: 186, 188, 198].
* **Interactive Controls:**
  * Revolving curve selector: Astroid ($x = a\cos^3\theta, y = a\sin^3\theta$) vs. Nodal loop ($y^2 = x^2(x+4)$) vs. Circle[cite: 186, 188, 189, 193].
  * Revolution angle slider ($\theta = 0^\circ$ to $360^\circ$).
  * Lamina density gradient controls: $\rho(x, y) = 1 + cx + dy$[cite: 186, 188, 198].
* **Real-Time Visual Mechanics:**
  * **Swept Surface Generation:** As the angle slider increases, the generator curve sweeps through 3D space, tracing a closed volumetric shell (Astroid spindle / loop bulb)[cite: 186, 188, 193].
  * **Dynamic Metric Panel:** Evaluates surface integral $S = 2\pi \int y \sqrt{1 + (y')^2} dx$ and disk volume $V = \pi \int y^2 dx$ live[cite: 186, 188].
  * **Center of Gravity Pinpoint:** Displays a glowing marker at $(\bar{x}, \bar{y})$ on the triangular plate; adjusting density parameters moves the CG marker toward higher-density vertices[cite: 186, 188, 198].

---
---

# UNIT IV: VECTOR CALCULUS

## 1. Syllabus Topics
* **Vector Differentiation:** Scalar and vector point functions, vector differentiation, gradient of a scalar field, geometrical meaning of gradient, directional derivative, divergence and curl of vector fields, physical interpretations (solenoidal and irrotational fields), scalar potential functions[cite: 1, 185, 186, 187, 188, 190, 191, 192, 193, 194, 196, 198, 200].
* **Vector Identities:** Laplacian operator ($\nabla^2$), identities involving $\nabla(r^n)$, $\nabla \cdot (\vec{r}/r^3)$, $\nabla \times (\nabla \phi)$, $\nabla \cdot (\nabla \times \vec{F})$[cite: 1, 186, 188, 191, 192, 194, 200].
* **Vector Integration:** Line integrals, surface integrals, volume integrals[cite: 1, 186, 188, 190, 194, 196, 198, 200].
* **Integral Theorems:** Gauss Divergence Theorem, Stokes' Theorem, and Green's Theorem in a plane (statements, verifications, and evaluations of flux and work done over bounded surfaces and volumes)[cite: 1, 186, 188, 190, 192, 194, 196, 198, 200].

## 2. Previous Years Questions (PYQs)

### A. Gradient, Divergence, Curl & Vector Fields
* **Q4.1 [Solenoidal, Irrotational & Scalar Potentials | Repeated 8x]:**
  * Show that the vector field $\vec{F} = \frac{\vec{r}}{|\vec{r}|^3}$ (where $\vec{r} = x\hat{i} + y\hat{j} + z\hat{k}$) is both irrotational and solenoidal[cite: 186, 188]. Find the scalar potential $\phi$ such that $\vec{F} = \nabla\phi$[cite: 186, 188]. *(10 Marks)*
  * A fluid motion is given by $\vec{V} = (y+z)\hat{i} + (z+x)\hat{j} + (x+y)\hat{k}$[cite: 190, 194]. Show that the motion is irrotational and find its velocity potential[cite: 190, 194]. *(5 to 10 Marks)*
  * Prove that the vector field $\vec{F} = (y^2 - z^2 + 3yz - 2x)\hat{i} + (3xz + 2xy)\hat{j} + (3xy - 2xz + 2z)\hat{k}$ is solenoidal[cite: 193, 196, 200]. *(5 Marks)*
  * If $\vec{F} = x^2 y\hat{i} - 2xz\hat{j} + 2yz\hat{k}$, find $\operatorname{div}\vec{F}$, $\operatorname{curl}\vec{F}$, and $\operatorname{curl}(\operatorname{curl}\vec{F})$[cite: 198]. *(5 Marks)*
  * Find $\operatorname{div}\vec{F}$ and $\operatorname{curl}\vec{F}$ where $\vec{F} = \nabla(x^3 + y^3 + z^3 - 3xyz)$[cite: 191]. *(5 Marks)*
  * If $\vec{V} = \frac{x\hat{i} + y\hat{j} + z\hat{k}}{\sqrt{x^2 + y^2 + z^2}}$, find the value of $\operatorname{div}\vec{V}$[cite: 194]. *(5 Marks)*
  * Prove that $\operatorname{div}(\operatorname{grad} r^n) = \nabla^2(r^n) = n(n+1)r^{n-2}$[cite: 192]. Hence show that $\nabla^2(1/r) = 0$[cite: 192]. *(10 Marks)*
  * If $u = x+y+z, v = x^2+y^2+z^2, w = yz+zx+xy$, prove that $\nabla u, \nabla v, \nabla w$ are coplanar vectors[cite: 191, 194]. *(10 Marks)*
* **Q4.2 [Directional Derivatives & Orthogonal Surfaces | Repeated 4x]:**
  * Find the directional derivative of $\phi(x, y, z) = x^2 yz + 4xz^2$ at the point $(1, -2, 1)$ in the direction of the vector $2\hat{i} - \hat{j} - 2\hat{k}$[cite: 185, 187]. *(5 Marks)*
  * Find the directional derivative of $\phi = (x^2 + y^2 + z^2)^{-1/2}$ at the point $P(3, 1, 2)$ in the direction of the vector $yz\hat{i} + zx\hat{j} + xy\hat{k}$[cite: 200]. *(5 Marks)*
  * Find the constants $m$ and $n$ such that the surface $mx^2 - 2nyz = (m+4)x$ will be orthogonal to the surface $4x^2 y + z^3 = 4$ at the point $(1, -1, 2)$[cite: 196]. *(5 Marks)*

### B. Integral Theorems: Gauss, Stokes & Green
* **Q4.3 [Gauss Divergence Theorem | Repeated 6x]:**
  * Apply Gauss Divergence Theorem to evaluate $\iint_S \vec{F} \cdot \hat{n} \, dS$, where $\vec{F} = 4x^3\hat{i} - x^2 y\hat{j} + x^2 z\hat{k}$ and $S$ is the surface of the cylinder $x^2 + y^2 = a^2$ bounded by planes $z = 0$ and $z = b$[cite: 186, 188]. *(10 Marks)*
  * The vector field $\vec{F} = x^2\hat{i} + z\hat{j} + yz\hat{k}$ is defined over the volume of the cuboid $0 \le x \le a, 0 \le y \le b, 0 \le z \le c$ enclosing surface $S$[cite: 190, 196]. Evaluate the surface integral $\iint_S \vec{F} \cdot \hat{n} \, dS$ using Divergence Theorem[cite: 190, 196]. *(10 Marks)*
  * State Gauss Divergence theorem[cite: 198]. Verify it for $\vec{F} = 4xz\hat{i} - y^2\hat{j} + yz\hat{k}$ over the unit cube bounded by planes $x = 0, x = 1, y = 0, y = 1, z = 0, z = 1$[cite: 198]. *(10 Marks)*
* **Q4.4 [Stokes' Theorem | Repeated 5x]:**
  * Verify Stokes' Theorem for $\vec{F} = (x^2 + y^2)\hat{i} - 2xy\hat{j}$ taken around the rectangle bounded by lines $x = \pm a, y = 0$, and $y = b$[cite: 186, 188, 192]. *(10 Marks)*
  * Evaluate $\oint_C \vec{F} \cdot d\vec{r}$ by Stokes' Theorem, where $\vec{F} = y^2\hat{i} + x^2\hat{j} - (x+z)\hat{k}$ and $C$ is the boundary of the triangle with vertices $(0, 0, 0), (1, 0, 0)$, and $(1, 1, 0)$[cite: 200]. *(10 Marks)*
* **Q4.5 [Green's Theorem in Plane | Repeated 5x]:**
  * State Green's Theorem in a plane[cite: 190, 198]. Using it, evaluate $\oint_C (2x^2 - y^2)dx + (x^2 + y^2)dy$, where $C$ is the boundary of the area enclosed by the $x$-axis and upper half of the circle $x^2 + y^2 = a^2$[cite: 190]. *(10 Marks)*
  * Verify Green's Theorem for $\oint_C \{(3x^2 - 8y^2)dx + (4y - 6xy)dy\}$, where $C$ is the boundary of the triangular region bounded by $x = 0, y = 0$, and $x + y = 1$[cite: 196, 200]. *(10 Marks)*
  * Using Green's Theorem, evaluate $\oint_C (x^2 y \, dx + x^2 dy)$ around the triangle with vertices $(0, 0), (1, 0), (1, 1)$[cite: 194]. *(10 Marks)*
  * Verify Green's Theorem for $\oint_C (xy + y^2)dx + x^2 dy$ over the boundary bounded by $y = x$ and $y = x^2$[cite: 198]. *(10 Marks)*

---

## 3. Predicted Must-Do Exam Topics
1. **Stokes' Theorem Verification over Rectangles/Triangles:** Comparing closed line integral $\oint_C \vec{F}\cdot d\vec{r}$ against curl flux $\iint_S (\nabla \times \vec{F})\cdot \hat{n} \, dS$[cite: 186, 188, 192, 200].
2. **Green's Theorem Plane Triangle Verifications:** Equating $\oint (M dx + N dy)$ to double integral $\iint \left(\frac{\partial N}{\partial x} - \frac{\partial M}{\partial y}\right) dx dy$ over $x+y=1$[cite: 190, 194, 196, 198, 200].
3. **Gauss Divergence Theorem over Cuboids & Cylinders:** Converting surface flux into volume integral $\iiint (\nabla \cdot \vec{F}) dV$[cite: 186, 188, 190, 196, 198].
4. **Laplacian Identities & Solenoidal Fields:** Analytical proof that $\nabla^2(r^n) = n(n+1)r^{n-2}$ and testing vector solenoidal nature ($\nabla \cdot \vec{F} = 0$)[cite: 186, 192, 193, 196, 200].

---

## 4. 3D Virtual Lab Architecture: Unit IV

### LAB 4.1: Vector Flux & Gauss/Stokes Field Theorem Rig
* **Physical 3D Assets:**
  * 3D spatial field chamber populated with a dynamic grid of vector arrows representing $\vec{F}(x, y, z)$[cite: 186, 198].
  * Closed bounding surfaces: Circular cylinder ($x^2 + y^2 = a^2$), unit cube, and rectangular loop[cite: 186, 188, 198].
* **Interactive Controls:**
  * Vector Field Type Selector: Irrotational / Solenoidal ($\vec{F} = \vec{r}/r^3$) vs. Rotational ($\vec{F} = y^2\hat{i} + x^2\hat{j} - (x+z)\hat{k}$)[cite: 186, 200].
  * Surface Boundary Selector: Cube vs. Cylinder vs. Flat Triangle in $xy$-plane[cite: 186, 196, 198, 200].
  * Surface Partition Slider: Subdivides boundaries into facet tiles displaying outward unit normal vectors $\hat{n}$[cite: 186, 196].
* **Real-Time Visual Mechanics:**
  * **Gauss Divergence Mode:** Visualizes local divergence ($\nabla \cdot \vec{F}$) as glowing volumetric source/sink bubbles inside the volume; evaluates volume integral $\iiint \nabla \cdot \vec{F} \, dV$ and verifies equality with surface flux $\iint \vec{F}\cdot\hat{n} \, dS$ live[cite: 186, 198].
  * **Stokes Mode:** Renders tiny spinning paddlewheels on surface facets visualizing $\nabla \times \vec{F}$; integrates surface circulation and matches the value to line circulation $\oint_C \vec{F} \cdot d\vec{r}$ along boundary edges[cite: 186, 192, 200].

---
---

# UNIT V: MATRICES & LINEAR ALGEBRA

## 1. Syllabus Topics
* **Matrix Properties & Rank:** Matrix types, elementary row and column transformations, echelon form, normal canonical form ($[I_r \mid 0]$), rank of a matrix[cite: 1, 186, 188, 189, 193, 196, 198, 200].
* **System of Linear Equations:** Consistency of systems of non-homogeneous and homogeneous linear equations ($AX = B$ and $AX = 0$), Rouché-Capelli theorem ($\operatorname{rank}(A) = \operatorname{rank}[A \mid B]$), conditions for unique, infinite, and no solutions[cite: 1, 186, 188, 189, 192, 193, 194, 196, 198, 200].
* **Eigenvalues & Eigenvectors:** Characteristic equation, roots, properties of eigenvalues, determination of eigenvectors, linear independence of eigenvectors[cite: 1, 186, 188, 189, 191, 193, 194, 196, 198, 200].
* **Cayley-Hamilton Theorem & Diagonalization:** Statement and verification of Cayley-Hamilton Theorem, computation of matrix inverse ($A^{-1}$) and higher matrix powers ($A^4, A^6$), modal matrix ($P$), diagonalization of symmetric matrices ($P^{-1}AP = D$)[cite: 1, 189, 192, 193, 194, 196, 198, 200].
* **Vector Spaces & Subspaces:** Vector space axioms, subspaces, linear combinations, linear span, linear dependence and independence, basis and dimension, linear transformations[cite: 189, 190, 191, 192, 194, 196, 200].

---

## 2. Previous Years Questions (PYQs)

### A. Rank & Consistency of Linear Equations
* **Q5.1 [Matrix Rank via Normal Form | Repeated 6x]:**
  * Reduce the matrix $A = \begin{bmatrix} 2 & 3 & -2 & 4 \\ 3 & -2 & 1 & 2 \\ 3 & 2 & 3 & 4 \\ -2 & 4 & 0 & 5 \end{bmatrix}$ to normal form and find its rank[cite: 186, 188, 200]. *(10 Marks)*
  * Find the rank of the matrix $A = \begin{bmatrix} 1 & 2 & 3 & 0 \\ 2 & 4 & 3 & 2 \\ 3 & 2 & 1 & 3 \\ 6 & 8 & 7 & 5 \end{bmatrix}$ using elementary row transformations[cite: 189]. *(5 Marks)*
  * Find the rank of the matrix $A = \begin{bmatrix} 1 & 2 & -1 & 4 \\ 2 & 4 & 3 & 4 \\ 1 & 2 & 3 & 4 \\ -1 & -2 & 6 & -7 \end{bmatrix}$ by reducing to normal form[cite: 196]. *(5 Marks)*
  * Find the rank of $A = \begin{bmatrix} 1 & 2 & 3 & 2 \\ 2 & 3 & 5 & 1 \\ 1 & 3 & 4 & 5 \end{bmatrix}$[cite: 198]. *(5 Marks)*
* **Q5.2 [System Consistency & Parameter Evaluation | Repeated 7x]:**
  * Test the consistency of the system of equations and solve if consistent:
    $x_1 + 2x_2 - x_3 - 5x_4 = 4$, $x_1 + 3x_2 - 2x_3 - 7x_4 = 5$, $2x_1 - x_2 + 3x_3 = 3$[cite: 186, 188]. *(10 Marks)*
  * Determine the values of $\lambda$ and $\mu$ such that the system:
    $2x - 5y + 2z = 8$, $2x + 4y + 6z = 5$, $x + 2y + \lambda z = \mu$
    has: (i) No solution, (ii) A unique solution, (iii) Infinite number of solutions[cite: 192]. *(10 Marks)*
  * Find for what values of $\lambda$ and $\mu$ the system:
    $x + y + z = 16$, $x + 2y + 5z = 10$, $2x + 3y + \lambda z = \mu$
    has: (i) Unique solution, (ii) No solution, (iii) Infinite solutions. Solve for $\lambda = 2, \mu = 8$[cite: 198]. *(10 Marks)*
  * Test consistency and solve: $x_1 + 2x_2 - x_3 = 3$, $3x_1 - x_2 + 2x_3 = 1$, $2x_1 - 2x_2 + 3x_3 = 2$, $x_1 - x_2 + x_3 = -1$[cite: 196, 200]. *(5 Marks)*
  * Find the value of $k$ (or $\lambda$) such that the homogeneous system has non-trivial solutions: $2x + 3y - 2z = 0$, $3x - y + 3z = 0$, $7x + ky - z = 0$[cite: 189, 193]. *(5 Marks)*

### B. Eigenvalues, Eigenvectors & Diagonalization
* **Q5.3 [Eigenvalues & Eigenvectors Determination | Repeated 8x]:**
  * Find the eigenvalues and corresponding eigenvectors of the symmetric matrix:
    $A = \begin{bmatrix} -2 & 5 & 4 \\ 5 & 7 & 5 \\ 4 & 5 & -2 \end{bmatrix}$[cite: 186, 188, 196, 200]. *(10 Marks)*
  * Calculate the eigenvalues and eigenvectors of the matrix $A = \begin{bmatrix} 1 & -6 & -4 \\ 0 & 4 & 2 \\ 0 & -6 & -3 \end{bmatrix}$[cite: 193]. *(10 Marks)*
  * Find the eigenvalues and eigenvectors of $A = \begin{bmatrix} 3 & 1 & 4 \\ 0 & 2 & 6 \\ 0 & 0 & 5 \end{bmatrix}$ and $A = \begin{bmatrix} 6 & -2 & 2 \\ -2 & 3 & -1 \\ 2 & -1 & 3 \end{bmatrix}$[cite: 191, 198]. *(5 Marks)*
  * Two eigenvalues of the matrix $A = \begin{bmatrix} -3 & -7 & -5 \\ 2 & 4 & 3 \\ 1 & 2 & 2 \end{bmatrix}$ are $1$ and $1$[cite: 189]. Find the third eigenvalue and find its corresponding eigenvector[cite: 189]. *(5 Marks)*
  * Prove that the eigenvalues of an upper triangular matrix are its diagonal elements[cite: 189]. *(5 Marks)*
  * For the matrix $A = \begin{bmatrix} 1 & 2 & -2 \\ 1 & 2 & 1 \\ -1 & -1 & 0 \end{bmatrix}$, find the modal matrix $P$ and resulting diagonal matrix $D$[cite: 194]. *(10 Marks)*

### C. Cayley-Hamilton Theorem
* **Q5.4 [Cayley-Hamilton Verification & Inverse Calculations | Repeated 6x]:**
  * Verify Cayley-Hamilton theorem for the matrix $A = \begin{bmatrix} 2 & -1 & 1 \\ -1 & 2 & -1 \\ 1 & -1 & 2 \end{bmatrix}$[cite: 192, 198]. Find $A^{-1}$ and evaluate $A^6 - 6A^5 + 9A^4 - 2A^3 - 12A^2 + 23A - 9I$[cite: 192]. *(10 Marks)*
  * Verify Cayley-Hamilton theorem for the matrix $A = \begin{bmatrix} 4 & 3 & 1 \\ 2 & 1 & -2 \\ 1 & 2 & 1 \end{bmatrix}$ and compute $A^{-1}$[cite: 193, 196]. *(10 Marks)*
  * State Cayley-Hamilton theorem and verify it for $A = \begin{bmatrix} 1 & 2 \\ 2 & 4 \end{bmatrix}$ and $A = \begin{bmatrix} 1 & 4 \\ 2 & 3 \end{bmatrix}$[cite: 189, 200]. *(5 to 10 Marks)*

### D. Vector Spaces, Subspaces & Linear Transformations
* **Q5.5 [Vector Space & Linear Independence Theorems | Repeated 7x]:**
  * Define subspace of a vector space[cite: 189]. Show that the set $W$ of all matrices of the form $\begin{bmatrix} a & b \\ -b & a \end{bmatrix}$ is a subspace of $M_{22}$[cite: 189]. *(10 Marks)*
  * Define basis of a vector space[cite: 190, 196]. Show that the set of vectors $\{(1, 0, 0), (0, 1, 0), (0, 0, 1)\}$ is a basis of $R^3$[cite: 190]. *(10 Marks)*
  * Define a linear transformation[cite: 190]. Show that $T: R^2 \to R^3$ defined by $T(x, y) = (x, 2x-y, 3x+4y)$ is a linear transformation[cite: 190]. *(10 Marks)*
  * Show that vectors $(1, 3, 2), (1, -7, -8), (2, 1, -1)$ are linearly dependent in $V_3(F)$[cite: 196, 200]. *(5 Marks)*
  * Prove that the intersection of any two subspaces of a vector space is also a subspace[cite: 196, 200]. *(5 Marks)*
  * Let $T: R^3 \to R^3$ be a linear transformation such that $T(1, 0, 0) = (2, 4, -1), T(0, 1, 0) = (1, 3, -2), T(0, 0, 1) = (0, -2, 2)$[cite: 194]. Compute $T(-2, 4, -1)$[cite: 194]. *(10 Marks)*

---

## 3. Predicted Must-Do Exam Topics
1. **Eigenvalues & Eigenvectors of Symmetric $3 \times 3$ Matrix:** Exact repetition of $A = \begin{bmatrix} -2 & 5 & 4 \\ 5 & 7 & 5 \\ 4 & 5 & -2 \end{bmatrix}$ with orthogonal eigenvector checks[cite: 186, 188, 196, 200].
2. **Cayley-Hamilton Theorem & Inverse / Polynomial Reduction:** Proving $|A - \lambda I| = 0$ is satisfied by $A$ and evaluating $A^{-1}$ and higher matrix powers[cite: 189, 192, 193, 196, 198, 200].
3. **Consistency of Non-Homogeneous Systems with Parameters ($\lambda, \mu$):** Applying row operations to augmented matrix $[A \mid B]$ to determine conditions for unique, infinite, or no solutions[cite: 192, 198].
4. **Rank by Normal Canonical Form:** Successive row and column operations reducing $A$ into $\begin{bmatrix} I_r & 0 \\ 0 & 0 \end{bmatrix}$[cite: 186, 188, 196, 200].

---

## 4. 3D Virtual Lab Architecture: Unit V

### LAB 5.1: 3D Linear Transformation & Eigenvector Deformation Rig
* **Physical 3D Assets:**
  * 3D spatial coordinate grid displaying a unit sphere and canonical basis vectors $\hat{i}, \hat{j}, \hat{k}$[cite: 190].
  * Deformed ellipsoid visual mesh generated under linear transformation matrix $A$ ($Y = AX$)[cite: 190, 194].
* **Interactive Controls:**
  * Matrix Input Cells: Configurable $3 \times 3$ grid loading exam matrices (e.g., $A = \begin{bmatrix} -2 & 5 & 4 \\ 5 & 7 & 5 \\ 4 & 5 & -2 \end{bmatrix}$)[cite: 186, 188, 196, 200].
  * Basis Vector Rotator: Rotates an arbitrary input vector $X$ in 3D space[cite: 190].
  * Step-by-Step Echelon Stepper: Executes row operations live[cite: 186, 189].
* **Real-Time Visual Mechanics:**
  * **Eigenvector Invariance:** As vector $X$ rotates, output vector $AX$ generally changes direction; when $X$ aligns with an eigenvector, $AX$ stays collinear, scaling along the principal axis by eigenvalue factor $\lambda$[cite: 186, 196].
  * **Diagonalization / Modal Rotation:** Transforms canonical axes into the orthogonal eigenvector basis, converting the full matrix $A$ into pure uncoupled diagonal stretchings along axes[cite: 194].
  * **Augmented Matrix Pivot Engine:** Displays row operations on $[A \mid B]$ step-by-step, highlighting zero rows to establish rank and identify consistent solution planes intersecting in 3D space[cite: 186, 192, 198].

---
---

# CONSOLIDATED MASTER REPETITION & PRIORITY TABLE

| Rank | Topic / Question Title | Unit | Historical Frequency | Exam Marks Category |
|:---:|---|:---:|:---:|:---:|
| **1** | **Eigenvalues & Eigenvectors of $3 \times 3$ Matrices (Matrix $\begin{bmatrix} -2 & 5 & 4 \\ 5 & 7 & 5 \\ 4 & 5 & -2 \end{bmatrix}$)**[cite: 186, 188, 189, 191, 193, 194, 196, 198, 200] | Unit V | **8 Times** | 10 Marks |
| **2** | **Change of Order of Integration in Double Integrals**[cite: 185, 187, 189, 191, 194, 196, 198, 200] | Unit II | **8 Times** | 10 Marks |
| **3** | **Mean Value Theorems (Rolle's, LMVT & Cauchy MVT Deductions)**[cite: 185, 187, 191, 193, 194, 196, 198, 200] | Unit I | **8 Times** | 5 to 10 Marks |
| **4** | **Taylor's Series Expansions in One and Two Variables ($e^x\sin y, e^x\log(1+y)$)**[cite: 185, 187, 189, 191, 194, 196, 198, 200] | Unit I | **8 Times** | 10 Marks |
| **5** | **Solenoidal, Irrotational Vector Fields & Scalar Potential ($\vec{F} = \vec{r}/r^3$)**[cite: 186, 188, 190, 191, 193, 194, 196, 200] | Unit IV | **8 Times** | 10 Marks |
| **6** | **Consistency of Linear Systems with Parameters $\lambda, \mu$**[cite: 186, 188, 189, 192, 193, 196, 198, 200] | Unit V | **7 Times** | 10 Marks |
| **7** | **Beta and Gamma Functions Identities & Definite Integrals**[cite: 185, 187, 189, 191, 193, 194, 196, 198, 200] | Unit II | **7 Times** | 5 to 10 Marks |
| **8** | **Lagrange Multipliers for Constrained Extrema (Spheres & Planes)**[cite: 185, 187, 189, 193, 194, 196, 200] | Unit I | **7 Times** | 10 Marks |
| **9** | **Vector Spaces, Subspaces, Basis & Linear Transformations**[cite: 189, 190, 191, 192, 194, 196, 200] | Unit V | **7 Times** | 10 Marks |
| **10** | **Cayley-Hamilton Theorem Verification, Inverse & Polynomial Reduction**[cite: 189, 192, 193, 194, 196, 198, 200] | Unit V | **6 Times** | 10 Marks |
| **11** | **Gauss Divergence Theorem Verification & Evaluations**[cite: 186, 188, 190, 196, 198] | Unit IV | **6 Times** | 10 Marks |
| **12** | **Normal Canonical Form & Rank of $4 \times 4$ Matrices**[cite: 186, 188, 189, 196, 198, 200] | Unit V | **6 Times** | 10 Marks |
| **13** | **Partial Differentiation Identities ($\log(x^3+y^3+z^3-3xyz)$ and $x^x y^y z^z = c$)**[cite: 185, 187, 189, 191, 196, 198, 200] | Unit I | **6 Times** | 5 to 10 Marks |
| **14** | **Stokes' Theorem Verification over Rectangles & Triangles**[cite: 186, 188, 192, 200] | Unit IV | **5 Times** | 10 Marks |
| **15** | **Green's Theorem in a Plane: Verifications & Boundary Integrals**[cite: 190, 194, 196, 198, 200] | Unit IV | **5 Times** | 10 Marks |
| **16** | **Solids of Revolution: Volume and Surface Area of Astroid & Curve Loops**[cite: 186, 188, 189, 193, 196, 200] | Unit III | **6 Times** | 5 to 10 Marks |
| **17** | **Jacobians of Explicit and Implicit Transformations**[cite: 186, 188, 198] | Unit III | **4 Times** | 10 Marks |
| **18** | **Center of Gravity & Mass of Thin Plates ($\rho = 1+x+y$)**[cite: 186, 188, 198] | Unit III | **3 Times** | 10 Marks |
| **19** | **Approximation of Errors in Electrical Resistance Networks**[cite: 185, 187, 193] | Unit III | **3 Times** | 5 Marks |