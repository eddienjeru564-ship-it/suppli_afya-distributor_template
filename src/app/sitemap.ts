import type { MetadataRoute } from "next";
import { STOREFRONTS, defaultStorefront } from "@/storefronts";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Live storefronts only. A preview storefront carries placeholder details and is marked
 * noindex, so it stays out until its status is switched to "live", then appears here on its own.
 * The default storefront lives at "/", its canonical address; others at /<slug>.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const home = defaultStorefront().slug;
  return STOREFRONTS.filter((sf) => sf.status === "live").map((sf) => ({
    url: sf.slug === home ? `${base}/` : `${base}/${sf.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: sf.slug === home ? 1 : 0.8,
  }));
}
