import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { dueCount } from "@/lib/revise";
import { indiaToday } from "@/lib/social";
import { sundaySummary } from "@/lib/sunday-server";
import { maxSundayXp } from "@/lib/sunday";
import { ArtQuest, ArtRevise, ArtFlame } from "@/components/art";

export const metadata: Metadata = { title: "Quests" };
export const dynamic = "force-dynamic";

type Card = { href: string; title: string; status: string; detail: string; cta: string; done: boolean; accent: string; Icon: typeof ArtQuest };

/** One place for the things that come back on a schedule: today's 5-question challenge, the weekly Sunday Quest and the
 * spaced-repetition queue. Each card says exactly where you stand and opens the real page. */
export default async function Quests() {
  const { supabase, user, profile } = await requireOnboarded();
  const [daily, sunday, due, stats] = await Promise.all([
    supabase.from("daily_challenges").select("score,completed_at").eq("day", indiaToday()).limit(1).then((r) => (r.data?.[0] ?? null) as { score: number | null; completed_at: string | null } | null),
    sundaySummary(user.id, profile),
    dueCount(supabase),
    supabase.rpc("dashboard_stats").then((r) => (r.data ?? { streak: 0 }) as { streak: number }),
  ]);
  const cards: Card[] = [
    {
      href: "/daily", title: "Daily challenge", Icon: ArtFlame, accent: "#ff9a1f", done: Boolean(daily?.completed_at),
      status: daily?.completed_at ? `Done today · ${daily.score ?? 0}/5` : "5 questions waiting",
      detail: "Picked from your weakest units. About 3 minutes; keeps your streak alive.", cta: daily?.completed_at ? "See answers" : "Start",
    },
    {
      href: "/sunday", title: "Sunday Quest", Icon: ArtQuest, accent: "#a970ff", done: sunday.done,
      status: sunday.open ? (sunday.done ? "Done this week" : "Open now") : `Opens ${sunday.daysLeft === 1 ? "tomorrow" : `in ${sunday.daysLeft} days`}`,
      detail: sunday.open ? `12 questions from your week, up to ${maxSundayXp()} XP.` : sunday.units ? `Built from ${sunday.units} unit${sunday.units === 1 ? "" : "s"} you practised this week. Prepare now.` : "Practise this week and Sunday is built from it.",
      cta: sunday.open && !sunday.done ? "Start" : sunday.open ? "See answers" : "Prepare",
    },
    {
      href: "/revise", title: "Revise today", Icon: ArtRevise, accent: "#2ba6f5", done: due === 0,
      status: due === 0 ? "All caught up" : `${due} due today`,
      detail: "Questions you missed come back after 1, 3, 7 and 21 days, just before you forget them.", cta: due === 0 ? "Open" : "Revise",
    },
  ];
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <span className="shrink-0"><ArtQuest size={44} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">Quests</h1>
          <p className="text-muted">Today&apos;s challenge, this week&apos;s quest and your revision.</p>
        </div>
        <span className="pill shrink-0" title="Day streak"><ArtFlame size={22} /><b>{stats.streak}</b><span className="hidden sm:inline">&nbsp;day streak</span></span>
      </header>
      <ul className="grid gap-3 md:grid-cols-3">
        {cards.map(({ href, title, status, detail, cta, done, accent, Icon }) => (
          <li key={href}>
            <Link href={href} className={`tile h-full !gap-2 ${done ? "opacity-90" : ""}`} style={{ "--accent": accent } as React.CSSProperties}>
              <span className="flex items-center gap-2"><Icon size={34} /><b className="text-lg">{title}</b>{done && <span className="chip chip-th ml-auto">✓</span>}</span>
              <span className="text-xl font-black text-head">{status}</span>
              <span className="text-sm text-muted">{detail}</span>
              <span className="btn mt-auto w-fit !min-h-10 !px-5 !text-sm" aria-hidden>{cta}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Want a weekly target too? <Link href="/goals">Set a weekly goal</Link>.</p>
    </div>
  );
}
