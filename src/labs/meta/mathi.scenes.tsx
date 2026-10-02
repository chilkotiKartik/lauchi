"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MATHI_SCENES: Record<string, ComponentType> = {
  taylor2var: load(() => import("../scenes/taylor2var")),
  partialeuler: load(() => import("../scenes/partialeuler")),
  lagrangemult: load(() => import("../scenes/lagrangemult")),
  reverseorder: load(() => import("../scenes/reverseorder")),
  betagamma: load(() => import("../scenes/betagamma")),
  curvetrace: load(() => import("../scenes/curvetrace")),
  jacobian: load(() => import("../scenes/jacobian")),
  errorapprox: load(() => import("../scenes/errorapprox")),
  centroid: load(() => import("../scenes/centroid")),
  revcurves: load(() => import("../scenes/revcurves")),
  gradient: load(() => import("../scenes/gradient")),
  divcurl3d: load(() => import("../scenes/divcurl3d")),
  lineintegral: load(() => import("../scenes/lineintegral")),
  gaussflux: load(() => import("../scenes/gaussflux")),
  stokesloop: load(() => import("../scenes/stokesloop")),
  planes3: load(() => import("../scenes/planes3")),
  rowreduce: load(() => import("../scenes/rowreduce")),
  caleyham: load(() => import("../scenes/caleyham")),
  diagonalize: load(() => import("../scenes/diagonalize")),
  eigen3d: load(() => import("../scenes/eigen3d")),
};
