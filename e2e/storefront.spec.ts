import { devices, expect, test } from "@playwright/test";
import { basics, dailyLife, energyAndDigestion, fitsWidth, next, on, openSelector, pick, safety, sheet, tick } from "./helpers";

test("the first screen says whose page it is, and offers both ways in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Kate Cromuel")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find the right wellness products for your goals.");
  const top = page.locator("#top");
  await expect(top.getByRole("button", { name: /Find My Recommendations/ })).toBeVisible();
  await expect(top.getByRole("link", { name: /Browse all \d+ products/ })).toBeVisible();
  // Placeholders are never passed off as facts: the preview says so, at the foot of the page.
  await expect(page.getByRole("contentinfo").getByText("Preview of Kate's page.")).toBeAttached();
  // Prices are on the page, not behind a message.
  await expect(page.getByText(/KES \d/).first()).toBeAttached();
});

test("browsing: find a product, read about it and send the order to the distributor", async ({ page }) => {
  await page.goto("/");
  await page.locator("#top").getByRole("link", { name: /Browse all \d+ products/ }).click();
  await page.getByPlaceholder("Search products").fill("probio");
  await page.locator("#products").getByRole("button", { name: /^Probio3, KES 3,900/ }).click();

  const detail = sheet(page);
  await expect(detail.getByRole("heading", { name: "Probio3" })).toBeVisible();
  for (const section of ["Often chosen for", "What's in it", "How it's taken", "What to expect", "Check before you buy"])
    await expect(detail.getByRole("heading", { name: section })).toBeVisible();
  await detail.getByRole("button", { name: /Add to order · KES 3,900/ }).click();
  await expect(page.getByRole("button", { name: "Your order: 1 item" })).toBeVisible();

  await page.getByRole("button", { name: "Your order: 1 item" }).click();
  await next(page, /Continue · KES 3,900/);
  await next(page, /Or send it to Kate on WhatsApp/);
  await expect(sheet(page).getByRole("alert")).toHaveText("Add your name so Kate knows who the order is from.");
  await sheet(page).getByLabel("Your name").fill("Wanjiru");
  await pick(page, /^Within Nairobi/);
  await pick(page, "M-Pesa");
  await next(page, /Or send it to Kate on WhatsApp/);

  // A preview page shows the exact WhatsApp message instead of opening a chat.
  const message = sheet(page);
  await expect(message.getByText("Hi Kate, I'd like to order from your page.")).toBeVisible();
  await expect(message.getByText("1 × Probio3 · KES 3,900")).toBeVisible();
  await expect(message.getByText(/Within Nairobi \(delivery cost to confirm\)/)).toBeVisible();
  await expect(message.getByText(/Order ref: KC-[A-Z2-9]{4}/)).toBeVisible();
  await message.getByRole("button", { name: "Done" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Now press send in WhatsApp." })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Done" }).click();

  // Next time: the order is empty, and the last one is one tap away.
  await page.getByRole("button", { name: "Your order", exact: true }).click();
  await expect(sheet(page).getByText("Your order is empty.")).toBeVisible();
  await sheet(page).getByRole("button", { name: "Order the same again" }).click();
  await expect(sheet(page).getByText("Probio3")).toBeVisible();
});

test("ordering without WhatsApp: place the order on the page and it goes to the distributor", async ({ page }, info) => {
  await page.goto("/?p=arthroxtra");
  await sheet(page).getByRole("button", { name: /Add to order · KES 4,700/ }).click();
  await page.goto("/?order");
  await next(page, /Continue · KES 4,700/);
  await sheet(page).getByLabel("Your name").fill("Wanjiru");
  await pick(page, /^Within Nairobi/);
  await pick(page, "Cash on delivery");
  await next(page, /Place order · KES 4,700/);
  await expect(sheet(page).getByRole("alert")).toHaveText("Add your phone number so Kate can confirm with you.");
  await sheet(page).getByLabel("Phone number").fill("0712 345 678");
  await next(page, /Place order · KES 4,700/);
  await expect(sheet(page).getByRole("heading", { name: "Kate has your order." })).toBeVisible();
  await expect(sheet(page).getByText(/call or message you on 0712 345 678/)).toBeVisible();
  // This page is a preview, and says so.
  await expect(sheet(page).getByText("This page is a preview, so the order wasn't sent to anyone.")).toBeVisible();
  // The page behind the confirmation stays put (no scroll-lock padding appearing on a phone).
  if (info.project.name === "mobile") expect(await page.evaluate(() => document.documentElement.style.paddingRight)).toBe("");
  await sheet(page).getByRole("button", { name: "Done" }).click();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
});

