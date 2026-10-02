"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const EXTRA_SCENES: Record<string, ComponentType> = {
  resources: load(() => import("../scenes/resources")),
  speciesarea: load(() => import("../scenes/speciesarea")),
  rainwater: load(() => import("../scenes/rainwater")),
  loadbill: load(() => import("../scenes/loadbill")),
  gcdflow: load(() => import("../scenes/gcdflow")),
  cellsize: load(() => import("../scenes/cellsize")),
  enzyme: load(() => import("../scenes/enzyme")),
  bioenergy: load(() => import("../scenes/bioenergy")),
  limits: load(() => import("../scenes/limits")),
  partialfrac: load(() => import("../scenes/partialfrac")),
};
