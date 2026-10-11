"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// The animation engine arrives in its own file once the page is up and the phone is idle, so it
// never competes with the first paint or the first tap. Until then everything renders, just unanimated.
const idle = () =>
  new Promise<void>((done) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => done(), { timeout: 2500 });
    else setTimeout(done, 1200);
  });
const features = () => idle().then(() => import("./motion-features").then((mod) => mod.default));

/**
 * Every animation on the site follows the visitor's "reduce motion" setting. Components use the
 * light `m` elements; `strict` makes sure a full `motion` element never sneaks the engine back in.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={features} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
