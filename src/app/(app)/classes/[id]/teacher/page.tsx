import { notFound, redirect } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { ownedClass } from "@/lib/classes-server";

/** Alias of the teacher dashboard. Students (even members of the class) get a 404; the owner is sent to the dashboard. */
export default async function TeacherAlias({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireOnboarded();
  const { id } = await params;
  const cls = await ownedClass(supabase, user.id, id);
  if (!cls) notFound();
  redirect(`/classes/${cls.id}`);
}
