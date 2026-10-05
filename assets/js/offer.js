/* Festival offer poster: "Diwali Offer, Flat 20% off" with dates, for the shop window or WhatsApp. */
(function () {
  "use strict";
  var P = window.DKPoster, DK = window.DK, $ = DK.$;
  var LOCALE = { en: "en-IN", hi: "hi-IN", te: "te-IN" };

  function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null; }
  function fmtDate(d, l) {
    try { return new Intl.DateTimeFormat(LOCALE[l] || "en-IN", { day: "numeric", month: "long" }).format(d); }
    catch (e) { return d.toDateString(); }
  }
  function dateVars(d) { return { en: fmtDate(d, "en"), hi: fmtDate(d, "hi"), te: fmtDate(d, "te") }; }

  // Small decorative lamps (diya) or stars along the top and bottom edges.
  function diya(ctx, x, y, r, body, flame) {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * 1.25, x + r, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = flame;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.15); ctx.quadraticCurveTo(x + r * 0.42, y - r * 0.35, x, y - r * 0.05);
    ctx.quadraticCurveTo(x - r * 0.42, y - r * 0.35, x, y - r * 1.15); ctx.fill();
  }
  function decorate(g, th, festId) {
    var ctx = g.ctx, u = g.u, n = g.landscape ? 9 : 6, step = (g.w - u * 16) / (n - 1);
    for (var i = 0; i < n; i++) {
      var x = u * 8 + step * i;
      if (festId === "diwali") { diya(ctx, x, u * 6.5, u * 2.2, th.accent, th.ink); diya(ctx, x, g.h - u * 7.5, u * 2.2, th.accent, th.ink); }
      else { P.star(ctx, x, u * 5.5, u * 1.4, th.accent); P.star(ctx, x, g.h - u * 6.5, u * 1.4, th.accent); }
    }
  }

  // Lays out the poster at scale k. With draw=false nothing is visible; it only measures.
  // Returns true when everything fits above the bottom edge (lamp row or credit line).
  function layout(g, o, th, k, draw) {
    var ctx = g.ctx, u = g.u, s = u * k, cx = g.w / 2, maxW = g.w - u * 14, y = u * 11;
    ctx.globalAlpha = draw ? 1 : 0;
    if (o.shop) y = P.textBlock(ctx, o.shop, cx, y, maxW, s * 6.5, s * 3.5, 2, th.ink, 800, 1.1) + s * 2;
    if (o.festival) y = P.phraseBlock(ctx, P.phrase("o_title", o.lang, { f: o.festival }), cx, y, maxW, s * 8.5, th.accent, th.muted, 2) + s * 3;

    // The offer itself, in a light panel so it reads from across the street.
    var panelX = u * 7, panelW = g.w - u * 14, pad = s * 4, inner = panelW - u * 8;
    var headSize = s * 11, head = P.fit(ctx, o.headline, inner, headSize, s * 5, 3, 900);
    var det = o.details ? P.fit(ctx, o.details, inner, s * 4.6, s * 3, 3, 600) : null;
    var headH = head.size * 1.3 + (head.lines.length - 1) * head.size * 1.12;
    var detH = det ? s * 2.5 + det.size * 1.3 + (det.lines.length - 1) * det.size * 1.25 : 0;
    var panelH = pad * 2 + headH + detH;
    ctx.fillStyle = th.panel; P.roundRect(ctx, panelX, y, panelW, panelH, u * 3); ctx.fill();
    var py = P.textBlock(ctx, o.headline, cx, y + pad, inner, headSize, s * 5, 3, th.panelInk, 900, 1.12);
    if (det) P.textBlock(ctx, o.details, cx, py + s * 2.5, inner, s * 4.6, s * 3, 3, th.panelInk, 600, 1.25);
    y += panelH + s * 4;

    var dl = null;
    if (o.from && o.to) dl = o.from.getTime() === o.to.getTime() ? P.phrase("o_on", o.lang, { a: dateVars(o.from) }) : P.phrase("o_range", o.lang, { a: dateVars(o.from), b: dateVars(o.to) });
    else if (o.to || o.from) dl = P.phrase("o_till", o.lang, { a: dateVars(o.to || o.from) });
    if (dl) y = P.phraseBlock(ctx, dl, cx, y, maxW, s * 4.2, th.ink, th.muted, 2) + s * 2.5;
    if (o.contact) y = P.textBlock(ctx, o.contact, cx, y, maxW, s * 4, s * 2.8, 2, th.ink, 600, 1.2) + s * 2;

    var limit = g.h - (o.decor ? u * 13 : u * 6), end = y;
    if (o.wishes && o.festival) {
      var wp = P.phrase("h_wishes", o.lang, { f: o.festival });
      ctx.globalAlpha = 0;
      var wh = P.phraseBlock(ctx, wp, cx, 0, maxW, s * 6.5, th.accent, th.accent, 2);
      ctx.globalAlpha = draw ? 1 : 0;
      var wy = Math.max(y + s * 1.5, limit - wh);
      P.phraseBlock(ctx, wp, cx, wy, maxW, s * 6.5, th.accent, th.accent, 2);
      end = wy + wh;
    }
    ctx.globalAlpha = 1;
    return end <= limit + 1;
  }

  function drawOffer(canvas, o) {
    var g = P.setup(canvas, o.size, o.landscape), ctx = g.ctx, u = g.u, th = P.THEMES[o.theme] || P.THEMES.maroon;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, g.w, g.h);
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.6; P.roundRect(ctx, u * 3, u * 3, g.w - u * 6, g.h - u * 6, u * 2.5); ctx.stroke(); }
    if (o.decor) decorate(g, th, o.festival && o.festival.id);
    var k = 1;
    while (k > 0.45 && !layout(g, o, th, k, false)) k -= 0.05;
    layout(g, o, th, k, true);
    P.credit(g, th.muted, o.credit);
    return k;
  }

  function festivalFrom(s) {
    if (s.fest === "custom") {
      var en = String(s.f_en || "").trim(); if (!en) return null;
      return { id: "custom", en: en, hi: String(s.f_hi || "").trim() || en, te: String(s.f_te || "").trim() || en };
    }
    if (s.fest === "none") return null;
    for (var i = 0; i < P.FESTIVALS.length; i++) if (P.FESTIVALS[i].id === s.fest) return P.FESTIVALS[i];
    return null;
  }

  var fsel = $("#fest");
  P.FESTIVALS.forEach(function (f) { var o = document.createElement("option"); o.value = f.id; o.textContent = f.en + " / " + f.hi + " / " + f.te; fsel.appendChild(o); });
  ["none", "custom"].forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v === "none" ? "No festival (general sale)" : "Other (type the name)"; fsel.appendChild(o); });

  window.DKTool.init({
    form: "#offer-form", preview: "#preview", storageKey: "dk-offer-v1",
    render: function (s, canvasAt) {
      $("#custom-fest").hidden = s.fest !== "custom";
      var headline = String(s.headline || "").trim(), demo = !headline;
      $("#demo-hint").hidden = !demo;
      var o = {
        lang: s.lang || "en+hi", theme: s.theme || "maroon", size: s.size || "A4", landscape: s.orient === "landscape",
        credit: s.credit !== false, decor: s.decor !== false, wishes: !!s.wishes,
        shop: String(s.shop || "").trim() || (demo ? "Sri Lakshmi Textiles" : ""),
        headline: headline || "Flat 20% off on all sarees",
        details: String(s.details || "").trim() || (demo ? "On bills above ₹1,000. Not valid with other offers." : ""),
        contact: String(s.contact || "").trim(),
        festival: festivalFrom(s), from: parseDate(s.d_from), to: parseDate(s.d_to)
      };
      var err = o.from && o.to && o.to < o.from ? "The last day cannot be before the first day." : "";
      DK.setError($("#d_to"), err);
      if (err) return { ok: false };
      var c = canvasAt(0); drawOffer(c, o);
      return { ok: true, size: o.size, landscape: o.landscape, canvases: [c], name: P.slug((o.festival ? o.festival.en + " " : "") + "offer poster"), alt: "Festival offer poster" };
    }
  });
  window.DKOffer = { drawOffer: drawOffer };
})();
