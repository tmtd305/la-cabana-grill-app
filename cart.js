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
  return lines.some((l) => l.item.specialty);
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

function placeOrder(tipAmount) {
  const lines = cartLines();
  if (lines.length === 0) return null;
  const totals = computeTotals(lines);
  const total = +(totals.subtotal - totals.discount + totals.taxes + tipAmount).toFixed(2);
  const order = {
    id: "LC-" + Math.floor(1000 + Math.random() * 9000),
    placedAt: new Date().toISOString(),
    lines: lines.map((l) => ({ id: l.id, name: l.item.name, qty: l.qty, price: l.unit, options: optsSummary(l.opts), opts: l.opts })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxes: totals.taxes,
    tip: tipAmount,
    total,
    status: "queued"
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
