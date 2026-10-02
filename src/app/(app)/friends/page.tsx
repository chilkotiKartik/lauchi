import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { cleanCode, colorVar, groupStreak, indiaToday, nudgeLine, todayOf, toDays } from "@/lib/social";
import { Lochi } from "@/components/Lochi";
import { Avatar } from "@/components/social/Avatar";
import { Flame } from "@/components/social/Flame";
import { ActionButton } from "@/components/social/ActionButton";
import { CodeCard } from "@/components/social/CodeCard";
import { CodeForm } from "@/components/social/CodeForm";
import { GroupForm } from "@/components/social/GroupForm";
import { acceptFriend, addFriend, joinGroup, newFriendCode, nudge, removeFriend } from "./actions";

export const metadata: Metadata = { title: "Friends & Groups" };

type Friend = { id: string; display: string; today_xp: number; streak: number; studied_today: boolean; nudged: boolean };
type Req = { id: string; display: string };
type Overview = { code: string; friends: Friend[]; incoming: Req[]; outgoing: Req[]; nudges: { display: string }[] };
type GroupRow = { id: string; name: string; emoji: string; color: string; owner: boolean | null; members: number; days: unknown };
type Peek = { status: string; code?: string; display?: string; already?: string; id?: string; name?: string; emoji?: string; color?: string; members?: number };

