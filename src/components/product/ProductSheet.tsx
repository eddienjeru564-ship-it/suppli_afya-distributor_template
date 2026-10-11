"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { paymentPhrase } from "@/components/sections/Ordering";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Alert, Check, Share, Shield, Truck, Wallet, WhatsAppIcon } from "@/components/ui/icons";
import { keepTogether } from "@/components/ui/KeepTogether";
import { Sheet, SheetBody, SheetFooter, SheetHandle, SheetHeader, useSheet } from "@/components/ui/Sheet";
import { useIsDesktop } from "@/components/ui/useMediaQuery";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { ALWAYS_CHECK, FORMAT_LABEL, checkNotes, findListing, goalsOf, packOf, supplyLabel, type Listing } from "@/storefront/products";
import { PackArt } from "./PackArt";
import { QtyStepper } from "./QtyStepper";

/**
 * A product, explained without leaving the page. The order of sections follows the
 * questions a customer has, in the order they have them: what is it, why would I take it,
 * what's in it, how is it taken, what does it cost and how much do I get, then order or ask.
 */
export function ProductSheet() {
  const { sf, overlays, close } = useStorefront();
  const listing = overlays.product ? findListing(sf, overlays.product) : null;
  // Keep the last product rendered while the sheet animates out.
  const [shown, setShown] = useState<Listing | null>(listing);
  if (listing && listing !== shown && listing.product.id !== shown?.product.id) setShown(listing);

  return (
    <Sheet open={Boolean(listing)} onClose={() => close("product")} kind="dialog" size="lg" z={60}>
      {shown && <ProductDetail key={shown.product.id} listing={shown} />}
    </Sheet>
  );
}

