"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELEXX_SCENES: Record<string, ComponentType> = {
  semicond: load(() => import("../scenes/semicond")),
  clipper: load(() => import("../scenes/clipper")),
  zener: load(() => import("../scenes/zener")),
  biasstab: load(() => import("../scenes/biasstab")),
  jfet: load(() => import("../scenes/jfet")),
  kmap: load(() => import("../scenes/kmap")),
};
