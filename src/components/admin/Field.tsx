import type { ReactNode } from "react";

/** A labelled form control with a hint and its zod error, wired up with aria-invalid / aria-describedby. */
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: (a: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode }) {
  const desc = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="adm-label">
      <label htmlFor={id}>{label}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": desc })}
      {error && <span id={`${id}-err`} className="adm-fielderr">{error}</span>}
    </div>
  );
}
