# Product photos

Official product photos go here, one per product, named by the engine's product id
(`src/engine/catalogue.ts`), e.g. `arthroxtra.png`, `veggie-veggie.jpg`.

Rules:

- **Official images only**, from BF Suma or supplied by BF Suma Kenya for distributors to use. Never
  generated, redrawn or "similar looking" packaging. If the exact pack isn't available, leave the
  product without a photo: the storefront shows its pack illustration instead.
- **Check the pack matches the product**: name, variant and size (the 60-capsule pack, not the 30).
- **Record where each image came from** in `sources.json`, e.g. `{ "arthroxtra": "https://…" }`. The
  script skips any image without a source.
- A plain white or transparent background, as large as you can get (1000px+ tall).

Then run `npm run photos`. It trims each photo to the pack, brings every pack to the same height (so
the catalogue reads as one set, standing on the same floor as the illustrations), writes web-ready
files to `public/products/`, and updates `src/storefront/product-photos.json`, which the page reads.
