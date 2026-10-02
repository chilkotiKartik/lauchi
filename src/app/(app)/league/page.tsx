import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { LeagueToggle } from "@/components/LeagueToggle";
import { ArtLeague } from "@/components/art";

export const metadata: Metadata = { title: "League" };

type Row = { rank: number; display: string; xp: number; me: boolean };

export default async function League() {
  const { supabase, user } = await requireOnboarded();
  const [{ data: rows, error }, { data: me }] = await Promise.all([
    supabase.rpc("league_board", { p_limit: 20 }),
    supabase.from("profiles").select("league_opt_in").eq("id", user.id).single<{ league_opt_in: boolean }>(),
  ]);
  const board = ((rows ?? []) as Row[]).map((r) => ({ ...r, rank: Number(r.rank), xp: Number(r.xp) }));
  const joined = me?.league_opt_in ?? false;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtLeague size={56} /><div><h1 className="text-3xl">Weekly league</h1><p className="text-muted">Real XP from this week (Monday to Sunday). It resets every week.</p></div></header>
      <section className="card flex flex-col gap-3" aria-labelledby="jn">
        <h2 id="jn" className="text-xl">{joined ? "You are on the board" : "Put your XP on the board"}</h2>
        <p className="text-[0.95rem]">The league is optional and off by default. If you join, other joined students see only your <b>first name</b> and this week&apos;s XP. Nothing else. You can leave at any time and you disappear straight away.</p>
        <LeagueToggle joined={joined} />
      </section>
      {error ? (
        <p className="err" role="alert">We couldn&apos;t load the board. Refresh to try again.</p>
      ) : board.length === 0 ? (
        <p className="card text-muted">Nobody has earned XP this week yet. {joined ? "Do a quiz and you will be first." : "Join, do a quiz, and you will be first."}</p>
      ) : (
        <ol className="enter flex flex-col gap-2" aria-label="This week">
          {board.map((r) => (
            <li key={`${r.rank}-${r.display}-${r.me}`} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${r.me ? "border-blue bg-blue-l" : "border-line bg-card"}`} aria-current={r.me ? "true" : undefined}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-black ${r.rank === 1 ? "bg-gold text-[#5a3d00]" : r.rank <= 3 ? "bg-purple-l text-purple-t" : "bg-soft text-head"}`}>{r.rank}</span>
              <span className="flex-1 truncate font-black text-head">{r.display}{r.me && <span className="ml-2 text-xs uppercase text-blue-t">You</span>}</span>
              <span className="font-black tabular-nums text-head">{Number(r.xp).toLocaleString("en-IN")} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
