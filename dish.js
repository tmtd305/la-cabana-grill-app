// La Cabaña Grill — dish detail screen. openDish(id) slides up a full detail sheet:
// photo, description, price, what it comes with, free drink / meat choice, juice add-ons,
// special instructions, quantity and "Add to order". Used by the menu, home and cart pages.
(function () {
  // What each plate comes with (from lacabanagrill.net)
  var SIDES = {
    "bandeja-paisa": ["Rice", "Beans", "Egg", "Chicharrón", "Chorizo", "Sweet plantains", "Arepita"],
    "churrasco-a-la-parrilla": ["Rice", "Salad", "French fries"],
    "carne-asada": ["Rice", "Beans", "Salad", "French fries"],
    "milanesa-de-carne": ["Rice", "Fresh salad", "French fries"],
    "bistec-acaballo": ["Rice", "Fresh salad", "Sweet plantains"],
    "parrillada-la-cabana": ["Fries", "Beans", "Fresh salad"],
    "pollo-con-champinones": ["Fresh vegetables", "Homemade potatoes"],
    "chicken-waffle": ["Waffle", "Syrup"],
    "pollo-asado-la-cabana": ["Salted potatoes", "Fresh salad", "Rice", "Arepitas"],
    "jalea-mixta": ["Purple onions", "Lime", "Cilantro"],
    "mojarra-frita": ["Fresh salad", "Rice", "Fried plantains"],
    "pescado-en-salsa-de-mariscos": ["Fresh salad", "Steamed rice", "Fried plantains"],
    "camaron-al-ajillo": ["Rice", "Tostones", "Fresh salad"],
    "pescado-a-la-criolla": ["Rice", "Salad", "Tostones"],
    "pescado-a-la-parilla": ["Fresh salad", "Rice", "Fried plantains"],
    "calamari-con-yuca-frita": ["Fried yuca"],
    "salmon": ["Tostón", "Rice", "Salad"],
    "arroz-a-la-marinera": ["Tostones", "Salad"],
    "arroz-con-camarones": ["Salad", "Tostones"],
    "bacon-double-stack-cheese-burger-free-fries-drink": ["French fries", "Drink"]
  };
  var DRINKS = ["No Drink", "Pineapple Juice", "Mango Juice", "Mora Juice", "Lulo Juice", "Guanabana Juice", "Pepsi"];
  var MEAT_CHOICE = { "bandeja-paisa": ["Grilled meat", "Ground meat"] };

  var state = null, pushed = false;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "$" + n.toFixed(2); }
  function juices() { return (typeof JUICES !== "undefined" ? JUICES : []); }

  function injectStyles() {
    if (document.getElementById("dish-css")) return;
    var st = document.createElement("style");
    st.id = "dish-css";
    st.textContent =
      "#dish{position:fixed;inset:0;z-index:80;display:flex;align-items:flex-end;justify-content:center}" +
      "#dish .d-bg{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;transition:opacity .25s}" +
      "#dish .d-panel{position:relative;width:100%;max-width:560px;max-height:94vh;max-height:94dvh;background:#1A1A1A;border-radius:24px 24px 0 0;display:flex;flex-direction:column;overflow:hidden;transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1);box-shadow:0 -10px 40px rgba(0,0,0,.5)}" +
      "#dish.open .d-bg{opacity:1}#dish.open .d-panel{transform:none}" +
      "#dish .d-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;min-height:0}" +
      "#dish .d-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer}" +
      "#dish .d-radio{width:20px;height:20px;border-radius:50%;border:2px solid #6B7280;flex-shrink:0;display:flex;align-items:center;justify-content:center}" +
      "#dish .d-opt.sel .d-radio{border-color:#f36310}#dish .d-opt.sel .d-radio:after{content:'';width:10px;height:10px;border-radius:50%;background:#f36310}" +
      "#dish .d-step{display:flex;align-items:center;gap:10px}" +
      "#dish .d-step button{width:32px;height:32px;border-radius:10px;background:#242424;color:#F9FAFB;display:flex;align-items:center;justify-content:center}" +
      "#dish .d-step button:disabled{opacity:.35}" +
      "#dish textarea{width:100%;background:#242424;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#F9FAFB;padding:12px;font-size:16px;resize:none}" +
      "#dish textarea:focus{outline:none;border-color:#f36310}" +
      "@media (min-width:768px){#dish{align-items:center}#dish .d-panel{border-radius:24px;max-height:88vh}}";
    document.head.appendChild(st);
  }

  function sectionTitle(t, sub) {
    return '<div class="flex items-baseline justify-between pt-5 pb-1"><h4 class="font-title-sm text-title-sm text-text-primary">' + t + "</h4>" +
      (sub ? '<span class="font-label-caps text-label-caps uppercase text-text-muted">' + sub + "</span>" : "") + "</div>";
  }

  function unit() {
    var add = 0;
    Object.keys(state.addons).forEach(function (id) { var j = findItem(id); if (j) add += j.price * state.addons[id]; });
    return state.item.price + add;
  }

  function refreshFooter() {
    var total = unit() * state.qty;
    document.getElementById("d-qty").textContent = state.qty;
    document.getElementById("d-minus").disabled = state.qty <= 1;
    document.getElementById("d-add").innerHTML = '<span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>Add to order · ' + money(total);
  }

  function render() {
    var item = state.item, isJuice = item.category === "juice";
    var sides = SIDES[item.id] || [];
    var html = "";

    html += '<div class="relative w-full h-64 sm:h-72 shrink-0 bg-surface-container-lowest">' +
      '<img src="' + esc(item.img) + '" alt="' + esc(item.name) + '" class="w-full h-full object-cover"/>' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-black/40"></div>' +
      '<button type="button" data-d="close" aria-label="Close" class="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center"><span class="material-symbols-outlined text-[22px]">close</span></button>' +
      (item.badge ? '<span class="absolute top-4 right-3 bg-primary-container text-white font-label-caps text-label-caps uppercase px-2.5 py-1 rounded-full font-bold">' + esc(item.badge) + "</span>" : "") +
      "</div>";

    html += '<div class="px-5 pb-6 -mt-6 relative">' +
      '<div class="flex items-start justify-between gap-3"><h3 class="font-headline-xl text-headline-xl text-text-primary">' + esc(item.name) + "</h3>" +
      '<span class="font-headline-lg text-headline-lg text-primary font-bold shrink-0 pt-1">' + money(item.price) + "</span></div>" +
      (item.rating ? '<div class="flex items-center gap-1 mt-1 text-secondary font-label-md text-label-md"><span class="material-symbols-outlined text-[16px] text-colombian-yellow" style="font-variation-settings:\'FILL\' 1">star</span>' + esc(item.rating) + "</div>" : "") +
      '<p class="font-body-md text-body-md text-text-secondary mt-2">' + esc(item.desc) + "</p>";

    if (sides.length) {
      html += sectionTitle("Comes with", "Included") +
        '<div class="flex flex-wrap gap-2 pt-1">' + sides.map(function (s) {
          return '<span class="px-3 py-1.5 rounded-full bg-surface-raised text-text-primary font-label-md text-label-md flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-emerald-400">check</span>' + esc(s) + "</span>";
        }).join("") + "</div>";
    }

    var meats = MEAT_CHOICE[item.id];
    if (meats) {
      html += sectionTitle("Choose your meat", "Required") + meats.map(function (m) {
        return '<div class="d-opt' + (state.meat === m ? " sel" : "") + '" data-d="meat" data-v="' + esc(m) + '"><span class="font-body-md text-body-md text-text-primary">' + esc(m) + '</span><span class="d-radio"></span></div>';
      }).join("");
    }

    if (!isJuice) {
      html += sectionTitle("Add your free drink", "Free") + DRINKS.map(function (d) {
        return '<div class="d-opt' + (state.drink === d ? " sel" : "") + '" data-d="drink" data-v="' + esc(d) + '"><span class="font-body-md text-body-md text-text-primary">' + esc(d) + '</span><span class="flex items-center gap-3"><span class="font-label-md text-label-md text-text-muted">' + (d === "No Drink" ? "" : "Free") + '</span><span class="d-radio"></span></span></div>';
      }).join("");
    }

    var extras = juices().filter(function (j) { return j.id !== item.id; });
    if (extras.length) {
      html += sectionTitle(isJuice ? "Add another juice" : "Add-ons", "Optional") + extras.map(function (j) {
        var n = state.addons[j.id] || 0;
        return '<div class="d-opt" style="cursor:default"><div class="flex items-center gap-3 min-w-0"><img src="' + esc(j.img) + '" alt="" class="w-10 h-10 rounded-lg object-cover shrink-0"/><div class="min-w-0"><div class="font-body-md text-body-md text-text-primary truncate">' + esc(j.name) + '</div><div class="font-label-md text-label-md text-text-muted">+' + money(j.price) + "</div></div></div>" +
          '<div class="d-step"><button type="button" data-d="addon-" data-v="' + j.id + '" aria-label="Remove one"' + (n ? "" : " disabled") + '><span class="material-symbols-outlined text-[18px]">remove</span></button><span class="font-label-lg text-label-lg text-text-primary w-4 text-center">' + n + '</span><button type="button" data-d="addon+" data-v="' + j.id + '" aria-label="Add one"><span class="material-symbols-outlined text-[18px]">add</span></button></div></div>';
      }).join("");
    }

    html += sectionTitle("Special instructions", "Optional") +
      '<textarea id="d-note" rows="2" maxlength="200" placeholder="Allergies, no onions, extra sauce…">' + esc(state.note) + "</textarea>";
    html += "</div>";

    var scroll = document.querySelector("#dish .d-scroll"), top = scroll.scrollTop;
    scroll.innerHTML = html;
    scroll.scrollTop = top;
    document.getElementById("d-note").addEventListener("input", function (e) { state.note = e.target.value; });
    refreshFooter();
  }

  function build() {
    injectStyles();
    var el = document.getElementById("dish");
    if (el) return el;
    el = document.createElement("div");
    el.id = "dish";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.style.display = "none";
    el.innerHTML = '<div class="d-bg" data-d="close"></div><div class="d-panel"><div class="d-scroll"></div>' +
      '<div class="shrink-0 px-5 pt-3 bg-[#1A1A1A] border-t border-white/5 flex items-center gap-3" style="padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))">' +
      '<div class="d-step"><button type="button" id="d-minus" data-d="qty-" aria-label="Less"><span class="material-symbols-outlined text-[18px]">remove</span></button><span id="d-qty" class="font-headline-md text-headline-md text-text-primary w-5 text-center">1</span><button type="button" data-d="qty+" aria-label="More"><span class="material-symbols-outlined text-[18px]">add</span></button></div>' +
      '<button type="button" id="d-add" data-d="add" class="flex-1 h-12 rounded-xl bg-primary-container hover:bg-secondary-container text-white font-label-lg text-label-lg flex items-center justify-center gap-2 transition-colors active:scale-[.98]"></button>' +
      "</div></div>";
    document.body.appendChild(el);

    el.addEventListener("click", function (e) {
      var t = e.target.closest("[data-d]");
      if (!t) return;
      var a = t.getAttribute("data-d"), v = t.getAttribute("data-v");
      if (a === "close") return closeDish();
      if (a === "meat") { state.meat = v; render(); }
      else if (a === "drink") { state.drink = v; render(); }
      else if (a === "addon+") { state.addons[v] = Math.min(20, (state.addons[v] || 0) + 1); render(); }
      else if (a === "addon-") { state.addons[v] = Math.max(0, (state.addons[v] || 0) - 1); if (!state.addons[v]) delete state.addons[v]; render(); }
      else if (a === "qty+") { state.qty = Math.min(50, state.qty + 1); refreshFooter(); }
      else if (a === "qty-") { state.qty = Math.max(1, state.qty - 1); refreshFooter(); }
      else if (a === "add") addNow();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state) closeDish(); });
    window.addEventListener("popstate", function () { if (state) { pushed = false; closeDish(); } });
    return el;
  }

  function addNow() {
    var opts = {};
    if (state.meat) opts.meat = state.meat;
    if (state.drink && state.drink !== "No Drink") opts.drink = state.drink;
    var addons = Object.keys(state.addons).map(function (id) { var j = findItem(id); return { id: id, name: j.name, price: j.price, qty: state.addons[id] }; });
    if (addons.length) opts.addons = addons;
    var note = state.note.trim().slice(0, 200);
    if (note) opts.note = note;
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
    addToCart(state.item.id, state.qty, opts);
    closeDish();
  }

  window.openDish = function (id) {
    var item = findItem(id);
    if (!item) return;
    var el = build();
    var meats = MEAT_CHOICE[id];
    state = { item: item, qty: 1, meat: meats ? meats[0] : null, drink: "No Drink", addons: {}, note: "" };
    render();
    el.querySelector(".d-scroll").scrollTop = 0;
    el.style.display = "flex";
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("open"); }); });
    if (!pushed) { try { history.pushState({ dish: id }, ""); pushed = true; } catch (e) {} }
  };

  window.closeDish = function () {
    var el = document.getElementById("dish");
    if (!el || !state) return;
    state = null;
    el.classList.remove("open");
    document.documentElement.style.overflow = "";
    setTimeout(function () { if (!state) el.style.display = "none"; }, 280);
    if (pushed) { pushed = false; try { history.back(); } catch (e) {} }
  };

  // Tap anywhere on a card with data-dish opens the detail screen; buttons inside keep their own action.
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-dish]");
    if (!card || e.target.closest("button, a, input, textarea, select")) return;
    openDish(card.getAttribute("data-dish"));
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-dish]")) { e.preventDefault(); openDish(e.target.getAttribute("data-dish")); }
  });
})();
