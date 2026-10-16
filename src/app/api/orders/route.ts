import { after } from "next/server";
import { db } from "@/server/db";
import { portalConfig, queueOrder, retryPending, sendToPortal } from "@/server/portal";
import { sanitiseCart } from "@/storefront/cart";
import {
  ORDER_REF,
  canPlaceOrders,
  detailsProblem,
  orderRecord,
  parseDetails,
  placeProblem,
  portalOrder,
  priceOrder,
  type PortalOrder,
} from "@/storefront/order";
import { storefrontBySlug } from "@/storefronts";

/**
 * An order from a storefront, re-priced here from the storefront's own price list (prices from
 * the browser are never used). Two ways it arrives:
 *
 * - `place: true`: the customer placed it on the page. It's filed straight into the
 *   distributor's Suppli Afya portal (SUPPLI_AFYA_URL + STOREFRONT_SECRET, for a storefront
 *   linked by `suppliSlug`). If the portal can't take it, the customer is asked to send it on
 *   WhatsApp instead. Previews answer as if it worked and send nothing.
 * - otherwise: the customer sent it on WhatsApp, and this is a copy for the record. On a live,
 *   linked storefront it's filed in the portal too, so it shows in Orders and on Today.
 *
 * Whenever the portal can't take an order right now, it waits in this storefront's own database
 * (when DATABASE_URL is set) and is sent again; the portal files each reference once, so an order
 * sent twice still appears once. When ORDER_WEBHOOK_URL is set, live orders are also posted there.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.slug !== "string") return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  const sf = storefrontBySlug(body.slug);
  if (!sf) return Response.json({ ok: false, error: "Unknown storefront" }, { status: 404 });
  if (typeof body.ref !== "string" || !ORDER_REF.test(body.ref)) return Response.json({ ok: false, error: "Bad reference" }, { status: 400 });

  const place = body.place === true;
  const items = sanitiseCart(body.items).slice(0, 40);
  const details = parseDetails(body.details);
  const problem = place ? placeProblem(sf, details) : detailsProblem(sf, details);
  if (problem) return Response.json({ ok: false, error: problem }, { status: 422 });
  const order = priceOrder(sf, items, details);
  if (!order.lines.length) return Response.json({ ok: false, error: "The order is empty" }, { status: 422 });

  const selectorRef = typeof body.selectorRef === "string" && /^SA-[A-Z2-9]{4}$/.test(body.selectorRef) ? body.selectorRef : null;
  const record = { ...orderRecord(sf, order, details, { order: body.ref, selector: selectorRef }), placedAt: new Date().toISOString() };
  const summary = { ref: record.ref, total: record.total, totalConfirmed: record.totalConfirmed };

  let filed = false;
  let queued = false;
  if (place) {
    if (!canPlaceOrders(sf)) return Response.json({ ok: false, error: "Send this order on WhatsApp." }, { status: 409 });
    if (sf.status === "preview") return Response.json({ ok: true, placed: true, preview: true, ...summary });
    const sent = await fileWithSuppliAfya(sf.slug, portalOrder(record, sf.suppliSlug!));
    if (!sent.filed)
      return Response.json(
        { ok: false, queued: sent.queued, error: `We couldn't reach ${sf.distributor.firstName} just now. Send the order on WhatsApp instead; it's all written for you.` },
        { status: 502 },
      );
    filed = true;
  } else if (sf.status === "live" && sf.suppliSlug && record.customer.phone && portalConfig()) {
    // Sent on WhatsApp: the portal needs a phone number to file it under the customer.
    ({ filed, queued } = await fileWithSuppliAfya(sf.slug, portalOrder(record, sf.suppliSlug)));
  }

  let forwarded = false;
  const hook = process.env.ORDER_WEBHOOK_URL;
  if (hook && sf.status === "live") {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    forwarded = Boolean(res?.ok);
  }
  return Response.json({ ok: true, placed: place, filed, queued, forwarded, ...summary });
}

/**
 * Files the order in the distributor's Suppli Afya portal. If the portal can't take it right now,
 * it's kept to try again (when this deploy has a database). Once the portal answers, anything
 * still waiting is sent too.
 */
async function fileWithSuppliAfya(storefront: string, toPortal: PortalOrder) {
  const sent = await sendToPortal(toPortal);
  const store = db();
  if (sent.ok) {
    if (store) after(() => store.then((d) => retryPending(d)).catch((e) => console.error("Retrying waiting orders failed", e)));
    return { filed: true, queued: false };
  }
  console.error(`Order ${toPortal.ref} wasn't filed in the portal: ${sent.error}`);
  if (!store || !sent.retry) return { filed: false, queued: false };
  const queued = await store
    .then((d) => queueOrder(d, storefront, toPortal, sent.error))
    .then(() => true)
    .catch((e) => {
      console.error(`Order ${toPortal.ref} couldn't be kept to try again`, e);
      return false;
    });
  return { filed: false, queued };
}
