/* Open/Closed sign, shop timings board and festival holiday notice. */
(function () {
  "use strict";
  var P = window.DKPoster, DK = window.DK, $ = DK.$, $$ = DK.$$;
  var LOCALE = { en: "en-IN", hi: "hi-IN", te: "te-IN" };

  function fmtTime(t) {
    var m = /^(\d{1,2}):(\d{2})/.exec(t || ""); if (!m) return "";
    var h = Number(m[1]), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return h + ":" + m[2] + " " + ap;
  }
  function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null; }
  function fmtDate(d, l) {
    try { return new Intl.DateTimeFormat(LOCALE[l] || "en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d); }
    catch (e) { return d.toDateString(); }
  }
  function dateVars(d) { return { en: fmtDate(d, "en"), hi: fmtDate(d, "hi"), te: fmtDate(d, "te") }; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function frame(g, th, bg) {
    var ctx = g.ctx, u = g.u;
    ctx.fillStyle = bg || th.bg; ctx.fillRect(0, 0, g.w, g.h);
    if (th.border) { ctx.strokeStyle = th.border; ctx.lineWidth = u * 0.6; P.roundRect(ctx, u * 3, u * 3, g.w - u * 6, g.h - u * 6, u * 2.5); ctx.stroke(); }
  }

  function drawOpenClosed(canvas, o, isOpen) {
    var g = P.setup(canvas, o.size, o.landscape), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.leaf;
    var bg = isOpen ? th.bg : th.panel, ink = isOpen ? th.ink : th.panelInk, acc = isOpen ? th.accent : (th.bg === th.panel ? th.accent : th.bg);
    var muted = isOpen ? th.muted : "rgba(0,0,0,.6)";
    frame(g, th, bg);
    if (!isOpen) { ctx.strokeStyle = acc; ctx.lineWidth = u * 1.6; P.roundRect(ctx, u * 4, u * 4, g.w - u * 8, g.h - u * 8, u * 3); ctx.stroke(); }
    var parts = P.phrase(isOpen ? "open" : "closed", o.lang), maxW = g.w - u * 16;
    var big = o.landscape ? u * 34 : u * 24;
    var y = o.shop ? u * 10 : u * 14;
    if (o.shop) y = P.textBlock(ctx, o.shop, cx, y, maxW, u * 6.5, u * 3.5, 1, ink, 750) + u * 3;
    var blockH = big * 1.1 + (parts.length > 1 ? big * 0.5 : 0) + u * 12 + (o.hours ? u * 7 : 0);
    y = Math.max(y, (g.h - blockH) / 2 - u * 2);
    parts.forEach(function (p, i) {
      var s = p.primary ? big : big * 0.42;
      y = P.textBlock(ctx, p.text, cx, y + (i ? u * 2 : 0), maxW, s, s * 0.4, 1, p.primary ? acc : ink, 900);
    });
    y += u * 3;
    y = P.phraseBlock(ctx, P.phrase(isOpen ? "open_sub" : "closed_sub", o.lang), cx, y, maxW, u * 4.6, ink, muted, 1);
    if (o.hours) P.textBlock(ctx, o.hours, cx, y + u * 3, maxW, u * 5, u * 3, 1, ink, 700);
    P.credit(g, muted, o.credit);
  }

  function drawTimings(canvas, o) {
    var g = P.setup(canvas, o.size, o.landscape), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.leaf;
    frame(g, th);
    var y = u * 8;
    if (o.shop) y = P.textBlock(ctx, o.shop, cx, y, g.w - u * 14, u * 7, u * 4, 2, th.ink, 800, 1.1) + u * 1.5;
    y = P.phraseBlock(ctx, P.phrase("timings", o.lang), cx, y, g.w - u * 14, u * 6, th.accent, th.muted, 1) + u * 4;
    var langs = o.lang.split("+");
    var rows = o.days.map(function (d, i) {
      var name = langs.map(function (l) { return P.DAYS[l][i]; }).join(" / ");
      var t = d.open ? fmtTime(d.from) + " - " + fmtTime(d.to) : langs.map(function (l) { return P.T.day_closed[l]; }).join(" / ");
      return { name: name, time: t, closed: !d.open };
    });
    if (o.lunch) rows.push({ name: langs.map(function (l) { return P.T.lunch[l]; }).join(" / "), time: fmtTime(o.lunchFrom) + " - " + fmtTime(o.lunchTo), lunch: true });
    var pw = g.w - u * 14, px = u * 7;
    var bottom = g.h - (o.credit ? u * 6 : u * 4);
    var rowH = Math.min(u * 10, (bottom - y - u * 4) / rows.length);
    var ph = rowH * rows.length + u * 4;
    ctx.fillStyle = th.panel; P.roundRect(ctx, px, y, pw, ph, u * 2.5); ctx.fill();
    var fs = Math.min(rowH * 0.42, u * 4.2);
    rows.forEach(function (r, i) {
      var ry = y + u * 2 + i * rowH;
      if (i) { ctx.fillStyle = "rgba(0,0,0,.09)"; ctx.fillRect(px + u * 3, ry, pw - u * 6, Math.max(1, u * 0.2)); }
      ctx.textAlign = "left"; ctx.fillStyle = th.panelInk;
      var nameFit = P.fit(ctx, r.name, pw * 0.5, fs, fs * 0.6, 1, r.lunch ? 600 : 700);
      ctx.font = P.font(nameFit.size, r.lunch ? 600 : 700); ctx.fillText(nameFit.lines[0], px + u * 4, ry + rowH * 0.5 + nameFit.size * 0.35);
      ctx.textAlign = "right"; ctx.fillStyle = r.closed ? (th.bg === th.panel ? th.accent : th.bg) : th.panelInk;
      var tFit = P.fit(ctx, r.time, pw * 0.42, fs, fs * 0.6, 1, r.closed ? 800 : 600);
      ctx.font = P.font(tFit.size, r.closed ? 800 : 600); ctx.fillText(tFit.lines[0], px + pw - u * 4, ry + rowH * 0.5 + tFit.size * 0.35);
    });
    ctx.textAlign = "center";
    P.credit(g, th.muted, o.credit);
  }

  function drawHoliday(canvas, o) {
    var g = P.setup(canvas, o.size, o.landscape), ctx = g.ctx, u = g.u, cx = g.w / 2, th = P.THEMES[o.theme] || P.THEMES.maroon;
    frame(g, th);
    var maxW = g.w - u * 14, y = u * 8, f = o.festival;
    if (o.shop) y = P.textBlock(ctx, o.shop, cx, y, maxW, u * 5.5, u * 3.5, 1, th.muted, 700) + u * 3;
    y = P.phraseBlock(ctx, P.phrase("h_closed", o.lang), cx, y, maxW, u * 10, th.ink, th.ink, 2) + u * 2;
    if (f) y = P.phraseBlock(ctx, P.phrase("h_account", o.lang, { f: f }), cx, y, maxW, u * 5.5, th.accent, th.muted, 2) + u * 4;
    var panelTop = y, lines = [];
    if (o.from) lines.push(o.to && iso(o.to) !== iso(o.from) ? P.phrase("h_range", o.lang, { a: dateVars(o.from), b: dateVars(o.to) }) : P.phrase("h_on", o.lang, { a: dateVars(o.from) }));
    if (o.reopen) lines.push(P.phrase("h_reopen", o.lang, { d: dateVars(o.reopen) }));
    if (lines.length) {
      // measure by drawing off-screen first
      var est = lines.reduce(function (a, l) { return a + l.length * u * 6.5; }, 0) + u * 6;
      ctx.fillStyle = th.panel; P.roundRect(ctx, u * 7, panelTop, g.w - u * 14, est, u * 2.5); ctx.fill();
      var py = panelTop + u * 3;
      lines.forEach(function (l, i) { py = P.phraseBlock(ctx, l, cx, py + (i ? u * 2 : 0), maxW - u * 8, u * 4.6, th.panelInk, th.panelInk, 2); });
      y = panelTop + est + u * 4;
    }
    if (o.sorry) y = P.phraseBlock(ctx, P.phrase("h_sorry", o.lang), cx, y, maxW, u * 3.8, th.ink, th.muted, 1) + u * 3;
    if (o.wishes && f) {
      var wy = Math.max(y + u * 2, g.h - u * (o.lang.indexOf("+") > 0 ? 24 : 17));
      P.phraseBlock(ctx, P.phrase("h_wishes", o.lang, { f: f }), cx, wy, maxW, u * 7, th.accent, th.accent, 2);
    }
    P.credit(g, th.muted, o.credit);
  }

  function festivalFrom(s) {
    if (s.fest === "custom") {
      var en = String(s.f_en || "").trim(); if (!en) return null;
      return { en: en, hi: String(s.f_hi || "").trim() || en, te: String(s.f_te || "").trim() || en };
    }
    if (s.fest === "none") return null;
    for (var i = 0; i < P.FESTIVALS.length; i++) if (P.FESTIVALS[i].id === s.fest) return P.FESTIVALS[i];
    return null;
  }

  function showMode(mode) {
    $$("[data-mode]").forEach(function (el) { el.hidden = el.getAttribute("data-mode").split(" ").indexOf(mode) === -1; });
  }

  // Build the day rows once.
  var daysBox = $("#days");
  P.DAYS.en.forEach(function (d, i) {
    var row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = '<label class="check"><input type="checkbox" name="open_' + i + '"' + (i < 6 ? " checked" : "") + '> ' + d + '</label>' +
      '<input type="time" name="from_' + i + '" value="09:00" aria-label="' + d + ' opens at">' +
      '<input type="time" name="to_' + i + '" value="21:00" aria-label="' + d + ' closes at">';
    daysBox.appendChild(row);
  });
  $("#copy-mon").addEventListener("click", function () {
    var f = $('[name="from_0"]').value, t = $('[name="to_0"]').value;
    for (var i = 1; i < 7; i++) { $('[name="from_' + i + '"]').value = f; $('[name="to_' + i + '"]').value = t; }
    $("#sign-form").dispatchEvent(new Event("input"));
  });
  var fsel = $("#fest");
  P.FESTIVALS.forEach(function (f) { var o = document.createElement("option"); o.value = f.id; o.textContent = f.en + " / " + f.hi + " / " + f.te; fsel.appendChild(o); });
  ["none", "custom"].forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v === "none" ? "No festival (general holiday)" : "Other (type the name)"; fsel.appendChild(o); });

  window.DKTool.init({
    form: "#sign-form", preview: "#preview", storageKey: "dk-sign-v1",
    render: function (s, canvasAt) {
      var mode = s.mode || "openclosed"; showMode(mode);
      $("#custom-fest").hidden = mode !== "holiday" || s.fest !== "custom";
      var base = { lang: s.lang || "en+hi", theme: s.theme || "leaf", size: s.size || "A4", landscape: s.orient === "landscape", credit: s.credit !== false, shop: String(s.shop || "").trim() };
      var out = { ok: true, size: base.size, landscape: base.landscape, canvases: [] };
      if (mode === "openclosed") {
        base.hours = String(s.hours || "").trim();
        var a = canvasAt(0), b = canvasAt(1);
        drawOpenClosed(a, base, true); drawOpenClosed(b, base, false);
        out.canvases = [a, b]; out.pageNames = ["open", "closed"]; out.name = "open-closed-sign"; out.alt = "Open and Closed sign";
      } else if (mode === "timings") {
        base.days = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return { open: !!s["open_" + i], from: s["from_" + i], to: s["to_" + i] }; });
        base.lunch = !!s.lunch; base.lunchFrom = s.lunch_from; base.lunchTo = s.lunch_to;
        var c = canvasAt(0); drawTimings(c, base);
        out.canvases = [c]; out.name = "shop-timings"; out.alt = "Shop timings board";
      } else {
        base.festival = festivalFrom(s);
        base.from = parseDate(s.d_from); base.to = parseDate(s.d_to);
        var err = base.from && base.to && base.to < base.from ? "The last day cannot be before the first day." : "";
        DK.setError($("#d_to"), err);
        if (err) return { ok: false };
        base.reopen = parseDate(s.d_reopen);
        if (!base.reopen && base.from && s.auto_reopen !== false) { base.reopen = new Date((base.to || base.from).getTime() + 864e5); }
        base.sorry = !!s.sorry; base.wishes = !!s.wishes;
        if (!base.theme || !s.theme) base.theme = "maroon";
        var h = canvasAt(0); drawHoliday(h, base);
        out.canvases = [h]; out.name = "holiday-notice-" + P.slug(base.festival ? base.festival.en : "shop"); out.alt = "Holiday notice";
      }
      return out;
    },
    after: function (res, s) {
      var r = $("#reopen-hint");
      if (r) r.textContent = s.d_from && !s.d_reopen ? "Reopening date is set to the day after the last holiday. Change it if needed." : "";
    }
  });
  window.DKSign = { drawOpenClosed: drawOpenClosed, drawTimings: drawTimings, drawHoliday: drawHoliday, fmtTime: fmtTime };
})();