test("help me choose: suggestions come with the reason, the price and a way to order", async ({ page }) => {
  await page.goto("/");
  await energyAndDigestion(page);
  const results = sheet(page);
  await expect(results.getByRole("heading", { name: "Wanjiru, here's what fits." })).toBeVisible();
  // The whole plan in a sentence, then one goal at a time, in the order they were ranked.
  await expect(results.getByText(/^Two products for energy and digestion\. KES/)).toBeVisible();
  const goals = results.locator("section[aria-labelledby^='goal-'] h2");
  await expect(goals).toHaveText(["Energy", "Digestion"]);
  // Each product says why it came up, with its price and its own add.
  await expect(results.locator("section[aria-labelledby='goal-energy'] article li").first()).toBeVisible();
  await expect(results.locator("section[aria-labelledby='goal-energy']").getByRole("button", { name: /^Add .+ to your order$/ })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Small changes that help" })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Want to talk it through?" })).toBeVisible();

  await results.getByRole("button", { name: "Add the whole plan" }).click();
  const order = sheet(page);
  await expect(order.getByRole("heading", { name: "Your order" })).toBeVisible();
  await expect(order.getByText("Suggested for you")).toHaveCount(2);

  // The engine's own handoff message goes to the distributor.
  await order.getByRole("button", { name: "Close" }).click();
  await sheet(page).getByRole("button", { name: /Send to Kate on WhatsApp/ }).click();
  await expect(sheet(page).getByText("Hi Kate, I've just done the assessment on your page.")).toBeVisible();
  await sheet(page).getByRole("button", { name: "Done" }).click();

  // Back on the page, the result stays with the customer.
  await sheet(page).getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("#choose").getByText("Your recommendations")).toBeVisible();
});

