import { useId } from "react";
import clsx from "clsx";
import { BRAND, MARK, POWERED_BY, WORDMARK } from "./artwork";

// Geometry from the master "Powered by Suppli Afya" file: the mark 247 tall, two text lines beside it.
const MARK_H = 247;
const MARK_W = (MARK.width / MARK.height) * MARK_H;
const TEXT_X = MARK_W + 44;
const WIDTH = TEXT_X + 12 + WORDMARK.width;

/**
 * The "Powered by Suppli Afya" badge. The mark keeps its brand colours; the lettering takes the
 * page's text colour, so the badge sits quietly in any distributor's theme. Height follows the className.
 */
export function PoweredBy({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={`0 0 ${WIDTH.toFixed(1)} ${MARK_H}`}
      role="img"
      aria-label="Powered by Suppli Afya"
      className={clsx("h-10 w-auto shrink-0", className)}
    >
      <svg width={MARK_W} height={MARK_H} viewBox={MARK.viewBox}>
        <defs>
          <linearGradient id={`${id}c`} x1="0.1" y1="0" x2="0.9" y2="0.35">
            <stop offset="0" stopColor={BRAND.cap[0]} />
            <stop offset="1" stopColor={BRAND.cap[1]} />
          </linearGradient>
          <radialGradient id={`${id}b`} cx="0.35" cy="0.45" r="0.75">
            <stop offset="0" stopColor={BRAND.body[0]} />
            <stop offset="1" stopColor={BRAND.body[1]} />
          </radialGradient>
        </defs>
        <path fill={`url(#${id}c)`} d={MARK.cap} />
        <path fill={`url(#${id}b)`} d={MARK.body} />
      </svg>
      <svg x={TEXT_X} y="39" width={POWERED_BY.width} height={POWERED_BY.height} viewBox={POWERED_BY.viewBox}>
        <path fillRule="evenodd" fill="currentColor" d={POWERED_BY.d} />
      </svg>
      <svg x={TEXT_X + 12} y="108" width={WORDMARK.width} height={WORDMARK.height} viewBox={WORDMARK.viewBox}>
        <path fillRule="evenodd" fill="currentColor" d={WORDMARK.d} />
      </svg>
    </svg>
  );
}
