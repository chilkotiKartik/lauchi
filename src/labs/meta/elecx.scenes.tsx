"use client";
import type { ComponentType } from "react";
import { load } from "../load";

export const ELECX_SCENES: Record<string, ComponentType> = {
  transient: load(() => import("../scenes/transient")),
  wattmeter: load(() => import("../scenes/wattmeter")),
  trtest: load(() => import("../scenes/trtest")),
  meters: load(() => import("../scenes/meters")),
  dcmachine: load(() => import("../scenes/dcmachine")),
  torqueslip: load(() => import("../scenes/torqueslip")),
  powergrid: load(() => import("../scenes/powergrid")),
  earthing: load(() => import("../scenes/earthing")),
};
