import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SIMILAR_PROMPT, parseCtx, parseMcq, systemWith } from "@/lib/tutor";
import { loadTutorContext } from "@/components/tutor/load";

export const maxDuration = 30;

const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(12),
  mode: z.enum(["chat", "similar"]).default("chat"),
  ctx: z.unknown().optional(),
});
const json = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status });

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(503, "not_configured", "Ask Lochi isn't switched on for this site yet.");
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return json(401, "signed_out", "Sign in to ask Lochi.");
  const raw = await req.json().catch(() => null);
  // a "similar question" request may have no chat yet
  const p = body.safeParse(raw && typeof raw === "object" && (raw as { mode?: unknown }).mode === "similar" && !(raw as { messages?: unknown[] }).messages?.length
    ? { ...raw, messages: [{ role: "user", content: "Give me a practice question." }] } : raw);
  if (!p.success) return json(400, "invalid", "That question couldn't be read.");
  const msgs = p.data.mode === "similar" ? [...p.data.messages, { role: "user" as const, content: "Now write the practice question as instructed." }] : p.data.messages;
  const turns = msgs.reduce<typeof p.data.messages>((a, m) => { const l = a[a.length - 1]; if (l && l.role === m.role) l.content += "\n\n" + m.content; else a.push({ ...m }); return a; }, []);
  if (turns[0].role !== "user" || turns[turns.length - 1].role !== "user") return json(400, "invalid", "That question couldn't be read.");

  const limit = Math.max(1, Math.min(500, Number(process.env.AI_DAILY_LIMIT) || 30));
  try {
    const { data, error } = await createAdminClient().rpc("bump_ai_usage", { p_user: s.user.id, p_limit: limit });
    if (error) return json(503, "unavailable", "Ask Lochi can't check your daily limit right now. Try again later.");
    if (data === false) return json(429, "limit", `You've used today's ${limit} questions. They reset at midnight (India time).`);
  } catch { return json(503, "unavailable", "Ask Lochi isn't configured on this server yet."); }

  const similar = p.data.mode === "similar";
  let system = systemWith("");
  try {
    const rawCtx = p.data.ctx ?? (raw && typeof raw === "object" ? raw : null);
    system = systemWith((await loadTutorContext(s.user.id, parseCtx(rawCtx))).text);
  } catch { /* answer without context */ }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: similar ? system + "\n\n" + SIMILAR_PROMPT : system }] },
        contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
        generationConfig: similar ? { maxOutputTokens: 1200, temperature: 0.9, responseMimeType: "application/json" } : { maxOutputTokens: 1200, temperature: 0.4 },
      }),
    });
  } catch { return json(504, "timeout", "Lochi took too long to answer. Try again."); }
  if (!res.ok) return json(502, "upstream", res.status === 404 ? "The AI model name isn't valid. The site owner should check GEMINI_MODEL." : "Lochi couldn't answer just now. Try again in a moment.");
  const out = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null;
  const text = out?.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("").trim();
  if (!text) return json(502, "empty", "Lochi didn't have an answer for that. Try rephrasing.");
  if (similar) {
    const mcq = parseMcq(text);
    return mcq ? NextResponse.json({ mcq }) : json(502, "empty", "Lochi couldn't make a good question this time. Try again.");
  }
  return NextResponse.json({ reply: text });
}
