import { sanitiseCart } from "@/storefront/cart";
import { ORDER_REF, canPlaceOrders, detailsProblem, orderRecord, parseDetails, placeProblem, priceOrder } from "@/storefront/order";
import { storefrontBySlug } from "@/storefronts";

/**
 * An order from a storefront, re-priced here from the storefront's own price list (prices from
 * the browser are never used). Two ways it arrives:
 *
 * - `place: true`: the customer placed it on the page. It's filed straight into the
 *   distributor's Suppli Afya portal (SUPPLI_AFYA_URL + STOREFRONT_SECRET, for a storefront
 *   linked by `suppliSlug`). Previews answer as if it worked and send nothing.
 * - otherwise: the customer sent it on WhatsApp, and this is a copy for the record.
 *
 * Either way, when ORDER_WEBHOOK_URL is set, live orders are also posted there.
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

  if (place) {
    if (!canPlaceOrders(sf)) return Response.json({ ok: false, error: "Send this order on WhatsApp." }, { status: 409 });
    if (sf.status === "preview") return Response.json({ ok: true, placed: true, preview: true, ...summary });
    const filed = await fileWithSuppliAfya(sf.suppliSlug!, record);
    if (!filed)
      return Response.json(
        { ok: false, error: `We couldn't reach ${sf.distributor.firstName} just now. Send the order on WhatsApp instead; it's all written for you.` },
        { status: 502 },
      );
  }

  let forwarded = false;
  const hook = process.env.ORDER_WEBHOOK_URL;
  if (hook && sf.status === "live") {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    forwarded = Boolean(res?.ok);
  }
  return Response.json({ ok: true, placed: place, forwarded, ...summary });
}

/** Files the order in the distributor's Suppli Afya portal. True once the app has it. */
async function fileWithSuppliAfya(suppliSlug: string, record: object) {
  const base = process.env.SUPPLI_AFYA_URL;
  const secret = process.env.STOREFRONT_SECRET;
  if (!base || !secret) return false;
  const res = await fetch(`${base.replace(/\/$/, "")}/api/storefront/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ ...record, suppliSlug }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  return Boolean(res?.ok);
}
