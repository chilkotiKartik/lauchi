/* gen_b.js - question templates for EET-001, ECT-001, MET-001 (helpers are prefixed gb) */
const gbU=(v,u)=>`${String(r2(v)).replace("-","−")}${u?" "+u:""}`;
function gbMcqN(q,ans,unit,why,alts){
 const a=r2(ans),set=[];
 for(const v of [...(alts||[]),a*2,a/2,-a,a*3,a+1,a+2,a*1.5,a*4,a/3,a+5,a*10,a/10]){
  const w=r2(v);
  if(!isFinite(w)||w===a||w===0||set.includes(w))continue;
  if(a>0&&w<0)continue;
  set.push(w);if(set.length===3)break}
 return mcq(q,gbU(a,unit),set.map(w=>gbU(w,unit)),why)}
const gbN=(q,ans,unit,why,alts)=>coin(.5)?nat(q,r2(ans),why):gbMcqN(q,ans,unit,why,alts);
function gbFact(list){const [q,a,d,w]=pick(list);return mcq(q,a,shuffle(d.slice()).slice(0,3),w)}
function gbMsqF(list){
 const [q,R,W,why]=pick(list);
 const k1=R.length>1?Math.min(R.length,rnd(2,3)):1;
 const k2=Math.min(W.length,Math.max(1,4-k1+rnd(0,1)));
 return msq(q,shuffle(R.slice()).slice(0,k1),shuffle(W.slice()).slice(0,k2),why)}
const gbSci=(m,x)=>`${r2(m)}×10<sup>${x}</sup>`;
const gbS3=Math.sqrt(3);
const gbAn=n=>n===8||n===11||n===18?"an":"a";

