import type { Params } from "./params-core";

/** A ready-made experiment: a set of values plus what to look for. */
export interface LabPreset { name: string; note: string; values: Params }

/** Server-safe lab metadata. The heavy 3D code is loaded separately, on demand. */
export interface LabMeta {
  id: string;             // lowercase letters/digits only (also the saved-setup key)
  title: string;
  blurb: string;
  /** Syllabus units this lab belongs to, as [course code, unit number]. The first one decides the group on /labs. */
  where: [string, number][];
  topics: string[];
  animated: boolean;
  presets: LabPreset[];
}
