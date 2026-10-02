"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const PHYSICS_SCENES: Record<string, ComponentType> = {
  diffraction: load(() => import("../scenes/diffraction")),
  polarization: load(() => import("../scenes/polarization")),
  fiber: load(() => import("../scenes/fiber")),
  photoelectric: load(() => import("../scenes/photoelectric")),
  compton: load(() => import("../scenes/compton")),
  pnjunction: load(() => import("../scenes/pnjunction")),
  hall: load(() => import("../scenes/hall")),
};
