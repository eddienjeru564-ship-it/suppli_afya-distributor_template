# Before Kate's page goes live

Kate's storefront (`src/storefronts/kate.ts`) is in **preview**. Only her name is confirmed. Everything
else is a placeholder, marked `PLACEHOLDER` in the file and listed in `pending`, so the page shows a
"Preview" ribbon and never opens a chat to a real number.

## Ask Kate for

| What | Where it goes | Notes |
|---|---|---|
| WhatsApp number | `distributor.whatsapp` | International format, `2547XXXXXXXX` |
| Phone number for calls (optional) | `distributor.phone` | Adds a "Call" button |
| Her price list | `catalogue.offers` | One price per product she sells, whole KES. Remove any she doesn't sell |
| Pack sizes (only if different) | `catalogue.offers[id].pack` | The catalogue already has them for the 19 products with a photo. Set one only if Kate sells a different pack |
| Date prices were checked | `catalogue.updated` | Shown to customers |
| Her most-asked-about products | `catalogue.featured` | Shown first; the first three stand in the hero and the link preview. Prefer products with a photo |
| Where she's based | `distributor.area` | |
| Delivery areas, fees and times | `fulfilment.delivery.areas` | `fee: null` means she confirms it with the customer |
| Pickup point, if any | `fulfilment.pickup` | |
| Payment methods | `payment.methods` | M-Pesa, cash |
| M-Pesa Till or Paybill | `payment.mpesa` | Shown after an order is sent. Leave `null` if she sends details herself |
| A photo | `distributor.photo` | A real photo of Kate, in `public/storefronts/`. Never a stock photo |
| One or two sentences in her own words | `distributor.intro` | About the customer, not about her. No credentials we can't check |
| Languages, reply hours (optional) | `distributor.languages`, `distributor.hours` | |
| Her colour (optional) | `theme` | Tests check white text is readable on it |
| Her Suppli Afya link name | `suppliSlug` | Once she has a workspace, so sent results and placed orders reach her portal. Needs `SUPPLI_AFYA_URL` and `STOREFRONT_SECRET` set in both apps |
| Official product photos | `assets/products/` + `sources.json` | 19 are in. Still missing: Quad Reishi, 4 in 1 Cordyceps Coffee, Reishi Coffee, Veggie Veggie, ConstiRelax, Novel Depile, GluGoGone, NMN Duo Release, FemiCalcium D3, Youth Essence. Most of the 19 are small (about 500px); larger originals (1000px+) would look sharper on big screens. Then `npm run photos` |

Then set `pending: []` and `status: "live"`, and run `npm test` (a live storefront without a WhatsApp
number, or with anything still pending, fails validation).

## Also needed (shared with the Suppli Afya app)

These are launch blockers in `suppli_afya/docs/DECISIONS.md` and apply here too:

- **The catalogue is unverified.** Every product in the engine is `verified: false`; product pages say
  so until it's checked against the official BF Suma Kenya catalogue. Fix it upstream, then
  `npm run engine:sync`.
- **Pharmacist review** of the engine's safety rules.
- **Legal review** of `/privacy` and the disclaimers, and ODPC registration. The storefront stores
  nothing on a server unless `SUPPLI_AFYA_URL` or `ORDER_WEBHOOK_URL` is set; with them, sent results
  and orders leave the browser.
- **BF Suma's distributor policy** on online price lists, product names and product photos.
- **Catalogue questions the labels couldn't answer.** The pack photos corrected pack sizes, doses,
  forms and label warnings upstream (see `assets/products/README.md`). Still open: the gelatin in
  capsule shells, the exact doses of Probio3 and XPower Man Coffee, and a sleep and stress product.

## Deploying

A standard Next.js app (Vercel or any Node host). Set `NEXT_PUBLIC_SITE_URL` to the public address so
link previews work in WhatsApp (on Vercel it defaults to the deploy's own address until there's a
domain), and `NEXT_PUBLIC_DEFAULT_STOREFRONT=kate` if `/` should be Kate's page.

To file orders and sent results in the portal, set `SUPPLI_AFYA_URL` to the Suppli Afya app's production
address and the same `STOREFRONT_SECRET` in both deploys. This server calls that address, so on Vercel
the app's Vercel Authentication (Deployment Protection) must be limited to previews.
