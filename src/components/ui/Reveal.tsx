import clsx from "clsx";
import type { ReactNode } from "react";

export type RevealFrom = "up" | "left" | "right" | "scale" | "fade";

/**
 * Rises (or slides, or settles) into place the first time it scrolls into view. The motion is
 * run by <ScrollReveal>, once for the whole page; this only marks what moves and how. The content
 * is always in the HTML, and stays visible without JavaScript or with "reduce motion" on.
 */
export function Reveal({ children, className, from = "up", id }: { children: ReactNode; className?: string; from?: RevealFrom; id?: string }) {
  return (
    <div data-reveal={from} id={id} className={clsx(className)}>
      {children}
    </div>
  );
}
