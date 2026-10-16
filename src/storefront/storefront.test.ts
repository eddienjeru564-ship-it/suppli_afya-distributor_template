import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOGUE, PRODUCTS_BY_ID, QUESTIONS_BY_ID, recommend, type Answers } from "@/engine";
import { STOREFRONTS, storefrontBySlug } from "@/storefronts";
import { kate } from "@/storefronts/kate";
import { engineDrift } from "../../scripts/engine.mjs";
import { cartReducer, priceCart, sanitiseCart, MAX_QTY, type CartItem } from "./cart";
import { askMessage, whatsappHref } from "./messages";
import { amount, kes } from "./money";
import {
  ORDER_REF,
  canPlaceOrders,
  deliveryFeeLabel,
  detailsProblem,
  emptyDetails,
  initials,
  newOrderRef,
  normalisePhone,
  orderMessage,
  orderRecord,
  placeProblem,
  priceOrder,
  type OrderDetails,
} from "./order";
import photos from "./product-photos.json";
import { checkNotes, listings, matchesQuery, oneLiner, packOf, shortName, supplyLabel, supplyShort } from "./products";
import { nextShown, partProgress, previousShown, resumeAt, sectionLead } from "./progress";
import { answeredCount, perDay, planView, youSaid } from "./plan";
import { priceSuggestions } from "./suggestions";
import type { Storefront } from "./types";
import { contrast, validateStorefront } from "./validate";

/** A storefront that is live, with a number, fees and pickup, for exercising every branch. */
const live: Storefront = {
  ...kate,
  slug: "test",
  status: "live",
  pending: [],
  distributor: { ...kate.distributor, name: "Amani Otieno", firstName: "Amani", whatsapp: "254700000001" },
  catalogue: { ...kate.catalogue, offers: { probio3: { price: 3900 }, "veggie-veggie": { price: 4100 }, constirelax: { price: 3600, inStock: false } }, featured: ["veggie-veggie"] },
  fulfilment: {
    delivery: { areas: [{ id: "cbd", label: "Nairobi CBD", fee: 200 }, { id: "far", label: "Upcountry", fee: null }] },
    pickup: { label: "Collect in Westlands" },
  },
  payment: { methods: ["mpesa", "cash"], mpesa: { kind: "till", number: "123456" } },
};

describe("the engine", () => {
  it("is an unmodified copy of the Suppli Afya engine", () => {
    expect(engineDrift()).toEqual([]);
  });
});

describe("storefront configuration", () => {
  it("every storefront is valid", () => {
    for (const sf of STOREFRONTS) expect(validateStorefront(sf)).toEqual([]);
    expect(validateStorefront(live)).toEqual([]);
  });

  it("slugs are unique and resolvable", () => {
    expect(new Set(STOREFRONTS.map((s) => s.slug)).size).toBe(STOREFRONTS.length);
    for (const sf of STOREFRONTS) expect(storefrontBySlug(sf.slug)).toBe(sf);
  });

  it("catches mistakes a person could make", () => {
    const broken: Storefront = {
      ...live,
      status: "live",
      pending: ["prices"],
      distributor: { ...live.distributor, whatsapp: "0712 345 678" },
      catalogue: { ...live.catalogue, offers: { "not-a-product": { price: 3.5 } }, featured: ["probio3"] },
      theme: { ...live.theme, accent: "#f5f0a0" },
    };
    const problems = validateStorefront(broken).join("\n");
    expect(problems).toMatch(/whatsapp must be digits/);
    expect(problems).toMatch(/pending placeholders/);
    expect(problems).toMatch(/not a product/);
    expect(problems).toMatch(/whole shillings/);
    expect(problems).toMatch(/featured "probio3"/);
  });

  it("rejects an accent colour that white text can't sit on", () => {
    expect(validateStorefront({ ...live, theme: { ...live.theme, accent: "#e7d9ff" } }).join()).toMatch(/readable/);
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("a preview storefront never links to a real WhatsApp number", () => {
    const preview = { ...live, status: "preview" as const };
    expect(whatsappHref(preview, "hi")).toBeNull();
    expect(whatsappHref(live, "hi")).toBe("https://wa.me/254700000001?text=hi");
  });
});

describe("product illustrations", () => {
  it("never print words on a drawn pack (that would be a made-up label)", () => {
    const src = readFileSync(join(__dirname, "../components/product/PackArt.tsx"), "utf8");
    const label = src.slice(src.indexOf("function Label("), src.indexOf("const paper ="));
    expect(label).not.toMatch(/product\.(name|line)|shortName|FORMAT_LABEL/);
  });
});

describe("components stay distributor-agnostic", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
    });
  it("no distributor's name is written into the UI", () => {
    const root = join(import.meta.dirname, "..");
    const names = STOREFRONTS.flatMap((s) => [s.distributor.name, s.distributor.firstName]);
    for (const file of [...files(join(root, "components")), ...files(join(root, "app"))]) {
      const src = readFileSync(file, "utf8");
      for (const n of names) expect(src.includes(n), `${file} mentions ${n}`).toBe(false);
    }
  });
});

