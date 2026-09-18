// Shared cart state, persisted in localStorage so it carries across pages.
const CART_KEY = "lacabana_cart";
const ORDERS_KEY = "lacabana_orders";
const FREE_JUICE_PROMO = "FREEJUICE";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty = 1) {
  const item = findItem(id);
  if (!item) return;
  const cart = getCart();
  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart(cart);
  showToast(`Added ${item.name} ($${item.price.toFixed(2)})`);
}

function removeFromCart(id) {
  saveCart(getCart().filter((c) => c.id !== id));
}

function setQty(id, qty) {
  const cart = getCart();
  const line = cart.find((c) => c.id === id);
  if (!line) return;
  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  line.qty = qty;
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartLines() {
  return getCart()
    .map((c) => ({ ...c, item: findItem(c.id) }))
    .filter((l) => l.item);
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
    cheapestJuiceId = cheapest.id;
    discount = cheapest.item.price;
  }
  const subtotal = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
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
    "fixed top-24 left-1/2 -translate-x-1/2 bg-surface-elevated text-text-primary px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-border-subtle transition-all duration-300";
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
    lines: lines.map((l) => ({ id: l.id, name: l.item.name, qty: l.qty, price: l.item.price })),
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
