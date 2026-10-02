import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTutorContext } from "@/components/tutor/load";
import { systemWith } from "@/lib/tutor";

export type AiResult = { ok: true; text: string } | { ok: false; message: string };

/** A grounded first answer from the same Gemini tutor as Ask Lochi, with the same daily limit. Never fakes an answer. */
export async function aiFirstAnswer(o: { userId: string; course: string; unit: number | null; title: string; body: string }): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, message: "The AI helper isn't switched on for this site yet, so we can't write a first answer. A teacher will answer your doubt." };
  const limit = Math.max(1, Math.min(500, Number(process.env.AI_DAILY_LIMIT) || 30));
  try {
    const { data, error } = await createAdminClient().rpc("bump_ai_usage", { p_user: o.userId, p_limit: limit });
    if (error) return { ok: false, message: "We can't check your daily AI limit right now. Try again later." };
    if (data === false) return { ok: false, message: `You've used today's ${limit} AI questions. They reset at midnight (India time).` };
  } catch { return { ok: false, message: "The AI helper isn't configured on this server yet." }; }
  let system = systemWith("");
  try { system = systemWith((await loadTutorContext(o.userId, { course: o.course, ...(o.unit ? { unit: o.unit } : {}) })).text); } catch { /* answer without context */ }
  system += "\n\nYou are writing a first answer to a student's doubt that a teacher may review later. Be accurate and step by step. If the doubt is unclear or outside the syllabus context, say what you would need to know. Do not invent facts.";
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: `Doubt title: ${o.title}\n\n${o.body}` }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
      }),
    });
  } catch { return { ok: false, message: "The AI took too long to answer. Try again." }; }
  if (!res.ok) return { ok: false, message: "The AI couldn't answer just now. Try again in a moment." };
  const out = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null;
  const text = out?.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("").trim();
  if (!text) return { ok: false, message: "The AI didn't have an answer for that. Try rephrasing your doubt." };
  return { ok: true, text: text.slice(0, 5900) };
}
