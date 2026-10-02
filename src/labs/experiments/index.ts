import type { Experiment } from "./types";
import { CORE_EXPERIMENTS } from "./core";
import { CST_EXPERIMENTS } from "./cst";
import { MATHI_EXPERIMENTS } from "./mathi";
import { MATHII_EXPERIMENTS } from "./mathii";
import { BCAX_EXPERIMENTS } from "./bcax";

export type { Experiment, Question, Step, StepCheck, Equipment } from "./types";

/** Guided experiments keyed by lab id. */
export const EXPERIMENTS: Record<string, Experiment> = { ...CORE_EXPERIMENTS, ...CST_EXPERIMENTS, ...MATHI_EXPERIMENTS, ...Object.fromEntries(MATHII_EXPERIMENTS.map((e) => [e.labId, e])), ...BCAX_EXPERIMENTS };
export const getExperiment = (labId: string): Experiment | undefined => EXPERIMENTS[labId];
