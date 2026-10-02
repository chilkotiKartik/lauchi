import { test } from "@playwright/test";
import { onboard, signIn, uniqueEmail, fakeYoutube } from "./helpers";
test("ovf", async ({ page }) => {
  await fakeYoutube(page); await signIn(page, uniqueEmail()); await onboard(page);
  for (const u of ["/pyq", "/pyq?course=EET-001&unit=2"]) {
  await page.goto(u); await page.waitForTimeout(500);
  const r = await page.evaluate(() => { const W = document.documentElement.clientWidth; const out: string[] = []; document.querySelectorAll("body *").forEach((e) => { const b = e.getBoundingClientRect(); if (b.right > W + 1 && getComputedStyle(e).position !== "fixed") out.push(`${e.tagName}.${(e as HTMLElement).className?.toString().slice(0, 60)} r=${Math.round(b.right)} w=${Math.round(b.width)} :: ${(e.textContent || "").slice(0, 60)}`); }); return { W, sw: document.documentElement.scrollWidth, out: out.filter((x) => !/^I\.|SVGAnimated/.test(x)).slice(0, 25) }; });
  console.log(u, JSON.stringify(r, null, 1));
  }
});
