"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MECHX_SCENES: Record<string, ComponentType> = {
  truss: load(() => import("../scenes/truss")),
  ladder: load(() => import("../scenes/ladder")),
  beam: load(() => import("../scenes/beam")),
  pelton: load(() => import("../scenes/pelton")),
  pvwork: load(() => import("../scenes/pvwork")),
  engine4s: load(() => import("../scenes/engine4s")),
  dualcycle: load(() => import("../scenes/dualcycle")),
};
