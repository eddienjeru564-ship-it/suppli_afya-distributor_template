import clsx from "clsx";
import type { ReactNode } from "react";
import { keepTogether } from "./KeepTogether";

/**
 * Numbered steps, the same everywhere on the page ("How it works", "How ordering works"):
 * a sage numeral joined to the next by a hairline, down the page on phones and across from
 * tablet up, so a sequence reads as one path rather than a row of boxes.
 */
export function Steps({ steps, className }: { steps: { title: ReactNode; body: string }[]; className?: string }) {
  const cols = steps.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return (
    <ol className={clsx("grid grid-cols-1 gap-y-7 md:gap-x-8 md:gap-y-10", cols, className)}>
      {steps.map((s, i) => (
        <li key={i} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 md:block">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={clsx(
                // Phones: down from this numeral to the next. In a single row: across to the next numeral.
                "absolute -bottom-5 left-5 top-12 w-px bg-moss/20",
                steps.length === 4
                  ? "md:max-lg:hidden lg:bottom-auto lg:left-14 lg:right-0 lg:top-5 lg:h-px lg:w-auto"
                  : "md:bottom-auto md:left-14 md:right-0 md:top-5 md:h-px md:w-auto",
              )}
            />
          )}
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-sage-soft font-display text-[1.2rem] leading-none text-moss">
            {i + 1}
          </span>
          <div className="md:mt-4">
            <h3 className="text-[1.05rem] font-semibold leading-snug text-ink">{s.title}</h3>
            <p className="mt-1.5 max-w-[24rem] text-[0.93rem] leading-relaxed text-ink-2">{keepTogether(s.body)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
