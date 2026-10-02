import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default async function Welcome() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.profile.onboarded_at) redirect("/home");
  return <Onboarding initialName={s.profile.name} />;
}
