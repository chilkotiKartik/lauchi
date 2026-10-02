"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const Loading = () => <div role="status" className="grid h-72 place-items-center rounded-2xl border-2 border-line font-bold text-muted">Loading 3D lab…</div>;
/** Each lab scene is its own chunk, fetched only when that lab is opened. */
export const load = (f: () => Promise<{ default: ComponentType }>) => dynamic(f, { ssr: false, loading: Loading });
