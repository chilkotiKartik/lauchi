import type { Metadata } from "next";
import { requireAdmin, thumbUrl, type PinnedRow } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoForm } from "@/components/admin/VideoForm";
import { movePinned, removePinned } from "@/app/admin/actions";
import { courseLabel, courseOptions, unitLabel } from "@/app/admin/data";

export const metadata: Metadata = { title: "Pinned videos" };

export default async function AdminVideos() {
  await requireAdmin();
  const opts = courseOptions();
  let rows: PinnedRow[] = [];
  let failed = false;
  try {
    const { data, error } = await createAdminClient().from("pinned_videos")
      .select("id,course,unit,topic,video_id,title,channel,note,position,created_at")
      .order("course", { ascending: true }).order("unit", { ascending: true }).order("position", { ascending: true }).limit(1000);
    if (error) failed = true; else rows = (data ?? []) as PinnedRow[];
  } catch { failed = true; }

  const groups = new Map<string, PinnedRow[]>();
  for (const r of rows) { const k = `${r.course}:${r.unit}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
  const topicTitle = (r: PinnedRow) => (r.topic ? opts.find((c) => c.code === r.course)?.units.find((u) => u.n === r.unit)?.topics[Number(r.topic) - 1] ?? `Topic ${r.topic}` : null);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Pinned videos</h1>
        <p className="text-muted">Pin lectures you trust. They show first on that unit&apos;s video shelf as <b>Teacher&apos;s pick</b>, above the YouTube search results.</p>
      </header>
      <section className="card flex flex-col gap-3" aria-labelledby="pin-h">
        <h2 id="pin-h" className="text-xl">Pin a video</h2>
        <VideoForm courses={opts.map((c) => ({ code: c.code, short: c.short, units: c.units }))} />
      </section>
      <section className="card flex flex-col gap-4" aria-labelledby="pinned-h">
        <h2 id="pinned-h" className="text-xl">Pinned so far</h2>
        {failed ? <p className="err" role="alert">We couldn&apos;t load pinned videos. Refresh to try again.</p>
          : rows.length === 0 ? <p className="text-muted">Nothing pinned yet.</p>
          : [...groups.entries()].map(([k, list]) => {
            const [course, unit] = [list[0].course, Number(list[0].unit)];
            return (
              <div key={k} className="flex flex-col gap-2">
                <h3 className="text-base">{courseLabel(opts, course)} · Unit {unit}{unitLabel(opts, course, unit) ? `: ${unitLabel(opts, course, unit)}` : ""}</h3>
                <ol className="flex flex-col gap-2" aria-label={`Pinned for ${courseLabel(opts, course)} unit ${unit}`}>
                  {list.map((r, i) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line p-2 sm:flex-nowrap">
                      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, allowed by the CSP */}
                      <img src={thumbUrl(r.video_id)} alt="" className="adm-thumb" width={120} height={68} loading="lazy" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <b className="break-words text-head">{r.title}</b>
                        <span className="text-sm text-muted">{[r.channel, topicTitle(r) ? `Topic: ${topicTitle(r)}` : "Whole unit", r.video_id].filter(Boolean).join(" · ")}</span>
                        {r.note && <span className="text-sm">{r.note}</span>}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <form action={movePinned.bind(null, r.id, -1)}><button className="seg" disabled={i === 0} aria-label={`Move ${r.title} up`}>↑</button></form>
                        <form action={movePinned.bind(null, r.id, 1)}><button className="seg" disabled={i === list.length - 1} aria-label={`Move ${r.title} down`}>↓</button></form>
                        <form action={removePinned.bind(null, r.id)}><button className="seg !text-red-t" aria-label={`Remove ${r.title}`}>Remove</button></form>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </section>
    </div>
  );
}
