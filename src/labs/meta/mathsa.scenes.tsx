"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MATHSA_SCENES: Record<string, ComponentType> = {
  revolution: load(() => import("../scenes/revolution")),
  vectorfield: load(() => import("../scenes/vectorfield")),
  mvt: load(() => import("../scenes/mvt")),
  calculus: load(() => import("../scenes/calculus")),
  lines: load(() => import("../scenes/lines")),
};
