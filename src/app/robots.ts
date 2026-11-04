import type { MetadataRoute } from "next";
import { siteUrl } from "@/app/sitemap";

/** Crawlers see the storefront pages; the order and enquiry APIs are private. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
