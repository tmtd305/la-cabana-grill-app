// Shared cart state, persisted in localStorage so it carries across pages.
const CART_KEY = "lacabana_cart";
const ORDERS_KEY = "lacabana_orders";
const FREE_JUICE_PROMO = "FREEJUICE";

// A cart line is { key, id, qty, opts }. opts holds the choices made on the dish screen
// (free drink, meat, add-ons, note); lines with different choices stay separate.
// key is attribute-safe (id + short hash) so it can go straight into onclick handlers.
function lineKey(id, opts) {
  if (!opts) return id;
  const str = JSON.stringify(opts);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return id + "~" + h.toString(36);
}

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return raw.map((c) => ({ key: c.key || c.id, id: c.id, qty: c.qty, opts: c.opts || null }));
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

// addToCart(id) = quick add; addToCart(id, qty, opts) = from the dish screen
function addToCart(id, qty = 1, opts = null) {
  const item = findItem(id);
  if (!item) return;
  const o = opts && Object.keys(opts).length ? opts : null;
  const key = lineKey(id, o);
  const cart = getCart();
  const existing = cart.find((c) => c.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ key, id, qty, opts: o });
  }
  saveCart(cart);
  showToast(`Added ${qty > 1 ? qty + "× " : ""}${item.name} ($${(unitPrice(item, o) * qty).toFixed(2)})`);
}

function removeFromCart(key) {
  saveCart(getCart().filter((c) => c.key !== key));
}

