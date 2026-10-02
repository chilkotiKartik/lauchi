"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup, updateGroup } from "@/app/(app)/friends/actions";
import { COLOR_VAR, GROUP_COLORS, GROUP_EMOJIS, GROUP_NAME_MAX, type GroupColor } from "@/lib/social";

type Emoji = (typeof GROUP_EMOJIS)[number];
type Edit = { group: string; name: string; emoji: string; color: string; goal: number };

const asEmoji = (e: string): Emoji => ((GROUP_EMOJIS as readonly string[]).includes(e) ? (e as Emoji) : GROUP_EMOJIS[0]);
const asColor = (c: string): GroupColor => ((GROUP_COLORS as readonly string[]).includes(c) ? (c as GroupColor) : "green");

/** Create a group, or (with `edit`) change its name, emoji, colour and weekly goal. */
export function GroupForm({ edit }: { edit?: Edit }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [emoji, setEmoji] = useState<Emoji>(asEmoji(edit?.emoji ?? "📚"));
  const [color, setColor] = useState<GroupColor>(asColor(edit?.color ?? "green"));
  const [goal, setGoal] = useState(String(edit?.goal ?? 500));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pre = edit ? "eg" : "ng";

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        if (edit) {
          const r = await updateGroup({ group: edit.group, name, emoji, color, goal: Number(goal) });
          setMsg({ ok: r.ok, text: r.message ?? "" });
        } else {
          const r = await createGroup({ name, emoji, color });
          if (r.ok && r.id) router.push(`/friends/groups/${r.id}`);
          else setMsg({ ok: false, text: r.message ?? "Try again." });
        }
      });
    }}>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${pre}-name`} className="font-extrabold text-head">Group name</label>
        <input id={`${pre}-name`} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={GROUP_NAME_MAX} required
          placeholder="Hostel 4 night owls" aria-describedby={`${pre}-count`} />
        <span id={`${pre}-count`} className="self-end text-xs text-muted">{name.trim().length}/{GROUP_NAME_MAX}</span>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-extrabold text-head">Emoji</legend>
        <div role="radiogroup" aria-label="Emoji" className="flex flex-wrap gap-1.5">
          {GROUP_EMOJIS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} aria-label={`Emoji ${e}`} onClick={() => setEmoji(e)}
              className={`grid h-11 w-11 place-items-center rounded-xl border-2 text-xl transition-transform ${emoji === e ? "scale-110 border-blue bg-blue-l" : "border-line bg-card"}`}>{e}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-extrabold text-head">Colour</legend>
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
          {GROUP_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} onClick={() => setColor(c)}
              className={`h-10 w-10 rounded-full border-4 transition-transform ${color === c ? "scale-110 border-head" : "border-card"}`}
              style={{ background: COLOR_VAR[c], boxShadow: "0 0 0 2px var(--line)" }} />
          ))}
        </div>
      </fieldset>
      {edit && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${pre}-goal`} className="font-extrabold text-head">Weekly group goal (XP)</label>
          <input id={`${pre}-goal`} className="field" type="number" inputMode="numeric" min={50} max={20000} step={10} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
      )}
      <button className="btn w-fit" disabled={pending || name.trim().length === 0}>{pending ? "Saving…" : edit ? "Save changes" : "Create group"}</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
