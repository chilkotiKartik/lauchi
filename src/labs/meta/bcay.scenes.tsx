import type { ComponentType } from "react";
import { load } from "../load";

export const BCAY_SCENES: Record<string, ComponentType> = {
  cpointer3d: load(() => import("../scenes/cpointer3d")),
  hardarch3d: load(() => import("../scenes/hardarch3d")),
  sdlc3d: load(() => import("../scenes/sdlc3d")),
};
