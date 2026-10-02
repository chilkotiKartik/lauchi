"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { cleanCode, goalSchema, groupSchema, uuidSchema } from "@/lib/social";

export type Result = { ok: boolean; message?: string; id?: string; code?: string };

const EXPIRED: Result = { ok: false, message: "Your session expired. Log in again." };
const FAILED: Result = { ok: false, message: "We couldn't do that. Try again." };
const LIMITED: Result = { ok: false, message: "Too many wrong codes today. Try again tomorrow." };

function refresh(group?: string) {
  revalidatePath("/friends");
  if (group) revalidatePath(`/friends/groups/${group}`);
}

type Rpc = { status?: string; display?: string; id?: string };

// ------------------------------------------------------------------ friends
export async function addFriend(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const code = cleanCode(typeof raw === "string" ? raw : "");
  if (!code) return { ok: false, message: "That code doesn't look right. Codes have 8 letters and numbers." };
  const { data, error } = await s.supabase.rpc("send_friend_request", { p_code: code });
  if (error) return FAILED;
  const r = (data ?? {}) as Rpc;
  refresh();
  switch (r.status) {
    case "sent": return { ok: true, message: `Request sent to ${r.display}. You'll be friends once they accept.` };
    case "accepted": return { ok: true, message: `You and ${r.display} are now friends!` };
    case "already": return { ok: true, message: `You and ${r.display} are already friends.` };
    case "pending": return { ok: true, message: `You already asked ${r.display}. Waiting for them to accept.` };
    case "self": return { ok: false, message: "That's your own code. Share it with a friend instead." };
    case "limited": return LIMITED;
    case "full": return { ok: false, message: "You have reached the friend limit." };
    default: return { ok: false, message: "We couldn't find anyone with that code. Check it and try again." };
  }
}

export async function acceptFriend(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const id = uuidSchema.safeParse(raw);
  if (!id.success) return FAILED;
  const { data, error } = await s.supabase.rpc("accept_friend", { p_id: id.data });
  if (error || !data) return { ok: false, message: "That request is no longer there." };
  refresh();
  return { ok: true };
}

/** Decline, cancel or unfriend. */
export async function removeFriend(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const id = uuidSchema.safeParse(raw);
  if (!id.success) return FAILED;
  const { error } = await s.supabase.rpc("remove_friend", { p_id: id.data });
  if (error) return FAILED;
  refresh();
  return { ok: true };
}

export async function newFriendCode(): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const { data, error } = await s.supabase.rpc("regen_friend_code");
  if (error || typeof data !== "string") return FAILED;
  refresh();
  return { ok: true, code: data, message: "New code ready. Your old link no longer works." };
}

const nudgeSchema = z.object({ kind: z.enum(["friend", "member"]), id: uuidSchema, group: uuidSchema.optional() });

export async function nudge(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const v = nudgeSchema.safeParse(raw);
  if (!v.success) return FAILED;
  const { data, error } = await s.supabase.rpc("send_nudge", { p_kind: v.data.kind, p_id: v.data.id });
  if (error) return FAILED;
  const st = (data as Rpc | null)?.status;
  refresh(v.data.group);
  if (st === "sent") return { ok: true, message: "Nudge sent 🔔" };
  if (st === "already") return { ok: true, message: "Already nudged today" };
  return { ok: false, message: "You can only nudge friends and group mates." };
}

// ------------------------------------------------------------------ groups
export async function createGroup(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const v = groupSchema.safeParse(raw);
  if (!v.success) return { ok: false, message: v.error.issues[0].message };
  const { data, error } = await s.supabase.rpc("create_group", { p_name: v.data.name, p_emoji: v.data.emoji, p_color: v.data.color });
  if (error) return FAILED;
  const r = (data ?? {}) as Rpc;
  if (r.status === "too_many") return { ok: false, message: "You're in 20 groups already. Leave one to make another." };
  if (!r.id) return FAILED;
  refresh();
  return { ok: true, id: r.id };
}

export async function joinGroup(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const code = cleanCode(typeof raw === "string" ? raw : "");
  if (!code) return { ok: false, message: "That code doesn't look right. Codes have 8 letters and numbers." };
  const { data, error } = await s.supabase.rpc("join_group", { p_code: code });
  if (error) return FAILED;
  const r = (data ?? {}) as Rpc;
  switch (r.status) {
    case "joined": refresh(r.id); return { ok: true, id: r.id };
    case "member": return { ok: true, id: r.id, message: "You're already in this group." };
    case "full": return { ok: false, message: "This group is full (30 members)." };
    case "too_many": return { ok: false, message: "You're in 20 groups already. Leave one to join another." };
    case "limited": return LIMITED;
    default: return { ok: false, message: "We couldn't find a group with that code. Check it and try again." };
  }
}

/** Accepts either kind of code: a friend's code sends a request, a group code joins the group. */
export async function redeemCode(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const code = cleanCode(typeof raw === "string" ? raw : "");
  if (!code) return { ok: false, message: "That code doesn't look right. Codes have 8 letters and numbers." };
  const { data, error } = await s.supabase.rpc("peek_code", { p_code: code });
  if (error) return FAILED;
  const st = (data as Rpc | null)?.status;
  if (st === "group" || st === "member") return joinGroup(code);
  if (st === "limited") return LIMITED;
  return addFriend(code);
}

export async function leaveGroup(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const id = uuidSchema.safeParse(raw);
  if (!id.success) return FAILED;
  const { error } = await s.supabase.rpc("leave_group", { p_group: id.data });
  if (error) return FAILED;
  refresh(id.data);
  return { ok: true };
}

const memberSchema = z.object({ group: uuidSchema, member: uuidSchema });

export async function removeMember(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const v = memberSchema.safeParse(raw);
  if (!v.success) return FAILED;
  const { data, error } = await s.supabase.rpc("remove_group_member", { p_group: v.data.group, p_member: v.data.member });
  if (error || !data) return { ok: false, message: "Only the group owner can remove members." };
  refresh(v.data.group);
  return { ok: true };
}

const updateSchema = groupSchema.extend({ group: uuidSchema, goal: goalSchema });

export async function updateGroup(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const v = updateSchema.safeParse(raw);
  if (!v.success) return { ok: false, message: v.error.issues[0].message };
  const { data, error } = await s.supabase.rpc("update_group", {
    p_group: v.data.group, p_name: v.data.name, p_emoji: v.data.emoji, p_color: v.data.color, p_goal: v.data.goal,
  });
  if (error || !data) return { ok: false, message: "Only the group owner can change this." };
  refresh(v.data.group);
  return { ok: true, message: "Saved." };
}

export async function newGroupCode(raw: unknown): Promise<Result> {
  const s = await getSession();
  if (!s) return EXPIRED;
  const id = uuidSchema.safeParse(raw);
  if (!id.success) return FAILED;
  const { data, error } = await s.supabase.rpc("regen_group_code", { p_group: id.data });
  if (error || typeof data !== "string") return { ok: false, message: "Only the group owner can do this." };
  refresh(id.data);
  return { ok: true, code: data, message: "New code ready. The old link no longer works." };
}
