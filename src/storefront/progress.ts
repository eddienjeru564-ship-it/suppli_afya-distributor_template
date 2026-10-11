import {
  QUESTIONS_BY_ID,
  SECTIONS,
  isAnswered,
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
 *
 * `preset` names questions already answered on the page before the selector opened (the
 * interests picked in "What would you like help with?" are the engine's `goals`). They're
 * stepped over while their answer stands, so nobody is asked the same thing twice; if the
 * answer stops being valid (a goal that doesn't apply once sex is known), the question is
 * asked as usual.
 */
export const isFolded = (q: Question | undefined) => Boolean(q && q.kind === "section" && q.section !== "intro");

const FIRST = "disclaimer";

function hidden(id: string, a: Answers, preset: readonly string[]) {
  const q = QUESTIONS_BY_ID[id];
  return isFolded(q) || (preset.includes(id) && Boolean(q) && isAnswered(q, a));
}

export function nextShown(id: string, a: Answers, preset: readonly string[] = []): string | null {
  let n = nextQuestionId(id, a);
  while (n && hidden(n, a, preset)) n = nextQuestionId(n, a);
  return n;
}

export function previousShown(id: string, a: Answers, preset: readonly string[] = []): string | null {
  let p = previousQuestionId(id, a);
  while (p && hidden(p, a, preset)) p = previousQuestionId(p, a);
  return p && QUESTIONS_BY_ID[p].id !== "welcome" ? p : null;
}

/** The section screen shown as a header on this question, if it opens a part. */
export function sectionLead(id: string, a: Answers, preset: readonly string[] = []): Question | null {
  let p = previousQuestionId(id, a);
  while (p && !isFolded(QUESTIONS_BY_ID[p]) && hidden(p, a, preset)) p = previousQuestionId(p, a);
  return p && isFolded(QUESTIONS_BY_ID[p]) ? QUESTIONS_BY_ID[p] : null;
}

/**
 * Where to pick up when the answers changed under a selector that's part-way through (new
 * interests picked on the page): the first question still unanswered, or where they were if
 * everything before it is answered. Not started yet: the opening screen.
 */
export function resumeAt(a: Answers, currentId: string, preset: readonly string[] = []): string {
  if (currentId === FIRST || !QUESTIONS_BY_ID[currentId]) return FIRST;
  let last = FIRST;
  for (let id = nextShown(FIRST, a, preset); id; id = nextShown(id, a, preset)) {
    if (id === currentId || !isAnswered(QUESTIONS_BY_ID[id], a)) return id;
    last = id;
  }
  return last;
}

/**
 * How far through each of the four parts the customer is, from 0 to 1.
 *
 * It counts the questions already behind them, not the one on screen. A part can grow as it's
 * answered (each goal adds its own follow-ups), and counting the current question made the goals
 * part read "done" until goals were picked, then drop back to a fraction: a bar going backwards.
 */
export function partProgress(answers: Answers, currentId: string, done = false, preset: readonly string[] = []): number[] {
  const shown = visibleQuestions(answers).filter((q) => q.section !== "intro" && !hidden(q.id, answers, preset));
  const current = SECTIONS.findIndex((s) => s.id === QUESTIONS_BY_ID[currentId]?.section);
  return SECTIONS.map((s, i) => {
    if (done || i < current) return 1;
    if (i > current) return 0;
    const inPart = shown.filter((q) => q.section === s.id);
    const at = inPart.findIndex((q) => q.id === currentId);
    return at < 0 ? 0 : at / Math.max(1, inPart.length);
  });
}