describe("money", () => {
  it("formats shillings the same everywhere", () => {
    expect(kes(3900)).toBe("KES 3,900");
    expect(kes(1234567)).toBe("KES 1,234,567");
    expect(amount(950)).toBe("950");
    expect(amount(-1200)).toBe("-1,200");
  });
});

describe("products", () => {
  it("lists what the distributor sells, featured first", () => {
    const l = listings(live);
    expect(l.map((x) => x.product.id)).toEqual(["veggie-veggie", "probio3", "constirelax"]);
    expect(listings(kate).length).toBe(Object.keys(kate.catalogue.offers).length);
    expect(listings(kate).slice(0, kate.catalogue.featured.length).map((x) => x.product.id)).toEqual(kate.catalogue.featured);
  });

  it("puts products with an official photo before drawn packs, after the featured ones", () => {
    const rest = listings(kate).slice(kate.catalogue.featured.length);
    const photo = rest.map((x) => x.product.id in photos);
    expect(photo.indexOf(false)).toBeGreaterThan(0);
    expect(photo.slice(photo.indexOf(false))).not.toContain(true);
  });

  it("shows what one pack holds, from the label, unless the distributor sells a different pack", () => {
    expect(packOf(PRODUCTS_BY_ID["arthroxtra"])).toBe("60 tablets");
    expect(packOf(PRODUCTS_BY_ID["arthroxtra"], { price: 1, pack: "30 tablets" })).toBe("30 tablets");
    expect(packOf(PRODUCTS_BY_ID["veggie-veggie"])).toBeNull();
    // Pack sizes were read off the official photos, so every product with a photo has one.
    for (const id of Object.keys(photos)) expect(PRODUCTS_BY_ID[id].pack, id).toBeTruthy();
  });

  it("searches names, ingredients, formats and goals", () => {
    const p = PRODUCTS_BY_ID;
    expect(matchesQuery(p["probio3"], "PROBIO")).toBe(true);
    expect(matchesQuery(p["cerebrain"], "ginkgo")).toBe(true);
    expect(matchesQuery(p["reishi-coffee"], "coffee")).toBe(true);
    expect(matchesQuery(p["constirelax"], "digestion")).toBe(true);
    expect(matchesQuery(p["constirelax"], "joints")).toBe(false);
    expect(matchesQuery(p["probio3"], "  ")).toBe(true);
  });

  it("shortens names for packs and summaries for cards", () => {
    expect(shortName(PRODUCTS_BY_ID["arthroxtra"])).toBe("ArthroXtra");
    expect(shortName(PRODUCTS_BY_ID["probio3"])).toBe("Probio3");
    for (const p of CATALOGUE) {
      expect(oneLiner(p).length).toBeGreaterThan(10);
      expect(oneLiner(p).length).toBeLessThanOrEqual(p.summary.length);
    }
  });

  it("describes supply in plain words", () => {
    expect(supplyLabel(8)).toBe("About a week per pack");
    expect(supplyLabel(11)).toBe("About ten days per pack");
    expect(supplyLabel(15)).toBe("About two weeks per pack");
    expect(supplyLabel(20)).toBe("About three weeks per pack");
    expect(supplyLabel(30)).toBe("About a month per pack");
    expect(supplyLabel(45)).toBe("About six weeks per pack");
    expect(supplyShort(30)).toBe("lasts about a month");
    expect(supplyShort(11)).toBe("lasts about ten days");
  });

  it("says what every safety trait means, and nothing else", () => {
    // If the engine gains a trait, this fails until the product page knows how to explain it.
    const explained = new Set(["shellfish", "pork", "porkUnconfirmed", "soy", "caffeine", "mayContainSugar", "stimulant", "clotting", "lowersBloodSugar", "mayLowerBp", "moodMedInteraction", "immuneActive", "sexualHealth", "topical", "notInPregnancy"]);
    const silent = new Set(["premium"]); // premium isn't a safety fact
    for (const p of CATALOGUE) {
      for (const [trait, value] of Object.entries(p.traits)) {
        if (!value) continue;
        expect(explained.has(trait) || silent.has(trait), `${p.id}.${trait} has no customer wording`).toBe(true);
      }
      const notes = checkNotes(p, "Amani");
      const expected = Object.entries(p.traits).filter(([k, v]) => v && explained.has(k)).length;
      expect(notes).toHaveLength(expected);
      for (const n of notes) expect(n).not.toMatch(/\b(cure|treat|prevent|heal)s?\b/i);
    }
    expect(checkNotes(PRODUCTS_BY_ID["arthroxtra"], "Amani").join(" ")).toMatch(/ask Amani first/);
    // Label warnings read off the packs: Relivin Tea is made with green tea, and isn't for pregnancy.
    expect(checkNotes(PRODUCTS_BY_ID["relivin-tea"], "Amani")).toEqual(expect.arrayContaining(["Contains caffeine.", "Not advised during pregnancy or breastfeeding."]));
  });
});

