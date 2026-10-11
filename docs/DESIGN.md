# Design

The storefront is a distributor's shop counter, not a marketing site and not a dashboard. A customer
arrives unsure which product to choose, or already knowing. Both should feel the page was made for them.

The test for every screen: **trust + clarity + discovery + a real person + an order**, on a phone,
with one thumb, on a weak signal.

## Principles

1. **Whose page this is comes first.** The distributor's name and face are in the top bar on every
   screen, and in the first thing you read. Suppli Afya is a small "Powered by" in the footer.
2. **One main way in, and a quiet second.** Recommendations are the main action ("Find My
   Recommendations", then "What would you like help with?"); browsing is always one text link away.
3. **Prices are never behind a message.** They're on the first screen, on every card, in every result.
4. **Say why.** Every suggestion shows the reason it came up, in the engine's words ("because you
   said…"), what to expect and when, and what was left out and why.
5. **Trust is answered where the doubt appears**, not in a FAQ: the privacy line next to the questions,
   "Check before you buy" on every product, "You pay once it's confirmed" under the send button.
6. **Finishing never depends on one app.** "Place order" files the order with the distributor, and
   WhatsApp is one tap away with everything already written (the order, the answers, a reference),
   so neither side starts from zero.
7. **Readable before JavaScript.** Entrances and scroll reveals are CSS; the first screen is complete
   in the HTML. Overlays are enhancements on top of a page that already works.
8. **Nothing invented.** No testimonials, no ratings, no stock photos, no credentials we haven't been
   given. Missing details are placeholders, marked as such.

## Visual language

The wellness default (green leaves, beige, spa) was avoided on purpose.

| Token | Value | Use |
|---|---|---|
| canvas | `#f5f3ee` warm porcelain | Page background |
| surface | `#fdfcfa` | Cards, inputs |
| sunken | `#ebe8e1` | Quiet fills |
| white | `#ffffff` | Product stages: every pack, photo or drawing, stands on white |
| ink / ink-2 / ink-3 | `#1c1a17` / `#48443d` / `#6b655c` | Text, all at 4.5:1 or better on canvas |
| night | `#171614` | Only the floating order bars: they sit over everything, so they need the contrast |
| accent | per distributor | Kate: jacaranda `#4b3a8c` (Nairobi's October trees). Guided actions, selection, progress |
| caution | `#8f4418` on `#f7e8da` | Cautions and "check with your doctor" |
| WhatsApp | `#25d366` | Only on buttons that open a chat |

- **Type.** Newsreader for display (large, tight, with an italic accent line), Hanken Grotesk for text.
  The same families as the Suppli Afya app. Small uppercase kickers open each section.
- **Shape.** Buttons 14px radius, cards 20px, panels 28px; pills only for chips and tags.
- **Depth.** Hairline rings instead of borders; one soft shadow for lifted things (the calling card,
  the lead suggestion, sheets). No glass.
- **Product imagery.** Every product stands on the same white stage, the e-commerce standard, so a
  grid reads as one set and nothing distracts from the pack. An official photo of the exact pack when
  we have one: `npm run photos` makes its background pure white, eases the soft shadow under the pack
  into it, trims to the pack with the same margin on every product, and never enlarges a small original.
  Photos are centred in the frame whatever their shape; thumbnails use a small copy. Otherwise a pack
  illustration: bottle, carton, pump or jar by format, tinted by product line, with a word-free emblem
  where a label would be. A drawing that printed a name would look like a real label we made up. Logos
  stay off-limits outside the official pack photos (independence has to be visible). Sized in container
  units of the stage's shorter side, so one component works as a thumbnail, a card and a banner.
- **Pack size next to the price.** What one pack holds ("60 capsules", "20 sachets") sits under every
  price, from the catalogue's `pack`, read off the pack photos. A price means little without it.
- **The distributor's face.** A real photo when there is one. In a preview without one, "Meet your
  distributor" shows a quiet sage frame where it will go; a live page without one simply has no
  picture. The small monogram stays only where a name needs a mark (top bar, calling card).
- **Sage.** Cream and neutrals carry the page; sage (`sage-soft`, with `moss` for numbers and icons) marks
  the calm, supportive parts: choosing what you'd like help with, every numbered step, the selector's
  "What you've told us" panel, goal tags, small habits, the whole-plan total, info-card icons,
  meeting the distributor, "Want to talk it through?" and "Still deciding?". The distributor's own colour is kept for actions and selection, so purple
  always means "this does something".
- **One name for one action.** The guided path is "Find My Recommendations" everywhere it's a button
  (hero, phone bar, closing, empty order, product page), "Recommendations" in the nav, and "Your
  recommendations" once there's a result. Browsing is always a quieter link or button.
- **One colour per role on a screen.** In the results, the whole plan is the main action (the
  plan bar on phones, the filled button in the plan summary on large screens); each product's own
  "Add" is the same quieter pill as on the product cards.
- **Steps.** "How it works" and "How ordering works" share one component (`ui/Steps`): sage numerals
  joined by a hairline, down the page on phones and across from tablet up.
- **Eyebrows only where a heading is a name.** "Meet your distributor" sits over Kate's name; section
  headings that already say what they are ("Kate's products", "How ordering works") stand alone.
- **Motion.** Short and causal: sheets rise from where the thumb is, the order count bumps when
  something is added, the "+" becomes a quantity stepper. Everything honours "reduce motion".

## Speed and reach

Most customers arrive on a mid-range Android on prepaid data, so the first screen is built to be readable
before any script runs, and as little as possible is sent up front.

- **Sheets load on first use.** The questions, product, order and message sheets (`components/Overlays.tsx`)
  are fetched when first opened, and quietly in the background once the phone is idle, so opening one is
  still instant.
- **Animation engine after the page.** Components use the light `m` elements (`motion/react-m`);
  `LazyMotion` (`ui/MotionProvider.tsx`) loads the engine when the phone is idle. `strict` stops a full
  `motion` element from bringing it back into the first load.
- **One display font instance.** Newsreader is self-hosted as regular and italic at one weight and optical
  size, Latin only: about 47 KB, against 278 KB for the full variable family.
- **Text never waits.** The hero's words are on screen from the first paint and only drift into place
  (`.settle`); section heads move as they scroll in but never fade, so text is always at full contrast.
- **Readable and tappable.** No text under 12px, and every link or button has at least a 44px tap area,
  including text links ("Browse all 29 products", footer links).

Measured on a Pixel 7 profile with 4x CPU slowdown and slow 4G: the main content paints in about 1.6s
(was 3.3s), with no layout shift and no automated accessibility violations (axe, WCAG 2.1 AA).

## The page, and why it's in this order

| Section | Job |
|---|---|
| Top bar | Name and face always visible; message and order one tap away |
| Hero | One promise ("Find the right wellness products for your goals"), one main action (Find My Recommendations) with what it takes underneath (about 3 minutes, no account), and a quiet text link straight to the products for people who already know. On the right, three real packs on white cards with their names and prices, on a softly tinted panel, with the distributor's calling card ("Your distributor", name, area, Chat) in front. Calm on purpose: the packs and prices are the point. The link preview shows the same three |
| What would you like help with? | The first step of the recommendations, on the page. Six broad interests, "View all interests" opens the rest in place. Pick up to three (numbered: the first counts most) or none, then one filled Continue. Picks become the selector's goals answer, so the goals question is stepped over, the opening screen says what came with them, and the goals part opens with "You picked … Change". With none, the selector asks about goals as usual. Picks stay when you come back. After a result, this section shows the suggestions with prices |
| How it works | Three steps: answer a few questions, see what may suit you (with reasons and prices, and what's left out), order from the distributor or ask first |
| Products | Search by name or ingredient, filter by what it's for, the most-asked-about first (six, or four on phones), the rest one tap away. Each card reads the way people shop: what it's for (goal tags), what it is (name and one line), what it costs and how much you get ("60 capsules · lasts about a month"), and one labelled "Add" that turns into a quantity stepper. A goal filter offers "Not sure which? Get recommendations" |
| How ordering works | Four steps, with what the prices mean in the intro, then delivery and payment, answered plainly |
| Meet your distributor | Their photo (or, in a preview, where it will go) beside their name, role, own words, where they are and the languages they chat in, how to reach them, and that the page is theirs, not BF Suma's |
| Still deciding? | A low-pressure last ask, on sage: the one strong colour is the green "Message Kate" button, with recommendations as the quieter second choice |

## The product page

Ordered the way a customer decides: name, price with pack size and how long it lasts, what it's often
chosen for (goal tags), the one-paragraph summary, then quantity and **Add to order**. Right under the
button, a sage strip answers the three worries at the moment of choice: the distributor confirms stock and
the total before you pay, how you pay, how it reaches you (all from the storefront's own config).

**Check before you buy** is always open, never folded away. The rest (what's in it, how it's taken, what
to expect, good to know) sits in sections that open in place (`ui/Disclosure`, real headings with a button
inside), with "What's in it" open to start.

## Overlays

| Overlay | Phone | Larger screens | URL |
|---|---|---|---|
| Selector | Full screen, slides up | Full screen, with a sage panel of "What you've told us" beside the questions | `?find` (`?find=digestion` starts with that goal) |
| Product | Bottom sheet, pull down to close, add button in thumb reach | Two-column dialog | `?p=<product id>` (shareable) |
| Order | Bottom sheet | Drawer from the right | `?order` |
| Message (preview only) | Bottom sheet | Dialog | none |

Overlays live in the URL, so the phone's back button closes a sheet instead of leaving the page, and a
distributor can send a link straight to a product. The page behind the top sheet is `inert`.

## The selector

The engine decides; the interface renders. Presentation choices:

- It opens on the engine's privacy and "not medical advice" screen, which must be accepted.
- Section screens are folded into the next question as a small header ("Part 2 of 4 · Your goals"),
  keeping their words and dropping four taps.
- Progress is four named parts, not a question count.
- On larger screens, "What you've told us" builds up as you answer: exactly what the suggestions will
  be based on, including anything we'll take care around ("Takes blood pressure medicine").
- Closing keeps your answers. The interests on the page show what was picked, and say how far through
  you are, with "Start again" beside it.
- It moves on by itself wherever one tap is the whole answer: one-choice questions, the 1 to 5 scale,
  and "None of these" (or "I sleep well", "It doesn't really drop") in choose-all questions. Real picks
  and typed answers wait for Continue. Every auto-advance is guarded: it only moves on from the question
  it was set on, and any tap on Continue, Back or another answer cancels it, so a quick extra tap never
  skips a question.
- After the last answer, a two-second "putting your recommendations together" screen says in plain words
  what the check does (match goals to the products, leave out what doesn't suit, add prices and
  reasons). The result is saved before it starts; a tap shows it at once; reduced motion shortens it.
- On phones the progress bar names the current part.
- Interests picked on the page are the goals answer (`SelectorSession.preset` names it): the flow steps
  over the goals question while that answer stands (`storefront/progress.ts`), so nothing is asked twice.
  If a pick stops applying (a men's or women's interest once sex is known), the question is asked as
  usual. Every safety question is still asked.

## Results

Arranged the way the customer asked: one goal at a time, in the order they ranked them
(`src/storefront/plan.ts`, tested). Every goal gets an answer, every product appears once, and the
engine's words are used as they are.

1. **The title and the plan in a sentence**: "Two products for energy and digestion. KES 7,300 for
   a pack of each." It also says when a goal has nothing suitable, or can wait because the customer
   asked to start small. "Change my answers" sits right under it. The title takes focus on arrival.
2. The plan status if it needs a professional first (review, or clinic first with no products). The
   engine's "we couldn't find a … product" notes move into their goal instead.
3. **Goal by goal**: a sage numeral, "Your main goal" / "Goal 2", the goal's name, then its answer:
   - the product: picture, name, pack and how long it lasts, why it came up, every caution (always
     open), what to expect, price and "Add", in the same place as on the product cards;
   - or "covered by … above", when one product answers two goals;
   - or **"Nothing here suits you yet"**, with what was left out and why, and "Ask {first} about
     {goal}" on WhatsApp;
   - other good matches for that goal folded into one line ("2 more for digestion, for later") with
     their packs, so the plan stays the focus. Opened, each shows its first reason, every caution
     and its add;
   - "Left out for you": products for that goal that don't suit, and why.
4. Also worth a look (matches for something the customer said, not for a goal they named), worth
   checking with a doctor, and anything else left out
5. **Small changes that help**, introduced with what the customer told us ("You told us you're
   sleeping less than you need…"), so the advice reads as an answer, not a list
6. **Want to talk it through?** The engine's handoff message, sent to the distributor on WhatsApp
7. Start again, browse all products, the reference and the disclaimer

**The plan stays in reach.** On phones a bar holds the plan's total and "Add the whole plan" from
the first screen; once the plan is in the order it becomes "N items in your order · Review order".
On large screens the plan sits beside the detail as an order summary (each product, what it's for,
its price, the total, the main action, "Questions first? Message {first}"), sticky while scrolling.
Adding the plan only adds what isn't in the order yet.

A suggestion that isn't on the distributor's price list stays in the result with "Ask" instead of a
price: pricing never changes what the engine recommends.

## Phones

Designed at 390px, checked at 360px by the end-to-end tests (page, product, results, order, and the
page with a result on it). A bottom bar appears once you've scrolled past the two doors: "Help me
choose" plus WhatsApp, or the order total once something's in it, which also confirms each addition.
It steps aside for sheets, at the end of the page, and over the "Help me choose" section until
something is in the order (the goal tiles are already the next step there).

See `docs/REVIEW.md` for the screen-by-screen review behind these choices.
