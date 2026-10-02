import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { signIn, uniqueEmail, onboardAs, addXp } from "../e2e/helpers";

const OUT = "/home/claude/shots2";
for (const stream of [{ n: "cse", pat: "Computer Science & Engineering" }, { n: "bca", pat: "Bachelor of Computer" }]) {
  test(`snapshots ${stream.n}`, async ({ page }, info) => {
    test.setTimeout(600_000);
    const dir = `${OUT}/${info.project.name}-${stream.n}`; fs.mkdirSync(dir, { recursive: true });
    let idx = 0;
    const shot = async (name: string, full = true) => { await page.waitForTimeout(1200); try { await page.screenshot({ path: `${dir}/${String(++idx).padStart(2, "0")}-${name}.png`, fullPage: full, timeout: 30000 }); } catch {} };
    const go = async (p: string, name: string, full = true) => { try { await page.goto(p, { waitUntil: "networkidle" }); await shot(name, full); } catch (e) { console.log("FAIL", p, String(e).slice(0, 120)); } };
    const email = uniqueEmail();
    await signIn(page, email);
    await onboardAs(page, stream.pat);
    for (const d of [1, 2, 3, 5]) await addXp(email, 30 + d * 4, d);
    await go("/home", "home");
    await page.waitForTimeout(3500); await shot("home-3d-live", false);
    await go("/syllabus", "syllabus");
    await go("/labs", "labs-index");
    await go("/pyq", "pyq");
    await go("/resources", "resources");
    await go("/labs?course=AHT-003&unit=4", "labs-browser-maths");
    await go("/revise", "revise");
    await go("/paper", "paper");
    await go("/friends", "friends");
    if (stream.n === "cse") {
      await go("/labs/gradient", "lab-gradient", false);
      await go("/labs/eigen3d", "lab-eigen3d", false);
      await go("/labs/residues", "lab-residues", false);
      await go("/labs/thevenin", "lab-thevenin", false);
      await go("/labs/rings", "lab-rings", false);
      await go("/labs/kmap", "lab-kmap", false);
      await go("/labs/cpipeline", "lab-cpipeline", false);
      await go("/labs/biprism", "lab-biprism", false);
      await go("/labs/hesslaw", "lab-hess", false);
      await go("/labs/kirchhoff", "lab-kirchhoff", false);
      await go("/labs/elastic", "lab-elastic", false);
      await go("/labs/tunnel", "lab-tunnel", false);
      await go("/pyq?course=AHT-003&unit=2", "pyq-maths1");
      await go("/pyq?course=CST-001", "pyq-c");
    } else {
      await go("/labs/dsbst", "lab-bst", false);
      await go("/labs/coacache", "lab-cache", false);
      await go("/labs/ctrlflow", "lab-ctrlflow", false);
      await go("/labs/sortstack", "lab-sortstack", false);
      await go("/pyq?course=BCA-001", "pyq-bca");
      await go("/syllabus?type=all&q=BCA", "syllabus-search");
    }
    await go("/settings", "settings");
    expect(true).toBe(true);
  });
}