genAdd("EET-001",{
1:[
 // series-parallel equivalent
 ()=>{const [a,b,p]=pick([[6,3,2],[12,4,3],[6,12,4],[20,5,4],[30,20,12],[10,10,5],[12,6,4],[15,10,6],[9,18,6],[8,8,4]]),R1=rnd(2,12),ans=R1+p;
  return gbN(`A ${R1} Ω resistor is connected in series with a parallel combination of ${a} Ω and ${b} Ω. Find the equivalent resistance of the network (in Ω).`,ans,"Ω",
   `The parallel part is (${a}×${b})/(${a}+${b}) = ${p} Ω. Resistances in series add: ${R1} + ${p} = ${ans} Ω.`,[R1+a+b,r2(R1*p/(R1+p)),a+b])},
 // Thevenin
 ()=>{const [R1,R2]=pick([[2,4],[3,6],[6,3],[4,4],[6,12],[12,6],[10,15],[20,30],[5,20]]),V=pick([12,18,24,30,36,48]),Vth=V*R2/(R1+R2),Rth=R1*R2/(R1+R2),RL=pick([2,4,5,6,8,10]),w=rnd(0,2);
  const base=`A ${V} V source in series with a ${R1} Ω resistor feeds a ${R2} Ω resistor connected across terminals A–B (load removed). `;
  if(w===0)return gbN(base+"Find the Thevenin voltage V<sub>th</sub> at A–B (in V).",Vth,"V",`V<sub>th</sub> is the open-circuit voltage across A–B, i.e. the voltage across ${R2} Ω by the divider rule: ${V}×${R2}/(${R1}+${R2}) = ${r2(Vth)} V.`,[V,r2(V*R1/(R1+R2)),r2(V/2)]);
  if(w===1)return gbN(base+"Find the Thevenin resistance R<sub>th</sub> seen from A–B (in Ω).",Rth,"Ω",`Kill the source (short it): ${R1} Ω and ${R2} Ω are then in parallel as seen from A–B, so R<sub>th</sub> = ${R1}×${R2}/(${R1}+${R2}) = ${r2(Rth)} Ω.`,[R1+R2,R1,R2]);
  const IL=Vth/(Rth+RL);
  return gbN(base+`A ${RL} Ω load is now connected across A–B. Find the load current (in A).`,IL,"A",`V<sub>th</sub> = ${r2(Vth)} V and R<sub>th</sub> = ${r2(Rth)} Ω, so I<sub>L</sub> = V<sub>th</sub>/(R<sub>th</sub> + R<sub>L</sub>) = ${r2(Vth)}/(${r2(Rth)}+${RL}) = ${r2(IL)} A.`,[Vth/RL,V/(R1+RL),Vth/Rth])},
 // Norton
 ()=>{const [R1,R2]=pick([[2,4],[3,6],[6,3],[4,4],[6,12],[12,6],[10,15],[20,30],[5,20]]),V=pick([12,18,24,30,36,48]),IN=V/R1,RN=R1*R2/(R1+R2),RL=pick([2,4,5,6,8,10]),w=rnd(0,2);
  const base=`A ${V} V source in series with a ${R1} Ω resistor feeds a ${R2} Ω resistor connected across terminals A–B. `;
  if(w===0)return gbN(base+"Find the Norton current I<sub>N</sub> (short-circuit current through A–B) in A.",IN,"A",`Shorting A–B bypasses the ${R2} Ω resistor, so the whole current flows through ${R1} Ω: I<sub>N</sub> = ${V}/${R1} = ${r2(IN)} A.`,[V/(R1+R2),V/R2,V/(R1+R2)*2]);
  if(w===1)return gbN(base+"Find the Norton resistance R<sub>N</sub> (in Ω).",RN,"Ω",`R<sub>N</sub> = R<sub>th</sub>: with the source shorted, ${R1} Ω ∥ ${R2} Ω = ${r2(RN)} Ω.`,[R1+R2,R1,R2]);
  const IL=IN*RN/(RN+RL);
  return gbN(base+`Using the Norton equivalent, find the current in a ${RL} Ω load connected across A–B (in A).`,IL,"A",`I<sub>N</sub> = ${r2(IN)} A and R<sub>N</sub> = ${r2(RN)} Ω. Current division: I<sub>L</sub> = I<sub>N</sub>·R<sub>N</sub>/(R<sub>N</sub>+R<sub>L</sub>) = ${r2(IL)} A.`,[IN,IN*RL/(RN+RL),IN/2])},
 // superposition
 ()=>{const R=pick([2,4,6]),V1=pick([6,12,18,24]),V2=pick([6,12,24,30]),w=rnd(0,1);
  const base=`Battery V<sub>1</sub> = ${V1} V in series with ${R} Ω, and battery V<sub>2</sub> = ${V2} V in series with ${R} Ω, are connected (same polarity) in parallel across a ${R} Ω load. `;
  if(w===0){const IL=(V1+V2)/(3*R);return gbN(base+"Using superposition, find the load current (in A).",IL,"A",`V<sub>1</sub> alone (V<sub>2</sub> shorted): source sees ${R} + (${R}∥${R}) = ${1.5*R} Ω, and half of the current reaches the load, giving V<sub>1</sub>/${3*R}. Similarly V<sub>2</sub>/${3*R}. Total I<sub>L</sub> = (${V1}+${V2})/${3*R} = ${r2(IL)} A.`,[(V1+V2)/(2*R),(V1+V2)/R,V1/(3*R)])}
  const I1=V1/(3*R);return gbN(base+"Find the part of the load current produced by V<sub>1</sub> acting alone, with V<sub>2</sub> replaced by a short circuit (in A).",I1,"A",`With V<sub>2</sub> shorted, the circuit is ${R} Ω in series with (${R} Ω ∥ ${R} Ω) = ${1.5*R} Ω total. Source current = ${V1}/${1.5*R}, and it divides equally between the two ${R} Ω paths, so the load gets ${r2(I1)} A.`,[V1/(1.5*R),V1/(2*R),(V1+V2)/(3*R)])},
 // max power transfer
 ()=>{const Vth=pick([12,20,24,30,40,60]),Rth=pick([2,4,5,8,10]),w=rnd(0,2);
  const base=`A source has Thevenin equivalent V<sub>th</sub> = ${Vth} V and R<sub>th</sub> = ${Rth} Ω. `;
  if(w===0)return gbN(base+"Find the maximum power that can be delivered to a load (in W).",Vth*Vth/(4*Rth),"W",`Maximum power occurs when R<sub>L</sub> = R<sub>th</sub> = ${Rth} Ω, and P<sub>max</sub> = V<sub>th</sub>²/(4R<sub>th</sub>) = ${Vth*Vth}/${4*Rth} = ${r2(Vth*Vth/(4*Rth))} W.`,[Vth*Vth/Rth,Vth*Vth/(2*Rth),Vth/Rth]);
  if(w===1)return gbN(base+"Find the load current when the load absorbs maximum power (in A).",Vth/(2*Rth),"A",`At maximum power R<sub>L</sub> = R<sub>th</sub>, so I = V<sub>th</sub>/(2R<sub>th</sub>) = ${Vth}/${2*Rth} = ${r2(Vth/(2*Rth))} A.`,[Vth/Rth,Vth/(4*Rth),Vth*Rth]);
  return mcq("At the maximum power transfer condition, the efficiency of power transfer from the Thevenin source to the load is…","50%",["100%","75%","25%"],"At R<sub>L</sub> = R<sub>th</sub> the same power is dissipated in R<sub>th</sub> as in the load, so efficiency = 50%.")},
 // star-delta
 ()=>{const w=rnd(0,2);
  if(w===0){const R=pick([15,30,45,60,90,12,18,21]);return gbN(`Three equal resistors of ${R} Ω are connected in delta. Find the resistance of each arm of the equivalent star (in Ω).`,R/3,"Ω",`For a balanced delta, R<sub>Y</sub> = R<sub>Δ</sub>/3 = ${R}/3 = ${r2(R/3)} Ω.`,[R*3,R,R/2])}
  if(w===1){const [ab,bc,ca]=pick([[30,60,90],[10,20,30],[20,30,50],[12,24,36],[40,20,60],[15,30,45]]),S=ab+bc+ca,ans=ab*ca/S;
   return gbN(`A delta has R<sub>AB</sub> = ${ab} Ω, R<sub>BC</sub> = ${bc} Ω and R<sub>CA</sub> = ${ca} Ω. Find the resistance R<sub>A</sub> of the equivalent star arm connected to terminal A (in Ω).`,ans,"Ω",`R<sub>A</sub> = R<sub>AB</sub>R<sub>CA</sub>/(R<sub>AB</sub>+R<sub>BC</sub>+R<sub>CA</sub>) = ${ab}×${ca}/${S} = ${r2(ans)} Ω.`,[ab*bc/S,bc*ca/S,S/3])}
  const [a,b,c]=pick([[10,10,10],[6,12,4],[3,6,9],[20,30,60],[10,20,5]]),ans=a+b+a*b/c;
  return gbN(`A star network has R<sub>A</sub> = ${a} Ω, R<sub>B</sub> = ${b} Ω and R<sub>C</sub> = ${c} Ω. Find the equivalent delta resistance R<sub>AB</sub> between terminals A and B (in Ω).`,ans,"Ω",`R<sub>AB</sub> = R<sub>A</sub> + R<sub>B</sub> + R<sub>A</sub>R<sub>B</sub>/R<sub>C</sub> = ${a} + ${b} + ${a*b}/${c} = ${r2(ans)} Ω.`,[a+b,a*b/c,a+b+c])},
 // RL / RC time constant
 ()=>{const w=rnd(0,5);
  if(w===0){const R=pick([10,20,40,50,100]),L=pick([50,100,200,400,500]);return gbN(`A coil of ${L} mH and ${R} Ω resistance is switched on to a dc supply. Find the time constant (in ms).`,L/R,"ms",`For an RL circuit τ = L/R = ${L} mH / ${R} Ω = ${r2(L/R)} ms.`,[L*R,R/L,L/R*2])}
  if(w===1){const R=pick([1,2,5,10]),C=pick([10,20,50,100]);return gbN(`A ${R} kΩ resistor charges a ${C} μF capacitor from a dc source. Find the time constant of the circuit (in ms).`,R*C,"ms",`τ = RC = ${R}×10³ Ω × ${C}×10⁻⁶ F = ${R*C}×10⁻³ s = ${R*C} ms.`,[R*C*1000,R*C/1000,R*C*2])}
  if(w===2){const k=pick([1,2,3,4,5]),ans=100*(1-Math.exp(-k));return nat(`In a series RL circuit switched on to a dc source, what percentage of the final steady current is reached after t = ${k}τ? (give the value to 2 decimals)`,r2(ans),`Growth: i = I<sub>final</sub>(1 − e<sup>−t/τ</sup>). At t = ${k}τ this is 1 − e<sup>−${k}</sup> = ${(1-Math.exp(-k)).toFixed(4)}, i.e. ${r2(ans)}%.`)}
  if(w===3){const k=pick([1,2,3,4]),ans=100*Math.exp(-k);return nat(`A capacitor discharges through a resistor. What percentage of its initial voltage remains after t = ${k}τ? (give the value to 2 decimals)`,r2(ans),`Discharge: v = V<sub>0</sub>e<sup>−t/τ</sup>. At t = ${k}τ this is e<sup>−${k}</sup> = ${Math.exp(-k).toFixed(4)}, i.e. ${r2(ans)}%.`)}
  if(w===4){const V=pick([10,20,50,100]),R=pick([10,20,50,100]),ans=V/R*(1-Math.exp(-1));return nat(`A ${V} V dc supply is switched on to a series RL circuit with R = ${R} Ω. Find the current at t = τ (in A, to 2 decimals).`,r2(ans),`I<sub>final</sub> = V/R = ${V/R} A. At t = τ the current is 63.2% of this: ${V/R}×(1 − e<sup>−1</sup>) = ${r2(ans)} A.`)}
  return mcq("In a first-order RL or RC circuit, after one time constant τ the growing quantity reaches about…","63.2% of its final value",["36.8% of its final value","50% of its final value","95% of its final value"],"For growth x = X(1 − e<sup>−t/τ</sup>), at t = τ we get 1 − e<sup>−1</sup> ≈ 0.632. (36.8% is what is left in a decaying response.)")},
 // concept msq
 ()=>gbMsqF([
  ["Which statements about the superposition theorem are correct?",["It applies only to linear circuits","A source not being considered: an ideal voltage source is replaced by a short circuit","A source not being considered: an ideal current source is replaced by an open circuit","The total response is the algebraic sum of the responses due to each source acting alone"],["It can be used to add the individual powers directly (P = P₁ + P₂)","An ideal voltage source not being considered is replaced by an open circuit","An ideal current source not being considered is replaced by a short circuit"],"Superposition is valid for linear quantities (voltage, current) only. Power is proportional to the square of current, so it is not additive. Voltage sources become shorts, current sources become opens."],
  ["Which statements about Thevenin's and Norton's theorems are correct?",["V<sub>th</sub> is the open-circuit voltage across the terminals","I<sub>N</sub> is the short-circuit current through the terminals","R<sub>th</sub> and R<sub>N</sub> are equal for the same network","The two equivalents are related by a source transformation"],["R<sub>th</sub> is found with all independent sources left active","I<sub>N</sub> = V<sub>th</sub>×R<sub>th</sub>","The theorems apply only to purely resistive circuits with no sources"],"V<sub>th</sub> = open-circuit voltage; I<sub>N</sub> = short-circuit current = V<sub>th</sub>/R<sub>th</sub>; R<sub>th</sub> = R<sub>N</sub> is found with independent sources deactivated."],
  ["Which statements about ideal sources are correct?",["An ideal voltage source has zero internal resistance","An ideal current source has infinite internal resistance","An ideal voltage source keeps its terminal voltage constant whatever the load","An ideal current source keeps its current constant whatever the load"],["An ideal voltage source has infinite internal resistance","An ideal current source has zero internal resistance"],"Ideal voltage source: R<sub>int</sub> = 0. Ideal current source: R<sub>int</sub> = ∞ (drawn as a parallel resistance of infinite value)."]]),
 // KVL loop / internal resistance
 ()=>{const w=rnd(0,2);
  if(w===0){const V1=pick([24,30,36,48]),V2=pick([6,10,12,18]),R1=pick([2,3,4]),R2=pick([1,2,3,6]),ans=(V1-V2)/(R1+R2);return gbN(`Two batteries of ${V1} V and ${V2} V are connected in series opposition with resistors of ${R1} Ω and ${R2} Ω in a single loop. Find the loop current (in A).`,ans,"A",`By KVL, ${V1} − ${V2} = I(${R1} + ${R2}), so I = ${V1-V2}/${R1+R2} = ${r2(ans)} A.`,[(V1+V2)/(R1+R2),(V1-V2)/R1,(V1-V2)/R2])}
  if(w===1){const V1=pick([12,24,30]),V2=pick([6,12,18]),R=pick([2,3,4,5]),ans=(V1+V2)/R;return gbN(`Two batteries of ${V1} V and ${V2} V (ideal) are connected in series aiding across a total loop resistance of ${R} Ω. Find the current (in A).`,ans,"A",`When aiding, the emfs add. KVL: ${V1} + ${V2} = I × ${R}, so I = ${r2(ans)} A.`,[(V1-V2)/R,V1/R,V2/R])}
  const E=pick([12,24,48,110,220]),r=pick([0.5,1,2]),I=pick([2,4,5,10]),ans=E-I*r;
  return gbN(`A battery of emf ${E} V and internal resistance ${r} Ω delivers ${I} A to a load. Find its terminal voltage (in V).`,ans,"V",`V<sub>t</sub> = E − Ir = ${E} − ${I}×${r} = ${r2(ans)} V.`,[E+I*r,E,E/(I*r)])}
],
2:[
 // rms / peak / period / average
 ()=>{const w=rnd(0,4);
  if(w===0){const Vm=pick([100,141,170,200,310,325]);return gbN(`A sinusoidal voltage has a peak value of ${Vm} V. Find its rms value (in V).`,Vm/Math.SQRT2,"V",`V<sub>rms</sub> = V<sub>m</sub>/√2 = ${Vm}/1.4142 = ${r2(Vm/Math.SQRT2)} V.`,[Vm*Math.SQRT2,Vm/2,Vm*0.637])}
  if(w===1){const Vr=pick([110,230,240,400,415]);return gbN(`The supply voltage is ${Vr} V rms. Find its peak value (in V).`,Vr*Math.SQRT2,"V",`V<sub>m</sub> = √2 × V<sub>rms</sub> = 1.4142 × ${Vr} = ${r2(Vr*Math.SQRT2)} V.`,[Vr/Math.SQRT2,Vr*2,Vr*0.637])}
  if(w===2){const f=pick([50,60,25,400,100]);return gbN(`Find the time period of a ${f} Hz sinusoidal supply (in ms).`,1000/f,"ms",`T = 1/f = 1/${f} s = ${r2(1000/f)} ms.`,[f,f/1000,2000/f])}
  if(w===3){const Vm=pick([10,20,50,100,200]);return nat(`Find the average value over a half cycle of a sinusoid of peak value ${Vm} V (in V, to 2 decimals).`,r2(2*Vm/Math.PI),`V<sub>avg</sub> = 2V<sub>m</sub>/π = 0.637V<sub>m</sub> = 2×${Vm}/π = ${r2(2*Vm/Math.PI)} V.`)}
  return mcq("For a sinusoidal waveform, the form factor (V<sub>rms</sub> / V<sub>avg</sub>) and peak factor (V<sub>m</sub> / V<sub>rms</sub>) are respectively…","1.11 and 1.414",["1.414 and 1.11","0.707 and 0.637","1.57 and 1.11"],"V<sub>rms</sub>/V<sub>avg</sub> = 0.707V<sub>m</sub>/0.637V<sub>m</sub> = 1.11 and V<sub>m</sub>/V<sub>rms</sub> = √2 = 1.414.")},
 // series RLC
 ()=>{const [R,net]=pick([[3,4],[6,8],[8,6],[5,12],[12,5],[9,12],[12,16],[15,20],[20,15],[8,15]]),ind=coin(.5),base=pick([2,4,6,10]);
  const XL=ind?base+net:base,XC=ind?base:base+net,Z=Math.sqrt(R*R+net*net),V=pick([100,120,200,230,240]),w=rnd(0,3);
  const stem=`A series circuit has R = ${R} Ω, X<sub>L</sub> = ${XL} Ω and X<sub>C</sub> = ${XC} Ω. `;
  if(w===0)return gbN(stem+"Find the impedance (in Ω).",Z,"Ω",`Net reactance X = X<sub>L</sub> − X<sub>C</sub> = ${neg(XL-XC)} Ω. Z = √(R² + X²) = √(${R*R} + ${net*net}) = ${r2(Z)} Ω.`,[R+net,R+XL+XC,Math.abs(XL-XC)]);
  if(w===1)return gbN(stem+`It is connected to a ${V} V supply. Find the current (in A).`,V/Z,"A",`Z = √(${R}² + ${net}²) = ${r2(Z)} Ω, so I = V/Z = ${V}/${r2(Z)} = ${r2(V/Z)} A.`,[V/R,V/(R+net),V/net]);
  if(w===2)return gbN(stem+"Find the power factor of the circuit.",R/Z,"",`cos φ = R/Z = ${R}/${r2(Z)} = ${r2(R/Z)}.`,[net/Z,R/net,Z/R]);
  return mcq(stem+"The circuit behaves as…",ind?"an inductive circuit (current lags the voltage)":"a capacitive circuit (current leads the voltage)",[ind?"a capacitive circuit (current leads the voltage)":"an inductive circuit (current lags the voltage)","a purely resistive circuit","a circuit at resonance"],`X<sub>L</sub> ${ind?"&gt;":"&lt;"} X<sub>C</sub>, so the net reactance is ${ind?"inductive":"capacitive"}.`)},
 // resonance
 ()=>{const w=rnd(0,3);
  if(w===0){const L=pick([10,20,25,50,100]),C=pick([1,2,5,10,20]),f=1/(2*Math.PI*Math.sqrt(L*1e-3*C*1e-6));return gbN(`Find the resonant frequency of a series RLC circuit with L = ${L} mH and C = ${C} μF (in Hz).`,f,"Hz",`f₀ = 1/(2π√(LC)) = 1/(2π√(${L}×10⁻³ × ${C}×10⁻⁶)) = ${r2(f)} Hz.`,[1/Math.sqrt(L*1e-3*C*1e-6),f*2,f/2])}
  if(w===1){const [L,C,rho]=pick([[10,1,100],[1,10,10],[10,100,10],[100,10,100],[100,1000,10],[1000,100,100]]),R=pick([5,10,20,25,50]);return gbN(`A series RLC circuit has L = ${L} mH, C = ${C} μF and R = ${R} Ω. Find its quality factor Q at resonance.`,rho/R,"",`Q = (1/R)√(L/C). Here √(L/C) = √(${L}×10⁻³/${C}×10⁻⁶) = ${rho} Ω, so Q = ${rho}/${R} = ${r2(rho/R)}.`,[rho*R,R/rho,rho/R*2])}
  if(w===2){const f0=pick([500,1000,2000,5000]),Q=pick([5,10,20,25,50]);return gbN(`A series resonant circuit has f₀ = ${f0} Hz and Q = ${Q}. Find its bandwidth (in Hz).`,f0/Q,"Hz",`Bandwidth = f₀/Q = ${f0}/${Q} = ${r2(f0/Q)} Hz.`,[f0*Q,Q/f0,f0/Q/2])}
  return gbMsqF([
   ["Which of the following are true for a series RLC circuit at resonance?",["The impedance is minimum and equal to R","The current is maximum","The power factor is unity","X<sub>L</sub> = X<sub>C</sub>"],["The impedance is maximum","The current is minimum","The circuit is purely capacitive","The voltage across R is zero"],"At resonance X<sub>L</sub> = X<sub>C</sub>, so the reactances cancel: Z = R (minimum), I = V/R (maximum) and φ = 0."],
   ["Which are true for a parallel RLC circuit at resonance (ideal components)?",["The impedance is maximum","The supply current is minimum","The power factor is unity","I<sub>L</sub> and I<sub>C</sub> are equal and opposite"],["The impedance is minimum","The supply current is maximum","The circuit is purely inductive"],"Parallel resonance: the inductor and capacitor currents cancel, leaving only the resistor current. The line current is minimum and the impedance is maximum."]])},
 // power triangle
 ()=>{const V=pick([100,110,200,230,240]),I=pick([5,10,15,20]),[pf,sn]=pick([[0.6,0.8],[0.8,0.6]]),S=V*I,w=rnd(0,3);
  const stem=`A load draws ${I} A from a ${V} V single-phase supply at a power factor of ${pf} lagging. `;
  if(w===0)return gbN(stem+"Find the real power (in W).",S*pf,"W",`P = VI cos φ = ${V}×${I}×${pf} = ${r2(S*pf)} W.`,[S,S*sn,S/pf]);
  if(w===1)return gbN(stem+"Find the reactive power (in VAR).",S*sn,"VAR",`sin φ = √(1 − ${pf}²) = ${sn}. Q = VI sin φ = ${S}×${sn} = ${r2(S*sn)} VAR.`,[S*pf,S,S/sn]);
  if(w===2)return gbN(stem+"Find the apparent power (in VA).",S,"VA",`S = VI = ${V}×${I} = ${S} VA.`,[S*pf,S*sn,S/pf]);
  const P=pick([2,3,4,6,8,12])*1000;return gbN(`A load takes ${P} W at a power factor of ${pf}. Find its apparent power (in VA).`,P/pf,"VA",`S = P/cos φ = ${P}/${pf} = ${r2(P/pf)} VA.`,[P*pf,P,P/sn])},
 // star / delta relations
 ()=>{const w=rnd(0,3);
  if(w===0){const VL=pick([400,415,440,380,11000,220]);return gbN(`In a balanced star-connected system the line voltage is ${VL} V. Find the phase voltage (in V).`,VL/gbS3,"V",`For star, V<sub>L</sub> = √3 V<sub>ph</sub>, so V<sub>ph</sub> = ${VL}/1.732 = ${r2(VL/gbS3)} V.`,[VL*gbS3,VL,VL/2])}
  if(w===1){const Vp=pick([110,230,240,127,254]);return gbN(`In a balanced star system the phase voltage is ${Vp} V. Find the line voltage (in V).`,Vp*gbS3,"V",`V<sub>L</sub> = √3 V<sub>ph</sub> = 1.732×${Vp} = ${r2(Vp*gbS3)} V.`,[Vp/gbS3,Vp,Vp*3])}
  if(w===2){const Ip=pick([5,8,10,12,20]);return gbN(`Each phase of a balanced delta-connected load carries ${Ip} A. Find the line current (in A).`,Ip*gbS3,"A",`In delta, I<sub>L</sub> = √3 I<sub>ph</sub> = 1.732×${Ip} = ${r2(Ip*gbS3)} A.`,[Ip,Ip/gbS3,Ip*3])}
  const IL=pick([10,15,20,30]);return gbN(`The line current of a balanced delta-connected load is ${IL} A. Find the phase current (in A).`,IL/gbS3,"A",`I<sub>ph</sub> = I<sub>L</sub>/√3 = ${IL}/1.732 = ${r2(IL/gbS3)} A.`,[IL*gbS3,IL,IL/3])},
 // 3-phase power
 ()=>{const w=rnd(0,2);
  if(w===0){const VL=pick([400,415,440,220]),IL=pick([5,10,15,20]),pf=pick([0.6,0.8,0.9,0.85]),P=gbS3*VL*IL*pf;return gbN(`A balanced three-phase load takes ${IL} A at ${VL} V line voltage with power factor ${pf}. Find the total real power (in W).`,P,"W",`P = √3 V<sub>L</sub>I<sub>L</sub> cos φ = 1.732×${VL}×${IL}×${pf} = ${r2(P)} W.`,[VL*IL*pf,3*VL*IL*pf,gbS3*VL*IL])}
  if(w===1){const VL=pick([200,400,440]),R=pick([10,20,40]),star=coin(.5),P=star?VL*VL/R:3*VL*VL/R;return gbN(`Three identical ${R} Ω resistors are connected in ${star?"star":"delta"} across a ${VL} V, 3-phase supply. Find the total power absorbed (in W).`,P,"W",star?`Phase voltage = ${VL}/√3, so each resistor takes V<sub>L</sub>²/(3R); total = V<sub>L</sub>²/R = ${VL*VL}/${R} = ${r2(P)} W.`:`Each resistor has the full line voltage: ${VL}²/${R} W; three of them give 3V<sub>L</sub>²/R = ${r2(P)} W.`,[star?3*VL*VL/R:VL*VL/R,VL*VL/(3*R),VL*VL/(R*R)])}
  const VL=pick([400,415,440]),IL=pick([10,20,25]);return gbN(`A balanced 3-phase load takes ${IL} A from a ${VL} V line supply. Find the apparent power (in VA).`,gbS3*VL*IL,"VA",`S = √3 V<sub>L</sub>I<sub>L</sub> = 1.732×${VL}×${IL} = ${r2(gbS3*VL*IL)} VA.`,[VL*IL,3*VL*IL,gbS3*VL*IL/2])},
 // parallel circuits
 ()=>{const w=rnd(0,1);
  if(w===0){const [a,b]=pick([[3,4],[6,8],[5,12],[8,6],[9,12],[12,5]]),k=pick([1,2]),IR=a*k,net=b*k,IC=pick([2,4,6]),ind=coin(.5),IL=ind?IC+net:IC,ICc=ind?IC:IC+net,I=Math.sqrt(IR*IR+net*net);
   return gbN(`In a parallel RLC circuit the branch currents are I<sub>R</sub> = ${IR} A, I<sub>L</sub> = ${IL} A and I<sub>C</sub> = ${ICc} A. Find the supply current (in A).`,I,"A",`I<sub>L</sub> and I<sub>C</sub> are 180° apart, so the net reactive current is |${IL} − ${ICc}| = ${net} A. I = √(${IR}² + ${net}²) = ${r2(I)} A.`,[IR+IL+ICc,IR+net,Math.abs(IR-net)])}
  const [R,X]=pick([[30,40],[40,30],[60,80],[24,32],[15,20]]),V=pick([60,120,240]),I=Math.sqrt(Math.pow(V/R,2)+Math.pow(V/X,2));
  return gbN(`A ${R} Ω resistor is in parallel with an inductor of reactance ${X} Ω across a ${V} V ac supply. Find the total current (in A).`,I,"A",`I<sub>R</sub> = ${V}/${R} = ${r2(V/R)} A and I<sub>L</sub> = ${V}/${X} = ${r2(V/X)} A (90° apart). I = √(I<sub>R</sub>² + I<sub>L</sub>²) = ${r2(I)} A.`,[V/R+V/X,V/Math.sqrt(R*R+X*X),Math.abs(V/R-V/X)])},
 // two-wattmeter
 ()=>{const W2=pick([500,1000,1500,2000]),k=pick([0,1,2,3]),W1=W2*(k===0?1:k===1?1:k===2?2:3),w=rnd(0,1);
  const [a,b]=k===0?[W2,0]:[W1,W2];
  const pf=Math.cos(Math.atan(gbS3*(a-b)/(a+b)));
  if(w===0)return gbN(`In the two-wattmeter method on a balanced 3-phase load, the wattmeters read ${a} W and ${b} W. Find the total power (in W).`,a+b,"W",`Total power = W₁ + W₂ = ${a} + ${b} = ${a+b} W.`,[a-b,(a+b)/2,gbS3*(a+b)]);
  return gbN(`In the two-wattmeter method the readings are ${a} W and ${b} W. Find the power factor of the load (to 2 decimals).`,pf,"",`tan φ = √3(W₁ − W₂)/(W₁ + W₂) = 1.732×${a-b}/${a+b} = ${r2(gbS3*(a-b)/(a+b))}, so φ = ${r2(Math.atan(gbS3*(a-b)/(a+b))*180/Math.PI)}° and cos φ = ${r2(pf)}.`,[b/a,1-pf,Math.sin(Math.atan(gbS3*(a-b)/(a+b)))])},
 // reactances
 ()=>{const w=rnd(0,1),f=pick([50,60,100,400,1000]);
  if(w===0){const L=pick([10,20,50,100,200]),X=2*Math.PI*f*L/1000;return gbN(`Find the reactance of a ${L} mH inductor at ${f} Hz (in Ω).`,X,"Ω",`X<sub>L</sub> = 2πfL = 2π×${f}×${L}×10⁻³ = ${r2(X)} Ω.`,[1/(2*Math.PI*f*L/1000),X/2,X*2*Math.PI])}
  const C=pick([10,22,47,100,220]),X=1/(2*Math.PI*f*C*1e-6);return gbN(`Find the reactance of a ${C} μF capacitor at ${f} Hz (in Ω).`,X,"Ω",`X<sub>C</sub> = 1/(2πfC) = 1/(2π×${f}×${C}×10⁻⁶) = ${r2(X)} Ω.`,[2*Math.PI*f*C*1e-6,X*2,X/2])}
],
3:[
 // turns ratio
 ()=>{const a=pick([2,4,5,10,20]),V1=pick([220,440,2200,4400]),N1=pick([400,500,1000,2000]),V2=V1/a,N2=N1/a,w=rnd(0,3);
  if(w===0)return gbN(`An ideal single-phase transformer has ${N1} primary turns and is supplied at ${V1} V. To get ${V2} V at the secondary, how many secondary turns are needed?`,N2,"turns",`V₁/V₂ = N₁/N₂, so N₂ = N₁V₂/V₁ = ${N1}×${V2}/${V1} = ${N2}.`,[N1*a,N1+V2,N1/V2]);
  if(w===1)return gbN(`An ideal transformer has ${N1} primary turns and ${N2} secondary turns, with ${V1} V applied to the primary. Find the secondary voltage (in V).`,V2,"V",`V₂ = V₁ (N₂/N₁) = ${V1}×${N2}/${N1} = ${V2} V.`,[V1*a,V1+N2,V1/N2]);
  if(w===2){const I2=pick([5,10,20,25]);return gbN(`An ideal step-down transformer has a turns ratio N₁/N₂ = ${a}. If the secondary current is ${I2} A, find the primary current (in A).`,I2/a,"A",`For an ideal transformer V₁I₁ = V₂I₂, so I₁ = I₂ (N₂/N₁) = ${I2}/${a} = ${r2(I2/a)} A.`,[I2*a,I2,I2+a])}
  return gbN(`A transformer has ${N1} primary turns and ${N2} secondary turns. Find the transformation ratio K = N₂/N₁.`,1/a,"",`K = N₂/N₁ = ${N2}/${N1} = ${r2(1/a)}. Since K &lt; 1, this is a step-down transformer.`,[a,a*2,1/(2*a)])},
 // EMF equation
 ()=>{const f=pick([50,60]),N=pick([100,200,400,500,800,1000]),Phi=pick([2,3,4,5,6,8,10]),E=4.44*f*N*Phi/1000,w=rnd(0,1);
  if(w===0)return gbN(`A transformer winding of ${N} turns links a maximum flux of ${Phi} mWb at ${f} Hz. Find the rms induced emf (in V).`,E,"V",`E = 4.44 f N Φ<sub>m</sub> = 4.44×${f}×${N}×${Phi}×10⁻³ = ${r2(E)} V.`,[E/4.44*Math.SQRT2,E*2,E/2]);
  const Ev=pick([110,220,230,440]),Nn=pick([100,200,400,500]),Ph=Ev/(4.44*f*Nn)*1000;
  return gbN(`A ${f} Hz transformer primary has ${Nn} turns and is connected to ${Ev} V. Find the maximum core flux (in mWb).`,Ph,"mWb",`Φ<sub>m</sub> = E/(4.44 f N) = ${Ev}/(4.44×${f}×${Nn}) = ${r2(Ph)} mWb.`,[Ph*4.44,Ph/2,Ph*2])},
 // efficiency
 ()=>{const S=pick([50,100,200]),pf=pick([0.8,0.9,1.0]),Pi=pick([0.2,0.4,0.5,0.8,1]),Pc=pick([0.4,0.6,1,1.5,2]),x=pick([1,1,0.5]),out=S*pf*x,cu=Pc*x*x,eta=100*out/(out+Pi+cu);
  return gbN(`A ${S} kVA transformer has an iron loss of ${Pi} kW and a full-load copper loss of ${Pc} kW. Find its efficiency (%) at ${x===1?"full load":"half load"} and ${pf} power factor.`,eta,"%",`Output = ${S}×${x}×${pf} = ${r2(out)} kW. Copper loss = ${Pc}×${x}² = ${r2(cu)} kW (varies with the square of the load). η = ${r2(out)}/(${r2(out)}+${Pi}+${r2(cu)}) = ${r2(eta)}%.`,[100*out/(out+Pi+Pc),100*out/(out+Pi),100-eta])},
 // max efficiency condition
 ()=>{const Pi=pick([0.2,0.4,0.5,0.8,1]),k=pick([2,3]),Pc=Pi*k*k,w=rnd(0,1),S=pick([20,30,50,100]);
  if(w===0)return gbN(`A transformer has an iron loss of ${r2(Pi)} kW and a full-load copper loss of ${r2(Pc)} kW. At what percentage of full load is its efficiency maximum?`,100/k,"%",`Efficiency is maximum when copper loss = iron loss. With copper loss = ${r2(Pc)}x² kW, x = √(${r2(Pi)}/${r2(Pc)}) = 1/${k}, i.e. ${r2(100/k)}% of full load.`,[100*k,100/(k*k),50]);
  return gbN(`A ${S} kVA transformer has an iron loss of ${r2(Pi)} kW and a full-load copper loss of ${r2(Pc)} kW. At what kVA output is its efficiency maximum?`,S/k,"kVA",`Maximum efficiency occurs at x = √(P<sub>i</sub>/P<sub>cu,fl</sub>) = 1/${k}. Output = ${S}/${k} = ${r2(S/k)} kVA.`,[S*k,S/(k*k),S/2])},
 // regulation
 ()=>{const Vfl=pick([200,220,230,240,250,400]),d=pick([4,5,6,8,10,12]),Vnl=Vfl+d,reg=100*d/Vfl;
  return gbN(`The secondary terminal voltage of a transformer is ${Vnl} V at no load and ${Vfl} V at full load. Find its voltage regulation (%).`,reg,"%",`Regulation = (V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub> × 100 = (${Vnl} − ${Vfl})/${Vfl} × 100 = ${r2(reg)}%.`,[100*d/Vnl,d,100*Vfl/Vnl])},
 // magnetic circuit numbers
 ()=>{const w=rnd(0,3);
  if(w===0){const N=pick([200,500,1000]),I=pick([0.5,1,2,4]),s=pick([1,2,4,5,10]);return gbN(`A coil of ${N} turns carries ${I} A on a magnetic circuit whose reluctance is ${s}×10⁶ AT/Wb. Find the flux (in μWb).`,N*I/s,"μWb",`mmf = NI = ${N}×${I} = ${N*I} AT. Φ = mmf/S = ${N*I}/(${s}×10⁶) Wb = ${r2(N*I/s)} μWb.`,[N*I*s,N*I/(s*s),N/(I*s)])}
  if(w===1){const N=pick([200,500,1000]),I=pick([0.5,1,2,4]),l=pick([0.25,0.4,0.5,1]);return gbN(`A toroidal coil of ${N} turns carries ${I} A. The mean length of the magnetic path is ${l} m. Find the magnetising force H (in A/m).`,N*I/l,"A/m",`H = NI/l = ${N}×${I}/${l} = ${r2(N*I/l)} A/m.`,[N*I*l,N*I,N*I/(2*l)])}
  if(w===2){const Phi=pick([0.2,0.4,0.6,0.8,1.2]),A=pick([2,4,5,8]);return gbN(`A core of cross-section ${A} cm² carries a flux of ${Phi} mWb. Find the flux density (in T).`,10*Phi/A,"T",`B = Φ/A = ${Phi}×10⁻³/(${A}×10⁻⁴) = ${r2(10*Phi/A)} T.`,[Phi*A/10,Phi/A,100*Phi/A])}
  const H=pick([200,400,500,800,1000]),ur=pick([500,1000,2000]),B=4*Math.PI*1e-7*ur*H;return gbN(`In a magnetic material of relative permeability ${ur}, H = ${H} A/m. Find B (in T, μ₀ = 4π×10⁻⁷ H/m).`,B,"T",`B = μ₀μ<sub>r</sub>H = 4π×10⁻⁷×${ur}×${H} = ${r2(B)} T.`,[B/ur,B*ur,4*Math.PI*1e-7*H])},
 // Faraday / inductance / energy
 ()=>{const w=rnd(0,2);
  if(w===0){const N=pick([100,200,500,1000]),dP=pick([2,4,5,10]),dt=pick([5,10,20,50]);return gbN(`A coil of ${N} turns experiences a flux change of ${dP} mWb in ${dt} ms. Find the average induced emf (in V).`,N*dP/dt,"V",`e = N ΔΦ/Δt = ${N}×${dP}×10⁻³/(${dt}×10⁻³) = ${r2(N*dP/dt)} V.`,[N*dP,dP/dt,N*dt/dP])}
  if(w===1){const N=pick([200,500,1000]),Phi=pick([1,2,4,5]),I=pick([2,4,5,10]),L=N*Phi/1000/I;return gbN(`A coil of ${N} turns produces a flux of ${Phi} mWb when carrying ${I} A. Find its self-inductance (in H).`,L,"H",`L = NΦ/I = ${N}×${Phi}×10⁻³/${I} = ${r2(L)} H.`,[L*1000,N*I/Phi,L/2])}
  const L=pick([0.2,0.5,1,2,4]),I=pick([2,4,5,10]);return gbN(`An inductor of ${L} H carries ${I} A. Find the energy stored in its magnetic field (in J).`,0.5*L*I*I,"J",`W = ½LI² = 0.5×${L}×${I}² = ${r2(0.5*L*I*I)} J.`,[L*I*I,0.5*L*I,L*I])},
 // measuring instruments
 ()=>{const w=rnd(0,2);
  if(w===0){const Im=pick([1,5,10,25]),n=pick([2,5,11,21]),Rm=pick([10,20,40,50,100]),I=Im*n;return gbN(`A moving-coil ammeter has full-scale current ${Im} mA and coil resistance ${Rm} Ω. Find the shunt resistance needed to extend its range to ${I} mA (in Ω).`,Rm/(n-1),"Ω",`Range multiplier n = ${I}/${Im} = ${n}. R<sub>sh</sub> = R<sub>m</sub>/(n − 1) = ${Rm}/${n-1} = ${r2(Rm/(n-1))} Ω.`,[Rm*(n-1),Rm/n,Rm])}
  if(w===1){const Im=pick([1,2,5,10]),V=pick([10,50,100,250]),Rm=pick([50,100,200]),Rs=V/(Im/1000)-Rm;return gbN(`A PMMC meter has full-scale current ${Im} mA and coil resistance ${Rm} Ω. What series resistance converts it into a ${V} V voltmeter (in Ω)?`,Rs,"Ω",`Total resistance = V/I<sub>m</sub> = ${V}/${Im}×10⁻³ = ${V/(Im/1000)} Ω. R<sub>s</sub> = ${V/(Im/1000)} − ${Rm} = ${Rs} Ω.`,[V/(Im/1000),V/(Im/1000)+Rm,Rm*V/Im])}
  return gbMsqF([
   ["Which statements about PMMC and moving-iron (MI) instruments are correct?",["A PMMC instrument can measure dc only","An MI instrument can measure both ac and dc","A PMMC instrument has a uniform (linear) scale","An MI instrument has a non-uniform scale (crowded at the low end)"],["A PMMC instrument can measure both ac and dc directly","An MI instrument has a perfectly linear scale","A PMMC instrument is cheaper and less accurate than an MI instrument"],"In PMMC the deflection is proportional to the current (dc only, linear scale). In MI the deflection depends on I², so it works on ac and dc but has a non-uniform scale."]])},
 // B-H / magnetic materials facts
 ()=>gbFact([
  ["The area enclosed by the B–H (hysteresis) loop of a magnetic material represents…","energy lost per unit volume per cycle",["energy stored per unit volume","permeability of the material","flux density at saturation"],"Each cycle of magnetisation dissipates energy as heat, equal to the loop area (J/m³ per cycle)."],
  ["The flux density that remains in a magnetic material after the magnetising field is removed is called…","residual flux density (retentivity)",["coercivity","saturation flux density","permeability"],"Retentivity B<sub>r</sub> is the B left at H = 0; coercivity is the reverse H needed to bring B back to zero."],
  ["Which type of magnetic material is preferred for transformer cores?","a soft magnetic material with a narrow hysteresis loop",["a hard magnetic material with a wide hysteresis loop","a diamagnetic material","a non-magnetic material"],"A narrow loop means low hysteresis loss. Wide-loop hard materials are used for permanent magnets."],
  ["Laminating a transformer core mainly reduces…","eddy current loss",["copper loss","hysteresis loss","leakage flux"],"Thin insulated laminations break up the paths of eddy currents, reducing eddy loss (∝ t²). Silicon steel is used to reduce hysteresis loss."],
  ["Iron (core) loss in a transformer is practically…","constant from no load to full load",["proportional to the load current","proportional to the square of load current","zero at no load"],"Core loss depends on the supply voltage and frequency (flux), which stay constant, so it is the same at all loads."],
  ["Copper loss in a transformer is proportional to…","the square of the load current",["the load current","the supply voltage","the supply frequency"],"P<sub>cu</sub> = I²R, so it varies as the square of the load current."],
  ["A transformer is rated in kVA (not kW) because…","copper loss depends on current and iron loss on voltage, independent of power factor",["it always works at unity power factor","its efficiency is 100%","kW cannot be measured for a transformer"],"Both losses depend on V and I, not on the load power factor, so the safe rating is V×I."],
  ["A transformer works on the principle of…","mutual induction",["self induction only","electrostatic induction","the Hall effect"],"An alternating flux set up by the primary links the secondary and induces an emf in it (Faraday's law: mutual induction)."]])
],
4:[
 // synchronous speed
 ()=>{const f=pick([50,50,60]),P=pick([2,4,6,8,10,12]),Ns=120*f/P;return gbN(`Find the synchronous speed of ${gbAn(P)} ${P}-pole machine on a ${f} Hz supply (in rpm).`,Ns,"rpm",`N<sub>s</sub> = 120f/P = 120×${f}/${P} = ${Ns} rpm.`,[60*f/P,120*P/f,Ns*2])},
 // slip
 ()=>{const f=50,P=pick([2,4,6,8]),Ns=120*f/P,s=pick([2,3,4,5]),N=Ns*(1-s/100),w=rnd(0,1);
  if(w===0)return gbN(`${gbAn(P)[0].toUpperCase()+gbAn(P).slice(1)} ${P}-pole, 50 Hz three-phase induction motor runs at ${r2(N)} rpm. Find its percentage slip.`,s,"%",`N<sub>s</sub> = 120×50/${P} = ${Ns} rpm. Slip = (N<sub>s</sub> − N)/N<sub>s</sub> = (${Ns} − ${r2(N)})/${Ns} = ${s/100} = ${s}%.`,[100*N/Ns,s*2,s/2]);
  return gbN(`${gbAn(P)[0].toUpperCase()+gbAn(P).slice(1)} ${P}-pole, 50 Hz induction motor runs with a slip of ${s}%. Find its rotor speed (in rpm).`,N,"rpm",`N<sub>s</sub> = ${Ns} rpm. N = N<sub>s</sub>(1 − s) = ${Ns}×${1-s/100} = ${r2(N)} rpm.`,[Ns*(1+s/100),Ns*s/100,Ns])},
 // rotor frequency / rotor emf
 ()=>{const f=pick([50,60]),s=pick([2,3,4,5,6]),w=rnd(0,1);
  if(w===0)return gbN(`The stator supply frequency of a 3-phase induction motor is ${f} Hz and the slip is ${s}%. Find the rotor current frequency (in Hz).`,f*s/100,"Hz",`f<sub>r</sub> = s f = ${s/100}×${f} = ${r2(f*s/100)} Hz.`,[f,f*(1-s/100),f/s]);
  return mcq("At the instant of starting (rotor at standstill), an induction motor has slip s and rotor frequency…","s = 1 and f<sub>r</sub> = supply frequency",["s = 0 and f<sub>r</sub> = 0","s = 1 and f<sub>r</sub> = 0","s = 0 and f<sub>r</sub> = supply frequency"],"s = (N<sub>s</sub> − N)/N<sub>s</sub> = 1 when N = 0, and f<sub>r</sub> = sf equals the supply frequency. At synchronous speed s = 0 and f<sub>r</sub> = 0.")},
 // DC generator emf
 ()=>{const P=pick([4,6]),Phi=pick([20,25,30,50]),Z=pick([400,500,600,720]),N=pick([1000,1200,1500]),lap=coin(.5),A=lap?P:2,E=P*Phi/1000*Z*N/(60*A);
  return gbN(`${gbAn(P)[0].toUpperCase()+gbAn(P).slice(1)} ${P}-pole ${lap?"lap":"wave"}-wound dc generator has ${Z} conductors, ${Phi} mWb flux per pole and runs at ${N} rpm. Find the generated emf (in V).`,E,"V",`E = PΦZN/(60A) with A = ${lap?"P = "+P:"2"} for ${lap?"lap":"wave"} winding: ${P}×${Phi}×10⁻³×${Z}×${N}/(60×${A}) = ${r2(E)} V.`,[E*A/P,E*2,E/2])},
 // DC motor
 ()=>{const V=pick([110,220,240]),Ra=pick([0.5,1,2]),w=rnd(0,2);
  if(w===0){const Ia=pick([10,20,25,30]),Eb=V-Ia*Ra;return gbN(`A ${V} V dc motor has armature resistance ${Ra} Ω and takes an armature current of ${Ia} A. Find the back emf (in V).`,Eb,"V",`E<sub>b</sub> = V − I<sub>a</sub>R<sub>a</sub> = ${V} − ${Ia}×${Ra} = ${r2(Eb)} V.`,[V+Ia*Ra,V,V/(Ia*Ra)])}
  if(w===1){const IL=pick([12,22,32,42]),Rsh=pick([110,220])===110?110:220,Ish=V/Rsh,Ia=IL-Ish,Eb=V-Ia*Ra;return gbN(`A ${V} V dc shunt motor takes a line current of ${IL} A. The field (shunt) resistance is ${Rsh} Ω and armature resistance is ${Ra} Ω. Find the back emf (in V).`,Eb,"V",`I<sub>sh</sub> = ${V}/${Rsh} = ${r2(Ish)} A, so I<sub>a</sub> = ${IL} − ${r2(Ish)} = ${r2(Ia)} A. E<sub>b</sub> = V − I<sub>a</sub>R<sub>a</sub> = ${V} − ${r2(Ia)}×${Ra} = ${r2(Eb)} V.`,[V-IL*Ra,V,V-Ish*Ra])}
  const Ia=pick([10,20,25,40]),Eb=V-Ia*Ra,Pm=Eb*Ia;return gbN(`A ${V} V dc motor with R<sub>a</sub> = ${Ra} Ω draws an armature current of ${Ia} A. Find the electrical power converted to mechanical form, E<sub>b</sub>I<sub>a</sub> (in W).`,Pm,"W",`E<sub>b</sub> = ${V} − ${Ia}×${Ra} = ${r2(Eb)} V, so P<sub>m</sub> = E<sub>b</sub>I<sub>a</sub> = ${r2(Eb)}×${Ia} = ${r2(Pm)} W.`,[V*Ia,Pm/2,Ia*Ia*Ra])},
 // DC machine facts
 ()=>gbFact([
  ["Which dc motor is preferred for electric traction and cranes (very high starting torque)?","series motor",["shunt motor","separately excited generator","synchronous motor"],"In a series motor torque ∝ I<sub>a</sub>², so it develops very high starting torque."],
  ["Which dc motor runs at almost constant speed from no load to full load?","shunt motor",["series motor","cumulative compound motor with heavy series field","universal motor"],"In a shunt motor the flux is nearly constant, so the speed drops only slightly with load."],
  ["A dc series motor must never be started at no load because…","its speed can become dangerously high",["it draws zero current","it develops zero torque","the field winding burns out immediately"],"At no load the armature current and hence flux are very small, so the speed N ∝ E<sub>b</sub>/Φ rises to dangerous values."],
  ["The commutator of a dc generator converts…","the alternating emf induced in the armature into unidirectional emf at the terminals",["dc into ac","low voltage into high voltage","mechanical energy into heat"],"Conductors carry alternating emf; the commutator with brushes rectifies it mechanically."],
  ["In a dc generator the field winding is connected in parallel with the armature in a…","shunt generator",["series generator","separately excited generator","long-shunt series generator only"],"Shunt generator: field winding of many turns in parallel with the armature. Series generator: field in series with the armature."],
  ["The direction of rotation of a dc motor can be reversed by reversing…","either the armature current or the field current (not both)",["both armature and field currents","the supply frequency","the brush material"],"Torque direction depends on the product of flux and armature current directions; reversing both leaves it unchanged."],
  ["The purpose of the brushes in a dc machine is to…","collect current from (or supply current to) the rotating commutator",["produce the magnetic flux","cool the armature","reduce eddy currents"],"Brushes are stationary carbon contacts that slide on the commutator."]]),
 // rotating field, induction motor concept
 ()=>gbMsqF([
  ["Which statements about a three-phase induction motor are correct?",["The rotor never reaches synchronous speed","Its stator windings produce a rotating magnetic field","The rotating field speed is N<sub>s</sub> = 120f/P","Slip is zero only at synchronous speed"],["The rotor runs exactly at synchronous speed","The rotor needs a dc supply on its winding","Slip is 1 at synchronous speed","The rotating field speed depends on the rotor speed"],"Relative motion between the rotating field and rotor conductors is needed to induce rotor emf, so the rotor always lags N<sub>s</sub>. s = 1 at standstill and s = 0 at N<sub>s</sub>."],
  ["Which conditions are needed to produce a rotating magnetic field in a three-phase stator?",["Three windings displaced 120° in space","Balanced three-phase currents displaced 120° in time"],["A single winding carrying dc","Three windings displaced 90° in space","Currents of different frequencies in each winding"],"A rotating field of constant magnitude 1.5Φ<sub>m</sub> is produced by three windings spaced 120° apart, carrying balanced 3-phase currents."],
  ["Which statements about single-phase induction motors are correct?",["A single-phase winding alone produces a pulsating field, so the motor is not self-starting","An auxiliary winding or capacitor is used to make it start"],["It starts by itself because its field rotates","It can never run once it has started","It has a slip ring rotor only"],"A single-phase winding gives a pulsating field with no starting torque. Split-phase or capacitor-start methods create a rotating field for starting."],
  ["Which statements about a synchronous generator (alternator) are correct?",["The rotor field is excited with dc","The output frequency is f = PN/120","The armature winding is usually on the stator"],["The rotor speed is different from the speed of the rotating field","Its output is dc","It has a commutator and brushes for the ac output"],"An alternator's rotor (field) is driven at N rpm; f = PN/120. The armature is normally on the stator, so no commutator is needed."]]),
 // alternator frequency / poles
 ()=>{const [f,list]=pick([[50,[[3000,2],[1500,4],[1000,6],[750,8],[600,10],[500,12]]],[60,[[3600,2],[1800,4],[1200,6],[900,8],[720,10],[600,12]]]]),[N,P]=pick(list),w=rnd(0,1);
  if(w===0)return gbN(`An alternator driven at ${N} rpm generates ${f} Hz. Find the number of poles.`,P,"",`P = 120f/N = 120×${f}/${N} = ${P}.`,[P*2,P/2||1,P+2]);
  return gbN(`${gbAn(P)[0].toUpperCase()+gbAn(P).slice(1)} ${P}-pole alternator is driven at ${N} rpm. Find the frequency of the generated emf (in Hz).`,f,"Hz",`f = PN/120 = ${P}×${N}/120 = ${f} Hz.`,[f*2,f/2,P*N/60])},
 // induction motor power stages
 ()=>{const P2=pick([10,20,40,50,100]),s=pick([2,3,4,5]),w=rnd(0,2);
  if(w===0)return gbN(`The air-gap (rotor input) power of a 3-phase induction motor is ${P2} kW and the slip is ${s}%. Find the rotor copper loss (in kW).`,P2*s/100,"kW",`Rotor copper loss = s × rotor input = ${s/100}×${P2} = ${r2(P2*s/100)} kW.`,[P2*(1-s/100),P2/s,P2*s]);
  if(w===1)return gbN(`The rotor input of a 3-phase induction motor is ${P2} kW and its slip is ${s}%. Find the gross mechanical power developed (in kW).`,P2*(1-s/100),"kW",`P<sub>m</sub> = (1 − s) × rotor input = ${1-s/100}×${P2} = ${r2(P2*(1-s/100))} kW.`,[P2*s/100,P2*(1+s/100),P2/(1-s/100)]);
  const Pin=pick([10,20,50]),Pout=Pin*pick([0.8,0.85,0.9]);return gbN(`An induction motor draws ${Pin} kW from the supply and delivers ${r2(Pout)} kW at the shaft. Find its efficiency (%).`,100*Pout/Pin,"%",`η = output/input = ${r2(Pout)}/${Pin} = ${r2(Pout/Pin)}, i.e. ${r2(100*Pout/Pin)}%.`,[100*Pin/Pout,100-Pout,Pout])}
],
5:[
 // energy consumption, several loads
 ()=>{const n1=rnd(2,10),w1=pick([40,60,100]),n2=rnd(1,6),w2=pick([60,75,80]),h=rnd(3,10),d=pick([1,7,30]),rate=pick([4,5,6,7.5,8]),kWh=(n1*w1+n2*w2)*h*d/1000,w=rnd(0,1);
  const stem=`A house has ${n1} lamps of ${w1} W and ${n2} fan${n2>1?"s":""} of ${w2} W, all used for ${h} hours a day. `;
  if(w===0)return gbN(stem+`Find the energy consumed in ${d} day${d>1?"s":""} (in kWh).`,kWh,"kWh",`Total load = ${n1}×${w1} + ${n2}×${w2} = ${n1*w1+n2*w2} W. Energy = ${n1*w1+n2*w2}×${h}×${d}/1000 = ${r2(kWh)} kWh (units).`,[kWh*1000,kWh/2,kWh*rate]);
  return gbN(stem+`Find the electricity bill for ${d} day${d>1?"s":""} at Rs ${rate} per unit (in Rs).`,kWh*rate,"Rs",`Energy = ${n1*w1+n2*w2}×${h}×${d}/1000 = ${r2(kWh)} kWh. Bill = ${r2(kWh)}×${rate} = Rs ${r2(kWh*rate)}.`,[kWh,kWh*rate*1000,kWh*rate/2])},
 // single appliance
 ()=>{const P=pick([1,1.5,2,2.5,3]),m=pick([20,30,40,45,60,90]),kWh=P*m/60,w=rnd(0,1);
  if(w===0)return gbN(`A ${P} kW heater runs for ${m} minutes. Find the energy consumed (in kWh).`,kWh,"kWh",`Energy = power × time = ${P} kW × ${m}/60 h = ${r2(kWh)} kWh.`,[P*m,P*m/1000,P/m]);
  const rate=pick([5,6,8]),days=pick([10,30]);return gbN(`A ${P} kW geyser is used for ${m} minutes every day. Find the cost of energy for ${days} days at Rs ${rate} per unit (in Rs).`,kWh*days*rate,"Rs",`Daily energy = ${P}×${m}/60 = ${r2(kWh)} kWh. For ${days} days = ${r2(kWh*days)} kWh. Cost = ${r2(kWh*days)}×${rate} = Rs ${r2(kWh*days*rate)}.`,[kWh*days,kWh*rate,P*m*days*rate])},
 // battery backup
 ()=>{const V=pick([12,24,48]),Ah=pick([100,150,200]),P=pick([120,240,300,480,600]),eff=pick([1,0.8,0.9]),t=V*Ah*eff/P;
  return gbN(`A ${V} V, ${Ah} Ah battery supplies a constant load of ${P} W through an inverter of ${eff===1?"100%":Math.round(eff*100)+"%"} efficiency. Assuming the full capacity is usable, find the backup time (in hours).`,t,"h",`Stored energy = V×Ah = ${V*Ah} Wh. Usable energy = ${V*Ah}×${eff} = ${r2(V*Ah*eff)} Wh. Backup time = ${r2(V*Ah*eff)}/${P} = ${r2(t)} h.`,[V*Ah*eff/(2*P),Ah/P,V*Ah*eff/P*1.25])},
 // battery banks
 ()=>{const Vc=pick([2,6,12]),Ahc=pick([50,100,150,200]),s=pick([2,3,4,6]),p=pick([1,2,3]),w=rnd(0,2);
  const stem=`A battery bank is made of identical ${Vc} V, ${Ahc} Ah batteries arranged as ${p} parallel string${p>1?"s":""}, each with ${s} batteries in series. `;
  if(w===0)return gbN(stem+"Find the bank voltage (in V).",s*Vc,"V",`Series connection adds voltages: ${s}×${Vc} = ${s*Vc} V. Parallel strings do not change the voltage.`,[p*Vc,s*p*Vc,Vc]);
  if(w===1)return gbN(stem+"Find the bank capacity (in Ah).",p*Ahc,"Ah",`Parallel strings add capacity: ${p}×${Ahc} = ${p*Ahc} Ah. Series connection does not change the Ah rating.`,[s*Ahc,s*p*Ahc,Ahc]);
  const E=s*Vc*p*Ahc/1000;return gbN(stem+"Find the total stored energy (in kWh).",E,"kWh",`Bank voltage = ${s*Vc} V, capacity = ${p*Ahc} Ah. Energy = ${s*Vc}×${p*Ahc}/1000 = ${r2(E)} kWh.`,[E*1000,E/2,s*p*Vc*Ahc/1000*2])},
 // LT switchgear & protection
 ()=>gbFact([
  ["Which device automatically trips (and can be reset) on overload or short circuit in a domestic wiring installation?","MCB (miniature circuit breaker)",["fuse wire","ELCB only","earth electrode"],"An MCB has a thermal element for overload and a magnetic element for short circuit, and can be switched back on after tripping."],
  ["Which device is specifically meant to detect earth leakage (a small leakage current to earth) and disconnect the supply?","ELCB",["SFU","MCB","MCCB"],"An ELCB/RCCB senses leakage or residual current and trips, protecting people from electric shock."],
  ["An SFU (switch fuse unit) combines…","a switch with HRC fuses in one enclosure",["an MCB with an ELCB","a contactor with a relay","a transformer with a rectifier"],"SFU = isolating switch + fuses, used on LT distribution boards for switching and protection."],
  ["Compared with an MCB, an MCCB (moulded case circuit breaker) is used for…","higher current ratings, with adjustable trip settings",["very low current appliances only","dc supply only","earth resistance measurement"],"MCCBs handle larger currents (up to a few thousand amperes) and often have adjustable overload and short-circuit trip settings."],
  ["The main purpose of earthing an electrical installation is to…","give a low-resistance path for fault current so that the person is protected from shock",["increase the supply voltage","reduce the power factor","increase the copper loss"],"The metal body is connected to earth; if insulation fails the fault current flows to earth, operating the protection and keeping the body near earth potential."],
  ["Which of the following is a low-tension (LT) protective device?","SFU",["Buchholz relay","lightning arrester on a 400 kV line","Ward-Leonard set"],"SFU, MCB, ELCB and MCCB are LT switchgear; the Buchholz relay protects a transformer."],
  ["A fuse protects a circuit by…","melting when the current exceeds its rating (I²t heating)",["increasing the resistance of the circuit","storing the excess energy","reducing the voltage"],"The fuse element melts on excess current, breaking the circuit. A fuse must be replaced after operating; an MCB can be reset."]]),
 // power system layout / grid
 ()=>gbFact([
  ["In the general layout of a power system, the power from the generating station is first…","stepped up by a transformer for transmission",["stepped down to 230 V","rectified to dc","delivered directly to consumers"],"Generation voltage (11 kV or so) is raised to a high level to cut I²R loss in long transmission lines."],
  ["Why is power transmitted at high voltage?","to reduce the current and hence the line loss",["to increase the current","to increase the frequency","to make the line resistance zero"],"For the same power P = VI, higher V means lower I, and the I²R loss falls."],
  ["Which of the following is the standard sequence in a power system?","generation → step-up → transmission → step-down → distribution → consumer",["generation → distribution → step-up → transmission → consumer","transmission → generation → distribution → step-down","step-down → generation → transmission → distribution"],"Power flows from the generating station to the step-up transformer, the transmission lines, the step-down substations and distribution networks, and finally to consumers."],
  ["The interconnection of many power stations and load centres through a common network is called…","a grid",["a feeder","a busbar","an earth mat"],"A grid lets power stations share load, improves reliability and lets a region import or export power."],
  ["Which of the following is a standard high-voltage transmission level in India?","220 kV",["1.1 kV","5 V","24 V"],"Standard transmission voltages include 66, 110, 132, 220, 400 and 765 kV."],
  ["Which of the following is a standard primary distribution voltage?","11 kV",["765 kV","5 V","400 kV"],"11 kV (also 33 kV) is used for primary distribution, and distribution transformers step it down to 400/230 V for consumers."],
  ["The last stage of the power system, at which power is delivered to the end user, is called…","secondary distribution",["primary transmission","generation","step-up"],"A distribution transformer steps 11 kV down to about 400 V (3-phase) / 230 V (single-phase) for consumers."]]),
 // battery types and characteristics
 ()=>{const w=rnd(0,2);
  if(w===0)return gbFact([
   ["The nominal voltage of one lead-acid cell is…","2 V",["1.2 V","1.5 V","3.6 V"],"A lead-acid cell gives about 2 V; a 12 V battery has 6 cells in series."],
   ["The nominal voltage of one Ni-Cd cell is…","1.2 V",["2 V","1.5 V","3.6 V"],"Ni-Cd (and Ni-MH) cells are rated 1.2 V."],
   ["The nominal voltage of one Li-ion cell is about…","3.6–3.7 V",["1.2 V","2 V","1.5 V"],"A Li-ion cell is about 3.6–3.7 V, much higher than the aqueous cells."],
   ["Which of these is a primary (non-rechargeable) cell?","dry Leclanché (zinc-carbon) cell",["lead-acid battery","Li-ion battery","Ni-Cd battery"],"Primary cells cannot be recharged effectively; lead-acid, Ni-Cd and Li-ion are secondary (rechargeable) cells."],
   ["The specific gravity of the electrolyte in a fully charged lead-acid cell is about…","1.28",["1.00","1.84","0.98"],"It falls as the cell discharges (sulphuric acid is used up), so specific gravity indicates the state of charge."],
   ["The capacity of a battery is normally expressed in…","ampere-hours (Ah)",["volt-amperes","watts","ohms"],"Capacity is the charge the battery can deliver: current × time."]]);
  const [Vb,Vc,name]=pick([[12,2,"lead-acid"],[24,2,"lead-acid"],[48,2,"lead-acid"],[12,1.2,"Ni-Cd"],[24,1.2,"Ni-Cd"],[36,1.2,"Ni-Cd"],[7.2,3.6,"Li-ion"],[14.4,3.6,"Li-ion"]]);
  return gbN(`How many ${name} cells (${Vc} V each) must be connected in series to make a ${Vb} V battery?`,Math.round(Vb/Vc),"cells",`Number of cells = ${Vb}/${Vc} = ${Math.round(Vb/Vc)}.`,[Math.round(Vb/Vc)*2,Math.round(Vb/Vc)+2,Math.round(Vb/Vc)-1])},
 // earthing, wires, cables
 ()=>gbMsqF([
  ["Which of the following are LT switchgear devices?",["MCB","ELCB","MCCB","SFU"],["Buchholz relay","Transformer oil","Commutator","Slip ring"],"MCB, ELCB (RCCB), MCCB and switch-fuse units are LT switchgear. The others belong to transformers or machines."],
  ["Which statements about earthing are correct?",["It provides a low-resistance path for fault current","It keeps exposed metal parts at earth potential","Metal enclosures of appliances are connected to it"],["It increases the supply voltage of the appliance","It is needed only for dc systems","It replaces the need for fuses and MCBs"],"Earthing limits touch voltage and lets the protective device operate on a fault."],
  ["Which of the following are secondary (rechargeable) batteries?",["lead-acid","Ni-Cd","Li-ion"],["zinc-carbon dry cell","alkaline primary cell"],"Secondary cells can be recharged by reversing the chemical reaction with an external source."],
  ["Which statements about copper and aluminium as wiring conductors are correct?",["Copper has lower resistivity than aluminium","Aluminium is lighter than copper","For the same resistance an aluminium conductor needs a larger cross-section"],["Aluminium has a lower resistivity than copper","Copper is lighter than aluminium"],"ρ<sub>Cu</sub> ≈ 1.7×10⁻⁸ Ω·m and ρ<sub>Al</sub> ≈ 2.8×10⁻⁸ Ω·m. Aluminium is cheaper and lighter but needs about 1.6 times the area."]])
]});

