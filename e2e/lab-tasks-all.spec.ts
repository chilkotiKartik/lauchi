import { test, expect, type Page } from "@playwright/test";
import { LABS } from "../src/labs/registry";
import { visibleLabs } from "../src/lib/stream";
import { onboard, onboardAs, signIn, uniqueEmail, watch } from "./helpers";

/** Runs one predict → test → explain task on a lab; returns a problem description, or null when it worked. */
async function runTask(page: Page, id: string): Promise<string | null> {
  await page.goto(`/labs/${id}`);
  const tasks = page.getByTestId("lab-tasks");
  const groups = tasks.getByRole("radiogroup");
  try { await expect(groups.first()).toBeVisible({ timeout: 30_000 }); } catch { return "no predict-test task"; }
  for (let i = 0; i < await groups.count(); i++) await groups.nth(i).getByRole("radio").first().click();
  await tasks.getByRole("button", { name: "Lock in my prediction" }).click();
  const up = /raise/.test((await tasks.getByRole("heading", { level: 3 }).textContent()) ?? "");
  await tasks.getByRole("slider").focus(); await tasks.getByRole("slider").press(up ? "End" : "Home");
  await tasks.getByRole("button", { name: "Check what happened" }).click();
  const did = tasks.getByRole("list", { name: "What the lab did" });
  try { await expect(did).toBeVisible({ timeout: 10_000 }); } catch { return "task did not grade"; }
  const rows = await did.getByRole("listitem").allTextContents();
  if (!rows.length) return "graded no readings";
  // every row must report what happened; a lab where this control moves none of the other readings is a real (and
  // teachable) result, e.g. adding sources does not move interference maxima, so it is noted, not failed
  if (!rows.every((r) => /→/.test(r) && /It (rose|fell|changed|did not change)/.test(r))) return `a row did not explain itself: ${rows.join(" | ").slice(0, 200)}`;
  if (!rows.some((r) => / (rose|fell|changed)/.test(r))) console.log(`note ${id}: this control moved none of the other readings`);
  return null;
}

const cse = LABS.filter((l) => visibleLabs("CSE", [l]).length);
const other = LABS.filter((l) => !visibleLabs("CSE", [l]).length && visibleLabs("BCA", [l]).length); // labs of courses no branch takes are not reachable
const only = process.env.LABS?.split(",");
const pick = (xs: typeof LABS) => (only ? xs.filter((l) => only.includes(l.id)) : xs);
type Group = [string, typeof LABS, boolean];
const all: Group[] = only
  ? [["Chosen CSE labs", pick(cse), true], ["Chosen BCA labs", pick(other), false]]
  : [["CSE labs, first half", cse.slice(0, Math.ceil(cse.length / 2)), true], ["CSE labs, second half", cse.slice(Math.ceil(cse.length / 2)), true], ["BCA-only labs", other, false]];
const groups = all.filter(([, l]) => l.length > 0);

test.describe("lab tasks on every lab", () => {
  for (const [name, labs, isCse] of groups) {
    test(`${name} (${labs.length}): every lab's task builds, locks, tests and grades`, async ({ page }) => {
      test.setTimeout(labs.length * 45_000 + 60_000);
      const problems = watch(page);
      await signIn(page, uniqueEmail());
      if (isCse) await onboard(page); else await onboardAs(page, "Bachelor of Computer");
      const failures: string[] = [];
      for (const l of labs) {
        const p = await runTask(page, l.id).catch((e: Error) => `error: ${e.message.split("\n")[0]}`);
        if (p) failures.push(`${l.id}: ${p}`);
      }
      console.log(`${name}: ${labs.length - failures.length}/${labs.length} labs passed`);
      expect(failures).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});