function ProductDetail({ listing }: { listing: Listing }) {
  const { sf, addToOrder, qtyOf, close, openSelector, notify } = useStorefront();
  const desktop = useIsDesktop();
  const sheet = useSheet();
  const { product: p, offer } = listing;
  const [qty, setQty] = useState(1);
  const inOrder = qtyOf(p.id);
  const out = offer.inStock === false;
  const notes = checkNotes(p, sf.distributor.firstName);
  const first = sf.distributor.firstName;
  const pack = packOf(p, offer);
  const supply = supplyLabel(p.supplyDays);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} · ${kes(offer.price)}`, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const add = () => {
    addToOrder(p.id, { qty });
    close("product");
  };

  const payBy = paymentPhrase(sf);
  const { delivery, pickup } = sf.fulfilment;
  // Reassurance where the decision is made: nothing is paid now, how you pay, how it reaches you.
  const trust = [
    { icon: <Shield className="h-4 w-4" />, text: `${first} confirms stock and the total before you pay` },
    payBy && { icon: <Wallet className="h-4 w-4" />, text: `Pay by ${payBy}` },
    (delivery || pickup) && {
      icon: <Truck className="h-4 w-4" />,
      text: delivery && pickup ? "Delivery or collection, agreed with you first" : delivery ? "Delivered to you, cost agreed first" : `Collect: ${pickup!.label}`,
    },
  ].filter(Boolean) as { icon: ReactNode; text: string }[];

  const reassurance = (
    <ul className="grid gap-2 rounded-card bg-sage-soft px-4 py-3.5 text-[0.88rem] leading-snug text-ink">
      {trust.map((t) => (
        <li key={t.text} className="flex items-start gap-2.5">
          <span className="mt-px text-moss">{t.icon}</span>
          <span>{keepTogether(t.text)}</span>
        </li>
      ))}
    </ul>
  );

  const facts = (
    <div>
      {/* Safety is never folded away. */}
      <section className="mb-6">
        <h3 className="mb-2.5 text-[0.98rem] font-semibold text-ink">Check before you buy</h3>
        <ul className={clsx("grid gap-2 rounded-card p-4 text-[0.92rem] leading-relaxed", notes.length ? "bg-caution-soft" : "bg-surface ring-1 ring-ink/[0.06]")}>
          {notes.map((n) => (
            <li key={n} className="flex gap-2.5 text-ink">
              <Alert className="mt-1 h-3.5 w-3.5 shrink-0 text-caution" />
              <span>{n}</span>
            </li>
          ))}
          <li className="flex gap-2.5 text-ink-2">
            <Alert className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-3" />
            <span>{ALWAYS_CHECK}</span>
          </li>
        </ul>
      </section>

      <Disclosure title="What's in it" defaultOpen>
        <ul className="grid gap-1.5">
          {p.keyIngredients.map((k) => (
            <li key={k} className="flex gap-2.5">
              <span className="mt-[0.6rem] h-1 w-1 shrink-0 rounded-full bg-moss" />
              {k}
            </li>
          ))}
        </ul>
      </Disclosure>
      <Disclosure title="How it's taken">
        <p>
          {FORMAT_LABEL[p.format]}.{pack && ` One pack holds ${pack}.`} Follow the dose on the label, or as {first} advises.{" "}
          {supply} at the usual dose.
        </p>
      </Disclosure>
      <Disclosure title="What to expect">
        <p>{p.expectation}</p>
      </Disclosure>
      {p.note && (
        <Disclosure title="Good to know">
          <p>{p.note}</p>
        </Disclosure>
      )}

      <div className="mt-6 rounded-card bg-surface p-4 ring-1 ring-ink/[0.06]">
        <p className="text-[0.92rem] leading-relaxed text-ink">
          <span className="font-semibold">Not sure it suits you?</span> A few questions about your goals, medicines, allergies
          and pregnancy, and anything that doesn&apos;t fit is left out, with the reason.
        </p>
        <Button
          variant="accent"
          size="sm"
          className="mt-3"
          arrow
          onClick={() => {
            close("product");
            setTimeout(() => openSelector({ goal: p.goals[0] }), 60);
          }}
        >
          Find My Recommendations
        </Button>
      </div>

      {!p.verified && (
        <p className="mt-5 text-[0.8rem] leading-relaxed text-ink-3">
          Product details are still being checked against the official BF Suma catalogue. Always read the pack label before
          use.
        </p>
      )}
    </div>
  );

  const header = (
    <div>
      <h2 id={sheet?.titleId} className="display-card text-ink">
        {p.name}
      </h2>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="price text-[1.45rem] font-semibold text-ink">{kes(offer.price)}</span>
        <span className="text-[0.9rem] text-ink-3">{[pack ?? FORMAT_LABEL[p.format], supply].filter(Boolean).join(" · ")}</span>
      </div>
      {out && <p className="mt-1 text-[0.88rem] font-medium text-caution">Out of stock right now. Ask {first} when it&apos;s back.</p>}
      <div className="mt-4">
        <h3 className="text-[0.8rem] font-medium text-ink-3">Often chosen for</h3>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {goalsOf(p).map((g) => (
            <li key={g.id} className="rounded-full bg-sage-soft px-3 py-1 text-[0.85rem] font-medium text-moss">
              {g.label}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">{p.summary}</p>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2.5">
      {!out && <QtyStepper value={qty} onChange={setQty} name={p.name} />}
      {out ? (
        <ContactAction text={askMessage(sf, p)} className="flex-1" size="lg">
          <WhatsAppIcon /> Ask {first} about it
        </ContactAction>
      ) : (
        <Button variant="primary" size="lg" className="flex-1" onClick={add}>
          Add to order · <span className="price">{kes(offer.price * qty)}</span>
        </Button>
      )}
    </div>
  );

  const secondary = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {!out && (
        <ContactAction text={askMessage(sf, p)} unstyled className="inline-flex h-10 items-center gap-2 text-[0.9rem] font-semibold text-ink hover:text-accent">
          <WhatsAppIcon className="h-4 w-4 text-[#1a9e4b]" /> Ask {first} about it
        </ContactAction>
      )}
      {inOrder > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-ink-3">
          <Check className="h-3.5 w-3.5 text-accent" /> {inOrder} in your order
        </span>
      )}
    </div>
  );

  const shareButton = (
    <button
      type="button"
      onClick={share}
      aria-label="Share this product"
      className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
    >
      <Share />
    </button>
  );

  if (desktop) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PackArt product={p} center className="h-full min-h-[34rem]" sizes="(min-width: 1024px) 30rem, 45vw" />
        <div className="flex min-h-0 flex-col">
          <SheetHeader className="pb-0">
            <div className="flex justify-end">{shareButton}</div>
          </SheetHeader>
          <SheetBody className="px-8 pb-8">
            {header}
            <div className="mt-6 grid gap-4">
              {actions}
              {secondary}
              {reassurance}
            </div>
            <div className="mt-8">{facts}</div>
          </SheetBody>
        </div>
      </div>
    );
  }

  return (
    <>
      <SheetHandle />
      <SheetBody>
        <div className="relative">
          <PackArt product={p} className="mx-5 aspect-[16/11] rounded-card ring-1 ring-ink/[0.06]" sizes="100vw" />
          <div className="absolute right-7 top-2 flex gap-1">
            <span className="rounded-full bg-canvas/80 backdrop-blur">{shareButton}</span>
            <button
              type="button"
              onClick={() => close("product")}
              aria-label="Close"
              className="grid h-11 w-11 place-items-center rounded-full bg-canvas/80 text-ink backdrop-blur"
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-5 pb-8 pt-5">
          {header}
          <div className="mt-3">{secondary}</div>
          <div className="mt-5">{reassurance}</div>
          <div className="mt-7">{facts}</div>
        </div>
      </SheetBody>
      <SheetFooter>{actions}</SheetFooter>
    </>
  );
}
