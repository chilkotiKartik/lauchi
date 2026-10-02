"use client";
import type { ComponentType } from "react";
import { Guard } from "./Stage";
import { CORE_SCENES } from "./meta/core.scenes";
import { MATHSA_SCENES } from "./meta/mathsa.scenes";
import { MATHSB_SCENES } from "./meta/mathsb.scenes";
import { PHYSICS_SCENES } from "./meta/physics.scenes";
import { CHEM_SCENES } from "./meta/chem.scenes";
import { ELEC_SCENES } from "./meta/elec.scenes";
import { ELEX_SCENES } from "./meta/elex.scenes";
import { MECH_SCENES } from "./meta/mech.scenes";
import { CPROG_SCENES } from "./meta/cprog.scenes";
import { LIFE_SCENES } from "./meta/life.scenes";
import { EXTRA_SCENES } from "./meta/extra.scenes";
import { WEBA_SCENES } from "./meta/weba.scenes";
import { WEBB_SCENES } from "./meta/webb.scenes";
import { GFX_SCENES } from "./meta/gfx.scenes";
import { PHYX_SCENES } from "./meta/phyx.scenes";
import { CHEMX_SCENES } from "./meta/chemx.scenes";
import { ELECX_SCENES } from "./meta/elecx.scenes";
import { ELEXX_SCENES } from "./meta/elexx.scenes";
import { MECHX_SCENES } from "./meta/mechx.scenes";
import { PHYY_SCENES } from "./meta/phyy.scenes";
import { CHEMY_SCENES } from "./meta/chemy.scenes";
import { ELECY_SCENES } from "./meta/elecy.scenes";
import { ELEXY_SCENES } from "./meta/elexy.scenes";
import { MECHY_SCENES } from "./meta/mechy.scenes";
import { CSTX_SCENES } from "./meta/cstx.scenes";
import { BCAX_SCENES } from "./meta/bcax.scenes";
import { BCAZ_SCENES } from "./meta/bcaz.scenes";
import { BCAY_SCENES } from "./meta/bcay.scenes";
import { MATHII_SCENES } from "./meta/mathii.scenes";
import { MATHI_SCENES } from "./meta/mathi.scenes";

const SCENES: Record<string, ComponentType> = { ...CORE_SCENES, ...MATHSA_SCENES, ...MATHSB_SCENES, ...PHYSICS_SCENES, ...CHEM_SCENES, ...ELEC_SCENES, ...ELEX_SCENES, ...MECH_SCENES, ...CPROG_SCENES, ...LIFE_SCENES, ...EXTRA_SCENES, ...WEBA_SCENES, ...WEBB_SCENES, ...GFX_SCENES, ...PHYX_SCENES, ...CHEMX_SCENES, ...ELECX_SCENES, ...ELEXX_SCENES, ...MECHX_SCENES, ...MECHY_SCENES, ...ELEXY_SCENES, ...ELECY_SCENES, ...CHEMY_SCENES, ...PHYY_SCENES, ...CSTX_SCENES, ...MATHI_SCENES, ...MATHII_SCENES, ...BCAX_SCENES, ...BCAY_SCENES, ...BCAZ_SCENES };

export function LabLoader({ id }: { id: string }) {
  const Scene = SCENES[id];
  return Scene ? <Guard what="This lab could not be loaded (check your connection and try again)."><Scene /></Guard> : null;
}
