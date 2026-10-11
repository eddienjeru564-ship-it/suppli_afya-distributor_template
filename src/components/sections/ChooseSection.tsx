"use client";

import clsx from "clsx";
import { useState } from "react";
import { GOALS_BY_ID, SECTIONS, QUESTIONS_BY_ID, type GoalId } from "@/engine";
import type { GoalMeta } from "@/engine/goals";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Check, ChevronDown, Lock } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { MAX_INTERESTS, interestGroups, toggleInterest } from "@/storefront/interests";
import { kes } from "@/storefront/money";
import { priceSuggestions } from "@/storefront/suggestions";

/**
 * "What would you like help with?" The first step of the recommendations, on the page itself.
 * The interests picked here (up to three, most important first) are the selector's goals
 * answer, so the questions start from them and never ask again. Nothing picked is fine too:
 * the selector then asks about goals as usual. Once there's a result, this section shows it.
 */
export function ChooseSection() {
  const { result } = useStorefront();
  return (
    <section id="choose" aria-labelledby="choose-title" className="container-x scroll-mt-20 py-6 md:py-10">
      <div className="rounded-panel bg-sage-soft px-5 py-10 sm:px-8 sm:py-12 md:px-12 md:py-14">
        {result ? <YourSuggestions /> : <Interests />}
      </div>
    </section>
  );
}

function goalsIn(answers: Record<string, unknown> | undefined): GoalId[] {
  const g = answers?.goals;
  return Array.isArray(g) ? g.filter((x): x is GoalId => typeof x === "string" && x in GOALS_BY_ID) : [];
}

