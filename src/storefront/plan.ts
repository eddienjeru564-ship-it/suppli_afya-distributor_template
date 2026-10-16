import { GOALS_BY_ID, QUESTIONS, QUESTIONS_BY_ID, pruneAnswers, type Answers, type EngineResult, type GoalId, type Product } from "@/engine";
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

/** Scales read on their own only with their subject. Others are left out rather than guessed. */
const SCALE_SAID: Record<string, string> = { energy_level: "Energy", stress_level: "Stress" };
/** Answers that mean nothing without their question. */
const CONTEXTLESS = /^(yes|no|not sure)$/i;

/**
 * What the customer told us about one goal, in their own words (the options they picked), for
 * showing beside that goal's answer. A question belongs to a goal when choosing that goal is what
 * makes it appear.
 */
export function youSaid(goal: GoalId, answers: Answers): string[] {
  const only = { ...answers, goals: [goal] };
  const without = { ...answers, goals: [] };
  const out: string[] = [];
  for (const q of QUESTIONS) {
    if (q.section !== "goals" || !q.showIf || q.kind === "section" || q.kind === "ranked") continue;
    if (!q.showIf(answers) || !q.showIf(only) || q.showIf(without)) continue;
    const v = answers[q.id];
    if (v === undefined || v === null) continue;
    if (q.kind === "scale") {
      if (typeof v === "number" && SCALE_SAID[q.id]) out.push(`${SCALE_SAID[q.id]} ${v} of 5`);
      continue;
    }
    for (const id of Array.isArray(v) ? v : [v]) {
      const o = q.options?.find((x) => x.id === id);
      if (o && !o.exclusive && !CONTEXTLESS.test(o.label)) out.push(o.label);
    }
  }
  return out;
}

/** How many questions the customer answered (only the ones that still apply). */
export function answeredCount(answers: Answers): number {
  return Object.keys(pruneAnswers(answers)).filter((id) => QUESTIONS_BY_ID[id] && QUESTIONS_BY_ID[id].kind !== "section").length;
}

/** Roughly what a pack costs per day at the usual dose, to the nearest 10. Null when the pack's length isn't known. */
export function perDay(price: number, supplyDays: number): number | null {
  if (!supplyDays || supplyDays < 5) return null;
  return Math.max(10, Math.round(price / supplyDays / 10) * 10);
}
