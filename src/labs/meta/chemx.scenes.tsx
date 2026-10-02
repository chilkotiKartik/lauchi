"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CHEMX_SCENES: Record<string, ComponentType> = {
  cft: load(() => import("../scenes/cft")),
  ellingham: load(() => import("../scenes/ellingham")),
  softening: load(() => import("../scenes/softening")),
  corrosion: load(() => import("../scenes/corrosion")),
  calorimeter: load(() => import("../scenes/calorimeter")),
  lubrication: load(() => import("../scenes/lubrication")),
  nmr: load(() => import("../scenes/nmr")),
  snmech: load(() => import("../scenes/snmech")),
};
