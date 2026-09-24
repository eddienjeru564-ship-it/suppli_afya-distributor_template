import {
  QUESTIONS_BY_ID,
  SECTIONS,
  nextQuestionId,
  previousQuestionId,
  visibleQuestions,
  type Answers,
  type Question,
} from "@/engine";

/**
 * How the selector walks the engine's questions. The engine decides the order; the storefront
 * shows section screens ("Your goals", "A quick safety check") as a header on the question that
 * follows them, except the opening privacy screen, which is shown on its own.
 */
export const isFolded = (q: Question | undefined) => Boolean(q && q.kind === "section" && q.section !== "intro");

export function nextShown(id: string, a: Answers): string | null {
  let n = nextQuestionId(id, a);
  while (n && isFolded(QUESTIONS_BY_ID[n])) n = nextQuestionId(n, a);
  return n;
}

export function previousShown(id: string, a: Answers): string | null {
  let p = previousQuestionId(id, a);
  while (p && isFolded(QUESTIONS_BY_ID[p])) p = previousQuestionId(p, a);
  return p && QUESTIONS_BY_ID[p].id !== "welcome" ? p : null;
}

/**
 * How far through each of the four parts the customer is, from 0 to 1.
 *
 * It counts the questions already behind them, not the one on screen. A part can grow as it's
 * answered (each goal adds its own follow-ups), and counting the current question made the goals
 * part read "done" until goals were picked, then drop back to a fraction: a bar going backwards.
 */
export function partProgress(answers: Answers, currentId: string, done = false): number[] {
  const shown = visibleQuestions(answers).filter((q) => q.section !== "intro" && !isFolded(q));
  const current = SECTIONS.findIndex((s) => s.id === QUESTIONS_BY_ID[currentId]?.section);
  return SECTIONS.map((s, i) => {
    if (done || i < current) return 1;
    if (i > current) return 0;
    const inPart = shown.filter((q) => q.section === s.id);
    const at = inPart.findIndex((q) => q.id === currentId);
    return at < 0 ? 0 : at / Math.max(1, inPart.length);
  });
}
