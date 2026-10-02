/* gen_f.js - PYQ-style templates (numericals from previous-year UTU papers, re-parametrised) for
   AHT-001 Physics, AHT-002 Chemistry, EET-001 Electrical, ECT-001 Electronics, MET-001 Mechanical.
   Helpers are prefixed pf. Uses gbN / gbFact / gbMsqF from gen_b.js (same module scope). */
const PF_VERIFY=(ok,msg)=>{if(globalThis.__GEN_VERIFY__&&!ok)throw new Error("gen_f verify failed: "+msg)};
const pfD=(x,d=2)=>{const v=Number(x.toFixed(d));return String(v).replace("-","−")};      // display a number
const pfS=(x,d=2)=>{if(x===0)return "0";const e=Math.floor(Math.log10(Math.abs(x)));let m=x/10**e;if(Math.abs(Number(m.toFixed(d)))>=10){m/=10;return `${pfD(m,d)}×10<sup>${e+1}</sup>`}return `${pfD(m,d)}×10<sup>${e}</sup>`};
const pfDeg=r=>r*180/Math.PI, pfRad=d=>d*Math.PI/180;
const PF_H=6.626e-34, PF_C=2.998e8, PF_Q=1.602e-19, PF_ME=9.109e-31, PF_E0=8.854e-12, PF_M0=4*Math.PI*1e-7, PF_F=96485, PF_R=8.314;
const pfPct=x=>r2(x*100);

/* =========================================================== AHT-001 ENGINEERING PHYSICS */
genAdd("AHT-001",{
1:[
 // Newton's rings: wavelength from two ring diameters (PYQ Q1.10)
 ()=>{const lam=pick([546.1,589.3,600,632.8,656.3])*1e-9,R=pick([0.5,0.8,1,1.2,1.5,2]),n=pick([3,4,5,6]),p=pick([5,8,10,12]);
  const D=k=>Math.sqrt(4*k*lam*R)*100, Dn=Number(D(n).toFixed(4)), Dm=Number(D(n+p).toFixed(4));
  const ans=((Dm/100)**2-(Dn/100)**2)/(4*p*R)*1e9;
  PF_VERIFY(Math.abs(ans-lam*1e9)<lam*1e9*0.01,"rings lambda");
  return gbN(`In a Newton's rings experiment (reflected light), the diameter of the ${n+p}th dark ring is ${pfD(Dm,4)} cm and that of the ${n}th dark ring is ${pfD(Dn,4)} cm. The radius of curvature of the lens is ${pfD(R*100,0)} cm. Find the wavelength of light (in nm).`,ans,"nm",
   `For dark rings D<sub>n</sub>² = 4nλR, so D<sub>n+p</sub>² − D<sub>n</sub>² = 4pλR and λ = (D<sub>n+p</sub>² − D<sub>n</sub>²)/(4pR) = (${pfD(Dm,4)}² − ${pfD(Dn,4)}²)×10⁻⁴ m² / (4 × ${p} × ${R} m) = ${pfD(ans,1)} nm.`,[ans*2,ans/2,ans*p/(p+n)])},
 // radius of curvature and air-film thickness from one ring (PYQ Q1.11)
 ()=>{const lamA=pick([5000,5460,5890,6000,6328]),n=pick([5,8,10,12,15]),D=pick([0.3,0.4,0.5,0.6]),w=rnd(0,1);
  const R=(D/100)**2/(4*n*lamA*1e-10), t=n*lamA*1e-10/2*1e6;
  if(w===0)return gbN(`Newton's rings are seen normally in reflected light of wavelength ${lamA} Å. The diameter of the ${n}th dark ring is ${D} cm. Find the radius of curvature of the lens (in m).`,R,"m",
   `D<sub>n</sub>² = 4nλR, so R = D<sub>n</sub>²/(4nλ) = (${D}×10⁻²)²/(4 × ${n} × ${lamA}×10⁻¹⁰) = ${pfD(R,3)} m.`,[R*4,R/2,R*2]);
  return gbN(`Newton's rings are seen normally in reflected light of wavelength ${lamA} Å. Find the thickness of the air film at the ${n}th dark ring (in μm).`,t,"μm",
   `At a dark ring 2t = nλ (normal incidence, air film), so t = nλ/2 = ${n} × ${lamA}×10⁻¹⁰/2 = ${pfD(t,3)} μm.`,[t*2,t/2,n*lamA*1e-4])},
 // refractive index of a liquid from ring shrinkage (PYQ Q1.12)
 ()=>{const mu=pick([1.21,1.33,1.36,1.44,1.5,1.6]),Da=pick([0.3,0.36,0.4,0.45,0.5]),Dl=Number((Da/Math.sqrt(mu)).toFixed(4)),ans=(Da/Dl)**2,w=rnd(0,1);
  if(w===0)return gbN(`The diameter of the nth dark Newton's ring changes from ${Da} cm to ${pfD(Dl,4)} cm when a liquid is introduced between the lens and the plate. Find the refractive index of the liquid.`,ans,"",
   `With a liquid of index μ, D<sub>n</sub>² = 4nλR/μ, so μ = D<sub>air</sub>²/D<sub>liquid</sub>² = (${Da}/${pfD(Dl,4)})² = ${pfD(ans,3)}.`,[Da/Dl,1/ans,ans*ans]);
  const v=3e8/ans/1e8;
  return gbN(`The diameter of the nth dark Newton's ring changes from ${Da} cm to ${pfD(Dl,4)} cm when a liquid is introduced. Find the speed of light in the liquid, in units of 10⁸ m/s (c = 3×10⁸ m/s).`,v,"",
   `μ = (D<sub>air</sub>/D<sub>liq</sub>)² = ${pfD(ans,3)}, and v = c/μ = 3/${pfD(ans,3)} = ${pfD(v,3)} ×10⁸ m/s.`,[3*ans,3/(Da/Dl),v*2])},
 // single slit width from first minimum (PYQ Q1.13)
 ()=>{const lamA=pick([5000,5500,5890,6000,6328]),th=pick([10,15,20,30,45]),a=lamA*1e-4/Math.sin(pfRad(th)),w=rnd(0,1);
  if(w===0)return gbN(`Light of wavelength ${lamA} Å falls normally on a single slit. The first minimum on each side of the central maximum is at ${th}°. Find the slit width (in μm).`,a,"μm",
   `First minimum of a single slit: a sin θ = λ, so a = λ/sin θ = ${lamA}×10⁻¹⁰/sin ${th}° = ${pfD(a,3)} μm.`,[a*2,a/2,lamA*1e-4*Math.sin(pfRad(th))]);
  return gbN(`Light of wavelength ${lamA} Å falls normally on a single slit. For what slit width (in μm) does the central maximum spread out to 90° on each side (first minimum at θ = 90°)?`,lamA*1e-4,"μm",
   `The first minimum reaches 90° when a sin 90° = λ, i.e. a = λ = ${lamA} Å = ${pfD(lamA*1e-4,3)} μm. Narrower slits spread the central maximum over the whole screen.`,[lamA*2e-4,lamA*5e-5,lamA*1e-3])},
 // grating: resolving power / lines needed (PYQ Q1.14)
 ()=>{const pair=pick([[5890,5896],[5140.34,5140.85],[5769.6,5790.7],[4358.3,4359.6]]),n=pick([1,2,3]),N=(pair[0]+pair[1])/2/((pair[1]-pair[0])*n),w=rnd(0,1);
  if(w===0)return gbN(`What is the minimum number of lines a grating must have to just resolve the lines ${pair[0]} Å and ${pair[1]} Å in the ${n===1?"first":n===2?"second":"third"} order?`,Math.ceil(N),"",
   `Resolving power λ/dλ = nN. With λ = ${pfD((pair[0]+pair[1])/2,2)} Å and dλ = ${pfD(pair[1]-pair[0],2)} Å, N = λ/(n dλ) = ${pfD(N,1)}, so at least ${Math.ceil(N)} lines.`,[Math.ceil(N*n),Math.ceil(N/2),Math.ceil(N*2)]);
  const RP=(pair[0]+pair[1])/2/(pair[1]-pair[0]);
  return gbN(`Find the resolving power needed to just resolve the spectral lines ${pair[0]} Å and ${pair[1]} Å.`,RP,"",`R = λ/dλ = ${pfD((pair[0]+pair[1])/2,2)}/${pfD(pair[1]-pair[0],2)} = ${pfD(RP,1)}.`,[RP*2,RP/2,pair[0]/pair[1]])},
 // grating order overlap (PYQ Q1.15)
 ()=>{const l1=pick([5461,5893,6563,4861,5000,6000]),[n1,n2]=pick([[3,4],[2,3],[4,5],[3,5]]),ans=n1*l1/n2;
  return gbN(`In a grating spectrum, which wavelength (in Å) in the ${n2}th order overlaps with the ${n1}th-order line of ${l1} Å?`,ans,"Å",
   `Overlap means the same angle: d sin θ = n₁λ₁ = n₂λ₂, so λ₂ = n₁λ₁/n₂ = ${n1} × ${l1}/${n2} = ${pfD(ans,2)} Å.`,[l1*n2/n1,l1,ans/2])},
 // wedge film fringe width (PYQ Q1.8)
 ()=>{const lamA=pick([5000,5893,6000,6328]),th=pick([0.0005,0.001,0.002,0.0025]),mu=pick([1,1,1.33]),b=lamA*1e-10/(2*mu*th)*1e3;
  return gbN(`A wedge-shaped ${mu===1?"air":"water (μ = 1.33)"} film has a wedge angle of ${th} rad. It is lit normally by light of wavelength ${lamA} Å. Find the fringe width (in mm).`,b,"mm",
   `For a wedge film β = λ/(2μθ) = ${lamA}×10⁻¹⁰/(2 × ${mu} × ${th}) = ${pfD(b,3)} mm.`,[b*2,b/2,b*mu*2])},
 // fringe shift by a thin plate (PYQ Q1.9)
 ()=>{const mu=pick([1.5,1.55,1.6]),t=pick([5,6,8,10,12]),lamA=pick([5000,5890,6000]),N=(mu-1)*t*1e-6/(lamA*1e-10);
  return gbN(`A thin transparent plate of refractive index ${mu} and thickness ${t} μm is put in the path of one of the interfering beams (λ = ${lamA} Å). By how many fringes does the pattern shift?`,N,"",
   `The extra optical path is (μ − 1)t, so the number of fringes shifted is N = (μ − 1)t/λ = ${pfD(mu-1,2)} × ${t}×10⁻⁶/${lamA}×10⁻¹⁰ = ${pfD(N,2)}. (Shift on the screen x₀ = D(μ − 1)t/d.)`,[mu*t*1e-6/(lamA*1e-10),N/2,N*2])},
 ()=>gbFact([
  ["In Newton's rings seen in reflected light, the diameters of the dark rings are proportional to…","√n (square root of natural numbers)",["n","n²","√(2n − 1)"],"D<sub>n</sub>² = 4nλR for dark rings, so D<sub>n</sub> ∝ √n. Bright rings follow √(2n − 1)."],
  ["The centre of Newton's rings seen in reflected light is dark because…","the reflection at the glass plate adds a phase change of π and the air film thickness is zero",["the lens absorbs light at the centre","the two reflected beams have travelled very different paths","light is totally reflected at the point of contact"],"At the contact point t = 0, so the only path difference is the λ/2 from reflection at the denser medium: destructive interference."],
  ["Rayleigh's criterion says two spectral lines are just resolved when…","the principal maximum of one falls on the first minimum of the other",["their maxima coincide","their intensities are equal","the dip between them is zero"],"That is the definition of the limit of resolution (Rayleigh)."],
  ["The relative intensities of the successive maxima in Fraunhofer single-slit diffraction are nearly…","1 : 4/9π² : 4/25π² : 4/49π²",["1 : 1/2 : 1/3 : 1/4","1 : 1/4 : 1/9 : 1/16","1 : 4/π² : 4/9π² : 4/25π²"],"Secondary maxima sit near α = 3π/2, 5π/2, …, where I/I₀ = (sin α/α)² ≈ 4/(9π²), 4/(25π²), …"],
  ["The resolving power of a plane transmission grating is…","nN (order × total number of lines)",["N/n","n/N","N²"],"R = λ/dλ = nN."],
 ])],
2:[
 // half / quarter-wave plate thickness (PYQ Q2.10)
 ()=>{const lamA=pick([5000,5460,5890,6000,6328]),[me,mo]=pick([[1.553,1.544],[1.5533,1.5442],[1.486,1.658]]),d=Math.abs(me-mo),half=coin(.5),t=lamA*1e-10/((half?2:4)*d)*1e6;
  return gbN(`Calculate the thickness of a ${half?"half":"quarter"}-wave plate for light of wavelength ${lamA} Å if μ<sub>e</sub> = ${me} and μ<sub>o</sub> = ${mo} (in μm).`,t,"μm",
   `A ${half?"half":"quarter"}-wave plate gives a path difference of λ/${half?2:4}: (|μ<sub>e</sub> − μ<sub>o</sub>|)t = λ/${half?2:4}, so t = ${lamA}×10⁻¹⁰/(${half?2:4} × ${pfD(d,4)}) = ${pfD(t,2)} μm.`,[half?t/2:t*2,t*4,lamA*1e-4/d])},
 // specific rotation: tube length for a new concentration (PYQ Q2.11)
 ()=>{const c1=pick([5,8,10]),L1=pick([20,30,40]),th1=pick([10,15,20,26]),c2=pick([10,12,15,20]),th2=pick([20,30,35,40]),L2=L1*(th2/th1)*(c1/c2);
  return gbN(`A ${c1}% sugar solution in a ${L1} cm tube rotates the plane of polarisation by ${th1}°. What tube length (in cm) of a ${c2}% solution of the same sugar gives a rotation of ${th2}°?`,L2,"cm",
   `θ = S·l·c with S fixed, so l ∝ θ/c: l₂ = l₁ (θ₂/θ₁)(c₁/c₂) = ${L1} × (${th2}/${th1}) × (${c1}/${c2}) = ${pfD(L2,2)} cm.`,[L1*(th2/th1)*(c2/c1),L1*th2/th1,L2*2])},
 // mass of sugar from rotation (PYQ Q2.12)
 ()=>{const L=pick([1,2,2.5]),V=pick([40,48,50,60,100]),S=pick([52.5,66,66.5]),th=pick([8,11,12,15,20]),c=th/(S*L),m=c*V;
  return gbN(`A ${L*10} cm tube holds ${V} cm³ of sugar solution. It rotates the plane of polarisation by ${th}°. If the specific rotation of sugar is ${S}° per (dm·g/cm³), find the mass of sugar dissolved (in g).`,m,"g",
   `Specific rotation S = θ/(l·c) with l in dm: c = θ/(S·l) = ${th}/(${S} × ${L}) = ${pfD(c,4)} g/cm³, and mass = c × V = ${pfD(c,4)} × ${V} = ${pfD(m,2)} g.`,[m*10,c,m/L])},
 // numerical aperture, acceptance and critical angle (PYQ Q2.13)
 ()=>{const [n1,n2]=pick([[1.5,1.45],[1.48,1.46],[1.55,1.5],[1.5,1.47],[1.46,1.45],[1.62,1.52]]),NA=Math.sqrt(n1*n1-n2*n2),w=rnd(0,2);
  if(w===0)return gbN(`The core and cladding refractive indices of an optical fibre are ${n1} and ${n2}. Find its numerical aperture.`,NA,"",`NA = √(n₁² − n₂²) = √(${n1}² − ${n2}²) = ${pfD(NA,4)}.`,[n1-n2,NA*NA,(n1-n2)/n1]);
  if(w===1){const a=pfDeg(Math.asin(NA));return gbN(`The core and cladding refractive indices of an optical fibre are ${n1} and ${n2}. Find the acceptance angle in air (in degrees).`,a,"°",`NA = √(n₁² − n₂²) = ${pfD(NA,4)}, and θ<sub>a</sub> = sin⁻¹(NA) = ${pfD(a,2)}°.`,[a*2,pfDeg(Math.asin(n2/n1)),a/2])}
  const cr=pfDeg(Math.asin(n2/n1));
  return gbN(`The core and cladding refractive indices of an optical fibre are ${n1} and ${n2}. Find the critical angle at the core–cladding boundary (in degrees).`,cr,"°",`θ<sub>c</sub> = sin⁻¹(n₂/n₁) = sin⁻¹(${n2}/${n1}) = ${pfD(cr,2)}°.`,[90-cr,pfDeg(Math.asin(NA)),cr/2])},
 // V-number and modes (PYQ Q2.14)
 ()=>{const n1=pick([1.48,1.5,1.52]),d=pick([25,29,50,62.5]),D=pick([0.0007,0.001,0.002,0.003]),lam=pick([0.85,1.3,1.55]),NA=n1*Math.sqrt(2*D),V=Math.PI*d/lam*NA,w=rnd(0,1);
  if(w===0)return gbN(`A step-index fibre has core index ${n1}, core diameter ${d} μm and fractional index difference Δ = ${D}. At λ = ${lam} μm, find its V-number.`,V,"",
   `NA = n₁√(2Δ) = ${n1}√(${2*D}) = ${pfD(NA,4)}; V = (πd/λ)·NA = (π × ${d}/${lam}) × ${pfD(NA,4)} = ${pfD(V,3)}.`,[V*2,V/2,V*V/2]);
  const M=V*V/2;
  return gbN(`A step-index fibre has core index ${n1}, core diameter ${d} μm and Δ = ${D}. At λ = ${lam} μm, roughly how many modes does it carry? (Use M ≈ V²/2.)`,M,"",
   `V = (πd/λ) n₁√(2Δ) = ${pfD(V,3)}; M ≈ V²/2 = ${pfD(M,2)}. (If V < 2.405 the fibre is single-mode.)`,[V,M*2,V*V])},
 // energy of a laser transition (PYQ Q2.15)
 ()=>{const lamA=pick([6328,6930,6943,10600,4880,5320]),E=12398.4/lamA;
  return gbN(`A laser emits light of wavelength ${lamA} Å in a transition from an excited state to the ground state (energy 0). Find the energy of the excited state (in eV).`,E,"eV",
   `E = hc/λ = 12398/λ(Å) eV = 12398/${lamA} = ${pfD(E,3)} eV.`,[E*2,E/2,lamA/12398.4])},
 // Brewster angle
 ()=>{const mu=pick([1.33,1.5,1.52,1.6,1.732]),tb=pfDeg(Math.atan(mu));
  return gbN(`Find the polarising (Brewster) angle for light going from air into a medium of refractive index ${mu} (in degrees).`,tb,"°",`Brewster's law: tan θ<sub>p</sub> = μ, so θ<sub>p</sub> = tan⁻¹(${mu}) = ${pfD(tb,2)}°. The reflected and refracted rays are then at 90°.`,[90-tb,pfDeg(Math.asin(1/mu)),tb/2])},
 ()=>gbFact([
  ["The ratio of Einstein's coefficients A₂₁/B₂₁ equals…","8πhν³/c³",["8πhν²/c²","hν/kT","8πν³/c³h"],"From equilibrium with Planck's radiation law: A₂₁/B₂₁ = 8πhν³/c³."],
  ["Population inversion in a He–Ne laser is produced by…","electrical discharge exciting He atoms, which transfer energy to Ne by resonant collisions",["optical pumping with a flash lamp","chemical reactions in the tube","heating the gas"],"He metastable levels lie close to the Ne 3s/2s levels, so collisions pump Ne efficiently."],
  ["The ruby laser is a three-level laser, so compared with He–Ne it…","needs very intense pumping and usually works in pulses",["works continuously at low power","emits in the infrared","needs no pumping"],"More than half the Cr³⁺ ions must leave the ground state, so a xenon flash tube drives it in pulses."],
  ["A quarter-wave plate turns plane-polarised light at 45° to its optic axis into…","circularly polarised light",["unpolarised light","plane-polarised light rotated by 90°","elliptically polarised light at any angle"],"Equal o- and e-components with a phase lag of π/2 give circular polarisation."],
  ["A Nicol prism uses the fact that, in calcite…","the ordinary ray is totally reflected at the Canada balsam layer",["both rays are absorbed differently","the extraordinary ray is totally reflected","calcite is optically inactive"],"μ<sub>o</sub> (1.658) > μ<sub>Canada balsam</sub> (1.55) > μ<sub>e</sub> (1.486): the O-ray meets the layer beyond its critical angle."],
 ])],
3:[
 // Poynting vector at the Sun's surface (PYQ Q3.9)
 ()=>{const P=pick([3.8,3.9,4.0]),R=pick([6.96,7]),S=P*1e26/(4*Math.PI*(R*1e8)**2)/1e7;
  return gbN(`The Sun radiates ${P}×10²⁶ W and its radius is ${R}×10⁸ m. Find the magnitude of the Poynting vector at its surface, in units of 10⁷ W/m².`,S,"",
   `Spread over a sphere: S = P/(4πR²) = ${P}×10²⁶/(4π × (${R}×10⁸)²) = ${pfD(S,3)}×10⁷ W/m².`,[S*2,S/2,S*4])},
 // fields from solar intensity (PYQ Q3.10)
 ()=>{const I=pick([1000,1340,1365,1400]),E0=Math.sqrt(2*I/(PF_C*PF_E0)),B0=E0/PF_C*1e6,w=rnd(0,1);
  if(w===0)return gbN(`The Earth receives ${I} W/m² of solar radiation. Find the peak amplitude of the electric field (in V/m).`,E0,"V/m",`I = ½cε₀E₀², so E₀ = √(2I/(cε₀)) = √(2 × ${I}/(3×10⁸ × 8.854×10⁻¹²)) = ${pfD(E0,1)} V/m.`,[E0/Math.SQRT2,E0*Math.SQRT2,E0/2]);
  return gbN(`The Earth receives ${I} W/m² of solar radiation. Find the peak amplitude of the magnetic field (in μT).`,B0,"μT",`E₀ = √(2I/(cε₀)) = ${pfD(E0,1)} V/m, and B₀ = E₀/c = ${pfD(B0,3)} μT.`,[B0/Math.SQRT2,B0*2,B0/2])},
 // bulb at distance r (PYQ Q3.11)
 ()=>{const P=pick([60,100,150,200]),r=pick([1,2,3,5]),I=P/(4*Math.PI*r*r),E0=Math.sqrt(2*I/(PF_C*PF_E0)),w=rnd(0,1);
  if(w===0)return gbN(`A ${P} W bulb radiates uniformly in all directions. Find the intensity at ${r} m (in W/m²).`,I,"W/m²",`I = P/(4πr²) = ${P}/(4π × ${r}²) = ${pfD(I,3)} W/m².`,[I*4,P/(2*Math.PI*r*r),I/2]);
  return gbN(`A ${P} W bulb radiates uniformly in all directions. Find the peak electric field at ${r} m (in V/m).`,E0,"V/m",`I = P/(4πr²) = ${pfD(I,3)} W/m² and E₀ = √(2I/(cε₀)) = ${pfD(E0,2)} V/m (r.m.s. value ${pfD(E0/Math.SQRT2,2)} V/m).`,[E0/Math.SQRT2,E0*2,E0/2])},
 // diamagnetic magnetisation (PYQ Q3.12)
 ()=>{const chi=pick([-5e-5,-2.1e-5,-1e-5,-9e-6]),H=pick([10,100,500,1000]),M=chi*H,B=PF_M0*(H+M),w=rnd(0,1);
  if(w===0){const v=Math.abs(M)*1e4;return gbN(`A diamagnetic material has susceptibility χ = ${pfS(chi,1)} and is placed in a field H = ${H} A/m. Find the magnitude of its magnetisation M, in units of 10⁻⁴ A/m.`,v,"",`M = χH = ${pfS(chi,1)} × ${H} = ${pfS(M,2)} A/m, i.e. ${pfD(v,3)}×10⁻⁴ A/m (opposite to H, since χ < 0).`,[v*10,v/10,v*2])}
  return gbN(`A diamagnetic material (χ = ${pfS(chi,1)}) is placed in H = ${H} A/m. Find B in μT.`,B*1e6,"μT",`B = μ₀(H + M) = μ₀H(1 + χ) = 4π×10⁻⁷ × ${H} × (1 ${chi<0?"−":"+"} ${pfS(Math.abs(chi),1)}) = ${pfD(B*1e6,4)} μT.`,[B*2e6,B*5e5,PF_M0*H*1e7])},
 // hysteresis loss from loop area
 ()=>{const A=pick([200,250,400,500,600]),f=pick([50,60]),V=pick([1e-3,2e-3,5e-3]),P=A*f*V;
  return gbN(`The B–H loop of a transformer core encloses ${A} J/m³ per cycle. The core volume is ${V*1000} litre and the frequency ${f} Hz. Find the hysteresis loss (in W).`,P,"W",`Loss per cycle per m³ = loop area. P = area × f × volume = ${A} × ${f} × ${V} = ${pfD(P,2)} W.`,[A*V,P*2,P/f])},
 ()=>gbFact([
  ["The Poynting vector S⃗ = E⃗ × H⃗ gives…","the energy flowing per second through unit area",["the total energy stored in the field","the force per unit charge","the momentum of a photon"],"Its unit is W/m²: power per unit area, along the direction of propagation."],
  ["Maxwell added the displacement current density J<sub>d</sub> = ∂D/∂t to Ampère's law because…","the original law contradicted the continuity equation for time-varying fields",["it was needed for steady currents","it explains magnetism in permanent magnets","it removes the need for Gauss's law"],"Taking the divergence of ∇×H = J gives ∇·J = 0, which fails while a capacitor charges. Adding ∂D/∂t fixes it."],
  ["In a plane electromagnetic wave, E⃗, B⃗ and the propagation vector k⃗ are…","mutually perpendicular",["all parallel","E⃗ ∥ k⃗ and B⃗ ⊥ k⃗","B⃗ ∥ k⃗ and E⃗ ⊥ k⃗"],"From Maxwell's equations k·E = 0 and k·B = 0 and B = k×E/ω: a transverse wave."],
  ["Langevin's theory says diamagnetic susceptibility is…","negative and independent of temperature",["positive and ∝ 1/T","negative and ∝ 1/T","positive and independent of temperature"],"Induced orbital moments oppose H and do not depend on thermal alignment."],
  ["The area of a B–H hysteresis loop represents…","the energy lost per unit volume in one cycle",["the retentivity","the coercivity","the energy stored permanently"],"∮H dB is the work done per unit volume per cycle, lost as heat."],
 ])],
4:[
 // particle in a box energies (PYQ Q4.10)
 ()=>{const L=pick([1,2,3,4,5]),n=pick([1,2,3]),E=n*n*PF_H*PF_H/(8*PF_ME*(L*1e-10)**2)/PF_Q,w=rnd(0,1);
  if(w===0)return gbN(`An electron is confined in a one-dimensional box of width ${L} Å. Find the energy of the n = ${n} state (in eV).`,E,"eV",
   `E<sub>n</sub> = n²h²/(8mL²) = ${n*n} × (6.626×10⁻³⁴)²/(8 × 9.109×10⁻³¹ × (${L}×10⁻¹⁰)²) J = ${pfD(E,2)} eV.`,[E/(n*n)*(n+1)**2,E/2,E*2]);
  return gbN(`An electron is in the n = ${n} state of a one-dimensional box of width ${L} Å. Find its de Broglie wavelength (in Å).`,2*L/n,"Å",`Standing waves fit the box: L = nλ/2, so λ = 2L/n = 2 × ${L}/${n} = ${pfD(2*L/n,3)} Å.`,[L/n,4*L/n,2*L*n])},
 // probability in a region (PYQ Q4.7)
 ()=>{const [a,b]=pick([[0.2,0.6],[0,0.25],[0.25,0.75],[0.4,0.6],[0,0.5],[0.1,0.3]]),n=pick([1,1,2]),P=(b-a)-(Math.sin(2*n*Math.PI*b)-Math.sin(2*n*Math.PI*a))/(2*n*Math.PI);
  return gbN(`A particle is in the ${n===1?"ground":"first excited"} state (n = ${n}) of a 1-D infinite box of length L. Find the probability of finding it between x = ${a}L and x = ${b}L.`,P,"",
   `|ψ|² = (2/L) sin²(nπx/L). Integrating: P = (x₂ − x₁)/L − [sin(2nπx₂/L) − sin(2nπx₁/L)]/(2nπ) = ${pfD(b-a,2)} − [${pfD(Math.sin(2*n*Math.PI*b),4)} − (${pfD(Math.sin(2*n*Math.PI*a),4)})]/${pfD(2*n*Math.PI,3)} = ${pfD(P,4)}.`,[b-a,P/2,1-P])},
 // Compton scattered wavelength (PYQ Q4.8)
 ()=>{const l=pick([1.5,2,5,10,20,71]),th=pick([45,60,90,120,180]),lp=l+2.426*(1-Math.cos(pfRad(th)));
  return gbN(`X-rays of wavelength ${l} pm are Compton-scattered through ${th}°. Find the wavelength of the scattered X-rays (in pm). (h/m₀c = 2.426 pm)`,lp,"pm",
   `Δλ = (h/m₀c)(1 − cos θ) = 2.426 × (1 − cos ${th}°) = ${pfD(lp-l,4)} pm, so λ′ = ${l} + ${pfD(lp-l,4)} = ${pfD(lp,4)} pm.`,[l+2.426,l,lp+2.426*(1-Math.cos(pfRad(th)))])},
 // Compton recoil energy (PYQ Q4.9)
 ()=>{const E=pick([50,100,150,200]),th=pick([30,45,60,90]),l=1239.84/E,lp=l+2.426*(1-Math.cos(pfRad(th))),Ep=1239.84/lp,K=E-Ep;
  return gbN(`X-rays of energy ${E} keV are scattered through ${th}° by free electrons. Find the kinetic energy of the recoil electrons (in keV).`,K,"keV",
   `λ = hc/E = 1239.8/${E} = ${pfD(l,4)} pm; λ′ = λ + 2.426(1 − cos ${th}°) = ${pfD(lp,4)} pm; E′ = 1239.8/λ′ = ${pfD(Ep,3)} keV. Recoil KE = E − E′ = ${pfD(K,3)} keV.`,[Ep,K*2,E*(1-Math.cos(pfRad(th)))/10])},
 // uncertainty in position (PYQ Q4.12)
 ()=>{const v=pick([300,500,600,1000,2000]),acc=pick([0.001,0.002,0.005,0.01]),dv=v*acc/100,dx=1.0546e-34/(2*PF_ME*dv)*1000;
  return gbN(`The speed of an electron is measured as ${v} m/s with an accuracy of ${acc}%. Find the minimum uncertainty in its position (in mm). (Δx·Δp ≥ ħ/2)`,dx,"mm",
   `Δv = ${v} × ${acc}/100 = ${pfS(dv,2)} m/s; Δp = mΔv. Δx = ħ/(2mΔv) = 1.055×10⁻³⁴/(2 × 9.109×10⁻³¹ × ${pfS(dv,2)}) = ${pfD(dx,3)} mm.`,[dx*2,dx*4*Math.PI/2,dx/2])},
 // de Broglie of an accelerated electron
 ()=>{const V=pick([50,100,150,200,400,1000,10000]),lam=12.27/Math.sqrt(V);
  return gbN(`Find the de Broglie wavelength (in Å) of an electron accelerated from rest through ${V} V (non-relativistic).`,lam,"Å",`λ = h/√(2meV) = 12.27/√V Å = 12.27/√${V} = ${pfD(lam,4)} Å.`,[12.27/V,lam*2,lam*Math.SQRT2])},
 ()=>gbFact([
  ["Using Δx·Δp ≥ ħ/2, electrons cannot exist inside a nucleus because…","an electron confined to ~10⁻¹⁴ m would need an energy of tens of MeV, far more than β-electrons have",["electrons are too heavy","the nucleus repels electrons","electrons have no wave nature"],"Δp ≥ ħ/(2Δx) gives pc ≈ 10–20 MeV, while β-decay electrons carry only a few MeV."],
  ["For a de Broglie wave of a free particle, the group velocity equals…","the particle's velocity",["c²/v","the phase velocity","zero"],"v<sub>g</sub> = dω/dk = dE/dp = v, while v<sub>p</sub> = c²/v > c."],
  ["The Compton shift is hard to see with visible light because…","Δλ (at most ~4.9 pm) is tiny compared with visible wavelengths (~500 nm)",["visible photons have no momentum","electrons do not scatter visible light","the shift is negative"],"Δλ depends only on angle, not on λ, so its fraction Δλ/λ is about 10⁻⁵ for visible light."],
  ["The normalised wave functions of a particle in a box of length L are…","√(2/L) sin(nπx/L)",["√(1/L) cos(nπx/L)","(2/L) sin(nπx/L)","√(2/L) e<sup>inπx/L</sup>"],"ψ must vanish at x = 0 and L, and ∫|ψ|² dx = 1 gives the √(2/L) factor."],
 ])],
5:[
 // Hall effect: carrier density and drift velocity (PYQ Q5.7)
 ()=>{const I=pick([0.1,0.2,0.25,0.5]),t=pick([0.1,0.2,0.5]),w=pick([2,5,10]),B=pick([0.2,0.5,1]),VH=pick([0.05,0.115,0.2,0.4]),n=I*B/(VH*1e-3*PF_Q*t*1e-3),vd=VH*1e-3/(B*w*1e-3),q=rnd(0,1);
  const m=n/10**Math.floor(Math.log10(n)),e=Math.floor(Math.log10(n));
  if(q===0)return gbN(`In a Hall experiment, ${I} A flows through a strip ${t} mm thick and ${w} mm wide in a field of ${B} T. The Hall voltage is ${VH} mV. Find the carrier concentration n, in units of 10<sup>${e}</sup> m⁻³.`,m,"",
   `V<sub>H</sub> = IB/(nqt), so n = IB/(qtV<sub>H</sub>) = ${I} × ${B}/(1.602×10⁻¹⁹ × ${t}×10⁻³ × ${VH}×10⁻³) = ${pfS(n,3)} m⁻³.`,[m*2,m/2,m*10]);
  return gbN(`In a Hall experiment a strip ${w} mm wide is in a field of ${B} T and shows a Hall voltage of ${VH} mV. Find the drift velocity of the carriers (in m/s).`,vd,"m/s",
   `In equilibrium qE<sub>H</sub> = qv<sub>d</sub>B with E<sub>H</sub> = V<sub>H</sub>/w, so v<sub>d</sub> = V<sub>H</sub>/(Bw) = ${VH}×10⁻³/(${B} × ${w}×10⁻³) = ${pfD(vd,4)} m/s.`,[vd*2,vd/2,VH/B])},
 // Hall in a semiconductor bar (PYQ Q5.8)
 ()=>{const rho=pick([1e-2,2e-2,5e-3]),L=pick([0.01,0.02]),A=1e-6,V=pick([1,2,5]),B=pick([0.2,0.3,0.5]),t=pick([0.3,0.5,1]),VH=pick([0.5,1,2]),R=rho*L/A,I=V/R,n=I*B/(PF_Q*t*1e-3*VH*1e-3),e=Math.floor(Math.log10(n)),m=n/10**e;
  return gbN(`A semiconductor bar (ρ = ${pfS(rho,0)} Ω·m, length ${L} m, cross-section 10⁻⁶ m², thickness ${t} mm) has ${V} V applied along it and a field of ${B} T across it. The Hall voltage is ${VH} mV. Find the carrier density, in units of 10<sup>${e}</sup> m⁻³.`,m,"",
   `R = ρL/A = ${pfD(R,1)} Ω, so I = V/R = ${pfS(I,3)} A. n = IB/(qtV<sub>H</sub>) = ${pfS(I,3)} × ${B}/(1.602×10⁻¹⁹ × ${t}×10⁻³ × ${VH}×10⁻³) = ${pfS(n,3)} m⁻³.`,[m*2,m/2,m*10])},
 // band gap from intrinsic density (PYQ Q5.9)
 ()=>{const N=pick([2.5e25,5e25,1e25]),ni=pick([2.5e19,1e16,1.5e16,2.4e19]),T=300,Eg=2*8.61e-5*T*Math.log(N/ni);
  return gbN(`The effective density of states near the band edge is ${pfS(N,1)} m⁻³ and the intrinsic carrier density at 300 K is ${pfS(ni,1)} m⁻³. Using n<sub>i</sub> = N e<sup>−E<sub>g</sub>/2kT</sup>, find the band gap (in eV). (k = 8.61×10⁻⁵ eV/K)`,Eg,"eV",
   `E<sub>g</sub> = 2kT ln(N/n<sub>i</sub>) = 2 × 8.61×10⁻⁵ × 300 × ln(${pfS(N/ni,3)}) = ${pfD(Eg,3)} eV.`,[Eg/2,Eg*2,8.61e-5*T*Math.log(N/ni)])},
 // LED colour from band gap
 ()=>{const [Eg,col]=pick([[1.42,"infrared (GaAs)"],[1.875,"red (GaAsP)"],[2.0,"orange-red"],[2.25,"green (GaP)"],[2.8,"blue"],[1.98,"red"]]),lam=1239.8/Eg;
  return gbN(`An LED is made of a semiconductor with band gap ${Eg} eV. Find the wavelength it emits (in nm).`,lam,"nm",`λ = hc/E<sub>g</sub> = 1239.8/${Eg} = ${pfD(lam,1)} nm, which is ${col}.`,[lam/2,lam*2,Eg*1000/1.24])},
 // solar cell fill factor / efficiency
 ()=>{const Voc=pick([0.6,0.62,0.65]),Isc=pick([3,3.5,4]),Vm=Number((Voc*0.82).toFixed(3)),Im=Number((Isc*0.9).toFixed(3)),A=pick([100,150]),G=1000,w=rnd(0,1),FF=Vm*Im/(Voc*Isc);
  if(w===0)return gbN(`A solar cell has V<sub>oc</sub> = ${Voc} V and I<sub>sc</sub> = ${Isc} A, and delivers maximum power at ${Vm} V, ${Im} A. Find its fill factor.`,FF,"",`FF = V<sub>m</sub>I<sub>m</sub>/(V<sub>oc</sub>I<sub>sc</sub>) = ${pfD(Vm*Im,4)}/${pfD(Voc*Isc,4)} = ${pfD(FF,3)}.`,[FF*1.2,Vm/Voc,Im/Isc]);
  const eta=Vm*Im/(G*A*1e-4)*100;
  return gbN(`A ${A} cm² solar cell gives maximum power at ${Vm} V and ${Im} A under 1000 W/m² sunlight. Find its efficiency (in %).`,eta,"%",`P<sub>in</sub> = 1000 × ${A}×10⁻⁴ = ${pfD(G*A*1e-4,1)} W; P<sub>max</sub> = ${pfD(Vm*Im,3)} W; η = ${pfD(eta,2)}%.`,[eta*2,eta/2,Voc*Isc/(G*A*1e-4)*100])},
 ()=>gbFact([
  ["Direct band gap semiconductors are preferred for LEDs because…","electrons and holes recombine without needing a phonon, so light comes out efficiently",["they have larger band gaps","they conduct better","they are cheaper than silicon"],"In a direct gap the CB minimum and VB maximum are at the same k, so momentum is conserved by the photon alone. Si is indirect."],
  ["The Fermi level of an intrinsic semiconductor lies…","near the middle of the band gap",["at the bottom of the conduction band","at the top of the valence band","inside the conduction band"],"With equal effective masses E<sub>F</sub> = (E<sub>c</sub> + E<sub>v</sub>)/2, shifting slightly with temperature otherwise."],
  ["The sign of the Hall coefficient tells you…","whether the majority carriers are electrons or holes",["the band gap","the mobility only","the temperature of the sample"],"R<sub>H</sub> = 1/(nq): negative for electrons, positive for holes."],
  ["A solar cell works in the … quadrant of the I–V characteristic.","fourth",["first","second","third"],"It delivers power: the voltage is positive while the current flows out against it (negative)."],
 ])],
});

