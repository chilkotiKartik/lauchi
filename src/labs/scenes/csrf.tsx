"use client";
import { csrfGuess } from "../sim/weba";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { human } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const sci = (x: number) => (x < 1e6 ? Math.round(x).toLocaleString("en-US") : `${x.toExponential(1).replace("e+", " × 10^")}`);
const pct = (p: number) => (p >= 0.9999 ? "≈ 100%" : p >= 0.0001 ? `${(p * 100).toFixed(3)}%` : `${p.toExponential(1).replace("e-", " × 10^-")}`);

export default function CsrfLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.csrf);
  const bytes = Math.round(P.bytes), g = csrfGuess(bytes, P.rate, P.life);
  return (
    <LabFrame
      label="A row of green blocks, one per byte of the token, above two columns: the token's size in bits in blue and the number of guesses an attacker makes in red, both on a base-2 log scale"
      camera={[0, 0.8, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.9, -0.7]} w={8.2} h={1.1} />
          {Array.from({ length: bytes }, (_, i) => <Box key={i} p={[-3.7 + i * 0.24, 0.9, 0]} s={[0.18, 0.5, 0.3]} c={C.green} glow={0.3} />)}
          <Panel p={[0, -0.4, -0.7]} w={8.2} h={2.4} />
          <Bars values={[g.bits, Math.min(g.log2Attempts, 256)]} max={256} colors={[C.blue, C.red]} x0={-0.6} y0={-1.5} w={0.7} gap={0.5} height={2.0} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Token size", `${g.bits} bits (${bytes} bytes)`],
        ["Possible tokens", sci(g.space)],
        ["Guesses in the token lifetime", sci(g.attempts)],
        ["Chance of guessing it", pct(g.p)],
        ["Time for a 50% chance", human(g.halfSeconds)],
      ]}
      controls={<>
        <Slider label="Token length" value={bytes} min={1} max={32} step={1} digits={0} unit=" bytes" onChange={(x) => set("bytes", Math.round(x))} />
        <Slider label="Attacker's guesses per second" value={P.rate} min={1} max={1000000} step={100} digits={0} onChange={(x) => set("rate", x)} />
        <Slider label="Token lifetime" value={P.life} min={1} max={1440} step={10} digits={0} unit=" min" onChange={(x) => set("life", x)} />
      </>}
      note={<p>A CSRF (authenticity) token is a random secret the server puts in each form; a forged request from another site cannot include it. That only works if it cannot be guessed. A token of b random bytes has 2^(8b) possibilities, and an attacker who makes r guesses a second for the token&apos;s lifetime succeeds with probability about r × lifetime / 2^(8b). The blue column is the token&apos;s size in bits and the red column is log₂ of the guesses; the token is safe while the blue column is far taller. Use 16 or more bytes from a cryptographic random generator. This assumes the attacker can submit guesses unhindered; rate limiting helps further.</p>}
    />
  );
}
