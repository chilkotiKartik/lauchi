"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const WEBA_SCENES: Record<string, ComponentType> = {
  httpjourney: load(() => import("../scenes/httpjourney")),
  domtree: load(() => import("../scenes/domtree")),
  specificity: load(() => import("../scenes/specificity")),
  jsdouble: load(() => import("../scenes/jsdouble")),
  pipeline: load(() => import("../scenes/pipeline")),
  callstack: load(() => import("../scenes/callstack")),
  formsize: load(() => import("../scenes/formsize")),
  eventloop: load(() => import("../scenes/eventloop")),
  semver: load(() => import("../scenes/semver")),
  closure: load(() => import("../scenes/closure")),
  coverage: load(() => import("../scenes/coverage")),
  dbindex: load(() => import("../scenes/dbindex")),
  apiqueue: load(() => import("../scenes/apiqueue")),
  flexbox: load(() => import("../scenes/flexbox")),
  ssrcsr: load(() => import("../scenes/ssrcsr")),
  csrf: load(() => import("../scenes/csrf")),
  passwordcrack: load(() => import("../scenes/passwordcrack")),
};
