# Design review

A screen-by-screen review of the storefront on a phone (390px) and desktop (1440px), with Kate's page
as the example. It records what wasn't working and what changed, so later changes keep the reasons.
The principles are in `DESIGN.md`.

## Bugs

| Problem | Why it matters | Change |
|---|---|---|
| After "Place order", the page behind the confirmation shifted sideways and its text re-wrapped | Looked broken at the moment of trust. Every sheet re-ran its open/close effect whenever the page's state changed, releasing and retaking the scroll lock and pulling focus back to the top of the sheet | Sheets keep the latest close handler in a ref; opening and closing are the only things that lock scrolling or move focus |
| The progress bar filled the goals part, then dropped back once goals were picked | A bar that goes backwards feels like the questions got longer | Progress counts questions behind you, not the one on screen (`src/storefront/progress.ts`, tested) |
| On the privacy page, "Back to the shop" and the "Privacy" label ran into each other | Looked unfinished | Each on its own line |
| The privacy page described orders as WhatsApp-only | Placing an order on the page sends name, phone, delivery and note to the distributor's workspace; the notice has to say so | Describes both ways of ordering and what each one shares |
| "How ordering works" said the order opens in WhatsApp | No longer true where orders can be placed on the page | Step 2 is "Place your order", or "Send your order" where only WhatsApp is available |

## First screen

| Problem | Why it matters | Change |
|---|---|---|
| "Independent BF Suma distributor" twice in the first 150px (top bar and kicker) | Repetition pushes the question further down and reads as filler | The kicker says where the distributor is and when prices were checked; the top bar keeps the role on every screen |
| Three packs with prices, no names | The drawn packs carry no words, so the shelf showed three anonymous prices | Each shelf tag has the name above the price |
| Calling card line "Nairobi · Orders and questions on WhatsApp" wrapped mid-phrase | Ragged, and ordering now happens on the page too | Place on one line, "Questions? Ask on WhatsApp" on the next |
| "see what fits what you're looking for" | Clumsy in the one paragraph everyone reads | "see what fits you" |

## Help me choose

| Problem | Why it matters | Change |
|---|---|---|
| On phones the goal tiles and the four parts took about three screens | The products were far away for people who just want to browse | Tighter tiles (arrows only where there's room, hints kept to two lines), the four parts as names only, "About 3 minutes" on the last tile |
| The bottom bar offered "Help me choose" over the Help me choose section | Two ways to do the same thing, and it covered the last tiles | The bar steps aside there until there's an order |
| The opening screen had Back and Close, and its button sat mid-screen | Back went nowhere new; every other question's button is at the bottom | No Back on that screen; the button is where the thumb already is |
| The results page said "Your suggestions" twice (header and label) | Noise | The label is the reference to quote to the distributor |
| "Also in your plan" pictures as tall as the lead one on phones | Longer scroll, weaker hierarchy | Shorter pictures for the rest of the plan |
| On the page, suggested product names wrapped to three lines on phones | Hard to read, with the price squeezed beside them | Price under the name on phones, and one less box around the list |

## Ordering

| Problem | Why it matters | Change |
|---|---|---|
| "Cost confirmed with you" beside every delivery area, then a sentence saying the same | Wrapped onto two lines and said everything three times | "Cost to confirm", and the one sentence stays |
| "M-Pesa" broke across lines at its hyphen ("M-" / "Pesa") | Looks like a typo in the payment line | Kept on one line wherever it's in running text |
| After placing an order, "Message Kate about it" was the main button | The order is done; the main action is to finish | "Done" leads, with "Message Kate" and "Copy order" beside each other |
| Four "How ordering works" steps took over a screen on phones | Big numbers on their own lines | The number sits beside its step on phones |

## Desktop

| Problem | Why it matters | Change |
|---|---|---|
| In the product dialog the pack sat at the bottom of a tall picture | Looked misplaced | The pack stands in the middle |
