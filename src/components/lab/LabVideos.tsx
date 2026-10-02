"use client";
import { PinnedVideos } from "@/components/PinnedVideos";
import { VideoShelf } from "@/components/Videos";
import type { PinnedVideo } from "@/lib/admin";

/** Lecture videos for a lab topic: teacher's picks first, then YouTube search (loaded only after a tap). Without a YouTube key it is a plain search link. */
export function LabVideos({ query, heading, pinned, youtubeOn, id = "lab-videos" }: { query: string; heading: string; pinned: PinnedVideo[]; youtubeOn: boolean; id?: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xl">{heading}</h2>
      <PinnedVideos videos={pinned} />
      <div className="card flex min-w-0 flex-col gap-2">
        {youtubeOn ? (
          <VideoShelf key={query} query={query} lazy />
        ) : (
          <>
            <p className="text-muted">In-app lectures aren&apos;t switched on yet, so this opens YouTube in a new tab.</p>
            <a className="btn btn-ghost w-fit" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Search lectures on YouTube ↗</a>
          </>
        )}
      </div>
    </section>
  );
}
