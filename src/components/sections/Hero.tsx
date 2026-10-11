"use client";

import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { Portrait } from "@/components/brand/Portrait";
import { PackArt } from "@/components/product/PackArt";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { ArrowRight, Pin, WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { dateLabel } from "@/storefront/dates";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";
import { listings, shortName } from "@/storefront/products";

/**
 * First screen. It answers three questions in a few seconds: whose page is this, can I get
 * help choosing, can I just browse. The two paths sit side by side at the same size, so
 * neither feels like the lesser option.
 */
export function Hero() {
  const { sf, openSelector, goToSection } = useStorefront();
  const count = Object.keys(sf.catalogue.offers).length;
  const d = sf.distributor;
  const rise = (i: number) => ({ className: "rise", style: { "--i": i } as CSSProperties });

  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="container-x grid grid-cols-1 gap-10 pb-14 pt-7 md:pt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-16 lg:pb-20 lg:pt-14">
        <div>
          {/* The top bar already says who this is; the kicker says where, and how fresh the prices are. */}
          <p {...rise(0)}>
            <span className="kicker">{[d.area, `Prices checked ${dateLabel(sf.catalogue.updated, true)}`].filter(Boolean).join(" · ")}</span>
          </p>
          <h1 {...rise(1)} id="hero-title">
            <span className="display-hero mt-5 block text-ink sm:max-w-[14ch]">
              Not sure which product is right for you? <em className="block italic text-accent">Let&apos;s narrow it down.</em>
            </span>
          </h1>
          <p {...rise(2)}>
            <span className="lede mt-6 block max-w-[33rem]">
              Answer a few quick questions and see what fits you, with prices and the reasons why. Already know what you want?
              Go straight to the products.
            </span>
          </p>

          <div {...rise(3)}>
            <div className="mt-8 grid max-w-[37rem] gap-3 sm:grid-cols-2">
              <PathCard tone="accent" title="Help me choose" detail="About 3 minutes" onClick={() => openSelector()} />
              <PathCard tone="plain" title="Browse products" detail={`${count} products, prices shown`} onClick={() => goToSection("products")} />
            </div>
          </div>
        </div>

        <div {...rise(4)}>
          <StillLife />
        </div>
      </div>
    </section>
  );
}

function PathCard({
  tone,
  title,
  detail,
  onClick,
}: {
  tone: "accent" | "plain";
  title: ReactNode;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group flex min-h-[5.5rem] items-center justify-between gap-4 rounded-card px-5 py-4 text-left transition-[background-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] active:scale-[0.99]",
        tone === "accent" ? "bg-accent text-on-accent hover:bg-accent-strong" : "bg-surface text-ink ring-1 ring-ink/12 hover:ring-ink/30",
      )}
    >
      <span>
        <span className="block text-[1.1rem] font-semibold leading-tight">{title}</span>
        <span className={clsx("mt-1 block text-[0.84rem]", tone === "accent" ? "text-on-accent/75" : "text-ink-3")}>{detail}</span>
      </span>
      <span
        className={clsx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5",
          tone === "accent" ? "bg-white/15" : "bg-ink/[0.05]",
        )}
      >
        <ArrowRight />
      </span>
    </button>
  );
}

/**
 * The distributor's calling card in front of three of their products, each on its own white
 * tile with its name and price, like the front table of a small shop. It says "a real person,
 * real products, real prices" before a word is read.
 */
function StillLife() {
  const { sf, openProduct } = useStorefront();
  const d = sf.distributor;
  const [center, left, right] = listings(sf);
  const table = [
    { l: left, cls: "bottom-[17%] left-[3%] w-[35%] -rotate-[4deg]", i: 6 },
    { l: right, cls: "bottom-[21%] right-[3%] w-[35%] rotate-[3deg]", i: 7 },
    { l: center, cls: "bottom-[25%] left-1/2 z-10 w-[41%] -translate-x-1/2", i: 5 },
  ].filter((s) => s.l);

  return (
    <div className="relative mx-auto max-w-[36rem]">
      <div className="relative aspect-[1/0.92] overflow-hidden rounded-panel bg-accent-soft sm:aspect-[1/0.8] lg:aspect-[1/0.96]">
        {/* Soft light behind the products, like a lit shop window. */}
        <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_42%,rgb(255_255_255/0.75),transparent)]" />

        {table.map(({ l, cls, i }) => (
          <button
            key={l!.product.id}
            type="button"
            onClick={() => openProduct(l!.product.id)}
            aria-label={`${l!.product.name}, ${kes(l!.offer.price)}`}
            className={clsx("group absolute", cls)}
          >
            <span className="rise block" style={{ "--i": i } as CSSProperties}>
              <span className="block overflow-hidden rounded-[1.1rem] bg-white shadow-lift ring-1 ring-ink/[0.05] transition-[translate,box-shadow] duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1.5 group-hover:shadow-float">
                <PackArt product={l!.product} className="aspect-[4/5] w-full" sizes="(min-width: 1024px) 15rem, 42vw" />
                <span className="flex flex-col items-center px-2 pb-2.5 text-center leading-tight sm:pb-3">
                  <span className="line-clamp-2 max-w-full text-balance text-[0.68rem] font-medium text-ink-3 sm:text-[0.78rem]">
                    {shortName(l!.product)}
                  </span>
                  <span className="price mt-0.5 whitespace-nowrap text-[0.8rem] font-semibold text-ink sm:text-[0.92rem]">
                    {kes(l!.offer.price)}
                  </span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Calling card */}
      <div className="relative z-10 mx-3 -mt-10 flex items-center gap-3.5 rounded-card bg-surface p-3.5 pr-2.5 shadow-float sm:mx-8 lg:absolute lg:-bottom-8 lg:-left-8 lg:mx-0 lg:mt-0 lg:w-[21rem]">
        <Portrait distributor={d} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-semibold text-ink">{d.name}</div>
          {d.area && (
            <div className="mt-1 flex items-center gap-1 text-[0.8rem] text-ink-3">
              <Pin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{d.area}</span>
            </div>
          )}
          <div className="mt-0.5 text-[0.8rem] text-ink-3">Questions? Ask on WhatsApp</div>
        </div>
        <ContactAction
          text={askMessage(sf)}
          unstyled
          aria-label={`Message ${d.firstName} on WhatsApp`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wa text-wa-ink transition hover:brightness-95"
        >
          <WhatsAppIcon />
        </ContactAction>
      </div>
    </div>
  );
}
