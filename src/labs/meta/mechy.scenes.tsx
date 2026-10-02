"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const MECHY_SCENES: Record<string, ComponentType> = {
  elastic: load(() => import("../scenes/elastic")),
  steppedbar: load(() => import("../scenes/steppedbar")),
  carbonsteel: load(() => import("../scenes/carbonsteel")),
  manometer: load(() => import("../scenes/manometer")),
  hydrolift: load(() => import("../scenes/hydrolift")),
  viscosity: load(() => import("../scenes/viscosity")),
  sfee: load(() => import("../scenes/sfee")),
  secondlaw: load(() => import("../scenes/secondlaw")),
  zerothlaw: load(() => import("../scenes/zerothlaw")),
  twostroke: load(() => import("../scenes/twostroke")),
  centripump: load(() => import("../scenes/centripump")),
};
