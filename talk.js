// La Cabaña Grill — "Talk to order" (customer side).
// Tap Talk to order on any dish -> live push-to-talk line with the restaurant -> the restaurant builds your
// order -> it appears here exactly as built -> Pay now (Square) -> paid, confirmed order.
(function () {
  var SB_URL = 'https://qzluvwpjtgeccfojutbt.supabase.co';
  var SB_KEY = 'sb_publishable_LA6q8PrfQSRC5d7tanAamg_erxp0ShJ';
  var SQUARE_APP_ID = 'sq0idp-pEudKwtxaPSloXE-BwGwtg', SQUARE_LOCATION_ID = 'LVYWHP32RNMD0';
  var sb = null, chan = null, opsChan = null, call = null, order = null, card = null, state = 'idle';
  var talkStart = 0, remoteStart = 0, pollTimer = null, opsOnline = false, dish = null, holding = false;

  function load(src) { return new Promise(function (res, rej) { if (document.querySelector('script[src="' + src + '"]')) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
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

  function build() {
    if ($('tk')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var bg = document.createElement('div'); bg.id = 'tk-bg';
    var el = document.createElement('div'); el.id = 'tk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Talk to order');
    el.innerHTML = '<div class="tk-grab"></div>' +
      '<div class="tk-top"><div class="tk-logo" style="background-image:url(\'' + (R().logo || '') + '\')"></div>' +
      '<div class="tk-title"><b>Talk to order</b><div class="tk-status"><span class="tk-dot" id="tk-dot"></span><span id="tk-stat">Checking the line…</span></div></div>' +
      '<button class="tk-x" id="tk-close" aria-label="Close">✕</button></div>' +
      '<div class="tk-dish" id="tk-dish" style="display:none"></div>' +
      '<div class="tk-body" id="tk-body"><div class="tk-log" id="tk-log"></div><div id="tk-panel"></div></div>' +
      '<div class="tk-foot" id="tk-foot"></div>';
    document.body.appendChild(bg); document.body.appendChild(el);
    $('tk-close').onclick = close; bg.onclick = function () { if (state !== 'live' && state !== 'calling') close(); };
  }

  function setStatus(text, dot) { $('tk-stat').textContent = text; $('tk-dot').className = 'tk-dot' + (dot ? ' ' + dot : ''); }
  function log(cls, html) { var d = document.createElement('div'); d.className = 'tk-msg ' + cls; d.innerHTML = html; $('tk-log').appendChild(d); $('tk-body').scrollTop = 1e6; return d; }
  function bars(level) { var h = [0.35, 0.7, 1, 0.6, 0.4].map(function (m) { return Math.max(3, Math.round(14 * Math.min(1, level * m * 1.6 + 0.15))); }); return '<span class="tk-bars">' + h.map(function (x) { return '<i style="height:' + x + 'px"></i>'; }).join('') + '</span>'; }
  function secs(ms) { var s = Math.max(1, Math.round(ms / 1000)); return '0:' + String(s).padStart(2, '0'); }

  // ---------- screens ----------
  function screenIntro() {
    state = 'intro';
    var acct = (window.getAccount && getAccount()) || {};
    $('tk-panel').innerHTML = '<div style="text-align:center;padding:10px 4px 0"><div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:700">Order by voice</div>' +
      '<p style="color:#9CA3AF;font-size:14px;line-height:1.5;margin:8px 0 16px">Hold the button and tell us what you\'d like — we hear you live, build your order, and send it here for you to pay.</p></div>' +
      '<input class="tk-field" id="tk-name" placeholder="Your name" autocomplete="name" value="' + esc(acct.name || localStorage.getItem('lc_talk_name') || '') + '">' +
      '<input class="tk-field" id="tk-phone" placeholder="Phone (so we can call if we get cut off)" inputmode="tel" autocomplete="tel" value="' + esc(acct.phone || localStorage.getItem('lc_talk_phone') || '') + '">' +
      '<div class="tk-err" id="tk-err" style="display:none"></div>';
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn pri" id="tk-go">' + (opsOnline ? 'Call La Cabaña' : 'Call La Cabaña') + '</button></div>';
    $('tk-go').onclick = startCall;
  }
  function screenOffline() {
    state = 'offline';
    setStatus('No one is on the line right now', '');
    $('tk-panel').innerHTML = '<div style="text-align:center;padding:30px 10px;color:#9CA3AF;font-size:14.5px;line-height:1.55">Voice ordering is answered live by our staff, and nobody is on the line at the moment.<br><br>You can still order from the menu, or call us at <a href="tel:' + (R().phone || '') + '" style="color:#ffb596;font-weight:700">' + fmtPhone(R().phone || '') + '</a>.</div>';
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-retry">Try again</button><button class="tk-btn pri" id="tk-menu">Back to menu</button></div>';
    $('tk-retry').onclick = function () { checkOps().then(function () { opsOnline ? screenIntro() : screenOffline(); }); };
    $('tk-menu').onclick = close;
  }
  function fmtPhone(p) { var d = String(p).replace(/\D/g, '').slice(-10); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : p; }

  function pttFooter() {
    $('tk-foot').innerHTML = '<div class="tk-who" id="tk-who">Hold to talk</div>' +
      '<button class="tk-ptt" id="tk-ptt" aria-label="Hold to talk"><span class="ring" id="tk-ring"></span>' +
      '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11z"/></svg>HOLD TO TALK</button>' +
      '<div class="tk-actions"><button class="tk-btn red" id="tk-hang">End call</button></div>';
    var b = $('tk-ptt');
    var down = function (e) { e.preventDefault(); pttDown(); };
    var up = function (e) { e.preventDefault(); pttUp(); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', function (e) { if (holding) up(e); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    $('tk-hang').onclick = hangUp;
  }

  // ---------- presence: is anyone taking calls? ----------
  async function checkOps() {
    await client();
    return new Promise(function (resolve) {
      if (opsChan) { sb.removeChannel(opsChan); opsChan = null; }
      var done = false;
      opsChan = sb.channel('lc-ops', { config: { presence: { key: 'customer-' + Math.random().toString(36).slice(2) } } });
      opsChan.on('presence', { event: 'sync' }, function () {
        var st = opsChan.presenceState(); opsOnline = Object.keys(st).some(function (k) { return k.indexOf('operator') === 0; });
        if (!done) { done = true; resolve(); }
        if (state === 'intro' || state === 'offline') { opsOnline ? (state === 'offline' && screenIntro(), setStatus('La Cabaña is online', 'on')) : screenOffline(); }
      });
      opsChan.subscribe(function (s) { if (s !== 'SUBSCRIBED') return; setTimeout(function () { if (!done) { done = true; resolve(); } }, 2500); });
    });
  }

  // ---------- call ----------
  async function startCall() {
    var name = $('tk-name').value.trim(), phone = $('tk-phone').value.trim(), err = $('tk-err');
    if (!name) { err.textContent = 'Please add your name.'; err.style.display = 'block'; return; }
    localStorage.setItem('lc_talk_name', name); if (phone) localStorage.setItem('lc_talk_phone', phone);
    TalkAudio.unlock();
    var micOk = await TalkAudio.prepareMic();
    if (!micOk) { err.innerHTML = 'We need your microphone to talk. On iPhone: Settings → Safari → Microphone → Allow, then try again.'; err.style.display = 'block'; return; }
    $('tk-go').textContent = 'Calling…'; $('tk-go').style.pointerEvents = 'none';
    var r = await sb.rpc('start_call', { p_name: name, p_phone: phone || null, p_dish_id: dish && dish.id, p_dish_name: dish && dish.name });
    if (r.error || !r.data || !r.data[0]) { err.textContent = r.error && /busy/.test(r.error.message) ? 'The line is busy right now — try again in a minute.' : 'Couldn\'t connect. Check your internet and try again.'; err.style.display = 'block'; $('tk-go').textContent = 'Call La Cabaña'; $('tk-go').style.pointerEvents = ''; return; }
    call = { id: r.data[0].call_id, token: r.data[0].token };
    sessionStorage.setItem('lc_talk_call', JSON.stringify(call));
    state = 'calling';
    setStatus('Calling La Cabaña…', 'wait');
    $('tk-panel').innerHTML = '';
    log('sys', 'Calling La Cabaña… a team member will pick up in a moment.');
    pttFooter(); $('tk-ptt').setAttribute('disabled', ''); $('tk-who').textContent = 'Waiting for someone to pick up';
    joinChannel();
    pollTimer = setInterval(poll, 3000);
  }

  function joinChannel() {
    chan = sb.channel('call-' + call.id, { config: { broadcast: { self: false, ack: false } } });
    chan.on('broadcast', { event: 'answered' }, function (m) { onAnswered(m.payload); })
      .on('broadcast', { event: 'ptt' }, function (m) { onRemotePtt(m.payload); })
      .on('broadcast', { event: 'audio' }, function (m) { onRemoteAudio(m.payload); })
      .on('broadcast', { event: 'order' }, function () { loadOrder(); })
      .on('broadcast', { event: 'hangup' }, function () { onRemoteHangup(); })
      .subscribe();
  }

  async function poll() {
    if (!call) return;
    var r = await sb.rpc('call_status', { p_call: call.id, p_token: call.token });
    var s = r.data;
    if (s === 'live' && state === 'calling') onAnswered({});
    if ((s === 'ended' || s === 'missed') && (state === 'live' || state === 'calling')) onRemoteHangup();
    if (state === 'live' || state === 'ordered') loadOrder(true);
  }

  function onAnswered(p) {
    if (state !== 'calling') return;
    state = 'live';
    setStatus('Connected · live', 'on');
    log('sys', (p && p.name ? esc(p.name) + ' from ' : '') + 'La Cabaña picked up. Hold the button and tell us your order.');
    $('tk-ptt').removeAttribute('disabled'); $('tk-who').textContent = 'Hold to talk';
    if (navigator.vibrate) navigator.vibrate(30);
  }

  var remoteBubble = null, remoteTimer = null;
  function onRemotePtt(p) {
    if (p.state === 'start') {
      remoteStart = Date.now();
      TalkAudio.remoteStart();
      remoteBubble = log('them', '<span>La Cabaña</span> ' + bars(0.2));
      $('tk-who').textContent = 'La Cabaña is talking…'; $('tk-who').className = 'tk-who live';
      var b = $('tk-ptt'); if (b) { b.classList.add('listen'); }
    } else {
      TalkAudio.remoteStop();
      if (remoteBubble) remoteBubble.innerHTML = '<span>La Cabaña</span> ' + bars(0.5) + ' <span style="opacity:.7">' + secs(Date.now() - remoteStart) + '</span>';
      remoteBubble = null;
      $('tk-who').textContent = 'Hold to talk'; $('tk-who').className = 'tk-who';
      var b2 = $('tk-ptt'); if (b2) b2.classList.remove('listen');
    }
  }
  function onRemoteAudio(frame) {
    var lvl = TalkAudio.play(frame);
    if (remoteBubble) remoteBubble.innerHTML = '<span>La Cabaña</span> ' + bars(lvl);
  }

  var myBubble = null;
  async function pttDown() {
    if (state !== 'live' && state !== 'ordered') return;
    if ($('tk-ptt').classList.contains('listen')) return;   // one person talks at a time, like a radio
    holding = true;
    $('tk-ptt').classList.add('down');
    talkStart = Date.now();
    chan.send({ type: 'broadcast', event: 'ptt', payload: { from: 'customer', state: 'start' } });
    myBubble = log('me', '<span>You</span> ' + bars(0.2));
    $('tk-who').textContent = 'You\'re live — release to send'; $('tk-who').className = 'tk-who live';
    try {
      await TalkAudio.startTalk(function (frame) {
        chan.send({ type: 'broadcast', event: 'audio', payload: frame });
      }, function (lvl) {
        $('tk-ring').style.transform = 'scale(' + (1 + lvl * 0.25) + ')';
        if (myBubble) myBubble.innerHTML = '<span>You</span> ' + bars(lvl);
      });
      if (!holding) finishTalk();   // released before the mic was ready
    } catch (e) { holding = false; $('tk-ptt').classList.remove('down'); $('tk-who').textContent = 'Microphone unavailable'; }
  }
  function pttUp() {
    if (!holding) return;
    holding = false;
    if (TalkAudio.isTalking()) finishTalk();
  }
  function finishTalk() {
    TalkAudio.stopTalk();
    $('tk-ptt').classList.remove('down'); $('tk-ring').style.transform = '';
    chan.send({ type: 'broadcast', event: 'ptt', payload: { from: 'customer', state: 'stop' } });
    if (myBubble) myBubble.innerHTML = '<span>You</span> ' + bars(0.5) + ' <span style="opacity:.8">' + secs(Date.now() - talkStart) + '</span>';
    myBubble = null;
    $('tk-who').textContent = 'Hold to talk'; $('tk-who').className = 'tk-who';
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
    if (!quiet) { if (navigator.vibrate) navigator.vibrate([20, 60, 20]); }
    log('sys', 'La Cabaña sent your order — review and pay below.');
    renderOrder(o);
  }
  function orderHTML(o) {
    return '<div class="tk-order"><h4><span>Order #' + o.order_number + '</span><span style="color:#ffb596">' + money(o.total) + '</span></h4>' +
      (o.items || []).map(function (it) {
        return '<div class="tk-line"><span>' + it.qty + '× ' + esc(it.name) + (it.note ? '<small>' + esc(it.note) + '</small>' : '') + '</span><span>' + money(it.price * it.qty) + '</span></div>';
      }).join('') +
      '<div class="tk-sum"><div><span>Subtotal</span><span>' + money(o.subtotal) + '</span></div><div><span>Tax</span><span>' + money(o.tax) + '</span></div><div class="t"><span>Total</span><span>' + money(o.total) + '</span></div></div>';
  }
  async function renderOrder(o) {
    $('tk-panel').innerHTML = orderHTML(o) + '<div id="tk-card"></div><div class="tk-err" id="tk-perr" style="display:none"></div>' +
      '<button class="tk-btn pri" id="tk-pay" style="display:block;width:100%;margin-top:12px;padding:15px 0;font-size:16px">Pay ' + money(o.total) + ' now</button>' +
      '<div style="text-align:center;color:#6B7280;font-size:12px;margin-top:8px">Secure card payment by Square. Something wrong? Just hold the button and tell us.</div></div>';
    $('tk-body').scrollTop = 1e6;
    $('tk-pay').onclick = pay;
    try {
      await load('https://web.squarecdn.com/v1/square.js');
      var payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
      if (card) { try { await card.destroy(); } catch (e) {} }
      card = await payments.card();
      await card.attach('#tk-card');
    } catch (e) { $('tk-card').innerHTML = '<div class="tk-err">Couldn\'t load the card form: ' + esc(e.message) + '</div>'; }
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
      '<div style="color:#9CA3AF;font-size:14px;margin-top:6px">Order #' + o.order_number + ' is in the kitchen. We\'ll have it ready for pickup at ' + esc(R().address || 'La Cabaña') + '.</div></div>' + orderHTML(o) + '</div>';
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-orders">View my orders</button><button class="tk-btn pri" id="tk-done">Done</button></div>';
    $('tk-orders').onclick = function () { hangUp(true); location.href = 'orders.html'; };
    $('tk-done').onclick = function () { hangUp(true); };
    setStatus('Order #' + o.order_number + ' paid', 'on');
    $('tk-body').scrollTop = 0;
  }

  function onRemoteHangup() {
    if (state === 'paid' || state === 'ended') return;
    state = 'ended';
    clearInterval(pollTimer);
    setStatus('Call ended', '');
    log('sys', 'La Cabaña ended the call.');
    TalkAudio.releaseMic();
    $('tk-foot').innerHTML = '<div class="tk-actions"><button class="tk-btn" id="tk-close2">Close</button>' + (order && order.status === 'sent' ? '<button class="tk-btn pri" id="tk-payl">Pay order</button>' : '') + '</div>';
    $('tk-close2').onclick = close;
    if ($('tk-payl')) $('tk-payl').onclick = function () { $('tk-body').scrollTop = 1e6; };
  }

  async function hangUp(silent) {
    if (holding) pttUp();
    clearInterval(pollTimer);
    if (call && (state === 'live' || state === 'calling' || state === 'ordered')) {
      try { chan && chan.send({ type: 'broadcast', event: 'hangup', payload: { from: 'customer' } }); } catch (e) {}
      try { await sb.rpc('customer_end_call', { p_call: call.id, p_token: call.token }); } catch (e) {}
    }
    TalkAudio.releaseMic();
    if (chan) { sb.removeChannel(chan); chan = null; }
    sessionStorage.removeItem('lc_talk_call');
    call = null; order = null; shownOrderId = null; state = 'idle';
    close(true);
  }

  // ---------- open / close ----------
  async function open(dishId) {
    build();
    dish = (window.findItem && dishId) ? findItem(dishId) : null;
    $('tk-dish').style.display = dish ? 'flex' : 'none';
    if (dish) $('tk-dish').innerHTML = '<img src="' + esc(dish.img) + '" alt=""><span>About <b style="color:#fff">' + esc(dish.name) + '</b> · ' + money(dish.price) + '</span>';
    $('tk-log').innerHTML = ''; $('tk-panel').innerHTML = ''; $('tk-foot').innerHTML = '';
    $('tk-bg').classList.add('open'); $('tk').classList.add('open');
    if (!TalkAudio.supported()) { setStatus('Not supported on this browser', ''); $('tk-panel').innerHTML = '<div style="padding:30px 10px;color:#9CA3AF;text-align:center">Voice ordering needs microphone access, which this browser doesn\'t allow. Open the app in Safari or Chrome.</div>'; return; }
    setStatus('Checking the line…', 'wait');
    try { await checkOps(); } catch (e) { opsOnline = false; }
    if (opsOnline) { setStatus('La Cabaña is online', 'on'); screenIntro(); } else screenOffline();
  }
  function close(force) {
    if (!force && (state === 'live' || state === 'calling' || state === 'ordered')) { if (!confirm('End the call with La Cabaña?')) return; return hangUp(); }
    $('tk-bg').classList.remove('open'); $('tk').classList.remove('open');
    if (opsChan && sb) { sb.removeChannel(opsChan); opsChan = null; }
  }
  // leaving the page ends the call (keepalive so the request survives the navigation)
  window.addEventListener('pagehide', function () {
    if (!call || state === 'paid' || state === 'ended') return;
    try { fetch(SB_URL + '/rest/v1/rpc/customer_end_call', { method: 'POST', keepalive: true, headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_call: call.id, p_token: call.token }) }); } catch (e) {}
  });

  // Button markup used next to "Add to Order" on every dish
  window.talkButtonHTML = function (id, extraClass) {
    return '<button onclick="event.stopPropagation();openTalk(\'' + id + '\')" class="' + (extraClass || 'h-9 px-3 rounded-xl bg-surface-raised hover:bg-surface-elevated text-primary font-label-md text-label-md flex items-center gap-1.5 transition-colors') + '" aria-label="Talk to order">' +
      '<span class="material-symbols-outlined text-[18px]">mic</span>Talk to order</button>';
  };
  window.openTalk = open;
})();
