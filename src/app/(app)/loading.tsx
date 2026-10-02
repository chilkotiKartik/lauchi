export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="skel h-36 w-full" />
      <div className="grid gap-3 sm:grid-cols-2"><div className="skel h-28" /><div className="skel h-28" /><div className="skel h-28" /><div className="skel h-28" /></div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
