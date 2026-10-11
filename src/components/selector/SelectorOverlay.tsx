"use client";

import clsx from "clsx";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  GOALS_BY_ID,
  QUESTIONS_BY_ID,
  SECTIONS,
  isAnswered,
  resolveText,
  toggleOption,
  visibleOptions,
  type Answers,
  type EngineContext,
  type Question,
} from "@/engine";
import { Portrait } from "@/components/brand/Portrait";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Bag, Check, ChevronLeft, Close, Lock, Shield } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { nextShown, partProgress, previousShown, sectionLead } from "@/storefront/progress";
import { MultiChoice, Scale, SingleChoice, TextField } from "./inputs";
import { Results } from "./Results";
import { SoFar } from "./SoFar";

/*
 * The selector: the engine's question flow, as a focused full-screen tool.
 *
 * The engine decides everything (which questions, in which order, what counts as answered,
 * what's recommended). This component only renders it. The driving logic follows the Suppli
 * Afya health check (suppli_afya: src/components/check/HealthCheck.tsx) with two
 * presentation changes for a storefront:
 *   - The engine's welcome screen is replaced by the page itself; the flow opens on its
 *     privacy and "not medical advice" screen, which still has to be accepted.
 *   - Section screens ("Your goals", "A quick safety check") are shown as a header on the
 *     question that follows them instead of as a screen of their own: the same words, four
 *     fewer taps.
 */

const FIRST = "disclaimer";
const LAST = "plan_size";
const ease = [0.22, 1, 0.36, 1] as const;
/** A one-tap answer moves on by itself after this pause, long enough to see the tick. */
const ADVANCE_MS = 280;
/** "None of these" in a choose-all question: a little longer, since it can also be a slip. */
const ADVANCE_EXCLUSIVE_MS = 450;
/** The short "putting it together" screen before the results. */
const PREPARE_MS = 2100;


/** Goals can be picked on the page before sex is known; drop any the engine wouldn't offer. */
function tidy(a: Answers): Answers {
  if (!Array.isArray(a.goals)) return a;
  const allowed = new Set(visibleOptions(QUESTIONS_BY_ID.goals, a).map((o) => o.id));
  const goals = a.goals.filter((g) => allowed.has(g));
  return goals.length === a.goals.length ? a : { ...a, goals };
}

export function SelectorOverlay() {
  const { overlays, close } = useStorefront();
  return (
    <Sheet open={overlays.selector} onClose={() => close("selector")} kind="screen" z={40} label="Your recommendations">
      <Selector />
    </Sheet>
  );
}

