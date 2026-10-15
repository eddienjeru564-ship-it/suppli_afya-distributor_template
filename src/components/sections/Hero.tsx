"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { Portrait } from "@/components/brand/Portrait";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Pin, WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { listings, shortName } from "@/storefront/products";

/**
 * First screen. One clear promise, one main action (the guided path), and a quiet way
 * straight to the products for people who already know what they want. On the right, real
 * packs with real prices and the person you'd be buying from.
 */
export function Hero() {
  const { sf, openSelector, goToSection } = useStorefront();
  const count = Object.keys(sf.catalogue.offers).length;
  // The words are on screen from the first paint and only settle into place; nothing waits on them.
  const rise = (i: number) => ({ className: "settle", style: { "--i": i } as CSSProperties });

  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="container-x grid grid-cols-1 gap-9 pb-16 pt-6 sm:gap-12 sm:pt-8 md:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
        <div>
          <h1 {...rise(0)} id="hero-title">
            {/* Broken by hand so the promise reads in three even lines at every width. */}
            <span className="display-hero block text-ink">
              <span className="block">Find the right</span>{" "}
              <span className="block">wellness products</span>{" "}
              <em className="block italic text-accent">for your goals.</em>
            </span>
          </h1>
          <p {...rise(1)}>
            <span className="lede mt-5 block max-w-[32rem] sm:mt-6">
              Answer a few simple questions about your wellness goals and get personalised recommendations to help you
              explore the BF Suma products that may be right for you.
            </span>
          </p>

          <div {...rise(2)}>
            {/* Phones: the button, what it takes, then the quieter way in. Wider: side by side. */}
            <div className="mt-7 grid grid-cols-1 justify-items-center sm:mt-9 sm:grid-cols-[auto_auto] sm:items-center sm:justify-start sm:gap-x-8">
              <Button variant="accent" size="lg" arrow onClick={() => openSelector()} className="w-full px-7 sm:w-auto">
                Find My Recommendations
              </Button>
              <p className="mt-3 text-[0.84rem] text-ink-3 sm:order-last sm:col-span-2 sm:mt-4 sm:justify-self-start">
                About 3 minutes · No account needed
              </p>
              <a
                href="#products"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection("products");
                }}
                className="mt-2 inline-flex min-h-11 items-center text-[0.98rem] font-semibold text-ink underline decoration-ink/25 decoration-1 underline-offset-[6px] transition-colors hover:decoration-ink sm:mt-0"
              >
                Browse all {count} products
              </a>
            </div>
          </div>
        </div>

        <div {...rise(3)}>
          <StillLife />
        </div>
      </div>
    </section>
  );
}

/**
 * Three of the distributor's products on white cards, each with its name and price, like the
 * front table of a small shop, and the distributor's calling card in front. It says "a real
 * person, real products, real prices" before a word is read. Kept calm on purpose: the packs
 * and prices are the point, not the arrangement.
 */
function StillLife() {
  const { sf, openProduct } = useStorefront();
  const d = sf.distributor;
  const [center, left, right] = listings(sf);
  const table = [
    { l: left, cls: "bottom-[19%] left-[4.5%] w-[33%] -rotate-2", i: 5 },
    { l: right, cls: "bottom-[19%] right-[4.5%] w-[33%] rotate-2", i: 6 },
    { l: center, cls: "bottom-[25%] left-1/2 z-10 w-[37%] -translate-x-1/2", i: 4 },
  ].filter((s) => s.l);

  return (
    <div className="relative mx-auto max-w-[35rem]">
      <div className="relative aspect-[1/0.98] overflow-hidden rounded-panel bg-[color-mix(in_oklab,var(--color-accent-soft)_55%,var(--color-surface))] ring-1 ring-inset ring-accent/[0.07] sm:aspect-[1/0.82] lg:aspect-[1/0.92]">
        {/* Soft light from above, and a faint table edge the cards stand on. */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_30%,rgb(255_255_255/0.85),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-transparent to-[color-mix(in_oklab,var(--color-accent-soft)_45%,transparent)]" />

        {table.map(({ l, cls, i }) => (
          <button
            key={l!.product.id}
            type="button"
            onClick={() => openProduct(l!.product.id)}
            aria-label={`${l!.product.name}, ${kes(l!.offer.price)}`}
            className={clsx("group absolute", cls)}
          >
            <span className="rise block" style={{ "--i": i } as CSSProperties}>
              <span className="float block" style={{ "--i": i } as CSSProperties}>
                <span className="block overflow-hidden rounded-[1rem] bg-white shadow-[0_1px_2px_rgb(28_26_23/0.05),0_12px_28px_-18px_rgb(28_26_23/0.32)] ring-1 ring-ink/[0.05] transition-[translate,box-shadow] duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:shadow-[0_1px_2px_rgb(28_26_23/0.05),0_18px_36px_-18px_rgb(28_26_23/0.36)]">
                  <PackArt product={l!.product} className="aspect-[4/5] w-full" sizes="(min-width: 1024px) 14rem, 40vw" eager={l === center} />
                  <span className="flex flex-col items-center border-t border-ink/[0.05] px-2 pb-2.5 pt-2 text-center leading-tight sm:pb-3 sm:pt-2.5">
                    <span className="line-clamp-2 max-w-full text-balance text-[0.75rem] font-medium text-ink-3 sm:text-[0.8rem]">
                      {shortName(l!.product)}
                    </span>
                    <span className="price mt-0.5 whitespace-nowrap text-[0.8rem] font-semibold text-ink sm:text-[0.9rem]">
                      {kes(l!.offer.price)}
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Calling card: who you'd be buying from, and the quickest way to ask them something. */}
      <div className="relative z-10 mx-4 -mt-9 flex items-center gap-3 rounded-[1.1rem] bg-surface p-3 shadow-[0_1px_2px_rgb(28_26_23/0.06),0_16px_36px_-20px_rgb(28_26_23/0.4)] ring-1 ring-ink/[0.06] sm:mx-10 lg:absolute lg:-bottom-7 lg:left-7 lg:mx-0 lg:mt-0 lg:w-[22.5rem]">
        <Portrait distributor={d} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="whitespace-nowrap text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-3">Your distributor</div>
          <div className="mt-1 truncate text-[1rem] font-semibold text-ink">{d.name}</div>
          {d.area && (
            <div className="mt-0.5 flex items-center gap-1 text-[0.8rem] text-ink-3">
              <Pin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{d.area}</span>
            </div>
          )}
        </div>
        <ContactAction
          text={askMessage(sf)}
          unstyled
          aria-label={`Message ${d.firstName} on WhatsApp`}
          className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-wa text-[0.85rem] font-semibold text-wa-ink transition hover:brightness-95 min-[400px]:px-3.5"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {/* The smallest phones get the icon alone, so the name keeps its room. */}
          <span className="hidden min-[400px]:inline">Chat</span>
        </ContactAction>
      </div>
    </div>
  );
}
