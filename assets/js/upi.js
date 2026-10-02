/* UPI payment QR standee. Builds upi://pay?pa=..&pn=..&am=..&cu=INR and draws a print-ready poster. */
(function () {
  "use strict";
  var P = window.DKPoster, L = window.DKLinks, DK = window.DK;
  var $ = DK.$;

  function drawUpi(canvas, o) {
    var g = P.setup(canvas, o.size), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.leaf;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, g.w, g.h);
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.6; P.roundRect(ctx, u * 3, u * 3, g.w - u * 6, g.h - u * 6, u * 2.5); ctx.stroke(); }

    var y = u * 8.5;
    y = P.textBlock(ctx, o.shop || o.pn || "Your Shop", cx, y, u * 84, u * 9.5, u * 5, 2, th.ink, 800, 1.08);
    y += u * 2.2;
    y = P.phraseBlock(ctx, P.phrase("upi_scan", o.lang), cx, y, u * 84, u * 4.8, th.accent, th.muted, 2);
    y += u * 4;

    var bottom = g.h - (o.credit ? u * 5.5 : u * 3.5) - (o.note ? (o.lang.indexOf("+") > 0 ? u * 13 : u * 8) : 0);
    var extra = u * 5 + u * 3 + u * 5.2 + u * 4.2 + (o.am ? u * 9.5 : 0) + u * 4;
    var qr = Math.max(u * 30, Math.min(u * 64, bottom - y - extra - u * 2));
    var pw = qr + u * 12, ph = qr + extra;
    var top = y + Math.max(0, (bottom - y - ph) / 2);
    ctx.fillStyle = th.panel; P.roundRect(ctx, cx - pw / 2, top, pw, ph, u * 3); ctx.fill();
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.3; ctx.stroke(); }
    var q = P.drawQr(ctx, o.uri, cx - qr / 2, top + u * 5, qr, "#111111", "#ffffff", "M");
    var ty = q.y + q.size + u * 2;
    ty = P.textBlock(ctx, o.pn, cx, ty, pw - u * 6, u * 4.6, u * 3, 1, th.panelInk, 750);
    ty = P.textBlock(ctx, o.pa, cx, ty + u * 0.4, pw - u * 6, u * 3.5, u * 2.4, 1, th.panelInk, 500);
    if (o.am) {
      var amt = "₹ " + window.DKInvoice.formatPaise(Math.round(Number(o.am) * 100));
      P.textBlock(ctx, amt, cx, ty + u * 1.2, pw - u * 6, u * 7.5, u * 4, 1, th.panelInk, 800);
    }
    if (o.note) P.phraseBlock(ctx, P.phrase("upi_show", o.lang), cx, bottom + u * 1.5, u * 86, u * 3.4, th.ink, th.muted, 2);
    P.credit(g, th.muted, o.credit);
    return g;
  }

  var tool = window.DKTool.init({
    form: "#upi-form", preview: "#preview", storageKey: "dk-upi-v1",
    render: function (s, canvasAt) {
      var id = L.validateUpiId(s.pa), amt = L.normaliseAmount(s.am), name = String(s.pn || "").trim();
      DK.setError($("#pa"), s.pa ? (id.ok ? "" : id.msg) : "");
      DK.setError($("#am"), amt.ok ? "" : amt.msg);
      DK.setError($("#pn"), name.length > 60 ? "Keep the name under 60 characters." : "");
      var demo = !s.pa;
      if ((!demo && !id.ok) || !amt.ok || name.length > 60) return { ok: false };
      var pa = demo ? "yourname@bank" : id.value;
      var pn = name || (demo ? "Your Name" : "");
      var uri = L.buildUpiUri({ pa: pa, pn: pn, am: amt.value });
      var c = canvasAt(0);
      drawUpi(c, { uri: uri, pa: pa, pn: pn, am: amt.value, shop: s.shop, lang: s.lang || "en+hi", theme: s.theme || "leaf", size: s.size || "A5", note: !!s.note, credit: s.credit !== false });
      return {
        ok: !demo, demo: demo, canvases: [c], size: s.size || "A5", uri: uri, qrText: uri, copyText: uri,
        name: "upi-qr-" + P.slug(s.shop || pn || pa.split("@")[0]), alt: "UPI payment poster for " + (s.shop || pn)
      };
    },
    after: function (res) {
      var out = $("#uri-out"), test = $("#test-link"), hint = $("#demo-hint");
      if (res && res.uri) { out.textContent = res.uri; test.href = res.uri; }
      hint.hidden = !(res && res.demo);
      test.hidden = !(res && res.ok);
    }
  });
  window.DKUpi = { draw: drawUpi, tool: tool };
})();