test("the questions flow on their own, and a quick extra tap never skips one", async ({ page }) => {
  await page.goto("/");
  await openSelector(page);
  await basics(page, { name: "Wanjiru" });
  await tick(page, /^Energy/);
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");

  // A double tap on a one-tap answer moves on once.
  await sheet(page).getByRole("radio", { name: "Mostly home-cooked" }).dblclick();
  await expect(on(page, "veg")).toBeVisible();
  await page.waitForTimeout(800);
  await expect(on(page, "veg")).toBeVisible();
  for (const a of ["One or two", "Every day", "Less than three glasses", "One or two", "Five to six", "None", "No"]) await pick(page, a);

  // "None of these" moves on by itself.
  await expect(on(page, "conditions")).toBeVisible();
  await sheet(page).getByRole("checkbox", { name: "None of these" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Do you take any of these regularly?" })).toBeVisible();

  // Tapping Continue straight after doesn't move on twice.
  await sheet(page).getByRole("checkbox", { name: "None of these" }).click();
  await sheet(page).getByRole("button", { name: "Continue", exact: true }).click();
  await expect(on(page, "restrictions")).toBeVisible();
  await page.waitForTimeout(900);
  await expect(on(page, "restrictions")).toBeVisible();

  await tick(page, "None of these");
  await sheet(page).getByRole("radio", { name: /focused plan/ }).click();
  // A short "putting it together" moment, then the result.
  await expect(sheet(page).getByRole("status")).toContainText("putting your recommendations together");
  await expect(sheet(page).getByRole("heading", { name: /^Wanjiru, here's/ })).toBeVisible();
  await expect(sheet(page).getByRole("heading", { name: "Energy", exact: true })).toBeVisible();
  // Reading starts at the title.
  await expect(sheet(page).getByRole("heading", { level: 1 })).toBeFocused();
});

test("the order keeps count: add from a card, change it, and the whole plan never doubles up", async ({ page }) => {
  await page.goto("/");
  const products = page.locator("#products");
  await products.getByRole("button", { name: "Add Probio3 to your order" }).click();
  await expect(page.getByRole("button", { name: "Your order: 1 item" })).toBeVisible();
  await products.getByRole("button", { name: "One more Probio3" }).click();
  await expect(page.getByRole("button", { name: "Your order: 2 items" })).toBeVisible();
  await products.getByRole("button", { name: "One fewer Probio3" }).click();
  await products.getByRole("button", { name: "Remove Probio3" }).click();
  await expect(page.getByRole("button", { name: "Your order", exact: true })).toBeVisible();
  await expect(products.getByRole("button", { name: "Add Probio3 to your order" })).toBeVisible();

  // The whole plan, twice: the second time it only shows what's already there.
  await energyAndDigestion(page);
  await sheet(page).getByRole("button", { name: /Add the whole plan/ }).click();
  await expect(sheet(page).getByText("Suggested for you")).toHaveCount(2);
  await sheet(page).getByRole("button", { name: "Close" }).click();
  // The plan's action now shows the order instead (a bar on phones, the summary on large screens).
  await expect(sheet(page).getByRole("button", { name: /In your order · View|Review order/ })).toBeVisible();
  await expect(sheet(page).getByRole("button", { name: "Your order: 2 items" })).toBeVisible();
  // Survives a reload.
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Your order: 2 items" })).toBeVisible();
});

test("safety: a product that doesn't suit is left out, and the reason is given", async ({ page }) => {
  await page.goto("/");
  await openSelector(page);
  await basics(page, { name: "Amani", age: 62 });
  await tick(page, /^Joints/, /^Energy/);
  await tick(page, /Pain when I walk/);
  await pick(page, "More than a year");
  await pick(page, "No");
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await dailyLife(page);
  await safety(page, { medications: ["Blood pressure medicine"], restrictions: [/I avoid pork/] });

  const results = sheet(page);
  await expect(results.getByText("Check with your doctor or pharmacist first")).toBeVisible();
  await expect(results.getByRole("heading", { name: "Left out for you" })).toBeVisible();
  await expect(results.getByText("One of its ingredients comes from pork, which you avoid.")).toBeVisible();
  await expect(results.getByRole("heading", { name: "ArthroXtra Tablets" })).toBeVisible();
});

test("pregnancy: clinic first, and nothing is offered for sale", async ({ page }) => {
  await page.goto("/");
  await openSelector(page);
  await basics(page, { name: "Amina", pregnancy: "Pregnant" });
  await tick(page, /^Energy/);
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await dailyLife(page);
  await safety(page);
  const results = sheet(page);
  await expect(results.getByRole("heading", { name: "Amina, let's start with your clinic." })).toBeVisible();
  await expect(results.getByText("Speak to your clinic first")).toBeVisible();
  await expect(results.getByRole("button", { name: /^Add/ })).toHaveCount(0);
});

test("interests picked on the page carry into the questions, and are never asked twice", async ({ page }) => {
  await page.goto("/");
  const choose = page.locator("#choose");
  await choose.getByRole("button", { name: /^Energy/ }).click();
  await choose.getByRole("button", { name: /^Digestion/ }).click();
  await expect(choose.getByRole("button", { name: /^Energy/ })).toHaveAttribute("aria-pressed", "true");
  await choose.getByRole("button", { name: "Continue", exact: true }).click();

  // The opening screen says what came with them; the safety and privacy screen is still there.
  await expect(sheet(page).getByText("You'd like help with")).toBeVisible();
  await expect(sheet(page).getByRole("heading", { name: "Before we start" })).toBeVisible();
  await basics(page, { name: "Wanjiru" });

  // Straight from the basics to the first follow-up: no goals question.
  await expect(sheet(page).getByText(/You picked Energy and Digestion/)).toBeVisible();
  await expect(sheet(page).getByRole("heading", { name: "How would you rate your energy on most days?" })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Back" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Do you take any supplements at the moment?" })).toBeVisible();
  await pick(page, /Never/);

  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await tick(page, "Constipation", "Bloating or gas");
  await pick(page, "Most weeks");
  await dailyLife(page);
  await safety(page);
  // The picks, in the order they were picked, are the goals the result answers.
  await expect(sheet(page).locator("section[aria-labelledby^='goal-'] h2")).toHaveText(["Energy", "Digestion"]);
});

test("interests stay picked when you come back, up to three, and can be changed in the questions", async ({ page }) => {
  await page.goto("/");
  const choose = page.locator("#choose");
  await choose.getByRole("button", { name: /View all interests/ }).click();
  await choose.getByRole("button", { name: /^Joints & bones/ }).click();
  await choose.getByRole("button", { name: /^Focus & memory/ }).click();
  await choose.getByRole("button", { name: /^Energy/ }).click();
  // A fourth is refused, with a way out.
  await choose.getByRole("button", { name: /^Immunity/ }).click({ force: true });
  await expect(choose.getByText(/Tap one you've chosen to swap it/)).toBeVisible();
  await expect(choose.getByRole("button", { name: /^Immunity/ })).toHaveAttribute("aria-pressed", "false");

  await choose.getByRole("button", { name: "Continue", exact: true }).click();
  await sheet(page).getByRole("button", { name: /^Close/ }).click();
  await page.reload();
  // Still picked after leaving and reloading, including one from the longer list.
  await expect(choose.getByRole("button", { name: /^Focus & memory/ })).toHaveAttribute("aria-pressed", "true");
  await expect(choose.getByRole("button", { name: /^Joints & bones/ })).toHaveAttribute("aria-pressed", "true");

  await choose.getByRole("button", { name: "Continue", exact: true }).click();
  await basics(page, { name: "Otieno", sex: "Male", age: 50 });
  await expect(sheet(page).getByRole("heading", { name: "What's going on with your joints or bones?" })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Change", exact: true }).click();
  await expect(sheet(page).getByRole("checkbox", { name: /Joints & bones/ })).toHaveAttribute("aria-checked", "true");
  await expect(sheet(page).getByRole("checkbox", { name: /Focus & memory/ })).toHaveAttribute("aria-checked", "true");
});

test("continuing without picking an interest asks about goals in the questions, as usual", async ({ page }) => {
  await page.goto("/");
  await page.locator("#choose").getByRole("button", { name: "Continue", exact: true }).click();
  await basics(page, { name: "Amani" });
  await expect(sheet(page).getByRole("heading", { name: "What would you most like to improve?" })).toBeVisible();
});

test("products have their own links, and the back button closes a sheet instead of leaving", async ({ page }) => {
  await page.goto("/?p=probio3");
  await expect(sheet(page).getByRole("heading", { name: "Probio3" })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Close" }).first().click();
  await expect(page).toHaveURL(/\/$/);

  await page.locator("#products").getByRole("button", { name: /^Refined Yunzhi Essence, KES/ }).click();
  await expect(page).toHaveURL(/\?p=refined-yunzhi/);
  await page.goBack();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("closing stacked sheets quickly never reopens one, and back closes the selector", async ({ page }) => {
  await page.goto("/");
  await energyAndDigestion(page);
  await sheet(page).getByRole("button", { name: "Add the whole plan" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Your order" })).toBeVisible();
  // Two closes back to back, before the first history step has landed.
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await page.locator("[data-sheet]").first().getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  // The phone's back button closes the selector rather than leaving the page.
  await page.locator("#choose").getByRole("button", { name: /Why these came up/ }).click();
  await expect(sheet(page).getByRole("heading", { name: /here's what fits/ })).toBeVisible();
  await page.goBack();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("small phones: nothing is wider than the screen, on the page or in a sheet", async ({ browser }, info) => {
  test.skip(info.project.name !== "mobile", "phones only");
  const ctx = await browser.newContext({ ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, baseURL: info.project.use.baseURL });
  const page = await ctx.newPage();
  await page.goto("/");
  expect(await fitsWidth(page), "page").toEqual([]);
  await page.goto("/?p=youth-essence");
  await expect(sheet(page).getByRole("heading", { name: "Youth Essence Skincare" })).toBeVisible();
  expect(await fitsWidth(page), "product").toEqual([]);
  await page.goto("/");
  await energyAndDigestion(page);
  expect(await fitsWidth(page), "results").toEqual([]);
  await sheet(page).getByRole("button", { name: "Add the whole plan" }).click();
  await next(page, /Continue · KES/);
  expect(await fitsWidth(page), "order").toEqual([]);
  // The page itself once it's showing the customer's suggestions.
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await sheet(page).getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("#choose").getByText("Your recommendations")).toBeVisible();
  expect(await fitsWidth(page), "page with a result").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await ctx.close();
});

test.describe("order API", () => {
  const details = { name: "Wanjiru", receive: "delivery", areaId: "nairobi", payment: "mpesa" };

  test("prices come from the price list, never from the browser", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: { slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 2, price: 1 }], details },
    });
    expect(res.ok()).toBe(true);
    expect(await res.json()).toMatchObject({ ok: true, ref: "KC-AB23", total: 7800, totalConfirmed: false, filed: false, forwarded: false });
  });

  test("turns away orders that can't be right", async ({ request }) => {
    const post = (data: object) => request.post("/api/orders", { data });
    expect((await post({ slug: "nobody", ref: "KC-AB23", items: [], details })).status()).toBe(404);
    expect((await post({ slug: "kate", ref: "nope", items: [{ id: "probio3", qty: 1 }], details })).status()).toBe(400);
    expect((await post({ slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 1 }], details: { ...details, name: "" } })).status()).toBe(422);
    expect((await post({ slug: "kate", ref: "KC-AB23", items: [{ id: "not-sold", qty: 1 }], details })).status()).toBe(422);
  });

  test("placing on the page needs a phone number, and a preview never sends it anywhere", async ({ request }) => {
    const place = (d: object) => request.post("/api/orders", { data: { slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 1 }], details: d, place: true } });
    expect((await place(details)).status()).toBe(422);
    const res = await place({ ...details, phone: "0712345678" });
    expect(await res.json()).toMatchObject({ ok: true, placed: true, preview: true, total: 3900 });
  });

  test("leads are only passed on from a live, connected storefront", async ({ request }) => {
    const bad = await request.post("/api/leads", { data: { slug: "kate", answers: {}, ref: "bad" } });
    expect(bad.status()).toBe(400);
    const ok = await request.post("/api/leads", { data: { slug: "kate", answers: { first_name: "Wanjiru" }, ref: "SA-AB23" } });
    expect(await ok.json()).toEqual({ ok: true, forwarded: false });
  });
});
