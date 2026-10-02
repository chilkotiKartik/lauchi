"use client";
import { cellOf, kmap, mintermAt, GRAY } from "../sim/elexx";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Box } from "../kit";

const GROUP_COLS = [C.green, C.blue, C.orange, C.purple, C.red, C.gold, "#1fa88a", "#ff7ab6"];
const bits = (x: number) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };

export default function KmapLab() {
  const [P, set, reset] = useLabParams(ELEXX_SPECS.kmap);
  const { ones, dc, useDc, form } = P;
  const o = Math.round(ones) & 0xffff, d = Math.round(dc) & 0xffff;
  const k = kmap(o, d, useDc);
  const imps = form === "sop" ? k.sopImps : k.posImps;
  const cellX = (c: number) => -1.8 + c * 1.2, cellY = (r: number) => 1.8 - r * 1.2;
  // each implicant → the cells it covers (draw a translucent slab over each, so wrap-around groups show as pieces)
  const overlays = imps.flatMap((p, gi) => {
    const out: { r: number; c: number; gi: number }[] = [];
    for (let m = 0; m < 16; m++) if ((m & ~p.mask) === (p.val & ~p.mask)) { const { r, c } = cellOf(m); out.push({ r, c, gi }); }
    return out;
  });
  const toggle = (m: number) => {
    const isOne = (o >> m) & 1, isDc = useDc && ((d >> m) & 1);
    if (isOne) { set("ones", o & ~(1 << m)); if (useDc) set("dc", d | (1 << m)); }
    else if (isDc) set("dc", d & ~(1 << m));
    else set("ones", o | (1 << m));
  };
  const val = (m: number) => ((o >> m) & 1 ? "1" : useDc && (d >> m) & 1 ? "X" : "0");
  return (
    <LabFrame
      label="A 4 by 4 Karnaugh map in 3D: cells holding 1 are raised and lit, don't-cares are half height, and coloured translucent slabs mark each group of the minimal expression"
      camera={[0, 3.2, 7.2]}
      animated={false}
      onReset={reset}
      scene={() => (<group rotation={[-0.35, 0, 0]}>
        {Array.from({ length: 16 }, (_, m) => {
          const { r, c } = cellOf(m), v = val(m), h = v === "1" ? 0.6 : v === "X" ? 0.3 : 0.08;
          return <Box key={m} p={[cellX(c), cellY(r), h / 2]} s={[1.05, 1.05, h]} c={v === "1" ? C.white : v === "X" ? C.light : C.dark} glow={v === "1" ? 0.15 : 0} />;
        })}
        {overlays.map(({ r, c, gi }, i) => (
          <Box key={i} p={[cellX(c), cellY(r), 0.8 + (gi % 4) * 0.12]} s={[1.12 - (gi % 3) * 0.08, 1.12 - (gi % 3) * 0.08, 0.1]} c={GROUP_COLS[gi % GROUP_COLS.length]} o={0.55} />
        ))}
        <Box p={[-3.1, 0, 0]} s={[0.1, 4.8, 0.1]} c={C.grey} />
        <Box p={[0, 3.1, 0]} s={[4.8, 0.1, 0.1]} c={C.grey} />
      </group>)}
      readouts={[
        ["Minimal SOP", `F = ${k.sop}`],
        ["Minimal POS", `F = ${k.pos}`],
        ["Minterms Σm", k.ones.length ? k.ones.join(", ") : "none"],
        ["Don't-cares d", k.dcs.length ? k.dcs.join(", ") : "none"],
        ["SOP size", `${k.sopImps.length} terms, ${k.literals} literals`],
        ["Two-level NAND–NAND gates", String(k.nand)],
      ]}
      controls={<>
        <Slider label="Minterm pattern (16-bit number)" value={ones} min={0} max={65535} step={1} digits={0} onChange={(x) => set("ones", x)} />
        <div className="grid gap-1 md:col-span-2">
          <p className="text-sm font-extrabold text-head">Click a cell: 0 → 1 → {useDc ? "X → 0" : "0"} (rows AB, columns CD in Gray order)</p>
          <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-1 text-center text-sm font-black" role="grid" aria-label="Karnaugh map cells">
            <span />
            {GRAY.map((cd) => <span key={cd} className="text-muted">CD={cd.toString(2).padStart(2, "0")}</span>)}
            {GRAY.map((ab, r) => [
              <span key={`h${ab}`} className="self-center text-muted">AB={ab.toString(2).padStart(2, "0")}</span>,
              ...GRAY.map((_, c) => { const m = mintermAt(r, c), v = val(m); return (
                <button key={m} type="button" onClick={() => toggle(m)} aria-label={`m${m} is ${v}`}
                  className={`min-h-11 rounded-lg border-2 ${v === "1" ? "border-green bg-green-l text-green-t" : v === "X" ? "border-gold bg-gold-l text-head" : "border-line bg-soft text-muted"}`}>
                  {v}<sub className="ml-0.5 text-[10px] opacity-70">{m}</sub>
                </button>); }),
            ])}
          </div>
        </div>
        <Slider label="Don't-care pattern (16-bit number)" value={dc} min={0} max={65535} step={1} digits={0} onChange={(x) => set("dc", x)} />
        <Check label="Use don't-care conditions" checked={useDc} onChange={(x) => set("useDc", x)} />
        <Pick label="Show groups for" value={form} options={[{ id: "sop", label: "SOP (group the 1s)" }, { id: "pos", label: "POS (group the 0s)" }]} onChange={(x) => set("form", x)} />
      </>}
      note={<p>A K-map lays out the 16 minterms so that neighbouring cells (including wrap-around at the edges) differ in exactly one variable. Grouping 2<sup>n</sup> adjacent 1s (pairs, quads, octets) removes n variables, so the biggest groups give the simplest terms; every 1 must be covered, and don’t-cares (X) may be used if they help make bigger groups. Grouping the 0s instead gives the POS form. This lab finds a guaranteed-minimal cover with the Quine–McCluskey method. A two-level SOP becomes NAND–NAND logic directly: one NAND per multi-literal term plus one output NAND. Bit k of the pattern number is minterm m<sub>k</sub>; there are {bits(o)} ones now.</p>}
    />
  );
}
