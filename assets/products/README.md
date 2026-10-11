# Product photos

Official product photos go here, one per product, named by the engine's product id
(`src/engine/catalogue.ts`), e.g. `arthroxtra.png`, `veggie-veggie.jpg`.

Rules:

- **Official images only**, from BF Suma or supplied by BF Suma Kenya for distributors to use. Never
  generated, redrawn or "similar looking" packaging. If the exact pack isn't available, leave the
  product without a photo: the storefront shows its pack illustration instead.
- **Check the pack matches the product**: name, variant and size (the 60-capsule pack, not the 30).
- **Record where each image came from** in `sources.json`. The script skips any image without a source.
- A plain white background, as large as you can get (1000px+ on the long side). Most of the current
  set is about 500px, which is fine on phones and a little soft on large screens.

Then run `npm run photos`. For each photo it:

1. makes the background pure white, flooding in from the edges so white inside the pack (caps, white
   boxes) is never touched, and eases the soft shadow under the pack into the white so it fades out
   instead of stopping at an edge;
2. trims to the pack, with the same 4% margin on every product;
3. writes web-ready copies to `public/products/` (WebP at its own resolution, never enlarged, the long
   side capped at 1600px; a 480px WebP for thumbnails; a 360px JPEG for the link preview), and updates
   `src/storefront/product-photos.json`, which the page reads.

Nothing is cut out of the pack: on a white background a white bottle can't be separated cleanly, and
the storefront shows every product on a white stage anyway, so the photo's white simply disappears.

## The current set

19 photos supplied by Suppli Afya on 11 October 2026 (`BF_Suma_Final_Use_Images.zip`). Each file's
original name is in `sources.json`. What each pack holds was read off these photos into
`src/storefront/labels.ts`.

Products in the catalogue without a photo yet: Quad Reishi, 4 in 1 Cordyceps Coffee, Reishi Coffee,
Veggie Veggie, ConstiRelax, Novel Depile, GluGoGone, NMN Duo Release, FemiCalcium D3, Youth Essence.

`pending/` holds the photos from the same set for products that aren't in the engine's catalogue
(see `pending/README.md`). They're not shown anywhere until the product is added upstream.

## What the labels say that the catalogue doesn't

Reading the packs turned up facts the engine's catalogue (`suppli_afya/src/engine/catalogue.ts`)
should take on. The storefront can't change the engine, so these need fixing upstream:

- **MicrO2 Cycle**: 100 tablets, and the label dose is 3 tablets 3 times a day, so a pack lasts about
  11 days, not 30. The label also says it isn't recommended for pregnant women (the catalogue already
  marks it `notInPregnancy`).
- **Probio3**: 20 sachets a box, not 30 days' worth.
- **XPower Man Coffee**: 8 sachets a box, not 20 days' worth. Ingredients on the box: ginseng,
  tongkat ali, maca and epimedium extracts, coffee latte.
- **Relivin Tea**: the box says Folium Apocyni Veneti (luobuma) **and green tea**, so it contains
  caffeine (no `caffeine` trait today). The label says it's not for children or pregnant or
  breastfeeding women.
- **YouthEver**: a drink in 30 pouches (900 ml), not capsules. The box side says it's not for children
  or pregnant women.
- **Ez-Xlim**: tablets (90), not capsules.
- **NMN Coffee**: the box says "no sugar added".
- **Ingredients now known**: ProstatRelax (epimedium extract); XPower Man Plus (epimedium and black
  ginger extract, fresh maca, taurine, L-arginine).

Until then, the storefront shows what the pack says for pack size and form, and says nothing about how
long a pack lasts where the label contradicts the catalogue.
