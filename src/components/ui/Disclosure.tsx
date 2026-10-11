"use client";

import clsx from "clsx";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "./icons";

/**
 * A titled section that opens in place: the heading stays in the outline (it's a real heading
 * with a button inside, the WAI-ARIA accordion pattern), so the page reads as a list of topics and
 * people open the ones they care about. Never used for safety notes, which are always shown.
 */
export function Disclosure({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-t border-ink/10">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center justify-between gap-3 py-3 text-left text-[0.98rem] font-semibold text-ink"
        >
          {title}
          <ChevronDown className={clsx("h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300", open && "rotate-180")} />
        </button>
      </h3>
      <div id={id} hidden={!open} className="pb-5 text-[0.95rem] leading-relaxed text-ink-2">
        {children}
      </div>
    </section>
  );
}
