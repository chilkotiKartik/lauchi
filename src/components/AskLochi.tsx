"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Lochi } from "@/components/Lochi";
import { ListenButton, MicButton } from "@/components/Voice";
import { ContextChips } from "@/components/tutor/ContextChips";
import { PracticeMcq } from "@/components/tutor/PracticeMcq";
import type { CtxParams, Mcq } from "@/lib/tutor";

type Msg = { role: "user" | "assistant"; content: string; mcq?: Mcq };
const IDEAS = ["Explain Fourier series in simple words", "What is the difference between a diode and a zener diode?", "How do I find eigenvalues of a 2x2 matrix?", "Explain pointers in C with an example"];

export function AskLochi({ initial = "", ctx = null, sources = [] }: { initial?: string; ctx?: CtxParams | null; sources?: string[] }) {
  const [ctxOn, setCtxOn] = useState(Boolean(ctx));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState(initial.slice(0, 2000));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, pending]);

  const chat = (list: Msg[]) => list.filter((m) => !m.mcq).slice(-10).map(({ role, content }) => ({ role, content }));

  function similar() {
    if (pending) return;
    setError("");
    start(async () => {
      try {
        const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "similar", messages: chat(msgs).slice(-4), ...(ctxOn && ctx ? { ctx } : {}) }) });
        const j = (await r.json().catch(() => ({}))) as { mcq?: Mcq; message?: string };
        if (r.ok && j.mcq) setMsgs([...msgs, { role: "assistant", content: j.mcq.question, mcq: j.mcq }]);
        else setError(j.message ?? "Lochi couldn't make a question just now. Try again.");
      } catch { setError("You seem to be offline. Check your connection and try again."); }
    });
  }

  function send(q: string) {
    const question = q.trim();
    if (!question || pending) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next); setText(""); setError("");
    start(async () => {
      try {
        const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: chat(next), ...(ctxOn && ctx ? { ctx } : {}) }) });
        const j = (await r.json().catch(() => ({}))) as { reply?: string; message?: string };
        if (r.ok && j.reply) setMsgs([...next, { role: "assistant", content: j.reply }]);
        else setError(j.message ?? "Lochi couldn't answer just now. Try again.");
      } catch { setError("You seem to be offline. Check your connection and try again."); }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {ctxOn && <ContextChips sources={sources} onClear={() => setCtxOn(false)} />}
      <div className="card flex min-h-64 flex-col gap-4" aria-live="polite" aria-label="Conversation">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="floaty"><Lochi mood="welcome" size={110} /></div>
            <p className="text-lg font-black text-head">Hi! What are you stuck on?</p>
            <div className="flex flex-wrap justify-center gap-2">{IDEAS.map((i) => <button key={i} type="button" className="pill !px-3 !py-2 text-left hover:!border-blue" onClick={() => send(i)}>{i}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} pop`}>
            <div className={`flex ${m.mcq ? "w-full" : "max-w-[85%]"} flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              {m.mcq ? <PracticeMcq mcq={m.mcq} /> : <p className={`whitespace-pre-wrap rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-l font-bold text-blue-t" : "bg-soft text-head"}`}>{m.content}</p>}
              {m.role === "assistant" && !m.mcq && <ListenButton text={m.content} label="Hear answer" />}
            </div>
          </div>
        ))}
        {pending && <div className="flex items-center gap-3" role="status"><Lochi mood="thinking" size={44} /><span className="dots" aria-label="Lochi is thinking"><i /><i /><i /></span></div>}
        {error && <p className="err" role="alert">{error}</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label htmlFor="ask-q" className="sr-only">Your question</label>
        <input id="ask-q" className="field min-w-0 flex-1" value={text} maxLength={2000} placeholder="Type or say your doubt…" autoComplete="off" onChange={(e) => setText(e.target.value)} />
        <MicButton label="Say" onText={(t) => setText((x) => (x ? x + " " : "") + t)} />
        <button className="btn" disabled={pending || !text.trim()}>{pending ? "…" : "Ask"}</button>
      </form>
      {(ctxOn || msgs.length > 0) && <div><button type="button" className="btn-ghost" disabled={pending} onClick={similar}>Give me a similar question</button></div>}
      <p className="text-xs text-muted">Lochi is an AI and can make mistakes. Check important facts in your textbook. Your questions are sent to Google&apos;s Gemini to get an answer and are not saved by lockin.</p>
    </div>
  );
}
