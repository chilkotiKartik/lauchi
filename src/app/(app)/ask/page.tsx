import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { AskLochi } from "@/components/AskLochi";
import { ArtAsk } from "@/components/art";
import { ContextChips } from "@/components/tutor/ContextChips";
import { loadTutorContext } from "@/components/tutor/load";
import { parseCtx } from "@/lib/tutor";

export const metadata: Metadata = { title: "Ask Lochi" };

export default async function Ask({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireOnboarded();
  const sp = await searchParams;
  const q = String(Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").slice(0, 2000);
  const ctx = parseCtx(sp);
  const { sources } = await loadTutorContext(user.id, ctx);
  const on = Boolean(process.env.GEMINI_API_KEY);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtAsk size={56} /><div><h1 className="text-3xl">Ask Lochi</h1><p className="text-muted">Stuck on a concept or a step? Ask in your own words.</p></div></header>
      {on ? <AskLochi initial={q} ctx={sources.length ? ctx : null} sources={sources} /> : (<>
        <ContextChips sources={sources} />
        <p className="card" role="status">Ask Lochi isn&apos;t switched on for this site yet. The site owner needs to add a <code>GEMINI_API_KEY</code> (free from Google AI Studio) to the server settings. Everything else in lockin. works without it.</p>
      </>)}
    </div>
  );
}
