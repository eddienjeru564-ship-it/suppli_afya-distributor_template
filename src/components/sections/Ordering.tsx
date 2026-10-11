"use client";

import type { ReactNode } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Truck, Wallet } from "@/components/ui/icons";
import { keepTogether } from "@/components/ui/KeepTogether";
import { Reveal } from "@/components/ui/Reveal";
import { Steps } from "@/components/ui/Steps";
import { PAYMENT_LABEL, canPlaceOrders, deliveryFeeLabel } from "@/storefront/order";
import type { Storefront } from "@/storefront/types";

export function paymentPhrase(sf: Storefront): string {
  const m = sf.payment.methods.map((x) => (x === "cash" ? "cash on delivery" : PAYMENT_LABEL[x]));
  return m.length > 1 ? `${m.slice(0, -1).join(", ")} or ${m[m.length - 1]}` : (m[0] ?? "");
}

/**
 * Trust, answered in the order people worry about it: what happens after I tap order,
 * how does it reach me, how do I pay, are these the real prices.
 */
export function Ordering() {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const delivery = sf.fulfilment.delivery;
  const pickup = sf.fulfilment.pickup;
  const receive = [delivery && "delivered", pickup && "collected"].filter(Boolean).join(" or ");

  const steps = [
    { title: "Choose", body: "Add what you need to your order, or get recommendations first if you're not sure." },
    canPlaceOrders(sf)
      ? { title: "Place your order", body: `Right here, with your name and number. Or send it on WhatsApp, already written for you.` }
      : { title: "Send your order", body: "It opens in WhatsApp with every product, price and your details already written." },
    { title: `${first} confirms`, body: "Stock, delivery and the final total, before you pay anything." },
    {
      title: "Pay and receive",
      body: `Pay ${first} by ${paymentPhrase(sf)}, and get your order ${receive || "as agreed"}.`,
    },
  ];

  return (
    <section id="ordering" aria-labelledby="ordering-title" className="scroll-mt-16 border-y border-ink/[0.08] bg-surface/70 py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <h2 id="ordering-title" className="display-section max-w-[16ch] text-ink">
            How ordering works
          </h2>
          <p className="mt-4 max-w-[34rem] text-[1rem] leading-relaxed text-ink-2">
            No account and no card details. The prices are {first}&apos;s own, in Kenyan shillings, for one pack. Your order goes
            straight to {first}, who confirms it and any delivery cost with you before you pay.
          </p>
        </Reveal>

        <Steps steps={steps} className="mt-10 sm:mt-12" />

        <div className="mt-12 grid grid-cols-1 gap-3 md:mt-14 md:grid-cols-2 md:gap-4">
          <InfoCard icon={<Truck />} title={delivery ? "Delivery" : "Collection"}>
            <ul className="grid gap-2">
              {delivery?.areas.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{a.label}</span>
                  <span className="price shrink-0 text-right text-[0.88rem] text-ink-3">
                    {deliveryFeeLabel(a.fee)}
                    {a.time ? ` · ${a.time}` : ""}
                  </span>
                </li>
              ))}
              {pickup && (
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{pickup.label}</span>
                  <span className="shrink-0 text-right text-[0.88rem] text-ink-3">{pickup.detail ?? "Free"}</span>
                </li>
              )}
            </ul>
            {delivery?.note && <p className="mt-3 text-[0.88rem] text-ink-3">{delivery.note}</p>}
          </InfoCard>
          <InfoCard icon={<Wallet />} title="Payment">
            <p>
              {keepTogether(
                `You pay ${first} directly, by ${paymentPhrase(sf)}, once your order is confirmed.` +
                  (sf.payment.mpesa
                    ? ` M-Pesa ${sf.payment.mpesa.kind === "till" ? "Till" : "Paybill"} ${sf.payment.mpesa.number}${sf.payment.mpesa.account ? `, account ${sf.payment.mpesa.account}` : ""}${sf.payment.mpesa.name ? ` (${sf.payment.mpesa.name})` : ""}.`
                    : ` ${first} sends the M-Pesa details with the confirmation.`),
              )}
            </p>
            <p className="mt-3 text-[0.88rem] text-ink-3">{keepTogether("This page never asks for a card number or an M-Pesa PIN.")}</p>
          </InfoCard>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-card bg-canvas p-5 text-[0.95rem] leading-relaxed text-ink-2 ring-1 ring-ink/[0.07] md:p-6">
      <div className="mb-3 flex items-center gap-2.5 text-ink">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft text-moss">{icon}</span>
        <h3 className="text-[1.02rem] font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