function setQty(key, qty) {
  const cart = getCart();
  const line = cart.find((c) => c.key === key);
  if (!line) return;
  if (qty <= 0) {
    removeFromCart(key);
    return;
  }
  line.qty = qty;
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

// item price + paid add-ons
function unitPrice(item, opts) {
  const addons = (opts && opts.addons) || [];
  return +(item.price + addons.reduce((s, a) => s + a.price * (a.qty || 1), 0)).toFixed(2);
}

// e.g. "Grilled meat · Free drink: Mango Juice · + Lulo Juice · Note: no onions"
function optsSummary(opts) {
  if (!opts) return "";
  const parts = [];
  if (opts.meat) parts.push(opts.meat);
  if (opts.drink && opts.drink !== "No Drink") parts.push("Free drink: " + opts.drink);
  (opts.addons || []).forEach((a) => parts.push("+ " + (a.qty > 1 ? a.qty + "× " : "") + a.name));
  if (opts.note) parts.push("Note: " + opts.note);
  return parts.join(" · ");
}

function cartLines() {
  return getCart()
    .map((c) => {
      const item = findItem(c.id);
      return item ? { ...c, item, unit: unitPrice(item, c.opts) } : null;
    })
    .filter(Boolean);
}

function hasFreeJuicePromo(lines) {
  // members only; dishes already on sale or on a deal don't earn the free juice
  if (typeof FREE_JUICE !== "undefined" && !FREE_JUICE) return false;
  if (typeof MEMBER_PERKS !== "undefined" && MEMBER_PERKS && typeof hasAccount === "function" && !hasAccount()) return false;
  return lines.some((l) => l.item.specialty && !(l.item.was > l.item.price) && !l.item.deal);
}

// Cheapest juice line becomes free when a specialty entree is in the cart.
function computeTotals(lines) {
  const juiceLines = lines.filter((l) => l.item.category === "juice");
  const promoActive = hasFreeJuicePromo(lines) && juiceLines.length > 0;
  let discount = 0;
  let cheapestJuiceId = null;
  if (promoActive) {
    const cheapest = juiceLines.reduce((a, b) => (a.item.price <= b.item.price ? a : b));
    cheapestJuiceId = cheapest.key;
    discount = cheapest.item.price;
  }
  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  const taxes = +((subtotal - discount) * RESTAURANT.taxRate).toFixed(2);
  return { subtotal, discount, taxes, cheapestJuiceId, promoActive };
}

function updateCartBadge() {
  const count = getCart().reduce((n, c) => n + c.qty, 0);
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className =
    "fixed top-24 left-1/2 -translate-x-1/2 bg-surface-elevated text-text-primary px-4 py-2.5 rounded-full shadow-2xl z-[90] flex items-center gap-2 border border-border-subtle transition-all duration-300";
  toast.innerHTML = `<span class="material-symbols-outlined text-primary-container text-[18px]">check_circle</span><span class="font-label-md text-label-md">${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function placeOrder(tipAmount, extra) {
  const lines = cartLines();
  if (lines.length === 0) return null;
  const totals = computeTotals(lines);
  const deliveryFee = extra && extra.delivery ? extra.delivery.fee || 0 : 0;
  const total = +(totals.subtotal - totals.discount + totals.taxes + tipAmount + deliveryFee).toFixed(2);
  const order = {
    id: "LC-" + Math.floor(1000 + Math.random() * 9000),
    placedAt: new Date().toISOString(),
    lines: lines.map((l) => ({ id: l.id, name: l.item.name, qty: l.qty, price: l.unit, options: optsSummary(l.opts), opts: l.opts })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxes: totals.taxes,
    tip: tipAmount,
    total,
    status: "queued",
    fulfillment: extra && extra.delivery ? "delivery" : "pickup",
    delivery: extra && extra.delivery ? extra.delivery : null,
    squareOrderId: extra && extra.squareOrderId ? extra.squareOrderId : null
  };
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  clearCart();
  return order;
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

document.addEventListener("DOMContentLoaded", updateCartBadge);

// Favorites: hearts on dishes, kept on this device
const FAVS_KEY = "lacabana_favs";
function getFavs() { try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; } catch (e) { return []; } }
function isFav(id) { return getFavs().includes(id); }
function toggleFav(id) {
  const f = getFavs(), i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.unshift(id);
  try { localStorage.setItem(FAVS_KEY, JSON.stringify(f)); } catch (e) {}
  document.dispatchEvent(new CustomEvent("lc-favs", { detail: { id, on: i < 0 } }));
  return i < 0;
}


// Store hours (Miami time). Default = Google/Apple Maps listing; the owner edits them in the dashboard (app_settings key "hours").
var LC_DEFAULT_HOURS = { cutoff: 15, days: [["09:00", "21:00"], ["09:00", "22:00"], ["09:00", "22:00"], ["09:00", "22:00"], ["09:00", "22:00"], ["09:00", "22:00"], ["09:00", "22:00"]] };
function lcHoursStatus(h, now) {
  h = h && h.days ? h : LC_DEFAULT_HOURS;
  var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now || new Date()).forEach(function (x) { p[x.type] = x.value; });
  var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), mins = (+p.hour % 24) * 60 + +p.minute;
  var toM = function (t) { var a = String(t || "").split(":"); return +a[0] * 60 + +(a[1] || 0); };
  var fmt = function (t) { var m = toM(t), hh = Math.floor(m / 60) % 24; return ((hh % 12) || 12) + (m % 60 ? ":" + String(m % 60).padStart(2, "0") : "") + (hh < 12 ? " AM" : " PM"); };
  var d = h.days[wd], cutoff = +h.cutoff || 0;
  if (d && d[0] && d[1]) {
    var o = toM(d[0]), c = toM(d[1]); if (c <= o) c += 1440;
    var m2 = mins < o && c > 1440 && mins + 1440 < c ? mins + 1440 : mins;
    if (m2 >= o && m2 < c - cutoff) return { open: true, label: "Open until " + fmt(d[1]), closesSoon: c - cutoff - m2 <= 30 };
  }
  // when do we open next?
  for (var i = 0; i < 8; i++) {
    var k = (wd + i) % 7, dd = h.days[k];
    if (!dd || !dd[0] || !dd[1]) continue;
    if (i === 0 && mins >= toM(dd[0])) continue;
    return { open: false, label: "Closed. Opens " + (i === 0 ? "today" : i === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][k]) + " at " + fmt(dd[0]) };
  }
  return { open: false, label: "Closed" };
}

// ---------- live store data from the staff dashboard ----------
// Sold-out items, "ordering paused", ambassador links (?ref=CODE) and a daily visitor count.
(function () {
  var SB = "https://qzluvwpjtgeccfojutbt.supabase.co", KEY = "sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ";
  var H = { apikey: KEY, "Content-Type": "application/json" };
  try {
    var ref = new URLSearchParams(location.search).get("ref");
    if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref)) localStorage.setItem("lc_ref", ref.toUpperCase());
    var vid = localStorage.getItem("lc_vid");
    if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("lc_vid", vid); }
    var today = new Date().toDateString();
    if (localStorage.getItem("lc_vday") !== today) {
      fetch(SB + "/rest/v1/rpc/log_visit", { method: "POST", headers: H, body: JSON.stringify({ p_vid: vid, p_page: location.pathname.slice(1) || "home", p_ref: localStorage.getItem("lc_ref") }) })
        .then(function (r) { if (r.ok) localStorage.setItem("lc_vday", today); }).catch(function () {});
    }
  } catch (e) {}
  window.LC_SOLD_OUT = new Set();
  try { JSON.parse(localStorage.getItem("lc_soldout") || "[]").forEach(function (id) { LC_SOLD_OUT.add(id); }); } catch (e) {}
  window.LC_PAUSED = false;
  var css = document.createElement("style");
  css.textContent = "[data-dish].lc-so{position:relative;filter:grayscale(1);opacity:.55}[data-dish].lc-so::after{content:'Sold out';position:absolute;top:8px;left:8px;z-index:5;background:#111;color:#fff;font:800 11px Manrope,sans-serif;padding:4px 9px;border-radius:100px;border:1px solid rgba(255,255,255,.3)}" +
    "#lc-paused{position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 86px);z-index:60;background:#1f1f1f;border:1px solid #f36310;color:#fff;border-radius:14px;padding:12px 14px;font:700 14px Manrope,sans-serif;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)}";
  document.head.appendChild(css);
  function mark() {
    document.querySelectorAll("[data-dish]").forEach(function (el) { el.classList.toggle("lc-so", LC_SOLD_OUT.has(el.getAttribute("data-dish"))); });
    document.querySelectorAll("[data-add],[data-order]").forEach(function (el) { var id = el.getAttribute("data-add") || el.getAttribute("data-order"); if (LC_SOLD_OUT.has(id)) { el.setAttribute("aria-disabled", "true"); el.style.opacity = ".4"; } });
    var b = document.getElementById("lc-paused");
    if (LC_PAUSED && !b && document.body) { b = document.createElement("div"); b.id = "lc-paused"; document.body.appendChild(b); }
    if (b) { b.style.display = LC_PAUSED ? "" : "none"; b.textContent = window.LC_PAUSED_MSG || "Online ordering is paused right now. Call us to order."; }
  }
  window.lcMarkSoldOut = mark;
  // block adding sold-out items anywhere in the app
  var _add = window.addToCart;
  if (typeof _add === "function") window.addToCart = addToCart = function (id) {
    if (LC_SOLD_OUT.has(id)) { if (window.showToast) showToast("Sorry, that's sold out right now"); return; }
    return _add.apply(this, arguments);
  };
  Promise.all([
    fetch(SB + "/rest/v1/menu_status?sold_out=eq.true&select=item_id", { headers: H }).then(function (r) { return r.ok ? r.json() : []; }),
    fetch(SB + "/rest/v1/app_settings?key=in.(ordering,hours)&select=key,value", { headers: H }).then(function (r) { return r.ok ? r.json() : []; })
  ]).then(function (res) {
    LC_SOLD_OUT = new Set((res[0] || []).map(function (x) { return x.item_id; }));
    try { localStorage.setItem("lc_soldout", JSON.stringify(Array.from(LC_SOLD_OUT))); } catch (e) {}
    var rows = res[1] || [], get = function (k) { var r = rows.filter(function (x) { return x.key === k; })[0]; return r ? r.value : null; };
    var v = get("ordering") || {}; window.LC_HOURS = get("hours");
    var hs = lcHoursStatus(window.LC_HOURS);
    // manual pause from the dashboard wins; otherwise we're open/closed by the store hours
    LC_PAUSED = !!v.paused || !hs.open;
    window.LC_PAUSED_MSG = v.paused ? (v.message || "Online ordering is paused right now. Call us to order.") : (hs.open ? "" : "We're closed right now. " + hs.label.replace(/^Closed\. /, "") + ". You can browse the menu.");
    mark();
  }).catch(function () {});
  document.addEventListener("DOMContentLoaded", mark);
  new MutationObserver(function () { clearTimeout(window.__lcMk); window.__lcMk = setTimeout(mark, 120); }).observe(document.documentElement, { childList: true, subtree: true });
})();
