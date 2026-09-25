// La Cabaña Grill — live walkie-talkie ordering (customer side).
// Hold any "Hold to order" button (on the dish photo, the dish card, the dish screen or the big button here)
// and talk: your voice streams live to the restaurant while you speak — no recording, no play button.
// The first hold rings La Cabaña and connects instantly; staff talk back the same way, build your order,
// and it appears here to pay (Square).
(function () {
  var SB_URL = 'https://qzluvwpjtgeccfojutbt.supabase.co';
  var SB_KEY = 'sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ';
  var SQUARE_APP_ID = 'sq0idp-pEudKwtxaPSloXE-BwGwtg', SQUARE_LOCATION_ID = 'LVYWHP32RNMD0';
  var PROFILE_KEY = 'lc_talk_profile';
  var sb = null, chan = null, opsChan = null, call = null, order = null, card = null, state = 'idle';
  var opsOnline = null, dish = null, answered = false, outQ = [], draining = false, drainTimer = null, pollTimer = null, callStart = 0, creating = false;
  var holding = false, pressT = 0, pressDish = null, createTimer = null, talkStart = 0, myBubble = null, remoteTalking = false, remoteStart = 0, remoteBubble = null;

  function load(src) { return new Promise(function (res, rej) { if (document.querySelector('script[src="' + src + '"]')) return (window.supabase || src.indexOf('supabase') < 0) ? res() : setTimeout(res, 300); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function client() {
    if (sb) return sb;
    await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js');
    sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    return sb;
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$' + Number(n || 0).toFixed(2); };
  var $ = function (id) { return document.getElementById(id); };
  var R = function () { return typeof RESTAURANT !== 'undefined' ? RESTAURANT : {}; };
  var item = function (id) { return (id && window.findItem) ? findItem(id) : null; };

  // ---------- customer profile (shown to the restaurant while you talk) ----------
  function profile() {
    var p = {}; try { p = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch (e) {}
    var a = (window.getAccount && getAccount()) || {};
    return { name: p.name || a.name || localStorage.getItem('lc_talk_name') || '', phone: p.phone || a.phone || localStorage.getItem('lc_talk_phone') || '', email: a.email || '', photo: p.photo || '' };
  }
  function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: p.name, phone: p.phone, photo: p.photo })); } catch (e) {} }
  function shrinkPhoto(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var S = 160, c = document.createElement('canvas'); c.width = c.height = S;
        var m = Math.min(img.width, img.height), sx = (img.width - m) / 2, sy = (img.height - m) / 2;
        c.getContext('2d').drawImage(img, sx, sy, m, m, 0, 0, S, S); URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That photo couldn\'t be read')); };
      img.src = url;
    });
  }
  function initials(n) { return String(n || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }

  // ---------- UI ----------
  var css = `
  #tk-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:80;opacity:0;pointer-events:none;transition:opacity .25s}
  #tk-bg.open{opacity:1;pointer-events:auto}
  #tk{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:520px;height:92vh;height:92dvh;background:#151515;border-radius:24px 24px 0 0;z-index:81;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;font-family:Manrope,-apple-system,sans-serif;color:#F9FAFB;box-shadow:0 -20px 60px rgba(0,0,0,.6)}
  #tk.open{transform:none}
  #tk *{box-sizing:border-box}
  .tk-grab{width:40px;height:5px;border-radius:3px;background:#3a3a3a;margin:10px auto 0}
  .tk-top{display:flex;align-items:center;gap:12px;padding:12px 16px 12px}
  .tk-logo{width:44px;height:44px;border-radius:50%;background:#222 center/cover;border:2px solid #f36310;flex-shrink:0}
  .tk-title{flex:1;min-width:0}
  .tk-title b{display:block;font-family:Outfit,sans-serif;font-size:18px;font-weight:700}
  .tk-status{display:flex;align-items:center;gap:6px;font-size:13px;color:#9CA3AF;margin-top:2px}
  .tk-dot{width:8px;height:8px;border-radius:50%;background:#6B7280}
  .tk-dot.on{background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.2)}
  .tk-dot.wait{background:#FBBF24;animation:tkpulse 1.2s infinite}
  @keyframes tkpulse{50%{opacity:.35}}
  .tk-x{all:unset;width:36px;height:36px;border-radius:50%;background:#242424;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;color:#ccc}
  .tk-dish{margin:0 16px;display:flex;align-items:center;gap:10px;background:#1f1f1f;border-radius:14px;padding:8px 10px;font-size:13px;color:#d1d5db}
  .tk-dish img{width:36px;height:36px;border-radius:9px;object-fit:cover}
  .tk-body{flex:1;overflow-y:auto;padding:14px 16px}
  .tk-log{display:flex;flex-direction:column;gap:8px}
  .tk-msg{max-width:78%;padding:10px 12px;border-radius:16px;font-size:13.5px;display:flex;align-items:center;gap:8px}
  .tk-msg.me{align-self:flex-end;background:#f36310;color:#fff;border-bottom-right-radius:5px}
  .tk-msg.them{align-self:flex-start;background:#262626;border-bottom-left-radius:5px}
  .tk-msg.sys{align-self:center;background:none;color:#9CA3AF;font-size:12.5px;text-align:center;max-width:90%}
  .tk-bars{display:inline-flex;gap:2px;align-items:center;height:14px}
  .tk-bars i{width:3px;border-radius:2px;background:currentColor;opacity:.85}
  .tk-foot{padding:10px 16px calc(16px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;align-items:center;gap:10px}
  .tk-who{font-size:13px;font-weight:700;color:#9CA3AF;height:18px}
  .tk-who.live{color:#22C55E}
  .tk-ptt{all:unset;position:relative;width:132px;height:132px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a3d,#f36310 55%,#c24a06);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Outfit,sans-serif;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 14px 40px rgba(243,99,16,.45),inset 0 -6px 14px rgba(0,0,0,.25);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;transition:transform .12s}
  .tk-ptt .ring{position:absolute;inset:-10px;border-radius:50%;border:3px solid rgba(243,99,16,.5);transform:scale(1);transition:transform .08s}
  .tk-ptt.down{transform:scale(.94)}
  .tk-ptt.down .ring{border-color:#22C55E}
  .tk-ptt[disabled]{filter:grayscale(1) brightness(.6);pointer-events:none}
  .tk-ptt.listen{background:radial-gradient(circle at 35% 30%,#3a3a3a,#262626 60%,#1a1a1a);box-shadow:none}
  .tk-ptt svg{width:40px;height:40px;margin-bottom:4px}
  .tk-actions{display:flex;gap:10px;width:100%}
  .tk-btn{all:unset;box-sizing:border-box;flex:1;text-align:center;padding:13px 0;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;background:#242424;color:#F9FAFB}
  .tk-btn.pri{background:#f36310;color:#fff}
  .tk-btn.red{background:rgba(220,38,38,.15);color:#f87171}
  .tk-field{width:100%;height:48px;background:#1f1f1f;border:1px solid #2e2e2e;border-radius:12px;padding:0 14px;color:#fff;font-size:16px;margin-top:8px;outline:none;font-family:inherit}
  .tk-field:focus{border-color:#f36310}
  .tk-order{background:#1c1c1c;border:1px solid rgba(243,99,16,.35);border-radius:18px;padding:14px;margin-top:6px}
  .tk-order h4{margin:0 0 10px;font-family:Outfit,sans-serif;font-size:16px;display:flex;justify-content:space-between}
  .tk-line{display:flex;justify-content:space-between;gap:10px;font-size:14px;padding:5px 0}
  .tk-line small{display:block;color:#9CA3AF;font-size:12px}
  .tk-sum{border-top:1px solid rgba(255,255,255,.08);margin-top:8px;padding-top:8px;font-size:13px;color:#9CA3AF}
  .tk-sum div{display:flex;justify-content:space-between;padding:2px 0}
  .tk-sum .t{color:#fff;font-weight:800;font-size:16px;padding-top:6px}
  #tk-card{margin-top:12px;min-height:90px}
  .tk-err{color:#f87171;font-size:13px;margin-top:8px}
  .tk-paid{text-align:center;padding:10px 0}
  .tk-paid .ok{width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,.15);color:#22C55E;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:32px}
  .tk-talkbtn{display:inline-flex;align-items:center;gap:6px}
  `;
  var css2 = `
  [data-hold-talk]{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:pointer}
  [data-hold-talk] *{pointer-events:none}
  [data-hold-talk].tk-pressing{transform:scale(.93)!important;box-shadow:0 0 0 3px #22C55E,0 0 22px rgba(34,197,94,.55)!important}
  .lc-hold{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;padding:9px 14px 9px 11px;border-radius:999px;background:#f36310;color:#fff;font:700 13px/1 Manrope,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.45);transition:transform .12s,box-shadow .12s}
  .lc-hold svg{width:18px;height:18px;flex-shrink:0}
  .lc-hold.sm{padding:0;width:34px;height:34px;justify-content:center}
  .tk-av{width:84px;height:84px;border-radius:50%;background:#262626 center/cover;margin:0 auto;display:flex;align-items:center;justify-content:center;font:700 28px Outfit,sans-serif;color:#9CA3AF;border:2px dashed #3a3a3a;cursor:pointer;position:relative}
  .tk-av.has{border:2px solid #f36310}
  .tk-av small{position:absolute;bottom:-6px;right:-6px;background:#f36310;color:#fff;border-radius:999px;font:700 11px Manrope,sans-serif;padding:4px 7px}
  .tk-hint{text-align:center;color:#9CA3AF;font-size:13.5px;line-height:1.5;padding:6px 8px 0}
  .tk-link{all:unset;cursor:pointer;color:#ffb596;font-size:12.5px;font-weight:700}
  `;
  var MIC_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11z"/></svg>';

  function injectCss() {
    if ($('tk-css')) return;
    var st = document.createElement('style'); st.id = 'tk-css'; st.textContent = css + css2; document.head.appendChild(st);
  }

  function build() {
    injectCss();
    if ($('tk')) return;
    var bg = document.createElement('div'); bg.id = 'tk-bg';
    var el = document.createElement('div'); el.id = 'tk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Talk to order');
    el.innerHTML = '<div class="tk-grab"></div>' +
      '<div class="tk-top"><div class="tk-logo" style="background-image:url(\'' + (R().logo || '') + '\')"></div>' +
      '<div class="tk-title"><b>La Cabaña · Live</b><div class="tk-status"><span class="tk-dot" id="tk-dot"></span><span id="tk-stat">Checking the line…</span></div></div>' +
      '<button class="tk-x" id="tk-close" aria-label="Close">✕</button></div>' +
      '<div class="tk-dish" id="tk-dish" style="display:none"></div>' +
      '<div class="tk-body" id="tk-body"><div class="tk-log" id="tk-log"></div><div id="tk-panel"></div></div>' +
      '<div class="tk-foot" id="tk-foot"></div>';
    document.body.appendChild(bg); document.body.appendChild(el);
    $('tk-close').onclick = function () { close(); };
    bg.onclick = function () { if (!call) close(); };
  }
  function isOpen() { return $('tk') && $('tk').classList.contains('open'); }
  function openSheet(dishId) {
    build();
    if (dishId !== undefined && (!call || !dish)) setDish(dishId);
    if (!isOpen()) { $('tk-bg').classList.add('open'); $('tk').classList.add('open'); }
  }
  function setDish(dishId) {
    dish = item(dishId);
    $('tk-dish').style.display = dish ? 'flex' : 'none';
    if (dish) $('tk-dish').innerHTML = '<img src="' + esc(dish.img) + '" alt=""><span>About <b style="color:#fff">' + esc(dish.name) + '</b> · ' + money(dish.price) + '</span>';
  }

  function setStatus(text, dot) { if (!$('tk-stat')) return; $('tk-stat').textContent = text; $('tk-dot').className = 'tk-dot' + (dot ? ' ' + dot : ''); }
  function who(text, live) { var w = $('tk-who'); if (w) { w.textContent = text; w.className = 'tk-who' + (live ? ' live' : ''); } }
  function log(cls, html) { var d = document.createElement('div'); d.className = 'tk-msg ' + cls; d.innerHTML = html; $('tk-log').appendChild(d); $('tk-body').scrollTop = 1e6; return d; }
  function bars(level) { var h = [0.35, 0.7, 1, 0.6, 0.4].map(function (m) { return Math.max(3, Math.round(14 * Math.min(1, level * m * 1.6 + 0.15))); }); return '<span class="tk-bars">' + h.map(function (x) { return '<i style="height:' + x + 'px"></i>'; }).join('') + '</span>'; }
  function secs(ms) { var s = Math.max(1, Math.round(ms / 1000)); return '0:' + String(s).padStart(2, '0'); }
  function fmtPhone(p) { var d = String(p).replace(/\D/g, '').slice(-10); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : p; }
  function statusIdle() {
    if (call) return;
    if (opsOnline === false) setStatus('No one is on the line right now', '');
    else if (opsOnline) setStatus('La Cabaña is online — hold to talk', 'on');
    else setStatus('Checking the line…', 'wait');
  }

  // ---------- screens ----------
  function pttFooter() {
    if ($('tk-ptt')) return;
    $('tk-foot').innerHTML = '<div class="tk-who" id="tk-who">Hold to talk</div>' +
      '<button class="tk-ptt" id="tk-ptt" data-hold-talk="" aria-label="Hold to talk"><span class="ring" id="tk-ring"></span>' + MIC_SVG.replace('<svg', '<svg fill="#fff"') + 'HOLD TO TALK</button>' +
      '<div class="tk-actions" id="tk-acts"></div>';
    renderActs();
  }
  function renderActs() {
    var a = $('tk-acts'); if (!a) return;
    a.innerHTML = call ? '<button class="tk-btn red" id="tk-hang">End call</button>' : '<button class="tk-btn" id="tk-prof">Edit my profile</button>';
    if (call) $('tk-hang').onclick = function () { hangUp(); }; else $('tk-prof').onclick = function () { screenProfile(); };
  }
  function screenReady() {
    state = call ? state : 'ready';
    var p = profile();
    $('tk-panel').innerHTML = call ? '' : '<div class="tk-hint"><b style="color:#fff;font-size:15px">Hi ' + esc(p.name.split(' ')[0]) + '!</b><br>Hold the button and say what you\'d like.<br>La Cabaña hears you live while you talk.</div>';
    pttFooter(); statusIdle();
  }
  function screenProfile() {
    var p = profile();
    $('tk-log').innerHTML = '';
    $('tk-foot').innerHTML = '';
    $('tk-panel').innerHTML = '<div style="text-align:center;padding:4px 4px 0"><div style="font-family:Outfit,sans-serif;font-size:21px;font-weight:700">Order by voice</div>' +
      '<p style="color:#9CA3AF;font-size:14px;line-height:1.5;margin:6px 0 14px">One time only — so La Cabaña knows who\'s talking.</p>' +
      '<label class="tk-av' + (p.photo ? ' has' : '') + '" id="tk-av" style="' + (p.photo ? 'background-image:url(' + p.photo + ')' : '') + '">' + (p.photo ? '' : initials(p.name || '+')) + '<small>' + (p.photo ? 'Change' : 'Add photo') + '</small>' +
      '<input type="file" accept="image/*" id="tk-file" style="display:none"></label></div>' +
      '<input class="tk-field" id="tk-name" placeholder="Your name" autocomplete="name" value="' + esc(p.name) + '" style="margin-top:14px">' +
      '<input class="tk-field" id="tk-phone" placeholder="Phone (optional)" inputmode="tel" autocomplete="tel" value="' + esc(p.phone) + '">' +
      '<div class="tk-err" id="tk-err" style="display:none"></div>' +
      '<button class="tk-btn pri" id="tk-save" style="display:block;width:100%;margin-top:14px;padding:15px 0;font-size:16px">Save</button>';
    var photo = p.photo;
    $('tk-file').onchange = async function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      try { photo = await shrinkPhoto(f); var av = $('tk-av'); av.classList.add('has'); av.style.backgroundImage = 'url(' + photo + ')'; av.firstChild.nodeType === 3 && av.removeChild(av.firstChild); av.querySelector('small').textContent = 'Change'; }
      catch (err) { $('tk-err').textContent = err.message; $('tk-err').style.display = 'block'; }
    };
    $('tk-save').onclick = function () {
      var name = $('tk-name').value.trim();
      if (!name) { $('tk-err').textContent = 'Please add your name.'; $('tk-err').style.display = 'block'; return; }
      saveProfile({ name: name.slice(0, 60), phone: $('tk-phone').value.trim().slice(0, 30), photo: photo });
      screenReady();
      who('All set — now hold the button and talk');
    };
    setStatus('Set up voice ordering', '');
  }
  function screenOffline() {
    $('tk-log').innerHTML = '';
    setStatus('No one is on the line right now', '');
    $('tk-panel').innerHTML = '<div style="text-align:center;padding:30px 10px;color:#9CA3AF;font-size:14.5px;line-height:1.55">Voice ordering is answered live by our staff, and nobody is on the line at the moment.<br><br>You can still order from the menu, or call us at <a href="tel:' + (R().phone || '') + '" style="color:#ffb596;font-weight:700">' + fmtPhone(R().phone || '') + '</a>.</div>';
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-retry">Try again</button><button class="tk-btn pri" id="tk-menu">Back to menu</button></div>';
    $('tk-retry').onclick = function () { setStatus('Checking the line…', 'wait'); watchOps(true).then(function () { opsOnline === false ? screenOffline() : screenReady(); }); };
    $('tk-menu').onclick = function () { close(); };
  }
  function screenMsg(title, html) {
    $('tk-panel').innerHTML = '<div style="text-align:center;padding:26px 10px;color:#9CA3AF;font-size:14.5px;line-height:1.55"><div style="color:#fff;font-family:Outfit,sans-serif;font-size:19px;font-weight:700;margin-bottom:6px">' + title + '</div>' + html + '</div>';
  }

  // ---------- presence: is anyone on duty? (kept warm so a hold connects instantly) ----------
  function watchOps(fresh) {
    return client().then(function () {
      return new Promise(function (resolve) {
        if (opsChan && !fresh) return resolve();
        if (opsChan) { sb.removeChannel(opsChan); opsChan = null; }
        var done = false, finish = function () { if (!done) { done = true; resolve(); } };
        opsChan = sb.channel('lc-ops', { config: { presence: { key: 'customer-' + Math.random().toString(36).slice(2) } } });
        opsChan.on('presence', { event: 'sync' }, function () {
          opsOnline = Object.keys(opsChan.presenceState()).some(function (k) { return k.indexOf('operator') === 0; });
          finish(); if (isOpen()) statusIdle();
        });
        opsChan.subscribe(function (s) { if (s === 'SUBSCRIBED') setTimeout(function () { if (opsOnline === null) opsOnline = false; finish(); if (isOpen()) statusIdle(); }, 2500); });
      });
    });
  }

  // ---------- sending (queued until the restaurant is connected, then streamed) ----------
  function emit(event, payload) {
    if (answered && chan && !draining) { chan.send({ type: 'broadcast', event: event, payload: payload }); return; }
    outQ.push([event, payload]);
    if (outQ.length > 400) { var i = outQ.findIndex(function (e) { return e[0] === 'audio'; }); if (i >= 0) outQ.splice(i, 1); }
  }
  function drain() {
    if (draining || !outQ.length) return;
    draining = true;
    drainTimer = setInterval(function () {
      var e = outQ.shift();
      if (e && chan) chan.send({ type: 'broadcast', event: e[0], payload: e[1] });
      if (!outQ.length) { clearInterval(drainTimer); draining = false; }
    }, 30);
  }

  // ---------- hold to talk ----------
  async function beginPress(dishId, btn) {
    if (holding) return;
    TalkAudio.unlock();
    if (dishId === '') dishId = dish ? dish.id : null;
    if (!TalkAudio.supported()) { openSheet(dishId); screenMsg('Voice ordering isn\'t available here', 'This browser doesn\'t allow the microphone. Open the app in Safari or Chrome.'); $('tk-foot').innerHTML = ''; return; }
    if (state === 'paid' || state === 'ended') resetCall();
    if (!profile().name) { openSheet(dishId); screenProfile(); return; }
    openSheet(dishId);
    if (!call && opsOnline === false) { screenOffline(); return; }
    if (!$('tk-ptt')) screenReady();
    if (remoteTalking) { who('La Cabaña is talking — wait for them to finish', true); return; }
    holding = true; pressT = Date.now(); pressDish = dishId || null;
    pressed(btn, true);
    if (!TalkAudio.hasMic()) {
      who('Allow the microphone…');
      var ok = await TalkAudio.prepareMic();
      if (!ok) { holding = false; pressed(btn, false); screenMsg('Microphone is blocked', 'Allow the microphone for this site, then hold the button again.<br><br>iPhone: Settings → Safari → Microphone → Allow.'); return; }
      if (!holding) { who('Microphone is on — now hold to talk'); return; }
    }
    if (!call && !creating) createTimer = setTimeout(createCall, 250);
    startTalking();
  }
  var pressedBtn = null;
  function pressed(btn, on) {
    if (on) { pressedBtn = btn; if (btn) btn.classList.add('tk-pressing'); if ($('tk-ptt')) $('tk-ptt').classList.add('down'); }
    else { if (pressedBtn) pressedBtn.classList.remove('tk-pressing'); pressedBtn = null; if ($('tk-ptt')) $('tk-ptt').classList.remove('down'); if ($('tk-ring')) $('tk-ring').style.transform = ''; }
  }
  async function startTalking() {
    talkStart = Date.now();
    var d = item(pressDish);
    if (!order) $('tk-panel').innerHTML = '';
    emit('ptt', { from: 'customer', state: 'start', dish: d ? d.id : null, dishName: d ? d.name : null });
    myBubble = log('me', '<span>You' + (d && call ? ' · ' + esc(d.name) : '') + '</span> ' + bars(0.2));
    who(answered ? 'You\'re live — La Cabaña hears you' : 'Ringing La Cabaña… keep talking', true);
    if (navigator.vibrate) navigator.vibrate(15);
    try {
      await TalkAudio.startTalk(function (frame) { emit('audio', frame); }, function (lvl) {
        if ($('tk-ring')) $('tk-ring').style.transform = 'scale(' + (1 + lvl * 0.25) + ')';
        if (myBubble) myBubble.innerHTML = '<span>You</span> ' + bars(lvl);
      });
      if (!holding) finishTalk();
    } catch (e) { holding = false; pressed(null, false); who('Microphone unavailable'); }
  }
  function endPress() {
    if (!holding) return;
    holding = false; pressed(null, false);
    var tap = Date.now() - pressT < 250 && !call && !creating;
    if (TalkAudio.isTalking()) finishTalk();
    if (tap) {
      clearTimeout(createTimer); outQ = [];
      if (myBubble) myBubble.remove(); myBubble = null;
      if (!$('tk-log').children.length) screenReady();
      who('Keep holding the button while you talk');
    }
  }
  function finishTalk() {
    TalkAudio.stopTalk();
    emit('ptt', { from: 'customer', state: 'stop' });
    if (myBubble) myBubble.innerHTML = '<span>You</span> ' + bars(0.5) + ' <span style="opacity:.8">' + secs(Date.now() - talkStart) + '</span>';
    myBubble = null;
    who(answered ? 'Hold to talk' : 'Ringing La Cabaña…', !answered);
  }

  // ---------- call ----------
  async function createCall() {
    if (call || creating) return;
    creating = true;
    state = 'connecting'; callStart = Date.now();
    setStatus('Ringing La Cabaña…', 'wait');
    await client();
    var p = profile(), d = item(pressDish) || dish;
    var r = await sb.rpc('start_call', { p_name: p.name, p_phone: p.phone || null, p_dish_id: d ? d.id : null, p_dish_name: d ? d.name : null });
    creating = false;
    if (r.error || !r.data || !r.data[0]) {
      state = 'ready'; outQ = [];
      if (holding) { holding = false; pressed(null, false); TalkAudio.stopTalk(); }
      setStatus(r.error && /busy/.test(r.error.message) ? 'The line is busy — try again in a minute' : 'Couldn\'t connect — check your internet', '');
      who('Hold to try again');
      return;
    }
    call = { id: r.data[0].call_id, token: r.data[0].token };
    renderActs();
    chan = sb.channel('call-' + call.id, { config: { broadcast: { self: false, ack: false } } });
    chan.on('broadcast', { event: 'answered' }, function (m) { onAnswered(m.payload); })
      .on('broadcast', { event: 'ptt' }, function (m) { onRemotePtt(m.payload); })
      .on('broadcast', { event: 'audio' }, function (m) { onRemoteAudio(m.payload); })
      .on('broadcast', { event: 'order' }, function () { loadOrder(); })
      .on('broadcast', { event: 'hangup' }, function () { onRemoteHangup(); })
      .subscribe(function (s) { if (s === 'SUBSCRIBED') chan.send({ type: 'broadcast', event: 'knock', payload: {} }); });
    pollTimer = setInterval(poll, 1500);
  }

  async function poll() {
    if (!call) return;
    var r = await sb.rpc('call_status', { p_call: call.id, p_token: call.token });
    var s = r.data;
    if (s === 'live' && !answered) { chan.send({ type: 'broadcast', event: 'knock', payload: {} }); setTimeout(function () { if (!answered) onAnswered({}); }, 800); }
    if ((s === 'ended' || s === 'missed') && state !== 'paid' && state !== 'ended') return onRemoteHangup(s === 'missed');
    if (!answered && s === 'waiting' && Date.now() - callStart > 60000) return giveUp();
    if (answered && (state === 'live' || state === 'ordered')) loadOrder(true);
  }

  function onAnswered(p) {
    if (answered || !call) return;
    answered = true; state = order ? 'ordered' : 'live';
    setStatus('Live with La Cabaña', 'on');
    log('sys', (p && p.name ? esc(p.name) + ' at ' : '') + 'La Cabaña is on the line' + (outQ.some(function (e) { return e[0] === 'audio'; }) ? ' and hearing you now.' : '. Hold the button and talk.'));
    var pr = profile(), d = item(pressDish) || dish;
    chan.send({ type: 'broadcast', event: 'hello', payload: { name: pr.name, phone: pr.phone, email: pr.email, photo: pr.photo, dish: d ? d.id : null, dishName: d ? d.name : null, orders: pastOrders() } });
    drain();
    if (!holding) who('Hold to talk');
    if (navigator.vibrate) navigator.vibrate(30);
  }
  function pastOrders() { try { return (JSON.parse(localStorage.getItem(window.ORDERS_KEY || 'lacabana_orders') || '[]')).length; } catch (e) { return 0; } }

  function onRemotePtt(p) {
    if (p.state === 'start') {
      remoteTalking = true; remoteStart = Date.now();
      TalkAudio.remoteStart();
      remoteBubble = log('them', '<span>La Cabaña</span> ' + bars(0.2));
      who('La Cabaña is talking…', true);
      if ($('tk-ptt')) $('tk-ptt').classList.add('listen');
    } else {
      remoteTalking = false;
      TalkAudio.remoteStop();
      if (remoteBubble) remoteBubble.innerHTML = '<span>La Cabaña</span> ' + bars(0.5) + ' <span style="opacity:.7">' + secs(Date.now() - remoteStart) + '</span>';
      remoteBubble = null;
      who('Hold to talk');
      if ($('tk-ptt')) $('tk-ptt').classList.remove('listen');
    }
  }
  function onRemoteAudio(frame) {
    var lvl = TalkAudio.play(frame);
    if (remoteBubble) remoteBubble.innerHTML = '<span>La Cabaña</span> ' + bars(lvl);
  }

  function giveUp() {
    var c = call; stopCall();
    if (c) sb.rpc('customer_end_call', { p_call: c.id, p_token: c.token });
    state = 'ended';
    setStatus('No answer', '');
    log('sys', 'Nobody picked up. Try again in a minute or call us at <a href="tel:' + (R().phone || '') + '" style="color:#ffb596">' + fmtPhone(R().phone || '') + '</a>.');
    who('Hold to try again'); renderActs();
  }

  // ---------- the order the restaurant built ----------
  var shownOrderId = null;
  async function loadOrder(quiet) {
    if (!call) return;
    var r = await sb.rpc('my_talk_order', { p_call: call.id, p_token: call.token });
    var o = r.data && r.data[0];
    if (!o) return;
    if (o.id === shownOrderId && o.status === (order && order.status)) return;
    order = o; shownOrderId = o.id;
    if (o.status === 'paid') return showPaid(o);
    state = 'ordered';
    if (!quiet && navigator.vibrate) navigator.vibrate([20, 60, 20]);
    log('sys', 'La Cabaña sent your order — review and pay below.');
    renderOrder(o);
  }
  function orderHTML(o) {
    return '<div class="tk-order"><h4><span>Order #' + o.order_number + '</span><span style="color:#ffb596">' + money(o.total) + '</span></h4>' +
      (o.items || []).map(function (it) {
        var x = item(it.id);
        return '<div class="tk-line" style="align-items:flex-start">' + (x ? '<img src="' + esc(x.img) + '" alt="" style="width:46px;height:46px;border-radius:10px;object-fit:cover;flex-shrink:0">' : '') +
          '<span style="flex:1;min-width:0"><b style="font-weight:700">' + it.qty + '× ' + esc(it.name) + '</b>' + (it.note ? '<small>' + esc(it.note) + '</small>' : '') + '</span><span style="font-weight:700">' + money(it.price * it.qty) + '</span></div>';
      }).join('') +
      '<div class="tk-sum"><div><span>Subtotal</span><span>' + money(o.subtotal) + '</span></div><div><span>Tax</span><span>' + money(o.tax) + '</span></div><div class="t"><span>Total</span><span>' + money(o.total) + '</span></div></div></div>';
  }
  async function renderOrder(o) {
    $('tk-panel').innerHTML = '<div style="font-family:Outfit,sans-serif;font-size:20px;font-weight:700;margin:4px 0 8px">Your order is ready to pay</div>' + orderHTML(o) +
      '<div id="tk-card"></div><div class="tk-err" id="tk-perr" style="display:none"></div>' +
      '<button class="tk-btn pri" id="tk-pay" style="display:block;width:100%;margin-top:12px;padding:20px 0;font-size:19px;border-radius:18px;box-shadow:0 10px 30px rgba(243,99,16,.4)">Pay ' + money(o.total) + '</button>' +
      '<div style="text-align:center;color:#6B7280;font-size:12px;margin-top:8px">Secure card payment by Square. Something wrong? Just hold the button and tell us.</div>';
    $('tk-body').scrollTop = 1e6;
    $('tk-pay').onclick = pay;
    try {
      await load('https://web.squarecdn.com/v1/square.js');
      var payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
      if (card) { try { await card.destroy(); } catch (e) {} }
      card = await payments.card();
      await card.attach('#tk-card');
    } catch (e) { if ($('tk-card')) $('tk-card').innerHTML = '<div class="tk-err">Couldn\'t load the card form: ' + esc(e.message) + '</div>'; }
  }
  async function pay() {
    var btn = $('tk-pay'), perr = $('tk-perr'); perr.style.display = 'none';
    if (!card) { perr.textContent = 'The card form is still loading — try again in a second.'; perr.style.display = 'block'; return; }
    btn.style.pointerEvents = 'none'; btn.textContent = 'Processing payment…';
    try {
      var t = await card.tokenize();
      if (t.status !== 'OK') throw new Error(t.errors && t.errors[0] ? t.errors[0].message : 'Please check your card details');
      var res = await fetch('/api/process-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: t.token, talkOrderId: order.id, talkToken: call.token }) });
      var data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Payment failed');
      order.status = 'paid'; order.paid_at = new Date().toISOString();
      chan.send({ type: 'broadcast', event: 'paid', payload: { order_id: order.id } });
      saveLocalOrder(order, data.paymentId);
      showPaid(order);
    } catch (e) {
      perr.textContent = e.message; perr.style.display = 'block';
      btn.style.pointerEvents = ''; btn.textContent = 'Pay ' + money(order.total) + ' now';
    }
  }
  function saveLocalOrder(o, paymentId) {
    try {
      var key = window.ORDERS_KEY || 'lacabana_orders', list = JSON.parse(localStorage.getItem(key) || '[]');
      if (list.some(function (x) { return x.id === 'LC-' + o.order_number; })) return;
      list.unshift({ id: 'LC-' + o.order_number, placedAt: new Date().toISOString(), lines: (o.items || []).map(function (it) { return { id: it.id, name: it.name, qty: it.qty, price: it.price }; }),
        subtotal: Number(o.subtotal), discount: 0, taxes: Number(o.tax), tip: 0, total: Number(o.total), status: 'queued', via: 'voice', paymentId: paymentId });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }
  function showPaid(o) {
    state = 'paid';
    $('tk-panel').innerHTML = '<div class="tk-paid"><div class="ok">✓</div><div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:700">Paid — order confirmed</div>' +
      '<div style="color:#9CA3AF;font-size:14px;margin-top:6px">Order #' + o.order_number + ' is in the kitchen. We\'ll have it ready for pickup at ' + esc(R().address || 'La Cabaña') + '.</div></div>' + orderHTML(o);
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-orders">View my orders</button><button class="tk-btn pri" id="tk-done">Done</button></div>';
    $('tk-orders').onclick = function () { hangUp(true); location.href = 'orders.html'; };
    $('tk-done').onclick = function () { hangUp(true); };
    setStatus('Order #' + o.order_number + ' paid', 'on');
    $('tk-body').scrollTop = 0;
  }

  // ---------- ending ----------
  function stopCall() {
    if (holding) { holding = false; pressed(null, false); }
    if (TalkAudio.isTalking()) TalkAudio.stopTalk();
    clearInterval(pollTimer); clearInterval(drainTimer); clearTimeout(createTimer);
    if (chan && sb) { sb.removeChannel(chan); chan = null; }
    call = null; answered = false; outQ = []; draining = false; remoteTalking = false;
  }
  function resetCall() {
    stopCall(); order = null; shownOrderId = null; state = 'idle';
    if ($('tk-log')) { $('tk-log').innerHTML = ''; $('tk-panel').innerHTML = ''; $('tk-foot').innerHTML = ''; }
  }
  function onRemoteHangup(missed) {
    if (state === 'paid' || state === 'ended') return;
    var hadOrder = order && order.status === 'sent';
    stopCall(); state = 'ended';
    setStatus('Call ended', '');
    log('sys', missed ? 'Nobody picked up. Try again in a minute.' : 'La Cabaña ended the call.');
    TalkAudio.releaseMic();
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-close2">Close</button>' + (hadOrder ? '<button class="tk-btn pri" id="tk-payl">Pay order</button>' : '') + '</div>';
    $('tk-close2').onclick = function () { close(true); };
    if ($('tk-payl')) $('tk-payl').onclick = function () { $('tk-body').scrollTop = 1e6; };
  }
  async function hangUp(silent) {
    var c = call, ch = chan;
    if (c && state !== 'paid') {
      try { ch && ch.send({ type: 'broadcast', event: 'hangup', payload: { from: 'customer' } }); } catch (e) {}
      try { await sb.rpc('customer_end_call', { p_call: c.id, p_token: c.token }); } catch (e) {}
    }
    resetCall();
    TalkAudio.releaseMic();
    close(true);
  }

  // ---------- open / close ----------
  async function open(dishId) {
    build();
    if (!call) { resetCall(); setDish(dishId); }
    openSheet();
    if (!TalkAudio.supported()) { screenMsg('Voice ordering isn\'t available here', 'This browser doesn\'t allow the microphone. Open the app in Safari or Chrome.'); return; }
    if (call) return;
    if (!profile().name) { screenProfile(); return; }
    screenReady();
    await watchOps();
    if (!call && opsOnline === false) screenOffline(); else statusIdle();
  }
  function close(force) {
    if (!force && call && state !== 'paid') { if (!confirm('End the call with La Cabaña?')) return; return hangUp(); }
    if (state === 'paid' || state === 'ended') resetCall();
    if ($('tk')) { $('tk-bg').classList.remove('open'); $('tk').classList.remove('open'); }
  }
  // leaving the page ends the call (keepalive so the request survives the navigation)
  window.addEventListener('pagehide', function () {
    if (!call || state === 'paid' || state === 'ended') return;
    try { fetch(SB_URL + '/rest/v1/rpc/customer_end_call', { method: 'POST', keepalive: true, headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_call: call.id, p_token: call.token }) }); } catch (e) {}
  });

  // ---------- every [data-hold-talk] button is a walkie-talkie button ----------
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('[data-hold-talk]');
    if (!b || e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    try { b.setPointerCapture(e.pointerId); } catch (x) {}
    beginPress(b.getAttribute('data-hold-talk'), b);
  }, { passive: false });
  ['pointerup', 'pointercancel'].forEach(function (ev) { document.addEventListener(ev, function () { if (holding) endPress(); }); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-hold-talk]')) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-hold-talk]')) e.preventDefault(); });
  // unlock audio on the first touch anywhere, so the first hold streams right away on iPhone
  var unlockOnce = function () { try { TalkAudio.unlock(); } catch (e) {} document.removeEventListener('touchend', unlockOnce); document.removeEventListener('click', unlockOnce); };
  document.addEventListener('touchend', unlockOnce); document.addEventListener('click', unlockOnce);

  injectCss();
  // warm up the line status in the background
  var warm = function () { if (TalkAudio.supported()) watchOps().catch(function () {}); };
  if (document.readyState === 'complete') setTimeout(warm, 800); else window.addEventListener('load', function () { setTimeout(warm, 800); });

  // Button markup helpers
  window.holdButtonHTML = function (id, small) {
    return '<button type="button" data-hold-talk="' + id + '" class="lc-hold' + (small ? ' sm' : '') + '" aria-label="Hold to order by voice">' + MIC_SVG + (small ? '' : 'Hold to order') + '</button>';
  };
  window.talkButtonHTML = function (id, extraClass) {
    return '<button type="button" data-hold-talk="' + id + '" class="' + (extraClass || 'h-9 px-3 rounded-xl bg-surface-raised hover:bg-surface-elevated text-primary font-label-md text-label-md flex items-center gap-1.5 transition-colors') + '" aria-label="Hold to talk">' +
      '<span class="material-symbols-outlined text-[18px]">mic</span>Hold to talk</button>';
  };
  window.openTalk = open;
})();
