import { Fragment, type ReactNode } from "react";

// Words browsers would otherwise break at their hyphen, leaving "M-" at the end of a line.
const UNBREAKABLE = /(M-Pesa)/g;

/** Plain text with "M-Pesa" (and the like) kept on one line. */
export function keepTogether(text: string): ReactNode {
  const parts = text.split(UNBREAKABLE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
