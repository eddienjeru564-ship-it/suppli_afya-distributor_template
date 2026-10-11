"use client";

import { useStorefront } from "@/components/store/StorefrontProvider";
import { Reveal } from "@/components/ui/Reveal";
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
    <section id="how" aria-labelledby="how-title" className="container-x scroll-mt-20 py-14 md:py-20">
      <Reveal>
        <h2 id="how-title" className="display-section text-ink">
          How it works
        </h2>
      </Reveal>
      <ol className="mt-8 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-3 md:gap-10">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 md:block">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-soft font-display text-[1.2rem] text-moss">{i + 1}</span>
            <div className="md:mt-4">
              <h3 className="text-[1.05rem] font-semibold leading-snug text-ink">{s.title}</h3>
              <p className="mt-1.5 max-w-[22rem] text-[0.93rem] leading-relaxed text-ink-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