describe("cart", () => {
  it("adds, merges, caps and removes", () => {
    let c: CartItem[] = [];
    c = cartReducer(c, { type: "add", id: "probio3" });
    c = cartReducer(c, { type: "add", id: "probio3", qty: 2, from: "selector" });
    expect(c).toEqual([{ id: "probio3", qty: 3, from: "selector" }]);
    c = cartReducer(c, { type: "set", id: "probio3", qty: 99 });
    expect(c[0].qty).toBe(MAX_QTY);
    c = cartReducer(c, { type: "set", id: "probio3", qty: 0 });
    expect(c).toEqual([]);
  });

  it("only trusts well-formed items from storage", () => {
    expect(sanitiseCart("nonsense")).toEqual([]);
    expect(sanitiseCart([{ id: "probio3", qty: 2 }, { id: "probio3", qty: 1 }, { id: 4 }, null, { id: "x", qty: NaN }])).toEqual([{ id: "probio3", qty: 3 }]);
  });

  it("prices from the current list and sets aside what can't be sold", () => {
    const priced = priceCart(live, [
      { id: "probio3", qty: 2 },
      { id: "constirelax", qty: 1 }, // out of stock
      { id: "cerebrain", qty: 1 }, // not on this price list
    ]);
    expect(priced.lines.map((l) => [l.id, l.total])).toEqual([["probio3", 7800]]);
    expect(priced.subtotal).toBe(7800);
    expect(priced.count).toBe(2);
    expect(priced.unavailable.map((u) => u.id)).toEqual(["constirelax"]);
  });
});