function Interests() {
  const { sf, session, openSelector } = useStorefront();
  const first = sf.distributor.firstName;
  const { first: shownFirst, more } = interestGroups();

  // The picks follow the selector: what was chosen there (or here, earlier) shows here when they come back.
  const fromSession = goalsIn(session?.answers);
  const sessionKey = fromSession.join(",");
  const [picked, setPicked] = useState<GoalId[]>(fromSession);
  const [syncedWith, setSyncedWith] = useState(sessionKey);
  if (syncedWith !== sessionKey) {
    setSyncedWith(sessionKey);
    setPicked(fromSession);
  }
  const [showAll, setShowAll] = useState(false);
  const [nudge, setNudge] = useState(false);

  const inProgress = session && session.currentId !== "disclaimer" ? session : null;
  const part = inProgress ? SECTIONS.findIndex((s) => s.id === QUESTIONS_BY_ID[inProgress.currentId]?.section) + 1 : 0;
  const full = picked.length >= MAX_INTERESTS;
  // Collapsed: the first six, plus anything picked from the rest, so a choice never disappears.
  const visible: GoalMeta[] = showAll ? [...shownFirst, ...more] : [...shownFirst, ...more.filter((g) => picked.includes(g.id))];
  const hiddenCount = shownFirst.length + more.length - visible.length;

  const toggle = (id: GoalId) => {
    if (full && !picked.includes(id)) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setPicked((p) => toggleInterest(p, id));
  };

  const status =
    picked.length === 0
      ? "Not sure yet? Just continue, and we'll help you narrow it down."
      : full
        ? nudge
          ? `You can choose up to ${MAX_INTERESTS}. Tap one you've chosen to swap it.`
          : `${MAX_INTERESTS} of ${MAX_INTERESTS} chosen. About 3 minutes from here.`
        : `${picked.length} of ${MAX_INTERESTS} chosen. About 3 minutes from here.`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-14">
      <Reveal className="min-w-0">
        <h2 id="choose-title" className="display-section max-w-[14ch] text-ink">
          What would you like help with?
        </h2>
        <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-relaxed text-ink-2">
          Choose up to three, starting with what matters most. A few short questions follow, then you&apos;ll see what may
          suit you, with prices and the reasons why.
        </p>
        <p className="mt-6 hidden max-w-[30rem] items-start gap-2 text-[0.84rem] leading-snug text-ink-3 lg:flex">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
          <span>
            Your answers stay in this browser. {first} only sees them if you choose to send them. General guidance, not
            medical advice.
          </span>
        </p>
      </Reveal>

      <div className="min-w-0">
        {inProgress && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card bg-surface/70 px-4 py-3 ring-1 ring-ink/[0.06]">
            <span className="text-[0.9rem] text-ink-2">
              <span className="font-semibold text-ink">You&apos;re part-way through.</span> Part {Math.max(1, part)} of{" "}
              {SECTIONS.length}: {SECTIONS[Math.max(0, part - 1)]?.label}
            </span>
            <button
              type="button"
              onClick={() => openSelector({ fresh: true })}
              className="text-[0.86rem] font-semibold text-ink-2 underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              Start again
            </button>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5" aria-label="Wellness interests">
          {visible.map((g, i) => {
            const rank = picked.indexOf(g.id);
            const on = rank >= 0;
            const blocked = full && !on;
            return (
              <li key={g.id} className={clsx(i >= shownFirst.length && "interest-in")}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-disabled={blocked || undefined}
                  onClick={() => toggle(g.id)}
                  className={clsx(
                    "relative flex h-full w-full flex-col justify-start rounded-card bg-surface px-3.5 py-3 text-left transition-[box-shadow,opacity,background-color] duration-200 sm:px-4 sm:py-3.5",
                    on ? "ring-2 ring-accent" : "ring-1 ring-ink/[0.08] hover:ring-ink/25",
                    blocked && "opacity-55",
                  )}
                >
                  <span className="block pr-6 text-[0.93rem] font-semibold leading-snug text-ink sm:text-[0.95rem]">{g.label}</span>
                  <span className="mt-0.5 block text-[0.78rem] leading-snug text-ink-3 sm:pr-4 sm:text-[0.8rem]">{g.hint}</span>
                  {/* Filled with its place in the order once picked: the first counts most. */}
                  <span
                    aria-hidden
                    className={clsx(
                      "absolute right-3 top-3 grid h-[1.3rem] w-[1.3rem] place-items-center rounded-full text-[0.7rem] font-bold transition-colors sm:right-3.5 sm:top-3.5",
                      on ? "bg-accent text-on-accent" : "ring-1 ring-inset ring-ink/20",
                    )}
                  >
                    {on && (picked.length > 1 ? rank + 1 : <Check className="h-3 w-3" />)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {(showAll || hiddenCount > 0) && (
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-1 text-[0.9rem] font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            {showAll ? "Show fewer" : `View all interests (${hiddenCount} more)`}
            <ChevronDown className={clsx("h-4 w-4 transition-transform duration-300", showAll && "rotate-180")} />
          </button>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p aria-live="polite" className="text-center text-[0.86rem] leading-snug text-ink-2 sm:text-left">
            {status}
          </p>
          <Button variant="accent" size="lg" arrow onClick={() => openSelector({ interests: picked })} className="w-full shrink-0 px-8 sm:w-auto">
            Continue
          </Button>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[0.82rem] leading-snug text-ink-3 lg:hidden">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
          <span>Your answers stay in this browser. {first} only sees them if you choose to send them. Not medical advice.</span>
        </p>
      </div>
    </div>
  );
}

/** A compact version of the result: what came up and what it costs, one tap from the order. */
function YourSuggestions() {
  const { sf, result, openSelector, addToOrder, qtyOf, openOrder } = useStorefront();
  if (!result) return null;
  const first = sf.distributor.firstName;
  const priced = priceSuggestions(sf, result);
  const goals = result.profile.goals.map((g) => GOALS_BY_ID[g]?.label).filter(Boolean);
  const clinic = result.status === "clinic-first";
  const allIn = priced.orderableCore.length > 0 && priced.orderableCore.every((s) => qtyOf(s.rec.product.id) > 0);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-14">
      <Reveal className="min-w-0">
        <h2 id="choose-title" className="display-section max-w-[14ch] text-ink">
          What fits, based on what you told us.
        </h2>
        <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-relaxed text-ink-2">
          Each suggestion comes with the reason it came up. Add what you&apos;d like to your order, or send the whole thing to{" "}
          {first} to talk it through.
        </p>
      </Reveal>

      <div className="min-w-0 rounded-card bg-surface p-4 ring-1 ring-ink/[0.06] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-ink-3">Your recommendations</span>
          <span className="font-mono text-[0.78rem] text-ink-3">{result.ref}</span>
        </div>
        {goals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {goals.map((g, i) => (
              <span key={g} className="rounded-full bg-sage-soft px-2.5 py-1 text-[0.78rem] font-medium text-moss">
                {i + 1}. {g}
              </span>
            ))}
          </div>
        )}

        {clinic ? (
          <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-2">{result.planNotes[0]}</p>
        ) : priced.core.length === 0 ? (
          <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-2">
            Nothing in the range suited your answers well enough to suggest. {first} can talk you through other options.
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-2">
            {priced.core.map((s) => (
              <li key={s.rec.product.id} className="flex items-center gap-3.5 rounded-xl bg-canvas p-2.5 pr-3">
                <PackArt product={s.rec.product} thumb className="aspect-square w-14 shrink-0 rounded-lg ring-1 ring-ink/[0.06]" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug text-ink">{s.rec.product.name}</div>
                  <div className="hidden truncate text-[0.82rem] text-ink-3 sm:block">{s.rec.reasons[0]}</div>
                  {/* Phones: the price under the name, so the name gets the full width. */}
                  <div className="price mt-0.5 text-[0.88rem] text-ink-2 sm:hidden">{s.listing ? kes(s.listing.offer.price) : `Ask ${first}`}</div>
                </div>
                <div className="price hidden shrink-0 text-right text-[0.92rem] font-semibold text-ink sm:block">
                  {s.listing ? kes(s.listing.offer.price) : <span className="text-ink-3">Ask</span>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {!clinic && priced.orderableCore.length > 0 && (
            <Button
              variant="accent"
              onClick={() => {
                if (allIn) return openOrder();
                for (const s of priced.orderableCore) if (!qtyOf(s.rec.product.id)) addToOrder(s.rec.product.id, { from: "selector", quiet: true });
                openOrder();
              }}
            >
              {allIn ? "View order" : priced.orderableCore.length > 1 ? `Add all · ${kes(priced.coreTotal)}` : `Add to order · ${kes(priced.coreTotal)}`}
            </Button>
          )}
          <Button variant="outline" onClick={() => openSelector()} arrow>
            Why these came up
          </Button>
        </div>
        <button
          type="button"
          onClick={() => openSelector({ fresh: true })}
          className="mt-4 text-[0.84rem] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline"
        >
          Start again with different answers
        </button>
      </div>
    </div>
  );
}
