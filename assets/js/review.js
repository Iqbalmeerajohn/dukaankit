/* Google review QR poster. */
(function () {
  "use strict";
  var P = window.DKPoster, L = window.DKLinks, DK = window.DK, $ = DK.$;

  function drawReview(canvas, o) {
    var g = P.setup(canvas, o.size), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.indigo;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, g.w, g.h);
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.6; P.roundRect(ctx, u * 3, u * 3, g.w - u * 6, g.h - u * 6, u * 2.5); ctx.stroke(); }
    var y = u * 8;
    y = P.phraseBlock(ctx, P.phrase("rev_title", o.lang), cx, y, u * 86, u * 10, th.ink, th.muted, 2);
    y += u * 1.5;
    y = P.phraseBlock(ctx, P.phrase("rev_sub", o.lang), cx, y, u * 86, u * 5.2, th.accent, th.muted, 2);
    y += u * 4;
    for (var i = 0; i < 5; i++) P.star(ctx, cx + (i - 2) * u * 9.5, y + u * 3.5, u * 3.8, th.accent);
    y += u * 10;
    var bottom = g.h - (o.credit ? u * 5.5 : u * 3.5) - (o.lang.indexOf("+") > 0 ? u * 15 : u * 10);
    var extra = u * 5 + u * 4 + (o.shop ? u * 6 : 0) + u * 3;
    var qr = Math.max(u * 30, Math.min(u * 60, bottom - y - extra - u * 2));
    var pw = qr + u * 12, ph = qr + extra, top = y + Math.max(0, (bottom - y - ph) / 2);
    ctx.fillStyle = th.panel; P.roundRect(ctx, cx - pw / 2, top, pw, ph, u * 3); ctx.fill();
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.3; ctx.stroke(); }
    var q = P.drawQr(ctx, o.link, cx - qr / 2, top + u * 5, qr, "#111111", "#ffffff", "M");
    if (o.shop) P.textBlock(ctx, o.shop, cx, q.y + q.size + u * 2, pw - u * 6, u * 4.8, u * 3, 1, th.panelInk, 750);
    var by = bottom + u * 1.5;
    by = P.phraseBlock(ctx, P.phrase("rev_steps", o.lang), cx, by, u * 86, u * 3.6, th.ink, th.muted, 2);
    P.phraseBlock(ctx, P.phrase("rev_thanks", o.lang.split("+")[0]), cx, by + u * 1, u * 86, u * 3.2, th.muted, th.muted, 1);
    P.credit(g, th.muted, o.credit);
  }

  window.DKTool.init({
    form: "#review-form", preview: "#preview", storageKey: "dk-review-v1",
    render: function (s, canvasAt) {
      var r = L.checkReviewLink(s.link), demo = !String(s.link || "").trim();
      DK.setError($("#link"), demo || r.ok ? "" : r.msg);
      $("#link-warn").textContent = !demo && r.ok ? (r.warn || r.note || "") : "";
      if (!demo && !r.ok) return { ok: false };
      var link = demo ? "https://g.page/r/your-review-link/review" : r.value;
      var c = canvasAt(0);
      drawReview(c, { link: link, shop: String(s.shop || "").trim(), lang: s.lang || "en+hi", theme: s.theme || "indigo", size: s.size || "A5", credit: s.credit !== false });
      return { ok: !demo, demo: demo, canvases: [c], size: s.size || "A5", qrText: link, copyText: link, link: link,
        name: "google-review-qr-" + P.slug(s.shop || "shop"), alt: "Google review QR poster" };
    },
    after: function (res) {
      $("#demo-hint").hidden = !(res && res.demo);
      if (res && res.link) { $("#link-out").textContent = res.link; $("#test-link").href = res.link; }
      $("#test-link").hidden = !(res && res.ok);
    }
  });
  window.DKReview = { draw: drawReview };
})();
