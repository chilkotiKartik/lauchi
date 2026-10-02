/** Server-safe lab metadata. The heavy 3D code is loaded separately, on demand (see LabLoader). */
import type { LabMeta } from "./types";
import { CORE_LABS } from "./meta/core";
import { MATHSA_LABS } from "./meta/mathsa";
import { MATHSB_LABS } from "./meta/mathsb";
import { PHYSICS_LABS } from "./meta/physics";
import { CHEM_LABS } from "./meta/chem";
import { ELEC_LABS } from "./meta/elec";
import { ELEX_LABS } from "./meta/elex";
import { MECH_LABS } from "./meta/mech";
import { CPROG_LABS } from "./meta/cprog";
import { LIFE_LABS } from "./meta/life";
import { EXTRA_LABS } from "./meta/extra";
import { WEBA_LABS } from "./meta/weba";
import { WEBB_LABS } from "./meta/webb";
import { GFX_LABS } from "./meta/gfx";
import { PHYX_LABS } from "./meta/phyx";
import { CHEMX_LABS } from "./meta/chemx";
import { ELECX_LABS } from "./meta/elecx";
import { ELEXX_LABS } from "./meta/elexx";
import { MECHX_LABS } from "./meta/mechx";
import { PHYY_LABS } from "./meta/phyy";
import { CHEMY_LABS } from "./meta/chemy";
import { ELECY_LABS } from "./meta/elecy";
import { ELEXY_LABS } from "./meta/elexy";
import { MECHY_LABS } from "./meta/mechy";
import { CSTX_LABS } from "./meta/cstx";
import { BCAX_LABS } from "./meta/bcax";
import { BCAZ_LABS } from "./meta/bcaz";
import { BCAY_LABS } from "./meta/bcay";
import { MATHII_LABS } from "./meta/mathii";
import { MATHI_LABS } from "./meta/mathi";

export type { LabMeta, LabPreset } from "./types";

export const LABS: LabMeta[] = [...CORE_LABS, ...MATHSA_LABS, ...MATHSB_LABS, ...PHYSICS_LABS, ...CHEM_LABS, ...ELEC_LABS, ...ELEX_LABS, ...MECH_LABS, ...CPROG_LABS, ...LIFE_LABS, ...EXTRA_LABS, ...WEBA_LABS, ...WEBB_LABS, ...GFX_LABS, ...PHYX_LABS, ...CHEMX_LABS, ...ELECX_LABS, ...ELEXX_LABS, ...MECHX_LABS, ...MECHY_LABS, ...ELEXY_LABS, ...ELECY_LABS, ...CHEMY_LABS, ...PHYY_LABS, ...CSTX_LABS, ...MATHI_LABS, ...MATHII_LABS, ...BCAX_LABS, ...BCAY_LABS, ...BCAZ_LABS];

export const getLab = (id: string) => LABS.find((l) => l.id === id);
/** Labs attached to one syllabus unit. */
export const labsFor = (course: string, unit: number) => LABS.filter((l) => l.where.some(([c, u]) => c === course && u === unit));