/* ---------- ECT-001 helpers ---------- */
const gbBits=(n,w)=>n.toString(2).padStart(w||0,"0");
// brute-force K-map minimiser (n = 3 or 4 variables); ones = list of minterms
function gbKmap(n,ones){
 const N=1<<n,full=N-1,cubes=[];
 for(let mask=0;mask<=full;mask++)for(let val=0;val<N;val++){
  if((val&~mask)!==0)continue;
  const cov=[];for(let m=0;m<N;m++)if((m&mask)===val)cov.push(m);
  if(cov.every(m=>ones.includes(m)))cubes.push({mask,val,cov})}
 const primes=cubes.filter(c=>!cubes.some(d=>d!==c&&(d.mask&c.mask)===d.mask&&d.mask!==c.mask&&(c.val&d.mask)===d.val));
 const pc=x=>{let c=0;while(x){c+=x&1;x>>=1}return c};
 let best=null;
 for(let s=1;s<(1<<primes.length);s++){
  const sel=[];let lits=0;const cov=new Set();
  for(let i=0;i<primes.length;i++)if(s&(1<<i)){sel.push(primes[i]);lits+=pc(primes[i].mask);primes[i].cov.forEach(m=>cov.add(m))}
  if(!ones.every(m=>cov.has(m)))continue;
  if(!best||lits<best.lits||(lits===best.lits&&sel.length<best.sel.length))best={sel,lits}}
 return {sel:best.sel,lits:best.lits,primes:primes.length}}
function gbCubeStr(c,n){
 const names=["A","B","C","D"];let s="";
 for(let i=0;i<n;i++){const bit=1<<(n-1-i);if(c.mask&bit)s+=names[i]+((c.val&bit)?"":"′")}
 return s||"1"}
const gbSopStr=(sel,n)=>sel.map(c=>gbCubeStr(c,n)).sort().join(" + ");
function gbCover(sel,n){const N=1<<n,s=[];for(let m=0;m<N;m++)if(sel.some(c=>(m&c.mask)===c.val))s.push(m);return s.join(",")}
function gbKFunc(n){
 const N=1<<n;
 for(let t=0;t<200;t++){
  const cnt=rnd(n===3?3:5,n===3?6:11),ones=shuffle([...Array(N).keys()]).slice(0,cnt).sort((a,b)=>a-b),r=gbKmap(n,ones);
  if(r.lits<ones.length*n&&r.sel.length>=1&&!(r.sel.length===1&&r.sel[0].mask===0))return {ones,r}}
 const ones=n===3?[1,3,5,7]:[0,1,2,3,4,5,6,7],r=gbKmap(n,ones);return {ones,r}}
function gbSciFmt(m,x){while(m<1){m*=10;x--}while(m>=10){m/=10;x++}return gbSci(m,x)}

