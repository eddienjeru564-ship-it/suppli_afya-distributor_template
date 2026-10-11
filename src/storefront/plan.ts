import { GOALS_BY_ID, type EngineResult, type GoalId, type Product } from "@/engine";
import type { PricedSuggestions, Suggestion } from "./suggestions";

/**
 * The result, arranged the way the customer asked: one goal at a time, in the order they ranked
 * them. The engine decides what fits; this only decides where each piece is shown, so every
 * product appears once and every goal gets an answer, even when the answer is "nothing suits".
 */

export type GoalStatus =
  /** A product in the plan is shown under this goal. */
  | "picked"
  /** A product shown under an earlier goal covers this one too. */
  | "covered"
  /** Something fits, but the plan was kept to the size the customer asked for. */
  | "waiting"
  /** Nothing suitable was found. */
  | "unmet";

export interface LeftOut {
  product: Product;
  reason: string;
}

export interface GoalBlock {
  goal: GoalId;
  /** 0 is the main goal. */
  rank: number;
  label: string;
  status: GoalStatus;
  picks: Suggestion[];
  coveredBy: Suggestion | null;
  /** Good matches kept for later. */
  later: Suggestion[];
  leftOut: LeftOut[];
}

export interface PlanView {
  goals: GoalBlock[];
  /** Products in the plan that don't answer a named goal (a complete plan's extra match). */
  extraPicks: Suggestion[];
  /** Matches for later that don't answer a named goal, such as fibre for someone short of vegetables. */
  extraLater: Suggestion[];
  /** Products left out that aren't tied to a named goal. */
  otherLeftOut: LeftOut[];
  /** The engine's plan notes, less the "couldn't find" ones now answered inside their goal. */
  notes: string[];
  /** Goals with a product in the plan, in ranked order. */
  covered: GoalId[];
  /** Goals with nothing suitable. */
  unmet: GoalId[];
  /** Goals that can wait, because the customer asked for a smaller plan. */
  waiting: GoalId[];
}

export const goalLabel = (g: GoalId) => GOALS_BY_ID[g]?.label ?? g;

/** The engine's own words for a goal with nothing suitable. */
function isUnmetNote(note: string, goal: GoalId): boolean {
  return note.startsWith("We couldn't find a") && note.includes(` ${goalLabel(goal).toLowerCase()} product`);
}

export function planView(result: EngineResult, priced: PricedSuggestions): PlanView {
  const goals = result.profile.goals;
  const placedPick = new Set<string>();
  const placedLater = new Set<string>();
  const placedOut = new Set<string>();
  const notes = [...result.planNotes];

  const blocks: GoalBlock[] = goals.map((goal, rank) => {
    const picks = priced.core.filter((x) => x.rec.covers[0] === goal && !placedPick.has(x.rec.product.id));
    picks.forEach((x) => placedPick.add(x.rec.product.id));
    const coveredBy = picks.length ? null : (priced.core.find((x) => x.rec.covers.includes(goal)) ?? null);

    const later = priced.addons.filter((x) => x.rec.covers.includes(goal) && !placedLater.has(x.rec.product.id));
    later.forEach((x) => placedLater.add(x.rec.product.id));

    const leftOut = result.excluded.filter((e) => e.product.goals.includes(goal) && !placedOut.has(e.product.id));
    leftOut.forEach((e) => placedOut.add(e.product.id));

    const noteAt = notes.findIndex((n) => isUnmetNote(n, goal));
    const engineUnmet = noteAt >= 0;
    if (engineUnmet) notes.splice(noteAt, 1);

    // The engine leaves a goal without a product for one of two reasons: nothing suits (and it
    // says so in a note), or the plan was trimmed to the size the customer asked for.
    const status: GoalStatus = picks.length ? "picked" : coveredBy ? "covered" : engineUnmet ? "unmet" : "waiting";

    return { goal, rank, label: goalLabel(goal), status, picks, coveredBy, later, leftOut };
  });

  return {
    goals: blocks,
    extraPicks: priced.core.filter((x) => !placedPick.has(x.rec.product.id)),
    extraLater: priced.addons.filter((x) => !placedLater.has(x.rec.product.id)),
    otherLeftOut: result.excluded.filter((e) => !placedOut.has(e.product.id)),
    notes,
    covered: blocks.filter((b) => b.status === "picked" || b.status === "covered").map((b) => b.goal),
    unmet: blocks.filter((b) => b.status === "unmet").map((b) => b.goal),
    waiting: blocks.filter((b) => b.status === "waiting").map((b) => b.goal),
  };
}

const COUNT = ["No products", "One product", "Two products", "Three products", "Four products", "Five products"];

/** "a", "a and b", "a, b and c". */
export function listOf(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The whole result in a sentence or two, under the title: what's in the plan, what it costs,
 * and anything that didn't get a product. Plain and specific, never a promise.
 */
export function planSentence(view: PlanView, priced: PricedSuggestions, opts: { firstName: string; price: (n: number) => string }): string {
  const n = priced.core.length;
  const lower = (gs: GoalId[]) => listOf(gs.map((g) => goalLabel(g).toLowerCase()));
  const parts: string[] = [];
  if (n === 0) {
    parts.push(`Nothing in ${opts.firstName}'s range suits your answers yet. Below is why, and what helps in the meantime.`);
    return parts.join(" ");
  }
  parts.push(`${COUNT[n] ?? `${n} products`}${view.covered.length ? ` for ${lower(view.covered)}` : ""}.`);
  const orderable = priced.orderableCore.length;
  if (orderable === n) parts.push(n === 1 ? `${opts.price(priced.coreTotal)} for one pack.` : `${opts.price(priced.coreTotal)} for a pack of each.`);
  else if (orderable > 0) parts.push(`${opts.price(priced.coreTotal)} for the ${orderable === 1 ? "one" : orderable} on ${opts.firstName}'s price list.`);
  if (view.unmet.length) parts.push(`Nothing suits you for ${lower(view.unmet)} yet, and we explain why.`);
  if (view.waiting.length) parts.push(`${listOf(view.waiting.map(goalLabel))} can wait until you're ready.`);
  return parts.join(" ");
}
