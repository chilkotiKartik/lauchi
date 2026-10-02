"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MATHII_SCENES: Record<string, ComponentType> = {
  exactode: load(() => import("../scenes/exactode")),
  orthotraj: load(() => import("../scenes/orthotraj")),
  cooling: load(() => import("../scenes/cooling")),
  clairaut: load(() => import("../scenes/clairaut")),
  varparam: load(() => import("../scenes/varparam")),
  cauchyeuler: load(() => import("../scenes/cauchyeuler")),
  coupledode: load(() => import("../scenes/coupledode")),
  halfrange: load(() => import("../scenes/halfrange")),
  parseval: load(() => import("../scenes/parseval")),
  uniformconv: load(() => import("../scenes/uniformconv")),
  lagrangepde: load(() => import("../scenes/lagrangepde")),
  heat2d: load(() => import("../scenes/heat2d")),
  dalembert: load(() => import("../scenes/dalembert")),
  homopde: load(() => import("../scenes/homopde")),
  harmonic: load(() => import("../scenes/harmonic")),
  cauchyint: load(() => import("../scenes/cauchyint")),
  residues: load(() => import("../scenes/residues")),
  realintegral: load(() => import("../scenes/realintegral")),
  singular: load(() => import("../scenes/singular")),
};