genAdd("ECT-001",{
1:[
 // mass action law
 ()=>{const a=pick([1.5,2.25,3,4.5,9]),k=pick([15,16,17]),m0=2.25/a,x0=20-k;let m=m0,x=x0;while(m<1){m*=10;x--}
  const ans=gbSci(m,x);
  return mcq(`In n-type silicon at 300 K, n<sub>i</sub> = 1.5×10<sup>10</sup> cm<sup>−3</sup> and the donor doping is ${gbSci(a,k)} cm<sup>−3</sup> (fully ionised). What is the hole concentration p (cm<sup>−3</sup>)?`,ans,[gbSci(m,x+1),gbSci(m,x-1),gbSci(m,x+2)],`Mass-action law: np = n<sub>i</sub>². With n ≈ N<sub>D</sub> = ${gbSci(a,k)}, p = (1.5×10<sup>10</sup>)²/n = 2.25×10<sup>20</sup>/(${gbSci(a,k)}) = ${ans} cm<sup>−3</sup>.`)},
 // conductivity
 ()=>{const a=pick([1,2,5]),e=pick([17,18]),n=coin(.5),mu=n?pick([1000,1200,1350,1500]):pick([400,480,500]),sig=1.6*a*mu*Math.pow(10,e-19);
  return gbN(`${n?"An n-type":"A p-type"} silicon sample has ${n?"donor":"acceptor"} concentration ${a}×10<sup>${e}</sup> cm<sup>−3</sup> and ${n?"electron":"hole"} mobility ${mu} cm²/V·s. Neglecting minority carriers, find its conductivity (in S/cm).`,sig,"S/cm",`σ ≈ q ${n?"N<sub>D</sub> μ<sub>n</sub>":"N<sub>A</sub> μ<sub>p</sub>"} = 1.6×10⁻¹⁹ × ${a}×10<sup>${e}</sup> × ${mu} = ${r2(sig)} S/cm.`,[sig*10,sig/10,sig*2])},
 // dynamic resistance / temperature
 ()=>{const w=rnd(0,2);
  if(w===0){const I=pick([1,2,5,13,26]);return gbN(`A silicon diode carries a forward current of ${I} mA at room temperature (V<sub>T</sub> = 26 mV, η = 1). Find its dynamic (ac) resistance (in Ω).`,26/I,"Ω",`r<sub>d</sub> = ηV<sub>T</sub>/I = 26 mV/${I} mA = ${r2(26/I)} Ω.`,[26*I,I/26,52/I])}
  if(w===1){const T=pick([45,65,75,85]),V=0.7-0.0025*(T-25);return gbN(`The forward drop of a silicon diode is 0.7 V at 25 °C. If it falls by 2.5 mV/°C, what is the drop at ${T} °C (in V)?`,V,"V",`ΔT = ${T-25} °C, so ΔV = −2.5 mV × ${T-25} = −${r2(0.0025*(T-25))} V. New drop = 0.7 − ${r2(0.0025*(T-25))} = ${r2(V)} V.`,[0.7+0.0025*(T-25),0.7,V/2])}
  const T2=pick([35,45,55,65]),I0=pick([1,2,5,10]),ans=I0*Math.pow(2,(T2-25)/10);return gbN(`The reverse saturation current of a diode is ${I0} nA at 25 °C and doubles for every 10 °C rise. Find its value at ${T2} °C (in nA).`,ans,"nA",`Rise = ${T2-25} °C = ${(T2-25)/10} doubling(s). I<sub>0</sub> = ${I0}×2<sup>${(T2-25)/10}</sup> = ${r2(ans)} nA.`,[I0*(T2-25)/10,I0*(T2-25),ans*2])},
 // diode types
 ()=>gbFact([
  ["Which diode is operated in reverse bias and used as a voltage-variable capacitor for tuning?","varactor diode",["tunnel diode","Schottky diode","LED"],"A varactor's junction capacitance falls as the reverse voltage rises (C ∝ V<sub>R</sub><sup>−n</sup>)."],
  ["Which diode shows a negative-resistance region in its forward characteristic?","tunnel diode",["Schottky diode","photodiode","zener diode"],"A tunnel diode has heavily doped p and n regions and a very thin depletion layer; quantum tunnelling gives negative resistance."],
  ["Which diode is a metal–semiconductor junction with low forward drop (about 0.2–0.3 V) and very fast switching?","Schottky diode",["varactor diode","LED","tunnel diode"],"It is a majority-carrier device, so there is no minority-carrier storage delay."],
  ["Which diode is operated in reverse bias so that the reverse current rises with light intensity?","photodiode",["LED","varactor diode","Schottky diode"],"Photons create electron–hole pairs in the depletion region, increasing the reverse current in proportion to illumination."],
  ["In which mode does an LED emit light?","forward bias, by recombination of electrons and holes",["reverse bias, by avalanche multiplication","forward bias, by thermal heating of the filament","reverse bias, by photoconduction"],"In forward bias, injected carriers recombine and release the energy as photons; direct band-gap materials (GaAs, GaP, GaAsP) are used."],
  ["The colour of light emitted by an LED depends mainly on…","the band-gap energy of the semiconductor",["the value of the series resistor","the supply frequency","the size of the package"],"The photon energy hν ≈ E<sub>g</sub>, so a larger band gap gives a shorter wavelength (bluer light)."]]),
 // LED series resistor
 ()=>{const Vs=pick([5,9,12,24]),Vf=pick([1.6,1.8,2,2.2,3]),If=pick([10,15,20]),R=(Vs-Vf)/(If/1000);
  return gbN(`An LED with forward drop ${Vf} V and forward current ${If} mA is operated from a ${Vs} V supply through a series resistor. Find the resistance needed (in Ω).`,R,"Ω",`R = (V<sub>s</sub> − V<sub>F</sub>)/I<sub>F</sub> = (${Vs} − ${Vf})/${If/1000} = ${r2(R)} Ω.`,[Vs/(If/1000),(Vs+Vf)/(If/1000),(Vs-Vf)*If])},
 // junction facts (mcq)
 ()=>gbFact([
  ["The barrier potential of a silicon p-n junction at room temperature is about…","0.7 V",["0.3 V","1.1 V","0.1 V"],"Si: about 0.7 V (cut-in about 0.6–0.7 V). Ge: about 0.3 V."],
  ["The barrier potential of a germanium p-n junction at room temperature is about…","0.3 V",["0.7 V","1.1 V","0.9 V"],"Ge has a smaller band gap (0.67 eV), so its barrier potential is about 0.3 V."],
  ["When a p-n junction is forward biased, the depletion layer…","becomes narrower",["becomes wider","is unchanged","disappears completely at all voltages"],"Forward bias opposes the built-in field, so majority carriers move toward the junction and the depletion layer shrinks."],
  ["When a p-n junction is reverse biased, the depletion layer…","becomes wider and the junction current is only the small reverse saturation current",["becomes narrower and the current is large","disappears","carries a large diffusion current"],"Reverse bias adds to the barrier, widening the layer; only minority carriers cross, giving I<sub>0</sub>."],
  ["Which capacitance dominates a forward-biased p-n junction?","diffusion capacitance",["transition (depletion) capacitance","stray wiring capacitance only","varactor capacitance"],"Under forward bias, stored minority charge gives a large diffusion capacitance; under reverse bias the transition capacitance dominates."],
  ["The diode equation is…","I = I<sub>0</sub>(e<sup>V/ηV<sub>T</sub></sup> − 1)",["I = I<sub>0</sub>(e<sup>ηV<sub>T</sub>/V</sup> − 1)","I = I<sub>0</sub>e<sup>−V/V<sub>T</sub></sup>","I = V/I<sub>0</sub>"],"V<sub>T</sub> = kT/q ≈ 26 mV at 300 K. For large reverse voltage I → −I<sub>0</sub>."],
  ["The thermal voltage V<sub>T</sub> = kT/q at room temperature (300 K) is about…","26 mV",["0.7 V","2.6 V","260 mV"],"kT/q = 1.38×10⁻²³×300/1.6×10⁻¹⁹ ≈ 0.0259 V."]]),
 // Einstein relation
 ()=>{const mu=pick([1350,480,3900,1900,1500]),D=mu*0.026;
  return gbN(`At room temperature (V<sub>T</sub> = 0.026 V), a carrier has mobility ${mu} cm²/V·s. Using the Einstein relation D/μ = V<sub>T</sub>, find its diffusion constant (in cm²/s).`,D,"cm²/s",`D = μV<sub>T</sub> = ${mu}×0.026 = ${r2(D)} cm²/s.`,[mu/0.026,D*10,D/10])},
 // doping and bonding facts
 ()=>gbFact([
  ["Adding a pentavalent impurity such as phosphorus or arsenic to silicon produces…","n-type material with donor atoms",["p-type material with donor atoms","p-type material with acceptor atoms","intrinsic material"],"Group V atoms have five valence electrons; four bond with Si and the fifth is free (donor)."],
  ["Adding a trivalent impurity such as boron or gallium to silicon produces…","p-type material with acceptor atoms",["n-type material with acceptor atoms","n-type material with donor atoms","an insulator"],"Group III atoms have three valence electrons, leaving a hole in one covalent bond (acceptor)."],
  ["In an n-type semiconductor the majority and minority carriers are…","electrons and holes respectively",["holes and electrons respectively","electrons and electrons","protons and electrons"],"Donor doping raises the electron concentration; np = n<sub>i</sub>² makes holes the minority carriers."],
  ["How many valence electrons does a silicon or germanium atom have?","4",["3","5","8"],"Silicon and germanium are group IV elements with four valence electrons, each forming four covalent bonds."],
  ["In a pure (intrinsic) semiconductor at room temperature,…","the electron and hole concentrations are equal (n = p = n<sub>i</sub>)",["electrons outnumber holes","holes outnumber electrons","there are no free carriers at all"],"Every electron that leaves a covalent bond creates one hole, so n = p."],
  ["The forbidden energy gap of silicon at 300 K is about…","1.1 eV",["0.67 eV","1.4 eV","5 eV"],"Si: about 1.1 eV; Ge: about 0.67 eV; GaAs: about 1.4 eV; an insulator has more than about 5 eV."],
  ["The forbidden energy gap of germanium at 300 K is about…","0.67 eV",["1.1 eV","1.4 eV","0.2 eV"],"Germanium's narrower gap makes its intrinsic carrier concentration higher than Si's at the same temperature."],
  ["In a semiconductor, as temperature rises, the conductivity…","increases, because more electron–hole pairs are generated",["decreases as in metals","stays constant","becomes zero"],"A semiconductor has a negative temperature coefficient of resistance; thermal generation raises n<sub>i</sub> exponentially."]])
],
2:[
 // rectifier dc values
 ()=>{const w=rnd(0,3);
  if(w===0){const Vm=pick([10,20,50,100,155]);return gbN(`A half-wave rectifier (ideal diode) is fed with a sinusoid of peak value ${Vm} V. Find the average (dc) output voltage (in V).`,Vm/Math.PI,"V",`V<sub>dc</sub> = V<sub>m</sub>/π = ${Vm}/3.1416 = ${r2(Vm/Math.PI)} V.`,[2*Vm/Math.PI,Vm/2,Vm/Math.SQRT2])}
  if(w===1){const Vm=pick([10,20,50,100,155]);return gbN(`A full-wave rectifier (ideal diodes) is fed with a sinusoid of peak value ${Vm} V. Find the average (dc) output voltage (in V).`,2*Vm/Math.PI,"V",`V<sub>dc</sub> = 2V<sub>m</sub>/π = 2×${Vm}/3.1416 = ${r2(2*Vm/Math.PI)} V.`,[Vm/Math.PI,Vm/2,Vm/Math.SQRT2])}
  if(w===2){const Vs=pick([6,9,12,18,24]);return gbN(`A centre-tapped full-wave rectifier has ${Vs} V rms across each half of the secondary. Assuming ideal diodes, find the dc output voltage (in V).`,2*Math.SQRT2*Vs/Math.PI,"V",`V<sub>m</sub> = √2×${Vs} = ${r2(Math.SQRT2*Vs)} V per half. V<sub>dc</sub> = 2V<sub>m</sub>/π = ${r2(2*Math.SQRT2*Vs/Math.PI)} V.`,[Math.SQRT2*Vs/Math.PI,2*Vs/Math.PI,Vs*Math.SQRT2])}
  const Vm=pick([5,10,20,50]),RL=pick([100,200,500,1000]),Idc=(Vm-0.7)/Math.PI/RL*1000;return gbN(`A half-wave rectifier uses a silicon diode (drop 0.7 V) and a ${RL} Ω load. The input peak is ${Vm} V. Find the average load current (in mA).`,Idc,"mA",`Peak output = ${Vm} − 0.7 = ${r2(Vm-0.7)} V, so I<sub>dc</sub> = (V<sub>m</sub> − 0.7)/(πR<sub>L</sub>) = ${r2(Vm-0.7)}/(π×${RL}) = ${r2(Idc)} mA.`,[(Vm-0.7)*2/Math.PI/RL*1000,Vm/Math.PI/RL*1000,(Vm-0.7)/RL*1000])},
 // rectifier constants
 ()=>gbFact([
  ["The ripple factor of an ideal half-wave rectifier (resistive load, no filter) is…","1.21",["0.48","0.406","0.812"],"γ = √((V<sub>rms</sub>/V<sub>dc</sub>)² − 1) = √((π/2)² − 1) = 1.21."],
  ["The ripple factor of an ideal full-wave rectifier (resistive load, no filter) is about…","0.48",["1.21","0.81","0.29"],"V<sub>rms</sub>/V<sub>dc</sub> = π/(2√2) = 1.11, so γ = √(1.11² − 1) ≈ 0.48."],
  ["The maximum rectification efficiency of a half-wave rectifier with resistive load is (textbook value)…","40.6%",["81.2%","50%","20.3%"],"η = P<sub>dc</sub>/P<sub>ac</sub> = 4/π² of order 0.406 (textbook value 40.6%; π² arithmetic gives 40.5%). The full-wave value is twice this, 81.2%."],
  ["The maximum rectification efficiency of a full-wave rectifier with resistive load is (textbook value)…","81.2%",["40.6%","100%","64.5%"],"η = 8/π² of order 0.812, exactly double the half-wave value, because power is delivered in both half cycles."],
  ["The peak inverse voltage (PIV) of each diode in a centre-tapped full-wave rectifier (V<sub>m</sub> = peak of half secondary) is…","2V<sub>m</sub>",["V<sub>m</sub>","V<sub>m</sub>/2","V<sub>m</sub>/π"],"When one diode conducts, the other sees V<sub>m</sub> from its own half plus V<sub>m</sub> from the conducting half: 2V<sub>m</sub>."],
  ["The PIV of each diode in a bridge rectifier is…","V<sub>m</sub>",["2V<sub>m</sub>","V<sub>m</sub>/2","√2 V<sub>m</sub>"],"In a bridge only one diode's worth of drop appears across the reversed pair, so the PIV is V<sub>m</sub>."],
  ["The PIV of the diode in a half-wave rectifier (peak input V<sub>m</sub>) is…","V<sub>m</sub>",["2V<sub>m</sub>","V<sub>m</sub>/π","0.5V<sub>m</sub>"],"During the negative half cycle the whole input peak appears across the non-conducting diode."],
  ["The transformer utilisation factor (TUF) of a half-wave rectifier is about…","0.287",["0.693","0.812","1.0"],"TUF = P<sub>dc</sub>/(ac rating of transformer secondary). Half-wave: 0.287; centre-tapped full-wave: 0.693 (overall)."]]),
 // capacitor filter
 ()=>{const w=rnd(0,2);
  if(w===0){const R=pick([500,1000,2000]),C=pick([100,220,470]),g=100/(4*gbS3*50*R*C*1e-6);return gbN(`A full-wave rectifier (50 Hz supply) with a capacitor filter of ${C} μF feeds a load of ${R} Ω. Find the percentage ripple factor, using γ = 1/(4√3 f R<sub>L</sub>C).`,g,"%",`γ = 1/(4√3 × 50 × ${R} × ${C}×10⁻⁶) = ${(g/100).toFixed(4)}, i.e. ${r2(g)}%.`,[g*2,g/2,g*gbS3])}
  if(w===1){const R=pick([500,1000,2000]),C=pick([100,220,470]),g=100/(2*gbS3*50*R*C*1e-6);return gbN(`A half-wave rectifier (50 Hz supply) with a capacitor filter of ${C} μF feeds a load of ${R} Ω. Find the percentage ripple factor, using γ = 1/(2√3 f R<sub>L</sub>C).`,g,"%",`γ = 1/(2√3 × 50 × ${R} × ${C}×10⁻⁶) = ${(g/100).toFixed(4)}, i.e. ${r2(g)}%. The full-wave circuit would have half this ripple.`,[g/2,g*2,g*gbS3])}
  const I=pick([10,20,50,100]),C=pick([500,1000,2000]),Vpp=(I/1000)/(2*50*C*1e-6);return gbN(`A full-wave rectifier (50 Hz mains) with a ${C} μF filter capacitor supplies a load current of ${I} mA. Estimate the peak-to-peak ripple voltage, V<sub>r(pp)</sub> = I/(2fC) (in V).`,Vpp,"V",`V<sub>r(pp)</sub> = I/(2fC) = ${I/1000}/(2×50×${C}×10⁻⁶) = ${r2(Vpp)} V.`,[2*Vpp,Vpp/2,I/1000/(50*C*1e-6*4)])},
 // clipper / clamper / multiplier
 ()=>{const w=rnd(0,2);
  if(w===0){const VR=pick([2,3,4,5]),Vm=VR+pick([4,5,6,8]);return gbN(`A shunt clipper has a silicon diode (0.7 V drop) in series with a ${VR} V battery connected across the output so that positive peaks are clipped. The input is a sine wave of peak ${Vm} V. Find the maximum output voltage (in V).`,VR+0.7,"V",`The diode conducts once v<sub>in</sub> exceeds V<sub>R</sub> + 0.7 = ${r2(VR+0.7)} V, so the output is held at ${r2(VR+0.7)} V for the positive peaks (the input peak ${Vm} V is above this).`,[VR,Vm,Vm-0.7])}
  if(w===1){const Vm=pick([5,10,12,20]);return gbN(`An ideal diode clamper (positive clamper, with a capacitor) is fed with a sine wave of peak ${Vm} V. Find the maximum output voltage (in V).`,2*Vm,"V",`The capacitor charges to V<sub>m</sub> and adds to the input, shifting the waveform up so its negative peak sits at 0 V. The output swings from 0 to 2V<sub>m</sub> = ${2*Vm} V.`,[Vm,Vm/2,2*Vm+0.7])}
  const n=pick([2,3,4]),Vr=pick([6,12,24,110,230]),ans=n*Math.SQRT2*Vr;return gbN(`A ${n===2?"voltage doubler":n===3?"voltage tripler":"voltage quadrupler"} is fed from a ${Vr} V rms ac source. Assuming ideal diodes and capacitors and no load, find the dc output voltage (in V).`,ans,"V",`V<sub>m</sub> = √2×${Vr} = ${r2(Math.SQRT2*Vr)} V. An n-stage multiplier gives nV<sub>m</sub>: ${n}×${r2(Math.SQRT2*Vr)} = ${r2(ans)} V.`,[Math.SQRT2*Vr,n*Vr,ans*2])},
 // zener regulator
 ()=>{let t=0,Vs,Vz,Rs,RL,IT,Iz;
  do{Vs=pick([12,15,20,24]);Vz=pick([5,6,9,10]);Rs=pick([100,150,200,220,300]);RL=pick([300,500,600,1000,1500,2000]);IT=(Vs-Vz)/Rs*1000;Iz=IT-Vz/RL*1000;t++}while((Iz<4||Iz>80)&&t<200);
  const w=rnd(0,2);
  const stem=`A zener shunt regulator has V<sub>s</sub> = ${Vs} V, series resistor R<sub>s</sub> = ${Rs} Ω, zener voltage V<sub>Z</sub> = ${Vz} V and load R<sub>L</sub> = ${RL} Ω. `;
  if(w===0)return gbN(stem+"Find the zener current (in mA).",Iz,"mA",`Source current = (${Vs} − ${Vz})/${Rs} = ${r2(IT)} mA. Load current = ${Vz}/${RL} = ${r2(Vz/RL*1000)} mA. I<sub>Z</sub> = ${r2(IT)} − ${r2(Vz/RL*1000)} = ${r2(Iz)} mA.`,[IT,Vz/RL*1000,IT+Vz/RL*1000]);
  if(w===1)return gbN(stem+"Find the load current (in mA).",Vz/RL*1000,"mA",`The load is held at V<sub>Z</sub>, so I<sub>L</sub> = V<sub>Z</sub>/R<sub>L</sub> = ${Vz}/${RL} = ${r2(Vz/RL*1000)} mA.`,[IT,Iz,Vs/RL*1000]);
  return gbN(stem+"Find the total current drawn from the source (in mA).",IT,"mA",`The drop across R<sub>s</sub> is V<sub>s</sub> − V<sub>Z</sub> = ${Vs-Vz} V, so I = ${Vs-Vz}/${Rs} = ${r2(IT)} mA (it splits into I<sub>Z</sub> and I<sub>L</sub>).`,[Vs/Rs*1000,Vz/Rs*1000,Iz])},
 // zener / avalanche facts
 ()=>gbFact([
  ["A zener diode used as a voltage regulator is operated in…","reverse breakdown",["forward bias below cut-in","the cut-off region with zero bias","the forward saturation region"],"In reverse breakdown the voltage stays nearly constant (V<sub>Z</sub>) while the current changes widely."],
  ["Zener breakdown occurs mainly in diodes with…","heavy doping and a thin depletion layer (V<sub>Z</sub> below about 5 V)",["light doping and a wide depletion layer","no doping","a metal–semiconductor junction"],"A strong field (about 10⁷ V/m) pulls electrons out of covalent bonds directly (field ionisation). Avalanche breakdown occurs at higher voltages in lightly doped junctions."],
  ["Avalanche breakdown is caused by…","impact ionisation by carriers accelerated in the depletion region",["direct tunnelling through a thin barrier","heating of the metal contact","forward injection of carriers"],"Accelerated carriers knock out more carriers by collision, producing a multiplying avalanche."],
  ["The temperature coefficient of the breakdown voltage is…","negative for zener breakdown and positive for avalanche breakdown",["positive for zener and negative for avalanche","positive for both","zero for both"],"Zener (below about 5 V): V<sub>Z</sub> falls as T rises. Avalanche (above about 6 V): V<sub>Z</sub> rises with T. Around 5–6 V they cancel."],
  ["For a zener diode, the zener resistance r<sub>Z</sub> is defined as…","ΔV<sub>Z</sub>/ΔI<sub>Z</sub> in the breakdown region",["V<sub>Z</sub>/I<sub>Z</sub> in the forward region","the reverse resistance below breakdown","the resistance of the series resistor"],"r<sub>Z</sub> is the small dynamic resistance in breakdown; a small r<sub>Z</sub> means a stiffer regulator."],
  ["In a zener shunt regulator the zener stops regulating if…","its current falls below the minimum knee current I<sub>Z,min</sub>",["the load current is zero","the input voltage is constant","the series resistor is zero"],"Below the knee current the zener leaves the breakdown region and the output voltage is no longer held constant, so it starts to follow the input."]]),
 // PIV / secondary numerics
 ()=>{const w=rnd(0,2),Vs=pick([6,9,12,15,24,30]);
  if(w===0)return gbN(`A centre-tapped full-wave rectifier has ${Vs} V rms across each half of the secondary. Find the PIV of each diode (in V).`,2*Math.SQRT2*Vs,"V",`V<sub>m</sub> = √2×${Vs} = ${r2(Math.SQRT2*Vs)} V per half. PIV = 2V<sub>m</sub> = ${r2(2*Math.SQRT2*Vs)} V.`,[Math.SQRT2*Vs,Vs*2,Math.SQRT2*Vs/2]);
  if(w===1)return gbN(`A bridge rectifier is fed from a ${Vs} V rms secondary. Find the PIV of each diode (in V).`,Math.SQRT2*Vs,"V",`V<sub>m</sub> = √2×${Vs} = ${r2(Math.SQRT2*Vs)} V. In a bridge rectifier PIV = V<sub>m</sub> = ${r2(Math.SQRT2*Vs)} V.`,[2*Math.SQRT2*Vs,Vs,Vs*Math.SQRT2/2]);
  const Vm=pick([10,20,50,100]),RL=pick([100,200,500,1000]),P=Math.pow(Vm/Math.PI,2)/RL*1000;return gbN(`A half-wave rectifier (ideal diode) with V<sub>m</sub> = ${Vm} V drives a ${RL} Ω load. Find the dc power delivered to the load, P<sub>dc</sub> = V<sub>dc</sub>²/R<sub>L</sub> (in mW).`,P,"mW",`V<sub>dc</sub> = V<sub>m</sub>/π = ${r2(Vm/Math.PI)} V. P<sub>dc</sub> = V<sub>dc</sub>²/R<sub>L</sub> = ${r2(Vm/Math.PI)}²/${RL} W = ${r2(P)} mW.`,[P*4,P/4,Math.pow(Vm/2,2)/RL*1000])},
 // regulation
 ()=>{const w=rnd(0,1);
  if(w===0){const Vfl=pick([10,12,15,20]),d=pick([0.2,0.3,0.5,1]),Vnl=Vfl+d,VR=100*d/Vfl;return gbN(`The output of a dc power supply is ${Vnl} V at no load and ${Vfl} V at full load. Find its percentage voltage regulation.`,VR,"%",`%VR = (V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub> × 100 = (${Vnl} − ${Vfl})/${Vfl} × 100 = ${r2(VR)}%.`,[100*d/Vnl,d,VR*2])}
  const Vm=pick([12,24,50]),ans=(Vm-0.7)*2/Math.PI;return gbN(`A full-wave bridge rectifier has an ac input of peak ${Vm} V. Because two silicon diodes conduct at a time (0.7 V each), the peak output is V<sub>m</sub> − 1.4 V. Find the dc output voltage using V<sub>dc</sub> = 2(V<sub>m</sub> − 1.4)/π (in V).`,2*(Vm-1.4)/Math.PI,"V",`Peak output = ${Vm} − 1.4 = ${r2(Vm-1.4)} V. V<sub>dc</sub> = 2×${r2(Vm-1.4)}/π = ${r2(2*(Vm-1.4)/Math.PI)} V.`,[2*Vm/Math.PI,2*(Vm-0.7)/Math.PI,(Vm-1.4)/Math.PI])}
],
3:[
 // alpha beta
 ()=>{const w=rnd(0,3);
  if(w===0){const al=pick([0.9,0.95,0.96,0.98,0.99]);return gbN(`A transistor has α = ${al}. Find its common-emitter current gain β.`,al/(1-al),"",`β = α/(1 − α) = ${al}/${r2(1-al)} = ${r2(al/(1-al))}.`,[al*100,(1-al)/al,1/(1-al)+1])}
  if(w===1){const be=pick([9,19,24,49,99]);return gbN(`A transistor has β = ${be}. Find α (to 2 decimals).`,be/(1+be),"",`α = β/(1 + β) = ${be}/${be+1} = ${r2(be/(1+be))}.`,[be/(be-1),1/(1+be),be/100])}
  if(w===2){const be=pick([50,80,100,150,200]),Ib=pick([20,30,40,50,100]),Ic=be*Ib/1000,Ie=Ic+Ib/1000;return gbN(`A BJT with β = ${be} has a base current of ${Ib} μA. Find the emitter current (in mA).`,Ie,"mA",`I<sub>C</sub> = βI<sub>B</sub> = ${be}×${Ib} μA = ${r2(Ic)} mA. I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> = ${r2(Ic)} + ${Ib/1000} = ${r2(Ie)} mA.`,[Ic,be*Ib,Ie*2])}
  const al=pick([0.9,0.95,0.98,0.99]),Ie=pick([1,2,4,5,10]),Ico=pick([10,20,30,40]),Ic=al*Ie+Ico/1000;return gbN(`In a CB configuration α = ${al}, I<sub>E</sub> = ${Ie} mA and the reverse saturation current I<sub>CBO</sub> = ${Ico} μA. Find the collector current (in mA), using I<sub>C</sub> = αI<sub>E</sub> + I<sub>CBO</sub>.`,Ic,"mA",`I<sub>C</sub> = αI<sub>E</sub> + I<sub>CBO</sub> = ${al}×${Ie} + ${Ico/1000} = ${r2(Ic)} mA.`,[al*Ie,Ie+Ico/1000,Ic*2])},
 // fixed bias
 ()=>{let Vcc,Ib,be,Ic,Rc,t=0;
  do{Vcc=pick([10,12,15,20]);Ib=pick([20,25,50,100]);be=pick([50,100,150,200]);Ic=be*Ib/1000;Rc=pick([0.5,1,1.5,2,2.2,3]);t++}while((Ic*Rc>0.8*Vcc||Ic*Rc<0.2*Vcc)&&t<500);
  const Rb=(Vcc-0.7)*1000/Ib,Vce=Vcc-Ic*Rc,w=rnd(0,2);
  const stem=`A fixed-bias CE circuit has V<sub>CC</sub> = ${Vcc} V, R<sub>B</sub> = ${r2(Rb)} kΩ, R<sub>C</sub> = ${Rc} kΩ, β = ${be} and V<sub>BE</sub> = 0.7 V. `;
  if(w===0)return gbN(stem+"Find the base current (in μA).",Ib,"μA",`I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub> = ${r2(Vcc-0.7)}/${r2(Rb)} kΩ = ${Ib} μA.`,[Ib*be,Ib/2,Vcc/Rb*1000]);
  if(w===1)return gbN(stem+"Find the collector current (in mA).",Ic,"mA",`I<sub>B</sub> = ${r2(Vcc-0.7)}/${r2(Rb)}k = ${Ib} μA, so I<sub>C</sub> = βI<sub>B</sub> = ${be}×${Ib} μA = ${r2(Ic)} mA.`,[Ib,Ic*Rc,Ic/2]);
  return gbN(stem+"Find V<sub>CE</sub> (in V).",Vce,"V",`I<sub>C</sub> = βI<sub>B</sub> = ${r2(Ic)} mA. V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub> = ${Vcc} − ${r2(Ic)}×${Rc} = ${r2(Vce)} V.`,[Vcc,Ic*Rc,Vcc+Ic*Rc])},
 // potential divider bias
 ()=>{const [Vcc,R1,R2]=pick([[12,30,10],[12,20,10],[12,60,20],[12,10,10],[12,40,20],[12,30,20],[10,30,10],[10,10,10],[10,40,10],[20,30,10],[20,20,20]]),Re=pick([1,1.5,2]),Vb=Vcc*R2/(R1+R2),Ve=Vb-0.7,Ie=Ve/Re,w=rnd(0,1);
  const stem=`In a potential-divider bias circuit V<sub>CC</sub> = ${Vcc} V, R₁ = ${R1} kΩ, R₂ = ${R2} kΩ and R<sub>E</sub> = ${Re} kΩ (V<sub>BE</sub> = 0.7 V; neglect the base current in the divider). `;
  if(w===0)return gbN(stem+"Find the base voltage V<sub>B</sub> (in V).",Vb,"V",`V<sub>B</sub> = V<sub>CC</sub>R₂/(R₁ + R₂) = ${Vcc}×${R2}/${R1+R2} = ${r2(Vb)} V.`,[Vcc*R1/(R1+R2),Vb-0.7,Vcc/2]);
  return gbN(stem+"Find the collector current, taking I<sub>C</sub> ≈ I<sub>E</sub> (in mA).",Ie,"mA",`V<sub>B</sub> = ${r2(Vb)} V, so V<sub>E</sub> = ${r2(Vb)} − 0.7 = ${r2(Ve)} V and I<sub>E</sub> = V<sub>E</sub>/R<sub>E</sub> = ${r2(Ve)}/${Re} = ${r2(Ie)} mA ≈ I<sub>C</sub>.`,[Vb/Re,Ve,Ie*Re])},
 // configurations facts
 ()=>gbFact([
  ["Which BJT configuration gives both voltage gain and current gain greater than one with a 180° phase shift?","common emitter",["common base","common collector","none of them"],"CE: A<sub>v</sub> and A<sub>i</sub> both large, and the output is inverted."],
  ["Which BJT configuration has voltage gain close to 1, high input resistance and low output resistance (a buffer)?","common collector (emitter follower)",["common emitter","common base","cascode only"],"The output at the emitter follows the base voltage less V<sub>BE</sub>, so A<sub>v</sub> ≈ 1."],
  ["Which BJT configuration has the lowest input resistance and a current gain close to 1?","common base",["common emitter","common collector","all are equal"],"CB: input resistance about 20–50 Ω, current gain α slightly below 1."],
  ["For a BJT to work as a linear amplifier, the junctions must be biased as…","emitter–base forward, collector–base reverse (active region)",["both junctions forward","both junctions reverse","emitter–base reverse, collector–base forward"],"Active region: emitter injects carriers, collector collects them. Both forward = saturation; both reverse = cut-off."],
  ["In the saturation region of a BJT…","both the emitter–base and collector–base junctions are forward biased",["both junctions are reverse biased","only the collector–base junction is forward biased","the collector current is exactly zero"],"In saturation V<sub>CE</sub> is small (about 0.2 V) and the transistor acts as a closed switch."],
  ["In the cut-off region of a BJT…","both junctions are reverse biased and I<sub>C</sub> ≈ 0",["both junctions are forward biased","I<sub>C</sub> is maximum","V<sub>CE</sub> ≈ 0"],"With I<sub>B</sub> = 0 only leakage flows, V<sub>CE</sub> ≈ V<sub>CC</sub> and the transistor acts as an open switch."],
  ["The main reason for using a stabilised biasing circuit such as potential-divider bias is to…","keep the Q-point stable against changes in β and temperature",["increase the supply voltage","increase the reverse saturation current","reduce the load resistance to zero"],"Emitter feedback resistor and a stiff divider make I<sub>C</sub> nearly independent of β."]]),
 // small-signal h-parameter
 ()=>{const hfe=pick([50,100,150]),hie=pick([1,1.5,2,2.5]),RL=pick([2,3,4]),w=rnd(0,2);
  if(w===0){return gbN(`A CE amplifier has h<sub>fe</sub> = ${hfe}, h<sub>ie</sub> = ${hie} kΩ and load R<sub>L</sub> = ${RL} kΩ. Using the approximate model, find the magnitude of the voltage gain |A<sub>v</sub>| = h<sub>fe</sub>R<sub>L</sub>/h<sub>ie</sub>.`,hfe*RL/hie,"",`|A<sub>v</sub>| ≈ h<sub>fe</sub>R<sub>L</sub>/h<sub>ie</sub> = ${hfe}×${RL}/${hie} = ${r2(hfe*RL/hie)} (the output is inverted).`,[hfe*RL*hie,hfe*hie/RL,hfe])}
  if(w===1){const Ai=hfe,Av=hfe*RL/hie;return gbN(`A CE stage has h<sub>fe</sub> = ${hfe}, h<sub>ie</sub> = ${hie} kΩ and R<sub>L</sub> = ${RL} kΩ (h<sub>re</sub> and h<sub>oe</sub> neglected). Find the magnitude of the power gain |A<sub>v</sub>A<sub>i</sub>|.`,Av*Ai,"",`A<sub>i</sub> ≈ h<sub>fe</sub> = ${Ai}; |A<sub>v</sub>| = ${hfe}×${RL}/${hie} = ${r2(Av)}. Power gain = ${r2(Av)}×${Ai} = ${r2(Av*Ai)}.`,[Av+Ai,Av,Ai])}
  const RLc=pick([1,2,5]),hoe=pick([10,20,25,50]),Ai=hfe/(1+hoe*1e-6*RLc*1000);return gbN(`A CE amplifier has h<sub>fe</sub> = ${hfe} and h<sub>oe</sub> = ${hoe} μS. With a load of ${RLc} kΩ, find the magnitude of the current gain |A<sub>i</sub>| = h<sub>fe</sub>/(1 + h<sub>oe</sub>R<sub>L</sub>).`,Ai,"",`h<sub>oe</sub>R<sub>L</sub> = ${hoe}×10⁻⁶ × ${RLc}×10³ = ${r2(hoe*1e-6*RLc*1000)}. |A<sub>i</sub>| = ${hfe}/(1 + ${r2(hoe*1e-6*RLc*1000)}) = ${r2(Ai)}.`,[hfe,hfe*(1+hoe*1e-6*RLc*1000),hfe/2])},
 // h-parameter definitions
 ()=>gbFact([
  ["In the h-parameter model of a BJT, h<sub>fe</sub> represents…","the small-signal forward current gain",["the input resistance","the reverse voltage ratio","the output admittance"],"h<sub>fe</sub> = ΔI<sub>C</sub>/ΔI<sub>B</sub> at constant V<sub>CE</sub> (≈ β)."],
  ["In the CE h-parameter model, h<sub>ie</sub> represents…","the input resistance with the output shorted (ac)",["the forward current gain","the reverse voltage feedback ratio","the output conductance"],"h<sub>ie</sub> = ΔV<sub>BE</sub>/ΔI<sub>B</sub> at V<sub>CE</sub> constant (output short-circuited for ac)."],
  ["In the CE h-parameter model, h<sub>oe</sub> represents…","the output admittance with the input open",["the input impedance","the forward current gain","the reverse voltage gain"],"h<sub>oe</sub> = ΔI<sub>C</sub>/ΔV<sub>CE</sub> at I<sub>B</sub> constant; its unit is siemens."],
  ["In the CE h-parameter model, h<sub>re</sub> represents…","the reverse voltage feedback ratio (input open-circuited)",["the input resistance","the forward current gain","the output admittance"],"h<sub>re</sub> = ΔV<sub>BE</sub>/ΔV<sub>CE</sub> at I<sub>B</sub> constant; it is very small (about 10⁻⁴)."],
  ["A single-stage CE amplifier with resistive load produces an output that is…","180° out of phase with the input",["in phase with the input","90° out of phase","zero"],"An increase in v<sub>be</sub> increases i<sub>C</sub> and hence the drop across R<sub>C</sub>, so v<sub>ce</sub> falls."]]),
 // CC amplifier input resistance
 ()=>{const hfe=pick([49,99,149,199]),hie=pick([1,1.1,2]),RE=pick([1,2,3,5]),Ri=hie+(1+hfe)*RE,w=rnd(0,1);
  if(w===0)return gbN(`An emitter follower has h<sub>fe</sub> = ${hfe}, h<sub>ie</sub> = ${hie} kΩ and R<sub>E</sub> = ${RE} kΩ (h<sub>oe</sub> neglected). Find its input resistance R<sub>i</sub> = h<sub>ie</sub> + (1 + h<sub>fe</sub>)R<sub>E</sub> (in kΩ).`,Ri,"kΩ",`R<sub>i</sub> = ${hie} + ${hfe+1}×${RE} = ${r2(Ri)} kΩ. This is much larger than for a CE stage.`,[hie+hfe*RE,hie+RE,(1+hfe)*RE-hie]);
  const Av=(1+hfe)*RE/(hie+(1+hfe)*RE);return gbN(`An emitter follower has h<sub>fe</sub> = ${hfe}, h<sub>ie</sub> = ${hie} kΩ and R<sub>E</sub> = ${RE} kΩ (h<sub>oe</sub> neglected). Find its voltage gain A<sub>v</sub> = (1 + h<sub>fe</sub>)R<sub>E</sub>/(h<sub>ie</sub> + (1 + h<sub>fe</sub>)R<sub>E</sub>) (to 2 decimals).`,Av,"",`A<sub>v</sub> = ${hfe+1}×${RE}/(${hie} + ${hfe+1}×${RE}) = ${r2((1+hfe)*RE)}/${r2(hie+(1+hfe)*RE)} = ${(Av).toFixed(3)}, slightly below 1.`,[hie/(hie+RE),1.5,Av/2])},
 // load line
 ()=>{const Vcc=pick([9,10,12,15,20,24]),Rc=pick([1,2,3,4,5]),w=rnd(0,1);
  if(w===0)return gbN(`For a CE transistor with V<sub>CC</sub> = ${Vcc} V and R<sub>C</sub> = ${Rc} kΩ (no emitter resistor), find the saturation collector current I<sub>C(sat)</sub> at the end of the dc load line (in mA).`,Vcc/Rc,"mA",`At saturation V<sub>CE</sub> ≈ 0, so I<sub>C(sat)</sub> = V<sub>CC</sub>/R<sub>C</sub> = ${Vcc}/${Rc} = ${r2(Vcc/Rc)} mA.`,[Vcc*Rc,Vcc/(2*Rc),Rc/Vcc]);
  const Re=pick([0.5,1]);return gbN(`A CE circuit has V<sub>CC</sub> = ${Vcc} V, R<sub>C</sub> = ${Rc} kΩ and R<sub>E</sub> = ${Re} kΩ. Find I<sub>C(sat)</sub> on the dc load line, ignoring V<sub>CE(sat)</sub> (in mA).`,Vcc/(Rc+Re),"mA",`I<sub>C(sat)</sub> = V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>) = ${Vcc}/${Rc+Re} = ${r2(Vcc/(Rc+Re))} mA.`,[Vcc/Rc,Vcc*(Rc+Re),Vcc/(2*(Rc+Re))])}
],
4:[
 // JFET Shockley
 ()=>{const Vp=pick([-2,-3,-4,-5,-6]),f=pick([0.2,0.4,0.5,0.6,0.8]),Vgs=r2(Vp*f),Idss=pick([5,10,15,20,25]),Id=Idss*Math.pow(1-f,2);
  return gbN(`An n-channel JFET has I<sub>DSS</sub> = ${Idss} mA and V<sub>P</sub> = ${neg(Vp)} V. Find the drain current at V<sub>GS</sub> = ${neg(Vgs)} V (in mA).`,Id,"mA",`I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² = ${Idss}(1 − (${neg(Vgs)})/(${neg(Vp)}))² = ${Idss}×${r2(Math.pow(1-f,2))} = ${r2(Id)} mA.`,[Idss*(1-f),Idss*Math.pow(f,2),Idss/2])},
 // JFET gm
 ()=>{const Idss=pick([8,10,12,16]),Vp=pick([2,4,5,8]),f=pick([0,0.25,0.5]),gm0=2*Idss/Vp,gm=gm0*(1-f);
  return gbN(`A JFET has I<sub>DSS</sub> = ${Idss} mA and |V<sub>P</sub>| = ${Vp} V. Find its transconductance g<sub>m</sub> at V<sub>GS</sub> = ${r2(-f*Vp)} V (in mS).`,gm,"mS",`g<sub>m0</sub> = 2I<sub>DSS</sub>/|V<sub>P</sub>| = 2×${Idss}/${Vp} = ${r2(gm0)} mS. g<sub>m</sub> = g<sub>m0</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>) = ${r2(gm0)}×${1-f} = ${r2(gm)} mS.`,[gm0*(1+f),Idss/Vp,gm0*2])},
 // CS amplifier gain
 ()=>{const gm=pick([2,3,4,5]),w=rnd(0,1);
  if(w===0){const RD=pick([1,2,3,4,5]);return gbN(`A common-source JFET amplifier has g<sub>m</sub> = ${gm} mS and R<sub>D</sub> = ${RD} kΩ (r<sub>d</sub> very large). Find the magnitude of the voltage gain.`,gm*RD,"",`|A<sub>v</sub>| = g<sub>m</sub>R<sub>D</sub> = ${gm} mS × ${RD} kΩ = ${gm*RD}. The output is inverted (CS amplifier).`,[gm/RD,gm+RD,gm*RD*2])}
  const [rd,RD,par]=pick([[20,5,4],[30,6,5],[40,10,8],[60,15,12],[12,4,3]]);return gbN(`A common-source FET amplifier has g<sub>m</sub> = ${gm} mS, r<sub>d</sub> = ${rd} kΩ and R<sub>D</sub> = ${RD} kΩ. Find |A<sub>v</sub>| = g<sub>m</sub>(r<sub>d</sub>∥R<sub>D</sub>).`,gm*par,"",`r<sub>d</sub>∥R<sub>D</sub> = ${rd}×${RD}/${rd+RD} = ${par} kΩ. |A<sub>v</sub>| = ${gm}×${par} = ${gm*par}.`,[gm*RD,gm*(rd+RD),gm*par/2])},
 // CD amplifier
 ()=>{const [gm,RS]=pick([[1,1],[3,1],[2,2],[4,1],[3,3],[2,0.5]]),P=gm*RS,Av=P/(1+P),w=rnd(0,1);
  if(w===0)return gbN(`A common-drain (source-follower) FET stage has g<sub>m</sub> = ${gm} mS and R<sub>S</sub> = ${RS} kΩ (r<sub>d</sub> neglected). Find the voltage gain A<sub>v</sub> = g<sub>m</sub>R<sub>S</sub>/(1 + g<sub>m</sub>R<sub>S</sub>).`,Av,"",`g<sub>m</sub>R<sub>S</sub> = ${P}. A<sub>v</sub> = ${P}/(1 + ${P}) = ${r2(Av)}, slightly below 1 and non-inverting.`,[P,1/(1+P),1+P]);
  const g=pick([2,4,5,10]);return gbN(`A source follower has g<sub>m</sub> = ${g} mS. Find its approximate output resistance R<sub>o</sub> ≈ 1/g<sub>m</sub> (in Ω).`,1000/g,"Ω",`R<sub>o</sub> ≈ 1/g<sub>m</sub> = 1/${g} mS = ${r2(1000/g)} Ω. A source follower has low output resistance.`,[g,1000*g,500/g])},
 // FET concept
 ()=>gbMsqF([
  ["Which statements about a JFET are correct?",["It is a unipolar, voltage-controlled device","Its gate–source junction is reverse biased in normal operation","Its input resistance is very high","Drain current saturates after pinch-off"],["It is a bipolar, current-controlled device","Its gate–source junction is forward biased in normal operation","Its input resistance is lower than that of a BJT"],"A JFET conducts through majority carriers only, controlled by the reverse-biased gate junction, so the gate current is tiny (input resistance about 10⁸–10¹⁰ Ω)."],
  ["Which statements about MOSFETs are correct?",["An enhancement MOSFET has no channel at V<sub>GS</sub> = 0","A depletion MOSFET conducts at V<sub>GS</sub> = 0","The gate is insulated from the channel by an oxide layer","The input resistance is extremely high"],["An enhancement MOSFET conducts fully at V<sub>GS</sub> = 0","The gate forms a p-n junction with the channel","A MOSFET gate current is large"],"The SiO₂ insulation gives a very high input resistance (about 10¹⁴ Ω). An E-MOSFET needs V<sub>GS</sub> above threshold V<sub>T</sub> to form a channel; a D-MOSFET has a built-in channel."]]),
 ()=>gbFact([
  ["The pinch-off voltage V<sub>P</sub> of a JFET is…","the gate–source voltage at which the drain current becomes (nearly) zero",["the drain voltage at which the JFET breaks down","the gate current at saturation","the supply voltage"],"At V<sub>GS</sub> = V<sub>P</sub> (e.g. −4 V for an n-channel) the depletion regions close the channel, so I<sub>D</sub> ≈ 0."],
  ["The maximum drain current of a JFET, I<sub>DSS</sub>, is the drain current when…","V<sub>GS</sub> = 0 (in saturation)",["V<sub>GS</sub> = V<sub>P</sub>","V<sub>DS</sub> = 0","the gate is open"],"I<sub>DSS</sub> is the saturation drain current at V<sub>GS</sub> = 0."],
  ["Which FET amplifier configuration corresponds to the BJT common-collector (emitter follower)?","common drain (source follower)",["common source","common gate","none"],"Output taken from the source, gain ≈ 1, high input resistance and low output resistance."],
  ["Which FET amplifier configuration corresponds to the BJT common-emitter?","common source",["common drain","common gate","cascode"],"CS: high gain, 180° phase shift, high input resistance."],
  ["Which FET configuration has a low input resistance (≈ 1/g<sub>m</sub>) and non-inverting gain?","common gate",["common source","common drain","none of them"],"The input is at the source, seeing about 1/g<sub>m</sub>; the gain is positive."],
  ["The threshold voltage V<sub>T</sub> of an enhancement n-channel MOSFET is…","the minimum V<sub>GS</sub> needed to form the inversion channel",["the voltage at which the drain current is maximum","the breakdown voltage of the oxide","the pinch-off voltage of a JFET"],"Below V<sub>T</sub> the device is off; above it, electrons are attracted to the surface and form the channel."]]),
 // MOSFET square law and regions
 ()=>{const w=rnd(0,1);
  if(w===0){const Vt=pick([1,2]),ov=pick([1,2,3]),k=pick([0.1,0.25,0.5,1]),Id=k*ov*ov;return gbN(`An n-channel enhancement MOSFET in saturation has V<sub>T</sub> = ${Vt} V and I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)² with k = ${k} mA/V². Find I<sub>D</sub> for V<sub>GS</sub> = ${Vt+ov} V (in mA).`,Id,"mA",`V<sub>GS</sub> − V<sub>T</sub> = ${ov} V. I<sub>D</sub> = ${k}×${ov}² = ${r2(Id)} mA.`,[k*ov,k*(Vt+ov)*(Vt+ov),Id*2])}
  const Vt=pick([1,2]),Vgs=pick([0.5,1,3,4,5]),Vds=pick([0.5,1,2,5,8]),ov=Vgs-Vt;let ans;if(Vds===ov)return mcq("The saturation current of a MOSFET depends on the gate overdrive V<sub>GS</sub> − V<sub>T</sub> as…","I<sub>D</sub> ∝ (V<sub>GS</sub> − V<sub>T</sub>)²",["I<sub>D</sub> ∝ (V<sub>GS</sub> − V<sub>T</sub>)","I<sub>D</sub> ∝ √(V<sub>GS</sub> − V<sub>T</sub>)","I<sub>D</sub> ∝ 1/(V<sub>GS</sub> − V<sub>T</sub>)"],"In saturation the square law I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)² holds, so doubling the overdrive quadruples the current.");
  if(ov<=0)ans="cut-off";else if(Vds<ov)ans="triode (ohmic)";else ans="saturation";
  return mcq(`An n-channel enhancement MOSFET has V<sub>T</sub> = ${Vt} V. Its operating region for V<sub>GS</sub> = ${Vgs} V and V<sub>DS</sub> = ${Vds} V is…`,ans,["cut-off","triode (ohmic)","saturation","breakdown"].filter(x=>x!==ans),ov<=0?`V<sub>GS</sub> = ${Vgs} V is below V<sub>T</sub> = ${Vt} V, so no channel exists: cut-off.`:`V<sub>GS</sub> − V<sub>T</sub> = ${r2(ov)} V. Since V<sub>DS</sub> = ${Vds} V is ${Vds<ov?"less than":"at least"} this, the device is in ${ans}.`)},
 // self bias
 ()=>{let Id,Rs,Rd,Vdd,t=0;
  do{Id=pick([1,2,3,4]);Rs=pick([0.5,1,2]);Rd=pick([1,2,3]);Vdd=pick([12,15,20]);t++}while(Vdd-Id*(Rd+Rs)<4&&t<500);
  const w=rnd(0,1);
  if(w===0)return gbN(`A self-biased n-channel JFET has R<sub>S</sub> = ${Rs} kΩ and I<sub>D</sub> = ${Id} mA. Find V<sub>GS</sub> (in V).`,-Id*Rs,"V",`The gate is at 0 V and the source is at I<sub>D</sub>R<sub>S</sub> = ${Id*Rs} V, so V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub> = −${r2(Id*Rs)} V.`,[Id*Rs,-Id/Rs,Id/Rs]);
  const Vds=Vdd-Id*(Rd+Rs);return gbN(`A self-biased JFET amplifier has V<sub>DD</sub> = ${Vdd} V, R<sub>D</sub> = ${Rd} kΩ, R<sub>S</sub> = ${Rs} kΩ and I<sub>D</sub> = ${Id} mA. Find V<sub>DS</sub> (in V).`,Vds,"V",`V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>) = ${Vdd} − ${Id}×${r2(Rd+Rs)} = ${r2(Vds)} V.`,[Vdd-Id*Rd,Vdd,Vdd-Id*Rs])},
 // fixed bias JFET
 ()=>{let Vp,VGG,Idss,Rd,Vdd,Id,Vds,t=0;
  do{[Vp,VGG]=pick([[5,1],[5,2],[5,3],[5,4],[4,2],[6,3],[10,5],[10,2],[10,4],[10,6],[10,8]]);Idss=pick([5,10,20]);Rd=pick([1,2]);Vdd=pick([15,20]);Id=Idss*Math.pow(1-VGG/Vp,2);Vds=Vdd-Id*Rd;t++}while((Vds<Vp-VGG||Vds<1)&&t<1000);
  const w=rnd(0,1);
  const stem=`A fixed-bias n-channel JFET has V<sub>GG</sub> = ${VGG} V (so V<sub>GS</sub> = −${VGG} V), I<sub>DSS</sub> = ${Idss} mA, V<sub>P</sub> = −${Vp} V, R<sub>D</sub> = ${Rd} kΩ and V<sub>DD</sub> = ${Vdd} V. `;
  if(w===0)return gbN(stem+"Find I<sub>D</sub> (in mA).",Id,"mA",`I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² = ${Idss}(1 − ${VGG}/${Vp})² = ${Idss}×${r2(Math.pow(1-VGG/Vp,2))} = ${r2(Id)} mA.`,[Idss*(1-VGG/Vp),Idss*Math.pow(VGG/Vp,2),Idss]);
  return gbN(stem+"Find V<sub>DS</sub> (in V).",Vds,"V",`I<sub>D</sub> = ${Idss}(1 − ${VGG}/${Vp})² = ${r2(Id)} mA. V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub> = ${Vdd} − ${r2(Id)}×${Rd} = ${r2(Vds)} V.`,[Vdd,Vdd-Idss*Rd,Vdd+Id*Rd])}
],
5:[
 // decimal <-> binary
 ()=>{if(coin(.5)){const n=rnd(9,126),s=gbBits(n),cand=[];for(let k=0;k<s.length-1;k++)cand.push(gbBits(n^(1<<k)));
   return mcq(`Convert the decimal number ${n} to binary.`,s,shuffle(cand).slice(0,3),`Repeatedly divide by 2 and read remainders upward, or subtract powers of two: ${n} = (${s})<sub>2</sub>.`)}
  const n=rnd(9,250),s=gbBits(n),terms=[];for(let i=0;i<s.length;i++)if(s[i]==="1")terms.push(Math.pow(2,s.length-1-i));
  return nat(`Convert (${s})<sub>2</sub> to decimal.`,n,`Add the weights of the 1 bits: ${terms.join(" + ")} = ${n}.`)},
 // hex / octal
 ()=>{const w=rnd(0,3),n=rnd(32,255),H=n.toString(16).toUpperCase(),O=n.toString(8),sw=((n&15)<<4)|(n>>4);
  if(w===0)return nat(`Convert (${H})<sub>16</sub> to decimal.`,n,`Hex weights are powers of 16: ${H.split("").map((c,i)=>c+"×"+Math.pow(16,H.length-1-i)).join(" + ")} = ${n}.`);
  if(w===1){const c=[n+1,n-1,n+16,n-16,sw].filter(v=>v!==n&&v>=0).map(v=>v.toString(16).toUpperCase());return mcq(`Convert decimal ${n} to hexadecimal.`,H,[...new Set(c)].filter(x=>x!==H).slice(0,3),`Divide by 16: ${n} = ${Math.floor(n/16)}×16 + ${n%16}, so the hex digits are ${H}.`)}
  if(w===2){const b=gbBits(n);const c=[n+1,n-1,n+16,n-16,sw].filter(v=>v!==n&&v>=0).map(v=>v.toString(16).toUpperCase());return mcq(`Convert the binary number (${b})<sub>2</sub> to hexadecimal.`,H,[...new Set(c)].filter(x=>x!==H).slice(0,3),`Group the bits in fours from the right: ${b.padStart(Math.ceil(b.length/4)*4,"0").match(/.{4}/g).join(" ")} gives ${H}.`)}
  const b=gbBits(n),c=[n+1,n-1,n+8,n-8,sw].filter(v=>v!==n&&v>0).map(v=>v.toString(8));return mcq(`Convert the binary number (${b})<sub>2</sub> to octal.`,O,[...new Set(c)].filter(x=>x!==O).slice(0,3),`Group the bits in threes from the right: ${b.padStart(Math.ceil(b.length/3)*3,"0").match(/.{3}/g).join(" ")} gives ${O}.`)},
 // 2's complement / BCD / excess-3
 ()=>{if(coin(.5)){let n=rnd(1,127);if(n===64)n=65;const ans=gbBits(256-n,8),cand=[gbBits(255-n,8),gbBits(128+n,8),gbBits(n,8)];
   return mcq(`What is the 8-bit two's complement representation of −${n}?`,ans,cand,`Write +${n} as ${gbBits(n,8)}, invert every bit to get ${gbBits(255-n,8)}, then add 1: ${ans}.`)}
  const n=rnd(10,99),d1=Math.floor(n/10),d2=n%10,bcd=gbBits(d1,4)+" "+gbBits(d2,4);
  return mcq(`What is the BCD (8421) code of the decimal number ${n}?`,bcd,[gbBits(n,8).replace(/(.{4})/,"$1 "),gbBits(d2,4)+" "+gbBits(d1,4),gbBits(d1+3,4)+" "+gbBits(d2+3,4),gbBits(d1,4)+" "+gbBits(Math.min(15,d2+1),4),gbBits(Math.min(15,d1+1),4)+" "+gbBits(d2,4)].filter(x=>x!==bcd),`BCD encodes each decimal digit in 4 bits: ${d1} → ${gbBits(d1,4)}, ${d2} → ${gbBits(d2,4)}.`)},
 // Boolean algebra
 ()=>{const [x,y,z]=shuffle(["A","B","C","P","Q","X","Y"]).slice(0,3),mp={a:x,b:y,c:z},sub=s=>s.replace(/[abc]/g,ch=>mp[ch]);
  const L=[["a + a·b","a",["b","a·b","a + b"]],["a·(a + b)","a",["b","a + b","a·b"]],["a + a′·b","a + b",["a·b","a′·b","a"]],["a·b + a·b′","a",["b","a·b","1"]],["(a + b)·(a + b′)","a",["b","a·b","a + b"]],["a·(a′ + b)","a·b",["a","a + b","0"]],["a + a′·b′","a + b′",["a + b","a·b′","a′"]],["(a + b)·(a′ + b)","b",["a","a·b","a + b"]],["a′·b + a·b′ + a·b","a + b",["a·b","a′ + b′","a′·b′"]],["(a·b)′","a′ + b′",["a′·b′","a + b","a·b′"]],["(a + b)′","a′·b′",["a′ + b′","a·b","a′·b"]],["a·b + a′·c + b·c","a·b + a′·c",["a·b + b·c","a′·c + b·c","a + c"]]];
  const [e,a,d]=pick(L);return mcq(`Simplify the Boolean expression ${sub(e)}.`,sub(a),d.map(sub),`Use the laws of Boolean algebra (absorption, complement, De Morgan, consensus) or check the truth table: ${sub(e)} = ${sub(a)}.`)},
 // K-map minimisation (expression)
 ()=>{const n=coin(.6)?3:4,{ones,r}=gbKFunc(n),vars=["A","B","C","D"].slice(0,n).join(","),ans=gbSopStr(r.sel,n),truth=gbCover(r.sel,n),cand=[],names=n;
  for(let t=0;t<300&&cand.length<3;t++){
   const sel=r.sel.map(c=>({mask:c.mask,val:c.val})),i=rnd(0,sel.length-1),bit=1<<rnd(0,n-1),kind=rnd(0,2);
   if(kind===0){sel[i].mask&=~bit;sel[i].val&=~bit}
   else if(kind===1){if(sel[i].mask&bit)sel[i].val^=bit;else continue}
   else{const m=rnd(0,(1<<n)-1);sel.push({mask:(1<<n)-1,val:m})}
   const s=gbSopStr(sel,n);if(gbCover(sel,n)===truth||s===ans||cand.includes(s)||gbCover(sel,n)==="")continue;cand.push(s)}
  if(cand.length<3)return mcq("How many cells does a 4-variable K-map have?","16",["8","4","32"],"A K-map for n variables has 2<sup>n</sup> cells: 2⁴ = 16.");
  return mcq(`Using a K-map, the minimal sum-of-products form of F(${vars}) = Σm(${ones.join(", ")}) is…`,ans,cand,`Group adjacent 1s in powers of two (largest groups first, covering every 1). The groups give F = ${ans}.`)},
 // K-map numbers
 ()=>{const n=coin(.6)?3:4,{ones,r}=gbKFunc(n),vars=["A","B","C","D"].slice(0,n).join(","),w=rnd(0,1);
  if(w===0)return nat(`Minimise F(${vars}) = Σm(${ones.join(", ")}) with a K-map. How many literals does the minimal sum-of-products expression contain in total?`,r.lits,`Minimal SOP: F = ${gbSopStr(r.sel,n)}. Count the literals in all product terms: ${r.lits}.`);
  return nat(`How many prime implicants does F(${vars}) = Σm(${ones.join(", ")}) have?`,r.primes,`Find all the largest possible groups (of 1, 2, 4 or 8 adjacent 1s) that cannot be enlarged. There are ${r.primes} prime implicants (the minimal cover F = ${gbSopStr(r.sel,n)} uses some of them).`)},
 // gates
 ()=>{const w=rnd(0,2);
  if(w===0){const L=[["a 2-input AND gate from NAND gates","2",1,"NAND then NAND used as an inverter: AND = (A·B)′ inverted."],["a 2-input OR gate from NAND gates","3",1,"OR = A + B = (A′·B′)′: two NAND inverters and one NAND."],["a NOT gate from a NAND gate","1",1,"Tie the inputs together: (A·A)′ = A′."],["a 2-input XOR gate from NAND gates","4",1,"The standard XOR uses four NAND gates."],["a 2-input OR gate from NOR gates","2",1,"NOR followed by a NOR used as an inverter."],["a 2-input AND gate from NOR gates","3",1,"AND = A·B = (A′ + B′)′: two NOR inverters and one NOR."],["a 2-input XOR gate from NOR gates","5",1,"XOR needs five 2-input NOR gates."]],[what,ans,,why]=pick(L);return nat(`What is the minimum number of 2-input universal gates needed to build ${what}?`,+ans,why)}
  if(w===1)return gbMsqF([["Which of the following are universal gates?",["NAND","NOR"],["AND","OR","XOR","NOT"],"NAND alone and NOR alone can each implement every Boolean function (AND, OR and NOT can all be built from either). AND, OR, XOR and NOT on their own are not universal."]]);
  return gbFact([["De Morgan's theorem states that (A + B)′ equals…","A′·B′",["A′ + B′","A·B","A + B′"],"The complement of a sum is the product of the complements, and (A·B)′ = A′ + B′."],["A 2-input NAND gate gives output 0 only when…","both inputs are 1",["both inputs are 0","either input is 1","the inputs differ"],"NAND = NOT(AND), so it is 0 only for A = B = 1."],["A 2-input NOR gate gives output 1 only when…","both inputs are 0",["both inputs are 1","either input is 1","the inputs differ"],"NOR = NOT(OR), so it is 1 only for A = B = 0."],["A 2-input XOR gate gives output 1 when…","the inputs are different",["both inputs are 1","both inputs are 0","either input is 0"],"XOR = A′B + AB′: 1 for inputs 01 and 10."]])},
 // op-amp inverting / non-inverting
 ()=>{const k=pick([2,4,5,10]),R1=pick([10,20,25]),Rf=k*R1,Vin=pick([0.1,0.2,0.25,0.5,1]),inv=coin(.5),w=rnd(0,1);
  if(inv){const Vo=-k*Vin;return w===0?gbN(`An ideal inverting op-amp has R<sub>1</sub> = ${R1} kΩ and R<sub>f</sub> = ${Rf} kΩ. Find its voltage gain (with sign).`,-k,"",`A<sub>v</sub> = −R<sub>f</sub>/R<sub>1</sub> = −${Rf}/${R1} = −${k}.`,[k,-1/k,k+1]):gbN(`An ideal inverting op-amp has R<sub>1</sub> = ${R1} kΩ and R<sub>f</sub> = ${Rf} kΩ. Find the output voltage (with sign, in V) for an input of ${Vin} V.`,Vo,"V",`A<sub>v</sub> = −R<sub>f</sub>/R<sub>1</sub> = −${k}, so V<sub>o</sub> = −${k}×${Vin} = ${neg(r2(Vo))} V.`,[k*Vin,(k+1)*Vin,-Vin/k])}
  const A=1+k,Vo=A*Vin;return w===0?gbN(`An ideal non-inverting op-amp has R<sub>1</sub> = ${R1} kΩ (to ground) and R<sub>f</sub> = ${Rf} kΩ (feedback). Find its voltage gain.`,A,"",`A<sub>v</sub> = 1 + R<sub>f</sub>/R<sub>1</sub> = 1 + ${Rf}/${R1} = ${A}.`,[k,-k,A+1]):gbN(`An ideal non-inverting op-amp has R<sub>1</sub> = ${R1} kΩ and R<sub>f</sub> = ${Rf} kΩ. Find the output voltage (in V) for an input of ${Vin} V.`,Vo,"V",`A<sub>v</sub> = 1 + R<sub>f</sub>/R<sub>1</sub> = ${A}, so V<sub>o</sub> = ${A}×${Vin} = ${r2(Vo)} V.`,[k*Vin,-k*Vin,(A+1)*Vin])},
 // summing amplifier
 ()=>{const Rf=100,k1=pick([1,2,4,5]),k2=pick([1,2,4,5]),V1=pick([0.2,0.5,1]),V2=pick([0.2,0.5,1]),Vo=-(k1*V1+k2*V2);
  return gbN(`An inverting summing amplifier has R<sub>f</sub> = ${Rf} kΩ, R<sub>1</sub> = ${Rf/k1} kΩ and R<sub>2</sub> = ${Rf/k2} kΩ. The inputs are V<sub>1</sub> = ${V1} V and V<sub>2</sub> = ${V2} V. Find the output voltage (in V).`,Vo,"V",`V<sub>o</sub> = −R<sub>f</sub>(V<sub>1</sub>/R<sub>1</sub> + V<sub>2</sub>/R<sub>2</sub>) = −(${k1}×${V1} + ${k2}×${V2}) = ${neg(r2(Vo))} V.`,[-Vo,-(V1+V2),-(k1*V1-k2*V2)])},
 // op-amp concepts
 ()=>gbMsqF([
  ["Which of the following are characteristics of an ideal op-amp?",["Infinite open-loop voltage gain","Infinite input resistance","Zero output resistance","Infinite bandwidth"],["Zero input resistance","Infinite output resistance","Finite CMRR equal to 1","Zero bandwidth"],"An ideal op-amp: A<sub>OL</sub> = ∞, R<sub>in</sub> = ∞, R<sub>out</sub> = 0, bandwidth = ∞, CMRR = ∞ and zero offset."],
  ["Which statements hold for an ideal op-amp with negative feedback?",["The voltage between the inverting and non-inverting inputs is zero (virtual short)","No current flows into either input terminal"],["The output is always at the positive supply","The two inputs must be at 0 V","The gain is set by the open-loop gain"],"With A<sub>OL</sub> → ∞, V<sub>+</sub> = V<sub>−</sub> (virtual short) and the input currents are zero. The gain is set by the feedback network."],
  ["Which statements about op-amp circuits are correct?",["A voltage follower has a gain of 1","An inverting amplifier has a phase shift of 180°","A non-inverting amplifier has a gain of at least 1"],["A voltage follower has a very low input resistance","An inverting amplifier gain is 1 + R<sub>f</sub>/R<sub>1</sub>","A summing amplifier subtracts its inputs"],"Follower: A<sub>v</sub> = 1 (high R<sub>in</sub>, low R<sub>out</sub>). Inverting: −R<sub>f</sub>/R<sub>1</sub>. Non-inverting: 1 + R<sub>f</sub>/R<sub>1</sub>."]])
]});

