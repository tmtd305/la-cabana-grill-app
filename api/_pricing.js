// Server-side prices for cart checkout. The browser only says WHAT was ordered (item id, qty, choices);
// every price comes from data.js (the same menu the app shows), so a changed price in the browser can't
// lower the bill. Files starting with "_" in api/ are helpers, not endpoints.
import fs from "fs";
import path from "path";
import vm from "vm";

const FIRST_JUICE_CODE = "FIRSTJUICE";
let cached = null, cachedAt = 0;

function evalMenu(src) {
  const ctx = vm.createContext({ console });
  return vm.runInContext(src + "\n;({ ALL_ITEMS, JUICES, FREE_JUICE: typeof FREE_JUICE !== 'undefined' ? FREE_JUICE : false, " +
    "MEMBER_PERKS: typeof MEMBER_PERKS !== 'undefined' ? MEMBER_PERKS : false, taxRate: RESTAURANT.taxRate })", ctx, { timeout: 1000 });
}

// data.js from the deployment; if the file isn't bundled with the function, read it from the live site.
export async function loadMenu() {
  if (cached && Date.now() - cachedAt < 5 * 60000) return cached;
  let src = null;
  try { src = fs.readFileSync(path.join(process.cwd(), "data.js"), "utf8"); } catch (e) {}
  if (!src) {
    const r = await fetch((process.env.LC_SITE_URL || "https://www.lacabanagrill.net") + "/data.js");
    if (!r.ok) throw new Error("menu unavailable");
    src = await r.text();
  }
  cached = evalMenu(src); cachedAt = Date.now();
  return cached;
}

const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

// lines from the browser: [{ id, qty, opts }] -> priced lines for the Square order, or { error }
export function priceLines(menu, rawLines) {
  const find = (id) => menu.ALL_ITEMS.find((i) => i.id === id);
  const out = [];
  for (const l of (rawLines || []).slice(0, 60)) {
    const item = l && find(String(l.id || ""));
    if (!item) return { error: "Something in your cart is no longer on the menu. Refresh the page and try again." };
    const opts = l.opts && typeof l.opts === "object" ? l.opts : {};
    const qty = Math.max(1, Math.min(50, l.qty | 0 || 1));
    if (opts.promo === FIRST_JUICE_CODE) {
      if (item.category !== "juice") return { error: "Invalid promo line" };
      out.push({ item, promo: FIRST_JUICE_CODE, qty, price: 0,
        name: FIRST_JUICE_CODE + " – free juice: " + item.name.replace(/\s*Juice\b/i, "").trim(),
        note: "First-meal free juice ($0, code FIRSTJUICE)" });
      continue;
    }
    let unit = item.price;
    const parts = [];
    if (opts.meat) parts.push(clip(opts.meat, 60));
    if (opts.drink && opts.drink !== "No Drink") parts.push("Free drink: " + clip(opts.drink, 60));
    for (const a of (Array.isArray(opts.addons) ? opts.addons : []).slice(0, 20)) {
      const add = a && find(String(a.id || ""));
      if (!add) return { error: "An add-on in your cart is no longer available. Refresh the page and try again." };
      const n = Math.max(1, Math.min(20, a.qty | 0 || 1));
      unit += add.price * n;
      parts.push("+ " + (n > 1 ? n + "× " : "") + add.name);
    }
    if (opts.note) parts.push("Note: " + clip(opts.note, 300));
    out.push({ item, qty, price: +unit.toFixed(2), name: item.name, note: parts.join(" · ") });
  }
  if (!out.length) return { error: "Your cart is empty" };
  return { lines: out };
}

// same free-juice discount rule as computeTotals() in cart.js (off while FREE_JUICE is false)
export function discountFor(menu, lines) {
  if (!menu.FREE_JUICE) return 0;
  const earns = lines.some((l) => l.item.specialty && !(l.item.was > l.item.price) && !l.item.deal);
  const juices = lines.filter((l) => l.item.category === "juice" && !l.promo);
  if (!earns || !juices.length) return 0;
  return Math.min(...juices.map((l) => l.item.price));
}
