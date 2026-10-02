import "server-only";
import { decodeEntities } from "@/lib/rich";

export type Video = { id: string; title: string; channel: string; published: string };

const ID = /^[A-Za-z0-9_-]{11}$/;
/** Search results are the same for every student, so they are cached here for a day (YouTube search costs 100 of the 10,000 daily quota units). */
const cache = new Map<string, { at: number; videos: Video[] }>();
const DAY = 24 * 3600 * 1000;
/** Per-student limit of fresh (uncached) searches, to protect the shared quota. */
const perUser = new Map<string, { day: string; n: number }>();
export const USER_DAILY_SEARCHES = 40;

export const youtubeConfigured = () => Boolean(process.env.YOUTUBE_API_KEY);
export const cleanQuery = (q: string) => q.replace(/<[^>]*>/g, " ").replace(/[^\p{L}\p{N}\s'’.,:&+()/-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 120);

/** Parses a YouTube Data API v3 search response into safe, plain records (ids validated, titles decoded, no HTML). */
export function parseSearch(json: unknown): Video[] {
  const items = (json as { items?: unknown[] } | null)?.items;
  if (!Array.isArray(items)) return [];
  const out: Video[] = [];
  for (const it of items) {
    const o = it as { id?: { videoId?: unknown }; snippet?: { title?: unknown; channelTitle?: unknown; publishedAt?: unknown; liveBroadcastContent?: unknown } };
    const id = o.id?.videoId;
    if (typeof id !== "string" || !ID.test(id)) continue;
    if (o.snippet?.liveBroadcastContent && o.snippet.liveBroadcastContent !== "none") continue;
    out.push({
      id,
      title: decodeEntities(String(o.snippet?.title ?? "")).slice(0, 140),
      channel: decodeEntities(String(o.snippet?.channelTitle ?? "")).slice(0, 80),
      published: typeof o.snippet?.publishedAt === "string" ? o.snippet.publishedAt.slice(0, 10) : "",
    });
  }
  return out;
}

export type SearchResult = { ok: true; videos: Video[]; cached: boolean } | { ok: false; code: "not_configured" | "limit" | "upstream"; message: string };

export async function searchVideos(query: string, userId: string, lang: "en" | "hi" = "en"): Promise<SearchResult> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, code: "not_configured", message: "In-app videos aren't switched on for this site yet." };
  const q = cleanQuery(query);
  const ck = `${lang}:${q.toLowerCase()}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < DAY) return { ok: true, videos: hit.videos, cached: true };

  const today = new Date().toISOString().slice(0, 10);
  const u = perUser.get(userId);
  const used = u && u.day === today ? u.n : 0;
  if (used >= USER_DAILY_SEARCHES) return { ok: false, code: "limit", message: "You've searched a lot of new videos today. Saved searches still work; new ones reset tomorrow." };
  perUser.set(userId, { day: today, n: used + 1 });

  const base = process.env.YOUTUBE_API_BASE || "https://www.googleapis.com";
  const params = new URLSearchParams({
    part: "snippet", type: "video", maxResults: "8", q, videoEmbeddable: "true", safeSearch: "strict",
    relevanceLanguage: lang, regionCode: "IN", key,
  });
  try {
    const r = await fetch(`${base}/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!r.ok) return { ok: false, code: "upstream", message: r.status === 403 ? "Today's video search quota is used up. Try again tomorrow." : "YouTube didn't answer just now. Try again." };
    const videos = parseSearch(await r.json());
    if (cache.size > 2000) cache.clear();
    cache.set(ck, { at: Date.now(), videos });
    return { ok: true, videos, cached: false };
  } catch {
    return { ok: false, code: "upstream", message: "YouTube didn't answer just now. Try again." };
  }
}