/* =========================================================== AHT-002 ENGINEERING CHEMISTRY */
const PF_MO=[["O<sub>2</sub>",2,2],["O<sub>2</sub><sup>+</sup>",2.5,1],["O<sub>2</sub><sup>−</sup>",1.5,1],["O<sub>2</sub><sup>2−</sup>",1,0],["N<sub>2</sub>",3,0],["N<sub>2</sub><sup>+</sup>",2.5,1],["CO",3,0],["NO",2.5,1],["NO<sup>+</sup>",3,0],["CN<sup>−</sup>",3,0],["B<sub>2</sub>",1,2],["C<sub>2</sub>",2,0],["F<sub>2</sub>",1,0],["H<sub>2</sub>",1,0],["He<sub>2</sub><sup>+</sup>",0.5,1],["CO<sup>+</sup>",2.5,1]];
const PF_CX=[["[Co(NH<sub>3</sub>)<sub>6</sub>]<sup>3+</sup>","Co³⁺ d⁶, strong-field NH₃ → low spin t<sub>2g</sub>⁶",0],["[CoF<sub>6</sub>]<sup>3−</sup>","Co³⁺ d⁶, weak-field F⁻ → high spin t<sub>2g</sub>⁴e<sub>g</sub>²",4],["[Mn(CN)<sub>6</sub>]<sup>3−</sup>","Mn³⁺ d⁴, strong-field CN⁻ → low spin t<sub>2g</sub>⁴",2],["[Fe(CN)<sub>6</sub>]<sup>3−</sup>","Fe³⁺ d⁵, strong-field CN⁻ → low spin t<sub>2g</sub>⁵",1],["[Fe(CN)<sub>6</sub>]<sup>4−</sup>","Fe²⁺ d⁶, strong-field CN⁻ → low spin t<sub>2g</sub>⁶",0],["[Fe(H<sub>2</sub>O)<sub>6</sub>]<sup>2+</sup>","Fe²⁺ d⁶, weak-field H₂O → high spin",4],["[Ni(CN)<sub>4</sub>]<sup>2−</sup>","Ni²⁺ d⁸, dsp² square planar, all paired",0],["[NiCl<sub>4</sub>]<sup>2−</sup>","Ni²⁺ d⁸, sp³ tetrahedral, e⁴t<sub>2</sub>⁴",2],["[Cr(NH<sub>3</sub>)<sub>6</sub>]<sup>3+</sup>","Cr³⁺ d³, t<sub>2g</sub>³",3],["[Ni(NH<sub>3</sub>)<sub>6</sub>]<sup>2+</sup>","Ni²⁺ d⁸ octahedral, t<sub>2g</sub>⁶e<sub>g</sub>²",2],["[Cu(NH<sub>3</sub>)<sub>4</sub>]<sup>2+</sup>","Cu²⁺ d⁹",1],["[MnCl<sub>4</sub>]<sup>2−</sup>","Mn²⁺ d⁵ tetrahedral, high spin",5]];
const PF_HARD=[["Ca(HCO<sub>3</sub>)<sub>2</sub>",162,"T","Ca"],["Mg(HCO<sub>3</sub>)<sub>2</sub>",146,"T","Mg"],["CaSO<sub>4</sub>",136,"P","Ca"],["CaCl<sub>2</sub>",111,"P","Ca"],["MgCl<sub>2</sub>",95,"P","Mg"],["MgSO<sub>4</sub>",120,"P","Mg"],["Mg(NO<sub>3</sub>)<sub>2</sub>",148,"P","Mg"]];
genAdd("AHT-002",{
1:[
 ()=>{const [s,bo]=pick(PF_MO);return gbN(`Using molecular orbital theory, find the bond order of ${s}.`,bo,"",`Bond order = (N<sub>b</sub> − N<sub>a</sub>)/2 from the MO configuration; for ${s} it is ${bo}. More bonding electrons → higher bond order → shorter, stronger bond.`,[bo+0.5,bo-0.5>0?bo-0.5:bo+1,bo*2])},
 ()=>{const list=shuffle(PF_MO.slice()).slice(0,5),para=list.filter(x=>x[2]>0),dia=list.filter(x=>x[2]===0);
  if(!para.length||!dia.length)return gbFact([["Which of these is paramagnetic?","O<sub>2</sub>",["N<sub>2</sub>","CO","F<sub>2</sub>"],"O₂ has two unpaired electrons in π*2p orbitals."]]);
  return msq("Using MO theory, select every paramagnetic species.",para.map(x=>x[0]),dia.map(x=>x[0]),`Paramagnetic species have unpaired electrons: ${para.map(x=>`${x[0]} (${x[2]} unpaired)`).join(", ")}. ${dia.map(x=>x[0]).join(", ")} have all electrons paired.`)},
 ()=>{const [c,why,u]=pick(PF_CX),w=rnd(0,1);
  if(w===0)return gbN(`How many unpaired electrons does ${c} have?`,u,"",`${why}, so ${u} unpaired electron${u===1?"":"s"}.`,[u+1,u+2,Math.max(0,u-1)===u?u+3:Math.max(0,u-1)]);
  const mu=Math.sqrt(u*(u+2));
  return gbN(`Find the spin-only magnetic moment of ${c} (in BM).`,mu,"BM",`${why}: n = ${u}. μ = √(n(n + 2)) = √(${u*(u+2)}) = ${pfD(mu,2)} BM.`,[Math.sqrt((u+1)*(u+3)),u,mu+1])},
 ()=>{const d=rnd(4,7),ls=coin(.5);let t,e;if(ls){t=Math.min(6,d);e=d-t}else{const fill=[1,1,1,0,0];const o=[0,0,0,0,0];for(let i=0;i<d;i++)o[i%5]++;t=o[0]+o[1]+o[2];e=o[3]+o[4]}
  const cf=-0.4*t+0.6*e;
  return gbN(`Find the crystal field stabilisation energy of a ${ls?"low":"high"}-spin octahedral d<sup>${d}</sup> ion, in units of Δ<sub>o</sub> (ignore pairing energy; give a negative number).`,cf,"Δₒ",
   `${ls?"Low":"High"} spin d<sup>${d}</sup>: t<sub>2g</sub><sup>${t}</sup>e<sub>g</sub><sup>${e}</sup>. CFSE = (−0.4 × ${t} + 0.6 × ${e})Δ<sub>o</sub> = ${pfD(cf,1)}Δ<sub>o</sub>.`,[-cf,cf-0.4,cf+0.6])},
 ()=>{const v=pick([30,40,100,600]),p=pick([0.001,0.01,0.1]),dv=v*p/100,dx=PF_H/(4*Math.PI*PF_ME*dv)*1e6;
  return gbN(`An electron moves at ${v} m/s with an uncertainty of ${p}% in its velocity. Find the minimum uncertainty in its position (in μm).`,dx,"μm",`Δx ≥ h/(4πmΔv) with Δv = ${pfS(dv,2)} m/s: Δx = 6.626×10⁻³⁴/(4π × 9.109×10⁻³¹ × ${pfS(dv,2)}) = ${pfD(dx,3)} μm.`,[dx*2,dx/2,dx*4*Math.PI])},
 ()=>gbFact([
  ["Hybridisation and shape of XeF<sub>4</sub>:","sp³d², square planar",["sp³, tetrahedral","sp³d, see-saw","dsp², square planar"],"Xe has 4 bond pairs + 2 lone pairs = 6 → sp³d², lone pairs trans → square planar."],
  ["Hybridisation and shape of XeO<sub>4</sub>:","sp³, tetrahedral",["sp³d², octahedral","sp², trigonal planar","sp³d, trigonal bipyramidal"],"Four σ-bonds and no lone pairs on Xe → sp³ tetrahedral (with dπ–pπ bonds)."],
  ["Why is CO diamagnetic while NO is paramagnetic?","CO has 14 electrons (all paired); NO has 15, leaving one in π*2p",["CO has a triple bond","NO is ionic","CO has more lone pairs"],"Electron count decides: odd-electron molecules must have an unpaired electron."],
  ["CO has a shorter bond than CO<sup>+</sup> because…","CO has bond order 3 while CO<sup>+</sup> has 2.5",["CO<sup>+</sup> has more bonding electrons","CO is heavier","charge always lengthens bonds"],"Removing an electron from the bonding σ2p (HOMO of CO) lowers the bond order from 3 to 2.5."],
  ["In an octahedral field the d-orbitals that rise in energy (e<sub>g</sub>) are…","d<sub>x²−y²</sub> and d<sub>z²</sub>",["d<sub>xy</sub>, d<sub>yz</sub>, d<sub>zx</sub>","d<sub>xy</sub> and d<sub>z²</sub>","all five equally"],"These point straight at the ligands along the axes and feel the most repulsion."],
  ["Shape of NH<sub>3</sub> and H<sub>2</sub>O by hybridisation:","both sp³: NH₃ trigonal pyramidal, H₂O bent",["both sp²: planar","NH₃ sp², H₂O sp","both sp³d"],"Lone pairs occupy hybrid orbitals and squeeze the bond angles to 107° and 104.5°."],
 ])],
2:[
 // Hess's law: enthalpy of formation from combustion data (PYQ Q2.8)
 ()=>{const [name,c,h,o,dhc]=pick([["methane, CH<sub>4</sub>(g)",1,2,0,-890.36],["ethane, C<sub>2</sub>H<sub>6</sub>(g)",2,3,0,-1560],["ethylene, C<sub>2</sub>H<sub>4</sub>(g)",2,2,0,-1411],["acetylene, C<sub>2</sub>H<sub>2</sub>(g)",2,1,0,-1300],["methanol, CH<sub>3</sub>OH(l)",1,2,0.5,-726]]),C=-393.5,H=-285.83,ans=c*C+h*H-dhc;
  return gbN(`The heats of combustion of C(graphite), H<sub>2</sub>(g) and ${name} are −393.5, −285.83 and ${pfD(dhc,2)} kJ/mol. Find the standard enthalpy of formation of ${name.split(",")[0]} (in kJ/mol).`,ans,"kJ/mol",
   `Hess's law: ΔH<sub>f</sub> = ${c}ΔH<sub>c</sub>(C) + ${h}ΔH<sub>c</sub>(H₂) − ΔH<sub>c</sub>(compound) = ${c}(−393.5) + ${h}(−285.83) − (${pfD(dhc,2)}) = ${pfD(ans,2)} kJ/mol.`,[-ans,c*C+h*H+dhc,ans/2])},
 // hydrogenation enthalpy (PYQ Q2.9)
 ()=>{const a=pick([-1411,-1410]),b=pick([-1560,-1559.8]),h=-285.8,ans=a+h-b;
  return gbN(`Find ΔH for C<sub>2</sub>H<sub>4</sub>(g) + H<sub>2</sub>(g) → C<sub>2</sub>H<sub>6</sub>(g) given the heats of combustion: C<sub>2</sub>H<sub>4</sub> ${a}, C<sub>2</sub>H<sub>6</sub> ${b}, H<sub>2</sub> −285.8 kJ/mol.`,ans,"kJ/mol",
   `ΔH = ΣΔH<sub>c</sub>(reactants) − ΣΔH<sub>c</sub>(products) = (${a} − 285.8) − (${b}) = ${pfD(ans,1)} kJ/mol.`,[-ans,a-h-b,ans*2])},
 // Nernst: Daniell cell EMF (PYQ Q2.10)
 ()=>{const z=pick([0.001,0.01,0.1,1]),cu=pick([0.001,0.01,0.1,1]),E=1.1-0.0591/2*Math.log10(z/cu);
  return gbN(`Find the EMF at 298 K of Zn | Zn<sup>2+</sup>(${z} M) ‖ Cu<sup>2+</sup>(${cu} M) | Cu, given E°(Zn²⁺/Zn) = −0.76 V and E°(Cu²⁺/Cu) = +0.34 V (in V).`,E,"V",
   `E° = 0.34 − (−0.76) = 1.10 V. Cell reaction Zn + Cu²⁺ → Zn²⁺ + Cu, n = 2. E = E° − (0.0591/2) log([Zn²⁺]/[Cu²⁺]) = 1.10 − 0.02955 × log(${pfD(z/cu,4)}) = ${pfD(E,4)} V.`,[1.1,1.1+0.0591/2*Math.log10(z/cu),E-0.03])},
 // ΔG, ΔS, ΔH from EMF and temperature coefficient (PYQ Q2.11)
 ()=>{const ni=pick([0.01,0.02,0.05]),cu=pick([0.1,0.2,0.5]),k=pick([1e-4,2e-4,-1e-4]),E=0.59-0.0591/2*Math.log10(ni/cu),dG=-2*PF_F*E/1000,dS=2*PF_F*k,dH=dG+298*dS/1000,w=rnd(0,2);
  const base=`For Ni | Ni<sup>2+</sup>(${ni} M) ‖ Cu<sup>2+</sup>(${cu} M) | Cu at 298 K (E°(Cu²⁺/Cu) = +0.34 V, E°(Ni²⁺/Ni) = −0.25 V, (∂E/∂T)<sub>P</sub> = ${pfS(k,1)} V/K), `;
  const Etxt=`E = 0.59 − 0.02955 log(${pfD(ni/cu,3)}) = ${pfD(E,4)} V`;
  if(w===0)return gbN(base+"find ΔG (in kJ/mol).",dG,"kJ/mol",`${Etxt}. ΔG = −nFE = −2 × 96485 × ${pfD(E,4)} = ${pfD(dG,2)} kJ/mol.`,[-dG,dG/2,-2*PF_F*0.59/1000]);
  if(w===1)return gbN(base+"find ΔS (in J/(K·mol)).",dS,"J/K",`ΔS = nF(∂E/∂T)<sub>P</sub> = 2 × 96485 × ${pfS(k,1)} = ${pfD(dS,2)} J/(K·mol).`,[-dS,dS/2,PF_F*k]);
  return gbN(base+"find ΔH (in kJ/mol).",dH,"kJ/mol",`${Etxt}; ΔG = ${pfD(dG,2)} kJ, ΔS = ${pfD(dS,2)} J/K. Gibbs–Helmholtz: ΔH = ΔG + TΔS = ${pfD(dG,2)} + 298 × ${pfD(dS/1000,5)} = ${pfD(dH,2)} kJ/mol.`,[dG,dG-298*dS/1000,-dH])},
 // pH with hydrogen electrode vs SCE (PYQ Q2.12)
 ()=>{const pH=pick([1.5,2,3,4,5,6]),Ecal=0.2415,E=Number((Ecal+0.0591*pH).toFixed(4)),ans=(E-Ecal)/0.0591;
  return gbN(`A hydrogen electrode (p<sub>H₂</sub> = 1 atm) against a saturated calomel electrode (0.2415 V) gives an EMF of ${E} V at 298 K. Find the pH of the solution.`,ans,"",
   `E<sub>cell</sub> = E<sub>SCE</sub> − E<sub>H</sub> = 0.2415 + 0.0591 pH, so pH = (${E} − 0.2415)/0.0591 = ${pfD(ans,2)}.`,[ans+1,E/0.0591,(E+Ecal)/0.0591])},
 // ΔG = ΔH − TΔS (PYQ Q2.13)
 ()=>{const dH=pick([-12.55,-30,10,25,-5]),dS=pick([5,-20,40,80,-10]),T=pick([290,298,350,400]),dG=dH-T*dS/1000;
  return gbN(`For a reaction ΔH = ${dH} kJ/mol and ΔS = ${dS} J/(K·mol). Find ΔG at ${T} K (in kJ/mol). Is it spontaneous? (Enter ΔG.)`,dG,"kJ/mol",
   `ΔG = ΔH − TΔS = ${dH} − ${T} × (${dS}/1000) = ${pfD(dG,3)} kJ/mol, so the reaction is ${dG<0?"spontaneous":"not spontaneous"} at ${T} K.`,[dH+T*dS/1000,dH-T*dS,-dG])},
 // standard ΔG from entropies (PYQ Q2.14)
 ()=>{const dH=pick([-282.84,-283]),S=[213.8,197.9,205.01],dS=S[0]-S[1]-0.5*S[2],T=298,dG=dH-T*dS/1000;
  return gbN(`For CO(g) + ½O<sub>2</sub>(g) → CO<sub>2</sub>(g), ΔH° = ${dH} kJ. Standard entropies: CO<sub>2</sub> 213.8, CO 197.9, O<sub>2</sub> 205.01 J/(K·mol). Find ΔG° at 298 K (in kJ).`,dG,"kJ",
   `ΔS° = 213.8 − 197.9 − ½(205.01) = ${pfD(dS,3)} J/K. ΔG° = ΔH° − TΔS° = ${dH} − 298 × (${pfD(dS/1000,5)}) = ${pfD(dG,2)} kJ.`,[dH,dH+T*dS/1000,dG/2])},
 ()=>gbFact([
  ["In an Ellingham diagram, a metal oxide can be reduced by carbon at temperatures where…","the C → CO line lies below the metal-oxide line",["the lines are parallel","the oxide line has negative slope","ΔG° of the oxide is negative"],"The reaction with the more negative ΔG° wins; coupling gives ΔG° < 0 below the crossover."],
  ["The C → CO line in the Ellingham diagram slopes downward because…","ΔS is positive (1 mol gas → 2 mol gas)",["CO is unstable","carbon melts","ΔH is positive"],"Slope = −ΔS; 2C + O₂ → 2CO increases the moles of gas."],
  ["According to Lewis, an acid is…","an electron-pair acceptor",["a proton donor","an OH⁻ donor","an electron-pair donor"],"Lewis widened the idea beyond protons: BF₃ and Al³⁺ are Lewis acids."],
  ["Hess's law is a consequence of…","enthalpy being a state function",["the second law","Le Chatelier's principle","the law of mass action"],"ΔH depends only on initial and final states, not on the path."],
 ])],
3:[
 // temporary and permanent hardness from salts (PYQ Q3.18)
 ()=>{const k=rnd(3,5),tS=pick(PF_HARD.filter(s=>s[2]==="T")),pS=pick(PF_HARD.filter(s=>s[2]==="P")),salts=[tS,pS,...shuffle(PF_HARD.filter(s=>s!==tS&&s!==pS)).slice(0,k-2)];
  const amt=salts.map(()=>pick([10,16.2,20,25,32,40,55,73])),eq=salts.map((s,i)=>amt[i]*100/s[1]);
  const T=eq.reduce((a,v,i)=>a+(salts[i][2]==="T"?v:0),0),P=eq.reduce((a,v,i)=>a+(salts[i][2]==="P"?v:0),0),w=rnd(0,1);
  const list=salts.map((s,i)=>`${s[0]} = ${amt[i]} mg/L`).join(", "),work=salts.map((s,i)=>`${s[0]}: ${amt[i]} × 100/${s[1]} = ${pfD(eq[i],2)}`).join("; ");
  const ans=w===0?T:P;
  return gbN(`A water sample contains ${list}. Find its ${w===0?"temporary":"permanent"} hardness (in mg/L as CaCO<sub>3</sub>).`,ans,"mg/L",
   `Convert each salt: mg/L × 100/(molar mass). ${work}. Bicarbonates give temporary hardness (${pfD(T,2)}); the rest is permanent (${pfD(P,2)}).`,[w===0?P:T,T+P,ans/2])},
 // EDTA titration (PYQ Q3.17)
 ()=>{const V=pick([50,100]),M=pick([0.01,0.02]),v1=pick([15,20,25,30,35]),v2=pick([5,8,10,12]),tot=v1*M*100000/V,perm=v2*M*100000/V,w=rnd(0,2);
  const base=`${V} mL of water needed ${v1} mL of ${M} M EDTA (EBT indicator). After boiling and filtering, ${V} mL of the same water needed ${v2} mL. `;
  const ans=[tot,perm,tot-perm][w];
  return gbN(base+`Find the ${["total","permanent","temporary (carbonate)"][w]} hardness (in mg/L as CaCO<sub>3</sub>).`,ans,"mg/L",
   `1 mL of 1 M EDTA ≡ 100 mg CaCO₃. Total = ${v1} × ${M} × 100 × 1000/${V} = ${pfD(tot,1)} mg/L; permanent = ${v2} × ${M} × 100 × 1000/${V} = ${pfD(perm,1)} mg/L; temporary = total − permanent = ${pfD(tot-perm,1)} mg/L.`,[tot,perm,tot-perm,tot+perm].filter(x=>x!==ans))},
 // zeolite regeneration (PYQ Q3.15/3.16)
 ()=>{const w=rnd(0,1),L=pick([58,100,150,200]),g=pick([100,150,120]),NaCl=L*g,eq=NaCl*50/58.5;
  if(w===0){const V=pick([10000,20000,50000]),h=eq*1000/V;return gbN(`${V} L of hard water was softened by a zeolite softener. Regenerating it needed ${L} L of NaCl solution containing ${g} g/L. Find the hardness of the water (in mg/L as CaCO<sub>3</sub>).`,h,"mg/L",
   `NaCl used = ${L} × ${g} = ${NaCl} g ≡ ${NaCl} × 50/58.5 = ${pfD(eq,1)} g CaCO₃. Hardness = ${pfD(eq,1)} × 1000 mg/${V} L = ${pfD(h,2)} mg/L.`,[h*58.5/50*50/58.5*2,NaCl*1000/V,h/2])}
  const ppm=pick([300,400,500,600]),V=eq*1000/ppm;
  return gbN(`An exhausted zeolite softener was regenerated with ${L} L of NaCl solution (${g} g/L). How many litres of water of hardness ${ppm} ppm can it soften?`,V,"L",
   `NaCl = ${NaCl} g ≡ ${pfD(eq,1)} g of CaCO₃ hardness. Volume = ${pfD(eq,1)} × 1000/${ppm} = ${pfD(V,0)} L.`,[V*2,NaCl*1000/ppm,V/2])},
 // lime and soda (PYQ Q3.13)
 ()=>{const vol=pick([10000,50000,100000]),a=pick([16.2,32.4]),b=pick([7.3,14.6]),c=pick([13.6,27.2]),d=pick([9.5,19]),pl=pick([80,85,90]),ps=pick([90,95,100]);
  const eA=a*100/162,eB=b*100/146,eC=c*100/136,eD=d*100/95,lime=0.74*(eA+2*eB+eD)*vol/1e6*100/pl,soda=1.06*(eC+eD)*vol/1e6*100/ps,w=rnd(0,1);
  const base=`Water contains Ca(HCO<sub>3</sub>)<sub>2</sub> ${a}, Mg(HCO<sub>3</sub>)<sub>2</sub> ${b}, CaSO<sub>4</sub> ${c} and MgCl<sub>2</sub> ${d} mg/L. For ${vol} L, `;
  const eqs=`As CaCO₃: ${pfD(eA,1)}, ${pfD(eB,1)}, ${pfD(eC,1)}, ${pfD(eD,1)} mg/L.`;
  if(w===0)return gbN(base+`find the lime needed (${pl}% pure), in kg.`,lime,"kg",`${eqs} Lime = (74/100)[Ca(HCO₃)₂ + 2Mg(HCO₃)₂ + MgCl₂] × V × 100/purity = 0.74 × ${pfD(eA+2*eB+eD,1)} × ${vol}×10⁻⁶ × 100/${pl} = ${pfD(lime,3)} kg.`,[lime*pl/100,soda,lime*2]);
  return gbN(base+`find the soda needed (${ps}% pure), in kg.`,soda,"kg",`${eqs} Soda = (106/100)[CaSO₄ + MgCl₂] × V × 100/purity = 1.06 × ${pfD(eC+eD,1)} × ${vol}×10⁻⁶ × 100/${ps} = ${pfD(soda,3)} kg.`,[soda*ps/100,lime,soda*2])},
 ()=>gbFact([
  ["In the ion-exchange (demineralisation) process, the cation exchanger is regenerated with…","dilute HCl (or H₂SO₄)",["NaOH","NaCl brine","lime water"],"R–H resins lose H⁺ to Ca²⁺/Mg²⁺; acid restores the H⁺ form. The anion exchanger uses NaOH."],
  ["Rusting of iron in neutral, aerated water follows…","the oxygen-absorption mechanism: O₂ + 2H₂O + 4e⁻ → 4OH⁻ at the cathode",["the hydrogen-evolution mechanism","direct chemical attack by O₂","only galvanic corrosion with zinc"],"In neutral/basic media dissolved O₂ is reduced; Fe²⁺ + OH⁻ → Fe(OH)₂ → rust."],
  ["In sacrificial-anode cathodic protection, the anode is made of…","a more active metal such as Mg or Zn",["platinum","copper","graphite"],"The more active metal corrodes instead of the protected steel."],
  ["Galvanising is a sacrificial coating because…","zinc is more active than iron and corrodes first even if the coat is scratched",["zinc is nobler than iron","it seals out oxygen only","tin and zinc behave the same"],"Tinning is a noble coating: once scratched, iron corrodes faster."],
  ["Calgon conditioning prevents scale because sodium hexametaphosphate…","forms soluble complexes with Ca²⁺",["precipitates CaCO₃ as sludge","raises the pH","removes dissolved O₂"],"Na₂[Na₄(PO₃)₆] + 2CaSO₄ → Na₂[Ca₂(PO₃)₆] + 2Na₂SO₄ stays in solution."],
  ["Hard water wastes soap because…","Ca²⁺ and Mg²⁺ form insoluble calcium/magnesium soaps",["it is acidic","it contains dissolved CO₂","it is too cold"],"2C₁₇H₃₅COONa + Ca²⁺ → (C₁₇H₃₅COO)₂Ca↓ until the hardness is used up."],
 ])],
4:[
 // bomb calorimeter (PYQ Q4.10/4.11/4.12)
 ()=>{const m=pick([0.5,0.75,0.98,1]),W=pick([600,1000,1500,2000]),w=pick([1000,1900,2200,2500]),dT=Number((pick([6500,7200,7800,8400])*m/(W+w)).toFixed(2)),cool=pick([0,0.02,0.05]),fuse=pick([8,10,18]),acid=pick([40,50]),H=pick([5,6,10,15]),L=pick([580,587]),q=rnd(0,1);
  const G=((W+w)*(dT+cool)-(fuse+acid))/m,N=G-0.09*H*L;
  const base=`In a bomb calorimeter, ${m} g of coal (${H}% H) was burnt. Water taken ${W} g, water equivalent ${w} g, temperature rise ${dT} °C, cooling correction ${cool} °C, fuse-wire correction ${fuse} cal, acid correction ${acid} cal. Latent heat of steam ${L} cal/g. `;
  if(q===0)return gbN(base+"Find the gross calorific value (in cal/g).",G,"cal/g",`GCV = [(W + w)(ΔT + t<sub>c</sub>) − (fuse + acid)]/m = [(${W}+${w})(${dT}+${cool}) − ${fuse+acid}]/${m} = ${pfD(G,1)} cal/g.`,[N,(W+w)*dT/m,G*1.1]);
  return gbN(base+"Find the net calorific value (in cal/g).",N,"cal/g",`GCV = ${pfD(G,1)} cal/g. NCV = GCV − 0.09 × H% × latent heat = ${pfD(G,1)} − 0.09 × ${H} × ${L} = ${pfD(N,1)} cal/g.`,[G,G-H*L/100,N*0.9])},
 // viscosity index (PYQ Q4.13)
 ()=>{const H=pick([400,500]),L=pick([700,800,900]),U=rnd(H+20,L-20),VI=(L-U)/(L-H)*100;
  return gbN(`An oil has Saybolt viscosity ${U} s at 100 °F. Standard oils with the same viscosity at 210 °F have ${H} s (Pennsylvanian, VI 100) and ${L} s (Gulf, VI 0) at 100 °F. Find the viscosity index.`,VI,"",
   `VI = (L − U)/(L − H) × 100 = (${L} − ${U})/(${L} − ${H}) × 100 = ${pfD(VI,2)}.`,[(U-H)/(L-H)*100,100-VI/2,VI/100])},
 // degree of polymerisation
 ()=>{const [p,mono,M0]=pick([["polyethylene","ethylene (28 g/mol)",28],["PVC","vinyl chloride (62.5 g/mol)",62.5],["polystyrene","styrene (104 g/mol)",104],["PTFE (Teflon)","tetrafluoroethylene (100 g/mol)",100],["PAN","acrylonitrile (53 g/mol)",53]]),dp=pick([500,1000,1500,2000,3500]),M=dp*M0;
  return gbN(`A sample of ${p} has a molecular mass of ${M} g/mol. The monomer is ${mono}. Find the degree of polymerisation.`,dp,"",`DP = M(polymer)/M(monomer) = ${M}/${M0} = ${dp}.`,[dp*2,dp/2,M/28])},
 ()=>gbFact([
  ["Monomers of Nylon-6,6:","hexamethylenediamine and adipic acid",["caprolactam","ethylene glycol and terephthalic acid","butadiene and styrene"],"Each monomer has 6 carbons, hence 6,6; it is a condensation polymer (water lost)."],
  ["Monomers of PET (terylene):","ethylene glycol and terephthalic acid",["ethylene and propylene","vinyl chloride","methyl methacrylate"],"Ester links form by condensation: polyethylene terephthalate."],
  ["Buna-S is a copolymer of…","1,3-butadiene and styrene",["butadiene and acrylonitrile","isoprene alone","chloroprene"],"Buna-N uses acrylonitrile instead and resists oil."],
  ["PMMA (Perspex/acrylic glass) is made from…","methyl methacrylate",["methyl acrylate and styrene","acrylonitrile","vinyl acetate"],"Addition polymerisation of CH₂=C(CH₃)COOCH₃."],
  ["Vulcanisation improves natural rubber because sulfur…","forms cross-links between chains",["breaks the chains","removes double bonds completely","makes rubber water-soluble"],"Cross-links stop chains sliding: more strength, elasticity and less stickiness."],
  ["In hydrodynamic (fluid-film) lubrication…","a thick oil film completely separates the surfaces",["metal surfaces touch at asperities","a solid like graphite carries the load","additives react with the metal"],"It happens at high speed, low load and enough viscosity: the Stribeck curve minimum."],
  ["Why can methanol not polymerise?","its functionality is 1 (only one reactive group)",["it is too volatile","it has a double bond","it is an alcohol of high mass"],"A monomer needs a functionality of at least 2 to grow a chain."],
  ["Conductivity of polyacetylene rises enormously on doping with I₂ because…","oxidation creates mobile positive charge carriers (polarons) along the conjugated chain",["iodine is a metal","the chain becomes saturated","electrons leave the polymer entirely"],"p-type doping removes π-electrons, creating charge carriers that move along the conjugation."],
 ])],
5:[
 // vibrational degrees of freedom
 ()=>{const [m,N,lin]=pick([["H<sub>2</sub>O",3,0],["CO<sub>2</sub>",3,1],["CH<sub>4</sub>",5,0],["NH<sub>3</sub>",4,0],["C<sub>6</sub>H<sub>6</sub>",12,0],["C<sub>2</sub>H<sub>2</sub>",4,1],["HCl",2,1],["SO<sub>2</sub>",3,0],["CS<sub>2</sub>",3,1]]),f=lin?3*N-5:3*N-6;
  return gbN(`How many fundamental vibrational modes does ${m} have?`,f,"",`${m} has N = ${N} atoms and is ${lin?"linear: 3N − 5":"non-linear: 3N − 6"} = ${f}.`,[lin?3*N-6:3*N-5,3*N,f+1])},
 // isotope shift H2O -> D2O (PYQ Q5.14)
 ()=>{const nu=pick([3652,3756,3657,3700]),muH=16*1/17,muD=16*2/18,ans=nu*Math.sqrt(muH/muD);
  return gbN(`An O–H stretching vibration of H<sub>2</sub>O is at ${nu} cm⁻¹. Treating it as an O–H oscillator with the same force constant, find the corresponding O–D frequency in D<sub>2</sub>O (in cm⁻¹).`,ans,"cm⁻¹",
   `ν ∝ 1/√μ. μ(OH) = 16×1/17 = ${pfD(muH,4)}, μ(OD) = 16×2/18 = ${pfD(muD,4)}. ν(OD) = ${nu} × √(${pfD(muH,4)}/${pfD(muD,4)}) = ${pfD(ans,1)} cm⁻¹ (close to ν/√2).`,[nu/2,nu*Math.SQRT2,nu/Math.SQRT2])},
 // bond length from rotational line spacing (PYQ Q5.15)
 ()=>{const [m,mA,mB,sp]=pick([["H<sup>80</sup>Br",1,80,16.94],["H<sup>35</sup>Cl",1,35,20.68],["<sup>12</sup>C<sup>16</sup>O",12,16,3.86],["H<sup>19</sup>F",1,19,41.9]]),B=sp/2,mu=mA*mB/(mA+mB)*1.6605e-27,I=PF_H/(8*Math.PI*Math.PI*2.998e10*B),r=Math.sqrt(I/mu)*1e12;
  return gbN(`The rotational lines of ${m} are spaced by ${sp} cm⁻¹. Find the bond length (in pm). (Use atomic masses ${mA} and ${mB} u.)`,r,"pm",
   `Spacing = 2B, so B = ${pfD(B,3)} cm⁻¹. I = h/(8π²cB) = ${pfS(I,3)} kg·m². μ = ${mA}×${mB}/(${mA+mB}) u = ${pfS(mu,3)} kg. r = √(I/μ) = ${pfD(r,1)} pm.`,[r*2,r/Math.SQRT2,r*Math.SQRT2])},
 // Beer–Lambert
 ()=>{const eps=pick([1200,2500,8000,15000]),l=pick([1,2]),A=pick([0.2,0.35,0.5,0.8]),c=A/(eps*l)*1e6;
  return gbN(`A solution in a ${l} cm cell has absorbance ${A}. The molar absorptivity is ${eps} L mol⁻¹ cm⁻¹. Find the concentration (in μmol/L).`,c,"μM",`Beer–Lambert: A = εcl, so c = A/(εl) = ${A}/(${eps} × ${l}) = ${pfS(c*1e-6,3)} mol/L = ${pfD(c,2)} μmol/L.`,[c*l*l,c*2,A*eps*l])},
 // NMR signals
 ()=>{const [m,n,why]=pick([["CH<sub>3</sub>CH<sub>2</sub>Cl",2,"CH₃ and CH₂"],["C<sub>6</sub>H<sub>6</sub>",1,"all six H equivalent"],["CH<sub>3</sub>OCH<sub>3</sub>",1,"two equivalent CH₃ groups"],["CH<sub>3</sub>CH<sub>2</sub>OH",3,"CH₃, CH₂ and OH"],["CH<sub>3</sub>CH(Cl)CH<sub>3</sub>",2,"two equivalent CH₃ and one CH"],["CH<sub>3</sub>COCH<sub>3</sub>",1,"two equivalent CH₃"],["CH<sub>3</sub>CHO",2,"CH₃ and CHO"],["(CH<sub>3</sub>)<sub>3</sub>C–C<sub>6</sub>H<sub>5</sub>",2,"9 tert-butyl H and the 5 ring H (at low resolution)"],["CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>Br",3,"CH₃, middle CH₂, CH₂Br"]]);
  return gbN(`How many signals appear in the ¹H NMR spectrum of ${m}?`,n,"",`Count sets of chemically equivalent protons: ${why} → ${n} signal${n===1?"":"s"}.`,[n+1,n+2,n>1?n-1:4])},
 ()=>{const [grp,nb,mult]=pick([["the CH<sub>2</sub> group of CH<sub>3</sub>CH<sub>2</sub>Cl",3,"quartet"],["the CH<sub>3</sub> group of CH<sub>3</sub>CH<sub>2</sub>Cl",2,"triplet"],["the CH of (CH<sub>3</sub>)<sub>2</sub>CHCl",6,"septet"],["the CH<sub>3</sub> groups of (CH<sub>3</sub>)<sub>2</sub>CHCl",1,"doublet"],["the CH<sub>2</sub>Br of isobutyl bromide",1,"doublet"]]);
  return gbN(`Using the n + 1 rule, how many peaks does ${grp} show?`,nb+1,"",`It has ${nb} neighbouring equivalent H, so it splits into ${nb}+1 = ${nb+1} peaks (a ${mult}).`,[nb,nb+2,2*nb+1])},
 ()=>gbFact([
  ["TMS is used as the NMR reference because…","its 12 equivalent, highly shielded protons give one sharp peak upfield of almost everything",["it reacts with the sample","it is ionic","it absorbs UV light"],"It is inert, volatile and its δ = 0 lies away from most signals."],
  ["An S<sub>N</sub>2 reaction gives…","inversion of configuration (Walden inversion) in one step",["racemisation via a carbocation","retention of configuration","a free radical"],"The nucleophile attacks from the back side through a 5-coordinate transition state; rate = k[RX][Nu]."],
  ["Tertiary alkyl halides prefer S<sub>N</sub>1 because…","they form stable tertiary carbocations and are too crowded for back-side attack",["they are less polar","S<sub>N</sub>1 needs a strong nucleophile","they have no β-hydrogens"],"Rate = k[RX] only; the planar carbocation is attacked from both sides → racemic product."],
  ["Butadiene absorbs at a longer λ<sub>max</sub> than ethylene because…","conjugation lowers the π → π* gap",["it has more σ bonds","it is heavier","it has lone pairs"],"Extended conjugation raises the HOMO and lowers the LUMO: a bathochromic shift."],
  ["Which molecule is IR-inactive?","N<sub>2</sub>",["CO","HCl","H<sub>2</sub>O"],"A vibration is IR-active only if the dipole moment changes; homonuclear diatomics have none."],
  ["The Diels–Alder reaction is a…","[4+2] cycloaddition of a conjugated diene and a dienophile",["[2+2] photo-cycloaddition","free-radical substitution","nucleophilic addition"],"It forms a six-membered ring in one concerted step."],
  ["Aspirin is made from salicylic acid by…","acetylation with acetic anhydride (acid catalyst)",["nitration","oxidation with KMnO₄","esterification with methanol"],"The phenolic –OH is acetylated to give acetylsalicylic acid."],
 ])],
});

