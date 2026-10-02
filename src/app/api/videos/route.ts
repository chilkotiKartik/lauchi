import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cleanQuery, searchVideos } from "@/lib/youtube";

const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

/** GET /api/videos?q=… → embeddable YouTube lectures for a topic (signed-in students only). */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return json(401, { code: "signed_out", message: "Sign in to watch videos." });
  const q = cleanQuery(new URL(req.url).searchParams.get("q") ?? "");
  if (q.length < 2) return json(400, { code: "invalid", message: "Search for a topic." });
  const r = await searchVideos(q, s.user.id, s.profile.language === "hi" ? "hi" : "en");
  if (!r.ok) return json(r.code === "not_configured" ? 503 : r.code === "limit" ? 429 : 502, { code: r.code, message: r.message, search: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` });
  return json(200, { videos: r.videos });
}
