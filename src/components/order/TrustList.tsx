"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { paymentPhrase } from "@/components/sections/Ordering";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Shield, Truck, Wallet } from "@/components/ui/icons";
import { keepTogether } from "@/components/ui/KeepTogether";

/**
 * Reassurance where the decision is made, in the order people worry about it: is anything paid
 * now, how do I pay, how does it reach me. Every line comes from the storefront's own settings.
 */
export function TrustList({ className }: { className?: string }) {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const payBy = paymentPhrase(sf);
  const { delivery, pickup } = sf.fulfilment;
  const points = [
    { icon: <Shield className="h-4 w-4" />, text: `${first} confirms stock and the total before you pay` },
    payBy && { icon: <Wallet className="h-4 w-4" />, text: `Pay by ${payBy}` },
    (delivery || pickup) && {
      icon: <Truck className="h-4 w-4" />,
      text: delivery && pickup ? "Delivery or collection, agreed with you first" : delivery ? "Delivered to you, cost agreed first" : `Collect: ${pickup!.label}`,
    },
  ].filter(Boolean) as { icon: ReactNode; text: string }[];

  return (
    <ul className={clsx("grid gap-2 rounded-card bg-sage-soft px-4 py-3.5 text-[0.88rem] leading-snug text-ink", className)}>
      {points.map((t) => (
        <li key={t.text} className="flex items-start gap-2.5">
          <span className="mt-px text-moss">{t.icon}</span>
          <span>{keepTogether(t.text)}</span>
        </li>
      ))}
    </ul>
  );
}
