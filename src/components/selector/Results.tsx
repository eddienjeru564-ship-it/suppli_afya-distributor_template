"use client";

import clsx from "clsx";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CATALOGUE, whatsappMessage, type Answers, type EngineResult } from "@/engine";
import { Portrait } from "@/components/brand/Portrait";
import { TrustList } from "@/components/order/TrustList";
import { AddButton } from "@/components/product/AddButton";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Alert, Check, ChevronDown, ChevronRight, Clock, Minus, Shield, WhatsAppIcon } from "@/components/ui/icons";
import { ChatPreview } from "@/components/whatsapp/ChatPreview";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage, goalMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { answeredCount, goalLabel, perDay, planView, youSaid, type GoalBlock, type LeftOut, type PlanView } from "@/storefront/plan";
import { FORMAT_LABEL, packOf, shortName, supplyShort } from "@/storefront/products";
import { priceSuggestions, type PricedSuggestions, type Suggestion } from "@/storefront/suggestions";

const ease = [0.22, 1, 0.36, 1] as const;

function Appear({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.07 * Math.min(i, 6), ease }}
    >
      {children}
    </m.div>
  );
}

/**
 * What the selector found, arranged to make the decision easy and honest:
 *   1. the plan as one offer, with the customer's name on it: packs, prices, total, one action,
 *      a smaller way to start, and what happens next (nothing is paid now);
 *   2. the proof it's theirs: how many of their answers it was built from, every product checked,
 *      what was left out, and under each goal the words they chose;
 *   3. one goal at a time, each product with why it fits, every caution, and what it costs a day.
 * Nothing is invented: no ratings, no counts of other buyers, no deadlines. The engine's words are
 * used as they are.
 */
