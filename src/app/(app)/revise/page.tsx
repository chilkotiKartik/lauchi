import type { Metadata } from "next";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromTemplate, toPublic } from "@/lib/quiz";
import { getPyq, SHORT } from "@/lib/pyq";
import { getCourse } from "@/lib/syllabus";
import { indiaToday, parsePyqRef, parseQuizRef } from "@/lib/revise";
import type { AnswerBook, ModelAnswer } from "@/content/answers/types";
import phyAns from "@/content/answers/AHT-001.json";
import chemAns from "@/content/answers/AHT-002.json";
import elexAns from "@/content/answers/ECT-001.json";
import elecAns from "@/content/answers/EET-001.json";
import mechAns from "@/content/answers/MET-001.json";
import { ReviseBoard, type SessionItem } from "@/components/revise/ReviseBoard";
import { ArtBrain } from "@/components/art";

export const metadata: Metadata = { title: "Revise today" };

const BOOKS = { "AHT-001": phyAns, "AHT-002": chemAns, "ECT-001": elexAns, "EET-001": elecAns, "MET-001": mechAns } as unknown as Record<string, AnswerBook>;
/** Model answers are being written subject by subject; a missing or malformed entry just means "no model answer yet". */
function modelAnswer(code: string, id: string): ModelAnswer | null {
  const a = BOOKS[code]?.[id];
  return a && Array.isArray(a.answer) && a.answer.length > 0 ? a : null;
}

type Row = { id: string; kind: "quiz" | "pyq"; ref: string; course: string; unit: number; title: string; step: number; due: string; last_reviewed: string | null; lapses: number };
const MAX_SESSION = 30;

export default async function RevisePage() {
  const { user, profile } = await requireOnboarded();
  const today = indiaToday();
  let rows: Row[] = [];
  try {
    const { data } = await createAdminClient().from("revise_items").select("id,kind,ref,course,unit,title,step,due,last_reviewed,lapses")
      .eq("user_id", user.id).order("due", { ascending: true }).limit(2000);
    rows = (data ?? []) as Row[];
  } catch { /* not configured: the empty state explains the queue */ }

  const items: SessionItem[] = [];
  for (const r of rows) {
    if (r.due > today || items.length >= MAX_SESSION || !canSeeCourse(profile.branch, r.course)) continue;
    const c = getCourse(r.course);
    const where = `${c?.short ?? SHORT[r.course] ?? r.course} · Unit ${r.unit}${c?.units[r.unit - 1] ? `: ${c.units[r.unit - 1].title}` : ""}`;
    const base = { id: r.id, step: r.step, lapses: r.lapses, where };
    if (r.kind === "quiz") {
      const ref = parseQuizRef(r.ref);
      const q = ref ? fromTemplate(ref.course, ref.unit, ref.t, ref.s) : null;
      if (q) items.push({ ...base, kind: "quiz", q: toPublic(q) });
    } else {
      const ref = parsePyqRef(r.ref);
      const subject = ref ? getPyq(ref.code) : null;
      const unit = subject?.units.find((u) => u.pyqs.some((p) => p.id === ref!.id));
      const p = unit?.pyqs.find((x) => x.id === ref!.id);
      if (ref && p && unit) {
        items.push({
          ...base, kind: "pyq", pyqId: p.id, title: p.title, parts: p.parts, marks: p.marks,
          href: `/pyq?course=${ref.code}&unit=${unit.n}`, model: modelAnswer(ref.code, p.id),
          where: `${SHORT[ref.code] ?? subject!.name} · Unit ${unit.n}: ${unit.title}`,
        });
      }
    }
  }
  const reviewedToday = rows.filter((r) => r.last_reviewed && indiaToday(new Date(r.last_reviewed)) === today).length;
  const dueNow = rows.filter((r) => r.due <= today).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="page-head flex items-center gap-3">
        <ArtBrain size={56} />
        <div>
          <h1 className="text-3xl">Revise today</h1>
          <p className="text-muted">Questions you missed and PYQs you practised come back after 1, 3, 7, 21 and 60 days, just before you would forget them.</p>
        </div>
      </header>
      <ReviseBoard today={today} items={items} dueNow={dueNow} reviewedToday={reviewedToday} total={rows.length} dues={rows.map((r) => ({ id: r.id, due: r.due }))} />
    </div>
  );
}
