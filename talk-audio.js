// La Cabaña Grill — live push-to-talk audio engine (shared by the customer app and the operator screen).
// Hold to talk: the mic is captured, downsampled to 16 kHz, compressed with μ-law (8-bit) and sent in
// ~160 ms frames. The other side plays frames as they arrive with a small jitter buffer, so it sounds live.
(function () {
  var RATE = 16000, FRAME = 2560; // 160 ms per frame
  var ctx = null, stream = null, source = null, proc = null, sending = false, onFrame = null, onLevel = null;
  var buf = new Int16Array(FRAME), bufLen = 0, seq = 0, resamplePos = 0, playHead = 0, playing = 0, lastRx = 0;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---- μ-law codec ----
  function linToMu(s) {
    var sign = (s >> 8) & 0x80; if (sign) s = -s; if (s > 32635) s = 32635; s += 0x84;
    var exp = 7; for (var m = 0x4000; (s & m) === 0 && exp > 0; exp--, m >>= 1) {}
    var man = (s >> (exp + 3)) & 0x0F; return ~(sign | (exp << 4) | man) & 0xFF;
  }
  function muToLin(u) {
    u = ~u & 0xFF; var sign = u & 0x80, exp = (u >> 4) & 7, man = u & 0x0F;
    var s = ((man << 3) + 0x84) << exp; s -= 0x84; return sign ? -s : s;
  }
  function b64(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
  function unb64(str) { var s = atob(str), out = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }

  function flush() {
    if (!bufLen || !onFrame) { bufLen = 0; return; }
    var bytes = new Uint8Array(bufLen);
    for (var i = 0; i < bufLen; i++) bytes[i] = linToMu(buf[i]);
    onFrame({ seq: seq++, d: b64(bytes) });
    bufLen = 0;
  }

  function onAudio(e) {
    var out = e.outputBuffer.getChannelData(0); for (var j = 0; j < out.length; j++) out[j] = 0; // stay silent locally
    if (!sending) return;
    var input = e.inputBuffer.getChannelData(0), ratio = ctx.sampleRate / RATE, sum = 0;
    for (var k = 0; k < input.length; k++) sum += input[k] * input[k];
    if (onLevel) onLevel(Math.min(1, Math.sqrt(sum / input.length) * 4));
    // resample to 16 kHz (linear interpolation)
    while (resamplePos < input.length - 1) {
      var i0 = Math.floor(resamplePos), f = resamplePos - i0, v = input[i0] * (1 - f) + input[i0 + 1] * f;
      buf[bufLen++] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      if (bufLen === FRAME) flush();
      resamplePos += ratio;
    }
    resamplePos -= input.length;
  }

  // short two-tone chirp like a radio key-up
  function chirp(up) {
    try {
      var c = ensureCtx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(up ? 880 : 1175, t); o.frequency.setValueAtTime(up ? 1175 : 880, t + 0.06);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.15);
    } catch (e) {}
  }

  window.TalkAudio = {
    supported: function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)); },
    unlock: function () { ensureCtx(); try { var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {} },
    // Ask for the microphone once (call from a tap). Resolves true/false.
    prepareMic: async function () {
      try {
        ensureCtx();
        if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
        return true;
      } catch (e) { return false; }
    },
    // Start sending: frameCb({seq, d}) for each ~160 ms frame, levelCb(0..1) for the meter
    startTalk: async function (frameCb, levelCb, sourceOverride) {
      ensureCtx();
      if (!sourceOverride && !stream) { var ok = await this.prepareMic(); if (!ok) throw new Error('mic'); }
      onFrame = frameCb; onLevel = levelCb; seq = 0; bufLen = 0; resamplePos = 0;
      source = sourceOverride || ctx.createMediaStreamSource(stream);
      proc = ctx.createScriptProcessor(2048, 1, 1);
      proc.onaudioprocess = onAudio;
      source.connect(proc); proc.connect(ctx.destination);
      sending = true; chirp(true);
    },
    stopTalk: function () {
      if (!sending) return;
      sending = false; flush();
      try { source && source.disconnect(); proc && proc.disconnect(); } catch (e) {}
      source = null; proc = null; onLevel && onLevel(0); chirp(false);
    },
    // Release the mic completely (end of call) so iPhone audio goes back to the speaker
    releaseMic: function () { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } },
    // Play an incoming frame; returns the frame's level for the meter
    play: function (frame) {
      var c = ensureCtx(), bytes = unb64(frame.d), n = bytes.length;
      var ab = c.createBuffer(1, n, RATE), data = ab.getChannelData(0), sum = 0;
      for (var i = 0; i < n; i++) { var v = muToLin(bytes[i]) / 32768; data[i] = v; sum += v * v; }
      var src = c.createBufferSource(); src.buffer = ab; src.connect(c.destination);
      var now = c.currentTime;
      if (playHead < now + 0.05 || now - lastRx > 1) playHead = now + 0.18;   // jitter buffer (~180 ms) at the start of each turn
      src.start(playHead); playHead += ab.duration; lastRx = now;
      playing++; src.onended = function () { playing--; };
      return Math.min(1, Math.sqrt(sum / n) * 4);
    },
    remoteStart: function () { chirp(true); },
    remoteStop: function () { setTimeout(function () { chirp(false); }, Math.max(0, (playHead - (ctx ? ctx.currentTime : 0)) * 1000)); },
    isTalking: function () { return sending; },
    context: function () { return ensureCtx(); }
  };
})();