export default async function Friends({ searchParams }: { searchParams: Promise<{ add?: string | string[] }> }) {
  const { supabase } = await requireOnboarded();
  const sp = await searchParams;
  const addRaw = Array.isArray(sp.add) ? sp.add[0] : sp.add;
  const addCode = addRaw ? cleanCode(addRaw) : null;

  const [{ data: ov, error }, { data: gs }, peekRes] = await Promise.all([
    supabase.rpc("friends_overview"),
    supabase.rpc("my_groups"),
    addCode ? supabase.rpc("peek_code", { p_code: addCode }) : Promise.resolve({ data: null }),
  ]);
  const o = ov as Overview | null;
  const groups = ((gs ?? []) as GroupRow[]).map((g) => ({ ...g, days: toDays(g.days), members: Number(g.members) }));
  const today = indiaToday();
  const peek = (addRaw ? (peekRes.data as Peek | null) ?? { status: "not_found" } : null);

  if (error || !o) return <p className="err" role="alert">We couldn&apos;t load your friends. Refresh to try again.</p>;
  const friends = o.friends.map((f) => ({ ...f, today_xp: Number(f.today_xp), streak: Number(f.streak) }));
  const nudgedBy = nudgeLine(o.nudges.map((n) => n.display));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Lochi mood="happy" size={64} label="Lochi, happy" />
        <div className="min-w-0"><h1 className="text-3xl">Friends &amp; Groups</h1><p className="text-muted">Study together. Friends only ever see your first name and today&apos;s XP.</p></div>
      </header>

      {nudgedBy && (
        <section className="card flex items-center gap-3 !border-gold" style={{ background: "var(--gold-l)" }} aria-label="Nudges">
          <span aria-hidden className="text-3xl">🔔</span>
          <div className="min-w-0 flex-1"><p className="font-black text-head">{nudgedBy} 🔔</p><p className="text-sm">They want you to study today. One quick quiz keeps everyone&apos;s streak alive.</p></div>
          <Link href="/practice" className="btn !min-h-11 !px-4">Study now</Link>
        </section>
      )}

      {peek && <AddCard peek={peek} />}

      <section className="card flex flex-col gap-4" aria-labelledby="inv">
        <h2 id="inv" className="text-xl">Invite a friend</h2>
        <CodeCard code={o.code} title="Your friend code" testId="friend-code" shareText="Be my study buddy on lockin. Tap to add me:"
          hint="Send this link to a classmate. When they open it (and sign in), they can send you a friend request. Make a new code any time; the old link stops working."
          regen={newFriendCode} />
        <hr className="border-line" />
        <CodeForm />
      </section>

      {o.incoming.length > 0 && (
        <section className="card flex flex-col gap-3" aria-labelledby="req">
          <h2 id="req" className="text-xl">Friend requests</h2>
          <ul className="flex flex-col gap-2">
            {o.incoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3">
                <Avatar name={r.display} />
                <span className="min-w-0 flex-1 font-extrabold text-head">{r.display} wants to be your friend</span>
                <ActionButton action={acceptFriend.bind(null, r.id)} label="Accept" ariaLabel={`Accept ${r.display}`} className="btn !min-h-10 !px-4" />
                <ActionButton action={removeFriend.bind(null, r.id)} label="Decline" ariaLabel={`Decline ${r.display}`} className="btn btn-ghost !min-h-10 !px-4" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="fr">
        <h2 id="fr" className="text-xl">Your friends</h2>
        {friends.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-6 text-center">
            <Lochi mood="welcome" size={88} label="Lochi waving" />
            <p className="font-black text-head">No friends here yet</p>
            <p className="max-w-sm text-sm text-muted">Studying is easier together. Share your link with a classmate and keep each other going.</p>
          </div>
        ) : (
          <ul className="enter flex flex-col gap-2" aria-label="Friends">
            {friends.map((f) => (
              <li key={f.id} className="card flex flex-wrap items-center gap-3 !p-3">
                <Avatar name={f.display} done={f.studied_today} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-head">{f.display}</p>
                  <p className="text-sm text-muted">{f.studied_today ? <span className="font-extrabold text-green-t">✓ Studied today</span> : "Not yet today"} · <span className="tabular-nums">{f.today_xp} XP</span></p>
                </div>
                <Flame count={f.streak} size={30} label={`${f.display}: ${f.streak} day streak`} />
                <div className="flex flex-wrap gap-2">
                  {!f.studied_today && (f.nudged
                    ? <span className="chip chip-soft">Nudged 🔔</span>
                    : <ActionButton action={nudge.bind(null, { kind: "friend", id: f.id })} label="Nudge 🔔" ariaLabel={`Nudge ${f.display}`} doneLabel="Nudged 🔔" className="btn btn-ghost !min-h-10 !px-3" />)}
                  <ActionButton action={removeFriend.bind(null, f.id)} label="Remove" ariaLabel={`Remove ${f.display}`} confirm={`Remove ${f.display}?`} className="btn btn-ghost !min-h-10 !px-3 !text-muted" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {o.outgoing.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted">Waiting for them to accept</h3>
            <ul className="flex flex-col gap-2">
              {o.outgoing.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-line p-2">
                  <Avatar name={r.display} size={32} />
                  <span className="min-w-0 flex-1 truncate font-extrabold text-head">{r.display}</span>
                  <ActionButton action={removeFriend.bind(null, r.id)} label="Cancel" ariaLabel={`Cancel request to ${r.display}`} className="btn btn-ghost !min-h-10 !px-3" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="gr">
        <h2 id="gr" className="text-xl">Study groups</h2>
        {groups.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-6 text-center">
            <Lochi mood="streak" size={88} label="Lochi with a streak flame" />
            <p className="font-black text-head">Start a group streak</p>
            <p className="max-w-sm text-sm text-muted">A day counts for the group only when everyone studies. Make a group with your hostel or branch mates and keep the flame alive.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Your groups">
            {groups.map((g) => {
              const t = todayOf(g.days, today);
              return (
                <li key={g.id}>
                  <Link href={`/friends/groups/${g.id}`} className="card flex items-center gap-3 !p-3 no-underline" style={{ borderColor: `color-mix(in srgb, ${colorVar(g.color)} 55%, var(--line))` }}>
                    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `color-mix(in srgb, ${colorVar(g.color)} 25%, var(--card))` }}>{g.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-head">{g.name}</span>
                      <span className="block text-sm text-muted">{g.members} {g.members === 1 ? "member" : "members"} · {t.done}/{t.needed} studied today</span>
                    </span>
                    <Flame count={groupStreak(g.days, today)} size={28} label={`Group streak ${groupStreak(g.days, today)} days`} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <details className="card">
          <summary className="cursor-pointer font-black text-head">Create a group</summary>
          <div className="mt-3"><GroupForm /></div>
        </details>
      </section>
    </div>
  );
}

function AddCard({ peek }: { peek: Peek }) {
  const box = "card hero-card flex flex-col gap-3";
  if (peek.status === "friend" && peek.code) {
    const who = peek.display ?? "this student";
    return (
      <section className={box} aria-labelledby="add-h">
        <div className="flex items-center gap-3"><Avatar name={who} size={48} /><h2 id="add-h" className="text-xl">Add {who} as a friend?</h2></div>
        {peek.already === "accepted" ? <p className="ok" role="status">You and {who} are already friends.</p>
          : peek.already === "sent" ? <p className="ok" role="status">Friend request sent to {who}. You&apos;ll be friends once they accept.</p>
          : peek.already === "incoming" ? <p className="ok" role="status">{who} already asked you. Accept their request below.</p>
          : (<>
            <p className="text-sm">They&apos;ll see your first name, today&apos;s XP and your streak. Nothing else.</p>
            <ActionButton action={addFriend.bind(null, peek.code)} label="Send friend request" pendingLabel="Sending…" className="btn w-fit" />
          </>)}
      </section>
    );
  }
  if ((peek.status === "group" || peek.status === "member") && peek.code && peek.id) {
    return (
      <section className={box} aria-labelledby="add-h" style={{ ["--accent" as string]: colorVar(peek.color) }}>
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-4xl">{peek.emoji}</span>
          <div className="min-w-0"><h2 id="add-h" className="text-xl">{peek.status === "member" ? peek.name : `Join ${peek.name}?`}</h2>
            <p className="text-sm text-muted">{Number(peek.members)} {Number(peek.members) === 1 ? "member" : "members"}</p></div>
        </div>
        {peek.status === "member" ? <Link href={`/friends/groups/${peek.id}`} className="btn w-fit">You&apos;re in this group. Open it</Link> : (<>
          <p className="text-sm">Members see each other&apos;s first names and XP. A day counts for the group streak only when everyone studies.</p>
          <ActionButton action={joinGroup.bind(null, peek.code)} label="Join group" pendingLabel="Joining…" goTo={`/friends/groups/${peek.id}`} className="btn w-fit" />
        </>)}
      </section>
    );
  }
  const text = peek.status === "self" ? "That's your own code. Send it to a friend instead."
    : peek.status === "limited" ? "Too many wrong codes today. Try again tomorrow."
    : "We couldn't find that invite. It may have been replaced with a new code. Ask your friend for the latest link.";
  return <p className={peek.status === "self" ? "ok" : "err"} role="status">{text}</p>;
}