describe("orders", () => {
  const cart: CartItem[] = [
    { id: "probio3", qty: 1, from: "selector" },
    { id: "veggie-veggie", qty: 2 },
  ];
  const details: OrderDetails = { ...emptyDetails(live), name: " Wanjiru ", receive: "delivery", areaId: "cbd", address: "Kilimani,\nnear Yaya", payment: "mpesa", note: "" };

  it("asks for what's missing, one thing at a time", () => {
    expect(detailsProblem(live, { ...details, name: "" })).toMatch(/Add your name so Amani/);
    expect(detailsProblem(live, { ...details, areaId: null })).toMatch(/delivered/);
    expect(detailsProblem(live, { ...details, payment: null })).toMatch(/pay/);
    expect(detailsProblem(live, { ...details, receive: "pickup", areaId: null })).toBeNull();
    expect(detailsProblem(kate, { ...emptyDetails(kate), name: "Wanjiru", receive: "pickup" })).toMatch(/how you'd like to get/);
    expect(detailsProblem(live, details)).toBeNull();
  });

  it("totals with a known delivery fee, and says when it's still to confirm", () => {
    const known = priceOrder(live, cart, details);
    expect(known.subtotal).toBe(3900 + 8200);
    expect(known.total).toBe(3900 + 8200 + 200);
    expect(known.totalConfirmed).toBe(true);
    const unknown = priceOrder(live, cart, { ...details, areaId: "far" });
    expect(unknown.total).toBe(unknown.subtotal);
    expect(unknown.totalConfirmed).toBe(false);
    const pickup = priceOrder(live, cart, { receive: "pickup", areaId: null });
    expect(pickup.delivery).toEqual({ label: "Collect in Westlands", fee: 0 });
  });

  it("writes a complete WhatsApp message", () => {
    const order = priceOrder(live, cart, details);
    const msg = orderMessage(live, order, details, { order: "AO-7QX2", selector: "SA-AB12" });
    expect(msg).toContain("Hi Amani, I'd like to order from your page.");
    expect(msg).toContain("1 × Probio3 · KES 3,900");
    expect(msg).toContain("2 × Veggie Veggie · KES 8,200");
    expect(msg).toContain("*Delivery:* Nairobi CBD · KES 200");
    expect(msg).toContain("*Total:* KES 12,300");
    expect(msg).toContain("*Name:* Wanjiru");
    expect(msg).toContain("*Deliver to:* Kilimani, near Yaya");
    expect(msg).toContain("*Paying by:* M-Pesa");
    expect(msg).toContain("Order ref: AO-7QX2 · Selector ref: SA-AB12");
    const vague = orderMessage(live, priceOrder(live, cart, { ...details, areaId: "far" }), { ...details, areaId: "far" }, { order: "AO-7QX2" });
    expect(vague).toContain("(delivery cost to confirm)");
    expect(vague).not.toContain("*Total:*");
    expect(vague).toContain("Could you confirm the total");
  });

  it("placing on the page also needs a number to confirm on; WhatsApp doesn't", () => {
    expect(placeProblem(live, details)).toMatch(/Add your phone number so Amani can confirm/);
    expect(placeProblem(live, { ...details, phone: "0712 345" })).toMatch(/phone number/);
    expect(placeProblem(live, { ...details, phone: "0712 345 678" })).toBeNull();
    expect(detailsProblem(live, details)).toBeNull();
    expect(normalisePhone("+254 712 345 678")).toBe("254712345678");
    expect(normalisePhone("0112345678")).toBe("254112345678");
    expect(normalisePhone("12345")).toBeNull();
    const record = orderRecord(live, priceOrder(live, cart, details), { ...details, phone: "0712 345 678" }, { order: "AO-7QX2" });
    expect(record.customer).toEqual({ name: "Wanjiru", phone: "254712345678" });
  });

  it("offers placing on the page only where it can reach the distributor", () => {
    expect(canPlaceOrders(kate)).toBe(true); // a preview shows the flow and sends nothing
    expect(canPlaceOrders({ ...live, suppliSlug: null })).toBe(false); // live but not linked: WhatsApp only
    expect(canPlaceOrders({ ...live, suppliSlug: "amani-otieno" })).toBe(true);
  });

  it("makes short references the customer can quote", () => {
    expect(initials("Kate Cromuel")).toBe("KC");
    expect(initials("")).toBe("SA");
    let i = 0;
    const ref = newOrderRef("Kate Cromuel", () => [0.1, 0.5, 0.9, 0.99][i++]);
    expect(ref).toMatch(ORDER_REF);
    expect(ref.startsWith("KC-")).toBe(true);
    for (let n = 0; n < 200; n++) expect(newOrderRef("Kate Cromuel")).toMatch(ORDER_REF);
  });
});

describe("delivery costs", () => {
  it("says a cost still to agree in two words, and shows known ones as prices", () => {
    expect(deliveryFeeLabel(null)).toBe("Cost to confirm");
    expect(deliveryFeeLabel(0)).toBe("Free");
    expect(deliveryFeeLabel(300)).toBe("KES 300");
  });
});

describe("selector progress", () => {
  const about: Answers = { first_name: "Wanjiru", sex: "female", age: 34, pregnancy: "none", experience: "never" };

  it("starts the goals part empty, even though it's a single question until goals are picked", () => {
    expect(partProgress(about, "goals")).toEqual([1, 0, 0, 0]);
  });

  it("never goes backwards when picking goals adds their follow-ups", () => {
    const withGoals: Answers = { ...about, goals: ["energy", "digestion"] };
    const next = nextShown("goals", withGoals)!;
    const [part1, part2, part3] = partProgress(withGoals, next);
    expect(part1).toBe(1);
    expect(part2).toBeGreaterThan(0);
    expect(part2).toBeLessThan(1);
    expect(part3).toBe(0);
  });

  it("is full once the suggestions are showing", () => {
    expect(partProgress(about, "goals", true)).toEqual([1, 1, 1, 1]);
  });
});

describe("interests picked on the page", () => {
  const about: Answers = { first_name: "Wanjiru", sex: "female", age: 34, pregnancy: "none", experience: "never" };
  const picked: Answers = { ...about, goals: ["energy", "digestion"] };
  const preset = ["goals"];

  it("are never asked for again: the flow steps from the basics straight to their follow-ups", () => {
    const first = nextShown("experience", picked, preset)!;
    expect(first).not.toBe("goals");
    expect(QUESTIONS_BY_ID[first].goal).toBe("energy");
    expect(previousShown(first, picked, preset)).toBe("experience");
    // The goals part still opens with its header, now on the first follow-up.
    expect(sectionLead(first, picked, preset)?.id).toBe("goals_intro");
    // And the bar counts only what's actually asked.
    expect(partProgress(picked, first, false, preset)[1]).toBe(0);
  });

  it("are asked about as usual when the answer no longer stands, or nothing was picked", () => {
    expect(nextShown("experience", { ...about, goals: [] }, preset)).toBe("goals");
    expect(nextShown("experience", picked)).toBe("goals");
  });

  it("send someone part-way through to the first question their new interests add", () => {
    const answered: Answers = { ...picked, energy_level: 2, energy_dips: ["afternoon"], gut_issues: ["bloating"], meals: "home" };
    const withJoints: Answers = { ...answered, goals: ["energy", "digestion", "joints"] };
    expect(QUESTIONS_BY_ID[resumeAt(withJoints, "veg", preset)].goal).toBe("joints");
    expect(resumeAt(answered, "veg", preset)).toBe("veg");
    expect(resumeAt(withJoints, "disclaimer", preset)).toBe("disclaimer");
  });
});

describe("messages", () => {
  it("opens a question with the product and its price", () => {
    expect(askMessage(live)).toBe("Hi Amani, I found your page and I have a question.");
    expect(askMessage(live, PRODUCTS_BY_ID["probio3"])).toBe("Hi Amani, I have a question about Probio3 (KES 3,900).");
    expect(askMessage(live, PRODUCTS_BY_ID["cerebrain"])).toBe("Hi Amani, I have a question about CereBrain Tablets.");
  });
});

describe("priced suggestions", () => {
  const answers: Answers = {
    first_name: "wanjiru",
    sex: "female",
    age: 34,
    pregnancy: "none",
    experience: "never",
    goals: ["digestion", "energy"],
    gut_issues: ["constipation", "bloating"],
    constipation_freq: "weekly",
    energy_level: 2,
    energy_dips: ["afternoon"],
    meals: "home",
    veg: "few",
    sugary: "rarely",
    water: "low",
    active: "few",
    sleep_hours: "7to8",
    alcohol: "none",
    smoke: "no",
    conditions: ["none"],
    medications: ["none"],
    restrictions: ["none"],
    plan_size: "focused",
  };

  it("prices every suggestion the distributor sells, and flags the rest", () => {
    const result = recommend(answers);
    expect(result.core.length).toBeGreaterThan(0);
    const all = priceSuggestions(kate, result);
    expect(all.core.every((s) => s.orderable)).toBe(true);
    expect(all.coreTotal).toBe(result.core.reduce((sum, r) => sum + kate.catalogue.offers[r.product.id].price, 0));

    const sparse = priceSuggestions({ ...live, catalogue: { ...live.catalogue, offers: {} } }, result);
    expect(sparse.core.every((s) => !s.orderable && s.listing === null)).toBe(true);
    expect(sparse.coreTotal).toBe(0);
    // The engine's choice is never changed by pricing.
    expect(sparse.core.map((s) => s.rec.product.id)).toEqual(result.core.map((r) => r.product.id));
  });
});

describe("results, goal by goal", () => {
  const base: Answers = {
    first_name: "Wanjiru",
    sex: "female",
    age: 34,
    pregnancy: "none",
    experience: "never",
    goals: ["energy", "digestion"],
    energy_level: 2,
    energy_dips: ["afternoon"],
    gut_issues: ["constipation", "bloating"],
    constipation_freq: "weekly",
    meals: "home",
    veg: "none",
    sugary: "daily",
    water: "low",
    active: "none",
    sleep_hours: "lt5",
    alcohol: "none",
    smoke: "yes",
    conditions: ["none"],
    medications: ["none"],
    restrictions: ["none"],
    plan_size: "focused",
  };
  const view = (a: Answers) => {
    const result = recommend(a, { salt: "t" });
    const priced = priceSuggestions(kate, result);
    return { result, priced, view: planView(result, priced) };
  };
  const ids = (xs: { rec: { product: { id: string } } }[]) => xs.map((x) => x.rec.product.id);

  it("answers every goal in the order it was ranked, and shows each product once", () => {
    const { priced, view: v } = view(base);
    expect(v.goals.map((g) => g.goal)).toEqual(["energy", "digestion"]);
    expect(v.goals.every((g) => g.status === "picked")).toBe(true);
    const shown = [...v.goals.flatMap((g) => [...ids(g.picks), ...ids(g.later)]), ...ids(v.extraPicks), ...ids(v.extraLater)];
    expect(new Set(shown).size).toBe(shown.length);
    expect(shown.sort()).toEqual([...ids(priced.core), ...ids(priced.addons)].sort());
  });

  it("says where nothing suits, and puts what was left out under the goal it was for", () => {
    const { result, view: v } = view({
      ...base,
      goals: ["joints", "heart"],
      joint_issues: ["pain", "stiffness"],
      joint_duration: "long",
      bone_risk: "no",
      heart_concerns: ["bp", "cholesterol"],
      restrictions: ["shellfish"],
    });
    const joints = v.goals[0];
    expect(joints.status).toBe("unmet");
    expect(joints.picks).toEqual([]);
    expect(joints.leftOut.length).toBeGreaterThan(0);
    expect(joints.leftOut.every((e) => /shellfish/.test(e.reason))).toBe(true);
    // The engine's "couldn't find" note moves into the goal instead of repeating at the top.
    expect(result.planNotes.some((n) => n.startsWith("We couldn't find a joints & bones product"))).toBe(true);
    expect(v.notes.some((n) => n.startsWith("We couldn't find"))).toBe(false);
    expect(v.unmet).toEqual(["joints"]);
    expect(v.otherLeftOut.length + v.goals.reduce((n, g) => n + g.leftOut.length, 0)).toBe(result.excluded.length);
  });

  it("keeps a smaller plan small, and says the other goals can wait", () => {
    const { view: v } = view({ ...base, plan_size: "one" });
    expect(v.goals[0].status).toBe("picked");
    expect(v.goals[1].status).toBe("waiting");
    expect(v.waiting).toEqual(["digestion"]);
  });

  it("shows each goal in the customer's own words, and never a bare yes or no", () => {
    expect(youSaid("energy", base)).toEqual(["Energy 2 of 5", "Mid-afternoon"]);
    expect(youSaid("digestion", base)).toEqual(["Constipation", "Bloating or gas", "Most weeks"]);
    const joints: Answers = { ...base, goals: ["joints"], joint_issues: ["pain"], joint_duration: "years", bone_risk: "no" };
    expect(youSaid("joints", joints)).toEqual(["Pain when I walk, climb stairs or kneel", "More than a year"]);
    // Only questions that belong to that goal.
    expect(youSaid("energy", base).some((x) => /Constipation/.test(x))).toBe(false);
  });

  it("counts only the answers that still apply, and prices a pack by the day", () => {
    expect(answeredCount(base)).toBe(Object.keys(base).length);
    expect(answeredCount({ ...base, loose_freq: "weekly" })).toBe(Object.keys(base).length);
    expect(perDay(3200, 21)).toBe(150);
    expect(perDay(4100, 14)).toBe(290);
    expect(perDay(5000, 0)).toBeNull();
  });
});