/* ---------- MET-001 ---------- */
genAdd("MET-001",{
1:[
 // resultant of two forces
 ()=>{const w=rnd(0,2);
  if(w===0){const [P,Q]=pick([[3,4],[6,8],[30,40],[5,12],[9,12],[50,120],[15,20],[60,80]]),R=Math.sqrt(P*P+Q*Q);return gbN(`Two forces of ${P} N and ${Q} N act at a point at right angles to each other. Find the magnitude of their resultant (in N).`,R,"N",`R = √(P² + Q²) = √(${P*P} + ${Q*Q}) = ${r2(R)} N.`,[P+Q,Math.abs(P-Q),R*R])}
  if(w===1){const P=pick([10,20,30,40,50]),Q=pick([10,20,30,40,50]),[th,c]=pick([[0,1],[60,0.5],[90,0],[120,-0.5],[180,-1]]);if(th===180&&P===Q)return nat(`Two equal and opposite collinear forces of ${P} N act on a body. What is the magnitude of their resultant (in N)?`,0,"Equal forces in opposite directions cancel: R = P − Q = 0.");
   const R=Math.sqrt(P*P+Q*Q+2*P*Q*c);return gbN(`Two forces of ${P} N and ${Q} N act at a point with an angle of ${th}° between them. Find the resultant (in N).`,R,"N",`R = √(P² + Q² + 2PQ cos θ) = √(${P*P} + ${Q*Q} + 2×${P}×${Q}×${c}) = ${r2(R)} N.`,[P+Q,Math.sqrt(P*P+Q*Q),Math.sqrt(P*P+Q*Q-2*P*Q*c)])}
  const P=pick([10,20,30,40]),Q=pick([10,20,30,40,50]),a=Math.atan(Q/P)*180/Math.PI;return gbN(`Two forces P = ${P} N (along x) and Q = ${Q} N (along y) act at a point. Find the angle the resultant makes with the x-axis (in degrees).`,a,"°",`tan α = Q/P = ${Q}/${P} = ${r2(Q/P)}, so α = ${r2(a)}°.`,[90-a,Math.atan(P/Q)*180/Math.PI+10,a/2])},
 // beam reactions
 ()=>{const W=pick([10,20,30,40,60]),L=pick([4,5,8,10]),a=rnd(1,L-1),RB=W*a/L,RA=W-RB,w=rnd(0,1);
  const stem=`A simply supported beam AB of span ${L} m carries a point load of ${W} kN at ${a} m from A. `;
  return w===0?gbN(stem+"Find the reaction at B (in kN).",RB,"kN",`Moments about A: R<sub>B</sub>×${L} = ${W}×${a}, so R<sub>B</sub> = ${r2(RB)} kN.`,[RA,W,W*a]):gbN(stem+"Find the reaction at A (in kN).",RA,"kN",`Moments about B: R<sub>A</sub>×${L} = ${W}×${L-a}, so R<sub>A</sub> = ${r2(RA)} kN. (Check: R<sub>A</sub> + R<sub>B</sub> = ${W} kN.)`,[RB,W,W*(L-a)])},
 // Lami / cable tension
 ()=>{const W=pick([50,100,200,500,1000]),th=pick([30,45,60]),T=W/(2*Math.sin(th*Math.PI/180));
  return gbN(`A load of ${W} N is hung from the midpoint of a light cable of which both halves are inclined at ${th}° to the horizontal. Find the tension in each half (in N).`,T,"N",`For equilibrium 2T sin θ = W, so T = W/(2 sin ${th}°) = ${W}/${r2(2*Math.sin(th*Math.PI/180))} = ${r2(T)} N.`,[W/2,W/(2*Math.cos(th*Math.PI/180)),W])},
 // friction
 ()=>{const w=rnd(0,2);
  if(w===0){const W=pick([50,100,200,500]),mu=pick([0.2,0.25,0.3,0.4,0.5]);return gbN(`A block weighing ${W} N rests on a horizontal floor with coefficient of static friction ${mu}. Find the minimum horizontal force needed to start it moving (in N).`,mu*W,"N",`Limiting friction F = μN = μW = ${mu}×${W} = ${r2(mu*W)} N.`,[W/mu,W,mu*W*2])}
  if(w===1){const [mu,ang,lab]=pick([[1,45,"1"],[Math.sqrt(3),60,"√3"],[1/Math.sqrt(3),30,"1/√3"]]);return mcq(`A block rests on a rough inclined plane and is just about to slide when the angle of the plane is increased. If μ = ${lab}, the angle of repose is…`,ang+"°",[45,60,30,90].filter(x=>x!==ang).slice(0,3).map(x=>x+"°"),`The angle of repose equals the angle of friction: tan φ = μ = ${lab}, so φ = ${ang}°.`)}
  const W=pick([100,200,500]),th=pick([30,60]),mu=pick([0.2,0.3,0.4]),N=W*Math.cos(th*Math.PI/180),F=mu*N;return gbN(`A ${W} N block rests on a ${th}° rough incline (μ = ${mu}). Find the limiting friction force between the block and the plane (in N).`,F,"N",`Normal reaction N = W cos θ = ${W}×cos ${th}° = ${r2(N)} N. F = μN = ${mu}×${r2(N)} = ${r2(F)} N.`,[W*Math.sin(th*Math.PI/180),mu*W,W*Math.sin(th*Math.PI/180)-F])},
 // moment of inertia
 ()=>{const w=rnd(0,2),b=pick([6,8,10,12]),h=pick([6,8,10,12]);
  if(w===0)return gbN(`Find the moment of inertia of a rectangle ${b} cm wide and ${h} cm deep about its centroidal axis parallel to the width (in cm⁴).`,b*h*h*h/12,"cm⁴",`I<sub>xx</sub> = bh³/12 = ${b}×${h}³/12 = ${r2(b*h*h*h/12)} cm⁴.`,[b*h*h*h/3,h*b*b*b/12,b*h*h*h/36]);
  if(w===1)return gbN(`Find the moment of inertia of a rectangle ${b} cm wide and ${h} cm deep about its base (in cm⁴).`,b*h*h*h/3,"cm⁴",`By the parallel-axis theorem: I = I<sub>G</sub> + Ad² = bh³/12 + bh(h/2)² = bh³/3 = ${b}×${h}³/3 = ${r2(b*h*h*h/3)} cm⁴.`,[b*h*h*h/12,b*h*h*h/36,b*h*h/3]);
  const d=pick([4,6,8,10,12]);return gbN(`Find the moment of inertia of a circular section of diameter ${d} cm about a diameter (in cm⁴, to 2 decimals).`,Math.PI*Math.pow(d,4)/64,"cm⁴",`I = πd⁴/64 = π×${d}⁴/64 = ${r2(Math.PI*Math.pow(d,4)/64)} cm⁴.`,[Math.PI*Math.pow(d,4)/32,Math.PI*Math.pow(d,4)/16,Math.PI*d*d/4])},
 // truss symmetric triangle
 ()=>{const W=pick([20,40,60,100]),th=pick([30,45,60]),s=Math.sin(th*Math.PI/180),t=Math.tan(th*Math.PI/180),w=rnd(0,1);
  const stem=`A symmetrical triangular truss ABC (base AB, apex C) with base angles ${th}° is simply supported at A and B and carries a vertical load of ${W} kN at C. `;
  return w===0?gbN(stem+"Find the force in the inclined member AC (in kN, compressive).",W/(2*s),"kN",`Each support reaction is ${W/2} kN. At joint A: F<sub>AC</sub> sin ${th}° = ${W/2}, so F<sub>AC</sub> = ${W/2}/${r2(s)} = ${r2(W/(2*s))} kN (compression).`,[W/2,W/(2*Math.cos(th*Math.PI/180)),W*s]):gbN(stem+"Find the force in the base member AB (in kN, tensile).",W/(2*t),"kN",`At joint A: F<sub>AB</sub> = F<sub>AC</sub> cos ${th}° = (${W/2}/sin ${th}°)cos ${th}° = ${W/2}/tan ${th}° = ${r2(W/(2*t))} kN (tension).`,[W/(2*s),W/2,W*t/2])},
 // truss counting and concepts
 ()=>{const w=rnd(0,2);
  if(w===0){const j=rnd(3,12);return nat(`A simple (perfect) plane truss has ${j} joints. How many members does it have?`,2*j-3,`For a perfect truss m = 2j − 3 = 2×${j} − 3 = ${2*j-3}.`)}
  if(w===1){const j=rnd(4,10),m=2*j-3+pick([-1,1,2]),ans=m<2*j-3?"deficient (imperfect) truss - a mechanism":"redundant truss";return mcq(`A plane truss has ${j} joints and ${m} members. It is a…`,ans,["perfect (just-rigid) truss",m<2*j-3?"redundant truss":"deficient (imperfect) truss - a mechanism","statically determinate truss with zero members"].filter(x=>x!==ans),`Compare m with 2j − 3 = ${2*j-3}. Here m = ${m}, which is ${m<2*j-3?"less, so the truss is deficient":"more, so it has redundant members"}.`)}
  return gbMsqF([
   ["Which statements about trusses are correct?",["Members of an ideal truss carry only axial forces","The method of joints uses ΣF<sub>x</sub> = 0 and ΣF<sub>y</sub> = 0 at each joint","The method of sections can find the force in a member without solving every joint","A perfect truss satisfies m = 2j − 3"],["Members of an ideal truss carry bending moments","The method of joints uses ΣM = 0 as its only equation","A perfect truss satisfies m = 3j − 2"],"An ideal truss has pin joints and loads applied only at the joints, so every member is a two-force member. The method of joints has two equations per joint; the method of sections cuts the truss and uses three equilibrium equations."],
   ["Which statements about zero-force members are correct?",["At a joint with two non-collinear members and no external load, both members are zero-force","A member is zero-force if it meets a joint where the other two members are collinear and there is no external load on that joint"],["A zero-force member can always be removed without affecting stability","A member with zero force is never necessary in a truss"],"Resolving the forces perpendicular to a member at such joints shows its force must vanish. Zero-force members still give stability and carry load if the loading changes."]])},
 // couples / parallel forces
 ()=>{const w=rnd(0,1);
  if(w===0){const F=pick([10,20,30,50,100]),d=pick([0.2,0.5,1,2,3]);return gbN(`A force of ${F} N is shifted parallel to itself by a perpendicular distance of ${d} m. Find the moment of the couple that must be added (in N·m).`,F*d,"N·m",`Moving a force parallel to itself requires adding a couple equal to the moment of the force about the new point: M = F×d = ${F}×${d} = ${r2(F*d)} N·m.`,[F/d,F+d,F*d*2])}
  const P=pick([10,20,30,40]),Q=pick([20,30,50,60]),d=pick([4,5,10]),x=Q*d/(P+Q);return gbN(`Two like parallel forces of ${P} N and ${Q} N act ${d} m apart. Find the distance of their resultant from the ${P} N force (in m).`,x,"m",`R = ${P+Q} N. Moments about the ${P} N force: R×x = ${Q}×${d}, so x = ${Q*d}/${P+Q} = ${r2(x)} m.`,[P*d/(P+Q),d/2,d])},
 // mechanics facts
 ()=>gbFact([
  ["Newton's first law of motion states that a body…","continues in its state of rest or uniform motion in a straight line unless acted on by an external force",["accelerates in proportion to its mass","always experiences an equal and opposite reaction","has kinetic energy equal to its potential energy"],"The first law defines inertia. The second law gives F = ma; the third gives action–reaction pairs."],
  ["The necessary and sufficient condition for equilibrium of a coplanar force system is…","ΣF<sub>x</sub> = 0, ΣF<sub>y</sub> = 0 and ΣM = 0",["ΣF<sub>x</sub> = 0 only","ΣM = 0 only","ΣF<sub>x</sub> + ΣF<sub>y</sub> = 0"],"A general coplanar system has three equilibrium equations: two force components and one moment."],
  ["A free-body diagram (FBD) shows…","the body isolated from its surroundings with all external forces and reactions on it",["only the internal forces of the body","the velocity of the body","only the weight of the body"],"Draw the body alone, then replace every supporting connection with the reaction force or moment it exerts."],
  ["The coefficient of friction μ is related to the angle of friction φ by…","μ = tan φ",["μ = sin φ","μ = cos φ","μ = 1/tan φ"],"φ is the angle between the normal reaction and the resultant of the normal and friction forces, so tan φ = F/N = μ."],
  ["Limiting friction is…","the maximum friction force that can act just before sliding starts",["the friction force during sliding at high speed","zero for a body at rest","equal to the weight of the body"],"Static friction adjusts up to F<sub>max</sub> = μ<sub>s</sub>N; beyond that the body slides."],
  ["Varignon's theorem states that…","the moment of a resultant about a point equals the sum of the moments of the components about that point",["the resultant of two forces equals their algebraic sum","the sum of moments of a couple is always zero","two couples with the same moment have different effects"],"It is used to locate the line of action of a resultant."],
  ["The moment of a couple is…","the same about every point in its plane",["zero about the mid point only","larger about points farther from the couple","zero for equal and opposite forces"],"M = F×d, where d is the perpendicular distance between the two forces; it does not depend on the point chosen."]])
],
2:[
 // stress, strain, elongation
 ()=>{const w=rnd(0,3);
  if(w===0){const P=pick([10,20,50,100]),A=pick([100,200,250,400,500]);return gbN(`A bar of cross-sectional area ${A} mm² carries an axial tensile load of ${P} kN. Find the normal stress (in MPa).`,P*1000/A,"MPa",`σ = P/A = ${P*1000} N / ${A} mm² = ${r2(P*1000/A)} N/mm² = ${r2(P*1000/A)} MPa.`,[P/A,P*1000*A,P*100/A])}
  if(w===1){const P=pick([20,40,50,100]),L=pick([1,2,3]),A=pick([250,400,500,1000]),E=pick([100,200]),dl=P*L*1000/(A*E);return gbN(`A bar ${L} m long, of area ${A} mm² and E = ${E} GPa, carries an axial load of ${P} kN. Find its elongation (in mm).`,dl,"mm",`δ = PL/(AE) = (${P*1000} N × ${L*1000} mm)/(${A} mm² × ${E*1000} N/mm²) = ${r2(dl)} mm.`,[dl*1000,dl/1000,dl*2])}
  if(w===2){const s=pick([100,150,200,250]),e=pick([0.5,1,2]),E=s/e;return gbN(`In a tension test a specimen shows a stress of ${s} MPa at a strain of ${e}×10⁻³ within the elastic range. Find Young's modulus (in GPa).`,E,"GPa",`E = σ/ε = ${s} MPa/(${e}×10⁻³) = ${r2(E*1000)} MPa = ${r2(E)} GPa.`,[E*1000,E/1000,s*e])}
  const P=pick([20,40,50,80]),d=pick([10,20,25]),s=P*1000/(Math.PI*d*d/4);return gbN(`A circular rod of diameter ${d} mm carries a tensile force of ${P} kN. Find the stress in the rod (in MPa, 2 decimals).`,s,"MPa",`A = πd²/4 = π×${d}²/4 = ${r2(Math.PI*d*d/4)} mm². σ = P/A = ${P*1000}/${r2(Math.PI*d*d/4)} = ${r2(s)} MPa.`,[s*4,s/2,P*1000/(Math.PI*d*d)])},
 // elastic constants
 ()=>{const w=rnd(0,2);
  if(w===0){const E=pick([200,210,100,120]),nu=pick([0.25,0.3]),G=E/(2*(1+nu));return gbN(`For a material with E = ${E} GPa and Poisson's ratio ν = ${nu}, find the modulus of rigidity G (in GPa).`,G,"GPa",`E = 2G(1 + ν), so G = E/(2(1 + ν)) = ${E}/${r2(2*(1+nu))} = ${r2(G)} GPa.`,[E/(2*(1-nu)),E*2*(1+nu),E/(1+nu)])}
  if(w===1){const E=pick([200,210,100,120]),nu=pick([0.25,0.3]),K=E/(3*(1-2*nu));return gbN(`For a material with E = ${E} GPa and ν = ${nu}, find the bulk modulus K (in GPa).`,K,"GPa",`E = 3K(1 − 2ν), so K = E/(3(1 − 2ν)) = ${E}/${r2(3*(1-2*nu))} = ${r2(K)} GPa.`,[E/(3*(1+2*nu)),E/(2*(1+nu)),E*3*(1-2*nu)])}
  const [E,G]=pick([[200,80],[210,84],[100,40],[150,60],[130,50],[260,100],[125,50]]),nu=E/(2*G)-1;return gbN(`A material has E = ${E} GPa and G = ${G} GPa. Find Poisson's ratio.`,nu,"",`E = 2G(1 + ν), so ν = E/(2G) − 1 = ${E}/${2*G} − 1 = ${r2(nu)}.`,[E/G,G/E,E/(2*G)])},
 // shear stress
 ()=>{const w=rnd(0,2);
  if(w===0){const P=pick([10,20,30,40]),d=pick([10,12,16,20]),n=pick([1,2]),tau=P*1000/(n*Math.PI*d*d/4);return gbN(`A ${d} mm diameter pin joins two plates and transmits a force of ${P} kN in ${n===1?"single":"double"} shear. Find the shear stress in the pin (in MPa, 2 decimals).`,tau,"MPa",`Shear area = ${n}×πd²/4 = ${n}×π×${d}²/4 = ${r2(n*Math.PI*d*d/4)} mm². τ = ${P*1000}/${r2(n*Math.PI*d*d/4)} = ${r2(tau)} MPa.`,[tau*n,tau*2,P*1000/(Math.PI*d*d)])}
  if(w===1){const P=pick([20,30,40,50]),A=pick([100,200,250,400]),tau=P*1000/A;return gbN(`A shear force of ${P} kN acts on an area of ${A} mm² in a rivet. Find the average shear stress (in MPa).`,tau,"MPa",`τ = P/A = ${P*1000}/${A} = ${r2(tau)} MPa.`,[tau/1000,tau*2,P/A])}
  const tau=pick([20,40,50,80]),G=pick([80,84]),g=tau/(G*1000);return gbN(`A material with G = ${G} GPa is subjected to a shear stress of ${tau} MPa. Find the shear strain (in units of 10⁻⁴ radian).`,g*1e4,"×10⁻⁴ rad",`γ = τ/G = ${tau}/${G*1000} = ${r2(g*1e4)}×10⁻⁴ rad.`,[g*1e3,g*1e5,tau/G])},
 // stress-strain diagram facts
 ()=>gbMsqF([
  ["Which statements about the stress–strain diagram of mild steel (a ductile material) are correct?",["It shows a clear yield point","Beyond the ultimate stress the specimen necks and then fractures","Hooke's law holds up to the proportional limit","The area under the curve indicates toughness"],["It shows no yield point and no necking","Fracture occurs at the ultimate stress with no necking","Strain is proportional to stress up to fracture"],"A ductile material yields, work-hardens, reaches the ultimate stress, necks and fractures. Hooke's law (σ ∝ ε) applies only up to the proportional limit."],
  ["Which statements about brittle materials (e.g. cast iron, glass) are correct?",["They fracture with very little plastic deformation","There is no distinct yield point","They are generally stronger in compression than in tension"],["They show large necking before fracture","They have a well-defined yield plateau","They are stronger in tension than in compression"],"Brittle materials break suddenly with small strain. Cast iron and concrete are much stronger in compression."],
  ["Which of the following are valid statements of Hooke's law for a bar?",["Stress is proportional to strain within the elastic (proportional) limit","The constant of proportionality for axial loading is Young's modulus E","σ = Eε"],["Stress is always proportional to strain up to fracture","Stress is inversely proportional to strain","E has the unit of strain"],"Within the elastic limit σ = Eε, and E (N/m² or Pa) is the slope of the linear part of the σ–ε curve."]]),
 // property definitions
 ()=>gbFact([
  ["The ability of a material to be drawn into a wire is called…","ductility",["malleability","toughness","hardness"],"Ductility is the capacity for large plastic deformation in tension; copper and mild steel are ductile."],
  ["The ability of a material to be hammered or rolled into thin sheets without cracking is called…","malleability",["ductility","brittleness","stiffness"],"Malleability is plastic deformation in compression, e.g. gold and lead."],
  ["The ability of a material to absorb energy in the plastic range before fracture is called…","toughness",["hardness","stiffness","elasticity"],"Toughness is measured by the area under the stress–strain curve up to fracture."],
  ["Resistance of a material to indentation or scratching is called…","hardness",["toughness","ductility","malleability"],"Hardness is measured on Brinell, Rockwell or Vickers scales."],
  ["A material that fractures with little or no plastic deformation is called…","brittle",["ductile","tough","malleable"],"Cast iron and glass are examples."],
  ["The property of a material by which it regains its original shape after removal of the load is called…","elasticity",["plasticity","ductility","hardness"],"Beyond the elastic limit, permanent (plastic) deformation remains."],
  ["The ability of a material to resist deformation under load (measured by E) is called…","stiffness",["toughness","ductility","hardness"],"Stiffness is the resistance to elastic deformation; higher E means a stiffer material."],
  ["The maximum stress a material can carry before fracture in a tension test is called…","ultimate tensile strength",["yield strength","proportional limit","endurance limit"],"Ultimate strength is the highest point of the engineering stress–strain curve."]]),
 // engineering materials facts
 ()=>gbFact([
  ["Which contains the most carbon?","cast iron (about 2–4%)",["mild steel (about 0.15–0.25%)","medium carbon steel (about 0.25–0.6%)","wrought iron (below 0.1%)"],"Cast iron has more than 2% carbon; steels contain less than 2%; wrought iron is almost pure iron."],
  ["Steels are alloys of iron and carbon with carbon content…","up to about 2%",["above 2% and up to 4.5%","exactly 0%","above 5%"],"Above 2% carbon the alloy is classed as cast iron."],
  ["Mild (low carbon) steel typically contains…","up to about 0.25% carbon",["0.6–1.5% carbon","2–4% carbon","more than 5% carbon"],"Classification: low carbon up to about 0.25%, medium about 0.25–0.6%, high about 0.6–1.5%."],
  ["As the carbon content of a plain carbon steel increases, its hardness and strength…","increase while ductility decreases",["decrease and ductility increases","and ductility all increase","and ductility are unchanged"],"Carbon forms hard iron carbide (cementite), raising strength and hardness but reducing ductility and weldability."],
  ["Stainless steel gets its corrosion resistance mainly from the alloying element…","chromium (at least about 10.5%)",["tungsten","manganese","lead"],"Chromium forms a thin, self-healing oxide layer on the surface. The common 18/8 grade also has about 8% nickel."],
  ["High-speed steel is an alloy steel that mainly contains…","tungsten, chromium and vanadium",["lead and tin","only carbon","copper and zinc"],"Its hardness is retained at red heat, so it is used for cutting tools."],
  ["Grey cast iron is widely used for machine beds and engine blocks because it has…","good castability, damping capacity and compressive strength",["very high tensile ductility","excellent weldability","very low carbon content"],"Graphite flakes damp vibration and help machining, but make it brittle in tension."],
  ["Which is an alloy steel used for the wear-resistant jaws of crushers and rail crossings?","manganese steel (about 12–14% Mn)",["mild steel","grey cast iron","stainless steel"],"Hadfield manganese steel work-hardens under impact and abrasion."],
  ["Wrought iron is characterised by…","very low carbon, good ductility and corrosion resistance",["very high carbon and brittleness","2–4% carbon","a high alloy content of chromium"],"It is almost pure iron with slag fibres, easily forged and welded."]]),
 // Poisson / volumetric
 ()=>{const e=pick([4,6,8,10,12]),nu=pick([0.25,0.3]),w=rnd(0,1);
  if(w===0)return gbN(`A bar is stretched so that its longitudinal strain is ${e}×10⁻⁴. If Poisson's ratio is ${nu}, find the magnitude of the lateral strain (in units of 10⁻⁴).`,nu*e,"×10⁻⁴",`Lateral strain = −ν × longitudinal strain = ${nu}×${e}×10⁻⁴ = ${r2(nu*e)}×10⁻⁴ (it is a contraction).`,[e/nu,e*(1-2*nu),e])
  return gbN(`A bar has a longitudinal strain of ${e}×10⁻⁴ and ν = ${nu}. Find its volumetric strain (in units of 10⁻⁴), using ε<sub>v</sub> = ε(1 − 2ν).`,e*(1-2*nu),"×10⁻⁴",`ε<sub>v</sub> = ε(1 − 2ν) = ${e}×10⁻⁴ × (1 − ${2*nu}) = ${r2(e*(1-2*nu))}×10⁻⁴.`,[e*(1+2*nu),e*(1-nu),e])},
 // factor of safety
 ()=>{const su=pick([250,400,420,500]),fs=pick([2,2.5,4,5]),A=pick([100,200,400,500]),sw=su/fs,w=rnd(0,1);
  if(w===0)return gbN(`A steel has an ultimate tensile strength of ${su} MPa. Using a factor of safety of ${fs}, find the permissible (working) stress (in MPa).`,sw,"MPa",`Working stress = ultimate stress / factor of safety = ${su}/${fs} = ${r2(sw)} MPa.`,[su*fs,su-fs,su/(fs*2)]);
  return gbN(`A tie bar of cross-section ${A} mm² is made of steel with ultimate strength ${su} MPa. With a factor of safety of ${fs}, find the maximum safe axial load (in kN).`,sw*A/1000,"kN",`Working stress = ${su}/${fs} = ${r2(sw)} MPa. Safe load = σ<sub>w</sub>A = ${r2(sw)}×${A} N = ${r2(sw*A/1000)} kN.`,[su*A/1000,sw*A,sw/A])},
 // percentage elongation / reduction
 ()=>{const L0=pick([50,100,200]),Lf=L0*pick([1.1,1.15,1.2,1.25,1.3]),d0=pick([10,12,16]),df=d0*pick([0.6,0.7,0.8]),w=rnd(0,1);
  if(w===0)return gbN(`In a tensile test the gauge length of a specimen increases from ${L0} mm to ${r2(Lf)} mm at fracture. Find the percentage elongation.`,(Lf-L0)/L0*100,"%",`% elongation = (L<sub>f</sub> − L<sub>0</sub>)/L<sub>0</sub> × 100 = (${r2(Lf)} − ${L0})/${L0} × 100 = ${r2((Lf-L0)/L0*100)}%.`,[Lf/L0*100,(Lf-L0),(Lf-L0)/Lf*100]);
  const red=(1-Math.pow(df/d0,2))*100;return gbN(`A round tensile specimen of diameter ${d0} mm has a diameter of ${r2(df)} mm at the fracture neck. Find the percentage reduction in area.`,red,"%",`% reduction in area = (A<sub>0</sub> − A<sub>f</sub>)/A<sub>0</sub> × 100 = (1 − (${r2(df)}/${d0})²) × 100 = ${r2(red)}%.`,[(1-df/d0)*100,Math.pow(df/d0,2)*100,(d0-df)])}
],
3:[
 // errors
 ()=>{const T=pick([25,50,100,200,250]),d=pick([1,2,2.5,4,5]),M=coin(.5)?T+d:T-d,w=rnd(0,2);
  if(w===0)return gbN(`An instrument reads ${M} units when the true value is ${T} units. Find the percentage error (magnitude).`,d/T*100,"%",`Absolute error = |${M} − ${T}| = ${d}. % error = ${d}/${T} × 100 = ${r2(d/T*100)}%.`,[d/M*100,d,d/T]);
  if(w===1)return gbN(`A pressure gauge reads ${M} kPa against a true value of ${T} kPa. Find the absolute error (magnitude, in kPa).`,d,"kPa",`Absolute error = |measured − true| = |${M} − ${T}| = ${d} kPa.`,[d/T*100,d/T,2*d]);
  return mcq("A consistent error that has the same magnitude and sign in every reading (for example an unzeroed instrument) is called a…","systematic error",["random error","gross error","statistical error"],"Systematic errors are repeatable and can be corrected by calibration; random errors vary unpredictably; gross errors come from human mistakes.")},
 // temperature conversion
 ()=>{const C=pick([-40,0,20,25,30,37,50,75,100]),w=rnd(0,1);
  if(w===0)return gbN(`Convert ${C} °C to °F (°F = 1.8 × °C + 32).`,1.8*C+32,"°F",`°F = 1.8×${C} + 32 = ${r2(1.8*C+32)} °F.`,[C+32,1.8*C-32,(C+32)*1.8]);
  return gbN(`Convert ${C} °C to kelvin (use K = °C + 273).`,C+273,"K",`T(K) = ${C} + 273 = ${C+273} K.`,[C-273,C*1.8+32,C+373])},
 // instrument facts
 ()=>gbFact([
  ["A thermocouple measures temperature using…","the Seebeck (thermoelectric) effect",["the change of resistance with strain","the expansion of a liquid","the Doppler effect"],"Two dissimilar metals joined at a hot junction generate an emf that depends on the temperature difference from the cold junction."],
  ["A resistance temperature detector (RTD) measures temperature through…","the change of electrical resistance of a metal (e.g. platinum) with temperature",["the thermoelectric emf","the expansion of mercury","thermal radiation only"],"For platinum R<sub>T</sub> = R<sub>0</sub>(1 + αT), α ≈ 0.0039/°C."],
  ["A Bourdon tube gauge measures…","pressure",["temperature","velocity","torque"],"A curved, flattened tube tends to straighten when pressurised; the motion drives a pointer."],
  ["A U-tube manometer measures pressure by…","balancing it against the height of a liquid column",["the deflection of a diaphragm with a strain gauge","the expansion of a bimetallic strip","the Seebeck effect"],"p = ρgh: the gauge pressure equals the weight of the liquid column per unit area."],
  ["A Pitot tube is used to measure…","the velocity of a fluid",["temperature","torque","strain"],"It measures stagnation pressure; with static pressure it gives v = √(2Δp/ρ)."],
  ["A strain-gauge load cell is used to measure…","force",["temperature","velocity of gases","the viscosity of oil"],"Force deforms the element and the change in gauge resistance is proportional to the strain."],
  ["Which device is used to measure the torque of a rotating shaft?","dynamometer (e.g. Prony brake)",["Bourdon gauge","thermocouple","Pitot tube"],"Brake power = 2πNT/60 with T from the dynamometer."],
  ["A bimetallic strip thermometer works on…","the difference in thermal expansion of two bonded metals",["the Seebeck effect","a change in resistance","the Hall effect"],"The strip bends when heated because the two metals expand by different amounts."],
  ["A tachometer measures…","rotational speed",["pressure","force","temperature"],"It gives shaft speed in rpm, e.g. for finding engine speed."]]),
 // pressure
 ()=>{const [name,rho]=pick([["water",1000],["mercury",13600],["oil",800]]),h=pick([0.1,0.25,0.5,2,3,5]),p=rho*9.81*h/1000,w=rnd(0,1);
  if(w===0)return gbN(`Find the gauge pressure at a depth of ${h} m in ${name} (ρ = ${rho} kg/m³, g = 9.81 m/s²) in kPa.`,p,"kPa",`p = ρgh = ${rho}×9.81×${h} = ${r2(p*1000)} Pa = ${r2(p)} kPa.`,[p*1000,p/1000,rho*h/1000]);
  return gbN(`A manometer shows a gauge pressure equivalent to ${h} m of ${name} (ρ = ${rho} kg/m³, g = 9.81 m/s²). Find the absolute pressure if the atmospheric pressure is 100 kPa (in kPa).`,100+p,"kPa",`p<sub>gauge</sub> = ρgh = ${r2(p)} kPa. p<sub>abs</sub> = p<sub>gauge</sub> + p<sub>atm</sub> = ${r2(p)} + 100 = ${r2(100+p)} kPa.`,[p,100-p,p*1000+100])},
 // viscosity
 ()=>{const w=rnd(0,1);
  if(w===0){const mu=pick([0.05,0.1,0.2,0.5]),U=pick([1,2,3,5]),y=pick([1,2,5,10]),tau=mu*U/(y/1000);return gbN(`Oil of dynamic viscosity ${mu} Pa·s fills a ${y} mm gap between a fixed plate and a plate moving at ${U} m/s. Assuming a linear velocity profile, find the shear stress (in Pa).`,tau,"Pa",`Newton's law of viscosity: τ = μ du/dy = ${mu}×${U}/(${y}×10⁻³) = ${r2(tau)} Pa.`,[tau/1000,tau*1000,mu*U*y])}
  const mu=pick([0.001,0.002,0.008,0.05]),rho=pick([800,900,1000]),nu=mu/rho*1e6;return gbN(`A fluid has dynamic viscosity ${mu} Pa·s and density ${rho} kg/m³. Find its kinematic viscosity (in units of 10⁻⁶ m²/s).`,nu,"×10⁻⁶ m²/s",`ν = μ/ρ = ${mu}/${rho} = ${r2(nu)}×10⁻⁶ m²/s.`,[mu*rho*1e6,nu/1000,nu*10])},
 // Pascal's law
 ()=>{const F1=pick([50,100,200,250]),d1=pick([2,4,5,10]),k=pick([2,4,5,10]),d2=d1*k,F2=F1*k*k;
  return gbN(`In a hydraulic press the small piston has diameter ${d1} cm and the large piston ${d2} cm. A force of ${F1} N is applied to the small piston. Find the force on the large piston (in N).`,F2,"N",`Pascal's law: F₁/A₁ = F₂/A₂, so F₂ = F₁(d₂/d₁)² = ${F1}×${k}² = ${F2} N.`,[F1*k,F1/(k*k),F1*k*k*k])},
 // Bernoulli
 ()=>{const w=rnd(0,2);
  if(w===0){const k=pick([2,3]),d2=pick([10,15,20]),d1=k*d2,v1=pick([1,2,3]),v2=v1*k*k,dp=0.5*1000*(v2*v2-v1*v1)/1000;return gbN(`Water (ρ = 1000 kg/m³) flows through a horizontal pipe that narrows from ${d1} cm to ${d2} cm diameter. The velocity in the wide section is ${v1} m/s. Find the pressure drop between the two sections (in kPa).`,dp,"kPa",`Continuity: v₂ = v₁(d₁/d₂)² = ${v1}×${k*k} = ${v2} m/s. Bernoulli (horizontal): p₁ − p₂ = ½ρ(v₂² − v₁²) = 0.5×1000×(${v2*v2} − ${v1*v1}) = ${r2(dp*1000)} Pa = ${r2(dp)} kPa.`,[dp*1000,0.5*1000*v2*v2/1000,0.5*1000*(v2-v1)*(v2-v1)/1000])}
  if(w===1){const h=pick([1,2,5,10,20]),v=Math.sqrt(2*9.81*h);return gbN(`Water flows freely out of a small orifice ${h} m below the surface of a large tank. Find the theoretical velocity of the jet (in m/s, g = 9.81 m/s²).`,v,"m/s",`Torricelli / Bernoulli: v = √(2gh) = √(2×9.81×${h}) = ${r2(v)} m/s.`,[Math.sqrt(9.81*h),2*9.81*h,v*2])}
  return gbFact([
   ["Bernoulli's equation for a steady, incompressible, frictionless flow states that along a streamline…","p/ρg + v²/2g + z is constant",["p + v + z is constant","p/ρg − v²/2g + z is constant","the velocity is constant"],"Pressure head + velocity head + datum (elevation) head remains constant, an energy balance per unit weight."],
   ["Which of the following is NOT an assumption of Bernoulli's equation?","the flow is turbulent with friction losses",["the flow is steady","the fluid is incompressible","the flow is frictionless (non-viscous) along a streamline"],"Bernoulli's equation applies to ideal, steady, incompressible flow along a streamline; friction losses require an extra head-loss term."],
   ["The continuity equation for incompressible flow is…","A₁v₁ = A₂v₂",["A₁/v₁ = A₂/v₂","p₁A₁ = p₂A₂","v₁ + A₁ = v₂ + A₂"],"The volume flow rate Q = Av is the same at every cross-section."],
   ["In a horizontal pipe, when the cross-section narrows the pressure…","decreases, because the velocity increases",["increases, because the velocity increases","stays the same","becomes zero"],"By Bernoulli, an increase in velocity head is balanced by a decrease in pressure head (the Venturi effect)."]])},
 // discharge
 ()=>{const d=pick([50,100,150,200]),v=pick([1,2,3,4]),Q=Math.PI*Math.pow(d/1000,2)/4*v*1000,w=rnd(0,1);
  if(w===0)return gbN(`Water flows at ${v} m/s through a pipe of ${d} mm diameter. Find the discharge (in litres per second, 2 decimals).`,Q,"L/s",`A = πd²/4 = π×${d/1000}²/4 = ${(Math.PI*Math.pow(d/1000,2)/4).toFixed(5)} m². Q = Av = ${(Q/1000).toFixed(5)} m³/s = ${r2(Q)} L/s.`,[Q/1000,Q*1000,Q*4]);
  const A1=pick([20,40,50,100]),v1=pick([2,3,4,5]),A2=pick([10,20,25]),v2=A1*v1/A2;return gbN(`Water flows at ${v1} m/s through a section of area ${A1} cm². It then enters a section of area ${A2} cm². Find the velocity in the second section (in m/s).`,v2,"m/s",`Continuity: A₁v₁ = A₂v₂, so v₂ = ${A1}×${v1}/${A2} = ${r2(v2)} m/s.`,[v1*A2/A1,v1,A1*v1*A2])},
 // hydraulic machines
 ()=>gbFact([
  ["Which turbine is an impulse turbine suited to very high heads and low discharge?","Pelton wheel",["Kaplan turbine","Francis turbine","propeller turbine"],"A Pelton wheel works at atmospheric pressure with jets striking buckets; it needs high head."],
  ["Which turbine is an axial-flow reaction turbine suited to low heads and high discharge?","Kaplan turbine",["Pelton wheel","Francis turbine","Turgo turbine"],"Adjustable runner blades make the Kaplan turbine efficient over a wide range of flows."],
  ["The Francis turbine is a…","radial (mixed) flow reaction turbine for medium heads",["impulse turbine for very high head","axial flow turbine for very low head","gas turbine"],"Water enters radially and leaves axially; the runner is always full and works under pressure."],
  ["Before starting a centrifugal pump, the casing must be filled with liquid. This is called…","priming",["cavitation","cushioning","throttling"],"Otherwise the pump cannot create enough suction to lift the liquid (air binding)."],
  ["A reciprocating pump is a…","positive displacement pump",["rotodynamic pump","turbine","jet pump only"],"A piston or plunger displaces a fixed volume per stroke, and suction and delivery valves control the direction of flow."],
  ["In a centrifugal pump, the kinetic energy of the liquid leaving the impeller is converted to pressure energy in the…","volute casing (or diffuser)",["suction pipe","foot valve","priming tank"],"The casing's increasing cross-section reduces velocity and raises pressure."],
  ["An air vessel is fitted to a reciprocating pump in order to…","reduce fluctuations in the flow rate and pressure",["increase the suction lift","start the pump without priming","cool the liquid"],"The air cushion absorbs the flow surges and gives a steadier discharge."]]),
 // fluid types
 ()=>gbFact([
  ["Newton's law of viscosity states that shear stress in a fluid is…","proportional to the velocity gradient (τ = μ du/dy)",["proportional to the velocity","independent of the velocity gradient","proportional to the pressure"],"Fluids that follow this linear relation are called Newtonian fluids."],
  ["Which of the following is a Newtonian fluid?","water",["toothpaste","paint","tomato ketchup"],"Water, air and most thin oils show a constant viscosity."],
  ["An ideal fluid is one that is…","incompressible and has zero viscosity",["compressible with high viscosity","viscous and incompressible","a gas at high pressure"],"It is a theoretical concept that simplifies flow analysis (no shear stress)."],
  ["When the temperature of a liquid rises, its viscosity generally…","decreases",["increases","stays constant","becomes infinite"],"Cohesive forces weaken with heating; in gases viscosity increases with temperature."],
  ["Pascal's law states that pressure applied to an enclosed static fluid is…","transmitted equally in all directions",["transmitted only downward","zero at the walls","proportional to the area"],"This is the basis of hydraulic presses and jacks."],
  ["The SI unit of dynamic viscosity is…","Pa·s (N·s/m²)",["m²/s","N/m","kg/m³"],"Kinematic viscosity has the unit m²/s. 1 poise = 0.1 Pa·s."]])
],
4:[
 // first law
 ()=>{const Q=pick([100,150,200,300,500,800]),W=pick([40,50,60,100,120,200]),w=rnd(0,2);
  if(w===0)return gbN(`A closed system receives ${Q} kJ of heat and does ${W} kJ of work on the surroundings. Find the change in internal energy (in kJ).`,Q-W,"kJ",`First law (closed system): Q = ΔU + W, so ΔU = ${Q} − ${W} = ${Q-W} kJ.`,[Q+W,W-Q,Q]);
  if(w===1)return gbN(`During a process, ${W} kJ of work is done on a closed system and it rejects ${Q} kJ of heat. Find the change in internal energy (in kJ).`,W-Q,"kJ",`Q = −${Q} kJ (heat leaves) and W = −${W} kJ (work done on the system). ΔU = Q − W = −${Q} + ${W} = ${W-Q} kJ.`,[Q-W,Q+W,-(Q+W)]);
  return gbN(`A gas in a cylinder expands and does ${W} kJ of work. Its internal energy falls by ${Q} kJ. Find the heat transfer to the gas (in kJ; negative if heat leaves).`,W-Q,"kJ",`Q = ΔU + W = −${Q} + ${W} = ${W-Q} kJ.`,[Q+W,Q-W,-(Q+W)])},
 // steady flow energy equation
 ()=>{const w=rnd(0,2);
  if(w===0){const m=pick([1,2,5,10]),h1=pick([2800,3000,3200,3400]),h2=pick([2200,2400,2600]),W=m*(h1-h2);return gbN(`Steam enters an adiabatic turbine at ${m} kg/s with an enthalpy of ${h1} kJ/kg and leaves with ${h2} kJ/kg. Neglecting changes in kinetic and potential energy, find the power output (in kW).`,W,"kW",`SFEE with Q = 0: W = m(h₁ − h₂) = ${m}×(${h1} − ${h2}) = ${W} kW.`,[m*(h1+h2),W/m,(h1-h2)/m])}
  if(w===1){const v2=pick([100,200,300,400,500]),dh=v2*v2/2000;return gbN(`Steam expands adiabatically in a nozzle, dropping ${r2(dh)} kJ/kg in enthalpy. The inlet velocity is negligible. Find the exit velocity (in m/s).`,v2,"m/s",`SFEE: h₁ − h₂ = v₂²/2 (in J/kg), so v₂ = √(2×${r2(dh)}×1000) = ${v2} m/s.`,[Math.sqrt(dh),2*dh*1000,v2/2])}
  const m=pick([2,5,10]),h1=pick([3000,3200]),h2=pick([2400,2600]),L=pick([20,40,50]),W=m*(h1-h2)-L;return gbN(`Steam flows through a turbine at ${m} kg/s. Enthalpy falls from ${h1} to ${h2} kJ/kg. The turbine loses ${L} kW of heat to the surroundings. Find the power output (in kW), ignoring kinetic and potential energy changes.`,W,"kW",`SFEE: Q − W = m(h₂ − h₁) with Q = −${L} kW. W = m(h₁ − h₂) + Q = ${m*(h1-h2)} − ${L} = ${W} kW.`,[m*(h1-h2)+L,m*(h1-h2),W/m])},
 // Carnot efficiency
 ()=>{const w=rnd(0,2);
  if(w===0){const TH=pick([600,800,1000,1200]),TL=300,eta=100*(1-TL/TH);return gbN(`A Carnot engine works between ${TH} K and ${TL} K. Find its thermal efficiency (%).`,eta,"%",`η = 1 − T<sub>L</sub>/T<sub>H</sub> = 1 − ${TL}/${TH} = ${+(eta/100).toFixed(4)}, i.e. ${r2(eta)}%.`,[100*TL/TH,100*(1-TH/TL),100*(TH-TL)/TL])}
  if(w===1){const C=pick([327,427,527,727]),TH=C+273,eta=100*(1-300/TH);return gbN(`A Carnot engine takes heat from a source at ${C} °C and rejects it to a sink at 27 °C. Find its efficiency (%). (Use K = °C + 273.)`,eta,"%",`T<sub>H</sub> = ${TH} K and T<sub>L</sub> = 300 K. η = 1 − 300/${TH} = ${+(eta/100).toFixed(4)}, i.e. ${r2(eta)}%.`,[100*(1-27/C),100*(1-300/C),100*300/TH])}
  const TH=pick([600,800,1000]),Q1=pick([100,200,400,500]),W=Q1*(1-300/TH);return gbN(`A Carnot engine operates between ${TH} K and 300 K and receives ${Q1} kJ of heat. Find the work output (in kJ).`,W,"kJ",`η = 1 − 300/${TH} = ${+(1-300/TH).toFixed(4)}. W = ηQ₁ = ${+(1-300/TH).toFixed(4)}×${Q1} = ${r2(W)} kJ.`,[Q1*300/TH,Q1*TH/300,Q1-W+W*0.5])},
 // Carnot COP
 ()=>{const w=rnd(0,2),TH=300;
  if(w===0){const TL=pick([250,260,270,275,280]);return gbN(`A reversible refrigerator maintains a cold space at ${TL} K in surroundings at ${TH} K. Find its COP.`,TL/(TH-TL),"",`COP<sub>R</sub> = T<sub>L</sub>/(T<sub>H</sub> − T<sub>L</sub>) = ${TL}/${TH-TL} = ${r2(TL/(TH-TL))}.`,[TH/(TH-TL),(TH-TL)/TL,TL/TH])}
  if(w===1){const TL=pick([250,270,280,285,290]);return gbN(`A reversible heat pump heats a room at ${TH} K using outside air at ${TL} K. Find its COP.`,TH/(TH-TL),"",`COP<sub>HP</sub> = T<sub>H</sub>/(T<sub>H</sub> − T<sub>L</sub>) = ${TH}/${TH-TL} = ${r2(TH/(TH-TL))}.`,[TL/(TH-TL),(TH-TL)/TH,TH/TL])}
  const cr=pick([2,3,4,5,6,8]);return gbN(`The COP of a refrigerator is ${cr}. What is the COP of the same machine when used as a heat pump between the same reservoirs?`,cr+1,"",`COP<sub>HP</sub> = COP<sub>R</sub> + 1 = ${cr} + 1 = ${cr+1}, because Q<sub>H</sub> = Q<sub>L</sub> + W.`,[cr,cr-1,1/cr])},
 // actual refrigerator / heat pump data
 ()=>{const w=rnd(0,2);
  if(w===0){const QL=pick([120,180,240,300,360]),W=pick([1,1.5,2,3]),cop=QL/60/W;return gbN(`A refrigerator removes ${QL} kJ/min from the cold space and consumes ${W} kW of electrical power. Find its COP.`,cop,"",`Q<sub>L</sub> = ${QL}/60 = ${QL/60} kW. COP = Q<sub>L</sub>/W = ${QL/60}/${W} = ${r2(cop)}.`,[QL/W,W/(QL/60),1+cop])}
  if(w===1){const QL=pick([2,3,4,6]),W=pick([1,1.5,2]),QH=QL+W;return gbN(`A refrigerator extracts ${QL} kW from the cold space using ${W} kW of work input. Find the heat rejected to the surroundings (in kW).`,QH,"kW",`Energy balance: Q<sub>H</sub> = Q<sub>L</sub> + W = ${QL} + ${W} = ${QH} kW.`,[QL-W,QL*W,QH*2])}
  const QH=pick([6,9,12,15]),W=pick([2,3]),cop=QH/W;return gbN(`A heat pump delivers ${QH} kW of heat to a room while consuming ${W} kW of electrical power. Find its COP.`,cop,"",`COP<sub>HP</sub> = Q<sub>H</sub>/W = ${QH}/${W} = ${r2(cop)}.`,[cop-1,W/QH,QH-W])},
 // heat engine data
 ()=>{const Q1=pick([200,400,500,800,1000]),W=Q1*pick([0.2,0.25,0.3,0.4]),w=rnd(0,1);
  if(w===0)return gbN(`A heat engine receives ${Q1} kJ of heat and produces ${r2(W)} kJ of net work per cycle. Find its thermal efficiency (%).`,100*W/Q1,"%",`η = W/Q₁ = ${r2(W)}/${Q1} = ${r2(W/Q1)}, i.e. ${r2(100*W/Q1)}%.`,[100*(Q1-W)/Q1,100*W/(Q1-W),W/Q1]);
  return gbN(`A heat engine receives ${Q1} kJ from the source and does ${r2(W)} kJ of work per cycle. How much heat is rejected to the sink (in kJ)?`,Q1-W,"kJ",`First law for a cycle: Q₂ = Q₁ − W = ${Q1} − ${r2(W)} = ${r2(Q1-W)} kJ.`,[Q1+W,W,Q1*W/100])},
 // process work
 ()=>{const w=rnd(0,2);
  if(w===0){const p=pick([100,200,300,500]),V1=pick([0.1,0.2,0.5]),dV=pick([0.1,0.2,0.3]);return gbN(`A gas expands at a constant pressure of ${p} kPa from ${V1} m³ to ${r2(V1+dV)} m³. Find the work done by the gas (in kJ).`,p*dV,"kJ",`For an isobaric process W = p(V₂ − V₁) = ${p}×${dV} = ${r2(p*dV)} kJ.`,[p*(V1+dV),p*V1,p/dV])}
  if(w===1){const p1=pick([100,200,300,500]),V1=pick([0.1,0.2,0.5]),r=pick([2,3,4]),W=p1*V1*Math.log(r);return gbN(`A gas expands isothermally from ${V1} m³ at ${p1} kPa to ${r2(V1*r)} m³. Find the work done (in kJ, 2 decimals).`,W,"kJ",`Isothermal: W = p₁V₁ ln(V₂/V₁) = ${p1}×${V1}×ln ${r} = ${r2(p1*V1)}×${Math.log(r).toFixed(4)} = ${r2(W)} kJ.`,[p1*V1*r,p1*V1*(r-1),p1*V1*Math.log10(r)])}
  const d=pick([4,8,12,16,20]),g=1.4,W=d/(g-1);return gbN(`A gas (γ = 1.4) expands adiabatically in a cylinder. The product pV falls by ${d} kJ (p₁V₁ − p₂V₂ = ${d} kJ). Find the work done (in kJ).`,W,"kJ",`W = (p₁V₁ − p₂V₂)/(γ − 1) = ${d}/0.4 = ${r2(W)} kJ.`,[d,d*0.4,d/1.4])},
 // enthalpy, flow work
 ()=>{const w=rnd(0,1);
  if(w===0){const u=pick([2400,2500,2600]),p=pick([200,400,500,1000]),v=pick([0.1,0.2,0.25,0.4]),h=u+p*v;return gbN(`A fluid has specific internal energy ${u} kJ/kg, pressure ${p} kPa and specific volume ${v} m³/kg. Find its specific enthalpy (in kJ/kg).`,h,"kJ/kg",`h = u + pv = ${u} + ${p}×${v} = ${r2(h)} kJ/kg.`,[u-p*v,u,u*p*v])}
  const p=pick([100,200,500,1000]),v=pick([0.1,0.2,0.5]);return gbN(`Find the flow work per kg of a fluid at ${p} kPa and specific volume ${v} m³/kg (in kJ/kg).`,p*v,"kJ/kg",`Flow work = pv = ${p}×${v} = ${r2(p*v)} kJ/kg.`,[p/v,p+v,p*v*2])},
 // ideal gas
 ()=>{const w=rnd(0,1);
  if(w===0){const R=pick([0.2,0.25,0.5]),m=pick([1,2,4]),T=pick([300,400,500]),V=pick([1,2,4]),p=m*R*T/V;return gbN(`${m} kg of an ideal gas (R = ${R} kJ/kg·K) occupies ${V} m³ at ${T} K. Find its pressure (in kPa).`,p,"kPa",`pV = mRT, so p = mRT/V = ${m}×${R}×${T}/${V} = ${r2(p)} kPa.`,[p*V,p/T,m*R*T*V])}
  const [cp,cv]=pick([[1.0,0.7],[1.1,0.8],[0.92,0.66],[1.3,0.9],[0.85,0.55]]);return gbN(`An ideal gas has c<sub>p</sub> = ${cp} kJ/kg·K and c<sub>v</sub> = ${cv} kJ/kg·K. Find the gas constant R (in kJ/kg·K).`,cp-cv,"kJ/kg·K",`R = c<sub>p</sub> − c<sub>v</sub> = ${cp} − ${cv} = ${r2(cp-cv)} kJ/kg·K.`,[cp/cv,cp+cv,cv-cp+0.5])},
 // laws / statements
 ()=>gbFact([
  ["The zeroth law of thermodynamics states that…","if two bodies are each in thermal equilibrium with a third, they are in thermal equilibrium with each other",["energy is conserved in every process","heat flows from hot to cold spontaneously","entropy of an isolated system never decreases"],"It is the basis for the concept of temperature and for thermometers."],
  ["The Kelvin–Planck statement of the second law says that…","no cyclic heat engine can convert all the heat it receives into work",["heat cannot flow from a cold body to a hot body","work cannot be converted to heat","a heat engine can have 100% efficiency with a cold sink"],"Some heat must always be rejected to a low-temperature reservoir, so η &lt; 100%."],
  ["The Clausius statement of the second law says that…","heat cannot flow from a colder body to a hotter body without work being supplied",["heat cannot be converted to work","all reversible engines have equal efficiency","entropy is conserved"],"A refrigerator needs work input to move heat from cold to hot. The two statements are equivalent."],
  ["Among all heat engines working between the same two reservoirs, the highest efficiency is that of…","a reversible (Carnot) engine",["a Rankine engine","a Diesel engine","an engine with the highest heat input"],"The Carnot efficiency 1 − T<sub>L</sub>/T<sub>H</sub> depends only on the reservoir temperatures."],
  ["A Carnot cycle consists of…","two reversible isothermal and two reversible adiabatic processes",["two isochoric and two isobaric processes","two isothermal and two isochoric processes","two adiabatic and two isobaric processes"],"Isothermal heat addition, adiabatic expansion, isothermal heat rejection and adiabatic compression."],
  ["The first law of thermodynamics for a cycle states that…","the net heat transfer equals the net work done (∮dQ = ∮dW)",["the net heat is zero","the net work is zero","the heat added equals the internal energy"],"After a complete cycle, ΔU = 0 so Q<sub>net</sub> = W<sub>net</sub>."],
  ["For a steady-flow process the enthalpy h is defined as…","h = u + pv",["h = u − pv","h = pv − Ts","h = u + Ts"],"h combines internal energy and flow work; it appears in the SFEE."],
  ["Which of the following is a property of a system?","internal energy",["heat","work","path length"],"Heat and work are path functions (transient energy interactions), not properties."]])
],
5:[
 // Otto efficiency
 ()=>{const r=pick([5,6,7,8,9,10,11]),eta=100*(1-Math.pow(r,-0.4)),w=rnd(0,1);
  if(w===0)return gbN(`Find the air-standard efficiency (%) of an Otto cycle with compression ratio ${r} (γ = 1.4).`,eta,"%",`η = 1 − 1/r<sup>γ−1</sup> = 1 − 1/${r}<sup>0.4</sup> = 1 − ${(Math.pow(r,-0.4)).toFixed(4)} = ${(eta/100).toFixed(4)}, i.e. ${r2(eta)}%.`,[100*(1-1/r),100*Math.pow(r,-0.4),100*(1-Math.pow(r,-1.4))]);
  return gbN(`An Otto engine has a compression ratio of ${r} and γ = 1.4. If the heat supplied is 1000 kJ/kg, find the net work per kg (in kJ/kg).`,10*eta,"kJ/kg",`η = 1 − ${r}<sup>−0.4</sup> = ${(eta/100).toFixed(4)}. W = ηQ = ${(eta/100).toFixed(4)}×1000 = ${r2(10*eta)} kJ/kg.`,[1000-10*eta,1000*(1-1/r),1000*Math.pow(r,-0.4)+100])},
 // Diesel efficiency
 ()=>{const r=pick([14,16,18,20]),rho=pick([1.5,2,2.5]),g=1.4,eta=100*(1-(1/Math.pow(r,g-1))*(Math.pow(rho,g)-1)/(g*(rho-1))),ott=100*(1-Math.pow(r,-0.4));
  return gbN(`Find the air-standard efficiency (%) of a Diesel cycle with compression ratio ${r} and cut-off ratio ${rho} (γ = 1.4), using η = 1 − [1/r<sup>γ−1</sup>]·[(ρ<sup>γ</sup> − 1)/(γ(ρ − 1))].`,eta,"%",`1/r<sup>0.4</sup> = ${Math.pow(r,-0.4).toFixed(4)}; (ρ<sup>γ</sup> − 1)/(γ(ρ − 1)) = (${Math.pow(rho,g).toFixed(4)} − 1)/(1.4×${rho-1}) = ${((Math.pow(rho,g)-1)/(g*(rho-1))).toFixed(4)}. η = 1 − ${Math.pow(r,-0.4).toFixed(4)}×${((Math.pow(rho,g)-1)/(g*(rho-1))).toFixed(4)} = ${r2(eta)}%. (Lower than the Otto value ${r2(ott)}% for the same r.)`,[ott,100-eta,eta*0.8])},
 // cycle comparison and processes
 ()=>gbFact([
  ["For the same compression ratio and the same heat input, the air-standard efficiencies rank as…","Otto &gt; Dual &gt; Diesel",["Diesel &gt; Dual &gt; Otto","Dual &gt; Otto &gt; Diesel","all equal"],"At equal r the Otto cycle adds all heat at constant volume, which gives the highest efficiency; Diesel adds it at constant pressure."],
  ["For the same maximum pressure and the same heat input, the efficiencies rank as…","Diesel &gt; Dual &gt; Otto",["Otto &gt; Dual &gt; Diesel","Otto &gt; Diesel &gt; Dual","all equal"],"Under a maximum-pressure limit the Diesel cycle can use a larger compression ratio, so it becomes the most efficient."],
  ["The Otto cycle consists of…","two isentropic and two constant-volume processes",["two isentropic, one constant-pressure and one constant-volume process","two isothermal and two adiabatic processes","two isobaric and two isochoric processes"],"Isentropic compression, constant-volume heat addition, isentropic expansion and constant-volume heat rejection."],
  ["The Diesel cycle consists of…","two isentropic, one constant-pressure heat addition and one constant-volume heat rejection",["two isentropic and two constant-volume processes","two isothermal and two isentropic processes","two constant-pressure and two constant-volume processes"],"Heat is added at constant pressure (fuel injected and burns while the piston moves down)."],
  ["In the dual (Sabathe) cycle, heat is added…","partly at constant volume and partly at constant pressure",["only at constant volume","only at constant pressure","isothermally"],"Dual combustion approximates real high-speed diesel engines, in which part of the fuel burns rapidly and the rest burns at nearly constant pressure."],
  ["Increasing the compression ratio of an Otto engine…","raises its air-standard efficiency but is limited by knocking",["lowers its efficiency","has no effect on efficiency","increases efficiency without any limit"],"η = 1 − r<sup>1−γ</sup> rises with r; in real petrol engines r is limited to about 6–10 by detonation."],
  ["The efficiency of the Otto cycle depends only on…","the compression ratio (and γ)",["the heat input","the maximum temperature","the cut-off ratio"],"η = 1 − 1/r<sup>γ−1</sup>."]]),
 // indicated power
 ()=>{const pm=pick([400,500,600,800,1000]),Vs=pick([0.5,1,1.5,2]),N=pick([1200,1800,2400,3000,3600]),four=coin(.5),k=four?2:1,IP=pm*(Vs/1000)*N/(60*k);
  return gbN(`A ${four?"four":"two"}-stroke engine has a total swept volume of ${Vs} litres, a mean effective pressure of ${pm} kPa and runs at ${N} rpm. Find the indicated power (in kW).`,IP,"kW",`Power strokes per second = N/${60*k} = ${r2(N/(60*k))}. IP = p<sub>m</sub>V<sub>s</sub>×(N/${60*k}) = ${pm}×${Vs/1000}×${r2(N/(60*k))} = ${r2(IP)} kW.`,[IP*2,IP/2,pm*Vs*N/60])},
 // compression ratio & mep
 ()=>{const w=rnd(0,2);
  if(w===0){const r=pick([6,7,8,9,10,12]),Vc=pick([50,60,75,80,100]),Vs=(r-1)*Vc;return gbN(`An engine cylinder has a swept volume of ${Vs} cm³ and a clearance volume of ${Vc} cm³. Find the compression ratio.`,r,"",`r = (V<sub>s</sub> + V<sub>c</sub>)/V<sub>c</sub> = (${Vs} + ${Vc})/${Vc} = ${r}.`,[Vs/Vc,r+1,r-1])}
  if(w===1){const D=pick([6,8,10]),L=pick([8,10,12]),V=Math.PI*D*D*L/4;return gbN(`An engine cylinder has a bore of ${D} cm and a stroke of ${L} cm. Find its swept volume (in cm³, 2 decimals).`,V,"cm³",`V<sub>s</sub> = (π/4)D²L = (π/4)×${D}²×${L} = ${r2(V)} cm³.`,[Math.PI*D*L,Math.PI*D*D*L,V/2])}
  const W=pick([300,400,500,800]),Vs=pick([0.0005,0.001,0.002]),pm=W/Vs;return gbN(`An engine cycle produces a net work of ${W} J per cycle with a swept volume of ${Vs*1000} litres (${Vs} m³). Find the mean effective pressure (in kPa).`,pm/1000,"kPa",`p<sub>m</sub> = W<sub>net</sub>/V<sub>s</sub> = ${W}/${Vs} = ${r2(pm)} Pa = ${r2(pm/1000)} kPa.`,[pm,pm/1e6,W*Vs/1000])},
 // strokes / SI vs CI facts
 ()=>gbFact([
  ["In a four-stroke engine, how many crankshaft revolutions are needed for one complete cycle?","2",["1","4","3"],"Four strokes (suction, compression, power, exhaust) need two revolutions; a two-stroke engine completes its cycle in one."],
  ["In a four-stroke petrol engine the stroke that follows compression is…","power (expansion) stroke",["suction stroke","exhaust stroke","scavenging"],"Sequence: suction → compression → power → exhaust."],
  ["In a four-stroke engine the camshaft rotates at…","half the crankshaft speed",["the same speed as the crankshaft","twice the crankshaft speed","a quarter of the crankshaft speed"],"Each valve opens once per two crankshaft revolutions."],
  ["Which engine uses a spark plug to ignite the air–fuel mixture?","SI (petrol) engine",["CI (diesel) engine","dual fuel engine only","gas turbine only"],"CI engines rely on self-ignition of fuel injected into hot compressed air."],
  ["Typical compression ratios are approximately…","6–10 for SI engines and 14–22 for CI engines",["14–22 for SI engines and 6–10 for CI engines","2–3 for both","30–40 for both"],"CI needs a high r for the temperature at which the fuel self-ignites; SI is limited by knocking."],
  ["In a CI engine, the fuel is…","injected into the compressed air near the end of compression",["mixed with air in a carburettor before compression","ignited by a spark plug","supplied only in the exhaust stroke"],"Compression raises the air temperature high enough to ignite the injected diesel."],
  ["A two-stroke engine gives a power stroke…","once every revolution",["once every two revolutions","twice every revolution","once every four revolutions"],"Suction/compression and expansion/exhaust are combined in each revolution, with ports replacing valves."],
  ["Scavenging in a two-stroke engine means…","clearing the burnt gases from the cylinder with fresh charge",["cooling the piston with oil","compressing the fuel–air mixture","igniting the mixture"],"The incoming charge pushes out the exhaust gases through the exhaust port."]]),
 // brake thermal & mechanical efficiency
 ()=>{const w=rnd(0,1);
  if(w===0){let BP,mf,CV,eta,t=0;do{BP=pick([10,15,20,30,50]);mf=pick([3,5,6,8,10,12,15]);CV=pick([42000,44000,45000]);eta=100*BP*3600/(mf*CV);t++}while((eta<15||eta>42)&&t<500);return gbN(`An engine develops ${BP} kW of brake power while consuming ${mf} kg/h of fuel of calorific value ${CV} kJ/kg. Find the brake thermal efficiency (%).`,eta,"%",`Heat supplied = ${mf}×${CV}/3600 = ${r2(mf*CV/3600)} kW. η<sub>bth</sub> = BP/heat supplied = ${BP}/${r2(mf*CV/3600)} = ${r2(eta/100)}, i.e. ${r2(eta)}%.`,[eta*3600/1000,100*BP/(mf*CV),eta/2])}
  const IP=pick([10,20,25,40]),eta=pick([70,75,80,85,90]),BP=IP*eta/100;return gbN(`An engine has an indicated power of ${IP} kW and a brake power of ${r2(BP)} kW. Find its mechanical efficiency (%).`,eta,"%",`η<sub>mech</sub> = BP/IP = ${r2(BP)}/${IP} = ${r2(BP/IP)}, i.e. ${eta}%. Friction power = IP − BP = ${r2(IP-BP)} kW.`,[100*IP/BP,100-eta,eta/2])},
 // Otto cycle heat balance
 ()=>{const r=pick([6,8,9,10]),Q1=pick([500,800,1000,1500]),eta=1-Math.pow(r,-0.4),W=eta*Q1,w=rnd(0,1);
  return w===0?gbN(`An Otto cycle with compression ratio ${r} (γ = 1.4) receives ${Q1} kJ of heat per kg of air. Find the heat rejected (in kJ/kg).`,Q1-W,"kJ/kg",`η = 1 − ${r}<sup>−0.4</sup> = ${eta.toFixed(4)}. W = ${r2(W)} kJ/kg, so Q₂ = Q₁ − W = ${Q1} − ${r2(W)} = ${r2(Q1-W)} kJ/kg.`,[W,Q1*Math.pow(r,-0.4)+50,Q1/r]):gbN(`An Otto cycle with compression ratio ${r} (γ = 1.4) rejects heat of ${r2(Q1*Math.pow(r,-0.4))} kJ/kg, having received ${Q1} kJ/kg. Find the net work output (in kJ/kg).`,W,"kJ/kg",`Net work = Q₁ − Q₂ = ${Q1} − ${r2(Q1*Math.pow(r,-0.4))} = ${r2(W)} kJ/kg. (Check: η = 1 − ${r}<sup>−0.4</sup> = ${eta.toFixed(4)}.)`,[Q1*Math.pow(r,-0.4),Q1+W,W/2])}
]});
