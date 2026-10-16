// Meta Pixel (dataset 946047957310923, ad account La Cabana Grill). Sends PageView on every page,
// AddToCart from cart.js, InitiateCheckout on the cart page and Purchase after payment (cart.html).
// Purchase uses the order reference as eventID, the same id api/_meta.js sends server-side, so Meta counts it once.
// Also keeps the ad click info (utm_*, fbclid) for 7 days so the order can be tied to the ad that brought it.
(function () {
  if (window.fbq || /^(localhost|127\.)/.test(location.hostname)) { window.lcTrack = window.lcTrack || function () {}; return; }
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '946047957310923');
  fbq('track', 'PageView');

  var KEY = 'lc_ad_click';
  try {
    var q = new URLSearchParams(location.search), got = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(function (k) { if (q.get(k)) got[k] = q.get(k).slice(0, 200); });
    if (Object.keys(got).length) { got.at = Date.now(); localStorage.setItem(KEY, JSON.stringify(got)); }
  } catch (e) {}

  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  // for the server-side Purchase: browser id, click id and the ad that brought this visitor
  window.lcAdMeta = function () {
    var a = {};
    try { a = JSON.parse(localStorage.getItem(KEY)) || {}; if (Date.now() - (a.at || 0) > 7 * 864e5) a = {}; } catch (e) {}
    var fbc = cookie('_fbc') || (a.fbclid ? 'fb.1.' + (a.at || Date.now()) + '.' + a.fbclid : '');
    return { fbp: cookie('_fbp'), fbc: fbc, url: location.href.split('#')[0], utm: a };
  };
  window.lcTrack = function (name, data, eventId) {
    try { if (eventId) fbq('track', name, data || {}, { eventID: eventId }); else fbq('track', name, data || {}); } catch (e) {}
  };
})();
