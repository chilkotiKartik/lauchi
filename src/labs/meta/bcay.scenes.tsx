import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const BCAY_SCENES: Record<string, ComponentType> = {
  cpointer3d: dynamic(() => import("../scenes/cpointer3d"), { ssr: false }),
  hardarch3d: dynamic(() => import("../scenes/hardarch3d"), { ssr: false }),
  sdlc3d: dynamic(() => import("../scenes/sdlc3d"), { ssr: false }),
};
