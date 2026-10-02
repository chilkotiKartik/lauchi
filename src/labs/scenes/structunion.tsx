"use client";
import { useMemo } from "react";
import { CTYPE } from "../sim/cprog";
import { fileSim, FILE_INITIAL, FMODES, MEMBER_TYPES, structInfo, unionRead, unionWrite, type FMode, type MemberType } from "../sim/cstx";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CSTX_SPECS } from "../meta/cstx.specs";
import { Instances, type Inst } from "../kit";
import { Bench, C, cyc, Glass, Led, Slab } from "./cstx-kit";

const hx = (b: number) => b.toString(16).toUpperCase().padStart(2, "0");
const TYPE_OPTS = MEMBER_TYPES.map((id) => ({ id, label: `${id} (${CTYPE[id][0]} B)` }));
const MODE_RULE: Record<FMode, string> = {
  r: "read only; file must exist, else fopen returns NULL",
  w: "write only; creates the file or truncates it to 0 bytes",
  a: "append only; creates the file if missing, every write goes to the end",
  "r+": "read and write; file must exist; nothing is truncated",
  "w+": "read and write; creates or truncates to 0 bytes",
  "a+": "read and append; creates if missing; reads start at the beginning, writes always go to the end",
};
const fmtVal = (t: MemberType, v: number) => (t === "float" || t === "double" ? (Number.isInteger(v) ? v.toFixed(1) : Math.abs(v) < 1e-4 || Math.abs(v) >= 1e9 ? v.toExponential(4) : String(Number(v.toPrecision(7)))) : String(v));

