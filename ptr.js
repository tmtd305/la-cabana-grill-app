// Pull down to refresh on every page: hold your thumb at the top, drag down, let go past the line.
// Also picks up the newest version of the app. Not inside sheets or dialogs (they have their own swipes).
(function () {
  if (/operator(\.html)?$/.test(location.pathname)) return;
  var ind = null, spin = null, startY = null, startX = 0, pull = 0, active = false, armed = false, busy = false, scroller = null;
  var TRIGGER = 62, MAX = 96;
  function make() {
    if (ind) return;
    var st = document.createElement('style'); st.textContent = '@keyframes lcPtrSpin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
    ind = document.createElement('div');
    ind.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 8px);width:38px;height:38px;margin-left:-19px;border-radius:50%;background:#1c1b1b;box-shadow:0 6px 18px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2147483000;pointer-events:none;opacity:0;transform:translateY(-70px);';
    ind.innerHTML = '<div style="width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(243,99,16,.25);border-top-color:#f36310;box-sizing:border-box;"></div>';
    document.body.appendChild(ind); spin = ind.firstChild;
  }
  function show(h, anim) {
    make();
    ind.style.transition = anim ? 'transform .3s cubic-bezier(.2,.8,.2,1),opacity .25s ease' : 'none';
    ind.style.transform = 'translateY(' + (h - 70) + 'px)';
    ind.style.opacity = h > 4 ? Math.min(1, h / TRIGGER) : 0;
    if (!busy) spin.style.transform = 'rotate(' + (h * 5) + 'deg)';
  }
  function scrollParent(el) {
    for (var x = el; x && x !== document.body && x !== document.documentElement; x = x.parentElement) {
      var cs = getComputedStyle(x);
      if (/(auto|scroll)/.test(cs.overflowY) && x.scrollHeight > x.clientHeight + 1) return x;
    }
    return document.scrollingElement || document.documentElement;
  }
  function skip(t) {
    return !t || !t.closest || !!t.closest('input,textarea,select,[contenteditable="true"],[data-no-ptr],[data-hold-talk],#dish,#upsell,[role="dialog"]');
  }
  // true when a newer version of the app was just downloaded
  async function checkUpdate() {
    try {
      var reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (!reg) return false;
      await Promise.race([reg.update(), new Promise(function (r) { setTimeout(r, 2500); })]);
      return !!(reg.installing || reg.waiting);
    } catch (e) { return false; }
  }
  document.addEventListener('touchstart', function (e) {
    startY = null; active = false; armed = false;
    if (busy || e.touches.length !== 1 || skip(e.target)) return;
    scroller = scrollParent(e.target);
    if (scroller.scrollTop > 0 || (window.scrollY || 0) > 0) return;
    startY = e.touches[0].clientY; startX = e.touches[0].clientX; pull = 0;
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function (e) {
    if (startY == null) return;
    var dy = e.touches[0].clientY - startY, dx = e.touches[0].clientX - startX;
    if (!active) {
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { startY = null; return; }
      if (dy < 10) return;
      active = true;
    }
    if (scroller.scrollTop > 0) { startY = null; active = false; show(0, true); return; }
    if (e.cancelable) e.preventDefault();
    pull = MAX * (1 - Math.exp(-(dy - 10) / 150));
    var was = armed; armed = pull >= TRIGGER;
    if (armed && !was && navigator.vibrate) try { navigator.vibrate(8); } catch (x) {}
    show(pull, false);
  }, { passive: false, capture: true });
  function end() {
    if (startY == null) return; startY = null;
    if (!active) return; active = false;
    if (!armed) { show(0, true); return; }
    busy = true; show(56, true); spin.style.animation = 'lcPtrSpin .7s linear infinite';
    // refresh in place (no blank page); only reload when there's a new version of the app
    Promise.all([checkUpdate(), new Promise(function (r) { setTimeout(r, 700); })]).then(async function (res) {
      if (res[0]) { document.body.style.transition = 'opacity .15s'; document.body.style.opacity = '0'; setTimeout(function () { location.reload(); }, 160); return; }
      try { if (window.lcOnRefresh) await window.lcOnRefresh(); } catch (x) {}
      spin.style.animation = ''; show(0, true); busy = false;
    });
  }
  document.addEventListener('touchend', end, { capture: true });
  document.addEventListener('touchcancel', end, { capture: true });
})();
