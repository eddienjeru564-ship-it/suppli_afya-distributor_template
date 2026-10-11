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
original name is in `sources.json`.

Products in the catalogue without a photo yet: Quad Reishi, 4 in 1 Cordyceps Coffee, Reishi Coffee,
Veggie Veggie, ConstiRelax, Novel Depile, GluGoGone, NMN Duo Release, FemiCalcium D3, Youth Essence.

`pending/` holds the photos from the same set for products that aren't in the engine's catalogue
(see `pending/README.md`). They're not shown anywhere until the product is added upstream.

## What the labels changed in the catalogue

Reading the packs turned up facts the engine's catalogue had wrong or missing. They were corrected
upstream in Suppli Afya (`src/engine/catalogue.ts`, commit 404d25e) and synced here:

- **Pack sizes** for these 19 products (the catalogue's `pack`), shown under every price.
- **Relivin Tea** is luobuma **and green tea**, so it contains caffeine. Its label says it's not for
  children, pregnancy or breastfeeding. It's no longer suggested for sleep and stress.
- **YouthEver** is a drink in 30 pouches, not capsules; its label says it's not for pregnancy.
- **Ez-Xlim** is tablets.
- **MicrO2 Cycle**: the label dose is 3 tablets 3 times a day, so 100 tablets last about 11 days.
- **Probio3** (20 sachets) and **XPower Man Coffee** (8 sachets) last at most 20 and 8 days at one a
  day. The exact dose still needs confirming.
- **Ingredients** from the boxes for ProstatRelax, XPower Man Plus, XPower Man Coffee and NMN Coffee.

Still open, in `suppli_afya/docs/DECISIONS.md`: the gelatin in capsule shells (ProstatRelax's label
lists it), and the pharmacist's view on epimedium and ginseng.
