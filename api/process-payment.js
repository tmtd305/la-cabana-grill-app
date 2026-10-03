// Square payments for La Cabaña Grill.
// 1) Regular cart checkout: { sourceId, amount, orderId }  (unchanged)
// 2) Talk-to-order: { sourceId, talkOrderId, talkToken } — the amount comes from the order the restaurant built
//    (never from the browser), and on success the order is marked paid so the operator screen shows it instantly.
//    Needs LC_SUPABASE_SECRET_KEY (Supabase secret key of the la-cabana-grill project) in Vercel env vars.
const LC_SUPABASE_URL = process.env.LC_SUPABASE_URL || "https://qzluvwpjtgeccfojutbt.supabase.co";

async function charge({ accessToken, locationId, apiHost, sourceId, amount, idempotencyKey, note, orderId, tip, amountCents }) {
  const body = { source_id: sourceId, idempotency_key: idempotencyKey, amount_money: { amount: amountCents != null ? amountCents : Math.round(amount * 100), currency: "USD" }, location_id: locationId, note };
  if (orderId) body.order_id = orderId;
  if (tip > 0) body.tip_money = { amount: Math.round(tip * 100), currency: "USD" };
  const squareRes = await fetch(apiHost + "/v2/payments", {
    method: "POST",
    headers: { "Square-Version": "2024-01-18", "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await squareRes.json();
  return { ok: squareRes.ok, status: squareRes.status, data };
}

// App orders show up in Square POS / Dashboard as real orders (items, notes, pickup or delivery), not just a payment.
async function createSquareOrder({ accessToken, locationId, apiHost, order, ref }) {
  const cents = (n) => Math.max(0, Math.round(Number(n || 0) * 100));
  const lines = (order.lines || []).slice(0, 60).map((l) => ({
    name: String(l.name || "Item").slice(0, 120),
    quantity: String(Math.max(1, Math.min(50, l.qty | 0 || 1))),
    base_price_money: { amount: cents(l.price), currency: "USD" },
    note: l.note ? String(l.note).slice(0, 500) : undefined
  }));
  if (!lines.length) return null;
  const phone = String(order.phone || "").replace(/\D/g, "");
  const recipient = { display_name: String(order.name || "App customer").slice(0, 80) };
  if (phone.length === 10) recipient.phone_number = "+1" + phone;
  else if (phone.length === 11 && phone[0] === "1") recipient.phone_number = "+" + phone;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(order.email || ""))) recipient.email_address = String(order.email).trim().slice(0, 120);
  const fulfillment = order.fulfillment === "delivery"
    ? { type: "DELIVERY", state: "PROPOSED", delivery_details: { recipient: { ...recipient, address: order.address ? { address_line_1: String(order.address.street || "").slice(0, 120), address_line_2: order.address.apt ? String(order.address.apt).slice(0, 60) : undefined, locality: order.address.city || "Miami Beach", administrative_district_level_1: "FL", postal_code: String(order.address.zip || ""), country: "US" } : undefined }, schedule_type: "ASAP", note: order.notes ? String(order.notes).slice(0, 500) : "Uber Direct delivery" } }
    : { type: "PICKUP", state: "PROPOSED", pickup_details: { recipient, schedule_type: "ASAP", prep_time_duration: "PT20M", note: "App order" + (order.marketing ? " · OK to text deals" : "") } };
  const o = { location_id: locationId, reference_id: ref, source: { name: "La Cabana App" }, line_items: lines, fulfillments: [fulfillment],
    taxes: [{ uid: "sales-tax", name: "Sales tax", percentage: "7.9", scope: "ORDER" }] };
  if (cents(order.discount) > 0) o.discounts = [{ uid: "promo", name: "Free juice promo", amount_money: { amount: cents(order.discount), currency: "USD" }, scope: "ORDER" }];
  if (cents(order.deliveryFee) > 0) o.service_charges = [{ name: "Delivery (Uber)", amount_money: { amount: cents(order.deliveryFee), currency: "USD" }, calculation_phase: "TOTAL_PHASE", taxable: false }];
  const r = await fetch(apiHost + "/v2/orders", {
    method: "POST",
    headers: { "Square-Version": "2024-01-18", "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ idempotency_key: "ord-" + ref, order: o })
  });
  const d = await r.json();
  if (!r.ok || !d.order) { console.error("Square order failed", JSON.stringify(d.errors || d)); return null; }
  return d.order;
}

// Customer list for the staff dashboard / marketing (needs LC_SUPABASE_SECRET_KEY). Never blocks the sale.
async function saveCustomer(order, ref, total) {
  try {
    const key = process.env.LC_SUPABASE_SECRET_KEY; if (!key) return;
    const h = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
    if (!key.startsWith("sb_")) h.Authorization = "Bearer " + key;
    await fetch(LC_SUPABASE_URL + "/rest/v1/rpc/record_customer_order", { method: "POST", headers: h, body: JSON.stringify({
      p_name: String(order.name || "").slice(0, 80), p_phone: String(order.phone || "").slice(0, 30), p_email: String(order.email || "").slice(0, 120),
      p_marketing: !!order.marketing, p_ref: ref, p_total: total, p_referral: /^[A-Za-z0-9]{4,12}$/.test(String(order.referral || "")) ? String(order.referral) : null }) });
  } catch (e) { console.error("saveCustomer", e.message); }
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { sourceId, amount, orderId, talkOrderId, talkToken, order } = req.body || {};
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const env = process.env.SQUARE_ENV === "production" ? "production" : "sandbox";
  const apiHost = env === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  if (!accessToken || !locationId) { res.status(500).json({ error: "Payment processing is not configured yet" }); return; }
  if (!sourceId) { res.status(400).json({ error: "Missing card details" }); return; }

  try {
    // ---------- talk-to-order ----------
    if (talkOrderId) {
      const key = process.env.LC_SUPABASE_SECRET_KEY;
      if (!key) { res.status(500).json({ error: "Voice-order payments aren't switched on yet" }); return; }
      const sbHeaders = { apikey: key, "Content-Type": "application/json" };
      if (!key.startsWith("sb_")) sbHeaders.Authorization = "Bearer " + key;   // legacy service_role JWT
      const q = await fetch(LC_SUPABASE_URL + "/rest/v1/talk_orders?id=eq." + encodeURIComponent(talkOrderId) + "&select=id,order_number,total,status,customer_token", { headers: sbHeaders });
      const rows = q.ok ? await q.json() : [];
      const o = rows[0];
      if (!o || o.customer_token !== talkToken) { res.status(404).json({ error: "Order not found" }); return; }
      if (o.status === "paid") { res.status(409).json({ error: "This order is already paid" }); return; }
      if (o.status !== "sent") { res.status(409).json({ error: "This order was replaced — check the latest one" }); return; }
      const total = Number(o.total);
      if (!(total > 0)) { res.status(400).json({ error: "Invalid order total" }); return; }
      const r = await charge({ accessToken, locationId, apiHost, sourceId, amount: total,
        idempotencyKey: "talk-" + o.id + "-" + String(sourceId).slice(-16), note: "La Cabana Grill voice order #" + o.order_number });
      if (!r.ok) { res.status(r.status).json({ error: r.data.errors ? r.data.errors[0].detail : "Payment failed" }); return; }
      await fetch(LC_SUPABASE_URL + "/rest/v1/talk_orders?id=eq." + encodeURIComponent(o.id), {
        method: "PATCH", headers: { ...sbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "paid", payment_id: r.data.payment.id, paid_at: new Date().toISOString() })
      });
      res.status(200).json({ success: true, paymentId: r.data.payment.id, status: r.data.payment.status, orderNumber: o.order_number, amount: total });
      return;
    }

    // ---------- regular cart checkout (unchanged) ----------
    if (!amount || amount <= 0) { res.status(400).json({ error: "Missing sourceId or invalid amount" }); return; }
    if (order && Array.isArray(order.lines) && order.lines.length) {
      const ref = "APP-" + Date.now().toString(36).toUpperCase();
      const sq = await createSquareOrder({ accessToken, locationId, apiHost, order, ref });
      if (sq) {
        const tip = Math.max(0, Math.min(1000, Number(order.tip || 0)));
        const r2 = await charge({ accessToken, locationId, apiHost, sourceId, orderId: sq.id, tip, amountCents: sq.total_money.amount,
          idempotencyKey: ref + "-" + String(sourceId).slice(-16), note: "La Cabana Grill app order " + ref });
        if (!r2.ok) { res.status(r2.status).json({ error: r2.data.errors ? r2.data.errors[0].detail : "Payment failed" }); return; }
        const p = r2.data.payment;
        await saveCustomer(order, ref, (p.total_money ? p.total_money.amount : p.amount_money.amount) / 100);
        res.status(200).json({ success: true, paymentId: p.id, status: p.status, squareOrderId: sq.id, reference: ref, charged: (p.total_money ? p.total_money.amount : p.amount_money.amount) / 100 });
        return;
      }
      // if Square refused the order, still take the payment the old way so the sale isn't lost
    }
    const r = await charge({ accessToken, locationId, apiHost, sourceId, amount,
      idempotencyKey: (orderId || "order") + "-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      note: orderId ? ("La Cabana Grill order " + orderId) : "La Cabana Grill order" });
    if (!r.ok) { res.status(r.status).json({ error: r.data.errors ? r.data.errors[0].detail : "Payment failed" }); return; }
    res.status(200).json({ success: true, paymentId: r.data.payment.id, status: r.data.payment.status });
  } catch (err) {
    res.status(500).json({ error: "Payment processing error: " + err.message });
  }
}
