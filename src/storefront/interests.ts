import { GOALS, type GoalId } from "@/engine";
import type { GoalMeta } from "@/engine/goals";

/**
 * "What would you like help with?" The engine's goals, as interests a visitor picks on the page
 * before the questions start. Six broad ones come first, all well covered by the range; the rest
 * (including the men's and women's ones, which only apply once the questions know who's asking)
 * are one tap away.
 */
export const FIRST_INTERESTS: GoalId[] = ["energy", "immunity", "digestion", "joints", "blood_sugar", "weight"];

/** Up to three, like the engine's goals question; the first picked counts most. */
export const MAX_INTERESTS = 3;

export function interestGroups(): { first: GoalMeta[]; more: GoalMeta[] } {
  return {
    first: FIRST_INTERESTS.map((id) => GOALS.find((g) => g.id === id)!).filter(Boolean),
    more: GOALS.filter((g) => !FIRST_INTERESTS.includes(g.id)),
  };
}

/** Pick or unpick one interest. A fourth pick is ignored: the visitor swaps one out instead. */
export function toggleInterest(picked: GoalId[], id: GoalId): GoalId[] {
  if (picked.includes(id)) return picked.filter((g) => g !== id);
  return picked.length >= MAX_INTERESTS ? picked : [...picked, id];
}
