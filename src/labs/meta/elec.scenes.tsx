"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELEC_SCENES: Record<string, ComponentType> = {
  thevenin: load(() => import("../scenes/thevenin")),
  threephase: load(() => import("../scenes/threephase")),
  hysteresis: load(() => import("../scenes/hysteresis")),
  transformer: load(() => import("../scenes/transformer")),
  rotatingfield: load(() => import("../scenes/rotatingfield")),
};
