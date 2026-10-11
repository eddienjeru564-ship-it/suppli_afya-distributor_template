"use client";

import Link from "next/link";
import { SuppliMark } from "@/components/brand/SuppliMark";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";

export function Closing() {
  const { sf, openSelector, result } = useStorefront();
  const first = sf.distributor.firstName;
  return (
    <section id="closing" aria-labelledby="closing-title" className="container-x pb-8">
      {/* Calm and personal, like the rest of the page: the one strong colour is the WhatsApp button. */}
      <div className="relative overflow-hidden rounded-panel bg-sage-soft px-6 py-12 text-ink ring-1 ring-moss/10 md:px-14 md:py-16">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-moss/15" aria-hidden />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-moss/10" aria-hidden />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <h2 id="closing-title" className="display-section max-w-[14ch]">
              Still deciding? Ask {first}.
            </h2>
            <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-relaxed text-ink-2">
              A question about a product, a price or delivery. {first} answers on WhatsApp, and there&apos;s no need to
              order first.
            </p>
          </div>
          {/* Phones: full-width and stacked, so both are easy to reach and line up. */}
          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <ContactAction text={askMessage(sf)} size="lg">
              <WhatsAppIcon /> Message {first}
            </ContactAction>
            <Button variant="outline" size="lg" onClick={() => openSelector()}>
              {result ? "My recommendations" : "Find My Recommendations"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { sf } = useStorefront();
  const d = sf.distributor;
  return (
    <footer className="container-x pb-12 pt-8 text-[0.8rem] leading-relaxed text-ink-3">
      <PreviewNote />
      <div className="grid gap-3 border-t border-ink/10 pt-8 md:grid-cols-2 md:gap-10">
        <p>
          General wellness information, not medical advice. Products here aren&apos;t intended to diagnose, treat, cure or
          prevent any disease, and supplements don&apos;t replace a varied diet or any medicine you&apos;ve been prescribed. Read
          the label before use.
        </p>
        <p>
          {d.name} is an independent distributor of BF Suma products. Product names belong to their owners. Suppli Afya is
          independent of BF Suma.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} {d.name} ·{" "}
          <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
            Privacy
          </Link>
        </span>
        <a href={process.env.NEXT_PUBLIC_SUPPLI_AFYA_SITE || "https://suppliafya.co.ke"} className="inline-flex items-center gap-2 hover:text-ink" rel="noopener">
          <span>Powered by</span>
          <SuppliMark />
        </a>
      </div>
    </footer>
  );
}

/**
 * Shown only while a storefront is in preview, so a template value is never mistaken for a
 * fact. Kept in the footer, out of the way of the page, but always on it.
 */
function PreviewNote() {
  const { sf } = useStorefront();
  if (sf.status !== "preview") return null;
  const list = sf.pending.length ? sf.pending : ["some details"];
  const joined = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0];
  return (
    <p className="mb-8 rounded-xl bg-ink/[0.04] px-4 py-3 text-ink-2">
      <span className="font-semibold text-ink">Preview of {sf.distributor.firstName}&apos;s page.</span>{" "}
      {joined.charAt(0).toUpperCase() + joined.slice(1)} are placeholders until they&apos;re confirmed.
    </p>
  );
}
