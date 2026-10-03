// Uber Direct delivery for La Cabaña Grill: Uber sends a driver for orders placed in our own app (flat fee per trip, no commission).
// 1) { action: "quote", address }                       -> delivery price + ETA for that address
// 2) { action: "create", quote, paymentId, address, name, phone, items, orderId, notes }
//                                                        -> after the card is charged, books the driver; returns the tracking link
// Vercel env vars (from the Uber Direct dashboard): UBER_DIRECT_CLIENT_ID, UBER_DIRECT_CLIENT_SECRET, UBER_DIRECT_CUSTOMER_ID.
// Optional: DELIVERY_MARKUP (dollars added on top of Uber's fee, default 0).
// 3) Staff dashboard (phone orders), signed-in staff only (Authorization: Bearer <Supabase token>):
//    { action: "staff_create", quote, address, name, phone, notes, items } -> books a driver without a card payment
//    { action: "staff_status", deliveryId } / { action: "staff_cancel", deliveryId }
import crypto from "crypto";

const PICKUP = {
  name: "La Cabaña Grill",
  phone: "+17862547968",
  address: { street_address: ["6780 Collins Ave"], city: "Miami Beach", state: "FL", zip_code: "33141", country: "US" }
};

let cachedToken = null, tokenExpires = 0;
async function uberToken(id, secret) {
  if (cachedToken && Date.now() < tokenExpires - 60000) return cachedToken;
  const r = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials", scope: "eats.deliveries" })
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error("Couldn't connect to Uber Direct");
  cachedToken = d.access_token; tokenExpires = Date.now() + (d.expires_in || 2592000) * 1000;
  return cachedToken;
}

function dropoff(a) {
  if (!a || !a.street || !a.zip) return null;
  const street = [String(a.street).trim()];
  if (a.apt && String(a.apt).trim()) street.push(String(a.apt).trim());
  return { street_address: street, city: String(a.city || "Miami Beach").trim(), state: String(a.state || "FL").trim(), zip_code: String(a.zip).trim(), country: "US" };
}

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

