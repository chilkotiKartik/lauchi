import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { visibleCourses } from "@/lib/stream";
import { getCourse, listCourses } from "@/lib/syllabus";
import { loadResources } from "@/components/resources/data";
import { ResourceBrowser } from "@/components/resources/ResourceBrowser";
import { ArtBook } from "@/components/art";

export const metadata: Metadata = { title: "Notes & files" };

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { supabase, user, profile } = await requireOnboarded();
  const { open } = await searchParams;
  const items = await loadResources(supabase, profile.branch);
  const courses = visibleCourses(profile.branch, listCourses()).map((c) => ({
    code: c.code, short: c.short, name: c.name, units: (getCourse(c.code)?.units ?? []).map((u) => u.title),
  }));
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <ArtBook size={56} />
        <div><h1 className="text-3xl">Notes &amp; files</h1><p className="text-muted">Notes, assignments, slides and links your teachers shared, by subject and unit. Read them right here; some files can also be downloaded.</p></div>
      </header>
      <ResourceBrowser items={items} courses={courses} openId={open} watermark={user.email ?? profile.name} />
    </div>
  );
}
