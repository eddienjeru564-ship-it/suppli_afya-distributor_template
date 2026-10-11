"use client";

import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Product } from "@/engine";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Plus } from "@/components/ui/icons";
import { QtyStepper } from "./QtyStepper";

/**
 * Quick add on a product card: a labelled "Add" (a bare "+" makes people guess), which becomes a
 * quantity stepper once the product is in the order, so the card always shows what's in it.
 */
export function AddButton({ product, className, from }: { product: Product; className?: string; from?: "selector" }) {
  const { qtyOf, addToOrder, setQty, removeFromOrder } = useStorefront();
  const qty = qtyOf(product.id);
  return (
    <div className={clsx("relative z-10 flex h-11 items-center justify-end", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {qty === 0 ? (
          <m.button
            key="add"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={() => addToOrder(product.id, { from })}
            aria-label={`Add ${product.name} to your order`}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-4 text-[0.9rem] font-semibold text-canvas transition-colors hover:bg-black active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add
          </m.button>
        ) : (
          <m.div
            key="qty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            <QtyStepper
              size="sm"
              name={product.name}
              value={qty}
              onChange={(n) => setQty(product.id, n)}
              onRemove={() => removeFromOrder(product.id)}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
