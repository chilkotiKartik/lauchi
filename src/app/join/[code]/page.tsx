import { redirect } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { cleanCode } from "@/lib/social";

// Invite links (/join/CODE) for both friends and groups. Signed-out visitors are sent to /login by the proxy and come
// back here afterwards; nothing happens until the student confirms on /friends.
export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  await requireOnboarded();
  const { code } = await params;
  const c = cleanCode(code);
  redirect(c ? `/friends?add=${c}` : "/friends?add=invalid");
}
