"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const PHYX_SCENES: Record<string, ComponentType> = {
  rayleigh: load(() => import("../scenes/rayleigh")),
  laser: load(() => import("../scenes/laser")),
  polarimeter: load(() => import("../scenes/polarimeter")),
  solarcell: load(() => import("../scenes/solarcell")),
};
