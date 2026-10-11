"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";
import { kes } from "@/storefront/money";

/**
 * On phones, the next step is always under the thumb: once you've scrolled past the two
 * paths, the bar offers them again; once something is in your order, it shows the total.
 * It steps aside whenever a sheet is open, at the end of the page, and (until there's an
 * order) over "What would you like help with?", whose interests are already the next step.
 */
export function MobileBar() {
  const { sf, priced, overlays, message, openOrder, openSelector, toast, result } = useStorefront();
  const justAdded = toast?.kind === "order" ? toast : null;
  const [pastHero, setPastHero] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [inChoose, setInChoose] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const ends = [document.getElementById("closing"), document.querySelector("footer")].filter((x): x is HTMLElement => Boolean(x));
    const choose = document.getElementById("choose");
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPastHero(!e.isIntersecting);
        if (ends.includes(e.target as HTMLElement)) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
          setAtEnd(seen.size > 0);
        }
      }
    });
    // Only while the section fills the middle of the screen, so the bar doesn't flicker at its edges.
    const middle = new IntersectionObserver(([e]) => setInChoose(e.isIntersecting), { rootMargin: "-35% 0px -35% 0px" });
    if (hero) io.observe(hero);
    ends.forEach((el) => io.observe(el));
    if (choose) middle.observe(choose);
    return () => {
      io.disconnect();
      middle.disconnect();
    };
  }, []);

  const busy = overlays.selector || overlays.order || Boolean(overlays.product) || Boolean(message);
  const hasOrder = priced.count > 0;
  const show = !busy && !atEnd && (hasOrder || (pastHero && !inChoose));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 px-3 pt-3 md:hidden"
        >
          <div className="flex items-center gap-2 rounded-[1.1rem] bg-night p-2 text-white shadow-float">
            {hasOrder ? (
              <>
                <div className="min-w-0 flex-1 pl-2.5 leading-tight" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={justAdded ? justAdded.id : "count"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={clsx("truncate text-[0.78rem]", justAdded ? "font-semibold text-white" : "text-white/60")}
                    >
                      {justAdded ? justAdded.text : `${priced.count} ${priced.count === 1 ? "item" : "items"} in your order`}
                    </motion.div>
                  </AnimatePresence>
                  <div className="price text-[1.02rem] font-semibold">{kes(priced.subtotal)}</div>
                </div>
                <Button variant="light" onClick={openOrder}>
                  Review order
                </Button>
              </>
            ) : (
              <>
                <Button variant="accent" className="flex-1" onClick={() => openSelector()}>
                  {result ? "My recommendations" : "Find My Recommendations"}
                </Button>
                <ContactAction
                  text={askMessage(sf)}
                  unstyled
                  aria-label={`Message ${sf.distributor.firstName} on WhatsApp`}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-wa text-wa-ink"
                >
                  <WhatsAppIcon />
                </ContactAction>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One short confirmation at a time, e.g. "Added Probio3 · View order". Announced to screen readers. */
export function Toaster() {
  const { toast, priced, overlays } = useStorefront();
  // Inside the selector and the order, the buttons themselves show what changed; a toast
  // there would only cover the next step.
  const quiet = overlays.selector || overlays.order;
  // On phones, "added to your order" appears in the order bar instead.
  const phoneQuiet = toast?.kind === "order";
  const lifted = priced.count > 0 && !overlays.product;
  return (
    <div
      aria-live="polite"
      className={clsx(
        "pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-4 transition-[bottom] duration-300 md:bottom-6",
        lifted ? "bottom-[6.25rem]" : "bottom-6",
      )}
    >
      <AnimatePresence>
        {toast && !quiet && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={clsx(
              "pointer-events-auto flex max-w-[26rem] items-center gap-3 rounded-full bg-night py-2 pl-5 pr-2 text-[0.9rem] text-white shadow-float",
              phoneQuiet && "max-md:hidden",
            )}
          >
            <span className="min-w-0 truncate">{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                onClick={toast.action.run}
                className="h-9 shrink-0 rounded-full bg-white/12 px-3.5 text-[0.85rem] font-semibold transition-colors hover:bg-white/20"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
