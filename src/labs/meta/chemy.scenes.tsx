"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const CHEMY_SCENES: Record<string, ComponentType> = {
  bandtheory: load(() => import("../scenes/bandtheory")),
  hesslaw: load(() => import("../scenes/hesslaw")),
  revosmosis: load(() => import("../scenes/revosmosis")),
  alkalinity: load(() => import("../scenes/alkalinity")),
  polygrowth: load(() => import("../scenes/polygrowth")),
  visindex: load(() => import("../scenes/visindex")),
  beerlambert: load(() => import("../scenes/beerlambert")),
  dielsalder: load(() => import("../scenes/dielsalder")),
  irmodes: load(() => import("../scenes/irmodes")),
  vulcanize: load(() => import("../scenes/vulcanize")),
};
