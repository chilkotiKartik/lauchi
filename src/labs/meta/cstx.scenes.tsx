"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CSTX_SCENES: Record<string, ComponentType> = {
  cpipeline: load(() => import("../scenes/cpipeline")),
  ctrlflow: load(() => import("../scenes/ctrlflow")),
  sortstack: load(() => import("../scenes/sortstack")),
  ptrheap: load(() => import("../scenes/ptrheap")),
  structunion: load(() => import("../scenes/structunion")),
};
