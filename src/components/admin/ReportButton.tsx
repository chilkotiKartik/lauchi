"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** `ref` is the question id (e.g. "AHT-001:2:t4:s1234" or a PYQ id). `refId` is the same thing under a name React never treats specially. */
type Props = { where: "quiz" | "pyq" | "lesson"; ref?: string; refId?: string; course?: string; unit?: number; className?: string; label?: string };
type Status = { s: "idle" } | { s: "sending" } | { s: "sent" } | { s: "error"; message: string };

/** "Report a problem" link-button that opens a small dialog. Sends to POST /api/report; a teacher sees it in /admin/reports. */
export function ReportButton({ where, ref: refProp, refId, course, unit, className = "voice-btn", label = "Report a problem" }: Props) {
  // `ref` is a plain prop here (React 19), the compiler lint just mistakes the name for a React ref
  // eslint-disable-next-line react-hooks/refs
  const qref = String(refId ?? refProp ?? "unknown");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [st, setSt] = useState<Status>({ s: "idle" });
  const dlg = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const id = useId();
  const close = useCallback(() => { dlg.current?.close(); setOpen(false); }, []);
  useEffect(() => { if (open && dlg.current && !dlg.current.open) dlg.current.showModal(); }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) { setSt({ s: "error", message: "Tell us a little more about what's wrong." }); return; }
    setSt({ s: "sending" });
    try {
      const r = await fetch("/api/report", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ where, ref: qref.slice(0, 200), course, unit, text: text.trim().slice(0, 500) }),
      });
      if (r.ok) { setSt({ s: "sent" }); setText(""); return; }
      const j = (await r.json().catch(() => null)) as { message?: string } | null;
      setSt({ s: "error", message: j?.message ?? "We couldn't send that. Try again." });
    } catch { setSt({ s: "error", message: "You seem to be offline. Try again when you're connected." }); }
  }

  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => { setSt({ s: "idle" }); setOpen(true); }}>
        <span aria-hidden>⚑</span> {label}
      </button>
      {open && (
        <dialog ref={dlg} aria-labelledby={`${id}-h`} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dlg.current) close(); }}
          className="m-auto w-[min(460px,calc(100vw-24px))] rounded-[22px] border-2 border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm">
          <motion.div initial={reduce ? false : { y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1] }}
            className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id={`${id}-h`} className="text-xl">Report a problem</h2>
              <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl text-muted hover:bg-soft" onClick={close} aria-label="Close">×</button>
            </div>
            {st.s === "sent" ? (
              <>
                <p className="ok" role="status">Thanks — a teacher will check it.</p>
                <button type="button" className="btn w-fit" onClick={close} autoFocus>Done</button>
              </>
            ) : (
              <form onSubmit={send} className="flex flex-col gap-3" noValidate>
                <label htmlFor={`${id}-t`} className="font-extrabold text-head">What&apos;s wrong?</label>
                <textarea id={`${id}-t`} className="field min-h-28 !py-3" value={text} maxLength={500} rows={4} autoFocus
                  aria-describedby={`${id}-help`} aria-invalid={st.s === "error" ? true : undefined}
                  onChange={(e) => setText(e.target.value)} placeholder="e.g. The answer says 4 Ω but the working gives 6 Ω." />
                <p id={`${id}-help`} className="flex justify-between gap-2 text-xs text-muted">
                  <span>A typo, wrong answer or confusing wording. Don&apos;t include personal details.</span>
                  <span className="tabular-nums">{text.length}/500</span>
                </p>
                {st.s === "error" && <p className="err" role="alert">{st.message}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="btn" disabled={st.s === "sending"}>{st.s === "sending" ? "Sending…" : "Send report"}</button>
                  <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
                </div>
              </form>
            )}
          </motion.div>
        </dialog>
      )}
    </>
  );
}
