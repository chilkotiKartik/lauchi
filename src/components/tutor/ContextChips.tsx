/** "Using: …" chips that tell the student what Lochi can see. `onClear` adds a clear button (client use). */
export function ContextChips({ sources, onClear }: { sources: string[]; onClear?: () => void }) {
  if (!sources.length) return null;
  return (
    <section aria-label="What Lochi can see" className="flex flex-wrap items-center gap-2" data-testid="tutor-context">
      <span className="text-sm font-bold text-muted">Using:</span>
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => <li key={s} className="chip">{s}</li>)}
      </ul>
      {onClear && <button type="button" className="btn-ghost !px-3 !py-1 text-sm" onClick={onClear}>Clear context</button>}
    </section>
  );
}
