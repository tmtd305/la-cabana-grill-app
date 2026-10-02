// Shared app chrome for every customer page: burger menu (profile, favorites, orders, messages, notifications,
// reviews, policies), working search / bell / profile buttons in the header, and a Cart tab with a count in the bottom bar.
(function () {
  var REVIEW_URL = "https://search.google.com/local/writereview?placeid=" + (window.LC_GOOGLE_PLACE_ID || "");
  var MAPS_URL = "https://maps.google.com/?q=La+Caba%C3%B1a+Grill+6780+Collins+Ave+Miami+Beach+FL";
  var PHONE = (typeof RESTAURANT !== "undefined" && RESTAURANT.phone) || "+17862547968";
  var PREF_KEY = "lacabana_notify";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var acct = function () { try { return typeof getAccount === "function" ? getAccount() : JSON.parse(localStorage.getItem("lacabana_account")); } catch (e) { return null; } };
  var notifyOn = function () { try { return localStorage.getItem(PREF_KEY) === "on"; } catch (e) { return false; } };

  var css = document.createElement("style");
  css.textContent =
    ".lc-burger{width:44px;height:44px;margin-left:-6px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#F9FAFB;flex-shrink:0}" +
    ".lc-drawer{position:fixed;inset:0;z-index:200;pointer-events:none}.lc-drawer.open{pointer-events:auto}" +
    ".lc-drawer .bg{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;transition:opacity .25s}.lc-drawer.open .bg{opacity:1}" +
    ".lc-drawer .pn{position:absolute;top:0;bottom:0;left:0;width:84%;max-width:340px;background:#161616;transform:translateX(-102%);transition:transform .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 18px) 0 calc(env(safe-area-inset-bottom,0px) + 16px);overflow-y:auto;box-shadow:12px 0 40px rgba(0,0,0,.5)}" +
    ".lc-drawer.open .pn{transform:none}" +
    ".lc-dh{display:flex;align-items:center;gap:12px;padding:0 20px 18px;border-bottom:1px solid rgba(255,255,255,.06);text-decoration:none}" +
    ".lc-dh .av{width:52px;height:52px;border-radius:50%;background:#f36310;color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px Outfit,sans-serif;overflow:hidden;flex-shrink:0}.lc-dh .av img{width:100%;height:100%;object-fit:cover}" +
    ".lc-dh b{display:block;font:800 18px Outfit,sans-serif;color:#fff}.lc-dh small{display:block;font:600 12.5px Manrope,sans-serif;color:#f36310}" +
    ".lc-dl{padding:8px 10px}.lc-dl a,.lc-dl button{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:14px;padding:13px 12px;border-radius:14px;color:#F9FAFB;font:600 15px Manrope,sans-serif;cursor:pointer}" +
    ".lc-dl a:active,.lc-dl button:active{background:rgba(255,255,255,.06)}.lc-dl .material-symbols-outlined{font-size:22px;color:#9CA3AF}" +
    ".lc-dl .sep{height:1px;background:rgba(255,255,255,.06);margin:6px 12px}.lc-dl .tg{margin-left:auto;width:42px;height:24px;border-radius:99px;background:#3a3a3a;position:relative;transition:background .2s;flex-shrink:0}" +
    ".lc-dl .tg::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}.lc-dl .tg.on{background:#4cc417}.lc-dl .tg.on::after{transform:translateX(18px)}" +
    ".lc-dl .sub{display:block;font:500 12px Manrope,sans-serif;color:#9CA3AF;margin-top:1px}" +
    ".lc-dfoot{margin-top:auto;padding:14px 22px 0;font:500 12px/1.5 Manrope,sans-serif;color:#6B7280}" +
    ".lc-srch{position:fixed;inset:0;z-index:210;background:#131313;display:none;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 16px}.lc-srch.open{display:flex}" +
    ".lc-srch .bar{display:flex;align-items:center;gap:8px}.lc-srch input{flex:1;height:48px;border-radius:14px;background:#1f1f1f;border:1px solid rgba(255,255,255,.08);color:#fff;padding:0 16px;font:600 16px Manrope,sans-serif;outline:none}" +
    ".lc-srch .x{all:unset;cursor:pointer;color:#f36310;font:700 15px Manrope,sans-serif;padding:8px}" +
    ".lc-srch .rs{overflow-y:auto;margin-top:12px}.lc-srch .r{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer}" +
    ".lc-srch .r img,.lc-srch .r .ph{width:52px;height:52px;border-radius:12px;object-fit:cover;background:#242424;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#f36310}" +
    ".lc-srch .r b{display:block;font:700 15px Outfit,sans-serif;color:#fff}.lc-srch .r span{font:700 13px Manrope,sans-serif;color:#ffb596}.lc-srch .none{color:#9CA3AF;font:500 14px Manrope,sans-serif;padding:20px 4px}" +
    ".lc-navbadge{position:absolute;top:2px;right:10px;min-width:17px;height:17px;padding:0 4px;border-radius:99px;background:#f36310;color:#fff;font:800 10.5px/17px Manrope,sans-serif;text-align:center}" +
    ".lc-utoast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:220;padding:11px 16px;border-radius:14px;background:#242424;color:#fff;font:600 13px Manrope,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:all .25s;max-width:90vw;text-align:center}.lc-utoast.on{opacity:1;transform:translate(-50%,0)}";
  document.head.appendChild(css);

  function toast(t) {
    var el = document.querySelector(".lc-utoast");
    if (!el) { el = document.createElement("div"); el.className = "lc-utoast"; document.body.appendChild(el); }
    el.textContent = t; el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("on"); }, 2600);
  }
  window.lcToast = toast;

  // ---------- burger menu ----------
  var drawer;
  function drawerHTML() {
    var a = acct(), name = a && a.name ? a.name : "";
    var av = a && a.photo ? '<img src="' + esc(a.photo) + '" alt=""/>' : (name ? esc(name.charAt(0).toUpperCase()) : '<span class="material-symbols-outlined">person</span>');
    var reviewHref = window.LC_GOOGLE_PLACE_ID ? REVIEW_URL : MAPS_URL;
    return '<div class="bg" data-close></div><div class="pn">' +
      '<a class="lc-dh" href="account.html"><span class="av">' + av + '</span><span><b>' + (name ? "Hi, " + esc(name.split(" ")[0]) : "Welcome") + '</b><small>' + (a ? "View your profile" : "Sign in or create account") + "</small></span></a>" +
      '<div class="lc-dl">' +
      '<a href="account.html"><span class="material-symbols-outlined">person</span>Your profile</a>' +
      '<a href="home.html#favorites"><span class="material-symbols-outlined">favorite</span>Favorites</a>' +
      '<a href="orders.html"><span class="material-symbols-outlined">receipt_long</span>Your orders</a>' +
      '<a href="messages.html"><span class="material-symbols-outlined">chat</span>Messages</a>' +
      '<button type="button" data-notify><span class="material-symbols-outlined">notifications</span><span>Deals and order updates<span class="sub">Get notified about specials</span></span><span class="tg' + (notifyOn() ? " on" : "") + '"></span></button>' +
      '<div class="sep"></div>' +
      '<a href="' + reviewHref + '" target="_blank" rel="noopener"><span class="material-symbols-outlined">star</span>Review us on Google</a>' +
      '<a href="tel:' + PHONE + '"><span class="material-symbols-outlined">call</span>Call the restaurant</a>' +
      '<a href="' + MAPS_URL + '" target="_blank" rel="noopener"><span class="material-symbols-outlined">directions</span>Directions</a>' +
      '<a href="policies.html"><span class="material-symbols-outlined">gavel</span>Policies</a>' +
      (a ? '<button type="button" data-signout><span class="material-symbols-outlined">logout</span>Sign out</button>' : "") +
      '</div><div class="lc-dfoot">La Cabaña Grill<br/>6780 Collins Ave, Miami Beach, FL</div></div>';
  }
  function openDrawer() {
    if (!drawer) {
      drawer = document.createElement("div"); drawer.className = "lc-drawer"; document.body.appendChild(drawer);
      drawer.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) return closeDrawer();
        if (e.target.closest("[data-notify]")) return toggleNotify(e.target.closest("[data-notify]").querySelector(".tg"));
        if (e.target.closest("[data-signout]")) { try { localStorage.removeItem("lacabana_account"); } catch (x) {} closeDrawer(); toast("Signed out"); setTimeout(function () { location.reload(); }, 600); }
      });
    }
    drawer.innerHTML = drawerHTML();
    drawer.style.display = "block";
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("open"); }); });
  }
  function closeDrawer() { if (drawer) drawer.classList.remove("open"); }
  window.lcOpenMenu = openDrawer;

  async function turnOnNotify(tg) {
    var ok = true;
    if ("Notification" in window && Notification.permission !== "granted") {
      try { ok = (await Notification.requestPermission()) === "granted"; } catch (x) { ok = false; }
    }
    try { localStorage.setItem(PREF_KEY, "on"); } catch (x) {}
    if (tg) tg.classList.add("on");
    toast(ok ? "You're in. We'll let you know about deals and your orders." : "Turned on. Allow notifications in your phone settings to get alerts.");
  }
  function toggleNotify(tg) {
    if (notifyOn()) { try { localStorage.setItem(PREF_KEY, "off"); } catch (x) {} if (tg) tg.classList.remove("on"); toast("Notifications off"); return; }
    turnOnNotify(tg);
  }
  // every "Enable notifications" button in the app uses this (the old push service only worked on the old website)
  window.requestNotifications = function () { turnOnNotify(); };

  // ---------- search ----------
  var srch;
  function items() {
    var all = typeof ALL_ITEMS !== "undefined" ? ALL_ITEMS : [];
    return all.filter(function (i) { return i.category !== "test"; });
  }
  function openSearch() {
    if (!srch) {
      srch = document.createElement("div"); srch.className = "lc-srch";
      srch.innerHTML = '<div class="bar"><input type="search" placeholder="Search dishes, juices, sides" autocomplete="off"/><button class="x" type="button">Cancel</button></div><div class="rs"></div>';
      document.body.appendChild(srch);
      var input = srch.querySelector("input"), rs = srch.querySelector(".rs");
      var draw = function () {
        var q = input.value.trim().toLowerCase();
        var list = items().filter(function (i) { return !q || (i.name + " " + (i.desc || "")).toLowerCase().indexOf(q) >= 0; }).slice(0, 40);
        rs.innerHTML = list.length ? list.map(function (i) {
          return '<div class="r" data-id="' + i.id + '">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy"/>' : '<span class="ph material-symbols-outlined">restaurant</span>') +
            '<div><b>' + esc(i.name) + '</b><span>$' + Number(i.price).toFixed(2) + "</span></div></div>";
        }).join("") : '<div class="none">Nothing found. Try "steak", "mango" or "empanadas".</div>';
      };
      input.addEventListener("input", draw);
      srch.querySelector(".x").onclick = function () { srch.classList.remove("open"); };
      rs.addEventListener("click", function (e) {
        var r = e.target.closest(".r"); if (!r) return;
        srch.classList.remove("open");
        if (typeof window.openDish === "function") window.openDish(r.dataset.id);
        else location.href = "home.html#dish=" + encodeURIComponent(r.dataset.id);
      });
      srch._draw = draw;
    }
    srch.classList.add("open"); srch.querySelector("input").value = ""; srch._draw();
    setTimeout(function () { srch.querySelector("input").focus(); }, 50);
  }
  window.lcOpenSearch = openSearch;

  // ---------- wire the header + bottom bar ----------
  function cartCount() { try { return (typeof getCart === "function" ? getCart() : JSON.parse(localStorage.getItem("lacabana_cart")) || []).reduce(function (n, l) { return n + (l.qty || 1); }, 0); } catch (e) { return 0; } }
  function paintBadge() {
    var b = document.querySelector(".lc-navbadge"); if (!b) return;
    var n = cartCount(); b.textContent = n; b.style.display = n ? "" : "none";
  }
  function wire() {
    var header = document.querySelector("header");
    var onCart = /cart(\.html)?$/.test(location.pathname);
    if (header && !onCart && !header.querySelector(".lc-burger")) {
      var left = header.querySelector("div > div") || header.firstElementChild;
      var bb = document.createElement("button");
      bb.type = "button"; bb.className = "lc-burger"; bb.setAttribute("aria-label", "Menu");
      bb.innerHTML = '<span class="material-symbols-outlined" style="font-size:26px">menu</span>';
      bb.onclick = openDrawer;
      left.insertBefore(bb, left.firstChild);
      // the small stock photo next to the title isn't our logo: hide it
      var img = left.querySelector("img"); if (img && /googleusercontent/.test(img.src)) img.style.display = "none";
    }
    document.querySelectorAll('header img').forEach(function (img) { if (/googleusercontent/.test(img.src)) img.style.display = "none"; });
    document.querySelectorAll('button[aria-label="Search menu"]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); openSearch(); }; });
    document.querySelectorAll('button[aria-label="Enable deal notifications"]').forEach(function (b) { b.removeAttribute("onclick"); b.onclick = function (e) { e.preventDefault(); openDrawer(); }; });
    document.querySelectorAll('header [onclick="goToAccount()"], header .material-symbols-outlined').forEach(function (el) {
      var t = el.closest('[onclick="goToAccount()"]') || (el.textContent.trim() === "person" ? el.parentElement : null);
      if (t && !t.closest("a")) { t.style.cursor = "pointer"; t.onclick = function () { location.href = "account.html"; }; }
    });
    // header location line opens directions; leftover buttons on the orders screen get real actions
    document.querySelectorAll("header button").forEach(function (b) { if (/Miami Beach/.test(b.textContent)) b.onclick = function () { window.open(MAPS_URL, "_blank"); }; });
    document.querySelectorAll("main button").forEach(function (b) {
      var t = b.textContent.trim();
      if (!b.onclick && !b.getAttribute("onclick")) {
        if (t === "Navigate" || t === "navigationNavigate") b.onclick = function () { window.open(MAPS_URL, "_blank"); };
        else if (/Receipt$/.test(t)) b.onclick = function () { var d = document.getElementById("order-items-list"); if (d) d.scrollIntoView({ behavior: "smooth", block: "center" }); };
      }
    });
    // bottom bar: Favorites -> Cart (favorites live in the menu now)
    document.querySelectorAll('nav a[data-path="favorites"], nav a[href="home.html#favorites"]').forEach(function (a) {
      a.setAttribute("href", "cart.html"); a.removeAttribute("onclick"); a.dataset.path = "cart"; a.style.position = "relative";
      var ic = a.querySelector(".material-symbols-outlined"); if (ic) ic.textContent = "shopping_bag";
      var lb = a.querySelectorAll("span"); if (lb.length > 1) lb[lb.length - 1].textContent = "Cart";
      if (!a.querySelector(".lc-navbadge")) { var bd = document.createElement("span"); bd.className = "lc-navbadge"; a.appendChild(bd); }
      if (onCart) { a.classList.add("text-primary-container"); }
    });
    paintBadge();
    try { var orig = window.saveCart; if (typeof orig === "function" && !orig._lc) { window.saveCart = function (c) { orig(c); paintBadge(); }; window.saveCart._lc = true; } } catch (e) {}
    window.addEventListener("storage", paintBadge);
    setInterval(paintBadge, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
