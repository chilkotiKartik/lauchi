"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const GFX_SCENES: Record<string, ComponentType> = {
  scalerf: load(() => import("../scenes/scalerf")),
  projection: load(() => import("../scenes/projection")),
  isometric: load(() => import("../scenes/isometric")),
  sectionplane: load(() => import("../scenes/sectionplane")),
  cadcoords: load(() => import("../scenes/cadcoords")),
};
