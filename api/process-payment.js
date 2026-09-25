// Square payments for La Cabaña Grill.
// 1) Regular cart checkout: { sourceId, amount, orderId }  (unchanged)
// 2) Talk-to-order: { sourceId, talkOrderId, talkToken } — the amount comes from the order the restaurant built
//    (never from the browser), and on success the order is marked paid so the operator screen shows it instantly.
//    Needs LC_SUPABASE_SECRET_KEY (Supabase secret key of the la-cabana-grill project) in Vercel env vars.
const LC_SUPABASE_URL = process.env.LC_SUPABASE_URL || "https://qzluvwpjtgeccfojutbt.supabase.co";

async function charge({ accessToken, locationId, apiHost, sourceId, amount, idempotencyKey, note }) {
  const squareRes = await fetch(apiHost + "/v2/payments", {
    method: "POST",
    headers: { "Square-Version": "2024-01-18", "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, idempotency_key: idempotencyKey, amount_money: { amount: Math.round(amount * 100), currency: "USD" }, location_id: locationId, note })
  });
  const data = await squareRes.json();
  return { ok: squareRes.ok, status: squareRes.status, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { sourceId, amount, orderId, talkOrderId, talkToken } = req.body || {};
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
    const r = await charge({ accessToken, locationId, apiHost, sourceId, amount,
      idempotencyKey: (orderId || "order") + "-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      note: orderId ? ("La Cabana Grill order " + orderId) : "La Cabana Grill order" });
    if (!r.ok) { res.status(r.status).json({ error: r.data.errors ? r.data.errors[0].detail : "Payment failed" }); return; }
    res.status(200).json({ success: true, paymentId: r.data.payment.id, status: r.data.payment.status });
  } catch (err) {
    res.status(500).json({ error: "Payment processing error: " + err.message });
  }
}
