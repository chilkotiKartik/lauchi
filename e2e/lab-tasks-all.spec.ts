import { test, expect, type Page } from "@playwright/test";
import { LABS } from "../src/labs/registry";
import { canSeeLab } from "../src/lib/stream";
import { VIEWERS, onboardAs, signIn, uniqueEmail, watch } from "./helpers";

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

// each lab is tested as the first student (branch + semester) who can see it; labs of courses no branch takes are skipped
const viewerOf = (l: (typeof LABS)[number]) => VIEWERS.find((v) => canSeeLab({ branch: v.branch, semester: v.semester }, l));
const only = process.env.LABS?.split(",");
type Group = [string, typeof LABS, (typeof VIEWERS)[number]];
const groups: Group[] = VIEWERS.flatMap((v) => {
  const labs = LABS.filter((l) => viewerOf(l) === v && (!only || only.includes(l.id)));
  const half = Math.ceil(labs.length / 2);
  const name = `${v.branch} semester ${v.semester}`;
  return (labs.length > 60 ? [[`${name}, first half`, labs.slice(0, half), v], [`${name}, second half`, labs.slice(half), v]] : [[name, labs, v]]) as Group[];
}).filter(([, l]) => l.length > 0);

test.describe("lab tasks on every lab", () => {
  for (const [name, labs, v] of groups) {
    test(`${name} (${labs.length}): every lab's task builds, locks, tests and grades`, async ({ page }) => {
      test.setTimeout(labs.length * 45_000 + 60_000);
      const problems = watch(page);
      await signIn(page, uniqueEmail());
      await onboardAs(page, v.pattern, "Kalu", v.semester);
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