export default function StructUnionLab() {
  const [P, set, reset] = useLabParams(CSTX_SPECS.structunion);
  const { view, n, wt, rt, val, fmode, ex, rd, wr } = P;
  const types = useMemo(() => ([P.m1, P.m2, P.m3, P.m4, P.m5] as MemberType[]).slice(0, Math.round(n)), [P.m1, P.m2, P.m3, P.m4, P.m5, n]);
  const info = structInfo(types);
  const W = wt as MemberType, R = rt as MemberType, v = Math.round(val);
  const bytes = unionWrite(W, v), readVal = unionRead(R, bytes);
  const f = fileSim(fmode as FMode, ex, Math.round(rd), Math.round(wr));

  const grid = useMemo(() => {
    const owner = new Int8Array(info.size).fill(-1), items: Inst[] = [];
    types.forEach((t, j) => { for (let b = 0; b < CTYPE[t][0]; b++) owner[info.offsets[j] + b] = j; });
    for (let t = 0; t < info.size; t++) {
      const pad = owner[t] < 0;
      items.push({ p: [-3.5 + (t % 8) * 0.9, pad ? 0.05 : 0.28, -1.4 + Math.floor(t / 8) * 0.9], s: [0.8, pad ? 0.1 : 0.5, 0.8], c: pad ? "#4a5a63" : cyc(owner[t]) });
    }
    return items;
  }, [info, types]);
  const ubytes = bytes.map((b, i): Inst => { const h = 0.12 + (b / 255) * 1.3; return { p: [-3.5 + i * 0.95, h / 2, 1.6], s: [0.8, h, 0.8], c: i < CTYPE[W][0] ? cyc(MEMBER_TYPES.indexOf(W)) : "#4a5a63" }; });
  const cells = Math.max(f.content.length, f.startContent.length, 5);
  const fileCells = useMemo(() => Array.from({ length: Math.min(13, cells) }, (_, i): Inst => {
    const ch = f.content[i], old = f.startContent[i];
    return { p: [-4.2 + i * 0.7, ch ? 0.3 : 0.06, 0.6], s: [0.6, ch ? 0.5 : 0.1, 0.9], c: ch ? (ch >= "A" && ch <= "H" && (old === undefined || old !== ch) ? C.green : C.blue) : "#3a4a54" };
  }), [f.content, f.startContent, cells]);
  const cone = (pos: number, c: string, y: number) => <mesh position={[-4.2 + pos * 0.7 - 0.35, y, 0.6]}><coneGeometry args={[0.14, 0.34, 12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} /></mesh>;

  return (
    <LabFrame
      label={view === "struct" ? "A steel bench with a grid of memory bytes for a C struct: each member a different colour, padding bytes low and grey" : view === "union" ? "Five glass lanes for the members of a union all start at the same byte; below them eight bars show the byte values stored in memory" : "A disk with a row of byte cells holding file contents, a glass buffer plate and coloured cones marking the file position indicator after open, read and write"}
      camera={[0, 6.2, 7.6]}
      animated={false}
      onReset={reset}
      scene={() => (<group position={[0, -0.4, 0]}>
        <Bench w={11} d={8} cz={0.3} />
        {view === "struct" && (<group>
          <Instances items={grid} cap={48} />
          <Glass p={[0.0, 0.4, -1.4 + (Math.ceil(info.size / 8) - 1) * 0.45]} s={[7.6, 0.8, Math.ceil(info.size / 8) * 0.9 + 0.2]} c={C.blue} on o={0.07} />
          <Led p={[4.6, 0.2, -1.4]} c={info.padding > 0 ? C.orange : C.green} />
        </group>)}
        {view === "union" && (<group>
          {MEMBER_TYPES.map((t, i) => (<group key={t}>
            <Slab p={[-3.5 + (CTYPE[t][0] * 0.95 - 0.15) / 2 - 0.4, 0.15 + i * 0.01, -2.4 + i * 0.55]} s={[CTYPE[t][0] * 0.95 - 0.15, 0.22, 0.4]} c={cyc(i)} glow={t === W || t === R ? 0.9 : 0.15} />
          </group>))}
          <Instances items={ubytes} cap={8} />
          <Glass p={[-3.5 + (CTYPE[R][0] * 0.95 - 0.15) / 2 - 0.4, 0.8, 1.6]} s={[CTYPE[R][0] * 0.95 + 0.1, 1.7, 1.2]} c={C.gold} on o={0.12} />
        </group>)}
        {view === "file" && (<group>
          <mesh position={[0, -0.04, 0.6]}><cylinderGeometry args={[4.9, 4.9, 0.1, 40]} /><meshStandardMaterial color="#1e2a31" metalness={0.5} roughness={0.4} /></mesh>
          <Instances items={fileCells} cap={13} />
          {cone(f.posOpen, C.blue, 1.0)}{cone(f.posRead, C.gold, 1.25)}{cone(f.posEnd, C.green, 1.5)}
          <Glass p={[0, 0.9, -2.0]} s={[4.2, 0.8, 1.4]} c={C.purple} on={f.readData.length > 0 || f.wrote.length > 0} o={0.1} />
          {Array.from({ length: f.readData.length + f.wrote.length }, (_, i) => <Slab key={i} p={[-1.6 + i * 0.45, 0.8, -2.0]} s={[0.35, 0.4, 0.5]} c={i < f.readData.length ? C.gold : C.green} glow={0.5} />)}
          <Led p={[4.6, 0.2, 2.8]} c={f.ok ? C.green : C.red} />
        </group>)}
      </group>)}
      readouts={view === "struct" ? [
        ["sizeof(struct)", `${info.size} bytes`],
        ["Data bytes", String(info.data)],
        ["Padding bytes", String(info.padding)],
        ["Member offsets", info.offsets.join(", ")],
        ["Alignment of struct", `${info.align} bytes`],
        ["sizeof(union of same)", `${info.unionSize} bytes`],
      ] : view === "union" ? [
        ["sizeof(union)", `${structInfo(MEMBER_TYPES).unionSize} bytes`],
        ["Written", `u.${W} = ${fmtVal(W, W === "float" || W === "double" ? v : unionRead(W, bytes))}`],
        ["Bytes in memory (low to high)", bytes.map(hx).join(" ")],
        ["Read back as", `u.${R}`],
        ["Value read", fmtVal(R, readVal)],
        ["Bytes shared", `${Math.min(CTYPE[W][0], CTYPE[R][0])} of ${CTYPE[R][0]}`],
      ] : [
        ["fopen result", f.ok ? `OK, mode "${fmode}"` : "NULL (failed)"],
        ["Mode rule", MODE_RULE[fmode as FMode]],
        ["File before / after", f.ok ? `"${f.startContent}" → "${f.content}"` : "(nothing opened)"],
        ["fread", f.ok ? (f.readErr ? f.readErr : `"${f.readData}"${f.eof ? " (hit EOF)" : ""}`) : "-"],
        ["fwrite", f.ok ? (f.writeErr ? f.writeErr : `"${f.wrote}"`) : "-"],
        ["Position: open → read → write", f.ok ? `${f.posOpen} → ${f.posRead} → ${f.posEnd}` : "-"],
      ]}
      controls={<>
        <Pick label="Bench" value={view} options={[{ id: "struct", label: "struct layout" }, { id: "union", label: "union overlay" }, { id: "file", label: "FILE stream" }]} onChange={(x) => set("view", x)} />
        {view === "struct" && <Slider label="Number of members" value={n} min={1} max={5} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
        {view === "struct" && (["m1", "m2", "m3", "m4", "m5"] as const).slice(0, Math.round(n)).map((key, j) => <Pick<MemberType> key={key} label={`Member ${j + 1} type`} value={P[key] as MemberType} options={TYPE_OPTS} onChange={(x) => set(key, x)} />)}
        {view === "union" && <Slider label="Value written" value={val} min={0} max={2147483647} step={1} digits={0} onChange={(x) => set("val", Math.round(x))} />}
        {view === "union" && <Pick<MemberType> label="Write through member" value={W} options={TYPE_OPTS} onChange={(x) => set("wt", x)} />}
        {view === "union" && <Pick<MemberType> label="Read through member" value={R} options={TYPE_OPTS} onChange={(x) => set("rt", x)} />}
        {view === "file" && <Pick<FMode> label="fopen mode" value={fmode as FMode} options={FMODES.map((id) => ({ id, label: `"${id}"` }))} onChange={(x) => set("fmode", x)} />}
        {view === "file" && <Check label={`File already exists (contains "${FILE_INITIAL}")`} checked={ex} onChange={(x) => set("ex", x)} />}
        {view === "file" && <Slider label="Bytes to fread" value={rd} min={0} max={8} step={1} digits={0} onChange={(x) => set("rd", Math.round(x))} />}
        {view === "file" && <Slider label="Bytes to fwrite" value={wr} min={0} max={8} step={1} digits={0} onChange={(x) => set("wr", Math.round(x))} />}
      </>}
      note={view === "struct" ? (
        <p>One cube per byte, eight to a row; each member has its own colour and the low grey cubes are <b>padding</b>. Every member starts at an offset that is a multiple of its own size (its alignment), and the whole struct is padded at the end to a multiple of the largest alignment, so arrays of the struct stay aligned. struct {"{"} char; int; char {"}"} is 12 bytes, but reordering it as int, char, char needs only 8. A union of the same members is as big as its largest member. Sizes follow a typical 64-bit GCC.</p>
      ) : view === "union" ? (
        <p>All five members of the union start at the same byte, so they <b>overlap</b>: the coloured lanes show how many bytes each one uses. Writing one member stores its bytes in little-endian order (lowest byte first, bar heights show the byte values); reading through another member just reinterprets the same bytes. Reading the char gives the first byte, reading a bigger type than you wrote picks up the leftover zero bytes, and reading a float or double from integer bytes gives a strange number. Reading a different member than the one written is allowed in C99 and later but the result depends on the machine.</p>
      ) : (
        <p>The file on the disk holds <b>{FILE_INITIAL}</b> when it exists. After fopen the position indicator is at byte 0 (blue cone); fread moves it forward (gold cone); fwrite overwrites at that position, except in append modes where every write goes to the end of the file (green cone). Green cubes are bytes written by this run. Modes r and r+ fail on a missing file; w and w+ create it or empty it; a and a+ create it and keep the old data. In real C, a + mode needs an fseek or fflush between a read and a write; this lab assumes you did one.</p>
      )}
    />
  );
}
