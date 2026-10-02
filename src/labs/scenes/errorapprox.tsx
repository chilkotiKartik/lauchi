"use client";
import { ERR_FUNCS, errorApprox, fmt, type ErrId } from "../sim/mathi";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Grid, Spin } from "./mathi-kit";

const EX = 6; // error caps are drawn this many times too big so they can be seen
const COLS = [C.blue, C.purple, C.orange];
function Shell({ pos, size, cyl, color, o, shell }: { pos: [number, number, number]; size: [number, number, number]; cyl?: boolean; color: string; o: number; shell?: boolean }) {
  return (
    <mesh position={pos}>
      {cyl ? <cylinderGeometry args={[size[0], size[0], size[1], 32]} /> : <boxGeometry args={size} />}
      <meshStandardMaterial color={color} transparent={o < 1} opacity={o} roughness={0.45} emissive={shell ? color : "#000000"} emissiveIntensity={shell ? 0.35 : 0} depthWrite={o >= 1} />
    </mesh>
  );
}

export default function ErrorApproxLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.errorapprox);
  const { fn, x, y, z, ex, ey, ez } = P;
  const E = ERR_FUNCS[fn], vals = [x, y, z].slice(0, E.vars), pct = [ex, ey, ez].slice(0, E.vars);
  const r = errorApprox(fn, vals, pct);
  const grow = (i: number) => 1 + (EX * pct[i]) / 100;
  let body;
  if (fn === "par") {
    const mx = Math.max(x, y, z, r.f), s = 3 / mx;
    const bars = [x, y, z, r.f];
    const pcts = [ex, ey, ez, r.percent];
    body = bars.map((v, i) => {
      const h = v * s, cap = h * ((EX * pcts[i]) / 100), px = -2.4 + i * 1.6 + (i === 3 ? 0.4 : 0);
      return (<group key={i}>
        <Shell pos={[px, h / 2, 0]} size={[0.9, h, 0.9]} color={i === 3 ? C.green : COLS[i]} o={1} />
        <Shell pos={[px, h + cap / 2, 0]} size={[0.92, Math.max(cap, 0.02), 0.92]} color={C.red} o={0.6} shell />
      </group>);
    });
  } else if (fn === "cyl") {
    const s = 3 / Math.max(2 * x, y), R = x * s, Hh = y * s;
    body = (<group>
      <Shell pos={[0, Hh / 2, 0]} size={[R, Hh, R]} cyl color={C.blue} o={1} />
      <Shell pos={[0, (Hh * grow(1)) / 2, 0]} size={[R * grow(0), Hh * grow(1), R]} cyl color={C.red} o={0.35} shell />
    </group>);
  } else if (fn === "box") {
    const s = 3 / Math.max(x, y, z), a = x * s, b = y * s, c = z * s;
    body = (<group>
      <Shell pos={[0, b / 2, 0]} size={[a, b, c]} color={C.blue} o={1} />
      <Shell pos={[0, (b * grow(1)) / 2, 0]} size={[a * grow(0), b * grow(1), c * grow(2)]} color={C.red} o={0.35} shell />
    </group>);
  } else {
    const s = 3.6 / Math.max(x, y), a = x * s, b = y * s;
    body = (<group>
      <Shell pos={[0, 0.15, 0]} size={[a, 0.3, b]} color={C.blue} o={1} />
      <Shell pos={[0, 0.15, 0]} size={[a * grow(0), 0.34, b * grow(1)]} color={C.red} o={0.35} shell />
    </group>);
  }
  return (
    <LabFrame
      label="A solid or set of resistor bars drawn to scale with a translucent red shell showing the worst-case error"
      camera={[3.2, 3.4, 6.2]}
      onReset={reset}
      scene={() => (<group>
        <Grid size={8} y={0} />
        <Spin speed={0.2}><group>{body}</group></Spin>
      </group>)}
      readouts={[
        ["Computed value f", fmt(r.f, 4)],
        ["Error δf (linear estimate)", fmt(r.df, 4)],
        ["Exact worst case Δf", fmt(r.exact, 4)],
        ["Relative error δf / f", fmt(r.rel, 5)],
        ["Percentage error", `${fmt(r.percent, 3)} %`],
        ["Largest contributor", r.top],
      ]}
      controls={<>
        <Slider label={`Value of ${E.names[0]}`} value={x} min={0.5} max={100} step={0.5} digits={1} onChange={(v) => set("x", v)} />
        <Pick label="Quantity" value={fn} options={(Object.keys(ERR_FUNCS) as ErrId[]).map((k) => ({ id: k, label: ERR_FUNCS[k].label }))} onChange={(v) => set("fn", v)} />
        <Slider label={`Value of ${E.names[1]}`} value={y} min={0.5} max={100} step={0.5} digits={1} onChange={(v) => set("y", v)} />
        {E.vars > 2 && <Slider label={`Value of ${E.names[2]}`} value={z} min={0.5} max={100} step={0.5} digits={1} onChange={(v) => set("z", v)} />}
        <Slider label={`Error in ${E.names[0]} (%)`} value={ex} min={0} max={10} step={0.1} digits={1} onChange={(v) => set("ex", v)} />
        <Slider label={`Error in ${E.names[1]} (%)`} value={ey} min={0} max={10} step={0.1} digits={1} onChange={(v) => set("ey", v)} />
        {E.vars > 2 && <Slider label={`Error in ${E.names[2]} (%)`} value={ez} min={0} max={10} step={0.1} digits={1} onChange={(v) => set("ez", v)} />}
      </>}
      note={<>
        <p><b>Approximation of error.</b> If f(x, y, z) is computed from measured values with errors δx, δy, δz then δf ≈ f<sub>x</sub>δx + f<sub>y</sub>δy + f<sub>z</sub>δz (take absolute values for the worst case), and the percentage error is 100 δf / f. For products and powers the percentage errors simply add: V = πr²h has error 2(δr/r) + (δh/h). Blue is the nominal object; the red shell is the largest it could be. The shell is drawn {EX} times oversized so small errors are visible.</p>
        <p className="mt-2"><b>Try.</b> PYQ: three resistors r₁ = 20 Ω, r₂ = 30 Ω, r₃ = 60 Ω in parallel give r = 10 Ω. With each resistor 1.2 % off, r is also exactly 1.2 % off (the green bar). Make only one error large: the Largest contributor readout names which resistor matters most. Compare the linear estimate with the exact worst case.</p>
      </>}
    />
  );
}
