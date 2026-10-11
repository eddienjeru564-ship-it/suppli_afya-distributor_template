"use client";

import clsx from "clsx";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Phone, WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage, telHref } from "@/storefront/messages";
import type { DistributorProfile } from "@/storefront/types";

/**
 * "I know who I'm buying from." The distributor's photo beside their own words, the facts
 * they've given us, and the quickest ways to reach them. Nothing else.
 *
 * Without a photo yet, a preview shows where it will go. A live page without one simply has
 * no picture, rather than a stand-in for a person.
 */
export function About() {
  const { sf } = useStorefront();
  const d = sf.distributor;
  const tel = telHref(sf);
  const framed = Boolean(d.photo) || sf.status === "preview";
  const facts = [
    d.area && { label: "Based in", value: d.area },
    d.languages?.length && { label: "Chats in", value: d.languages.join(" and ") },
    d.hours && { label: "Usually replies", value: d.hours },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section id="about" aria-labelledby="about-title" className="container-x scroll-mt-16 py-20 md:py-28">
      <div
        className={clsx(
          "grid grid-cols-1 gap-10",
          framed ? "md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center md:gap-14 lg:gap-20" : "mx-auto max-w-3xl",
        )}
      >
        {framed && (
          <Reveal className="hidden md:block">
            <Photo distributor={d} className="aspect-[4/5] w-full rounded-panel" />
          </Reveal>
        )}

        <Reveal className="min-w-0">
          {/* Phones: a smaller photo beside the name, so the words start on the first screen. */}
          <div className="flex items-center gap-4">
            {framed && <Photo distributor={d} small className="aspect-[4/5] w-[5.5rem] shrink-0 rounded-card md:hidden" />}
            <div className="min-w-0">
              <p className="kicker">Meet your distributor</p>
              <h2 id="about-title" className="display-section mt-3 text-ink md:mt-4">
                {d.name}
              </h2>
              <p className="mt-1.5 text-[1rem] text-ink-3">{d.role}</p>
            </div>
          </div>

          {d.intro && (
            <blockquote className="mt-7 border-l-2 border-sage pl-5 font-display text-[clamp(1.25rem,2.1vw,1.6rem)] italic leading-[1.38] tracking-[-0.01em] text-ink">
              {d.intro}
            </blockquote>
          )}

          {facts.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 sm:gap-x-8">
              {facts.map((f) => (
                <div key={f.label} className="border-t border-ink/10 pt-3">
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-3">{f.label}</dt>
                  <dd className="mt-1 text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap gap-2.5">
            <ContactAction text={askMessage(sf)} size="lg">
              <WhatsAppIcon /> Message {d.firstName}
            </ContactAction>
            {tel && (
              <ButtonLink href={tel} variant="outline" size="lg">
                <Phone /> Call
              </ButtonLink>
            )}
          </div>
          <p className="mt-6 max-w-[34rem] text-[0.85rem] leading-relaxed text-ink-3">
            {d.firstName} sells BF Suma products as an independent distributor. This is {d.firstName}&apos;s own page, not BF
            Suma&apos;s.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** The distributor's photo, or, in a preview, a quiet frame showing where it goes. */
function Photo({ distributor: d, className, small }: { distributor: DistributorProfile; className?: string; small?: boolean }) {
  if (d.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- storefront photos are small, local and already sized
      <img src={d.photo.src} alt={d.photo.alt} className={clsx("object-cover", className)} />
    );
  }
  return (
    <div
      role="img"
      aria-label={`Photo of ${d.firstName} to come`}
      className={clsx("relative grid place-items-center overflow-hidden bg-sage-soft", className)}
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_30%,rgb(255_255_255/0.6),transparent)]" />
      {/* A head-and-shoulders outline: a frame for a person, not a picture of one. */}
      <svg aria-hidden viewBox="0 0 120 150" className={clsx("relative w-auto text-moss/30", small ? "h-[58%]" : "h-[42%]")}>
        <circle cx="60" cy="50" r="23" fill="none" stroke="currentColor" strokeWidth={small ? 4 : 2} />
        <path d="M20 140c3-29 19-45 40-45s37 16 40 45" fill="none" stroke="currentColor" strokeWidth={small ? 4 : 2} strokeLinecap="round" />
      </svg>
      {!small && (
        <span className="absolute inset-x-0 bottom-5 text-center text-[0.8rem] font-medium text-moss/80">
          Photo of {d.firstName} to come
        </span>
      )}
    </div>
  );
}
