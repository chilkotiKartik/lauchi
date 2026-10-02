"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELEXY_SCENES: Record<string, ComponentType> = {
  tunnel: load(() => import("../scenes/tunnel")),
  multiplier: load(() => import("../scenes/multiplier")),
  bridgerect: load(() => import("../scenes/bridgerect")),
  bjtconfig: load(() => import("../scenes/bjtconfig")),
  hparam: load(() => import("../scenes/hparam")),
  acload: load(() => import("../scenes/acload")),
  mosdepenh: load(() => import("../scenes/mosdepenh")),
  jfetbias: load(() => import("../scenes/jfetbias")),
  fetamp: load(() => import("../scenes/fetamp")),
  universal: load(() => import("../scenes/universal")),
  numbase: load(() => import("../scenes/numbase")),
  opreal: load(() => import("../scenes/opreal")),
};
