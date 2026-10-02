import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { isTeacher, myClasses, ownedClasses } from "@/lib/classes-server";
import { compareWord, MAX_CLASSES_PER_STUDENT } from "@/lib/classes";
import { listCourses } from "@/lib/syllabus";
import { JoinForm } from "@/components/classes/JoinForm";
import { LeaveButton } from "@/components/classes/LeaveButton";
import { CreateClassForm } from "@/components/classes/CreateClassForm";
import "@/components/classes/classes.css";

export const metadata: Metadata = { title: "Classes" };

const WORD = { above: "You are ahead of the class average.", below: "A little below the class average. You can catch up.", level: "Right on the class average.", none: "" } as const;

export default async function Classes() {
  const { supabase, user } = await requireOnboarded();
  const teacher = await isTeacher(supabase, user.id);
  const [mine, owned] = await Promise.all([myClasses(supabase, user.id), teacher ? ownedClasses(supabase, user.id) : null]);
  const courses = teacher ? listCourses().filter((c) => c.units > 0).map((c) => ({ code: c.code, short: c.short })) : [];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Classes</h1>
        <p className="text-muted">Join your teacher&apos;s class to share your study progress with them.</p>
      </header>

      {owned && (
        <section className="card flex flex-col gap-4" aria-labelledby="teach">
          <h2 id="teach" className="text-xl">Classes you teach</h2>
          {owned.failed ? <p className="err" role="alert">We couldn&apos;t load your classes. Refresh to try again.</p>
            : owned.classes.length === 0 ? <p className="text-muted">You have no classes yet. Create one below and share the code.</p>
            : (
              <ul className="flex flex-col gap-2" aria-label="Classes you teach">
                {owned.classes.map((c) => (
                  <li key={c.id}>
                    <Link href={`/classes/${c.id}`} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line bg-card p-3 no-underline">
                      <span className="min-w-0 flex-1 truncate font-black text-head">{c.name}</span>
                      {c.course && <span className="chip chip-cool">{c.course}</span>}
                      {c.archived && <span className="chip chip-soft">Archived</span>}
                      <span className="chip chip-th">{c.members} student{c.members === 1 ? "" : "s"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          <div className="border-t-2 border-line pt-4">
            <h3 className="mb-2 text-lg">Create a class</h3>
            <CreateClassForm courses={courses} />
          </div>
        </section>
      )}

      <section className="card flex flex-col gap-4" aria-labelledby="join">
        <h2 id="join" className="text-xl">{teacher ? "Classes you are a student in" : "Your classes"}</h2>
        {mine.failed ? <p className="err" role="alert">We couldn&apos;t load your classes. Refresh to try again.</p>
          : mine.classes.length === 0 ? <p className="text-muted">You are not in a class yet. Ask your teacher for a code.</p>
          : (
            <ul className="flex flex-col gap-3" aria-label="Your classes">
              {mine.classes.map((c) => {
                const cmp = mine.compare.find((x) => x.class_id === c.id);
                const w = cmp ? compareWord(cmp.my_xp7, cmp.avg_xp7) : "none";
                return (
                  <li key={c.id} className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-card p-3" data-testid="my-class">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-lg font-black text-head">{c.name}</span>
                      {c.course && <span className="chip chip-cool">{c.course}</span>}
                      <LeaveButton classId={c.id} name={c.name} />
                    </div>
                    {cmp && (
                      <>
                        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="cls-stat"><b>{cmp.my_xp7}</b><span>Your XP, 7 days</span></div>
                          <div className="cls-stat"><b>{cmp.avg_xp7}</b><span>Class average XP</span></div>
                          <div className="cls-stat"><b>{cmp.my_accuracy === null ? "–" : `${cmp.my_accuracy}%`}</b><span>Your accuracy</span></div>
                          <div className="cls-stat"><b>{cmp.avg_accuracy === null ? "–" : `${cmp.avg_accuracy}%`}</b><span>Class average</span></div>
                        </dl>
                        {WORD[w] && <p className="text-sm text-muted">{WORD[w]} Only averages are shown. You never see other students&apos; numbers.</p>}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        <div className="border-t-2 border-line pt-4">
          <h3 className="mb-2 text-lg">Join a class</h3>
          <JoinForm />
          <p className="mt-2 text-xs text-muted">You can be in up to {MAX_CLASSES_PER_STUDENT} classes.</p>
        </div>
      </section>
    </div>
  );
}
