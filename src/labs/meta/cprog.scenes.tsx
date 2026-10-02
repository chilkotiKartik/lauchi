"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CPROG_SCENES: Record<string, ComponentType> = {
  sorting: load(() => import("../scenes/sorting")),
  search: load(() => import("../scenes/search")),
  pointers: load(() => import("../scenes/pointers")),
  bits: load(() => import("../scenes/bits")),
  structlayout: load(() => import("../scenes/structlayout")),
};