/* =========================================================== EET-001 BASIC ELECTRICAL */
genAdd("EET-001",{
1:[
 // Millman / superposition: two sources feeding a middle resistor (PYQ Q1.7)
 ()=>{const V1=pick([10,12,15,20]),R1=pick([5,10,20]),V2=pick([10,20,24,30]),R2=pick([10,20,30]),R=pick([20,30,40,60]),Vab=(V1/R1+V2/R2)/(1/R1+1/R2+1/R),I=Vab/R;
  const I1=V1/R1/(1/R1+1/R2+1/R)/R, I2=V2/R2/(1/R1+1/R2+1/R)/R;
  PF_VERIFY(Math.abs(I1+I2-I)<1e-9,"superposition adds");
  return gbN(`Source 1 (${V1} V in series with ${R1} Ω) and source 2 (${V2} V in series with ${R2} Ω) both feed a ${R} Ω resistor connected between A and B (all in parallel, same polarity). Using superposition, find the current in the ${R} Ω resistor (in A).`,I,"A",
   `Source 1 alone: ${pfD(I1,4)} A; source 2 alone: ${pfD(I2,4)} A; total ${pfD(I,4)} A. (Check by Millman: V<sub>AB</sub> = (V₁/R₁ + V₂/R₂)/(1/R₁ + 1/R₂ + 1/R) = ${pfD(Vab,3)} V, I = V<sub>AB</sub>/R.)`,[I1,I2,(V1+V2)/(R1+R2+R)])},
 // equal resistances series vs parallel power
 ()=>{const P=pick([40,60,80,100,150]),n=pick([2,3]),Pp=P*n*n;
  return gbN(`${n} equal resistances take ${P} W in series across a fixed battery. How much power do they take when reconnected in parallel across the same battery (in W)?`,Pp,"W",`Series R<sub>s</sub> = ${n}R, parallel R<sub>p</sub> = R/${n}. P = V²/R, so P<sub>p</sub>/P<sub>s</sub> = R<sub>s</sub>/R<sub>p</sub> = ${n*n}. P<sub>p</sub> = ${n*n} × ${P} = ${Pp} W.`,[P*n,P/n,P])},
 // series-parallel current division (PYQ Q1.10)
 ()=>{const [a,b]=pick([[20,30],[10,40],[6,12],[30,60],[15,30]]),R=pick([5,10,15,20]),I=pick([2,3,4,5]),w=rnd(0,2),p=a*b/(a+b);
  const base=`${a} Ω and ${b} Ω in parallel are connected in series with ${R} Ω. The current in the ${R} Ω resistor is ${I} A. `;
  if(w===0)return gbN(base+`Find the current in the ${a} Ω resistor (in A).`,I*b/(a+b),"A",`Current division: I<sub>${a}</sub> = I × ${b}/(${a}+${b}) = ${I} × ${b}/${a+b} = ${pfD(I*b/(a+b),3)} A.`,[I*a/(a+b),I/2,I]);
  if(w===1)return gbN(base+`Find the current in the ${b} Ω resistor (in A).`,I*a/(a+b),"A",`I<sub>${b}</sub> = I × ${a}/(${a}+${b}) = ${pfD(I*a/(a+b),3)} A.`,[I*b/(a+b),I/2,I]);
  return gbN(base+"Find the total applied voltage (in V).",I*(R+p),"V",`R<sub>eq</sub> = ${R} + ${a}∥${b} = ${R} + ${pfD(p,2)} = ${pfD(R+p,2)} Ω; V = ${I} × ${pfD(R+p,2)} = ${pfD(I*(R+p),2)} V.`,[I*(R+a+b),I*R,I*p])},
 // RC charging / RL current
 ()=>{const w=rnd(0,1),V=pick([10,12,24]),t=pick([1,2,3]);
  if(w===0){const R=pick([1,2,5,10]),C=pick([100,200,500]),tau=R*C/1000,v=V*(1-Math.exp(-t/tau));
   return gbN(`A ${C} μF capacitor charges through ${R} kΩ from a ${V} V DC source. Find the capacitor voltage ${t} s after switching on (in V).`,v,"V",`τ = RC = ${R}×10³ × ${C}×10⁻⁶ = ${pfD(tau,3)} s. v = V(1 − e<sup>−t/τ</sup>) = ${V}(1 − e<sup>−${pfD(t/tau,3)}</sup>) = ${pfD(v,3)} V. After 5τ it is practically fully charged.`,[V*Math.exp(-t/tau),V*0.632,V])}
  const R=pick([2,4,5,10]),L=pick([1,2,4]),tau=L/R,i=V/R*(1-Math.exp(-t*0.1/tau));
  return gbN(`A coil of inductance ${L} H and resistance ${R} Ω is switched across ${V} V DC. Find the current ${pfD(t*0.1,1)} s later (in A).`,i,"A",`τ = L/R = ${pfD(tau,3)} s; final current V/R = ${pfD(V/R,3)} A. i = (V/R)(1 − e<sup>−t/τ</sup>) = ${pfD(i,3)} A.`,[V/R,V/R*0.632,V/R*Math.exp(-t*0.1/tau)])},
 // max power with a bridge-like source (PYQ Q1.9 style): Thevenin of V–R1–(R2∥R3)
 ()=>{const V=pick([6,12,24]),R1=pick([4,6,8]),R2=pick([8,12,6]),R3=pick([12,24,6]),Rp=R2*R3/(R2+R3),Vth=V*Rp/(R1+Rp),Rth=R1*Rp/(R1+Rp),P=Vth*Vth/(4*Rth),w=rnd(0,1);
  const base=`A ${V} V source in series with ${R1} Ω feeds two parallel resistors ${R2} Ω and ${R3} Ω; a load R<sub>L</sub> is connected across them. `;
  if(w===0)return gbN(base+"For maximum power transfer, what should R<sub>L</sub> be (in Ω)?",Rth,"Ω",`Remove R<sub>L</sub> and short the source: R<sub>th</sub> = ${R1} ∥ ${R2} ∥ ${R3} = ${pfD(Rth,3)} Ω. Maximum power when R<sub>L</sub> = R<sub>th</sub>.`,[R1,Rp,R1+Rp]);
  return gbN(base+"Find the maximum power the load can receive (in W).",P,"W",`V<sub>th</sub> = ${V} × ${pfD(Rp,3)}/(${R1}+${pfD(Rp,3)}) = ${pfD(Vth,3)} V; R<sub>th</sub> = ${pfD(Rth,3)} Ω. P<sub>max</sub> = V<sub>th</sub>²/(4R<sub>th</sub>) = ${pfD(P,3)} W.`,[Vth*Vth/Rth,P*2,V*V/(4*R1)])},
 ()=>gbFact([
  ["Superposition cannot be used directly to find…","power in a resistor",["current in a branch","voltage across an element","Thevenin voltage"],"Power ∝ I² is not linear: (I₁ + I₂)² ≠ I₁² + I₂²."],
  ["In DC steady state, an inductor behaves as… and a capacitor as…","a short circuit; an open circuit",["an open circuit; a short circuit","a resistor; a resistor","a source; a load"],"di/dt = 0 gives v<sub>L</sub> = 0; dv/dt = 0 gives i<sub>C</sub> = 0."],
  ["Efficiency at maximum power transfer is…","50%",["100%","75%","25%"],"Equal power is lost in R<sub>th</sub> as delivered to R<sub>L</sub>."],
  ["A diode is an example of a … element.","non-linear and unilateral",["linear and bilateral","passive and bilateral","linear and unilateral"],"Its V–I curve is not a straight line and it conducts differently in the two directions."],
  ["Three equal 10 Ω resistors in star are equivalent to a delta of…","30 Ω each",["10 Ω each","3.33 Ω each","20 Ω each"],"R<sub>Δ</sub> = 3R<sub>Y</sub> for a balanced network."],
 ])],
2:[
 // series RLC
 ()=>{const R=pick([10,20,30,50]),L=pick([0.1,0.2,0.5]),C=pick([10,20,50,100]),f=50,V=230,XL=2*Math.PI*f*L,XC=1/(2*Math.PI*f*C*1e-6),Z=Math.sqrt(R*R+(XL-XC)**2),w=rnd(0,2);
  const base=`A series circuit has R = ${R} Ω, L = ${L} H and C = ${C} μF on 230 V, 50 Hz. `;
  if(w===0)return gbN(base+"Find the current (in A).",V/Z,"A",`X<sub>L</sub> = 2πfL = ${pfD(XL,2)} Ω, X<sub>C</sub> = 1/(2πfC) = ${pfD(XC,2)} Ω, Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²) = ${pfD(Z,2)} Ω, I = V/Z = ${pfD(V/Z,3)} A.`,[V/R,V/(R+XL+XC),V/Z*2]);
  if(w===1)return gbN(base+"Find the power factor.",R/Z,"",`Z = ${pfD(Z,2)} Ω; cos φ = R/Z = ${pfD(R/Z,4)} (${XL>XC?"lagging":"leading"}).`,[Z/R>1?R/Z/2:0.5,Math.abs(XL-XC)/Z,R/(R+Math.abs(XL-XC))]);
  const f0=1/(2*Math.PI*Math.sqrt(L*C*1e-6));
  return gbN(base+"Find the resonant frequency (in Hz).",f0,"Hz",`f₀ = 1/(2π√(LC)) = 1/(2π√(${L} × ${C}×10⁻⁶)) = ${pfD(f0,2)} Hz.`,[f0*2*Math.PI,f0/2,1/Math.sqrt(L*C*1e-6)])},
 // Q-factor and bandwidth
 ()=>{const R=pick([5,10,20]),L=pick([0.05,0.1,0.2]),C=pick([1,2,5,10]),f0=1/(2*Math.PI*Math.sqrt(L*C*1e-6)),Q=Math.sqrt(L/(C*1e-6))/R,w=rnd(0,1);
  if(w===0)return gbN(`Find the quality factor of a series RLC circuit with R = ${R} Ω, L = ${L} H, C = ${C} μF.`,Q,"",`Q = (1/R)√(L/C) = (1/${R})√(${L}/${C}×10⁻⁶) = ${pfD(Q,3)}.`,[Q*R,Q/2,Q*2]);
  return gbN(`A series RLC circuit has R = ${R} Ω, L = ${L} H and C = ${C} μF. Find its bandwidth (in Hz).`,R/(2*Math.PI*L),"Hz",`BW = f₂ − f₁ = R/(2πL) = ${R}/(2π × ${L}) = ${pfD(R/(2*Math.PI*L),3)} Hz (= f₀/Q with f₀ = ${pfD(f0,1)} Hz).`,[R/L,f0,R/(4*Math.PI*L)])},
 // two-wattmeter method (PYQ Q2.9)
 ()=>{const W1=pick([20,8,10,6,12]),W2=pick([5,4,2,3,6]),P=W1+W2,tphi=Math.sqrt(3)*(W1-W2)/(W1+W2),pf=Math.cos(Math.atan(tphi)),w=rnd(0,2),V=400;
  if(w===0)return gbN(`In the two-wattmeter method on a balanced 3-phase load the readings are ${W1} kW and ${W2} kW. Find the total power (in kW).`,P,"kW",`Total power = W₁ + W₂ = ${W1} + ${W2} = ${P} kW.`,[W1-W2,P*Math.sqrt(3),P/2]);
  if(w===1)return gbN(`Two wattmeters on a balanced 3-phase load read ${W1} kW and ${W2} kW. Find the power factor.`,pf,"",`tan φ = √3(W₁ − W₂)/(W₁ + W₂) = √3 × ${W1-W2}/${P} = ${pfD(tphi,4)}, φ = ${pfD(pfDeg(Math.atan(tphi)),2)}°, power factor = cos φ = ${pfD(pf,4)}.`,[W2/W1,Math.sin(Math.atan(tphi)),tphi]);
  const IL=P*1000/(Math.sqrt(3)*V*pf);
  return gbN(`Two wattmeters on a balanced load across ${V} V, 50 Hz read ${W1} kW and ${W2} kW. Find the line current (in A).`,IL,"A",`P = ${P} kW; pf = cos(tan⁻¹(√3(W₁ − W₂)/(W₁ + W₂))) = ${pfD(pf,4)}. I<sub>L</sub> = P/(√3 V<sub>L</sub> cos φ) = ${P*1000}/(√3 × ${V} × ${pfD(pf,4)}) = ${pfD(IL,2)} A.`,[P*1000/(3*V*pf),P*1000/(Math.sqrt(3)*V),IL*Math.sqrt(3)])},
 // star / delta line and phase values
 ()=>{const VL=pick([400,415,440]),Z=pick([10,20,25]),pf=pick([0.8,0.6,0.866]),star=coin(.5),Vph=star?VL/Math.sqrt(3):VL,Iph=Vph/Z,IL=star?Iph:Iph*Math.sqrt(3),P=Math.sqrt(3)*VL*IL*pf/1000;
  return gbN(`Three identical impedances of ${Z} Ω (power factor ${pf} lagging) are connected in ${star?"star":"delta"} across a ${VL} V, 3-phase supply. Find the total power (in kW).`,P,"kW",
   `${star?"Star: V<sub>ph</sub> = V<sub>L</sub>/√3":"Delta: V<sub>ph</sub> = V<sub>L</sub>"} = ${pfD(Vph,2)} V; I<sub>ph</sub> = ${pfD(Iph,3)} A; I<sub>L</sub> = ${star?"I<sub>ph</sub>":"√3 I<sub>ph</sub>"} = ${pfD(IL,3)} A. P = √3 V<sub>L</sub>I<sub>L</sub> cos φ = ${pfD(P,3)} kW.`,[P*3,P/3,Math.sqrt(3)*VL*IL/1000])},
 ()=>{const Vm=pick([100,170,230,311,325]),w=rnd(0,1);
  if(w===0)return gbN(`A sinusoidal voltage has a peak of ${Vm} V. Find its RMS value (in V).`,Vm/Math.SQRT2,"V",`V<sub>rms</sub> = V<sub>m</sub>/√2 = ${Vm}/1.414 = ${pfD(Vm/Math.SQRT2,2)} V.`,[Vm*2/Math.PI,Vm/2,Vm*Math.SQRT2]);
  return gbN(`A sinusoidal voltage has a peak of ${Vm} V. Find its average (half-cycle) value (in V).`,2*Vm/Math.PI,"V",`V<sub>avg</sub> = 2V<sub>m</sub>/π = ${pfD(2*Vm/Math.PI,2)} V. Form factor = V<sub>rms</sub>/V<sub>avg</sub> = 1.11.`,[Vm/Math.SQRT2,Vm/2,Vm/Math.PI])},
],
3:[
 // transformer EMF equation
 ()=>{const f=50,N=pick([200,300,500,800,1000]),phi=pick([5,8,10,12,15]),E=4.44*f*N*phi*1e-3;
  return gbN(`The primary of a 50 Hz transformer has ${N} turns and the maximum core flux is ${phi} mWb. Find the induced EMF (in V).`,E,"V",`E = 4.44 f N Φ<sub>m</sub> = 4.44 × 50 × ${N} × ${phi}×10⁻³ = ${pfD(E,2)} V.`,[E/4.44*Math.PI*Math.SQRT2/Math.SQRT2,E/Math.SQRT2,E*2])},
 // efficiency at a fraction of load
 ()=>{const S=pick([10,20,25,50]),Pi=pick([0.15,0.2,0.3,0.5]),Pc=pick([0.3,0.4,0.6,0.8]),x=pick([0.5,0.75,1]),pf=pick([0.8,1]),out=x*S*pf,eta=out/(out+Pi+x*x*Pc)*100;
  return gbN(`A ${S} kVA transformer has iron loss ${Pi} kW and full-load copper loss ${Pc} kW. Find its efficiency at ${x===1?"full":x===0.75?"three-quarter":"half"} load, power factor ${pf} (in %).`,eta,"%",
   `Output = ${x} × ${S} × ${pf} = ${pfD(out,3)} kW. Copper loss = x² × ${Pc} = ${pfD(x*x*Pc,4)} kW. η = output/(output + P<sub>i</sub> + x²P<sub>cu</sub>) = ${pfD(eta,3)}%.`,[out/(out+Pi+Pc)*100,out/(out+Pi)*100,eta-1])},
 // load for maximum efficiency
 ()=>{const S=pick([10,20,50,100]),Pi=pick([0.2,0.3,0.5,1]),Pc=pick([0.5,0.8,1.2,2]),x=Math.sqrt(Pi/Pc);
  return gbN(`A ${S} kVA transformer has iron loss ${Pi} kW and full-load copper loss ${Pc} kW. At what load (in kVA) is its efficiency maximum?`,x*S,"kVA",`Maximum efficiency when copper loss = iron loss: x = √(P<sub>i</sub>/P<sub>cu</sub>) = √(${Pi}/${Pc}) = ${pfD(x,4)}, i.e. ${pfD(x*S,2)} kVA.`,[S*Pi/Pc,S,x*S/2])},
 // magnetic circuit
 ()=>{const l=pick([0.3,0.5,0.8]),A=pick([4,5,10]),mur=pick([500,800,1000,2000]),N=pick([200,300,500]),I=pick([0.5,1,2]),Rel=l/(PF_M0*mur*A*1e-4),phi=N*I/Rel*1e3;
  return gbN(`An iron ring has mean length ${l} m, cross-section ${A} cm² and relative permeability ${mur}. A ${N}-turn coil carries ${I} A. Find the flux (in mWb).`,phi,"mWb",`Reluctance S = l/(μ₀μ<sub>r</sub>A) = ${pfS(Rel,3)} A/Wb; MMF = NI = ${N*I} A; Φ = MMF/S = ${pfD(phi,4)} mWb.`,[phi*2,phi/2,phi*mur/1000])},
 ()=>gbFact([
  ["The open-circuit test on a transformer gives…","the iron (core) loss",["the copper loss","the equivalent resistance","the efficiency directly"],"With the secondary open, current is small, so the input power is almost all core loss."],
  ["The short-circuit test on a transformer gives…","the full-load copper loss and equivalent impedance",["the iron loss","the turns ratio only","the magnetising current"],"Rated current flows at reduced voltage, so core loss is negligible."],
  ["A PMMC instrument can measure…","DC only",["AC only","both AC and DC","only power"],"The torque reverses with current direction, so it averages to zero on AC."],
  ["A moving-iron instrument has a … scale.","non-uniform (square-law)",["uniform","logarithmic","reversed"],"Deflecting torque ∝ I², so markings are crowded at the start."],
  ["Eddy-current loss is reduced by…","laminating the core",["using thicker solid iron","increasing frequency","using copper cores"],"Thin insulated sheets break up the eddy current paths: P<sub>e</sub> ∝ t²."],
 ])],
4:[
 // DC generator EMF
 ()=>{const P=pick([2,4,6]),Z=pick([400,480,600,720]),phi=pick([20,25,30]),N=pick([1000,1200,1500]),lap=coin(.5),A=lap?P:2,E=P*phi*1e-3*Z*N/(60*A);
  return gbN(`A ${P}-pole DC generator with a ${lap?"lap":"wave"}-wound armature of ${Z} conductors runs at ${N} rpm with ${phi} mWb per pole. Find the generated EMF (in V).`,E,"V",`E = PΦZN/(60A) with A = ${lap?"P":"2"} = ${A}: ${P} × ${phi}×10⁻³ × ${Z} × ${N}/(60 × ${A}) = ${pfD(E,2)} V.`,[E*(lap?P/2:2/P),E*2,E/2])},
 // DC motor back EMF and speed
 ()=>{const V=pick([220,230,250]),Ra=pick([0.2,0.4,0.5,1]),Ia=pick([10,20,30,40]),Eb=V-Ia*Ra,w=rnd(0,1);
  if(w===0)return gbN(`A ${V} V DC shunt motor has armature resistance ${Ra} Ω and takes ${Ia} A armature current. Find the back EMF (in V).`,Eb,"V",`E<sub>b</sub> = V − I<sub>a</sub>R<sub>a</sub> = ${V} − ${Ia} × ${Ra} = ${pfD(Eb,2)} V.`,[V+Ia*Ra,V,Ia*Ra]);
  const N1=pick([1000,1200,1500]),Ia2=Ia*2,Eb2=V-Ia2*Ra,N2=N1*Eb2/Eb;
  return gbN(`A ${V} V DC shunt motor (R<sub>a</sub> = ${Ra} Ω) runs at ${N1} rpm taking ${Ia} A. The load doubles the armature current (flux constant). Find the new speed (in rpm).`,N2,"rpm",`E<sub>b1</sub> = ${pfD(Eb,2)} V, E<sub>b2</sub> = ${V} − ${Ia2} × ${Ra} = ${pfD(Eb2,2)} V. N ∝ E<sub>b</sub>: N₂ = ${N1} × ${pfD(Eb2,2)}/${pfD(Eb,2)} = ${pfD(N2,1)} rpm.`,[N1,N1/2,N1*Eb/Eb2])},
 // induction motor slip
 ()=>{const f=pick([50,60]),P=pick([2,4,6,8]),Ns=120*f/P,s=pick([0.02,0.03,0.04,0.05]),N=Ns*(1-s),w=rnd(0,2);
  if(w===0)return gbN(`A ${P}-pole, ${f} Hz induction motor runs at ${pfD(N,1)} rpm. Find its slip (in %).`,s*100,"%",`N<sub>s</sub> = 120f/P = ${Ns} rpm; s = (N<sub>s</sub> − N)/N<sub>s</sub> = ${pfD(Ns-N,1)}/${Ns} = ${pfD(s*100,2)}%.`,[(1-s)*100,s*1000,s*50]);
  if(w===1)return gbN(`A ${P}-pole, ${f} Hz induction motor runs with ${pfD(s*100,1)}% slip. Find the rotor current frequency (in Hz).`,s*f,"Hz",`f<sub>r</sub> = s f = ${s} × ${f} = ${pfD(s*f,2)} Hz.`,[f,f*(1-s),s*f*2]);
  return gbN(`Find the synchronous speed of a ${P}-pole, ${f} Hz induction motor (in rpm).`,Ns,"rpm",`N<sub>s</sub> = 120f/P = 120 × ${f}/${P} = ${Ns} rpm.`,[60*f/P,120*f*P,Ns*2])},
 // slip at maximum torque
 ()=>{const R2=pick([0.02,0.03,0.05,0.1]),X2=pick([0.1,0.2,0.25,0.5]),sm=R2/X2,Ns=1500;
  return gbN(`An induction motor has rotor resistance ${R2} Ω and standstill rotor reactance ${X2} Ω per phase. At what speed does maximum torque occur, for N<sub>s</sub> = 1500 rpm (in rpm)?`,Ns*(1-sm),"rpm",`Maximum torque occurs at s<sub>m</sub> = R₂/X₂ = ${pfD(sm,3)}; N = N<sub>s</sub>(1 − s<sub>m</sub>) = ${pfD(Ns*(1-sm),1)} rpm.`,[Ns*sm,Ns,Ns*(1-sm/2)])},
 ()=>gbFact([
  ["A 3-phase induction motor is self-starting because…","the 3-phase currents produce a rotating magnetic field",["it has brushes","it uses a capacitor","the rotor is magnetised"],"The RMF cuts the rotor at standstill, inducing current and torque."],
  ["Why can the rotor of an induction motor never reach synchronous speed?","at zero slip there is no relative motion, so no rotor EMF or torque",["friction is too large","the field stops rotating","the supply frequency drops"],"Torque needs induced rotor current, which needs slip."],
  ["The commutator in a DC generator…","converts the alternating EMF in the armature into DC at the brushes",["produces the magnetic field","reduces losses","acts as a rectifier for the field winding"],"Segments reverse the connection every half turn."],
  ["A DC series motor must never be started without load because…","its speed rises dangerously (flux falls with current)",["it cannot start","it draws no current","its torque becomes negative"],"N ∝ E<sub>b</sub>/Φ and Φ ∝ I<sub>a</sub>, so light load → very high speed."],
 ])],
5:[
 ()=>{const items=[["LED lamps of 10 W",pick([6,8,10]),10,pick([5,6,8])],["ceiling fans of 75 W",pick([2,3,4]),75,pick([8,10,12])],["1.5 kW AC",1,1500,pick([4,6,8])]],rate=pick([5,6.5,7,8]),kWh=items.reduce((a,[_,n,w,h])=>a+n*w*h/1000,0)*30,bill=kWh*rate;
  return gbN(`A home uses ${items.map(([nm,n,_,h])=>`${n} × ${nm} for ${h} h/day`).join(", ")}. At ₹${rate} per unit, find the bill for 30 days (in ₹).`,bill,"₹",`Energy per day = ${items.map(([_,n,w,h])=>`${n}×${w}×${h}`).join(" + ")} Wh = ${pfD(kWh/30,3)} kWh; 30 days = ${pfD(kWh,2)} units; bill = ${pfD(kWh,2)} × ${rate} = ₹${pfD(bill,2)}.`,[bill/30,kWh,bill*1.18])},
 ()=>{const Ah=pick([40,60,100,150]),I=pick([2,4,5,10]),V=12,w=rnd(0,1);
  if(w===0)return gbN(`A ${V} V, ${Ah} Ah lead-acid battery supplies a steady ${I} A. Roughly how long will it last (in h), ignoring the rate effect?`,Ah/I,"h",`Time = capacity/current = ${Ah}/${I} = ${pfD(Ah/I,2)} h.`,[Ah*I,Ah/I/2,V*Ah/I]);
  return gbN(`How much energy does a fully charged ${V} V, ${Ah} Ah battery store (in Wh)?`,V*Ah,"Wh",`E = V × Ah = ${V} × ${Ah} = ${V*Ah} Wh = ${pfD(V*Ah/1000,2)} kWh.`,[Ah,V*Ah*2,V*Ah/1000])},
 ()=>{const P=pick([1,2,3,5]),V=230,pf=pick([0.8,0.9,1]),I=P*1000/(V*pf);
  return gbN(`A ${P} kW single-phase load works at 230 V, power factor ${pf}. Find the current it draws (in A).`,I,"A",`I = P/(V cos φ) = ${P*1000}/(230 × ${pf}) = ${pfD(I,2)} A. Choose the next MCB size above this.`,[P*1000/V,I*pf*pf,I*2])},
 ()=>gbFact([
  ["The main purpose of earthing is…","to give fault current a low-resistance path so the protective device trips and touch voltage stays safe",["to save energy","to raise the supply voltage","to improve power factor"],"Exposed metal is held near earth potential; a fault draws enough current to blow the fuse/trip the MCB."],
  ["Pipe earthing uses salt and charcoal around the electrode to…","keep the soil moist and lower its resistance",["insulate the pipe","prevent corrosion","raise the soil temperature"],"Salt improves conductivity; charcoal retains moisture."],
  ["An MCB trips on overload by its … element and on short-circuit by its … element.","thermal (bimetal); magnetic (solenoid)",["magnetic; thermal","fuse wire; relay","electronic; mechanical"],"A bimetal bends slowly with heat; a solenoid snaps instantly on large currents."],
  ["An ELCB/RCCB operates when…","the phase and neutral currents differ (leakage to earth)",["voltage rises","the load is too large","frequency changes"],"It senses residual current, typically 30 mA for human safety."],
  ["Power is transmitted at high voltage mainly because…","the current and hence I²R line losses are smaller",["high voltage is safer","transformers need it","it raises the frequency"],"For the same power P = VI, raising V reduces I and losses ∝ I²."],
  ["During discharge of a lead-acid cell, the electrolyte's specific gravity…","falls, as H₂SO₄ is used to form PbSO₄",["rises","stays constant","becomes zero"],"Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O."],
 ])],
});

