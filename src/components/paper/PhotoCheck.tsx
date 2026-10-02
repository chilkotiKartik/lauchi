"use client";
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import type { CheckResult } from "@/lib/paper";

const MAX_SIDE = 1600, MAX_BYTES = 1_500_000, MAX_INPUT = 25 * 1024 * 1024;

/** Downscales a photo in the browser to a JPEG no bigger than 1600 px and 1.5 MB. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error("decode")); i.src = url; });
    let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    for (let attempt = 0; attempt < 6; attempt++) {
      const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      for (const q of [0.85, 0.75, 0.65, 0.55]) {
        const data = canvas.toDataURL("image/jpeg", q);
        if ((data.length - 23) * 0.75 <= MAX_BYTES) return data;
      }
      scale *= 0.8;
    }
    throw new Error("too big");
  } finally { URL.revokeObjectURL(url); }
}

/** "Check my handwritten answer": photo → AI examiner → a marks breakdown against this part's rubric. */
export function PhotoCheck({ course, id, part, on }: { course: string; id: string; part: string; on: boolean }) {
  const reduce = useReducedMotion();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  async function pick(file: File | undefined) {
    setError(""); setResult(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That isn't a photo. Pick a JPEG or PNG image.");
    if (file.size > MAX_INPUT) return setError("That photo is too large. Try one under 25 MB.");
    setBusy(true);
    try {
      const image = await shrink(file);
      setPreview(image);
      const res = await fetch("/api/check", {
        method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({ course, id, part, image }),
      });
      const body = await res.json().catch(() => null) as (CheckResult & { message?: string }) | null;
      if (!res.ok || !body || !Array.isArray(body.awarded)) setError(body?.message ?? "We couldn't check that photo. Try again.");
      else setResult(body);
    } catch (e) {
      setError(e instanceof Error && e.name === "TimeoutError" ? "Checking took too long. Try again." : "We couldn't read that photo. Try another one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (!on) {
    return <p className="text-sm text-muted">Photo checking isn&apos;t switched on yet. Mark yourself with the rubric above.</p>;
  }
  return (
    <div className="pp-check flex flex-col gap-3">
      {!open ? (
        <button type="button" className="btn btn-ghost self-start" onClick={() => setOpen(true)}>📷 Check my handwritten answer</button>
      ) : (
        <motion.div className="flex flex-col gap-3" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm">Take a clear photo of your answer for Q{part[0]}({part[1]}) in good light. Our AI examiner marks it against the rubric.
            <b> The photo is never stored</b>: it is sent once for checking and then thrown away.</p>
          <button type="button" className="btn btn-blue self-start" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Checking…" : "Take or upload a photo"}</button>
          <input id={inputId} ref={input} type="file" accept="image/*" capture="environment" className="hidden" tabIndex={-1} aria-label="Photo of your answer"
            onChange={(e) => void pick(e.target.files?.[0])} />
          <p className="sr-only" role="status" aria-live="polite">{busy ? "Checking your answer" : result ? `Checked: ${result.total} out of ${result.max}` : ""}</p>
        </motion.div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <AnimatePresence>
        {result && (
          <motion.section className="pp-examiner" aria-label="Examiner's marks" initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data: preview, never uploaded anywhere else */}
              {preview && <img src={preview} alt="Your answer" className="h-20 w-16 shrink-0 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="pp-eyebrow text-[color:var(--red-t)]">Examiner&apos;s marks</p>
                <p className="text-3xl font-black text-head tabular-nums">{result.total}<span className="text-lg text-muted"> / {result.max}</span></p>
                {!result.legible && <p className="text-sm font-bold text-[color:var(--red-t)]">The writing wasn&apos;t clear enough to mark. Retake the photo closer, flat and in good light.</p>}
              </div>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {result.awarded.map((a, i) => (
                <li key={i} className="pp-award">
                  <span className="pp-tick" aria-hidden>{a.marks >= a.max ? "✓" : a.marks > 0 ? "½" : "✗"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-head"><Rich text={a.point} /></p>
                    {a.comment && <p className="text-sm text-muted">{a.comment}</p>}
                  </div>
                  <b className="tabular-nums text-head">{a.marks}/{a.max}</b>
                </li>
              ))}
            </ul>
            {result.feedback.length > 0 && (
              <div className="mt-3">
                <p className="font-black text-head">To score more</p>
                <ul className="ml-5 list-disc text-sm">{result.feedback.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
            )}
            <p className="mt-2 text-xs text-muted">AI marking is a guide, not your university&apos;s result. Use it to see what an examiner looks for.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