// The quote is signed so the browser can't change the delivery price between quote and payment.
function sign(quoteId, feeCents, secret) {
  return crypto.createHmac("sha256", secret).update(quoteId + "|" + feeCents).digest("hex").slice(0, 32);
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const id = process.env.UBER_DIRECT_CLIENT_ID, secret = process.env.UBER_DIRECT_CLIENT_SECRET, customer = process.env.UBER_DIRECT_CUSTOMER_ID;
  if (!id || !secret || !customer) { res.status(503).json({ error: "Delivery isn't available yet. Choose pickup for now.", notConfigured: true }); return; }
  const base = "https://api.uber.com/v1/customers/" + encodeURIComponent(customer);
  const body = req.body || {};

  try {
    const token = await uberToken(id, secret);
    const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };

    // ---------- price + ETA for an address ----------
    if (body.action === "quote") {
      const to = dropoff(body.address);
      if (!to) { res.status(400).json({ error: "Enter your street address and ZIP code" }); return; }
      const r = await fetch(base + "/delivery_quotes", {
        method: "POST", headers,
        body: JSON.stringify({ pickup_address: JSON.stringify(PICKUP.address), dropoff_address: JSON.stringify(to) })
      });
      const q = await r.json();
      if (!r.ok) { res.status(400).json({ error: q.message || "We can't deliver to that address" }); return; }
      const markup = Math.max(0, Math.round(Number(process.env.DELIVERY_MARKUP || 0) * 100));
      const feeCents = q.fee + markup;
      res.status(200).json({ quoteId: q.id, fee: feeCents / 100, feeCents, etaMinutes: q.duration || null, expires: q.expires, sig: sign(q.id, feeCents, secret) });
      return;
    }

    // ---------- book the driver (only after the card is charged) ----------
    if (body.action === "create") {
      const qt = body.quote || {};
      if (!qt.quoteId || sign(qt.quoteId, qt.feeCents, secret) !== qt.sig) { res.status(400).json({ error: "Delivery price expired. Get a new price and try again." }); return; }
      const to = dropoff(body.address), phone = e164(body.phone);
      if (!to || !phone || !body.name) { res.status(400).json({ error: "Missing delivery name, phone or address" }); return; }

      // the order must really be paid, and paid enough to cover the delivery fee
      const sqToken = process.env.SQUARE_ACCESS_TOKEN;
      const sqHost = process.env.SQUARE_ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
      const pr = await fetch(sqHost + "/v2/payments/" + encodeURIComponent(body.paymentId || ""), { headers: { "Square-Version": "2024-01-18", Authorization: "Bearer " + sqToken } });
      const pd = pr.ok ? await pr.json() : null;
      const pay = pd && pd.payment;
      if (!pay || !["COMPLETED", "APPROVED"].includes(pay.status) || pay.amount_money.amount < qt.feeCents) { res.status(402).json({ error: "Payment not found for this delivery" }); return; }

      const items = Array.isArray(body.items) && body.items.length ? body.items : [{ name: "Food order", qty: 1 }];
      const r = await fetch(base + "/deliveries", {
        method: "POST", headers,
        body: JSON.stringify({
          quote_id: qt.quoteId,
          pickup_name: PICKUP.name, pickup_phone_number: PICKUP.phone, pickup_address: JSON.stringify(PICKUP.address),
          pickup_notes: "Order " + String(body.orderId || "").slice(0, 20) + " - ask at the counter",
          dropoff_name: String(body.name).slice(0, 80), dropoff_phone_number: phone, dropoff_address: JSON.stringify(to),
          dropoff_notes: String(body.notes || "").slice(0, 280),
          manifest_items: items.slice(0, 30).map((i) => ({ name: String(i.name).slice(0, 80), quantity: Math.max(1, Math.min(50, i.qty | 0 || 1)), size: "small" })),
          external_id: String(body.orderId || "").slice(0, 40)
        })
      });
      const d = await r.json();
      if (!r.ok) { res.status(400).json({ error: d.message || "Couldn't book the driver" }); return; }
      res.status(200).json({ deliveryId: d.id, trackingUrl: d.tracking_url, status: d.status });
      return;
    }

    // ---------- staff: phone orders from the dashboard ----------
    if (String(body.action || "").startsWith("staff_")) {
      if (!(await isStaff(req))) { res.status(401).json({ error: "Staff only" }); return; }
      const sqToken = process.env.SQUARE_ACCESS_TOKEN, sqLoc = process.env.SQUARE_LOCATION_ID;
      const sqHost = process.env.SQUARE_ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
      const SQH = { "Square-Version": "2024-01-18", Authorization: "Bearer " + sqToken, "Content-Type": "application/json" };
      const orderPaid = async (orderId) => {
        const r = await fetch(sqHost + "/v2/orders/" + encodeURIComponent(orderId), { headers: SQH });
        const o = r.ok ? (await r.json()).order : null;
        if (!o) return { paid: false, cents: 0 };
        const tendered = (o.tenders || []).reduce((a, t) => a + ((t.amount_money && t.amount_money.amount) || 0), 0);
        const due = o.net_amount_due_money ? o.net_amount_due_money.amount : null;
        return { paid: tendered > 0 && (due === null || due === 0), cents: tendered };
      };
      // 1) text the customer a Square payment link for food + delivery
      if (body.action === "staff_paylink") {
        const cents = Math.round(Number(body.amount || 0) * 100);
        if (!(cents >= 100 && cents <= 200000)) { res.status(400).json({ error: "Enter the order total" }); return; }
        const ph = e164(body.phone);
        const r = await fetch(sqHost + "/v2/online-checkout/payment-links", { method: "POST", headers: SQH, body: JSON.stringify({
          idempotency_key: "pl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
          quick_pay: { name: ("Phone order - " + String(body.name || "Customer")).slice(0, 255), price_money: { amount: cents, currency: "USD" }, location_id: sqLoc },
          pre_populated_data: ph ? { buyer_phone_number: ph } : undefined,
          payment_note: "La Cabana phone order with Uber delivery"
        }) });
        const d = await r.json();
        if (!r.ok || !d.payment_link) { res.status(400).json({ error: (d.errors && d.errors[0] && d.errors[0].detail) || "Couldn't make the payment link" }); return; }
        res.status(200).json({ url: d.payment_link.url, orderId: d.payment_link.order_id, linkId: d.payment_link.id });
        return;
      }
      // 2) has the customer paid yet?
      if (body.action === "staff_paycheck") {
        if (!body.orderId) { res.status(400).json({ error: "Missing order" }); return; }
        res.status(200).json(await orderPaid(body.orderId));
        return;
      }
      if (body.action === "staff_create") {
        const qt = body.quote || {};
        if (!qt.quoteId || sign(qt.quoteId, qt.feeCents, secret) !== qt.sig) { res.status(400).json({ error: "Price expired. Get a new price." }); return; }
        // the customer pays first (Square payment link), unless staff confirms they already paid in store
        if (!body.paidOffline) {
          if (!body.paidOrderId) { res.status(402).json({ error: "The customer hasn't paid yet" }); return; }
          const pd = await orderPaid(body.paidOrderId);
          if (!pd.paid || pd.cents < qt.feeCents) { res.status(402).json({ error: "The customer hasn't paid yet" }); return; }
        }
        const to = dropoff(body.address), phone = e164(body.phone);
        if (!to || !phone || !body.name) { res.status(400).json({ error: "Add the customer's name, phone and address" }); return; }
        const items = String(body.items || "Food order").split(/\n|,/).map((x) => x.trim()).filter(Boolean).slice(0, 30);
        const r = await fetch(base + "/deliveries", {
          method: "POST", headers,
          body: JSON.stringify({
            quote_id: qt.quoteId,
            pickup_name: PICKUP.name, pickup_phone_number: PICKUP.phone, pickup_address: JSON.stringify(PICKUP.address),
            pickup_notes: "Phone order for " + String(body.name).slice(0, 40) + " - ask at the counter",
            dropoff_name: String(body.name).slice(0, 80), dropoff_phone_number: phone, dropoff_address: JSON.stringify(to),
            dropoff_notes: String(body.notes || "").slice(0, 280),
            manifest_items: (items.length ? items : ["Food order"]).map((n) => ({ name: n.slice(0, 80), quantity: 1, size: "small" })),
            external_id: "PHONE-" + Date.now().toString(36).toUpperCase()
          })
        });
        const d = await r.json();
        if (!r.ok) { res.status(400).json({ error: d.message || "Couldn't book the driver" }); return; }
        res.status(200).json({ deliveryId: d.id, trackingUrl: d.tracking_url, status: d.status, fee: qt.feeCents / 100 });
        return;
      }
      if (body.action === "staff_status" || body.action === "staff_cancel") {
        const did = encodeURIComponent(String(body.deliveryId || ""));
        if (!did) { res.status(400).json({ error: "Missing delivery" }); return; }
        const r = body.action === "staff_cancel"
          ? await fetch(base + "/deliveries/" + did + "/cancel", { method: "POST", headers, body: "{}" })
          : await fetch(base + "/deliveries/" + did, { headers });
        const d = await r.json();
        if (!r.ok) { res.status(400).json({ error: d.message || "Uber error" }); return; }
        const c = d.courier || {};
        res.status(200).json({ status: d.status, trackingUrl: d.tracking_url, courier: c.name ? { name: c.name, phone: c.phone_number || "", vehicle: [c.vehicle_make, c.vehicle_model, c.vehicle_color].filter(Boolean).join(" ") } : null, dropoffEta: d.dropoff_eta || null, pickupEta: d.pickup_eta || null });
        return;
      }
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Delivery error" });
  }
}