/* =========================================================== ECT-001 BASIC ELECTRONICS */
genAdd("ECT-001",{
1:[
 // extrinsic carriers and conductivity (PYQ Q1.5)
 ()=>{const ND=pick([1e15,1e16,5e16,1e17]),ni=1.5e10,mun=1300,mup=500,p=ni*ni/ND,s=PF_Q*(ND*mun+p*mup),w=rnd(0,1);
  if(w===0){const e=Math.floor(Math.log10(p)),m=p/10**e;return gbN(`Silicon (n<sub>i</sub> = 1.5×10¹⁰ cm⁻³) is doped with ${pfS(ND,0)} donors/cm³ at 300 K. Find the minority hole concentration, in units of 10<sup>${e}</sup> cm⁻³.`,m,"",`Majority n ≈ N<sub>D</sub> = ${pfS(ND,0)} cm⁻³. Mass action: p = n<sub>i</sub>²/n = (1.5×10¹⁰)²/${pfS(ND,0)} = ${pfS(p,2)} cm⁻³.`,[m*2,m/2,m*10])}
  return gbN(`Silicon (n<sub>i</sub> = 1.5×10¹⁰ cm⁻³, μ<sub>n</sub> = 1300, μ<sub>p</sub> = 500 cm²/V·s) is doped with ${pfS(ND,0)} donors/cm³. Find its conductivity (in S/cm).`,s,"S/cm",`n ≈ ${pfS(ND,0)} cm⁻³ (holes negligible). σ = q(nμ<sub>n</sub> + pμ<sub>p</sub>) ≈ 1.602×10⁻¹⁹ × ${pfS(ND,0)} × 1300 = ${pfD(s,4)} S/cm.`,[s*500/1300,s*2,s/10])},
 // doping ratio (PYQ Q1.5 part 2)
 ()=>{const ratio=pick([1e8,5e7,1e7,1e9]),donor=coin(.5),N=5e22/ratio,s=PF_Q*N*(donor?1300:500);
  return gbN(`Silicon has 5×10²² atoms/cm³. It is doped with 1 ${donor?"donor":"acceptor"} atom per ${pfS(ratio,0)} Si atoms. Find the conductivity (in S/cm). (μ<sub>n</sub> = 1300, μ<sub>p</sub> = 500 cm²/V·s)`,s,"S/cm",`N = 5×10²²/${pfS(ratio,0)} = ${pfS(N,1)} cm⁻³ ${donor?"electrons":"holes"}. σ = qNμ = 1.602×10⁻¹⁹ × ${pfS(N,1)} × ${donor?1300:500} = ${pfD(s,4)} S/cm.`,[s*2,PF_Q*N*(donor?500:1300),s/10])},
 // intrinsic conductivity
 ()=>{const [mat,ni,mn,mp,ex]=pick([["Si",1.5e10,1300,500,6],["Ge",2.5e13,3800,1800,3]]),s=PF_Q*ni*(mn+mp)*10**ex;
  return gbN(`Find the intrinsic conductivity of ${mat} at 300 K in units of 10<sup>−${ex}</sup> S/cm (n<sub>i</sub> = ${pfS(ni,1)} cm⁻³, μ<sub>n</sub> = ${mn}, μ<sub>p</sub> = ${mp} cm²/V·s).`,s,"",`σ<sub>i</sub> = q n<sub>i</sub>(μ<sub>n</sub> + μ<sub>p</sub>) = 1.602×10⁻¹⁹ × ${pfS(ni,1)} × ${mn+mp} = ${pfD(s,3)}×10<sup>−${ex}</sup> S/cm.`,[s/2,s*mn/(mn+mp),s*2])},
 // Shockley diode equation (PYQ Q1.6)
 ()=>{const Is=pick([1,2,5,10]),eta=pick([1,2]),unitIs=eta===1?"pA":"nA",V=pick([0.5,0.55,0.6,0.65]),VT=0.026,IsA=Is*(unitIs==="nA"?1e-9:1e-12),I=IsA*(Math.exp(V/(eta*VT))-1)*1000;
  return gbN(`A silicon diode has reverse saturation current ${Is} ${unitIs}. Find the forward current at ${V} V (in mA), with ideality factor η = ${eta} and V<sub>T</sub> = 26 mV.`,I,"mA",`I = I<sub>s</sub>(e<sup>V/ηV<sub>T</sub></sup> − 1) = ${Is}×10<sup>${unitIs==="nA"?-9:-12}</sup> × (e<sup>${pfD(V/(eta*VT),3)}</sup> − 1) = ${pfD(I,4)} mA.`,[I*2,I/2,IsA*Math.exp(V/VT)*1000*(eta===1?0.5:1)])},
 // dynamic resistance
 ()=>{const I=pick([1,2,5,10,20]),eta=pick([1,2]),r=eta*26/I;
  return gbN(`Find the dynamic (AC) resistance of a silicon diode carrying ${I} mA DC, with η = ${eta} and V<sub>T</sub> = 26 mV (in Ω).`,r,"Ω",`r<sub>ac</sub> = ηV<sub>T</sub>/I<sub>D</sub> = ${eta} × 26 mV/${I} mA = ${pfD(r,3)} Ω.`,[26/I*(eta===1?2:0.5),r*2,0.7/(I*1e-3)])},
 // LED wavelength (PYQ Q1.7)
 ()=>{const Eg=pick([1.875,1.43,2.25,1.9,2.8]),lam=1239.8/Eg;
  return gbN(`An LED made of a semiconductor with forbidden gap ${Eg} eV emits light of what wavelength (in nm)?`,lam,"nm",`λ = hc/E<sub>g</sub> = 1239.8/${Eg} = ${pfD(lam,1)} nm (${lam>750?"infrared":lam>620?"red":lam>590?"orange":lam>495?"green":"blue/violet"}).`,[lam/2,lam*2,Eg*1000])},
 ()=>gbFact([
  ["Law of mass action for a semiconductor in equilibrium:","n·p = n<sub>i</sub>²",["n + p = n<sub>i</sub>","n/p = n<sub>i</sub>","n·p = n<sub>i</sub>"],"Doping raises one carrier and lowers the other so their product stays n<sub>i</sub>²."],
  ["A tunnel diode shows negative resistance because…","very heavy doping makes a thin junction through which electrons tunnel, and tunnelling falls as bias rises",["avalanche multiplication","its band gap is zero","it is made of metal"],"Over that part of the curve, current falls as voltage increases."],
  ["A Schottky diode switches fast because…","it is a majority-carrier metal–semiconductor junction with no stored minority charge",["it is very large","it uses germanium","it has a high forward drop"],"No minority carrier storage → negligible reverse-recovery time; forward drop is only ~0.3 V."],
  ["A varactor diode is used as…","a voltage-controlled capacitor in reverse bias",["a voltage regulator","a light source","a rectifier for high current"],"The depletion width, and so the capacitance, changes with reverse voltage."],
 ])],
2:[
 // bridge rectifier performance (PYQ Q2.8)
 ()=>{const Vm=pick([100,170,220,311]),RL=pick([500,1000,2000]),rd=pick([5,10,20]),Im=Vm/(RL+2*rd),Idc=2*Im/Math.PI,w=rnd(0,3);
  const base=`A bridge rectifier feeds R<sub>L</sub> = ${RL} Ω from a secondary voltage ${Vm} sin 314t V. Each diode has forward resistance ${rd} Ω (two conduct at a time). `;
  if(w===0)return gbN(base+"Find the peak load current (in mA).",Im*1000,"mA",`I<sub>m</sub> = V<sub>m</sub>/(R<sub>L</sub> + 2r<sub>d</sub>) = ${Vm}/${RL+2*rd} = ${pfD(Im*1000,2)} mA.`,[Vm/RL*1000,Idc*1000,Im*1000/Math.SQRT2]);
  if(w===1)return gbN(base+"Find the DC load current (in mA).",Idc*1000,"mA",`I<sub>dc</sub> = 2I<sub>m</sub>/π = 2 × ${pfD(Im*1000,2)}/π = ${pfD(Idc*1000,2)} mA.`,[Im*1000/Math.PI,Im*1000,Im*1000/Math.SQRT2]);
  if(w===2)return gbN(base+"Find the RMS load current (in mA).",Im/Math.SQRT2*1000,"mA",`For full-wave rectification I<sub>rms</sub> = I<sub>m</sub>/√2 = ${pfD(Im/Math.SQRT2*1000,2)} mA.`,[Im*500,Idc*1000,Im*1000]);
  const eta=0.812*RL/(RL+2*rd)*100;
  return gbN(base+"Find the rectification efficiency (in %).",eta,"%",`η = (8/π²) × R<sub>L</sub>/(R<sub>L</sub> + 2r<sub>d</sub>) = 81.2% × ${RL}/${RL+2*rd} = ${pfD(eta,2)}%.`,[81.2,40.6,eta/2])},
 // bridge with 0.7 V drops (PYQ Q2.8 part 2)
 ()=>{const Vrms=pick([12,24,120,230]),Vm=Vrms*Math.SQRT2,Vdc=2*(Vm-1.4)/Math.PI;
  return gbN(`A bridge rectifier with silicon diodes (0.7 V each) has a ${Vrms} V RMS input. Find the DC load voltage (in V).`,Vdc,"V",`V<sub>m</sub> = ${Vrms}√2 = ${pfD(Vm,2)} V. Two diodes conduct: peak at load = V<sub>m</sub> − 1.4 = ${pfD(Vm-1.4,2)} V. V<sub>dc</sub> = 2V<sub>peak</sub>/π = ${pfD(Vdc,2)} V.`,[2*Vm/Math.PI,(Vm-0.7)/Math.PI,Vm-1.4])},
 // zener regulator currents (PYQ Q2.9)
 ()=>{const Vin=pick([15,16,18,20,24]),Vz=pick([6,9,10,12]),Rs=pick([0.5,1,1.2]),RL=pick([2,3,4,5]),IR=(Vin-Vz)/Rs,IL=Vz/RL,Iz=IR-IL,w=rnd(0,2);
  if(Iz<=0.5)return gbN(`A Zener regulator has V<sub>in</sub> = 24 V, R<sub>s</sub> = 1 kΩ, V<sub>Z</sub> = 10 V and R<sub>L</sub> = 2 kΩ. Find the Zener current (in mA).`,9,"mA",`I<sub>R</sub> = (24 − 10)/1k = 14 mA, I<sub>L</sub> = 10/2k = 5 mA, I<sub>Z</sub> = 14 − 5 = 9 mA.`,[14,5,4]);
  const base=`A Zener regulator has V<sub>in</sub> = ${Vin} V, R<sub>s</sub> = ${Rs} kΩ, V<sub>Z</sub> = ${Vz} V and R<sub>L</sub> = ${RL} kΩ. `;
  if(w===0)return gbN(base+"Find the Zener current (in mA).",Iz,"mA",`V<sub>L</sub> = V<sub>Z</sub> = ${Vz} V. I<sub>R</sub> = (${Vin} − ${Vz})/${Rs} = ${pfD(IR,3)} mA, I<sub>L</sub> = ${Vz}/${RL} = ${pfD(IL,3)} mA, I<sub>Z</sub> = I<sub>R</sub> − I<sub>L</sub> = ${pfD(Iz,3)} mA.`,[IR,IL,IR+IL]);
  if(w===1)return gbN(base+"Find the power dissipated in the Zener (in mW).",Vz*Iz,"mW",`I<sub>Z</sub> = ${pfD(Iz,3)} mA, so P<sub>Z</sub> = V<sub>Z</sub>I<sub>Z</sub> = ${Vz} × ${pfD(Iz,3)} = ${pfD(Vz*Iz,2)} mW.`,[Vz*IR,Vin*Iz,Vz*IL]);
  return gbN(base+"Find the voltage across R<sub>s</sub> (in V).",Vin-Vz,"V",`V<sub>R</sub> = V<sub>in</sub> − V<sub>Z</sub> = ${Vin} − ${Vz} = ${Vin-Vz} V.`,[Vz,Vin,Vin-Vz/2])},
 // zener input range (PYQ Q2.9 part 2)
 ()=>{const R=pick([220,330,470]),Vz=pick([10,12,15,20]),IZM=pick([40,60,80]),RL=pick([1000,1200,2000]),IL=Vz/RL*1000,lo=Vz*(RL+R)/RL,hi=Vz+(IZM+IL)*R/1000,w=rnd(0,1);
  const base=`A Zener regulator has R = ${R} Ω, V<sub>Z</sub> = ${Vz} V, I<sub>ZM</sub> = ${IZM} mA and R<sub>L</sub> = ${RL} Ω. `;
  if(w===0)return gbN(base+"Find the minimum input voltage that keeps the Zener ON (in V).",lo,"V",`At the edge I<sub>Z</sub> = 0, so the divider must give V<sub>Z</sub> across R<sub>L</sub>: V<sub>i,min</sub> = V<sub>Z</sub>(R<sub>L</sub> + R)/R<sub>L</sub> = ${Vz} × ${RL+R}/${RL} = ${pfD(lo,3)} V.`,[hi,Vz,Vz*R/RL]);
  return gbN(base+"Find the maximum input voltage before the Zener current exceeds I<sub>ZM</sub> (in V).",hi,"V",`I<sub>L</sub> = ${Vz}/${RL} = ${pfD(IL,3)} mA. I<sub>R,max</sub> = I<sub>ZM</sub> + I<sub>L</sub> = ${pfD(IZM+IL,3)} mA. V<sub>i,max</sub> = V<sub>Z</sub> + I<sub>R</sub>R = ${Vz} + ${pfD((IZM+IL)*R/1000,3)} = ${pfD(hi,3)} V.`,[lo,Vz+IZM*R/1000,hi*2])},
 // clamper time constant (PYQ Q2.7)
 ()=>{const R=pick([10,47,100]),C=pick([0.1,1,2.2]),f=pick([500,1000,2000]),tau5=5*R*C,half=1000/(2*f);
  return gbN(`A clamper has C = ${C} μF and R<sub>L</sub> = ${R} kΩ with a ${f} Hz square-wave input. Find 5τ (in ms).`,tau5,"ms",`τ = R<sub>L</sub>C = ${R}×10³ × ${C}×10⁻⁶ = ${pfD(R*C,3)} ms; 5τ = ${pfD(tau5,3)} ms, versus T/2 = ${pfD(half,3)} ms. Since 5τ ${tau5>10*half?"≫":">"} T/2 the capacitor barely discharges, so the waveform keeps its shape and is just shifted.`,[R*C,half,tau5*2])},
 ()=>gbFact([
  ["Ripple factor of a full-wave rectifier (no filter):","0.482",["1.21","0.0","0.812"],"γ = √((I<sub>rms</sub>/I<sub>dc</sub>)² − 1) = √(1.11² − 1) = 0.482. A half-wave rectifier has 1.21."],
  ["Maximum efficiency of a half-wave rectifier:","40.6%",["81.2%","50%","100%"],"η = (4/π²) ≈ 40.6%; full-wave doubles it to 81.2%."],
  ["PIV of each diode in a centre-tap full-wave rectifier:","2V<sub>m</sub>",["V<sub>m</sub>","V<sub>m</sub>/2","√2V<sub>m</sub>"],"The non-conducting diode sees the full secondary (both halves). In a bridge it is V<sub>m</sub>."],
  ["Zener breakdown (as opposed to avalanche) occurs in…","heavily doped junctions at low voltage (below ~5 V), by field-assisted tunnelling",["lightly doped junctions at high voltage","forward bias only","metal–semiconductor junctions"],"It has a negative temperature coefficient; avalanche breakdown's is positive."],
  ["A clamper circuit…","adds a DC level to a signal without changing its peak-to-peak value",["removes part of the waveform","doubles the frequency","rectifies AC"],"A clipper cuts off part of the wave; a clamper shifts it."],
 ])],
3:[
 ()=>{const w=rnd(0,1);
  if(w===0){const a=pick([0.95,0.98,0.99,0.995,0.997]),b=a/(1-a);return gbN(`Given α<sub>dc</sub> = ${a}, find β<sub>dc</sub>.`,b,"",`β = α/(1 − α) = ${a}/${pfD(1-a,3)} = ${pfD(b,2)}.`,[1/(1-a)+1,a*100,b/2])}
  const b=pick([49,99,100,150,199]),a=b/(1+b);return mcq(`Given β = ${b}, find α.`,pfD(a,4),[pfD(1-1/(b*2)+0.002,4),pfD(1/b,4),pfD(b/(b+2),4)],`α = β/(1 + β) = ${b}/${b+1} = ${pfD(a,4)}.`)},
 // IC with leakage (PYQ Q3.6)
 ()=>{const b=pick([50,98,100,120]),ICEO=pick([20,40,50]),IB=pick([0.1,0.2,0.3]),IC=b*IB+ICEO/1000,w=rnd(0,1);
  if(w===0)return gbN(`In CE configuration β = ${b} and I<sub>CEO</sub> = ${ICEO} μA. For I<sub>B</sub> = ${IB} mA, find I<sub>C</sub> (in mA).`,IC,"mA",`I<sub>C</sub> = βI<sub>B</sub> + I<sub>CEO</sub> = ${b} × ${IB} + ${ICEO/1000} = ${pfD(IC,4)} mA.`,[b*IB,IC+IB,IC*2]);
  return gbN(`In CE configuration β = ${b} and I<sub>CEO</sub> = ${ICEO} μA. For I<sub>B</sub> = ${IB} mA, find I<sub>E</sub> (in mA).`,IC+IB,"mA",`I<sub>C</sub> = βI<sub>B</sub> + I<sub>CEO</sub> = ${pfD(IC,4)} mA, so I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub> = ${pfD(IC+IB,4)} mA.`,[IC,b*IB,IC-IB])},
 // fixed bias Q-point
 ()=>{const VCC=pick([9,12,15]),RB=pick([220,330,470,560]),b=pick([80,100,150]),IB=(VCC-0.7)/RB,IC=b*IB,RC=Number(((VCC*0.5)/IC).toFixed(1)),VCE=VCC-IC*RC,w=rnd(0,1);
  if(w===0)return gbN(`Fixed bias: V<sub>CC</sub> = ${VCC} V, R<sub>B</sub> = ${RB} kΩ, R<sub>C</sub> = ${RC} kΩ, β = ${b}, V<sub>BE</sub> = 0.7 V. Find I<sub>C</sub> (in mA).`,IC,"mA",`I<sub>B</sub> = (${VCC} − 0.7)/${RB} kΩ = ${pfD(IB*1000,3)} μA; I<sub>C</sub> = βI<sub>B</sub> = ${pfD(IC,4)} mA.`,[IB,IC*2,VCC/RC]);
  return gbN(`Fixed bias: V<sub>CC</sub> = ${VCC} V, R<sub>B</sub> = ${RB} kΩ, R<sub>C</sub> = ${RC} kΩ, β = ${b}, V<sub>BE</sub> = 0.7 V. Find V<sub>CE</sub> (in V).`,VCE,"V",`I<sub>C</sub> = β(V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub> = ${pfD(IC,4)} mA; V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub> = ${VCC} − ${pfD(IC*RC,3)} = ${pfD(VCE,3)} V.`,[VCC,IC*RC,VCC-0.7])},
 // emitter-stabilised and voltage-divider bias
 ()=>{const VCC=pick([12,15,20]),R1=pick([39,47,56,68]),R2=pick([8.2,10,12]),RE=pick([1,1.2,1.5]),b=pick([100,150,200]),Vth=VCC*R2/(R1+R2),Rth=R1*R2/(R1+R2),IB=(Vth-0.7)/(Rth+(b+1)*RE),IC=b*IB,w=rnd(0,1);
  if(w===0)return gbN(`Voltage-divider bias: V<sub>CC</sub> = ${VCC} V, R₁ = ${R1} kΩ, R₂ = ${R2} kΩ, R<sub>E</sub> = ${RE} kΩ, β = ${b}. Find V<sub>Th</sub> (in V).`,Vth,"V",`V<sub>Th</sub> = V<sub>CC</sub>R₂/(R₁ + R₂) = ${VCC} × ${R2}/${pfD(R1+R2,1)} = ${pfD(Vth,3)} V.`,[VCC*R1/(R1+R2),Vth-0.7,VCC/2]);
  return gbN(`Voltage-divider bias: V<sub>CC</sub> = ${VCC} V, R₁ = ${R1} kΩ, R₂ = ${R2} kΩ, R<sub>E</sub> = ${RE} kΩ, β = ${b}, V<sub>BE</sub> = 0.7 V. Find I<sub>C</sub> using the exact Thevenin analysis (in mA).`,IC,"mA",`V<sub>Th</sub> = ${pfD(Vth,3)} V, R<sub>Th</sub> = ${pfD(Rth,3)} kΩ. I<sub>B</sub> = (V<sub>Th</sub> − 0.7)/(R<sub>Th</sub> + (β + 1)R<sub>E</sub>) = ${pfD(IB*1000,3)} μA; I<sub>C</sub> = βI<sub>B</sub> = ${pfD(IC,4)} mA (≈ (V<sub>Th</sub> − 0.7)/R<sub>E</sub> = ${pfD((Vth-0.7)/RE,3)} mA).`,[(Vth-0.7)/RE*2,IC*2,Vth/RE])},
 // h-parameter CE amplifier
 ()=>{const hie=pick([1,1.1,1.5,2]),hfe=pick([50,80,100]),hoe=pick([10,20,25]),hre=2.5e-4,RL=pick([2,3,5]),Ai=-hfe/(1+hoe*1e-6*RL*1e3),Ri=hie+hre*Ai*RL,Av=Ai*RL/Ri,w=rnd(0,1);
  if(w===0)return gbN(`A CE amplifier has h<sub>fe</sub> = ${hfe}, h<sub>oe</sub> = ${hoe} μA/V, h<sub>ie</sub> = ${hie} kΩ, h<sub>re</sub> = 2.5×10⁻⁴ and R<sub>L</sub> = ${RL} kΩ. Find the current gain A<sub>i</sub> (give the negative sign).`,Ai,"",`A<sub>i</sub> = −h<sub>fe</sub>/(1 + h<sub>oe</sub>R<sub>L</sub>) = −${hfe}/(1 + ${hoe}×10⁻⁶ × ${RL*1000}) = ${pfD(Ai,3)}.`,[-Ai,-hfe,Ai/2]);
  return gbN(`A CE amplifier has h<sub>fe</sub> = ${hfe}, h<sub>oe</sub> = ${hoe} μA/V, h<sub>ie</sub> = ${hie} kΩ, h<sub>re</sub> = 2.5×10⁻⁴ and R<sub>L</sub> = ${RL} kΩ. Find the voltage gain A<sub>v</sub> (negative).`,Av,"",`A<sub>i</sub> = ${pfD(Ai,3)}; R<sub>i</sub> = h<sub>ie</sub> + h<sub>re</sub>A<sub>i</sub>R<sub>L</sub> = ${pfD(Ri,4)} kΩ; A<sub>v</sub> = A<sub>i</sub>R<sub>L</sub>/R<sub>i</sub> = ${pfD(Av,2)}.`,[-Av,-hfe*RL/hie,Av/2])},
 ()=>gbFact([
  ["Voltage-divider bias is the most stable because…","R<sub>E</sub> gives negative feedback and the base voltage is fixed by a stiff divider, so I<sub>C</sub> hardly depends on β",["it uses no resistors","β is always constant","it needs no supply"],"I<sub>C</sub> ≈ (V<sub>Th</sub> − V<sub>BE</sub>)/R<sub>E</sub>: independent of β."],
  ["Thermal runaway happens when…","I<sub>C</sub> heats the junction, which raises I<sub>CBO</sub> and I<sub>C</sub> further in a loop",["the transistor is cut off","V<sub>CE</sub> is zero","β falls with temperature"],"Stabilised bias (R<sub>E</sub>) and heat sinks break the loop."],
  ["In the active region of a BJT…","the base–emitter junction is forward biased and the collector–base junction is reverse biased",["both junctions are forward biased","both are reverse biased","only the collector junction is forward biased"],"Both forward = saturation; both reverse = cut-off."],
  ["A CE amplifier's output is … with respect to its input.","180° out of phase",["in phase","90° ahead","45° behind"],"A rise in base current lowers V<sub>CE</sub>."],
  ["Compared with a BJT, an FET is…","voltage-controlled with very high input impedance",["current-controlled with low input impedance","bipolar","noisier and less thermally stable"],"The gate draws almost no current; only majority carriers flow."],
 ])],
4:[
 // JFET Shockley equation and gm
 ()=>{const IDSS=pick([8,10,12,16]),VP=-pick([3,4,5,6]),VGS=-Number((Math.abs(VP)*pick([0.25,0.4,0.5,0.6])).toFixed(2)),ID=IDSS*(1-VGS/VP)**2,gm=2*IDSS/Math.abs(VP)*(1-VGS/VP),w=rnd(0,1);
  if(w===0)return gbN(`An n-channel JFET has I<sub>DSS</sub> = ${IDSS} mA and V<sub>P</sub> = ${VP} V. Find I<sub>D</sub> at V<sub>GS</sub> = ${pfD(VGS,2)} V (in mA).`,ID,"mA",`Shockley: I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² = ${IDSS}(1 − ${pfD(VGS/VP,3)})² = ${pfD(ID,4)} mA.`,[IDSS*(1-VGS/VP),IDSS,ID*2]);
  return gbN(`An n-channel JFET has I<sub>DSS</sub> = ${IDSS} mA and V<sub>P</sub> = ${VP} V. Find the transconductance g<sub>m</sub> at V<sub>GS</sub> = ${pfD(VGS,2)} V (in mS).`,gm,"mS",`g<sub>m</sub> = (2I<sub>DSS</sub>/|V<sub>P</sub>|)(1 − V<sub>GS</sub>/V<sub>P</sub>) = (${2*IDSS}/${Math.abs(VP)}) × ${pfD(1-VGS/VP,3)} = ${pfD(gm,4)} mS.`,[2*IDSS/Math.abs(VP),gm/2,ID/Math.abs(VGS||1)])},
 // JFET self-bias (PYQ Q4.6)
 ()=>{const IDSS=pick([8,10,12]),VP=-pick([3,4,5]),RS=pick([0.5,1,1.5]),VDD=pick([15,20,24]),RD=pick([3,4,6]);
  // I = IDSS(1 + I·RS/VP)^2 with VP<0  → solve quadratic, keep the root with |VGS| < |VP|
  const a=IDSS*RS*RS/(VP*VP),b=2*IDSS*RS/VP-1,c=IDSS,disc=b*b-4*a*c,r1=(-b-Math.sqrt(disc))/(2*a),r2=(-b+Math.sqrt(disc))/(2*a),ID=[r1,r2].filter(x=>x>0&&x*RS<Math.abs(VP)).sort((x,y)=>x-y)[0],VGS=-ID*RS,VDS=VDD-ID*(RD+RS),w=rnd(0,1);
  PF_VERIFY(Math.abs(IDSS*(1-VGS/VP)**2-ID)<1e-6,"jfet self bias");
  if(w===0)return gbN(`A self-biased n-JFET has I<sub>DSS</sub> = ${IDSS} mA, V<sub>P</sub> = ${VP} V, R<sub>S</sub> = ${RS} kΩ, R<sub>D</sub> = ${RD} kΩ, V<sub>DD</sub> = ${VDD} V. Find I<sub>D</sub> (in mA).`,ID,"mA",`V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>. Substituting in I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² gives a quadratic; the root with |V<sub>GS</sub>| < |V<sub>P</sub>| is I<sub>D</sub> = ${pfD(ID,4)} mA (V<sub>GS</sub> = ${pfD(VGS,3)} V).`,[Math.max(r1,r2),IDSS/2,IDSS]);
  return gbN(`A self-biased n-JFET has I<sub>DSS</sub> = ${IDSS} mA, V<sub>P</sub> = ${VP} V, R<sub>S</sub> = ${RS} kΩ, R<sub>D</sub> = ${RD} kΩ, V<sub>DD</sub> = ${VDD} V. Find V<sub>DS</sub> (in V).`,VDS,"V",`Solving the bias gives I<sub>D</sub> = ${pfD(ID,4)} mA. V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>) = ${VDD} − ${pfD(ID,4)} × ${RD+RS} = ${pfD(VDS,3)} V.`,[VDD-ID*RD,VDD,VDS/2])},
 // E-MOSFET square law
 ()=>{const k=pick([0.2,0.3,0.5]),VT=pick([1,1.5,2,3]),VGS=VT+pick([1,2,3]),ID=k*(VGS-VT)**2;
  return gbN(`An n-channel E-MOSFET has k = ${k} mA/V² and V<sub>T</sub> = ${VT} V. Find I<sub>D</sub> in saturation at V<sub>GS</sub> = ${VGS} V (in mA).`,ID,"mA",`I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)² = ${k} × (${VGS} − ${VT})² = ${pfD(ID,3)} mA. Below V<sub>T</sub> no channel forms and I<sub>D</sub> = 0.`,[k*(VGS-VT),k*VGS*VGS,ID*2])},
 // CS amplifier gain, amplification factor
 ()=>{const gm=pick([2,3,4,5]),rd=pick([20,40,50,100]),RD=pick([2,4,5,10]),w=rnd(0,1),par=rd*RD/(rd+RD);
  if(w===0)return gbN(`A common-source JFET amplifier has g<sub>m</sub> = ${gm} mS, r<sub>d</sub> = ${rd} kΩ and R<sub>D</sub> = ${RD} kΩ (no load). Find the voltage gain (negative).`,-gm*par,"",`A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>) = −${gm} × ${pfD(par,3)} = ${pfD(-gm*par,3)} (180° phase shift).`,[gm*par,-gm*RD,-gm*rd]);
  return gbN(`An FET has g<sub>m</sub> = ${gm} mS and r<sub>d</sub> = ${rd} kΩ. Find its amplification factor μ.`,gm*rd,"",`μ = g<sub>m</sub> × r<sub>d</sub> = ${gm}×10⁻³ × ${rd}×10³ = ${gm*rd}.`,[gm/rd,gm*rd/2,rd])},
 ()=>gbFact([
  ["A D-MOSFET can work in both depletion and enhancement mode because…","it has a built-in channel that a negative gate empties and a positive gate enriches",["it has no gate oxide","it is bipolar","its threshold is zero"],"The insulated gate allows either polarity without gate current."],
  ["The pinch-off voltage of a JFET is…","the V<sub>DS</sub> (at V<sub>GS</sub> = 0) at which the depletion regions meet and I<sub>D</sub> saturates at I<sub>DSS</sub>",["the gate breakdown voltage","the threshold for inversion","the maximum gate current"],"Beyond pinch-off, I<sub>D</sub> stays nearly constant."],
  ["In an n-channel E-MOSFET, the channel forms when…","V<sub>GS</sub> exceeds V<sub>T</sub>, attracting electrons to the oxide interface (inversion)",["V<sub>GS</sub> is negative","the drain is grounded","the substrate is n-type"],"The p-substrate surface inverts to n-type."],
 ])],
5:[
 // op-amp gains
 ()=>{const R1=pick([1,2,4.7,10]),Rf=pick([10,22,47,100]),w=rnd(0,2),vin=pick([0.1,0.2,0.5]);
  if(w===0)return gbN(`An inverting op-amp amplifier has R₁ = ${R1} kΩ and R<sub>f</sub> = ${Rf} kΩ. Find its voltage gain (negative).`,-Rf/R1,"",`Virtual ground at the inverting input: A<sub>v</sub> = −R<sub>f</sub>/R₁ = −${Rf}/${R1} = ${pfD(-Rf/R1,3)}.`,[Rf/R1,1+Rf/R1,-R1/Rf]);
  if(w===1)return gbN(`A non-inverting op-amp amplifier has R₁ = ${R1} kΩ and R<sub>f</sub> = ${Rf} kΩ. Find its voltage gain.`,1+Rf/R1,"",`A<sub>v</sub> = 1 + R<sub>f</sub>/R₁ = 1 + ${Rf}/${R1} = ${pfD(1+Rf/R1,3)}.`,[Rf/R1,-Rf/R1,R1/Rf+1]);
  return gbN(`An inverting amplifier (R₁ = ${R1} kΩ, R<sub>f</sub> = ${Rf} kΩ) has an input of ${vin} V. Find the output voltage (in V).`,-Rf/R1*vin,"V",`v<sub>o</sub> = −(R<sub>f</sub>/R₁)v<sub>in</sub> = −(${Rf}/${R1}) × ${vin} = ${pfD(-Rf/R1*vin,3)} V (within the ±14 V supply limits).`,[Rf/R1*vin,(1+Rf/R1)*vin,-vin])},
 // summing amplifier
 ()=>{const Rf=pick([10,20]),R=[pick([10,20]),pick([10,5]),pick([20,10])],V=[pick([0.5,1,2]),pick([-1,0.5,1]),pick([0.2,0.4,1])],out=-Rf*(V[0]/R[0]+V[1]/R[1]+V[2]/R[2]);
  return gbN(`An inverting summing amplifier has R<sub>f</sub> = ${Rf} kΩ and inputs V₁ = ${pfD(V[0])} V through ${R[0]} kΩ, V₂ = ${pfD(V[1])} V through ${R[1]} kΩ, V₃ = ${pfD(V[2])} V through ${R[2]} kΩ. Find v<sub>o</sub> (in V).`,out,"V",`v<sub>o</sub> = −R<sub>f</sub>(V₁/R₁ + V₂/R₂ + V₃/R₃) = −${Rf}(${pfD(V[0]/R[0],3)} + ${pfD(V[1]/R[1],3)} + ${pfD(V[2]/R[2],3)}) = ${pfD(out,3)} V.`,[-out,-(V[0]+V[1]+V[2]),out/2])},
 // slew rate
 ()=>{const SR=pick([0.5,1,13]),Vm=pick([5,10,12]),f=SR*1e6/(2*Math.PI*Vm)/1000;
  return gbN(`An op-amp has a slew rate of ${SR} V/μs. Find the highest frequency of an undistorted ${Vm} V-peak sine output (in kHz).`,f,"kHz",`f<sub>max</sub> = SR/(2πV<sub>m</sub>) = ${SR}×10⁶/(2π × ${Vm}) = ${pfD(f,3)} kHz.`,[f*2*Math.PI,f/2,SR*1000/Vm])},
 // CMRR
 ()=>{const Ad=pick([1e4,1e5,2e5]),Acm=pick([0.1,0.5,1,2]),c=20*Math.log10(Ad/Acm);
  return gbN(`An op-amp has differential gain ${pfS(Ad,0)} and common-mode gain ${Acm}. Find its CMRR in dB.`,c,"dB",`CMRR = 20 log₁₀(A<sub>d</sub>/A<sub>cm</sub>) = 20 log₁₀(${pfS(Ad/Acm,2)}) = ${pfD(c,2)} dB.`,[c/2,10*Math.log10(Ad/Acm),Ad/Acm/1000])},
 // number conversions (PYQ Q5.7)
 ()=>{const w=rnd(0,2);
  if(w===0){const n=rnd(100,4000),hex=n.toString(16).toUpperCase();return gbN(`Convert (${hex})<sub>16</sub> to decimal.`,n,"",`Expand in powers of 16: ${hex.split("").map((d,i)=>`${parseInt(d,16)}×16<sup>${hex.length-1-i}</sup>`).join(" + ")} = ${n}.`,[parseInt(hex,10)||n+16,n+1,n*2])}
  if(w===1){const ip=rnd(5,255),fp=pick([0.25,0.5,0.75,0.125,0.375,0.625]),bin=ip.toString(2)+"."+fp.toString(2).slice(2),ans=ip+fp;return gbN(`Convert (${bin})<sub>2</sub> to decimal.`,ans,"",`Integer part ${ip.toString(2)} = ${ip}; fraction .${fp.toString(2).slice(2)} = ${fp}. Total ${ans}.`,[ans+1,ip,ans*2])}
  const o=rnd(8,511),oct=o.toString(8);return gbN(`Convert (${oct})<sub>8</sub> to decimal.`,o,"",`${oct.split("").map((d,i)=>`${d}×8<sup>${oct.length-1-i}</sup>`).join(" + ")} = ${o}.`,[parseInt(oct,10),o+8,o*2])},
 // evaluate a Boolean function
 ()=>{const A=rnd(0,1),B=rnd(0,1),C=rnd(0,1),fns=[["(A + B)·C̄",(a,b,c)=>(a|b)&(1-c)],["A·B̄ + B·C",(a,b,c)=>(a&(1-b))|(b&c)],["(A·B)‾ + C",(a,b,c)=>(1-(a&b))|c],["A ⊕ B ⊕ C",(a,b,c)=>a^b^c],["(A + B)‾·C",(a,b,c)=>(1-(a|b))&c],["Ā·B + A·C",(a,b,c)=>((1-a)&b)|(a&c)]],[f,fn]=pick(fns),v=fn(A,B,C);
  return mcq(`Find the value of F = ${f} for A = ${A}, B = ${B}, C = ${C}.`,String(v),[String(1-v),"cannot be found without a clock","depends on the gate family"],`Substitute and evaluate step by step: F = ${v}.`)},
 ()=>{const [g,nand,nor]=pick([["NOT",1,1],["AND",2,3],["OR",3,2],["NOR",4,1],["NAND",1,4],["XOR",4,5]]),which=coin(.5);
  return gbN(`What is the minimum number of 2-input ${which?"NAND":"NOR"} gates needed to build the ${g} function?`,which?nand:nor,"",`Standard universal-gate realisations: ${g} needs ${nand} NAND gate${nand>1?"s":""} or ${nor} NOR gate${nor>1?"s":""}.`,[which?nor:nand,(which?nand:nor)+1,(which?nand:nor)+2])},
 ()=>gbFact([
  ["The ideal op-amp has…","infinite open-loop gain and input impedance, zero output impedance",["zero gain","infinite output impedance","zero input impedance"],"These ideals give the virtual-short rule V₊ = V₋ with negative feedback."],
  ["De Morgan's theorems:","(A·B)‾ = Ā + B̄ and (A + B)‾ = Ā·B̄",["(A·B)‾ = Ā·B̄","(A + B)‾ = Ā + B̄","A + B = A·B"],"Break the bar and change the operator."],
  ["NAND and NOR are called universal gates because…","any Boolean function can be built using only one of them",["they are the fastest","they use the least power","they have three inputs"],"NOT, AND and OR can each be made from NANDs (or NORs) alone."],
  ["In a K-map, a group of 4 adjacent 1s (a quad) eliminates…","2 variables",["1 variable","4 variables","no variables"],"A group of 2ⁿ cells removes n variables."],
  ["A voltage follower has gain…","+1 (with very high input impedance)",["−1","0","infinite"],"Output tied to the inverting input: buffer between a weak source and a load."],
 ])],
});

