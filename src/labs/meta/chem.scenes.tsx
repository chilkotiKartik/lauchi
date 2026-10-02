"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CHEM_SCENES: Record<string, ComponentType> = {
  orbitals: load(() => import("../scenes/orbitals")),
  motheory: load(() => import("../scenes/motheory")),
  nernst: load(() => import("../scenes/nernst")),
  gibbs: load(() => import("../scenes/gibbs")),
  hardness: load(() => import("../scenes/hardness")),
  polymer: load(() => import("../scenes/polymer")),
  spectro: load(() => import("../scenes/spectro")),
};