export function Results({
  result,
  answers,
  onEdit,
  onRestart,
}: {
  result: EngineResult;
  answers: Answers;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const { sf, goToSection } = useStorefront();
  const s = priceSuggestions(sf, result);
  const view = planView(result, s);
  const p = result.profile;
  const clinic = result.status === "clinic-first";
  const name = p.name || "Here";
  const title = clinic
    ? `${name}, let's start with your clinic.`
    : s.core.length === 0
      ? `${name}, here's what we found.`
      : s.core.length === 1
        ? `${name}, here's where to start.`
        : `${name}, here's what fits.`;
  const hasPlan = !clinic && s.core.length > 0;
  const answered = answeredCount(answers);

  // Arriving from the last question, the title is where reading starts, for every kind of reader.
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);

  // Phones: the plan bar appears once the plan card has scrolled away, so the action is never shown twice.
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardInView, setCardInView] = useState(true);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) {
      setCardInView(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setCardInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [hasPlan]);

  let step = 0;
  return (
    <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-8 sm:pt-8">
      <div className={clsx(hasPlan && "lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12")}>
        <div className={clsx("min-w-0", !hasPlan && "mx-auto max-w-2xl")}>
          <Appear i={step++}>
            <h1 ref={titleRef} tabIndex={-1} data-autofocus className="display-section text-ink outline-none">
              {title}
            </h1>
            {!clinic && (
              <ul aria-label="How this was put together" className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.88rem] text-ink-2">
                <li className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-moss" />
                  Built from your {answered} answers
                  <button type="button" onClick={onEdit} className="-my-3 ml-0.5 inline-flex h-10 items-center font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                    Change
                  </button>
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-moss" />
                  All {CATALOGUE.length} products checked
                </li>
                {result.excluded.length > 0 && (
                  <li className="inline-flex items-center gap-1.5">
                    <Minus className="h-4 w-4 text-moss" />
                    {result.excluded.length} left out for you
                  </li>
                )}
              </ul>
            )}
          </Appear>

          {view.notes.length > 0 && (
            <Appear i={step++} className="mt-6">
              <div
                className={clsx(
                  "rounded-card p-5",
                  result.status === "ready" ? "bg-surface ring-1 ring-ink/[0.07]" : "bg-caution-soft ring-1 ring-caution/20",
                )}
              >
                <div className="flex items-center gap-2 text-[0.92rem] font-semibold text-caution">
                  <Shield />
                  {clinic ? "Speak to your clinic first" : result.status === "review" ? "Check with your doctor or pharmacist first" : "Good to know"}
                </div>
                <div className="mt-2 grid gap-2 text-[0.95rem] leading-relaxed text-ink">
                  {view.notes.map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                </div>
              </div>
            </Appear>
          )}

          {hasPlan && (
            <Appear i={step++} className="mt-6 lg:hidden">
              <div ref={cardRef}>
                <PlanCard s={s} view={view} name={p.name} />
              </div>
            </Appear>
          )}

          {!clinic && (
            <div className="mt-12 grid gap-12">
              {view.goals.map((b) => (
                <Appear key={b.goal} i={step++}>
                  <GoalSection block={b} total={view.goals.length} said={youSaid(b.goal, answers)} />
                </Appear>
              ))}
              {view.extraPicks.length > 0 && (
                <Appear i={step++}>
                  <Group title={view.goals.length ? "Also in your plan" : "Your plan"}>
                    {view.extraPicks.map((x) => (
                      <SuggestionCard key={x.rec.product.id} s={x} />
                    ))}
                  </Group>
                </Appear>
              )}
              {view.extraLater.length > 0 && (
                <Appear i={step++}>
                  <Group title="Also worth a look" note="For something else you told us. No need to start with it.">
                    {view.extraLater.map((x) => (
                      <LaterRow key={x.rec.product.id} s={x} />
                    ))}
                  </Group>
                </Appear>
              )}
            </div>
          )}

          {(result.seeDoctor.length > 0 || view.otherLeftOut.length > 0) && (
            <Appear i={step++} className="mt-12 grid gap-8">
              {result.seeDoctor.length > 0 && (
                <section aria-labelledby="doctor-title">
                  <h2 id="doctor-title" className="font-display text-[1.45rem] leading-tight text-ink">
                    Worth checking with a doctor
                  </h2>
                  <ul className="mt-3 grid gap-2.5">
                    {result.seeDoctor.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[0.98rem] leading-relaxed text-ink">
                        <Shield className="mt-1 h-4 w-4 shrink-0 text-caution" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {view.otherLeftOut.length > 0 && <LeftOutList items={view.otherLeftOut} title="Also left out, and why" level="h2" />}
            </Appear>
          )}

          {result.habits.length > 0 && (
            <Appear i={step++} className="mt-12">
              <section aria-labelledby="habits-title" className="rounded-panel bg-sage-soft p-5 sm:p-7">
                <h2 id="habits-title" className="font-display text-[1.5rem] leading-tight text-ink">
                  Small changes that help
                </h2>
                <p className="mt-1 text-[0.92rem] text-ink-2">Free, and they make everything else work better.</p>
                <ol className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {result.habits.map((h, i) => (
                    <li key={h.id} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface font-display text-[0.95rem] text-moss">
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <div className="font-semibold leading-snug text-ink">{h.title}</div>
                        <p className="mt-0.5 text-[0.88rem] leading-relaxed text-ink-2">{h.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </Appear>
          )}

          <Appear i={step++} className="mt-6">
            <Handoff result={result} answers={answers} />
          </Appear>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Change my answers
            </Button>
            <Button variant="ghost" size="sm" onClick={onRestart}>
              Start again
            </Button>
            <Button variant="ghost" size="sm" onClick={() => goToSection("products")}>
              Browse all products
            </Button>
          </div>

          <p className="mt-6 pb-8 text-center text-[0.78rem] leading-relaxed text-ink-3">
            Reference <span className="font-mono">{result.ref}</span> · General wellness guidance, not medical advice. Supplements don&apos;t replace a varied diet or
            any medicine you&apos;ve been prescribed. Read the label before use.
          </p>
        </div>

        {hasPlan && (
          <aside aria-label="Your plan" className="hidden lg:sticky lg:top-6 lg:block">
            <PlanCard s={s} view={view} name={p.name} />
          </aside>
        )}
      </div>

      <PlanBar s={hasPlan ? s : null} hidden={cardInView} />
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[1.5rem] leading-tight text-ink">{title}</h2>
      {note && <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-2">{note}</p>}
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

/** One goal: its number and name, then the answer: a product, a pointer, or why nothing suits. */
function GoalSection({ block: b, total, said }: { block: GoalBlock; total: number; said: string[] }) {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const id = `goal-${b.goal}`;
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-3.5">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-soft font-display text-[1.15rem] text-moss sm:h-11 sm:w-11 sm:text-[1.25rem]">
          {b.rank + 1}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[0.8rem] font-medium text-ink-3">{total === 1 ? "Your goal" : b.rank === 0 ? "Your main goal" : `Goal ${b.rank + 1}`}</p>
          <h2 id={id} className="mt-0.5 scroll-mt-6 font-display text-[1.6rem] leading-tight text-ink sm:text-[1.9rem]">
            {b.label}
          </h2>
        </div>
      </div>
      {/* Their own words, so the answer below reads as theirs. */}
      {said.length > 0 && (
        <ul aria-label="You told us" className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.8rem]">
          <li aria-hidden className="mr-0.5 text-ink-3">
            You told us
          </li>
          {said.map((x) => (
            <li key={x} className="rounded-full bg-sage-soft px-2.5 py-1 font-medium leading-tight text-moss">
              {x}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3">
        {b.picks.map((x) => (
          <SuggestionCard key={x.rec.product.id} s={x} goal={b.goal} />
        ))}

        {b.status === "covered" && b.coveredBy && (
          <p className="flex items-start gap-2.5 rounded-card bg-surface p-4 text-[0.95rem] leading-relaxed text-ink ring-1 ring-ink/[0.07]">
            <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
            <span>
              <span className="font-semibold">{b.coveredBy.rec.product.name}</span>, above, covers this too. No need for another product.
            </span>
          </p>
        )}

        {b.status === "waiting" && (
          <p className="rounded-card bg-surface p-4 text-[0.95rem] leading-relaxed text-ink-2 ring-1 ring-ink/[0.07]">
            You asked to start small, so this one can wait.{" "}
            {b.later.length ? "When you're ready, this is a good match:" : `When you're ready, ${first} can suggest something.`}
          </p>
        )}

        {b.status === "unmet" && (
          <div className="rounded-card bg-surface p-4 ring-1 ring-ink/[0.07] sm:p-5">
            <p className="text-[1rem] font-semibold text-ink">Nothing here suits you yet.</p>
            {b.leftOut.length > 0 ? (
              <ul className="mt-2 grid gap-2">
                {b.leftOut.map((e) => (
                  <li key={e.product.id} className="flex gap-2.5 text-[0.92rem] leading-relaxed">
                    <Shield className="mt-1 h-4 w-4 shrink-0 text-moss" />
                    <span>
                      <span className="font-semibold text-ink">{e.product.name} was left out.</span> <span className="text-ink-2">{e.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-2">None of the products for this fits your answers.</p>
            )}
            <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{first} can talk you through other options.</p>
            <ContactAction text={goalMessage(sf, b.label.toLowerCase())} variant="outline" size="sm" className="mt-3">
              <WhatsAppIcon className="h-4 w-4 text-wa-deep" /> Ask {first} about {b.label.toLowerCase()}
            </ContactAction>
          </div>
        )}

        {b.later.length > 0 &&
          (b.status === "waiting" ? (
            b.later.map((x) => <LaterRow key={x.rec.product.id} s={x} />)
          ) : (
            <LaterOptions items={b.later} goal={b.label.toLowerCase()} />
          ))}

        {b.leftOut.length > 0 && b.status !== "unmet" && <LeftOutList items={b.leftOut} title="Left out for you" level="h3" />}
      </div>
    </section>
  );
}

/**
 * A product in the plan: picture, name, pack and how long it lasts; why it came up, in the
 * engine's words; every caution, always open; what to expect; then price and add, in the same
 * place as on the product cards.
 */
function SuggestionCard({ s, goal }: { s: Suggestion; goal?: string }) {
  const { openProduct } = useStorefront();
  const { rec, listing } = s;
  const p = rec.product;
  const alsoFor = rec.covers.filter((g) => g !== goal).map((g) => goalLabel(g).toLowerCase());

  return (
    <article className="rounded-card bg-surface p-4 shadow-lift ring-1 ring-ink/[0.07] sm:p-5">
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5">
        <button type="button" onClick={() => openProduct(p.id)} aria-label={`More about ${p.name}`} className="group block">
          <PackArt
            product={p}
            thumb
            sizes="(min-width: 640px) 112px, 88px"
            className="aspect-square w-full rounded-xl ring-1 ring-ink/[0.06]"
            packClassName="transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1"
          />
        </button>
        <div className="min-w-0">
          {alsoFor.length > 0 && (
            <p className="mb-1.5 inline-flex rounded-full bg-sage-soft px-2.5 py-0.5 text-[0.78rem] font-semibold text-moss">Also for {alsoFor.join(" and ")}</p>
          )}
          <h3 className="text-[1.12rem] font-semibold leading-snug text-ink sm:text-[1.25rem]">{p.name}</h3>
          <p className="meta mt-1">
            {packOf(p, listing?.offer) ?? FORMAT_LABEL[p.format]} · {supplyShort(p.supplyDays)}
          </p>
          <button
            type="button"
            onClick={() => openProduct(p.id)}
            className="-my-1 inline-flex h-10 items-center gap-1 text-[0.88rem] font-semibold text-ink underline-offset-4 hover:underline"
          >
            More about it <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ul className="mt-4 grid gap-2">
        {rec.reasons.map((r) => (
          <li key={r} className="flex gap-2.5 text-[0.97rem] leading-relaxed text-ink">
            <Check className="mt-[0.3rem] h-4 w-4 shrink-0 text-accent" />
            {r}
          </li>
        ))}
      </ul>

      {rec.cautions.length > 0 && (
        <div className="mt-3 grid gap-1.5 rounded-xl bg-caution-soft p-3.5">
          {rec.cautions.map((c) => (
            <p key={c} className="flex gap-2 text-[0.88rem] leading-snug text-ink">
              <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
              {c}
            </p>
          ))}
        </div>
      )}

      <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-2">
        <span className="font-semibold text-ink">What to expect. </span>
        {p.expectation}
      </p>

      <BuyRow s={s} big />
    </article>
  );
}

/** Price and the add, or a way to ask when it can't be ordered here. */
function BuyRow({ s, big }: { s: Suggestion; big?: boolean }) {
  const { sf } = useStorefront();
  const { listing } = s;
  const p = s.rec.product;
  const first = sf.distributor.firstName;
  const daily = listing ? perDay(listing.offer.price, p.supplyDays) : null;
  return (
    <div className={clsx("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", big ? "mt-4 border-t border-ink/10 pt-3" : "mt-2")}>
      {listing ? (
        <span className="leading-tight">
          <span className={clsx("price block font-semibold text-ink", big ? "text-[1.2rem]" : "text-[1rem]")}>{kes(listing.offer.price)}</span>
          {daily && <span className="mt-0.5 block text-[0.8rem] text-ink-3">About {kes(daily)} a day</span>}
        </span>
      ) : (
        <span className="text-[0.88rem] text-ink-3">Not on {first}&apos;s price list yet</span>
      )}
      {s.orderable ? (
        <AddButton product={p} from="selector" />
      ) : (
        <ContactAction text={askMessage(sf, p)} variant="outline" size="sm">
          <WhatsAppIcon className="h-4 w-4 text-wa-deep" /> {listing ? `Out of stock · Ask ${first}` : `Ask ${first}`}
        </ContactAction>
      )}
    </div>
  );
}

/**
 * A good match kept for later, in a few lines: the first reason (the rest is on the product
 * page) and every caution, which always travels with the add.
 */
function LaterRow({ s }: { s: Suggestion }) {
  const { openProduct } = useStorefront();
  const { rec, listing } = s;
  const p = rec.product;
  return (
    <div className="flex gap-3 rounded-card bg-surface p-3 ring-1 ring-ink/[0.07] sm:p-3.5">
      <button type="button" onClick={() => openProduct(p.id)} aria-label={`More about ${p.name}`} className="shrink-0 self-start">
        <PackArt product={p} thumb sizes="64px" className="aspect-square w-14 rounded-lg ring-1 ring-ink/[0.06] sm:w-16" />
      </button>
      <div className="min-w-0 flex-1">
        {/* Padded to a full-size target without moving the text. */}
        <button
          type="button"
          onClick={() => openProduct(p.id)}
          className="-my-2.5 block py-2.5 text-left text-[0.98rem] font-semibold leading-snug text-ink underline-offset-4 hover:underline"
        >
          {p.name}
        </button>
        <p className="meta mt-0.5">
          {packOf(p, listing?.offer) ?? FORMAT_LABEL[p.format]} · {supplyShort(p.supplyDays)}
        </p>
        {rec.reasons[0] && <p className="mt-1.5 text-[0.9rem] leading-snug text-ink-2">{rec.reasons[0]}</p>}
        {rec.cautions.map((c) => (
          <p key={c} className="mt-1.5 flex gap-1.5 text-[0.85rem] leading-snug text-caution">
            <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {c}
          </p>
        ))}
        <BuyRow s={s} />
      </div>
    </div>
  );
}

/** Other good matches for a goal, folded into one line until wanted, so the plan stays the focus. */
function LaterOptions({ items, goal }: { items: Suggestion[]; goal: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-card bg-sunken/50">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center gap-3 p-3 text-left sm:p-3.5"
      >
        <span aria-hidden className="flex shrink-0 -space-x-3">
          {items.slice(0, 3).map((x) => (
            <PackArt key={x.rec.product.id} product={x.rec.product} thumb sizes="40px" className="aspect-square w-10 rounded-lg ring-2 ring-canvas" />
          ))}
        </span>
        <span className="min-w-0 flex-1 leading-snug">
          <span className="block text-[0.92rem] font-semibold text-ink">
            {items.length === 1 ? "One more" : `${items.length} more`} for {goal}, for later
          </span>
          <span className="block text-[0.82rem] text-ink-3">{items.map((x) => x.rec.product.name).join(" · ")}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div id={id} hidden={!open} className="grid gap-2.5 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
        {items.map((x) => (
          <LaterRow key={x.rec.product.id} s={x} />
        ))}
      </div>
    </div>
  );
}

function LeftOutList({ items, title, level }: { items: LeftOut[]; title: string; level: "h2" | "h3" }) {
  const H = level;
  return (
    <section className={clsx(level === "h3" && "rounded-card bg-sunken/60 p-4")}>
      <H
        className={clsx(
          "flex items-center gap-2 text-ink",
          level === "h2" ? "font-display text-[1.45rem] leading-tight" : "text-[0.9rem] font-semibold",
        )}
      >
        {level === "h3" && <Shield className="h-4 w-4 text-moss" />}
        {title}
      </H>
      <ul className={clsx("grid gap-2.5", level === "h2" ? "mt-3" : "mt-2")}>
        {items.map((e) => (
          <li key={e.product.id} className="text-[0.92rem] leading-relaxed">
            <span className="font-semibold text-ink">{e.product.name}.</span> <span className="text-ink-2">{e.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Adds every product in the plan that isn't in the order yet, then shows the order. */
function usePlanActions(s: PricedSuggestions) {
  const { qtyOf, addToOrder, openOrder } = useStorefront();
  const allIn = s.orderableCore.length > 0 && s.orderableCore.every((x) => qtyOf(x.rec.product.id) > 0);
  const addPlan = () => {
    for (const x of s.orderableCore) if (!qtyOf(x.rec.product.id)) addToOrder(x.rec.product.id, { from: "selector", quiet: true });
    openOrder();
  };
  return { allIn, addPlan, openOrder, label: s.orderableCore.length > 1 ? "Add the whole plan" : "Add to order" };
}

/**
 * The plan as one offer, with the customer's name on it: each product and what it's for, the
 * total, one main action, a smaller way to start for anyone unsure about the whole plan, and what
 * happens next. In the flow on phones, beside the detail (sticky) on large screens.
 */
function PlanCard({ s, view, name }: { s: PricedSuggestions; view: PlanView; name: string | null }) {
  const { sf, openProduct, qtyOf, addToOrder } = useStorefront();
  const { allIn, addPlan, openOrder, label } = usePlanActions(s);
  const reduce = useReducedMotion();
  const first = sf.distributor.firstName;
  const lead = s.orderableCore[0];
  const nothingIn = s.orderableCore.every((x) => !qtyOf(x.rec.product.id));
  const seeGoal = (g: string) => document.getElementById(`goal-${g}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="rounded-panel bg-surface p-4 shadow-lift ring-1 ring-ink/[0.07] sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className="font-display text-[1.4rem] leading-tight text-ink">
          {name ? `${name}'s plan` : "Your plan"}
        </h2>
        <span className="shrink-0 text-[0.82rem] text-ink-3">
          {s.core.length} {s.core.length === 1 ? "product" : "products"}
        </span>
      </div>

      <ul className="mt-2 divide-y divide-ink/[0.07]">
        {s.core.map((x) => (
          <li key={x.rec.product.id}>
            <button
              type="button"
              onClick={() => openProduct(x.rec.product.id)}
              className="flex w-full items-center gap-3 py-2.5 text-left"
              aria-label={`More about ${x.rec.product.name}`}
            >
              <PackArt product={x.rec.product} thumb sizes="56px" className="aspect-square w-14 shrink-0 rounded-xl ring-1 ring-ink/[0.06]" />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[0.95rem] font-semibold text-ink">{x.rec.product.name}</span>
                <span className="mt-0.5 block text-[0.8rem] text-ink-3">
                  {x.rec.covers.length ? `For ${x.rec.covers.map((g) => goalLabel(g).toLowerCase()).join(" and ")}` : "A strong match for you"}
                </span>
              </span>
              <span className="price shrink-0 text-[0.95rem] font-semibold text-ink">{x.listing ? kes(x.listing.offer.price) : <span className="text-ink-3">Ask</span>}</span>
            </button>
          </li>
        ))}
        {view.unmet.map((g) => (
          <li key={g}>
            <button type="button" onClick={() => seeGoal(g)} className="flex min-h-12 w-full items-center gap-2.5 py-2 text-left text-[0.85rem] text-ink-2">
              <Minus className="h-4 w-4 shrink-0 text-ink-3" />
              <span className="flex-1">Nothing suitable for {goalLabel(g).toLowerCase()}</span>
              <span className="font-semibold text-ink underline decoration-ink/25 underline-offset-4">See why</span>
            </button>
          </li>
        ))}
        {view.waiting.map((g) => (
          <li key={g} className="flex min-h-12 items-center gap-2.5 py-2 text-[0.85rem] text-ink-2">
            <Clock className="h-4 w-4 shrink-0 text-ink-3" />
            {goalLabel(g)} can wait until you&apos;re ready
          </li>
        ))}
      </ul>

      {s.orderableCore.length > 0 && (
        <>
          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-3.5">
            <span className="text-[0.9rem] text-ink-2">{s.orderableCore.length > 1 ? "Total, one pack each" : "Total"}</span>
            <span className="price text-[1.45rem] font-semibold text-ink">{kes(s.coreTotal)}</span>
          </div>
          {allIn ? (
            <Button variant="outline" size="lg" className="mt-4 w-full" onClick={openOrder}>
              <Check /> In your order · View
            </Button>
          ) : (
            <Button variant="accent" size="lg" arrow className="mt-4 w-full" onClick={addPlan}>
              {label}
            </Button>
          )}
          {/* For anyone who wants to try one thing first: a smaller yes beats a no. */}
          {!allIn && nothingIn && s.orderableCore.length > 1 && lead && (
            <button
              type="button"
              onClick={() => {
                addToOrder(lead.rec.product.id, { from: "selector", quiet: true });
                openOrder();
              }}
              className="mt-1 block min-h-11 w-full px-2 py-2.5 text-center text-[0.88rem] font-semibold leading-snug text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              Or start with just {shortName(lead.rec.product)} ·{"\u00a0"}
              <span className="whitespace-nowrap">{kes(lead.listing!.offer.price)}</span>
            </button>
          )}
        </>
      )}

      <TrustList className="mt-4" />
      <div className="mt-2 flex justify-center">
        <ContactAction text={askMessage(sf)} variant="ghost" size="sm">
          <WhatsAppIcon className="h-4 w-4 text-wa-deep" /> Questions first? Message {first}
        </ContactAction>
      </div>
    </section>
  );
}

/**
 * Phones: the plan's total and its one action stay under the thumb while reading. Once the plan
 * is in the order, the same bar shows the order instead.
 */
function PlanBar({ s, hidden }: { s: PricedSuggestions | null; hidden: boolean }) {
  const { priced: cart } = useStorefront();
  const plan = usePlanActions(s ?? { core: [], addons: [], orderableCore: [], coreTotal: 0 });
  const offerPlan = Boolean(s && s.orderableCore.length > 0 && !plan.allIn);
  const show = !hidden && (offerPlan || cart.count > 0);
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="safe-bottom sticky bottom-0 z-10 -mx-5 px-3 pt-3 sm:-mx-8 lg:hidden"
        >
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[1.1rem] bg-night p-2 text-white shadow-float">
            <div className="min-w-0 flex-1 pl-2.5 leading-tight">
              <div className="text-[0.78rem] text-white/65">
                {offerPlan
                  ? `Your plan · ${s!.orderableCore.length} ${s!.orderableCore.length === 1 ? "product" : "products"}`
                  : `${cart.count} ${cart.count === 1 ? "item" : "items"} in your order`}
              </div>
              <div className="price text-[1.05rem] font-semibold">{kes(offerPlan ? s!.coreTotal : cart.subtotal)}</div>
            </div>
            {offerPlan ? (
              <Button variant="light" onClick={plan.addPlan}>
                {plan.label}
              </Button>
            ) : (
              <Button variant="light" onClick={plan.openOrder}>
                Review order
              </Button>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Suppli Afya prepares the context; the distributor takes over the conversation. */
function Handoff({ result, answers }: { result: EngineResult; answers: Answers }) {
  const { sf } = useStorefront();
  const [preview, setPreview] = useState(false);
  const [phone, setPhone] = useState("");
  const d = sf.distributor;
  const message = whatsappMessage(result, { distributorName: d.name, distributorFirstName: d.firstName });
  const recorded = sf.status === "live" && Boolean(sf.suppliSlug);

  /** Save the lead in the distributor's Suppli Afya workspace. Never blocks the WhatsApp handoff. */
  const saveLead = () => {
    if (!recorded) return;
    try {
      fetch("/api/leads", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: sf.slug, answers, ref: result.ref, phone: phone || undefined }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  return (
    <section aria-labelledby="handoff-title" className="rounded-panel bg-surface p-5 ring-1 ring-ink/[0.07] sm:p-7">
      <div className="flex items-center gap-3">
        <Portrait distributor={d} size="md" />
        <div className="leading-tight">
          <h2 id="handoff-title" className="font-display text-[1.5rem] leading-tight">
            Want to talk it through?
          </h2>
          <div className="mt-0.5 text-[0.85rem] text-ink-3">{d.name} · on WhatsApp</div>
        </div>
      </div>
      <p className="mt-4 max-w-[34rem] text-[0.96rem] leading-relaxed text-ink-2">
        Send {d.firstName} your answers and this plan, so you don&apos;t have to explain it all again.
      </p>
      {recorded && (
        <label className="mt-5 block max-w-sm text-[0.84rem] font-medium text-ink-2">
          Your WhatsApp number <span className="text-ink-3">(optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            className="mt-1.5 w-full rounded-control bg-canvas px-3.5 py-3 text-[1rem] text-ink outline-none ring-1 ring-ink/12 placeholder:text-ink-3 focus:ring-2 focus:ring-accent"
          />
        </label>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <ContactAction text={message} title={`Your message to ${d.firstName}`} size="lg" onSend={saveLead} className="w-full sm:w-auto">
          <WhatsAppIcon /> Send to {d.firstName} on WhatsApp
        </ContactAction>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          aria-expanded={preview}
          className="h-11 text-[0.9rem] font-semibold text-ink-2 underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink sm:h-12 sm:px-2"
        >
          {preview ? "Hide the message" : "See the message first"}
        </button>
      </div>
      <p className="mt-2 max-w-[34rem] text-[0.78rem] leading-snug text-ink-3">
        {recorded
          ? `Sending shares your answers and suggestions with ${d.firstName}, in WhatsApp and in ${d.firstName}'s Suppli Afya workspace.`
          : "This opens WhatsApp with the message written. Nothing is sent until you press send there."}
      </p>
      <AnimatePresence initial={false}>
        {preview && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <ChatPreview message={message} to={d.name} className="mt-5" />
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