/* =========================================================== MET-001 BASIC MECHANICAL */
const pfLadder=(W,Wm,k,muf,muw)=>{const Nf=(W+Wm)/(1+muw*muf);return Math.atan((W/2+Wm*k-muw*muf*Nf)/(muf*Nf))};
genAdd("MET-001",{
1:[
 // ladder against a smooth wall (PYQ Q1.5)
 ()=>{const mu=pick([0.2,0.24,0.25,0.3,0.35,0.4,0.5]),th=pfDeg(Math.atan(1/(2*mu))),W=pick([30,100,180,200]);
  PF_VERIFY(Math.abs(pfDeg(pfLadder(W,0,0,mu,0))-th)<1e-6,"ladder general formula");
  return gbN(`A uniform ladder of weight ${W} N rests against a smooth vertical wall and on a rough floor (μ = ${mu}). Find the angle of the ladder with the floor when it is about to slip (in degrees).`,th,"°",
   `Smooth wall: R<sub>wall</sub> = F<sub>floor</sub> = μN, N = W. Moments about the foot: R<sub>wall</sub>L sin θ = W(L/2)cos θ → tan θ = 1/(2μ) = ${pfD(1/(2*mu),3)}, θ = ${pfD(th,2)}°.`,[90-th,pfDeg(Math.atan(mu)),pfDeg(Math.atan(1/mu))])},
 // ladder with both surfaces rough and a man on it (PYQ Q1.5 part 3)
 ()=>{const W=pick([180,200,250]),Wm=pick([600,700,900]),k=pick([1,0.75,0.5]),muf=pick([0.35,0.4,0.5]),muw=pick([0.2,0.25,0.3]),th=pfDeg(pfLadder(W,Wm,k,muf,muw));
  const Nf=(W+Wm)/(1+muw*muf);
  return gbN(`A uniform ladder (weight ${W} N) rests on a rough floor (μ = ${muf}) against a rough wall (μ = ${muw}). A man of ${Wm} N stands ${k===1?"at the top":k===0.5?"half-way up":"three-quarters of the way up"}. Find the minimum angle with the floor for which the ladder does not slip (in degrees).`,th,"°",
   `At impending slip F<sub>f</sub> = μ<sub>f</sub>N<sub>f</sub> = N<sub>w</sub> and F<sub>w</sub> = μ<sub>w</sub>N<sub>w</sub>. Vertical: N<sub>f</sub>(1 + μ<sub>w</sub>μ<sub>f</sub>) = W + W<sub>m</sub> → N<sub>f</sub> = ${pfD(Nf,2)} N. Moments about the foot: μ<sub>f</sub>N<sub>f</sub>(sin θ + μ<sub>w</sub> cos θ) = (W/2 + ${k}W<sub>m</sub>)cos θ, so tan θ = (W/2 + ${k}W<sub>m</sub> − μ<sub>w</sub>μ<sub>f</sub>N<sub>f</sub>)/(μ<sub>f</sub>N<sub>f</sub>), θ = ${pfD(th,2)}°.`,[90-th,pfDeg(Math.atan(1/(2*muf))),th-10])},
 // pull at an angle on a rough table (PYQ Q1.6)
 ()=>{const W=pick([300,350,400,500]),P=pick([80,100,120,150]),a=pick([15,20,25,30]),N=W-P*Math.sin(pfRad(a)),mu=P*Math.cos(pfRad(a))/N,w=rnd(0,1);
  if(w===0)return gbN(`A body of weight ${W} N rests on a rough horizontal table. A pull of ${P} N at ${a}° above the horizontal just makes it slide. Find the normal reaction (in N).`,N,"N",`Vertical equilibrium: N + P sin ${a}° = W → N = ${W} − ${P} × ${pfD(Math.sin(pfRad(a)),4)} = ${pfD(N,2)} N.`,[W,W+P*Math.sin(pfRad(a)),W-P]);
  return gbN(`A body of weight ${W} N on a rough table just starts to slide under a pull of ${P} N at ${a}° above the horizontal. Find the coefficient of friction.`,mu,"",`N = W − P sin ${a}° = ${pfD(N,2)} N; friction F = P cos ${a}° = ${pfD(P*Math.cos(pfRad(a)),2)} N; μ = F/N = ${pfD(mu,4)}.`,[P/W,P*Math.cos(pfRad(a))/W,mu*2])},
 // resultant of two forces and the inverse problem
 ()=>{const w=rnd(0,1);
  if(w===0){const P=pick([30,40,50,60]),Q=pick([20,40,50,80]),th=pick([30,45,60,90,120]),R=Math.sqrt(P*P+Q*Q+2*P*Q*Math.cos(pfRad(th)));return gbN(`Two forces of ${P} N and ${Q} N act at a point with ${th}° between them. Find the magnitude of the resultant (in N).`,R,"N",`Parallelogram law: R = √(P² + Q² + 2PQ cos θ) = √(${P*P} + ${Q*Q} + 2×${P}×${Q}×cos ${th}°) = ${pfD(R,3)} N.`,[P+Q,Math.abs(P-Q),Math.sqrt(P*P+Q*Q)])}
  const P=pick([6,8,9,12]),Q=pick([4,5,6,8]),R90=Math.sqrt(P*P+Q*Q),R60=Math.sqrt(P*P+Q*Q+P*Q),big=Math.max(P,Q);
  return gbN(`Two forces have a resultant of ${pfD(R90,3)} kN when at right angles and ${pfD(R60,3)} kN when at 60°. Find the larger force (in kN).`,big,"kN",`At 90°: P² + Q² = ${pfD(R90*R90,2)}; at 60°: P² + Q² + PQ = ${pfD(R60*R60,2)} → PQ = ${pfD(R60*R60-R90*R90,2)}. Then (P + Q)² = ${pfD(R90*R90+2*P*Q,2)} and (P − Q)² = ${pfD(R90*R90-2*P*Q,2)}, giving ${Math.max(P,Q)} kN and ${Math.min(P,Q)} kN.`,[Math.min(P,Q),R90,(P+Q)/2])},
 // simple triangular truss
 ()=>{const W=pick([10,20,30,50]),th=pick([30,45,60]),F=W/(2*Math.sin(pfRad(th))),T=F*Math.cos(pfRad(th)),w=rnd(0,1);
  if(w===0)return gbN(`A symmetric triangular roof truss (simply supported at the two base joints) carries ${W} kN at the apex. Each rafter makes ${th}° with the base. Find the force in each rafter (in kN).`,F,"kN",`Each support reaction is W/2 = ${W/2} kN. At a support joint: F sin ${th}° = ${W/2} → F = ${pfD(F,3)} kN (compression).`,[W/2,T,W])
  return gbN(`A symmetric triangular truss carries ${W} kN at the apex; rafters at ${th}° to the base tie. Find the force in the base tie (in kN).`,T,"kN",`Rafter force F = W/(2 sin ${th}°) = ${pfD(F,3)} kN (compression). Horizontal balance at a support: tie T = F cos ${th}° = ${pfD(T,3)} kN (tension).`,[F,W/2,W/(2*Math.cos(pfRad(th)))])},
 // moment of a force about a point (PYQ Q1.8)
 ()=>{const F=pick([50,100,150]),a=pick([30,45,60]),dx=pick([300,400,500]),dy=pick([200,300,400]),M=Math.abs(dx*F*Math.sin(pfRad(a))-dy*F*Math.cos(pfRad(a)))/1000;
  return gbN(`A ${F} N force acts at point B, at ${a}° above the horizontal. B is ${dx} mm to the right of and ${dy} mm above point A. Find the magnitude of the moment about A (in N·m).`,M,"N·m",`Resolve: F<sub>x</sub> = ${pfD(F*Math.cos(pfRad(a)),2)} N, F<sub>y</sub> = ${pfD(F*Math.sin(pfRad(a)),2)} N. Varignon: M = x·F<sub>y</sub> − y·F<sub>x</sub> = ${dx/1000}×${pfD(F*Math.sin(pfRad(a)),2)} − ${dy/1000}×${pfD(F*Math.cos(pfRad(a)),2)} = ${pfD(M,3)} N·m in magnitude.`,[F*Math.hypot(dx,dy)/1000,(dx*F*Math.sin(pfRad(a))+dy*F*Math.cos(pfRad(a)))/1000,F*dx/1000])},
 ()=>gbFact([
  ["A perfect truss satisfies…","m = 2j − 3 (members vs joints)",["m = 2j","m = j − 3","m = 3j − 2"],"Fewer members → deficient (a mechanism); more → redundant (statically indeterminate)."],
  ["The angle of repose equals…","the angle of friction",["90° minus the angle of friction","twice the angle of friction","the angle of the slope at any speed"],"A body just slides when tan α = μ = tan φ."],
  ["The principle of transmissibility says…","a force may be moved along its line of action without changing its external effect on a rigid body",["a force can be moved anywhere","forces add as scalars","every action has an equal reaction"],"Its effect depends on magnitude, direction and line of action."],
  ["Varignon's theorem states…","the moment of a resultant about a point equals the sum of the moments of its components",["moments are always zero in equilibrium","forces and moments add as scalars","the resultant always passes through the centroid"],"Used to find moments by resolving forces into components."],
 ])],
2:[
 // stepped bar elongation (PYQ Q2.8)
 ()=>{const P=pick([50,80,100,150]),A=[pick([600,800,1000]),pick([1200,1600,2400]),pick([900,1200])],L=[pick([500,700,1000]),pick([1000,1200]),pick([600,800])],E=pick([200,210]),dL=P*1e3*(L[0]/A[0]+L[1]/A[1]+L[2]/A[2])/(E*1e3);
  return gbN(`A stepped steel bar has three parts: ${A[0]} mm² × ${L[0]} mm, ${A[1]} mm² × ${L[1]} mm and ${A[2]} mm² × ${L[2]} mm. It carries an axial pull of ${P} kN at its ends. Find the total elongation (in mm), E = ${E} GPa.`,dL,"mm",`ΔL = (P/E) Σ L<sub>i</sub>/A<sub>i</sub> = (${P}×10³/${E}×10³)(${L[0]}/${A[0]} + ${L[1]}/${A[1]} + ${L[2]}/${A[2]}) = ${pfD(dL,4)} mm.`,[dL*2,P*1e3*(L[0]+L[1]+L[2])/((A[0]+A[1]+A[2])/3)/(E*1e3),dL/3])},
 // uniform rod (kgf units, PYQ Q2.8 part 4)
 ()=>{const L=pick([100,150,200]),a=pick([2,2.5]),F=pick([1000,2000,2500]),E=2e6,dL=F*L/(a*a*E);
  return gbN(`A rod ${L} cm long with a ${a} cm × ${a} cm section carries a pull of ${F} kgf. Find its elongation (in mm), E = 2.0×10⁶ kgf/cm².`,dL*10,"mm",`ΔL = PL/(AE) = ${F} × ${L}/(${a*a} × 2×10⁶) = ${pfD(dL,5)} cm = ${pfD(dL*10,4)} mm.`,[dL,dL*20,dL*100])},
 // elastic constants
 ()=>{const E=pick([200,210,100,70]),nu=pick([0.25,0.28,0.3,0.33]),w=rnd(0,1);
  if(w===0)return gbN(`A material has E = ${E} GPa and Poisson's ratio ${nu}. Find the modulus of rigidity G (in GPa).`,E/(2*(1+nu)),"GPa",`E = 2G(1 + ν) → G = E/(2(1 + ν)) = ${E}/(2 × ${1+nu}) = ${pfD(E/(2*(1+nu)),3)} GPa.`,[E/(3*(1-2*nu)),E/2,E*(1+nu)/2]);
  return gbN(`A material has E = ${E} GPa and Poisson's ratio ${nu}. Find the bulk modulus K (in GPa).`,E/(3*(1-2*nu)),"GPa",`E = 3K(1 − 2ν) → K = E/(3(1 − 2ν)) = ${E}/(3 × ${pfD(1-2*nu,2)}) = ${pfD(E/(3*(1-2*nu)),3)} GPa.`,[E/(2*(1+nu)),E/3,E*3])},
 // spring constant
 ()=>{const F=pick([20,50,80,100]),x=pick([0.05,0.1,0.2,0.25]);return gbN(`A spring stretches ${x} m under a force of ${F} N. Find its spring constant (in N/m).`,F/x,"N/m",`Hooke's law F = kx → k = F/x = ${F}/${x} = ${pfD(F/x,2)} N/m.`,[F*x,x/F*1000,F/x/2])},
 // bending stress
 ()=>{const b=pick([100,120,150]),d=pick([160,200,250,300]),M=pick([20,40,50,80]),y=pick([30,40,50]),I=b*d**3/12,sm=M*1e6*(d/2)/I,w=rnd(0,1);
  if(w===0)return gbN(`A rectangular beam ${b} mm wide and ${d} mm deep carries a bending moment of ${M} kN·m. Find the maximum bending stress (in N/mm²).`,sm,"N/mm²",`I = bd³/12 = ${pfS(I,3)} mm⁴; y<sub>max</sub> = d/2 = ${d/2} mm. σ = My/I = ${M}×10⁶ × ${d/2}/${pfS(I,3)} = ${pfD(sm,3)} N/mm².`,[sm*2,6*M*1e6/(b*d*d)*2,sm/2]);
  const s=M*1e6*(d/2-y)/I;
  return gbN(`A rectangular beam ${b} mm × ${d} mm carries ${M} kN·m. Find the bending stress ${y} mm below the top surface (in N/mm²).`,s,"N/mm²",`Distance from neutral axis = d/2 − ${y} = ${d/2-y} mm. σ = My/I = ${M}×10⁶ × ${d/2-y}/${pfS(I,3)} = ${pfD(s,3)} N/mm² (compression on the top side for sagging).`,[sm,M*1e6*y/I,s*2])},
 // shaft design for power
 ()=>{const P=pick([100,200,300]),N=pick([200,250,300]),tau=pick([30,40,60]),T=60*P*1e3/(2*Math.PI*N),d=Math.cbrt(16*T*1e3/(Math.PI*tau));
  return gbN(`A solid shaft transmits ${P} kW at ${N} rpm. The allowable shear stress is ${tau} N/mm². Find the diameter needed for strength (in mm).`,d,"mm",`T = 60P/(2πN) = ${pfD(T,1)} N·m. τ = 16T/(πd³) → d = ∛(16T/(πτ)) = ∛(16 × ${pfD(T*1e3,0)}/(π × ${tau})) = ${pfD(d,2)} mm.`,[d*1.26,d/1.26,Math.cbrt(32*T*1e3/(Math.PI*tau))])},
 // beam BM
 ()=>{const w=rnd(0,2),L=pick([4,6,8,10]),q=pick([5,10,15,20]),W=pick([10,20,40]);
  if(w===0)return gbN(`A simply supported beam of span ${L} m carries a UDL of ${q} kN/m over the whole span. Find the maximum bending moment (in kN·m).`,q*L*L/8,"kN·m",`M<sub>max</sub> = wL²/8 at mid-span = ${q} × ${L}²/8 = ${pfD(q*L*L/8,2)} kN·m.`,[q*L*L/2,q*L*L/4,q*L/2]);
  if(w===1)return gbN(`A simply supported beam of span ${L} m carries a point load of ${W} kN at mid-span. Find the maximum bending moment (in kN·m).`,W*L/4,"kN·m",`Reactions W/2 each; M<sub>max</sub> = (W/2)(L/2) = WL/4 = ${pfD(W*L/4,2)} kN·m.`,[W*L/2,W*L/8,W/2]);
  return gbN(`A cantilever ${L} m long carries a UDL of ${q} kN/m over its whole length. Find the bending moment at the fixed end (in kN·m, magnitude).`,q*L*L/2,"kN·m",`M = wL·(L/2) = wL²/2 = ${q} × ${L}²/2 = ${pfD(q*L*L/2,2)} kN·m (hogging).`,[q*L*L/8,q*L,q*L*L])},
 // partial UDL (PYQ Q2.9)
 ()=>{const L=pick([8,9,10,12]),a=pick([4,5,6]),q=pick([10,15,20]),Wt=q*a,RA=Wt*(L-a/2)/L,x=RA/q,M=RA*x-q*x*x/2,w=rnd(0,1);
  if(w===0)return gbN(`A simply supported beam of span ${L} m carries a UDL of ${q} kN/m over ${a} m from the left support. Find the left reaction R<sub>A</sub> (in kN).`,RA,"kN",`Total load ${Wt} kN acting at ${a/2} m from A. Moments about B: R<sub>A</sub> × ${L} = ${Wt} × ${L-a/2} → R<sub>A</sub> = ${pfD(RA,3)} kN.`,[Wt-RA,Wt/2,Wt]);
  return gbN(`A simply supported beam of span ${L} m carries a UDL of ${q} kN/m over ${a} m from the left support. Find the maximum bending moment (in kN·m).`,M,"kN·m",`R<sub>A</sub> = ${pfD(RA,3)} kN. Shear is zero at x = R<sub>A</sub>/w = ${pfD(x,3)} m (inside the loaded length). M<sub>max</sub> = R<sub>A</sub>x − wx²/2 = ${pfD(M,3)} kN·m.`,[q*L*L/8,RA*a/2,Wt*L/4])},
 ()=>gbFact([
  ["On the stress–strain curve of mild steel, the highest stress reached is the…","ultimate tensile strength",["upper yield point","elastic limit","breaking stress"],"After UTS the bar necks; the engineering stress then falls until fracture."],
  ["Toughness of a material is…","its ability to absorb energy before fracture (area under the whole stress–strain curve)",["its resistance to scratching","its stiffness","its ability to be drawn into wires"],"Resilience is only the elastic part of that area."],
  ["A ductile bar fails in tension with a…","cup-and-cone fracture after necking",["flat fracture with no necking","45° helical fracture","shattering into pieces"],"Brittle cast iron breaks flat with little elongation."],
  ["At a point of contraflexure the bending moment…","changes sign (passes through zero)",["is maximum","equals the shear force","is the same as at the supports"],"Seen in overhanging beams between sagging and hogging zones."],
  ["Adding carbon to steel…","raises strength and hardness but lowers ductility",["raises ductility","has no effect","lowers hardness"],"High-carbon steels are hard and wear-resistant but less tough."],
 ])],
3:[
 // continuity + Bernoulli in a reducer (PYQ Q3.7)
 ()=>{const D1=pick([300,250,200]),D2=pick([150,100,125]),v1=pick([1,1.5,2,2.5]),p1=pick([150,180,200,250]),v2=v1*(D1/D2)**2,p2=p1-1000*(v2*v2-v1*v1)/2/1000,w=rnd(0,1);
  PF_VERIFY(Math.abs((p1*1000+500*v1*v1)-(p2*1000+500*v2*v2))<1e-6,"bernoulli energy");
  if(w===0)return gbN(`A horizontal pipe narrows from ${D1} mm to ${D2} mm. Water enters at ${v1} m/s. Find the velocity in the smaller section (in m/s).`,v2,"m/s",`Continuity A₁v₁ = A₂v₂: v₂ = v₁(D₁/D₂)² = ${v1} × (${D1}/${D2})² = ${pfD(v2,3)} m/s.`,[v1*D1/D2,v2/2,v1]);
  return gbN(`Water flows through a horizontal pipe that narrows from ${D1} mm to ${D2} mm. In the larger section the pressure is ${p1} kPa and velocity ${v1} m/s. Find the pressure in the smaller section (in kPa), ignoring losses.`,p2,"kPa",`v₂ = ${pfD(v2,3)} m/s. Bernoulli (same height): p₂ = p₁ − ρ(v₂² − v₁²)/2 = ${p1} − 1000 × (${pfD(v2*v2,3)} − ${pfD(v1*v1,3)})/2/1000 = ${pfD(p2,3)} kPa.`,[p1,p1+1000*(v2*v2-v1*v1)/2000,p2/2])},
 // manometer absolute pressure (PYQ Q3.8)
 ()=>{const h=pick([50,100,150,250]),patm=pick([100,101,101.3]),pg=13600*9.81*h/100/1000,pa=(pg+patm)/1000;
  return gbN(`A mercury manometer shows a tank gauge pressure of ${h} cm of Hg. With ρ<sub>Hg</sub> = 13 600 kg/m³ and atmospheric pressure ${patm} kPa, find the absolute pressure (in MPa).`,pa,"MPa",`p<sub>gauge</sub> = ρgh = 13600 × 9.81 × ${h/100} = ${pfD(pg,2)} kPa; p<sub>abs</sub> = ${pfD(pg,2)} + ${patm} = ${pfD(pg+patm,2)} kPa = ${pfD(pa,4)} MPa.`,[pg/1000,pa*10,patm/1000])},
 // gauge pressure of an oil column
 ()=>{const s=pick([0.8,0.85,0.9,0.95]),h=pick([1,1.5,2,3]),p=s*1000*9.81*h/1000;
  return gbN(`An oil of specific gravity ${s} stands ${h} m deep in a tube. Find the gauge pressure at the bottom (in kN/m²).`,p,"kN/m²",`p = ρgh = ${s*1000} × 9.81 × ${h} = ${pfD(p*1000,1)} N/m² = ${pfD(p,3)} kN/m².`,[p/s,p*10,s*h])},
 // hydraulic lift (PYQ Q3.9)
 ()=>{const a=pick([0.1,0.2,0.05]),A=pick([0.9,1,1.5,2]),W=pick([10000,12000,15000,20000]),F=W*a/A;
  return gbN(`A hydraulic lift has a small piston of ${a} m² and a large piston of ${A} m². A car of weight ${W} N sits on the large piston. Find the force needed on the small piston (in N).`,F,"N",`Pascal's law: equal pressure, F/a = W/A → F = W·a/A = ${W} × ${a}/${A} = ${pfD(F,2)} N.`,[W*A/a,W/A,F*2])},
 // Newton's law of viscosity / kinematic viscosity
 ()=>{const w=rnd(0,1);
  if(w===0){const mu=pick([0.01,0.05,0.1,0.8]),u=pick([0.5,1,2]),y=pick([1,2,5]),tau=mu*u/(y/1000);return gbN(`A plate moves at ${u} m/s over a fixed plate, separated by ${y} mm of oil of viscosity ${mu} Pa·s. Find the shear stress in the oil (in N/m²).`,tau,"N/m²",`Newton's law: τ = μ du/dy = ${mu} × ${u}/${y/1000} = ${pfD(tau,3)} N/m².`,[mu*u/y,tau/2,tau*2])}
  const mu=pick([0.001,0.0015,0.1,0.25]),rho=pick([1000,850,900,1260]),nu=mu/rho*1e6;return gbN(`A fluid has dynamic viscosity ${mu} Pa·s and density ${rho} kg/m³. Find its kinematic viscosity (in mm²/s, i.e. centistokes).`,nu,"cSt",`ν = μ/ρ = ${mu}/${rho} = ${pfS(mu/rho,3)} m²/s = ${pfD(nu,3)} mm²/s.`,[mu*rho,nu*10,nu/2])},
 ()=>gbFact([
  ["Bernoulli's equation along a streamline assumes the flow is…","steady, incompressible, inviscid (frictionless) and irrotational along the streamline",["unsteady and viscous","compressible","turbulent"],"It comes from integrating Euler's equation dp/ρ + v dv + g dz = 0."],
  ["Toothpaste and paint, which flow only after a threshold stress, are…","Bingham plastics",["Newtonian fluids","dilatant fluids","ideal fluids"],"Below the yield stress they behave like solids."],
  ["A Pelton wheel is an…","impulse turbine for high head",["reaction turbine for low head","axial-flow pump","centrifugal compressor"],"All pressure energy is turned into a jet before the wheel."],
  ["A Bourdon tube gauge works because…","an elliptical curved tube straightens as internal pressure rises, moving a pointer",["mercury rises in a column","a diaphragm vibrates","a thermocouple heats"],"The tip motion is magnified by a gear sector and pinion."],
  ["Errors that repeat in the same direction every time (e.g. a zero offset) are…","systematic errors",["random errors","gross errors","statistical noise"],"They can be corrected by calibration; random errors are reduced by averaging."],
 ])],
4:[
 // work with p = aV² + bV (PYQ Q4.10)
 ()=>{const form=rnd(0,1),V1=pick([1,2]),V2=V1+pick([1,2,3]),W=form===0?((V2**3-V1**3)/3+3*(V2*V2-V1*V1)):((V2**3-V1**3)/3+6*(V2-V1));
  return gbN(`During a reversible expansion the pressure is p = (V² + ${form===0?"6V":"6"}) bar, with V in m³. Find the work done as V goes from ${V1} m³ to ${V2} m³ (in MJ).`,W/10,"MJ",`W = ∫p dV = ∫(V² + ${form===0?"6V":"6"}) dV ×10⁵ = [V³/3 + ${form===0?"3V²":"6V"}] from ${V1} to ${V2} ×10⁵ = ${pfD(W,4)}×10⁵ J = ${pfD(W/10,4)} MJ.`,[W,W/100,W/5])},
 // isothermal work (PYQ Q4.10 part 3)
 ()=>{const p1=pick([300,500,600,800]),V1=pick([0.02,0.03,0.05]),r=pick([2,3,4]),W=p1*V1*Math.log(r);
  return gbN(`A fluid expands reversibly and isothermally from ${p1} kPa and ${V1} m³ to ${pfD(V1*r,3)} m³. Find the work done (in kJ).`,W,"kJ",`W = p₁V₁ ln(V₂/V₁) = ${p1} × ${V1} × ln ${r} = ${pfD(W,3)} kJ.`,[p1*V1*(r-1),W/Math.log(r),p1*V1])},
 // Carnot efficiency, sink, heat
 ()=>{const w=rnd(0,2);
  if(w===0){const eta=pick([40,50,60,70]),Th=pick([527,627,727]),Tl=(Th+273)*(1-eta/100)-273;return gbN(`A Carnot engine has an efficiency of ${eta}% and its source is at ${Th} °C. Find the sink temperature (in °C).`,Tl,"°C",`η = 1 − T<sub>L</sub>/T<sub>H</sub> → T<sub>L</sub> = ${Th+273} × (1 − ${eta/100}) = ${pfD(Tl+273,2)} K = ${pfD(Tl,2)} °C.`,[Th*(1-eta/100),Tl+273,Th-eta])}
  if(w===1){const Th=pick([500,600,800]),Tl=pick([300,350,400]),Q=pick([1000,2000,5000]),W=Q*(1-Tl/Th);return gbN(`A reversible engine works between ${Th} K and ${Tl} K and absorbs ${Q} J from the hot reservoir. Find the work done (in J).`,W,"J",`η = 1 − ${Tl}/${Th} = ${pfD(1-Tl/Th,4)}; W = ηQ = ${pfD(W,2)} J.`,[Q*Tl/Th,Q,W/2])}
  const Th=pick([500,600,700]),Tl=pick([30,45,50]),W=pick([100,210,300]),Q=W/(1-(Tl+273)/(Th+273));
  return gbN(`A Carnot engine works between ${Th} °C and ${Tl} °C and produces ${W} kJ of work. Find the heat supplied (in kJ).`,Q,"kJ",`η = 1 − ${Tl+273}/${Th+273} = ${pfD(1-(Tl+273)/(Th+273),4)}; Q = W/η = ${pfD(Q,2)} kJ.`,[W/(1-Tl/Th),Q-W,Q*2])},
 // COP
 ()=>{const Th=pick([300,303,313,318]),Tl=pick([253,258,263,268]),hp=coin(.5),cop=hp?Th/(Th-Tl):Tl/(Th-Tl);
  return gbN(`Find the COP of a reversible ${hp?"heat pump":"refrigerator"} working between ${Tl} K and ${Th} K.`,cop,"",`COP<sub>${hp?"HP":"ref"}</sub> = ${hp?"T<sub>H</sub>":"T<sub>L</sub>"}/(T<sub>H</sub> − T<sub>L</sub>) = ${hp?Th:Tl}/${Th-Tl} = ${pfD(cop,4)}. Note COP<sub>HP</sub> = COP<sub>ref</sub> + 1.`,[hp?cop-1:cop+1,1-Tl/Th,Th/Tl])},
 // coupled engine + refrigerator (PYQ Q4.11)
 ()=>{const Th=pick([873,800,900]),T0=pick([313,303]),Tc=pick([253,263]),Q1=pick([2000,2500]),Wnet=pick([300,360,400]),WE=Q1*(1-T0/Th),WR=WE-Wnet,cop=Tc/(T0-Tc),Q4=WR*cop,rej=(Q1-WE)+(Q4+WR),w=rnd(0,1);
  const base=`A reversible engine (${Th-273} °C → ${T0-273} °C) receives ${Q1} kJ and drives a reversible refrigerator (${Tc-273} °C → ${T0-273} °C). The net work output of the combination is ${Wnet} kJ. `;
  if(w===0)return gbN(base+"Find the heat taken from the cold space by the refrigerator (in kJ).",Q4,"kJ",`Engine: W<sub>E</sub> = ${Q1}(1 − ${T0}/${Th}) = ${pfD(WE,2)} kJ. Refrigerator work = ${pfD(WR,2)} kJ; COP = ${Tc}/(${T0}−${Tc}) = ${pfD(cop,4)}; Q = COP × W = ${pfD(Q4,1)} kJ.`,[WR,WE,Q4+WR]);
  return gbN(base+`Find the total heat rejected to the ${T0-273} °C reservoir (in kJ).`,rej,"kJ",`Engine rejects ${Q1} − ${pfD(WE,2)} = ${pfD(Q1-WE,2)} kJ; refrigerator rejects Q<sub>cold</sub> + W<sub>R</sub> = ${pfD(Q4,1)} + ${pfD(WR,2)} = ${pfD(Q4+WR,1)} kJ. Total ${pfD(rej,1)} kJ.`,[Q1-WE,Q4+WR,rej-Wnet])},
 // first law: fill in missing value (PYQ Q4.12)
 ()=>{const Q=pick([10,18,25,-12,30]),dU=pick([-15,10,32,5,-8]),W=Q-dU;
  return gbN(`A closed system receives Q = ${Q} kJ of heat while its internal energy changes by ΔU = ${dU} kJ. Find the work done by the system (in kJ).`,W,"kJ",`First law: Q = ΔU + W → W = Q − ΔU = ${Q} − (${dU}) = ${W} kJ${W<0?" (work done on the system)":""}.`,[Q+dU,dU-Q,Q])},
 ()=>gbFact([
  ["The Kelvin–Planck statement says…","no cyclic device can turn all the heat from a single reservoir into work",["heat cannot flow from hot to cold","energy is conserved","entropy always decreases"],"A heat engine must reject some heat to a sink: η < 100%."],
  ["The Clausius statement says…","heat cannot flow from a colder to a hotter body without external work",["all heat can be converted to work","entropy of an isolated system decreases","temperature is a property"],"Refrigerators need a work input."],
  ["COP<sub>HP</sub> − COP<sub>ref</sub> equals…","1",["0","the efficiency","T<sub>H</sub>/T<sub>L</sub>"],"Q<sub>H</sub>/W − Q<sub>L</sub>/W = (Q<sub>H</sub> − Q<sub>L</sub>)/W = 1."],
  ["Work and heat are…","path functions (inexact differentials)",["point functions","properties of the system","always equal"],"Their values depend on the process path, not just the end states."],
  ["A perpetual motion machine of the first kind violates…","the first law (it would create energy)",["the second law","the zeroth law","Newton's third law"],"PMM-2 would violate the second law."],
  ["The zeroth law of thermodynamics is the basis of…","temperature measurement (thermometry)",["energy conservation","entropy","heat engines"],"If A and B are each in equilibrium with C, they are in equilibrium with each other."],
 ])],
5:[
 // Otto efficiency
 ()=>{const w=rnd(0,1),g=1.4;
  if(w===0){const r=pick([6,7,8,9,10]),eta=(1-1/r**(g-1))*100;return gbN(`Find the air-standard efficiency of an Otto cycle with compression ratio ${r} (γ = 1.4), in %.`,eta,"%",`η = 1 − 1/r<sup>γ−1</sup> = 1 − 1/${r}<sup>0.4</sup> = ${pfD(eta,2)}%.`,[(1-1/r)*100,eta/2,(1-1/r**g)*100])}
  const c=pick([10,12.5,15,20]),r=1+100/c,eta=(1-1/r**(g-1))*100;
  return gbN(`The clearance volume of an Otto engine is ${c}% of the swept volume. Find its air-standard efficiency (γ = 1.4), in %.`,eta,"%",`r = (V<sub>c</sub> + V<sub>s</sub>)/V<sub>c</sub> = 1 + 100/${c} = ${pfD(r,3)}. η = 1 − 1/r<sup>0.4</sup> = ${pfD(eta,2)}%.`,[(1-1/(100/c)**0.4)*100,eta/2,(1-1/r)*100])},
 // Otto temperatures
 ()=>{const T1=pick([300,303,310]),r=pick([7,8,9]),q=pick([1000,1500,1800]),cv=0.718,T2=T1*r**0.4,T3=T2+q/cv,w=rnd(0,1);
  if(w===0)return gbN(`In an air-standard Otto cycle the minimum temperature is ${T1} K and the compression ratio ${r}. Find the temperature at the end of compression (in K), γ = 1.4.`,T2,"K",`Isentropic compression: T₂ = T₁r<sup>γ−1</sup> = ${T1} × ${r}<sup>0.4</sup> = ${pfD(T2,2)} K.`,[T1*r,T1*r**1.4,T2/2]);
  return gbN(`An Otto cycle starts at ${T1} K, has r = ${r} and receives ${q} kJ/kg at constant volume (c<sub>v</sub> = 0.718 kJ/kg·K). Find the maximum cycle temperature (in K).`,T3,"K",`T₂ = ${T1} × ${r}<sup>0.4</sup> = ${pfD(T2,2)} K; T₃ = T₂ + q/c<sub>v</sub> = ${pfD(T2,2)} + ${q}/0.718 = ${pfD(T3,1)} K.`,[T1+q/cv,T2+q/1.005,T3*0.8])},
 // Diesel efficiency from cut-off percentage (PYQ Q5.8)
 ()=>{const r=pick([14,15,16,18,20]),k=pick([5,6,8,10]),g=1.4,rc=1+k/100*(r-1),eta=(1-(1/(g*r**(g-1)))*((rc**g-1)/(rc-1)))*100;
  return gbN(`A Diesel engine has compression ratio ${r} and cut-off at ${k}% of the stroke. Find its air-standard efficiency (γ = 1.4), in %.`,eta,"%",`Cut-off ratio ρ = 1 + ${k/100}(r − 1) = ${pfD(rc,3)}. η = 1 − [1/(γr<sup>γ−1</sup>)]·(ρ<sup>γ</sup> − 1)/(ρ − 1) = 1 − [1/(1.4 × ${pfD(r**0.4,4)})] × ${pfD((rc**g-1)/(rc-1),4)} = ${pfD(eta,2)}%.`,[(1-1/r**0.4)*100,eta-5,(1-1/r)*100])},
 // swept volume, compression ratio, power
 ()=>{const D=pick([80,100,120]),L=pick([100,120,150]),Vc=pick([80,100,150]),Vs=Math.PI/4*(D/10)**2*(L/10),r=(Vs+Vc)/Vc,w=rnd(0,1);
  if(w===0)return gbN(`An engine has bore ${D} mm and stroke ${L} mm. Find the swept volume (in cm³).`,Vs,"cm³",`V<sub>s</sub> = (π/4)D²L = (π/4) × ${D/10}² × ${L/10} = ${pfD(Vs,2)} cm³.`,[Math.PI*(D/10)**2*(L/10),Vs/2,(D/10)**2*(L/10)]);
  return gbN(`An engine has bore ${D} mm, stroke ${L} mm and clearance volume ${Vc} cm³. Find the compression ratio.`,r,"",`V<sub>s</sub> = (π/4)D²L = ${pfD(Vs,2)} cm³; r = (V<sub>s</sub> + V<sub>c</sub>)/V<sub>c</sub> = ${pfD(Vs+Vc,2)}/${Vc} = ${pfD(r,3)}.`,[Vs/Vc,r+1,r*2])},
 ()=>{const N=pick([1500,2000,3000]),T=pick([50,80,100,150]),BP=2*Math.PI*N*T/60/1000,eta=pick([0.75,0.8,0.85]),IP=BP/eta,w=rnd(0,1);
  if(w===0)return gbN(`An engine delivers a torque of ${T} N·m at ${N} rpm. Find its brake power (in kW).`,BP,"kW",`BP = 2πNT/60 = 2π × ${N} × ${T}/60 = ${pfD(BP*1000,1)} W = ${pfD(BP,3)} kW.`,[N*T/60/1000,BP*2,BP/(2*Math.PI)]);
  return gbN(`An engine gives ${pfD(BP,3)} kW brake power with mechanical efficiency ${eta*100}%. Find its indicated power (in kW).`,IP,"kW",`η<sub>mech</sub> = BP/IP → IP = ${pfD(BP,3)}/${eta} = ${pfD(IP,3)} kW. Friction power = ${pfD(IP-BP,3)} kW.`,[BP*eta,IP-BP,BP])},
 ()=>gbFact([
  ["For the same compression ratio and heat input, the efficiencies rank as…","Otto > Dual > Diesel",["Diesel > Dual > Otto","Dual > Otto > Diesel","all equal"],"Otto adds all heat at the smallest volume. For the same peak pressure and temperature the order reverses."],
  ["A four-stroke engine has one power stroke every…","two crankshaft revolutions",["one revolution","four revolutions","half a revolution"],"Suction, compression, power, exhaust take 720° of crank rotation."],
  ["CI engines use higher compression ratios than SI engines because…","the air must get hot enough to ignite the injected fuel",["petrol needs more air","they run faster","they have spark plugs"],"Typical r = 14–22 for diesel vs 6–10 for petrol (limited by knock)."],
  ["In a two-stroke engine, scavenging means…","pushing out exhaust gas with the incoming fresh charge",["cooling the cylinder","lubricating the piston","pre-heating the fuel"],"Ports replace valves; some fresh charge escapes, lowering efficiency."],
  ["Mean effective pressure is…","the constant pressure that would do the same net work per cycle over the swept volume",["the peak cylinder pressure","the average exhaust pressure","atmospheric pressure"],"MEP = W<sub>net</sub>/V<sub>s</sub>; used to compare engines of different size."],
 ])],
});
