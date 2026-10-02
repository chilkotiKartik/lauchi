"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const PHYY_SCENES: Record<string, ComponentType> = {
  biprism: load(() => import("../scenes/biprism")),
  wedge: load(() => import("../scenes/wedge")),
  einstein: load(() => import("../scenes/einstein")),
  calcite: load(() => import("../scenes/calcite")),
  poynting: load(() => import("../scenes/poynting")),
  dispcurrent: load(() => import("../scenes/dispcurrent")),
  magnetism: load(() => import("../scenes/magnetism")),
  wavepacket: load(() => import("../scenes/wavepacket")),
  davisson: load(() => import("../scenes/davisson")),
  ekband: load(() => import("../scenes/ekband")),
};
