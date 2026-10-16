// Square payments for La Cabaña Grill.
// 1) Regular cart checkout: { sourceId, amount, order: { lines: [{ id, qty, opts }], quote, tip, ... } } — prices from data.js
// 2) Talk-to-order: { sourceId, talkOrderId, talkToken } — the amount comes from the order the restaurant built
//    (never from the browser), and on success the order is marked paid so the operator screen shows it instantly.
//    Needs LC_SUPABASE_SECRET_KEY (Supabase secret key of the la-cabana-grill project) in Vercel env vars.
const LC_SUPABASE_URL = process.env.LC_SUPABASE_URL || "https://qzluvwpjtgeccfojutbt.supabase.co";
import crypto from "crypto";
import { loadMenu, priceLines, discountFor } from "./_pricing.js";
import { sendPurchase } from "./_meta.js";

// delivery quotes are signed by api/uber-direct.js; the fee is only trusted when the signature matches
function quoteFeeCents(q) {
  const secret = process.env.UBER_DIRECT_CLIENT_SECRET;
  if (!q || !q.quoteId || !secret) return null;
  const sig = crypto.createHmac("sha256", secret).update(q.quoteId + "|" + q.feeCents).digest("hex").slice(0, 32);
  return sig === q.sig && Number.isInteger(q.feeCents) && q.feeCents >= 0 ? q.feeCents : null;
}

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

// FIRSTJUICE: one free juice on a customer's first order with a meal. checkFirstJuice() checks the cart shape
// (one $0 juice, qty 1, with a main dish); claimFirstJuice() then locks it to this phone number and email in Supabase
// (first_juice_claims, atomic) right before the charge, and releaseFirstJuice() frees it only if that charge fails.
const MEAL_CATEGORIES = ["steak", "chicken", "roast", "seafood", "rice", "pork", "burgers", "sandwiches", "arepas", "salads", "promo"];
const LC_SUPABASE_KEY = process.env.LC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ";
function checkFirstJuice(order) {
  const free = order.lines.filter((l) => l && l.promo === "FIRSTJUICE");
  if (!free.length) return "";
  if (free.length > 1 || (free[0].qty | 0) !== 1) return "Only one free juice per order";
  if (!order.lines.some((l) => !l.promo && l.item && MEAL_CATEGORIES.includes(l.item.category) && l.price > 0)) return "Code valid on your first order with a meal";
  let ph = String(order.phone || "").replace(/\D/g, "");
  if (ph.length === 11 && ph[0] === "1") ph = ph.slice(1);
  if (ph.length !== 10) return "Add your phone number to get the free juice";
  return "";
}
// same person, different spelling: John.Doe+x@Gmail.com -> johndoe@gmail.com
function normEmail(e) {
  let [u, d] = String(e || "").trim().toLowerCase().split("@");
  if (!u || !d) return "";
  u = u.split("+")[0];
  if (d === "gmail.com" || d === "googlemail.com") { u = u.replace(/\./g, ""); d = "gmail.com"; }
  return u + "@" + d;
}
async function sbRpc(fn, body) {
  const r = await fetch(LC_SUPABASE_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: LC_SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(fn + " " + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
async function claimFirstJuice(order, ref) {
  try { return (await sbRpc("claim_first_juice", { p_phone: String(order.phone || ""), p_email: normEmail(order.email), p_ref: ref })) === true; }
  catch (e) { console.error("claimFirstJuice", e.message); return false; }   // can't verify -> no free juice
}
async function releaseFirstJuice(ref) {
  try { await sbRpc("release_first_juice", { p_ref: ref }); } catch (e) { console.error("releaseFirstJuice", e.message); }
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
  const { sourceId, amount, talkOrderId, talkToken, order } = req.body || {};
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

    // ---------- regular cart checkout ----------
    // Prices, discount, tax and delivery fee are worked out here from the menu (data.js) and the signed delivery
    // quote, never taken from the browser. If the Square order can't be created, nothing is charged.
    if (!order || !Array.isArray(order.lines) || !order.lines.length) { res.status(400).json({ error: "Your cart is empty. Refresh the page and try again." }); return; }
    const menu = await loadMenu();
    const priced = priceLines(menu, order.lines);
    if (priced.error) { res.status(400).json({ error: priced.error }); return; }
    const sOrder = { ...order, lines: priced.lines };
    const fj = checkFirstJuice(sOrder);
    if (fj) { res.status(400).json({ error: fj }); return; }
    sOrder.discount = discountFor(menu, priced.lines);
    sOrder.deliveryFee = 0;
    if (order.fulfillment === "delivery") {
      const fc = quoteFeeCents(order.quote);
      if (fc == null) { res.status(400).json({ error: "Delivery price expired. Get a new price and try again." }); return; }
      sOrder.deliveryFee = fc / 100;
    }
    const tip = Math.max(0, Math.min(1000, Math.round(Number(order.tip || 0) * 100) / 100));
    const subtotal = priced.lines.reduce((t, l) => t + l.price * l.qty, 0);
    const expected = +(subtotal - sOrder.discount + +((subtotal - sOrder.discount) * menu.taxRate).toFixed(2) + tip + sOrder.deliveryFee).toFixed(2);
    if (amount != null && Math.abs(Number(amount) - expected) > 0.05) {
      res.status(409).json({ error: "Prices were updated. Refresh the page to see your new total. Nothing was charged.", code: "TOTAL_CHANGED", expected }); return;
    }
    const ref = "APP-" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase();
    const hasFreeJuice = priced.lines.some((l) => l.promo === "FIRSTJUICE");
    if (hasFreeJuice && !(await claimFirstJuice(order, ref))) {
      res.status(409).json({ error: "The free juice is for a first order only, and this phone number or email already got one. We took it off, nothing was charged. Tap Place order again.", code: "FIRSTJUICE_USED" }); return;
    }
    const sq = await createSquareOrder({ accessToken, locationId, apiHost, order: sOrder, ref });
    if (!sq) { if (hasFreeJuice) await releaseFirstJuice(ref); res.status(502).json({ error: "We couldn't send your order to the kitchen. Nothing was charged. Please try again or call us." }); return; }
    const r2 = await charge({ accessToken, locationId, apiHost, sourceId, orderId: sq.id, tip, amountCents: sq.total_money.amount,
      idempotencyKey: ref + "-" + String(sourceId).slice(-16), note: "La Cabana Grill app order " + ref });
    if (!r2.ok) { if (hasFreeJuice) await releaseFirstJuice(ref); res.status(r2.status).json({ error: r2.data.errors ? r2.data.errors[0].detail : "Payment failed" }); return; }
    const p = r2.data.payment;
    const charged = (p.total_money ? p.total_money.amount : p.amount_money.amount) / 100;
    await saveCustomer(order, ref, charged);
    await sendPurchase({ req, ref, value: charged, order, lines: priced.lines, meta: order.meta });
    res.status(200).json({ success: true, paymentId: p.id, status: p.status, squareOrderId: sq.id, reference: ref, charged });
  } catch (err) {
    res.status(500).json({ error: "Payment processing error: " + err.message });
  }
}
