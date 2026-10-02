"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MATHSB_SCENES: Record<string, ComponentType> = {
  slopefield: load(() => import("../scenes/slopefield")),
  oscillator: load(() => import("../scenes/oscillator")),
  series: load(() => import("../scenes/series")),
  string: load(() => import("../scenes/string")),
  complexmap: load(() => import("../scenes/complexmap")),
};
