import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { GrantTeacherForm, RevokeTeacherButton } from "@/components/admin/TeacherForm";

export const metadata: Metadata = { title: "Teachers" };

type T = { user_id: string; granted_at: string };
type C = { id: string; owner_id: string; name: string; course: string | null; archived: boolean; created_at: string };

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export default async function AdminTeachers() {
  await requireAdmin();
  let teachers: T[] = [], classes: C[] = [], members: { class_id: string }[] = [], people: { id: string; email: string | null; name: string }[] = [];
  let failed = false;
  try {
    const db = createAdminClient();
    const [t, c, m] = await Promise.all([
      db.from("teachers").select("user_id,granted_at").order("granted_at", { ascending: false }).limit(500),
      db.from("classes").select("id,owner_id,name,course,archived,created_at").order("created_at", { ascending: false }).limit(1000),
      db.from("class_members").select("class_id").limit(20000),
    ]);
    if (t.error || c.error || m.error) failed = true;
    teachers = (t.data ?? []) as T[]; classes = (c.data ?? []) as C[]; members = (m.data ?? []) as { class_id: string }[];
    const ids = [...new Set([...teachers.map((x) => x.user_id), ...classes.map((x) => x.owner_id)])];
    if (ids.length) {
      const p = await db.from("profiles").select("id,email,name").in("id", ids);
      people = (p.data ?? []) as typeof people;
    }
  } catch { failed = true; }
  const who = (id: string) => { const p = people.find((x) => x.id === id); return p?.email || p?.name || "Unknown"; };
  const count = (id: string) => members.filter((m) => m.class_id === id).length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Teachers</h1>
        <p className="text-muted">Only people listed here can create classes. The person must have signed in to lockin. at least once.</p>
      </header>
      {failed && <p className="err" role="alert">We couldn&apos;t load everything. Refresh to try again.</p>}
      <section className="card flex flex-col gap-3" aria-labelledby="grant"><h2 id="grant" className="text-xl">Add a teacher</h2><GrantTeacherForm /></section>

      <section className="card flex flex-col gap-3" aria-labelledby="list">
        <h2 id="list" className="text-xl">Teachers ({teachers.length})</h2>
        {teachers.length === 0 ? <p className="text-muted">No teachers yet.</p> : (
          <div className="adm-table-wrap"><table className="adm-table" data-testid="teachers-table">
            <caption className="sr-only">Teachers</caption>
            <thead><tr><th scope="col">Email</th><th scope="col">Since</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{teachers.map((t) => (
              <tr key={t.user_id}><td className="font-extrabold">{who(t.user_id)}</td><td>{day(t.granted_at)}</td><td><RevokeTeacherButton id={t.user_id} label={who(t.user_id)} /></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="all">
        <h2 id="all" className="text-xl">All classes ({classes.length})</h2>
        {classes.length === 0 ? <p className="text-muted">No classes yet.</p> : (
          <div className="adm-table-wrap"><table className="adm-table">
            <caption className="sr-only">All classes</caption>
            <thead><tr><th scope="col">Class</th><th scope="col">Teacher</th><th scope="col">Subject</th><th scope="col" className="num">Students</th><th scope="col">Status</th><th scope="col">Created</th></tr></thead>
            <tbody>{classes.map((c) => (
              <tr key={c.id}><td className="font-extrabold">{c.name}</td><td>{who(c.owner_id)}</td><td>{c.course ?? "All"}</td><td className="num">{count(c.id)}</td><td>{c.archived ? "Archived" : "Active"}</td><td>{day(c.created_at)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
