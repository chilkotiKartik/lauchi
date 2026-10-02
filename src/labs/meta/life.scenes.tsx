"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const LIFE_SCENES: Record<string, ComponentType> = {
  ecosystem: load(() => import("../scenes/ecosystem")),
  population: load(() => import("../scenes/population")),
  greenhouse: load(() => import("../scenes/greenhouse")),
  dna: load(() => import("../scenes/dna")),
  microbe: load(() => import("../scenes/microbe")),
  boxmodel: load(() => import("../scenes/boxmodel")),
};
