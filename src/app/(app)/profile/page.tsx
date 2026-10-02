import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { LogoutButton } from "@/components/pwa/LogoutButton";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function Profile() {
  const { profile } = await requireOnboarded();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl">Profile</h1>
      <p className="text-muted">Signed in as <b className="text-head">{profile.email}</b></p>
      <ProfileForm name={profile.name} branch={profile.branch ?? "CSE"} semester={profile.semester ?? 1} goal={profile.daily_goal_xp} />
      <LogoutButton action={signOut} />
    </div>
  );
}
