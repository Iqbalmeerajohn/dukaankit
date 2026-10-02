/* WhatsApp click-to-chat link, QR and poster. */
(function () {
  "use strict";
  var P = window.DKPoster, L = window.DKLinks, DK = window.DK, $ = DK.$;

  function pretty(cc, full) {
    var n = full.slice(cc.length);
    if (cc === "91" && n.length === 10) return "+91 " + n.slice(0, 5) + " " + n.slice(5);
    return "+" + cc + " " + n;
  }

  function drawWa(canvas, o) {
    var g = P.setup(canvas, o.size), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.leaf;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, g.w, g.h);
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.6; P.roundRect(ctx, u * 3, u * 3, g.w - u * 6, g.h - u * 6, u * 2.5); ctx.stroke(); }
    var y = u * 8;
    if (o.shop) { y = P.textBlock(ctx, o.shop, cx, y, u * 84, u * 8.5, u * 5, 2, th.ink, 800, 1.08); y += u * 2; }
    y = P.phraseBlock(ctx, P.phrase("wa_title", o.lang), cx, y, u * 86, u * 5.6, th.accent, th.muted, 2);
    y += u * 4;
    var bottom = g.h - (o.credit ? u * 5.5 : u * 3.5) - (o.note ? u * 9 : 0) - (o.lang.indexOf("+") > 0 ? u * 8 : u * 4.5);
    var extra = u * 5 + u * 3 + u * 6.5 + u * 3;
    var qr = Math.max(u * 30, Math.min(u * 62, bottom - y - extra - u * 2));
    var pw = qr + u * 12, ph = qr + extra, top = y + Math.max(0, (bottom - y - ph) / 2);
    ctx.fillStyle = th.panel; P.roundRect(ctx, cx - pw / 2, top, pw, ph, u * 3); ctx.fill();
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.3; ctx.stroke(); }
    var q = P.drawQr(ctx, o.link, cx - qr / 2, top + u * 5, qr, "#111111", "#ffffff", "M");
    P.textBlock(ctx, o.phone, cx, q.y + q.size + u * 2, pw - u * 6, u * 5.4, u * 3, 1, th.panelInk, 800);
    var by = bottom + u * 1.5;
    by = P.phraseBlock(ctx, P.phrase("wa_sub", o.lang), cx, by, u * 86, u * 3.8, th.ink, th.muted, 1);
    if (o.note) P.textBlock(ctx, o.note, cx, by + u * 1.5, u * 84, u * 4, u * 2.6, 2, th.accent, 700);
    P.credit(g, th.muted, o.credit);
  }

  window.DKTool.init({
    form: "#wa-form", preview: "#preview", storageKey: "dk-wa-v1",
    render: function (s, canvasAt) {
      var demo = !String(s.phone || "").trim();
      var n = L.normalisePhone(s.cc || "91", demo ? "9876543210" : s.phone);
      DK.setError($("#phone"), demo || n.ok ? "" : n.msg);
      if (!n.ok) return { ok: false };
      var cc = String(s.cc || "91").replace(/\D/g, "");
      var link = L.buildWaLink(n.value, s.msg);
      var c = canvasAt(0);
      drawWa(c, { link: link, phone: pretty(cc, n.value), shop: String(s.shop || "").trim(), note: String(s.note || "").trim(),
        lang: s.lang || "en+hi", theme: s.theme || "leaf", size: s.size || "A5", credit: s.credit !== false });
      return { ok: !demo, demo: demo, canvases: [c], size: s.size || "A5", qrText: link, copyText: link, link: link,
        name: "whatsapp-qr-" + P.slug(s.shop || n.value), alt: "WhatsApp chat QR poster" };
    },
    after: function (res) {
      $("#demo-hint").hidden = !(res && res.demo);
      if (res && res.link) { $("#link-out").textContent = res.link; $("#test-link").href = res.link; }
      $("#test-link").hidden = !(res && res.ok);
    }
  });
  window.DKWa = { draw: drawWa };
})();