function Selector() {
  const { sf, session, setSession, setOutcome, result, outcome, close, priced, openOrder } = useStorefront();
  const reduce = useReducedMotion();
  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preparing, setPreparing] = useState(false);

  const answers = useMemo(() => session?.answers ?? {}, [session]);
  // Questions answered on the page (the interests): stepped over, never asked twice.
  const preset = useMemo(() => session?.preset ?? [], [session]);
  const currentId = session?.currentId && QUESTIONS_BY_ID[session.currentId] ? session.currentId : FIRST;
  const q = QUESTIONS_BY_ID[currentId];
  const ctx: EngineContext = useMemo(
    () => ({ distributorName: sf.distributor.name, distributorFirstName: sf.distributor.firstName }),
    [sf],
  );
  const showingResult = Boolean(result);

  // The question on screen, for timers: an auto-advance only ever moves on from the question it was set on.
  const currentRef = useRef(currentId);
  useEffect(() => {
    currentRef.current = currentId;
  }, [currentId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (prepTimer.current) clearTimeout(prepTimer.current);
    },
    [],
  );

  const cancelAdvance = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  /**
   * Move on after a short pause, unless the person has moved first (tapped Continue, Back, or
   * another answer). This is what keeps a quick tap followed by Continue from skipping a question.
   */
  const advanceLater = (from: string, run: () => void, ms = ADVANCE_MS) => {
    cancelAdvance();
    timer.current = setTimeout(
      () => {
        timer.current = null;
        if (currentRef.current === from) run();
      },
      reduce ? 0 : ms,
    );
  };

  const toTop = () => scrollRef.current?.scrollTo({ top: 0 });

  const goTo = useCallback(
    (id: string, direction: 1 | -1, a: Answers, keep: string[] = preset) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setDir(direction);
      setError(null);
      setTouched(true);
      setSession({ answers: a, currentId: id, ...(keep.length ? { preset: keep } : {}) });
      toTop();
    },
    [preset, setSession],
  );

  const finish = useCallback(
    (final: Answers) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setDir(1);
      // The result is saved at once (closing now still keeps it); the short screen is only what's shown.
      setOutcome({ answers: final, salt: String(Date.now()) });
      setSession(null);
      setPreparing(true);
      if (prepTimer.current) clearTimeout(prepTimer.current);
      prepTimer.current = setTimeout(() => setPreparing(false), reduce ? 700 : PREPARE_MS);
      toTop();
    },
    [reduce, setOutcome, setSession],
  );

  const stopPreparing = () => {
    if (prepTimer.current) clearTimeout(prepTimer.current);
    prepTimer.current = null;
    setPreparing(false);
  };

  const next = useCallback(
    (a: Answers = answers) => {
      if (!isAnswered(q, a)) {
        if (q.kind === "number") setError(`Please enter an age between ${q.range?.min} and ${q.range?.max}.`);
        if (q.kind === "text") setError("Please enter a name, even a nickname.");
        return;
      }
      const n = nextShown(currentId, a, preset);
      if (!n || currentId === LAST) finish(a);
      else goTo(n, 1, a);
    },
    [answers, currentId, finish, goTo, preset, q],
  );

  const back = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (preparing) return;
    if (showingResult && outcome) {
      // Change my answers: reopen the last question with everything filled in.
      setOutcome(null);
      goTo(LAST, -1, outcome.answers);
      return;
    }
    const p = previousShown(currentId, answers, preset);
    if (p) goTo(p, -1, answers);
    else close("selector");
  }, [answers, close, currentId, goTo, outcome, preparing, preset, setOutcome, showingResult]);

  const restart = useCallback(() => {
    if (prepTimer.current) clearTimeout(prepTimer.current);
    setPreparing(false);
    setOutcome(null);
    goTo(FIRST, -1, {}, []);
  }, [goTo, setOutcome]);

  /** Change the interests picked on the page: the goals question, asked like any other from here on. */
  const editGoals = useCallback(() => goTo("goals", -1, answers, preset.filter((x) => x !== "goals")), [answers, goTo, preset]);

  const keep = preset.length ? { preset } : {};
  const setValue = (id: string, value: Answers[string]) => {
    cancelAdvance();
    setError(null);
    setSession({ answers: tidy({ ...answers, [id]: value }), currentId, ...keep });
  };

  const selectAndAdvance = (id: string, value: string | number) => {
    const updated = tidy({ ...answers, [id]: value });
    setSession({ answers: updated, currentId, ...keep });
    advanceLater(currentId, () => next(updated));
  };

  /** Choose-all questions: "None of these" (or "I sleep well") moves on by itself; real picks wait for Continue. */
  const toggle = (optionId: string) => {
    const current = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
    const value = toggleOption(q, current, optionId);
    const updated = tidy({ ...answers, [q.id]: value });
    setError(null);
    setSession({ answers: updated, currentId, ...keep });
    const exclusive = q.options?.find((o) => o.id === optionId)?.exclusive;
    if (exclusive && value.includes(optionId)) advanceLater(currentId, () => next(updated), ADVANCE_EXCLUSIVE_MS);
    else cancelAdvance();
  };

  const sectionProgress = useMemo(() => {
    const fills = partProgress(answers, currentId, showingResult, preset);
    const currentSection = SECTIONS.findIndex((x) => x.id === q.section);
    return SECTIONS.map((s, i) => ({ ...s, fill: fills[i], current: !showingResult && i === currentSection }));
  }, [answers, currentId, preset, q.section, showingResult]);

  const intro = !showingResult && q.section === "intro";
  const opening = (!showingResult && currentId === FIRST) || preparing;
  const d = sf.distributor;

  const header = (
    <div className="flex h-16 shrink-0 items-center gap-2 px-3 sm:px-5">
      {/* Nothing to go back to on the opening screen; Close is on the right. */}
      <button
        type="button"
        onClick={back}
        aria-label={showingResult ? "Change my answers" : "Back"}
        aria-hidden={opening || undefined}
        tabIndex={opening ? -1 : undefined}
        className={clsx(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]",
          opening && "invisible",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {showingResult ? (
          <span className="truncate text-[0.95rem] font-semibold text-ink">Your recommendations</span>
        ) : (
          <div
            className={clsx("flex w-full max-w-md gap-1.5 transition-opacity duration-500", intro ? "opacity-0" : "opacity-100")}
            aria-hidden={intro}
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={SECTIONS.length}
            aria-valuenow={sectionProgress.filter((s) => s.fill === 1).length}
          >
            {sectionProgress.map((s) => (
              <div key={s.id} className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                  <m.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${Math.round(s.fill * 100)}%` }}
                    transition={{ duration: 0.5, ease }}
                  />
                </div>
                {/* Phones: only the current part's name, so it always fits. */}
                <div
                  className={clsx(
                    "mt-1.5 whitespace-nowrap text-[0.75rem] font-semibold",
                    s.current ? "block text-ink" : "hidden text-ink-3 sm:block",
                  )}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {priced.count > 0 && (
        <button
          type="button"
          onClick={openOrder}
          aria-label={`Your order: ${priced.count} item${priced.count > 1 ? "s" : ""}`}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
        >
          <Bag />
          <span key={priced.count} className="price absolute right-0.5 top-0.5 grid h-[1.1rem] min-w-[1.1rem] animate-bump place-items-center rounded-full bg-accent px-1 text-[0.66rem] font-bold text-on-accent">
            {priced.count}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() => close("selector")}
        aria-label="Close. Your answers are kept"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
      >
        <Close className="h-5 w-5" />
      </button>
    </div>
  );

  const slide = (key: string) =>
    reduce
      ? { key, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
      : {
          key,
          initial: { opacity: 0, x: 26 * dir },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -26 * dir },
          transition: { duration: 0.3, ease },
        };

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      {/* Large screens: who you're doing this with, and what's been noted so far. */}
      {!showingResult && (
        <aside className="hidden w-[min(40%,30rem)] shrink-0 flex-col justify-between bg-sage-soft p-10 text-ink lg:flex">
          <div className="flex items-center gap-3">
            <Portrait distributor={d} size="md" />
            <div className="leading-tight">
              <div className="text-[0.8rem] text-ink-3">Your recommendations, with</div>
              <div className="font-semibold">{d.name}</div>
            </div>
          </div>
          <div className="thin-scrollbar my-10 min-h-0 flex-1 overflow-y-auto">
            <SoFar answers={answers} />
          </div>
          <p className="flex items-start gap-2 text-[0.82rem] leading-snug text-ink-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
            Your answers stay in this browser. {d.firstName} only sees them if you choose to send them.
          </p>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div ref={scrollRef} className="thin-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {showingResult && result && preparing ? (
              <m.div {...slide("preparing")} className="h-full">
                <Preparing name={result.profile.name} count={Object.keys(sf.catalogue.offers).length} first={d.firstName} onSkip={stopPreparing} />
              </m.div>
            ) : showingResult && result ? (
              <m.div {...slide("result")}>
                <Results result={result} answers={outcome!.answers} onEdit={back} onRestart={restart} />
              </m.div>
            ) : (
              q && (
                <m.div {...slide(q.id)} className="mx-auto flex min-h-full max-w-xl flex-col px-5 pb-6 pt-4 sm:px-8 sm:pt-10">
                  <QuestionView
                    q={q}
                    answers={answers}
                    preset={preset}
                    onEditGoals={editGoals}
                    ctx={ctx}
                    touched={touched}
                    error={error}
                    onValue={setValue}
                    onSelectAdvance={selectAndAdvance}
                    onToggle={toggle}
                    onNext={() => next()}
                  />
                </m.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function QuestionView({
  q,
  answers,
  preset,
  onEditGoals,
  ctx,
  touched,
  error,
  onValue,
  onSelectAdvance,
  onToggle,
  onNext,
}: {
  q: Question;
  answers: Answers;
  preset: string[];
  onEditGoals: () => void;
  ctx: EngineContext;
  touched: boolean;
  error: string | null;
  onValue: (id: string, v: Answers[string]) => void;
  onSelectAdvance: (id: string, v: string | number) => void;
  onToggle: (optionId: string) => void;
  onNext: () => void;
}) {
  const prompt = resolveText(q.prompt, answers, ctx);
  const helper = resolveText(q.helper, answers, ctx);
  const options = visibleOptions(q, answers);
  const value = answers[q.id];
  const needsContinue = ["text", "number", "multi", "ranked"].includes(q.kind);
  const answered = isAnswered(q, answers);

  // The section screen just before this question becomes its header.
  const lead = sectionLead(q.id, answers, preset);
  const part = SECTIONS.findIndex((s) => s.id === q.section) + 1;
  const goals = (Array.isArray(answers.goals) ? answers.goals : []).map((g) => GOALS_BY_ID[g as keyof typeof GOALS_BY_ID]?.label).filter(Boolean);
  // The goals were picked on the page: say so where the goals part opens, with a way to change them.
  const pickedOnPage = lead?.id === "goals_intro" && preset.includes("goals") && goals.length > 0;

  if (q.kind === "section") {
    // Only the privacy and "not medical advice" screen is shown on its own.
    return (
      <div className="flex flex-1 flex-col sm:justify-center" data-question={q.id}>
        <div className="my-auto py-6 sm:my-0">
          <span className="kicker">Your recommendations</span>
          {/* What they picked on the page, so it's clear it came with them. */}
          {goals.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[0.86rem] text-ink-3">You&apos;d like help with</span>
              {goals.map((g) => (
                <span key={g} className="rounded-full bg-accent-soft px-3 py-1 text-[0.84rem] font-semibold text-accent">
                  {g}
                </span>
              ))}
            </div>
          )}
          <h2 className="display-section mt-4 text-ink">{prompt}</h2>
          {helper && (
            <div className="mt-4 grid gap-3 text-[1rem] leading-relaxed text-ink-2">
              {helper.split("\n\n").map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          )}
          <ul className="mt-6 grid gap-2 text-[0.9rem] text-ink-2">
            <li className="flex items-start gap-2.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> About 3 minutes. Most answers are a single tap.
            </li>
            <li className="flex items-start gap-2.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> You can close this at any time; your answers are kept.
            </li>
          </ul>
        </div>
        {/* Phones: in the same place as every other question's Continue, under the thumb. */}
        <div className="safe-bottom sticky bottom-0 z-10 -mx-5 bg-gradient-to-t from-canvas from-70% to-canvas/0 px-5 pt-6 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-3">
          <Button variant="accent" size="lg" className="w-full sm:w-auto sm:min-w-44" onClick={onNext} arrow data-autofocus>
            {q.cta ?? "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col" data-question={q.id}>
      {lead ? (
        <div className="mb-6">
          <span className="kicker">
            Part {part} of {SECTIONS.length}
          </span>
          <p className="mt-2.5 font-display text-[1.3rem] italic leading-snug text-accent">{resolveText(lead.prompt, answers, ctx)}</p>
          {pickedOnPage ? (
            <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-2">
              You picked {joinAnd(goals)}. One or two short questions about each.{" "}
              <button
                type="button"
                onClick={onEditGoals}
                className="-my-2 py-2 font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
              >
                Change
              </button>
            </p>
          ) : (
            lead.helper && <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-2">{resolveText(lead.helper, answers, ctx)}</p>
          )}
        </div>
      ) : null}

      <h2 className="font-display text-[1.8rem] leading-[1.12] tracking-[-0.02em] text-ink sm:text-[2.1rem]">{prompt}</h2>
      {helper && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{helper}</p>}

      <div className="mt-6">
        {q.kind === "single" && (
          <SingleChoice options={options} value={value as string | undefined} onSelect={(id) => onSelectAdvance(q.id, id)} />
        )}
        {q.kind === "scale" && (
          <Scale
            value={typeof value === "number" ? value : undefined}
            labels={q.scaleLabels ?? ["Low", "High"]}
            onSelect={(n) => onSelectAdvance(q.id, n)}
          />
        )}
        {(q.kind === "multi" || q.kind === "ranked") && (
          <MultiChoice
            q={q}
            options={options}
            value={Array.isArray(value) ? value : []}
            ranked={q.kind === "ranked"}
            onToggle={onToggle}
          />
        )}
        {(q.kind === "text" || q.kind === "number") && (
          <TextField
            label={prompt}
            value={value === undefined ? "" : String(value)}
            numeric={q.kind === "number"}
            maxLength={q.range?.max}
            placeholder={q.placeholder}
            autoFocus={touched}
            invalid={error}
            onChange={(v) => onValue(q.id, q.kind === "number" ? (v === "" ? undefined : Number(v)) : v)}
            onSubmit={onNext}
          />
        )}
      </div>

      {q.why && (
        <p className="mt-5 flex items-start gap-2 text-[0.84rem] leading-snug text-ink-3">
          <Shield className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
          <span>
            <span className="font-semibold text-ink-2">Why we ask: </span>
            {q.why}
          </span>
        </p>
      )}

      {needsContinue && (
        <div className="safe-bottom sticky bottom-0 z-10 -mx-5 mt-auto bg-gradient-to-t from-canvas from-70% to-canvas/0 px-5 pt-6 sm:-mx-8 sm:px-8">
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-44" onClick={onNext} disabled={!answered} arrow>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

/** "Energy", "Energy and Digestion", "Energy, Digestion and Weight". */
function joinAnd(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : (items[0] ?? "");
}

/**
 * A short pause between the last answer and the results, saying in plain words what the check is
 * doing (it is: matching goals, leaving out what doesn't suit, pricing). The result is already
 * saved; a tap shows it straight away.
 */
function Preparing({ name, count, first, onSkip }: { name: string | null; count: number; first: string; onSkip: () => void }) {
  const steps = [`Matching your goals with ${first}'s ${count} products`, "Leaving out anything that doesn't suit you", "Adding prices and the reason for each"];
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Show my recommendations now"
      className="mx-auto flex min-h-full w-full max-w-md cursor-default flex-col justify-center px-6 py-12 text-left"
    >
      <span aria-hidden className="prep-ring mx-auto block h-14 w-14 rounded-full border-[3px] border-sage-soft border-t-moss" />
      <span role="status" aria-live="polite" className="mt-7 block text-center font-display text-[1.65rem] leading-tight text-ink">
        {name ? `${name}, putting your recommendations together` : "Putting your recommendations together"}
      </span>
      <span className="mt-7 grid gap-3">
        {steps.map((s, i) => (
          <span key={s} className="prep-step flex items-center gap-3 text-[0.95rem] leading-snug text-ink-2" style={{ "--i": i } as CSSProperties}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-soft text-moss">
              <Check className="prep-tick h-3.5 w-3.5" />
            </span>
            {s}
          </span>
        ))}
      </span>
    </button>
  );
}
