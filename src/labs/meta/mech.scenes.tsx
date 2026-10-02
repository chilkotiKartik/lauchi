"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MECH_SCENES: Record<string, ComponentType> = {
  incline: load(() => import("../scenes/incline")),
  moi: load(() => import("../scenes/moi")),
  tensile: load(() => import("../scenes/tensile")),
  bernoulli: load(() => import("../scenes/bernoulli")),
  carnot: load(() => import("../scenes/carnot")),
  diesel: load(() => import("../scenes/diesel")),
};
