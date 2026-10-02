import Link from "next/link";

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>›</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page" className="font-extrabold text-head">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
export const Bar = ({ value, max, label }: { value: number; max: number; label: string }) => (
  <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
);
