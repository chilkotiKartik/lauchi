"use client";
import { useState } from "react";

export type PickCourse = { code: string; short: string; units: { n: number; title: string; topics: string[] }[] };

/** Subject, unit and topic selectors in a plain GET form (works without JS state on the server side). */
export function TopicPicker({ courses, action, course: c0, unit: u0, topic: t0, submit = "Continue", withTopic = true }: { courses: PickCourse[]; action: string; course?: string; unit?: number; topic?: number; submit?: string; withTopic?: boolean }) {
  const [course, setCourse] = useState(courses.some((c) => c.code === c0) ? c0! : courses[0]?.code ?? "");
  const units = courses.find((c) => c.code === course)?.units ?? [];
  const [unit, setUnit] = useState(u0 && units.some((u) => u.n === u0) ? u0 : units[0]?.n ?? 1);
  const topics = units.find((u) => u.n === unit)?.topics ?? [];
  const [topic, setTopic] = useState(t0 && t0 <= topics.length ? t0 : 1);
  return (
    <form method="get" action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
      <div className="adm-label"><label htmlFor="tp-course">Subject</label>
        <select id="tp-course" name="course" className="field" value={course} onChange={(e) => { const cs = courses.find((c) => c.code === e.target.value); setCourse(e.target.value); setUnit(cs?.units[0]?.n ?? 1); setTopic(1); }}>
          {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}
        </select></div>
      <div className="adm-label"><label htmlFor="tp-unit">Unit</label>
        <select id="tp-unit" name="unit" className="field" value={unit} onChange={(e) => { setUnit(Number(e.target.value)); setTopic(1); }}>
          {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}
        </select></div>
      {withTopic && (
        <div className="adm-label"><label htmlFor="tp-topic">Topic</label>
          <select id="tp-topic" name="topic" className="field" value={topic} onChange={(e) => setTopic(Number(e.target.value))}>
            {topics.map((t, i) => <option key={i} value={i + 1}>{i + 1}. {t}</option>)}
          </select></div>
      )}
      <button type="submit" className="btn">{submit}</button>
    </form>
  );
}
