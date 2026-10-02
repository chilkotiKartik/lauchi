"use client";
import { Line } from "@react-three/drei";
import { GATES, GATE_EXPR, bit, byteString, gate, inputsOf, rowIndex, toBase, toBcd, truthTable, type Gate } from "../sim/elex";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEX_SPECS } from "../meta/elex.specs";

const NAME: Record<Gate, string> = { and: "AND", or: "OR", not: "NOT", nand: "NAND", nor: "NOR", xor: "XOR", xnor: "XNOR" };
const inverting = (g: Gate) => g === "not" || g === "nand" || g === "nor" || g === "xnor";

function Lamp({ on, pos, color, r = 0.28 }: { on: boolean; pos: [number, number, number]; color: string; r?: number }) {
  return <mesh position={pos}><sphereGeometry args={[r, 20, 20]} /><meshStandardMaterial color={on ? color : "#33454e"} emissive={on ? color : "#000000"} emissiveIntensity={on ? 0.7 : 0} /></mesh>;
}

function GateBody({ g }: { g: Gate }) {
  const c = g === "and" || g === "nand" ? "#a970ff" : g === "or" || g === "nor" ? "#2ba6f5" : g === "not" ? "#ff9a1f" : "#44c95a";
  if (g === "not") return <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.95, 1.5, 3]} /><meshStandardMaterial color={c} /></mesh>;
  if (g === "and" || g === "nand") return (<group>
    <mesh position={[-0.35, 0, 0]}><boxGeometry args={[1.0, 1.8, 0.6]} /><meshStandardMaterial color={c} /></mesh>
    <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.9, 0.9, 0.6, 24, 1, false, 0, Math.PI]} /><meshStandardMaterial color={c} /></mesh>
  </group>);
  return (<group>
    <mesh position={[0, 0, 0]} scale={[1.15, 1, 0.5]}><sphereGeometry args={[0.9, 24, 20]} /><meshStandardMaterial color={c} /></mesh>
    {(g === "xor" || g === "xnor") && <mesh position={[-1.05, 0, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.9, 0.05, 8, 24, Math.PI]} /><meshStandardMaterial color="#ffc83d" /></mesh>}
  </group>);
}

export default function LogicLab() {
  const [P, set, reset] = useLabParams(ELEX_SPECS.logic);
  const { n, gate: g, a, b } = P;
  const two = inputsOf(g) === 2;
  const y = gate(g, a, two ? b : false);
  const rows = truthTable(g), cur = rowIndex(g, a, two ? b : false);
  return (
    <LabFrame
      label="A logic gate built from 3D shapes with input switches on the left that light green when on, an output lamp that lights gold, a small truth table with the active row enlarged, and eight bit cubes that show the chosen number in binary"
      camera={[0, 0.4, 8.6]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        <Lamp on={a} pos={[-3.4, two ? 0.7 : 0, 0]} color="#44c95a" />
        {two && <Lamp on={b} pos={[-3.4, -0.7, 0]} color="#44c95a" />}
        <Line points={[[-3.1, two ? 0.7 : 0, 0], [-1.1, two ? 0.7 : 0, 0]]} color={a ? "#44c95a" : "#5b6d77"} lineWidth={3} />
        {two && <Line points={[[-3.1, -0.7, 0], [-1.1, -0.7, 0]]} color={b ? "#44c95a" : "#5b6d77"} lineWidth={3} />}
        <group position={[-0.1, 0, 0]}><GateBody g={g} /></group>
        {inverting(g) && <mesh position={[1.15, 0, 0]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#ff5a5f" /></mesh>}
        <Line points={[[inverting(g) ? 1.3 : 1.0, 0, 0], [2.3, 0, 0]]} color={y ? "#ffc83d" : "#5b6d77"} lineWidth={3} />
        <Lamp on={y} pos={[2.7, 0, 0]} color="#ffc83d" r={0.36} />
        <group position={[-0.8, 2.3, 0]}>
          {rows.map((r, i) => {
            const on = i === cur, s = on ? 1.35 : 1;
            return (<group key={i} position={[0, -i * 0.42 + (rows.length - 1) * 0.21 - 0.3, 0]}>
              <mesh position={[-0.6, 0, 0]} scale={s}><boxGeometry args={[0.28, 0.28, 0.28]} /><meshStandardMaterial color={r.a ? "#44c95a" : "#33454e"} /></mesh>
              {two && <mesh position={[0, 0, 0]} scale={s}><boxGeometry args={[0.28, 0.28, 0.28]} /><meshStandardMaterial color={r.b ? "#44c95a" : "#33454e"} /></mesh>}
              <mesh position={[0.8, 0, 0]} scale={s}><boxGeometry args={[0.28, 0.28, 0.28]} /><meshStandardMaterial color={r.y ? "#ffc83d" : "#33454e"} emissive={on ? (r.y ? "#ffc83d" : "#444444") : "#000000"} emissiveIntensity={0.5} /></mesh>
              {on && <mesh position={[0.1, 0, -0.2]}><boxGeometry args={[2.2, 0.36, 0.05]} /><meshBasicMaterial color="#ff5a5f" transparent opacity={0.5} /></mesh>}
            </group>);
          })}
        </group>
        <group position={[-2.1, -2.2, 0]}>
          {Array.from({ length: 8 }, (_, i) => {
            const on = bit(n, 7 - i), h = on ? 0.8 : 0.22;
            return <mesh key={i} position={[i * 0.6, h / 2, 0]}><boxGeometry args={[0.45, h, 0.45]} /><meshStandardMaterial color={on ? "#2ba6f5" : "#33454e"} emissive={on ? "#2ba6f5" : "#000000"} emissiveIntensity={0.3} /></mesh>;
          })}
        </group>
      </group>)}
      readouts={[
        ["Binary (8 bits)", byteString(n)], ["Octal", toBase(n, 8)], ["Hexadecimal", `0x${toBase(n, 16, 2)}`],
        ["BCD", toBcd(n)], [`${NAME[g]} gate`, GATE_EXPR[g]], ["Output Y", two ? `A=${Number(a)}, B=${Number(b)} → Y=${Number(y)}` : `A=${Number(a)} → Y=${Number(y)}`],
      ]}
      controls={<>
        <Slider label="Number (0–255)" value={n} min={0} max={255} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick<Gate> label="Gate" value={g} options={GATES.map((id) => ({ id, label: NAME[id] }))} onChange={(x) => set("gate", x)} />
        <Check label="Input A = 1" checked={a} onChange={(x) => set("a", x)} />
        {two && <Check label="Input B = 1" checked={b} onChange={(x) => set("b", x)} />}
      </>}
      note={<p>Switch inputs A and B on (green) or off (dark) and the gate output lamp turns gold when Y = 1; the small table at the top lists every input combination and the active row is enlarged. AND is 1 only when all inputs are 1, OR when at least one is 1, XOR when the inputs differ, and the red dot on NOT, NAND, NOR and XNOR marks the inversion. NAND and NOR are called universal gates because any other gate can be built from either one. At the bottom the eight blue cubes are the bits of the chosen number, most significant on the left; the readouts show it in binary, octal, hexadecimal and BCD (each decimal digit written on its own in 4 bits).</p>}
    />
  );
}
