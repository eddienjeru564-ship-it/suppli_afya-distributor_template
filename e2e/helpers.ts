import { expect, type Page } from "@playwright/test";

/** The sheet on top (selector, product, order or message). Queries are scoped to it: the page behind is inert. */
export const sheet = (page: Page) => page.locator("[data-sheet]").last();

export async function pick(page: Page, name: string | RegExp) {
  await sheet(page).getByRole("radio", { name, exact: typeof name === "string" }).click();
  await page.waitForTimeout(350);
}

export async function next(page: Page, label: string | RegExp = "Continue") {
  await sheet(page).getByRole("button", { name: label, exact: typeof label === "string" }).click();
  await page.waitForTimeout(350);
}

/** A question screen by its engine id. */
export const on = (page: Page, id: string) => sheet(page).locator(`[data-question="${id}"]`);

/**
 * Tick options, then move on. "None of these" and the like move on by themselves, so Continue is
 * only pressed if the question is still on screen once that pause (and its exit) has passed. The
 * question is found by the option being ticked, so a previous question still animating out is never
 * mistaken for this one.
 */
export async function tick(page: Page, ...names: (string | RegExp)[]) {
  const option = (n: string | RegExp) => page.getByRole("checkbox", { name: n, exact: typeof n === "string" });
  const found = sheet(page).locator("[data-question]", { has: option(names[0]) });
  await found.waitFor();
  const id = await found.getAttribute("data-question");
  // Pinned by id: ticking can rename an option ("Energy" becomes "1 Energy" in a ranked question).
  const question = sheet(page).locator(`[data-question="${id}"]`);
  for (const n of names) await question.getByRole("checkbox", { name: n, exact: typeof n === "string" }).click();
  await page.waitForTimeout(1000);
  if (await sheet(page).locator(`[data-question="${id}"]`).count()) await next(page);
}

/** Opens the selector from the first screen. */
export async function openSelector(page: Page) {
  await page.locator("#top").getByRole("button", { name: /Find My Recommendations/ }).click();
  await expect(sheet(page).getByRole("heading", { name: "Before we start" })).toBeVisible();
}

/** From "Before we start" to the goals question. */
export async function basics(page: Page, o: { name: string; sex?: "Female" | "Male"; age?: number; pregnancy?: string }) {
  await next(page, "I understand");
  await sheet(page).getByLabel("What should we call you?").fill(o.name);
  await next(page);
  await pick(page, o.sex ?? "Female");
  await sheet(page).getByLabel("How old are you?").fill(String(o.age ?? 34));
  await next(page);
  if ((o.sex ?? "Female") === "Female") await pick(page, o.pregnancy ?? "None of these");
  await pick(page, /Never/);
}

/** Daily life, with a typical set of answers. */
export async function dailyLife(page: Page) {
  for (const a of ["Mostly home-cooked", "One or two", "Every day", "Less than three glasses", "One or two", "Five to six", "None", "No"])
    await pick(page, a);
}

/** The safety section and plan size. */
export async function safety(page: Page, o: { conditions?: (string | RegExp)[]; medications?: (string | RegExp)[]; restrictions?: (string | RegExp)[] } = {}) {
  await tick(page, ...(o.conditions ?? ["None of these"]));
  await tick(page, ...(o.medications ?? ["None of these"]));
  await tick(page, ...(o.restrictions ?? ["None of these"]));
  await pick(page, /focused plan/);
}

/** A full walk: energy and digestion, no warnings. Ends on the results. */
export async function energyAndDigestion(page: Page, name = "Wanjiru") {
  await openSelector(page);
  await basics(page, { name });
  await tick(page, /^Energy/, /^Digestion/);
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await tick(page, "Constipation", "Bloating or gas");
  await pick(page, "Most weeks");
  await dailyLife(page);
  await safety(page);
}

/** Nothing on the page reaches past the viewport sideways. */
export async function fitsWidth(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const scrollsSideways = (e: Element) => {
      for (let p = e.parentElement; p; p = p.parentElement) {
        if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    return [...document.querySelectorAll("body *")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > width + 1 && !scrollsSideways(e);
      })
      .slice(0, 3)
      .map((e) => `${e.tagName}.${String(e.className).slice(0, 60)}`);
  });
}
