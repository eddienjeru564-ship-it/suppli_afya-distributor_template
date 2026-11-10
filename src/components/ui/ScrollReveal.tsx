"use client";

import { useEffect } from "react";

/** Everything that reveals on scroll: section heads (`<Reveal>`), cards (`.reveal-card`). */
const TARGETS = "[data-reveal], .reveal-card";
/** Cards that arrive together come in one after another, this far apart, up to this many. */
const STAGGER_MS = 70;
const STAGGER_MAX = 6;

/**
 * Scroll reveals for the whole page, with one observer and no scroll listeners.
 *
 * Content is only ever hidden once this has run (it sets `js-reveal` on <html>), so without
 * JavaScript, or with "reduce motion" on, everything is simply there. Whatever is already on screen
 * (or above it, after a reload) is shown at once, without animating; everything below rises into
 * place once, the first time it's seen, and stays. Cards added later (the full catalogue, a filter)
 * are picked up too.
 */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const show = (el: Element, how: "instant" | "rise", delay = 0) => {
      if (el.hasAttribute("data-shown")) return;
      if (delay) (el as HTMLElement).style.setProperty("--reveal-delay", `${delay}ms`);
      el.setAttribute("data-shown", how);
    };

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          // Flung past in a fast scroll: it's above the screen now, so it's simply there.
          if (e.boundingClientRect.bottom <= 0) show(e.target, "instant");
          else show(e.target, "rise", Math.min(n++, STAGGER_MAX) * STAGGER_MS);
        }
      },
      // The watched area reaches far above the screen, so nothing skipped by a fast scroll stays
      // hidden; at the bottom it stops a little short, so things are moving as they appear.
      { rootMargin: "99999px 0px -8% 0px", threshold: 0.12 },
    );

    const watch = (el: Element) => {
      if (el.hasAttribute("data-shown")) return;
      const r = el.getBoundingClientRect();
      // Already in view or scrolled past: no entrance, it's simply there.
      if (r.top < window.innerHeight * 0.92) show(el, "instant");
      else io.observe(el);
    };

    // Sort what's on screen before hiding anything, so nothing visible blinks.
    document.querySelectorAll(TARGETS).forEach(watch);
    root.classList.add("js-reveal");

    const mo = new MutationObserver((records) => {
      for (const rec of records)
        rec.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(TARGETS)) watchLater(node);
          node.querySelectorAll(TARGETS).forEach(watchLater);
        });
    });
    // New cards (a filter, "Show all") reveal like the rest; ones that land on screen rise in.
    const watchLater = (el: Element) => {
      if (el.hasAttribute("data-shown")) return;
      io.observe(el);
    };
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
