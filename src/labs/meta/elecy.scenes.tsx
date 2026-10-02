"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELECY_SCENES: Record<string, ComponentType> = {
  kirchhoff: load(() => import("../scenes/kirchhoff")),
  superposition: load(() => import("../scenes/superposition")),
  stardelta: load(() => import("../scenes/stardelta")),
  acwaveforms: load(() => import("../scenes/acwaveforms")),
  acparallel: load(() => import("../scenes/acparallel")),
  magneticgap: load(() => import("../scenes/magneticgap")),
  faradaylenz: load(() => import("../scenes/faradaylenz")),
  singlephaseim: load(() => import("../scenes/singlephaseim")),
  alternator: load(() => import("../scenes/alternator")),
  switchgear: load(() => import("../scenes/switchgear")),
  batterypack: load(() => import("../scenes/batterypack")),
};
