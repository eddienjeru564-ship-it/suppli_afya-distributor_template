"use client";

import { useStorefront } from "@/components/store/StorefrontProvider";
import { Reveal } from "@/components/ui/Reveal";
import { Steps } from "@/components/ui/Steps";
import { canPlaceOrders } from "@/storefront/order";

/** The recommendations in three steps: what you do, what you get, and who you deal with. */
export function HowItWorks() {
  const { sf } = useStorefront();
  const first = sf.distributor.firstName;
  const steps = [
    {
      title: "Tell us what you'd like help with",
      body: "A few short questions about your goals, your day and any medicines you take. About 3 minutes, no account.",
    },
    {
      title: "See what may suit you",
      body: "Suggestions with the reason for each and the price. Anything that doesn't suit you is left out, and we say why.",
    },
    {
      title: `Order from ${first}, or ask first`,
      body: `${canPlaceOrders(sf) ? "Order here or on WhatsApp" : "Send your order on WhatsApp"}. ${first} confirms everything with you before you pay.`,
    },
  ];

  return (
    <section id="how" aria-labelledby="how-title" className="container-x scroll-mt-20 pb-6 pt-14 md:pb-8 md:pt-20">
      <Reveal>
        <h2 id="how-title" className="display-section text-ink">
          How it works
        </h2>
      </Reveal>
      <Steps steps={steps} className="mt-8 md:mt-10" />
    </section>
  );
}
