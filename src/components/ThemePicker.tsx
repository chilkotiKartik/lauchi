"use client";
import { useState, useTransition } from "react";
import { setTheme } from "@/app/(app)/settings/actions";

const OPTIONS = [{ id: "dark", label: "Night" }, { id: "light", label: "Day" }, { id: "system", label: "Match my device" }] as const;

export function ThemePicker({ initial }: { initial: "dark" | "light" | "system" }) {
  const [cur, setCur] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2" aria-busy={pending}>
      {OPTIONS.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={cur === o.id} onClick={() => { setCur(o.id); start(() => setTheme(o.id)); }}
          className={`min-h-11 rounded-full border-2 px-5 font-extrabold ${cur === o.id ? "border-blue bg-blue-l text-blue-t" : "border-line text-ink"}`}>{o.label}</button>
      ))}
    </div>
  );
}
