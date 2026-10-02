"use client";
import { formSize } from "../sim/weba";
import { Bars, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const fmt = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);

export default function FormSizeLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.formsize);
  const f = formSize(Math.round(P.fields), Math.round(P.keyLen), Math.round(P.valLen), P.special, P.fileKB);
  const v = [f.urlencoded, f.json, f.multipart], max = Math.max(...v, 1), min = Math.min(...v);
  const names = ["urlencoded", "JSON", "multipart"];
  return (
    <LabFrame
      label="Three columns showing the size in bytes of the same form sent as urlencoded in purple, JSON in gold and multipart in blue"
      camera={[0, 0.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, 0.2, -0.7]} w={6.4} h={3.8} />
          <Bars values={v} max={max} colors={[C.purple, C.gold, C.blue]} x0={-1.9} y0={-1.4} w={1}  gap={0.4} height={3.2} glow={0.3} />
        </group>
      )}
      readouts={[
        ["urlencoded", fmt(f.urlencoded)],
        ["JSON", fmt(f.json)],
        ["multipart/form-data", fmt(f.multipart)],
        ["Smallest", names[v.indexOf(min)]],
        ["Largest ÷ smallest", `${(max / Math.max(1, min)).toFixed(1)}×`],
      ]}
      controls={<>
        <Slider label="Number of fields" value={P.fields} min={1} max={20} step={1} digits={0} onChange={(x) => set("fields", Math.round(x))} />
        <Slider label="Field name length" value={P.keyLen} min={1} max={30} step={1} digits={0} unit=" chars" onChange={(x) => set("keyLen", Math.round(x))} />
        <Slider label="Value length" value={P.valLen} min={1} max={200} step={1} digits={0} unit=" chars" onChange={(x) => set("valLen", Math.round(x))} />
        <Slider label="Special characters in values" value={P.special} min={0} max={100} step={5} digits={0} unit=" %" onChange={(x) => set("special", x)} />
        <Slider label="File attached" value={P.fileKB} min={0} max={500} step={10} digits={0} unit=" KB" onChange={(x) => set("fileKB", x)} />
      </>}
      note={<p>The same fields can travel three ways. application/x-www-form-urlencoded writes key=value pairs joined by &amp;, and every special character becomes %XX (3 bytes). JSON wraps names and values in quotes and escapes a special character with one backslash. multipart/form-data, the encoding for file uploads, repeats a boundary line and headers for each field (assumed 40-byte boundary) but sends a file as raw bytes. For a 200 KB file, base64 in JSON adds a third and worst-case percent-encoding (assumed 3 bytes per byte) triples it, which is why uploads use multipart. Sizes are hand-counted estimates for ASCII text.</p>}
    />
  );
}
