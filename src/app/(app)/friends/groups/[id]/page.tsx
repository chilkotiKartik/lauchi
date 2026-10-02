import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { colorVar, goalPercent, groupStreak, MAX_GROUP_MEMBERS, recentDays, todayOf, toDays, uuidSchema, dayComplete } from "@/lib/social";
import { Lochi } from "@/components/Lochi";
import { Avatar } from "@/components/social/Avatar";
import { Flame } from "@/components/social/Flame";
import { ActionButton } from "@/components/social/ActionButton";
import { CodeCard } from "@/components/social/CodeCard";
import { GroupForm } from "@/components/social/GroupForm";
import { Celebrate } from "@/components/social/Celebrate";
import { leaveGroup, newGroupCode, nudge, removeMember } from "../../actions";

export const metadata: Metadata = { title: "Study group" };

type Member = { id: string; display: string; today_xp: number; week_xp: number; studied_today: boolean; owner: boolean; me: boolean; joined_today: boolean; nudged: boolean };
type Detail = { id: string; name: string; emoji: string; color: string; code: string; goal_xp: number; owner: boolean | null; today: string; members: Member[]; days: unknown };

const weekday = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOnboarded();
  const { id } = await params;
  const valid = uuidSchema.safeParse(id);
  const { data, error } = valid.success ? await supabase.rpc("group_detail", { p_group: valid.data }) : { data: null, error: null };
  const g = data as Detail | null;
  if (error) return <p className="err" role="alert">We couldn&apos;t load this group. Refresh to try again.</p>;
  if (!g) {
    return (
      <div className="card flex flex-col items-center gap-3 py-8 text-center">
        <Lochi mood="thinking" size={96} label="Lochi thinking" />
        <h1 className="text-2xl">You&apos;re not in this group</h1>
        <p className="max-w-sm text-muted">Ask a member for the invite link, or start your own group.</p>
        <Link href="/friends" className="btn">Back to Friends &amp; Groups</Link>
      </div>
    );
  }

  const days = toDays(g.days);
  const today = g.today;
  const streak = groupStreak(days, today);
  const t = todayOf(days, today);
  const complete = dayComplete(t);
  const strip = recentDays(days, today, 7);
  const members = g.members.map((m) => ({ ...m, today_xp: Number(m.today_xp), week_xp: Number(m.week_xp) }));
  const studied = members.filter((m) => m.studied_today).length;
  const weekXp = members.reduce((a, m) => a + m.week_xp, 0);
  const pct = goalPercent(weekXp, g.goal_xp);
  const board = [...members].sort((a, b) => b.week_xp - a.week_xp);
  const accent = colorVar(g.color);

  return (
    <div className="flex flex-col gap-5">
      {complete && <Celebrate id={g.id} day={today} />}
      <nav aria-label="Breadcrumb" className="text-sm"><Link href="/friends">← Friends &amp; Groups</Link></nav>

      <header className="card hero-card flex flex-wrap items-center gap-4" style={{ ["--accent" as string]: accent, borderColor: `color-mix(in srgb, ${accent} 55%, var(--line))` }}>
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-4xl" style={{ background: `color-mix(in srgb, ${accent} 30%, var(--card))` }}>{g.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-3xl">{g.name}</h1>
          <p className="text-muted">{members.length} of {MAX_GROUP_MEMBERS} members{g.owner ? " · you run this group" : ""}</p>
        </div>
        <div className="flex flex-col items-center">
          <Flame count={streak} size={56} label={`Group streak: ${streak} ${streak === 1 ? "day" : "days"}`} />
          <span className="text-xs font-black uppercase tracking-wider text-muted">group streak</span>
        </div>
        <ol className="flex w-full justify-between gap-1" aria-label="Last 7 days">
          {strip.map((d) => (
            <li key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <span role="img" className={`grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-black ${d.complete ? "border-orange bg-orange text-white" : "border-line bg-card text-muted"}`}
                aria-label={`${weekday(d.day)}: ${d.complete ? "everyone studied" : d.day === today ? "in progress" : "missed"}`}>{d.complete ? "🔥" : d.day === today ? "…" : ""}</span>
              <span className="text-[11px] text-muted" aria-hidden>{weekday(d.day)}</span>
            </li>
          ))}
        </ol>
      </header>

      <section className="card flex flex-col gap-3" aria-labelledby="ck">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ck" className="text-xl">Today&apos;s checklist</h2>
          <span className={`chip ${complete ? "chip-th" : "chip-soft"}`} data-testid="checklist-count">{studied} of {members.length} studied today</span>
        </div>
        {complete ? (
          <div className="ok flex items-center gap-3" role="status"><Lochi mood="celebrate" size={48} label="Lochi celebrating" /><span>Everyone studied today! The group streak is {streak} {streak === 1 ? "day" : "days"}. 🔥</span></div>
        ) : (
          <p className="text-sm text-muted">The streak grows only when every member earns at least 1 XP today (India time). {members.length - studied === 1 ? "Just one to go!" : ""}</p>
        )}
        <div className="bar" role="progressbar" aria-label="Members who studied today" aria-valuemin={0} aria-valuemax={members.length} aria-valuenow={studied}><i style={{ width: `${members.length ? (studied / members.length) * 100 : 0}%`, background: complete ? "var(--orange)" : undefined }} /></div>
        <ul className="enter flex flex-col gap-2" aria-label="Who has studied today">
          {members.map((m) => (
            <li key={m.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-2.5 ${m.studied_today ? "border-green bg-green-l" : "border-line"}`} data-testid="check-row">
              <Avatar name={m.display} size={36} done={m.studied_today} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-black text-head">{m.display}{m.me && <span className="ml-2 text-xs uppercase text-blue-t">You</span>}</span>
                <span className={`block text-sm ${m.studied_today ? "font-extrabold text-green-t" : "text-muted"}`}>{m.studied_today ? `✓ Studied · ${m.today_xp} XP` : m.joined_today ? "Not yet · joined today" : "Not yet"}</span>
              </span>
              {!m.studied_today && !m.me && (m.nudged
                ? <span className="chip chip-soft">Nudged 🔔</span>
                : <ActionButton action={nudge.bind(null, { kind: "member", id: m.id, group: g.id })} label="Nudge 🔔" ariaLabel={`Nudge ${m.display}`} doneLabel="Nudged 🔔" className="btn btn-ghost !min-h-10 !px-3" />)}
              {!m.studied_today && m.me && <Link href="/practice" className="btn !min-h-10 !px-4">Study now</Link>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="wk">
        <h2 id="wk" className="text-xl">This week</h2>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-extrabold text-head">Group goal</span><span className="tabular-nums">{weekXp.toLocaleString("en-IN")} / {g.goal_xp.toLocaleString("en-IN")} XP</span></div>
          <div className="bar" role="progressbar" aria-label="Weekly group goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%`, background: pct >= 100 ? "var(--gold)" : accent }} /></div>
          {pct >= 100 && <p className="text-sm font-extrabold text-green-t">Goal smashed this week! 🏆</p>}
        </div>
        <ol className="flex flex-col gap-2" aria-label="This week's XP in the group">
          {board.map((m, i) => (
            <li key={m.id} className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 ${m.me ? "border-blue bg-blue-l" : "border-line"}`} aria-current={m.me ? "true" : undefined}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${i === 0 && m.week_xp > 0 ? "bg-gold text-[#5a3d00]" : "bg-soft text-head"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-black text-head">{m.display}{m.owner && <span className="ml-2 text-xs font-extrabold text-muted">owner</span>}</span>
              <span className="font-black tabular-nums text-head">{m.week_xp.toLocaleString("en-IN")} XP</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted">Monday to Sunday, India time. Members see first names and XP only.</p>
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="iv">
        <h2 id="iv" className="text-xl">Invite to the group</h2>
        {members.length >= MAX_GROUP_MEMBERS ? <p className="text-sm text-muted">This group is full ({MAX_GROUP_MEMBERS} members).</p> : (
          <CodeCard code={g.code} title="Group invite code" testId="group-code" shareText={`Join my study group "${g.name}" on lockin.`}
            hint="Anyone with this link can join after signing in. If it gets shared too widely, the owner can make a new code."
            regen={g.owner ? newGroupCode.bind(null, g.id) : undefined} />
        )}
      </section>

      {g.owner && (
        <details className="card">
          <summary className="cursor-pointer font-black text-head">Group settings</summary>
          <div className="mt-3 flex flex-col gap-5">
            <GroupForm edit={{ group: g.id, name: g.name, emoji: g.emoji, color: g.color, goal: g.goal_xp }} />
            {members.length > 1 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-black text-head">Members</h3>
                <ul className="flex flex-col gap-2">
                  {members.filter((m) => !m.me).map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3">
                      <Avatar name={m.display} size={32} />
                      <span className="min-w-0 flex-1 truncate font-extrabold text-head">{m.display}</span>
                      <ActionButton action={removeMember.bind(null, { group: g.id, member: m.id })} label="Remove" ariaLabel={`Remove ${m.display} from the group`} confirm={`Remove ${m.display}?`} className="btn btn-ghost !min-h-10 !px-3" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      <div>
        <ActionButton action={leaveGroup.bind(null, g.id)} label="Leave group" confirm={g.owner && members.length > 1 ? "Leave? The longest-standing member becomes the owner." : members.length === 1 ? "Leave? The group will be deleted." : "Leave this group?"}
          goTo="/friends" pendingLabel="Leaving…" className="btn btn-ghost !text-red-t" />
      </div>
    </div>
  );
}
