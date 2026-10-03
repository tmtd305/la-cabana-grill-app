// Phone orders taken by staff on the dashboard. Signed-in staff only.
// { action: "link", order: { ref, name, phone, kind, lines:[{name, qty, price, note}], deliveryFee, tip } }
//     -> creates the order in Square (items, 7.9% tax, delivery fee, tip) and returns a Square payment link to text the customer
// { action: "check", orderId } -> { paid, cents }
const LC_SUPABASE_URL = process.env.LC_SUPABASE_URL || "https://qzluvwpjtgeccfojutbt.supabase.co";

async function isStaff(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const r = await fetch(LC_SUPABASE_URL + "/rest/v1/rpc/is_operator", { method: "POST", headers: { apikey: "sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ", Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: "{}" });
  return r.ok && (await r.json()) === true;
}
function e164(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!(await isStaff(req))) { res.status(401).json({ error: "Staff only" }); return; }
  const token = process.env.SQUARE_ACCESS_TOKEN, loc = process.env.SQUARE_LOCATION_ID;
  const host = process.env.SQUARE_ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  if (!token || !loc) { res.status(500).json({ error: "Square isn't set up" }); return; }
  const H = { "Square-Version": "2024-01-18", Authorization: "Bearer " + token, "Content-Type": "application/json" };
  const body = req.body || {};
  const cents = (n) => Math.max(0, Math.round(Number(n || 0) * 100));

  try {
    if (body.action === "link") {
      const o = body.order || {};
      const lines = (o.lines || []).slice(0, 60).map((l) => ({
        name: String(l.name || "Item").slice(0, 120),
        quantity: String(Math.max(1, Math.min(50, l.qty | 0 || 1))),
        base_price_money: { amount: cents(l.price), currency: "USD" },
        note: l.note ? String(l.note).slice(0, 500) : undefined
      }));
      if (!lines.length) { res.status(400).json({ error: "Add at least one item" }); return; }
      const ref = String(o.ref || ("PHONE-" + Date.now().toString(36).toUpperCase())).slice(0, 40);
      const ph = e164(o.phone);
      const recipient = { display_name: String(o.name || "Phone order").slice(0, 80) };
      if (ph) recipient.phone_number = ph;
      const order = {
        location_id: loc, reference_id: ref, line_items: lines,
        taxes: [{ uid: "sales-tax", name: "Sales tax", percentage: "7.9", scope: "ORDER" }],
        fulfillments: [o.kind === "delivery"
          ? { type: "DELIVERY", state: "PROPOSED", delivery_details: { recipient, schedule_type: "ASAP", note: "Phone order - Uber delivery" } }
          : { type: "PICKUP", state: "PROPOSED", pickup_details: { recipient, schedule_type: "ASAP", note: "Phone order" } }]
      };
      const sc = [];
      if (cents(o.deliveryFee) > 0) sc.push({ name: "Delivery (Uber)", amount_money: { amount: cents(o.deliveryFee), currency: "USD" }, calculation_phase: "TOTAL_PHASE", taxable: false });
      if (cents(o.tip) > 0) sc.push({ name: "Tip", amount_money: { amount: cents(o.tip), currency: "USD" }, calculation_phase: "TOTAL_PHASE", taxable: false });
      if (sc.length) order.service_charges = sc;
      const make = (ord) => fetch(host + "/v2/online-checkout/payment-links", { method: "POST", headers: H, body: JSON.stringify({
        idempotency_key: "po-" + ref + "-" + Math.random().toString(36).slice(2, 8),
        order: ord,
        checkout_options: { ask_for_shipping_address: false, allow_tipping: false },
        pre_populated_data: ph ? { buyer_phone_number: ph } : undefined,
        payment_note: "La Cabana phone order " + ref
      }) }).then(async (r) => ({ ok: r.ok, d: await r.json() }));
      let r = await make(order);
      // some Square accounts don't accept fulfillments on payment links; the dashboard keeps the customer info either way
      if (!r.ok) { const o2 = { ...order }; delete o2.fulfillments; r = await make(o2); }
      if (!r.ok || !r.d.payment_link) { res.status(400).json({ error: (r.d.errors && r.d.errors[0] && r.d.errors[0].detail) || "Couldn't make the payment link" }); return; }
      const pl = r.d.payment_link, rel = r.d.related_resources || {};
      const total = rel.orders && rel.orders[0] && rel.orders[0].total_money ? rel.orders[0].total_money.amount / 100 : null;
      res.status(200).json({ url: pl.url, orderId: pl.order_id, ref, total });
      return;
    }
    if (body.action === "check") {
      const r = await fetch(host + "/v2/orders/" + encodeURIComponent(String(body.orderId || "")), { headers: H });
      const o = r.ok ? (await r.json()).order : null;
      if (!o) { res.status(200).json({ paid: false, cents: 0 }); return; }
      const tendered = (o.tenders || []).reduce((a, t) => a + ((t.amount_money && t.amount_money.amount) || 0), 0);
      const due = o.net_amount_due_money ? o.net_amount_due_money.amount : null;
      res.status(200).json({ paid: tendered > 0 && (due === null || due === 0), cents: tendered, total: o.total_money ? o.total_money.amount / 100 : null });
      return;
    }
    res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Phone order error" });
  }
}
