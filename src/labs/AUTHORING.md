# Writing a lockin. 3D lab

Each lab is a real-time react-three-fiber simulation whose every number comes from maths you can unit-test.
Students must be able to **type exact values**, **try ready-made experiments** and **save setups**, so every
adjustable value goes through `useLabParams` with a spec.

## Files for a group `<g>` (e.g. `physics`) and lab id `<id>` (lowercase letters/digits, 2–24 chars)

| File | What goes in it |
| --- | --- |
| `src/labs/sim/<g>.ts` | Pure maths for the group's labs. No React, no three. |
| `src/labs/sim/<g>.test.ts` | Vitest tests of that maths against textbook values and limiting cases. |
| `src/labs/scenes/<id>.tsx` | The scene (default export), `"use client"`. |
| `src/labs/meta/<g>.specs.ts` | `export const <G>_SPECS = { <id>: { key: num(default, min, max), mode: opt("a", ["a", "b"] as const), on: flag(false) } } satisfies Record<string, ParamSpec>;` |
| `src/labs/meta/<g>.ts` | `export const <G>_LABS: LabMeta[]` — id, title, blurb, `where: [["AHT-001", 1]]` (real course code + unit), topics, animated, presets (2–3, each `{ name, note, values }`, values inside the spec ranges). |
| `src/labs/meta/<g>.scenes.tsx` | `export const <G>_SCENES = { <id>: load(() => import("../scenes/<id>")), … }` with `import { load } from "../load";` — keep that exact text shape. |

Registry, loaders and specs are already wired to these files.

## Scene skeleton

```tsx
"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { myMaths } from "../sim/<g>";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider, Pick, Check } from "../ui";
import { useLabParams } from "../params";
import { <G>_SPECS } from "../meta/<g>.specs";

export default function MyLab() {
  const [P, set, reset] = useLabParams(<G>_SPECS.<id>);
  const { R, f } = P;
  const out = myMaths(R, f);                       // readouts come ONLY from params (never from animation time)
  const mesh = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); mesh.current?.rotation.set(0, t.current, 0); };
  return (
    <LabFrame
      label="One sentence describing what the 3D view shows (screen-reader text)"
      camera={[0, 1, 8]}
      animated={true}                               // false → the canvas only redraws on change (no idle GPU use)
      onReset={reset}
      scene={() => (<group><Tick fn={tick} /> … </group>)}
      readouts={[["Impedance Z", `${out.Z.toFixed(1)} Ω`], …]}  // 3–6 items
      controls={<>
        <Slider label="Resistance R" value={R} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("R", x)} />
        …
      </>}
      note={<p>Explain the physics/maths, the formula, and what to try. Say "simplified model" where it is one.</p>}
    />
  );
}
```

## Hard rules (the browser test checks the first four on every lab)

1. The canvas must show **real colour** from the default camera: fill a good part of the view with coloured meshes/lines (the test needs > 6 distinct colours in a 96×96 downscale).
2. The **first `<Slider>`** in `controls` must change at least one readout's *displayed text* when moved 6 steps right from its default (so its default must not sit at its max).
3. **Reset** must restore exactly the default readouts → readouts depend only on params, never on time or randomness.
4. **No console errors, no network requests.** Never use drei `Text`, `Text3D`, `Html`, `Environment`, `useTexture`, `useGLTF` or any loader (they fetch files and the CSP blocks them). Labels belong in readouts / notes.
5. **Tabs show real content only.** Theory is your `note`. Procedure is written from the lab's presets and readouts unless you pass `steps`. Intuition and Viva appear only when you pass `intuition` / `viva`, so write them for the lab or leave them out; never generic text. Lighting, the bench and shadows come from `Stage`; scenes should not add their own environment maps.
6. Slider min/max/defaults must match the spec. Every `Slider` label unique in the lab. Use `Pick` for `opt`, `Check` for `flag`.
7. React Compiler lint: never mutate props, state or hook results during render; never call `Math.random()` in render (use a small seeded PRNG in the sim file); do per-frame mutation of geometries in **module-level helper functions** called from `Tick` (see `scenes/interference.tsx` `paintWave`), or through refs; any component that needs `useLayoutEffect` on instanced mesh refs must be its own inner component. No `setState` inside effects.
8. `useFrame` only inside the Canvas → use `<Tick fn={…} />` inside `scene`.

## Performance (no lag on a ₹10k phone)

- Keep per-frame work tiny: ≤ ~10k vertices rewritten per frame; no allocation inside `tick` (reuse vectors/arrays in refs or module scope); cap `dt` with `Math.min(dt, 0.05)`.
- > 40 repeated objects → `instancedMesh`. Sphere segments ≤ 24. Read `useQuality()` and halve detail on `"low"`.
- Heavy maths (integration, sampling) in `useMemo` keyed on params, never per frame.
- Static labs: `animated={false}`.

## Quality bar

- Correct science first: textbook formulas, SI units, sensible ranges. Unit-test key values (e.g. critical angle of glass/air 41.8°, Carnot 300/600 K = 50%).
- Colours from the app palette: green `#44c95a`, blue `#2ba6f5`, red `#ff5a5f`, gold `#ffc83d`, purple `#a970ff`, orange `#ff9a1f`, grey `#5b6d77` / `#9db0ba`. Background is dark `#0f1a20`.
- Make it 3D and alive: depth, a slowly moving element, a part that responds to every slider.

## Check your work

```
npx tsc --noEmit                     # errors in files that are not yours may be another author's work in progress: report, don't fix
npx eslint <your files>
npx vitest run src/labs/sim/<g>.test.ts src/labs/registry.test.ts
```
Do not run `next build`, `next dev` or Playwright (the integrator does that).
