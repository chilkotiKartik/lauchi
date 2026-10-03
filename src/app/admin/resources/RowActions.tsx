"use client";
import { useState, useTransition } from "react";
import { deleteResource, setResourceDownload, setResourceHidden } from "@/app/admin/resources/actions";

/** Hide / show, and a two-step delete (the second tap really deletes the row and its file). */
export function RowActions({ id, title, hidden, file, allowDownload }: { id: string; title: string; hidden: boolean; file?: boolean; allowDownload?: boolean }) {
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      {file && <button type="button" className={`seg ${allowDownload ? "is-on" : ""}`} aria-pressed={allowDownload} disabled={pending} aria-label={`${allowDownload ? "Make read-only" : "Allow download of"} ${title}`} onClick={() => start(() => setResourceDownload(id, !allowDownload))}>{allowDownload ? "Download: on" : "Read-only"}</button>}
      <button type="button" className="seg" disabled={pending} aria-label={`${hidden ? "Show" : "Hide"} ${title}`} onClick={() => start(() => setResourceHidden(id, !hidden))}>{hidden ? "Show" : "Hide"}</button>
      {sure ? (
        <>
          <button type="button" className="seg !text-red-t" disabled={pending} aria-label={`Yes, delete ${title}`} onClick={() => start(() => deleteResource(id))}>{pending ? "Deleting…" : "Yes, delete"}</button>
          <button type="button" className="seg" disabled={pending} onClick={() => setSure(false)}>Keep</button>
        </>
      ) : (
        <button type="button" className="seg !text-red-t" disabled={pending} aria-label={`Delete ${title}`} onClick={() => setSure(true)}>Delete</button>
      )}
    </div>
  );
}
