"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CORE_SCENES: Record<string, ComponentType> = {
  surface: load(() => import("../scenes/surface")),
  volume: load(() => import("../scenes/volume")),
  eigen: load(() => import("../scenes/eigen")),
  polar: load(() => import("../scenes/polar")),
  fourier: load(() => import("../scenes/fourier")),
  taylor: load(() => import("../scenes/taylor")),
  projectile: load(() => import("../scenes/projectile")),
  field: load(() => import("../scenes/field")),
  interference: load(() => import("../scenes/interference")),
  emwave: load(() => import("../scenes/emwave")),
  vsepr: load(() => import("../scenes/vsepr")),
  rlc: load(() => import("../scenes/rlc")),
  rectifier: load(() => import("../scenes/rectifier")),
  otto: load(() => import("../scenes/otto")),
  pendulum: load(() => import("../scenes/pendulum")),
  rings: load(() => import("../scenes/rings")),
  box: load(() => import("../scenes/box")),
  titration: load(() => import("../scenes/titration")),
};
