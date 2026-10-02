"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const WEBB_SCENES: Record<string, ComponentType> = {
  rerender: load(() => import("../scenes/rerender")),
  statebatch: load(() => import("../scenes/statebatch")),
  effectdeps: load(() => import("../scenes/effectdeps")),
  router: load(() => import("../scenes/router")),
  typesets: load(() => import("../scenes/typesets")),
  reducer: load(() => import("../scenes/reducer")),
  backoff: load(() => import("../scenes/backoff")),
  contrast: load(() => import("../scenes/contrast")),
  codesplit: load(() => import("../scenes/codesplit")),
  gitgraph: load(() => import("../scenes/gitgraph")),
  bundle: load(() => import("../scenes/bundle")),
  vlq: load(() => import("../scenes/vlq")),
  testpyramid: load(() => import("../scenes/testpyramid")),
  cicd: load(() => import("../scenes/cicd")),
  canary: load(() => import("../scenes/canary")),
  layers: load(() => import("../scenes/layers")),
  plural: load(() => import("../scenes/plural")),
};
