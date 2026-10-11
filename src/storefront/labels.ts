import type { ProductFormat } from "@/engine";

/**
 * Facts read off the official pack photos in assets/products (supplied 11 October 2026).
 * They describe the product, so they're the same for every distributor; a distributor's own
 * `offer.pack` wins if they set one. Only products with a photo have entries: nothing here is
 * guessed. Where a label disagrees with the engine's catalogue, the catalogue needs correcting
 * upstream in Suppli Afya; until then the storefront shows what the pack says.
 */

/** What one pack holds. */
export const LABEL_PACK: Record<string, string> = {
  feminergy: "60 capsules",
  "youth-ever": "30 pouches",
  arthroxtra: "60 tablets",
  "gluzojoint-f": "60 capsules",
  "zaminocal-plus": "60 capsules",
  cerebrain: "60 tablets",
  detoxilive: "60 soft gels",
  gymeffect: "60 capsules",
  "micro2-cycle": "100 tablets",
  "relivin-tea": "20 sachets",
  "ez-xlim": "90 tablets",
  probio3: "20 sachets",
  "nmn-coffee": "15 sachets",
  "ganoderma-spores": "30 capsules",
  "refined-yunzhi": "60 capsules",
  prostatrelax: "60 capsules",
  "xpower-man-plus": "30 capsules",
  "xpower-coffee": "8 sachets",
  femicare: "180 ml",
};

/** Where the pack shows a different form from the catalogue's (YouthEver is a drink, Ez-Xlim tablets). */
export const LABEL_FORMAT: Record<string, ProductFormat> = {
  "youth-ever": "drink",
  "ez-xlim": "tablets",
};

/**
 * Where the label disagrees with how long the catalogue says a pack lasts (`supplyDays`):
 * MicrO2 Cycle's label dose is 3 tablets 3 times a day, so 100 tablets is about 11 days, not
 * 30; Probio3 has 20 sachets, not 30 days' worth; Xpower Coffee has 8, not 20. These say
 * nothing about how long a pack lasts rather than something the label contradicts.
 */
export const SUPPLY_DISAGREES = new Set(["micro2-cycle", "probio3", "xpower-coffee"]);
