"use client";

import clsx from "clsx";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { kes } from "@/storefront/money";
import { FORMAT_LABEL, goalsOf, oneLiner, packOf, supplyShort, type Listing } from "@/storefront/products";
import { AddButton } from "./AddButton";
import { PackArt } from "./PackArt";

/**
 * A product in the catalogue, read the way people shop: what it's for (goal tags), what it is
 * (name and one line), what it costs and how much you get (price, pack, how long it lasts), then
 * one clear "Add". A row on phones, easy to scan with one thumb; a card from tablet up. The whole
 * card opens the details.
 */
export function ProductCard({ listing, className }: { listing: Listing; className?: string }) {
  const { openProduct } = useStorefront();
  const { product, offer } = listing;
  const goals = goalsOf(product).slice(0, 2);
  const pack = packOf(product, offer) ?? FORMAT_LABEL[product.format];
  const out = offer.inStock === false;
  return (
    <article
      className={clsx(
        // Phones: picture and words side by side, then price and Add across the full width below.
        "group relative grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-4 rounded-card bg-surface p-3 ring-1 ring-ink/[0.07] transition-[box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:shadow-lift md:flex md:flex-col md:gap-0 md:p-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => openProduct(product.id)}
        className="absolute inset-0 z-[1] rounded-card"
        aria-label={`${product.name}, ${kes(offer.price)} for ${pack}. See details`}
      />
      <PackArt
        product={product}
        className="aspect-[4/5] w-full shrink-0 rounded-[0.9rem] ring-1 ring-ink/[0.06] md:aspect-[5/4] md:rounded-b-none md:rounded-t-card md:ring-0"
        packClassName="transition-transform duration-500 ease-[var(--ease-out)] md:group-hover:-translate-y-1.5"
        sizes="(min-width: 1024px) 24rem, (min-width: 768px) 45vw, 96px"
      />
      <div className="min-w-0 self-center md:self-auto md:px-5 md:pt-4">
        {goals.length > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label="Often chosen for">
            {goals.map((g) => (
              <li key={g.id} className="rounded-full bg-sage-soft px-2 py-0.5 text-[0.75rem] font-medium text-moss">
                {g.short}
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-1.5 text-[1.02rem] font-semibold leading-snug text-ink md:font-display md:text-[1.4rem] md:font-normal md:leading-[1.1] md:tracking-[-0.015em]">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.86rem] leading-snug text-ink-2 md:mt-1.5 md:text-[0.9rem]">{oneLiner(product)}</p>
      </div>
      <div className="col-span-2 mt-3 flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-3 md:mt-auto md:border-0 md:px-5 md:pb-4 md:pt-4">
        <div className="min-w-0 leading-tight">
          <div className="price text-[1.05rem] font-semibold text-ink">{kes(offer.price)}</div>
          <div className="mt-0.5 text-[0.8rem] text-ink-3">
            {pack} · {supplyShort(product.supplyDays)}
          </div>
          {out && <div className="mt-0.5 text-[0.8rem] font-medium text-caution">Out of stock right now</div>}
        </div>
        {!out && <AddButton product={product} />}
      </div>
    </article>
  );
}
