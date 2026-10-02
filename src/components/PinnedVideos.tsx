"use client";
import { useState } from "react";
import { Player } from "@/components/Videos";
import type { PinnedVideo } from "@/lib/admin";

/** "Teacher's picks": videos a teacher pinned for this unit or topic. The player loads only after a tap. */
export function PinnedVideos({ videos }: { videos: PinnedVideo[] }) {
  const [pick, setPick] = useState<string | null>(null);
  if (videos.length === 0) return null;
  const cur = videos.find((v) => v.id === pick) ?? null;
  return (
    <section className="card flex flex-col gap-3" aria-labelledby="tpk">
      <h2 id="tpk" className="text-xl">Teacher&apos;s picks</h2>
      {cur && <Player video={{ id: cur.id, title: cur.title, channel: cur.channel, published: "" }} />}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {videos.map((v) => (
          <li key={v.id}>
            <button type="button" onClick={() => setPick(v.id)} aria-pressed={v.id === pick} className={`vid-card group ${v.id === pick ? "is-on" : ""}`}>
              <span className="relative block aspect-video w-full overflow-hidden rounded-xl bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
                <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span aria-hidden className="vid-play">▶</span>
              </span>
              <span className="line-clamp-2 text-left text-sm font-extrabold text-head">{v.title}</span>
              <span className="text-left text-xs text-muted">{v.channel}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
