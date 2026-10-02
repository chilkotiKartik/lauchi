"use client";
import { useState, useTransition } from "react";
import { importQuestions, type ImportState } from "./actions";
import { CSV_HEADER } from "@/lib/cms-questions-core";

const EXAMPLE = `${CSV_HEADER.join(",")}\nAHT-001,1,mcq,"Which of these is a vector?",Mass|Speed|Velocity,C,,Velocity has a direction.,,1,vectors\nAHT-001,1,numeric,"Value of g in m/s2 (1 decimal)?",,9.8,0.1,,,2,`;

export function ImportForm() {
  const [text, setText] = useState("");
  const [publish, setPublish] = useState(false);
  const [res, setRes] = useState<ImportState | null>(null);
  const [pending, run] = useTransition();
  const go = (mode: "preview" | "import") => run(async () => { setRes(await importQuestions(text, mode, publish)); });
  return (
    <div className="flex flex-col gap-3">
      <div className="adm-label">
        <label htmlFor="csv-text">CSV text</label>
        <span className="hint">Columns: {CSV_HEADER.join(", ")}. Put several options, steps or tags in one cell with “|”. Answer is a letter (A–F), “A|C” for multiple, true/false, or the number. A header row is optional. Up to 200 rows.</span>
        <textarea id="csv-text" className="field font-mono text-sm" style={{ minHeight: 200 }} value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} placeholder={EXAMPLE} spellCheck={false} />
      </div>
      <label className="flex items-center gap-2 font-extrabold text-head"><input type="checkbox" className="h-5 w-5" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish them straight away</label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" disabled={pending || !text.trim()} onClick={() => go("preview")}>Check the CSV</button>
        <button type="button" className="btn" disabled={pending || !text.trim() || !res?.ok || res.imported} onClick={() => go("import")}>Import {res?.ok && !res.imported ? res.count : ""} questions</button>
      </div>
      <div aria-live="polite">
        {res && <p className={res.ok ? "ok" : "err"} role={res.ok ? "status" : "alert"}>{res.message}</p>}
        {res && res.errors.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1" aria-label="Rows to fix">
            {res.errors.map((e, i) => <li key={i} className="text-sm"><b>Line {e.line}:</b> {e.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
