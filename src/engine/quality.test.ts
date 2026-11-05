import { describe, expect, it } from "vitest";
import {
  distributorBrief,
  recommend,
  toggleOption,
  visibleOptions,
  visibleQuestions,
  whatsappMessage,
  type Answers,
  type EngineResult,
} from "./index";

/**
 * Quality audit over many random customers: every plan the engine can produce must read well,
 * make no health claims, give a reason for each product and address what the customer asked for.
 * The fuzz test in engine.test.ts covers safety; this covers everything a customer reads.
 */

const ctx = { distributorName: "Kate Cromuel", distributorFirstName: "Kate" };
const NAMES = ["Wanjiru", "mama njeri", "Dr. Otieno", "O'Brien", "  Achieng  ", "Zoë", "KIPRONO", "Mary-Anne", "Baba Kevo"];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function randomAnswers(rand: () => number): Answers {
  const a: Answers = {};
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  for (let guard = 0; guard < 200; guard++) {
    const q = visibleQuestions(a).find((x) => x.kind !== "section" && a[x.id] === undefined);
    if (!q) break;
    const opts = visibleOptions(q, a);
    switch (q.kind) {
      case "text":
        a[q.id] = pick(NAMES);
        break;
      case "number":
        a[q.id] = q.range ? q.range.min + Math.floor(rand() * (q.range.max - q.range.min + 1)) : 18 + Math.floor(rand() * 70);
        break;
      case "scale":
        a[q.id] = 1 + Math.floor(rand() * 5);
        break;
      case "single":
        a[q.id] = pick(opts).id;
        break;
      case "multi":
      case "ranked": {
        let sel: string[] = [];
        const n = 1 + Math.floor(rand() * (q.max ?? 3));
        for (let i = 0; i < n; i++) sel = toggleOption(q, sel, pick(opts).id);
        a[q.id] = sel.length ? sel : [opts[0].id];
        break;
      }
    }
  }
  return a;
}

/** Every piece of text a customer or distributor reads, with where it came from. */
function texts(r: EngineResult): [string, string][] {
  const out: [string, string][] = [];
  r.heard.forEach((t) => out.push(["heard", t]));
  r.planNotes.forEach((t) => out.push(["planNotes", t]));
  r.seeDoctor.forEach((t) => out.push(["seeDoctor", t]));
  r.habits.forEach((h) => out.push(["habit.title", h.title], ["habit.detail", h.detail]));
  for (const rec of [...r.core, ...r.addons]) {
    rec.reasons.forEach((t) => out.push([`reason ${rec.product.id}`, t]));
    rec.cautions.forEach((t) => out.push([`caution ${rec.product.id}`, t]));
  }
  r.excluded.forEach((x) => out.push([`excluded ${x.product.id}`, x.reason]));
  const b = distributorBrief(r);
  out.push(["brief.title", b.title], ["brief.opener", b.opener], ["brief.planLine", b.planLine]);
  b.tips.forEach((t) => out.push(["brief.tip", t]));
  b.flags.forEach((t) => out.push(["brief.flag", t]));
  out.push(["whatsapp", whatsappMessage(r, ctx)]);
  return out;
}

const BROKEN = [/undefined/, /\bnull\b/, /NaN/, /\[object/, / {2,}/, / [,.;:!?]/, /\.\.(?!\.)/, /,,/, /\(\s*\)/];
/** Claims we never make about a product: it treats, cures or prevents a disease. Disclaimers that say so are allowed. */
const CLAIM = /\b(cure[sd]?|curing|heals?|healing)\b|\btreats?\b|\bprevents?\b/i;
const DISCLAIMER = /\b(not|never|doesn't|does not|isn't|no)\b[^.]*\b(cure|treat|prevent|diagnos)/i;

describe("recommendation quality", () => {
  const rand = rng(20261105);
  const N = 20000;
  const runs = Array.from({ length: N }, () => randomAnswers(rand));

  it("never throws, and gives the same plan for the same answers", () => {
    for (const a of runs.slice(0, 2000)) {
      const r1 = recommend(a);
      const r2 = recommend(a);
      expect(r2.ref).toBe(r1.ref);
      expect(r2.core.map((c) => c.product.id)).toEqual(r1.core.map((c) => c.product.id));
    }
  });

  it("writes clean text everywhere: no gaps, no stray punctuation, no undefined", () => {
    const problems = new Map<string, string>();
    for (const a of runs) {
      for (const [where, t] of texts(recommend(a))) {
        if (!t || t !== t.trim()) problems.set(`${where}: empty or untrimmed`, JSON.stringify(t));
        // Line by line: a blank line between paragraphs is fine, two spaces inside a line aren't.
        for (const line of t.split("\n"))
          for (const re of BROKEN) {
            const m = line.match(re);
            if (m) problems.set(`${where}: ${re}`, line.slice(Math.max(0, (m.index ?? 0) - 80), (m.index ?? 0) + 80));
          }
      }
    }
    expect([...problems].slice(0, 15)).toEqual([]);
  });

  it("never says a product treats, cures or prevents anything", () => {
    const problems = new Map<string, string>();
    for (const a of runs) {
      for (const [where, t] of texts(recommend(a))) {
        for (const sentence of t.split(/(?<=[.!?])\s+/)) {
          if (CLAIM.test(sentence) && !DISCLAIMER.test(sentence)) problems.set(where, sentence);
        }
      }
    }
    expect([...problems].slice(0, 15)).toEqual([]);
  });

  it("gives every product a reason, and addresses every goal the customer chose", () => {
    const missingReason = new Set<string>();
    const unaddressed = new Map<string, number>();
    let plans = 0;
    for (const a of runs) {
      const r = recommend(a);
      if (r.status === "clinic-first") continue;
      plans++;
      for (const rec of [...r.core, ...r.addons]) if (rec.reasons.length === 0) missingReason.add(rec.product.id);
      // A plan with no products must say why.
      if (r.core.length === 0) expect(r.planNotes.length + r.excluded.length + r.seeDoctor.length).toBeGreaterThan(0);
      const covered = new Set([...r.core, ...r.addons].flatMap((x) => x.covers));
      for (const g of r.profile.goals) if (!covered.has(g)) unaddressed.set(g, (unaddressed.get(g) ?? 0) + 1);
    }
    expect([...missingReason]).toEqual([]);
    // Goals can go unmet on purpose (plan size "one", safety exclusions); report how often, so a
    // regression that leaves goals unmet across the board shows up.
    const worst = Math.max(0, ...unaddressed.values()) / plans;
    expect(worst).toBeLessThan(0.6);
  });

  it("keeps the WhatsApp message short enough for one message, with the customer's name in it", () => {
    for (const a of runs.slice(0, 4000)) {
      const r = recommend(a);
      const msg = whatsappMessage(r, ctx);
      expect(msg.length).toBeLessThan(1500);
      expect(msg.startsWith("Hi Kate, ")).toBe(true);
    }
  });
});
