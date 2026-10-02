"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELEX_SCENES: Record<string, ComponentType> = {
  diodeiv: load(() => import("../scenes/diodeiv")),
  bjt: load(() => import("../scenes/bjt")),
  mosfet: load(() => import("../scenes/mosfet")),
  opamp: load(() => import("../scenes/opamp")),
  logic: load(() => import("../scenes/logic")),
};
