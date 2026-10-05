// Staff dashboard feed: recent WEBSITE orders from Square (made by the app checkout, source "La Cabana App"),
// with the customer's name, phone and email from the order and the card payment.
// Only signed-in staff (is_operator) can read it.
const LC_SUPABASE_URL = process.env.LC_SUPABASE_URL || "https://qzluvwpjtgeccfojutbt.supabase.co";
const SB_PUBLIC_KEY = "sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ";

async function isStaff(token) {
  if (!token) return false;
  const r = await fetch(LC_SUPABASE_URL + "/rest/v1/rpc/is_operator", {
    method: "POST", headers: { apikey: SB_PUBLIC_KEY, Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: "{}"
  });
  return r.ok && (await r.json()) === true;
}

async function hasPerm(token, p) {
  const r = await fetch(LC_SUPABASE_URL + "/rest/v1/rpc/has_perm", {
    method: "POST", headers: { apikey: SB_PUBLIC_KEY, Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ p })
  });
  return r.ok && (await r.json()) === true;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!(await isStaff(token))) { res.status(401).json({ error: "Staff only" }); return; }
  const accessToken = process.env.SQUARE_ACCESS_TOKEN, locationId = process.env.SQUARE_LOCATION_ID;
  const apiHost = process.env.SQUARE_ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  if (!accessToken || !locationId) { res.status(500).json({ error: "Square isn't set up" }); return; }
  const H = { "Square-Version": "2024-01-18", Authorization: "Bearer " + accessToken, "Content-Type": "application/json" };
  let days = Math.max(1, Math.min(30, parseInt(req.query.days, 10) || 2));
  if (days > 2 && !(await hasPerm(token, "sales"))) days = 2;   // past sales only for managers
  const since = new Date(Date.now() - days * 864e5).toISOString();
  try {
    // page through Square (up to 1,000 orders / payments for the period)
    const allOrders = [], allPays = [];
    const pageOrders = async () => { let cursor; for (let i = 0; i < 10; i++) {
      const r = await fetch(apiHost + "/v2/orders/search", { method: "POST", headers: H, body: JSON.stringify({ location_ids: [locationId], limit: 100, cursor,
        query: { filter: { date_time_filter: { created_at: { start_at: since } } }, sort: { sort_field: "CREATED_AT", sort_order: "DESC" } } }) }).then((r) => r.json());
      allOrders.push(...(r.orders || [])); cursor = r.cursor; if (!cursor) break; } };
    const pagePays = async () => { let cursor; for (let i = 0; i < 10; i++) {
      const r = await fetch(apiHost + "/v2/payments?location_id=" + encodeURIComponent(locationId) + "&begin_time=" + encodeURIComponent(since) + "&sort_order=DESC&limit=100" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""), { headers: H }).then((r) => r.json());
      allPays.push(...(r.payments || [])); cursor = r.cursor; if (!cursor) break; } };
    await Promise.all([pageOrders(), pagePays()]);
    const or = { orders: allOrders }, pr = { payments: allPays };
    const pays = {};
    (pr.payments || []).forEach((p) => { pays[p.id] = p; if (p.order_id) pays["o:" + p.order_id] = p; });
    const cust = {};
    const ids = [...new Set((pr.payments || []).map((p) => p.customer_id).filter(Boolean))].slice(0, 100);  // Square limit per call
    if (ids.length) {
      const cr = await fetch(apiHost + "/v2/customers/bulk-retrieve", { method: "POST", headers: H, body: JSON.stringify({ customer_ids: ids }) }).then((r) => r.json()).catch(() => ({}));
      Object.values(cr.responses || {}).forEach((x) => { if (x.customer) cust[x.customer.id] = x.customer; });
    }
    const web = (o) => (o.source && o.source.name === "La Cabana App") || /^APP-/.test(o.reference_id || "");
    // which channel the money came from
    const channel = (o) => {
      if (web(o)) return "Website";
      if (/^PHONE-/.test(o.reference_id || "")) return "Phone order";
      if ((o.line_items || []).some((l) => /^Phone order/.test(l.name || ""))) return "Phone (Uber delivery)";
      const n = ((o.source && o.source.name) || "").toLowerCase();
      if (/uber/.test(n)) return "Uber Eats";
      if (/door ?dash/.test(n)) return "DoorDash";
      if (/grub ?hub/.test(n)) return "Grubhub";
      if (/postmates/.test(n)) return "Postmates";
      if (/square online|online/.test(n)) return "Square Online";
      if (!n || /point of sale|square|register|terminal|virtual/.test(n)) return "In store (Square)";
      return o.source.name;
    };
    const scopeAll = req.query.scope === "all";
    const out = (or.orders || []).filter((o) => o.state !== "DRAFT" && (scopeAll || web(o) || /^PHONE-/.test(o.reference_id || "")) && (!scopeAll || o.state !== "CANCELED")).map((o) => {
      const p = pays["o:" + o.id] || {};
      const f = (o.fulfillments || [])[0] || {};
      const rec = (f.pickup_details && f.pickup_details.recipient) || (f.delivery_details && f.delivery_details.recipient) || {};
      const c = cust[p.customer_id] || {};
      const card = (p.card_details && p.card_details.card) || {};
      const addr = rec.address ? [rec.address.address_line_1, rec.address.address_line_2, rec.address.postal_code].filter(Boolean).join(", ") : "";
      return {
        id: o.id, ref: o.reference_id || "", created: o.created_at, state: o.state,
        source: (o.source && o.source.name) || "Square", channel: channel(o),
        type: f.type || "", fstate: f.state || "", address: addr,
        note: (f.pickup_details && f.pickup_details.note) || (f.delivery_details && f.delivery_details.note) || "",
        name: rec.display_name && rec.display_name !== "App customer" ? rec.display_name : ([c.given_name, c.family_name].filter(Boolean).join(" ") || card.cardholder_name || ""),
        phone: rec.phone_number || c.phone_number || "",
        email: rec.email_address || p.buyer_email_address || c.email_address || "",
        card: card.card_brand ? card.card_brand + " •" + (card.last_4 || "") : "",
        cardName: card.cardholder_name || "",
        paid: p.status === "COMPLETED" || p.status === "APPROVED" || (o.tenders || []).length > 0,
        total: ((o.total_money && o.total_money.amount) || 0) / 100,
        tip: ((o.total_tip_money && o.total_tip_money.amount) || 0) / 100,
        items: (o.line_items || []).map((l) => ({ qty: +l.quantity || 1, name: l.name || "Item", note: l.note || "", mods: (l.modifiers || []).map((m) => m.name).join(", ") }))
      };
    });
    res.status(200).json({ orders: out });
  } catch (e) {
    res.status(500).json({ error: "Couldn't load orders: " + e.message });
  }
}
