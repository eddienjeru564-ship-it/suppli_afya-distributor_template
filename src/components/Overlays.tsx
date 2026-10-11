"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";

/*
 * The sheets (questions, product, order, message) are most of the page's code, and none of it is
 * needed to read the page. Each one is loaded the first time it's opened; once the page is idle,
 * all four are fetched quietly in the background so that first open is still instant.
 */
const load = {
  selector: () => import("@/components/selector/SelectorOverlay").then((m) => m.SelectorOverlay),
  product: () => import("@/components/product/ProductSheet").then((m) => m.ProductSheet),
  order: () => import("@/components/order/OrderSheet").then((m) => m.OrderSheet),
  message: () => import("@/components/whatsapp/MessageSheet").then((m) => m.MessageSheet),
};
const SelectorOverlay = dynamic(load.selector, { ssr: false });
const ProductSheet = dynamic(load.product, { ssr: false });
const OrderSheet = dynamic(load.order, { ssr: false });
const MessageSheet = dynamic(load.message, { ssr: false });

type Which = keyof typeof load;

export function Overlays() {
  const { overlays, message } = useStorefront();
  const open: Record<Which, boolean> = {
    selector: overlays.selector,
    product: Boolean(overlays.product),
    order: overlays.order,
    message: Boolean(message),
  };
  // Mounted from the first open on, so closing still animates and state is kept.
  const [used, setUsed] = useState<Record<Which, boolean>>({ selector: false, product: false, order: false, message: false });
  const newly = (Object.keys(open) as Which[]).filter((k) => open[k] && !used[k]);
  if (newly.length) setUsed((u) => ({ ...u, ...Object.fromEntries(newly.map((k) => [k, true])) }));

  useEffect(() => {
    const warm = () => Object.values(load).forEach((f) => void f().catch(() => {}));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {used.selector && <SelectorOverlay />}
      {used.product && <ProductSheet />}
      {used.order && <OrderSheet />}
      {used.message && <MessageSheet />}
    </>
  );
}
