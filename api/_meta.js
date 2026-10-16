// Meta Conversions API: sends each paid website order to Meta as a Purchase, from the server.
// The browser Pixel sends the same Purchase with the same event id (the order reference, e.g. APP-M2X...),
// so Meta counts the order once even when both arrive. Needs META_CAPI_TOKEN in Vercel env vars
// (Events Manager > dataset > Settings > Conversions API > Generate access token). Without it this does nothing.
// Never blocks or fails the sale.
import crypto from "crypto";

export const META_PIXEL_ID = process.env.META_PIXEL_ID || "946047957310923";
const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");

export async function sendPurchase({ req, ref, value, order, lines, meta }) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;
  try {
    const m = meta && typeof meta === "object" ? meta : {};
    const user = {
      client_ip_address: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || undefined,
      client_user_agent: req.headers["user-agent"] || undefined,
      fbp: /^fb\.\d\.\d+\.\d+$/.test(m.fbp || "") ? m.fbp : undefined,
      fbc: /^fb\.\d\.\d+\./.test(m.fbc || "") ? String(m.fbc).slice(0, 300) : undefined
    };
    const email = String(order.email || "").trim().toLowerCase();
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) user.em = [sha(email)];
    let ph = String(order.phone || "").replace(/\D/g, "");
    if (ph.length === 10) ph = "1" + ph;
    if (ph.length === 11) user.ph = [sha(ph)];
    const first = String(order.name || "").trim().split(/\s+/)[0].toLowerCase();
    if (first) user.fn = [sha(first)];
    if (order.address && order.address.zip) user.zp = [sha(String(order.address.zip).slice(0, 5))];
    user.country = [sha("us")];
    const event = {
      event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: ref, action_source: "website",
      event_source_url: /^https:\/\/(www\.)?lacabanagrill\.net\//.test(m.url || "") ? String(m.url).slice(0, 500) : "https://www.lacabanagrill.net/cart.html",
      user_data: user,
      custom_data: { currency: "USD", value, order_id: ref, content_type: "product", num_items: lines.reduce((n, l) => n + l.qty, 0),
        contents: lines.map((l) => ({ id: l.item.id, quantity: l.qty, item_price: l.price })), delivery_category: order.fulfillment === "delivery" ? "home_delivery" : "in_store" }
    };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch("https://graph.facebook.com/v21.0/" + META_PIXEL_ID + "/events?access_token=" + encodeURIComponent(token), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: [event] }), signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) console.error("Meta CAPI", r.status, (await r.text()).slice(0, 300));
  } catch (e) { console.error("Meta CAPI", e.message); }
}
