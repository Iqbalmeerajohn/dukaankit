/* DukaanKit poster engine: canvas drawing, QR rendering, PNG/PDF export, print.
   Runs fully in the browser. Nothing is uploaded. */
(function (root) {
  "use strict";

  var FONT = '"Noto Sans", "Nirmala UI", "Noto Sans Devanagari", "Noto Sans Telugu", "Segoe UI", Roboto, Arial, sans-serif';

  // Paper sizes in PDF points (1/72 inch) and the pixel width we render at (portrait).
  var FORMATS = {
    A4: { label: "A4", wPt: 595.28, hPt: 841.89, px: 1754 },
    A5: { label: "A5", wPt: 419.53, hPt: 595.28, px: 1480 },
    A6: { label: "A6", wPt: 297.64, hPt: 419.53, px: 1240 }
  };

  var THEMES = {
    leaf:    { name: "Leaf green",   bg: "#0f5132", ink: "#f6faf7", accent: "#ffd166", panel: "#fcfdfb", panelInk: "#122018", muted: "rgba(246,250,247,.72)" },
    saffron: { name: "Saffron",      bg: "#d9620b", ink: "#fffaf3", accent: "#1f1a14", panel: "#fffdf9", panelInk: "#1f1a14", muted: "rgba(255,250,243,.78)" },
    indigo:  { name: "Indigo",       bg: "#23306a", ink: "#f4f6fc", accent: "#ffcf4a", panel: "#fbfcff", panelInk: "#151b38", muted: "rgba(244,246,252,.72)" },
    yellow:  { name: "Yellow & ink", bg: "#ffd23f", ink: "#17140f", accent: "#17140f", panel: "#fffef8", panelInk: "#17140f", muted: "rgba(23,20,15,.7)" },
    maroon:  { name: "Maroon",       bg: "#76202b", ink: "#fff5ef", accent: "#f2c14e", panel: "#fffbf8", panelInk: "#2a1014", muted: "rgba(255,245,239,.72)" },
    white:   { name: "Plain white",  bg: "#fbfbf9", ink: "#16201b", accent: "#0f6b4f", panel: "#ffffff", panelInk: "#16201b", muted: "rgba(22,32,27,.66)", border: "#16201b" }
  };

  /* ---------- poster text in English, Hindi, Telugu ---------- */
  var T = {
    upi_scan:   { en: "Scan & Pay with any UPI app", hi: "किसी भी UPI ऐप से स्कैन करके भुगतान करें", te: "ఏ UPI యాప్‌తోనైనా స్కాన్ చేసి చెల్లించండి" },
    upi_show:   { en: "Please show the payment screen at the counter", hi: "भुगतान के बाद कृपया स्क्रीन काउंटर पर दिखाएँ", te: "చెల్లించిన తర్వాత దయచేసి స్క్రీన్‌ను కౌంటర్‌లో చూపించండి" },
    amount:     { en: "Amount", hi: "राशि", te: "మొత్తం" },
    rev_title:  { en: "Loved us?", hi: "हमारी सेवा पसंद आई?", te: "మా సేవ నచ్చిందా?" },
    rev_sub:    { en: "Review us on Google", hi: "Google पर हमें रिव्यू दें", te: "Googleలో మాకు రివ్యూ ఇవ్వండి" },
    rev_steps:  { en: "Scan the code, tap the stars, write a line", hi: "कोड स्कैन करें, स्टार चुनें, दो शब्द लिखें", te: "కోడ్ స్కాన్ చేయండి, స్టార్స్ ఎంచుకోండి, రెండు మాటలు రాయండి" },
    rev_thanks: { en: "Thank you for your support", hi: "आपके सहयोग के लिए धन्यवाद", te: "మీ ఆదరణకు ధన్యవాదాలు" },
    wa_title:   { en: "Chat with us on WhatsApp", hi: "WhatsApp पर हमसे बात करें", te: "WhatsAppలో మాతో మాట్లాడండి" },
    wa_sub:     { en: "Scan to send us a message", hi: "मैसेज भेजने के लिए स्कैन करें", te: "మెసేజ్ పంపడానికి స్కాన్ చేయండి" },
    open:       { en: "OPEN", hi: "खुला है", te: "తెరిచి ఉంది" },
    closed:     { en: "CLOSED", hi: "बंद है", te: "మూసి ఉంది" },
    open_sub:   { en: "Come in, we are open", hi: "आइए, दुकान खुली है", te: "రండి, దుకాణం తెరిచి ఉంది" },
    closed_sub: { en: "Sorry, we are closed", hi: "क्षमा करें, दुकान बंद है", te: "క్షమించండి, దుకాణం మూసి ఉంది" },
    timings:    { en: "Shop Timings", hi: "दुकान का समय", te: "దుకాణం వేళలు" },
    day_closed: { en: "Closed", hi: "बंद", te: "సెలవు" },
    lunch:      { en: "Lunch break", hi: "भोजन अवकाश", te: "భోజన విరామం" },
    h_closed:   { en: "Shop closed", hi: "दुकान बंद रहेगी", te: "దుకాణానికి సెలవు" },
    h_account:  { en: "on account of {f}", hi: "{f} के अवसर पर", te: "{f} సందర్భంగా" },
    h_range:    { en: "{a} to {b}", hi: "{a} से {b} तक", te: "{a} నుండి {b} వరకు" },
    h_on:       { en: "on {a}", hi: "{a} को", te: "{a}న" },
    h_reopen:   { en: "We reopen on {d}", hi: "दुकान {d} को फिर से खुलेगी", te: "{d}న మళ్ళీ తెరుస్తాము" },
    h_sorry:    { en: "Sorry for the inconvenience", hi: "असुविधा के लिए खेद है", te: "అసౌకర్యానికి క్షమించండి" },
    h_wishes:   { en: "Happy {f}!", hi: "{f} की हार्दिक शुभकामनाएँ", te: "{f} శుభాకాంక్షలు" }
  };
  var DAYS = {
    en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    hi: ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"],
    te: ["సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం", "ఆదివారం"]
  };
  var FESTIVALS = [
    { id: "diwali", en: "Diwali", hi: "दीपावली", te: "దీపావళి" },
    { id: "sankranti", en: "Sankranti", hi: "मकर संक्रांति", te: "సంక్రాంతి" },
    { id: "ugadi", en: "Ugadi", hi: "उगादी", te: "ఉగాది" },
    { id: "holi", en: "Holi", hi: "होली", te: "హోలీ" },
    { id: "eid", en: "Eid", hi: "ईद", te: "ఈద్" },
    { id: "bakrid", en: "Bakrid", hi: "बकरीद", te: "బక్రీద్" },
    { id: "ganesh", en: "Ganesh Chaturthi", hi: "गणेश चतुर्थी", te: "వినాయక చవితి" },
    { id: "dussehra", en: "Dussehra", hi: "दशहरा", te: "దసరా" },
    { id: "christmas", en: "Christmas", hi: "क्रिसमस", te: "క్రిస్మస్" },
    { id: "newyear", en: "New Year", hi: "नव वर्ष", te: "నూతన సంవత్సరం" },
    { id: "republic", en: "Republic Day", hi: "गणतंत्र दिवस", te: "గణతంత్ర దినోత్సవం" },
    { id: "independence", en: "Independence Day", hi: "स्वतंत्रता दिवस", te: "స్వాతంత్ర్య దినోత్సవం" }
  ];

  // lang: "en" | "hi" | "te" | "en+hi" | "en+te". Returns [{text, primary}] for one phrase key.
  function phrase(key, lang, vars) {
    var parts = lang.split("+"), out = [];
    parts.forEach(function (l, i) {
      var s = (T[key] && T[key][l]) || (T[key] && T[key].en) || key;
      if (vars) Object.keys(vars).forEach(function (k) {
        var v = vars[k]; s = s.split("{" + k + "}").join(typeof v === "object" ? (v[l] || v.en) : v);
      });
      out.push({ text: s, primary: i === 0, lang: l });
    });
    return out;
  }

  /* ---------- canvas helpers ---------- */
  function setup(canvas, formatKey, landscape) {
    var f = FORMATS[formatKey] || FORMATS.A5;
    var w = f.px, h = Math.round(f.px * Math.SQRT2);
    if (landscape) { var t = w; w = h; h = t; }
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    return { ctx: ctx, w: w, h: h, u: Math.min(w, h) / 100, format: f, landscape: !!landscape };
  }
  function font(size, weight) { return (weight || 700) + " " + Math.round(size) + "px " + FONT; }

  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  // Find the largest size (<= max) at which text fits in maxLines lines of maxW.
  function fit(ctx, text, maxW, maxSize, minSize, maxLines, weight) {
    for (var s = maxSize; s >= minSize; s -= Math.max(1, maxSize / 60)) {
      ctx.font = font(s, weight);
      var lines = wrap(ctx, text, maxW);
      var widest = Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; }));
      if (lines.length <= maxLines && widest <= maxW) return { size: s, lines: lines };
    }
    ctx.font = font(minSize, weight);
    return { size: minSize, lines: wrap(ctx, text, maxW).slice(0, maxLines) };
  }
  // Draws text block centred at cx starting with top y. Returns the y after the block.
  function textBlock(ctx, text, cx, y, maxW, maxSize, minSize, maxLines, color, weight, lh) {
    if (!text) return y;
    var r = fit(ctx, text, maxW, maxSize, minSize, maxLines, weight);
    ctx.font = font(r.size, weight); ctx.fillStyle = color;
    var step = r.size * (lh || 1.22);
    r.lines.forEach(function (l, i) { ctx.fillText(l, cx, y + r.size * 0.95 + i * step); });
    return y + r.size * 0.95 + (r.lines.length - 1) * step + r.size * 0.35;
  }
  // Draws a list of phrase parts (primary big, secondary smaller).
  function phraseBlock(ctx, parts, cx, y, maxW, size, color, colorSecondary, maxLines) {
    parts.forEach(function (p, i) {
      var s = p.primary ? size : size * 0.8;
      y = textBlock(ctx, p.text, cx, y + (i ? size * 0.25 : 0), maxW, s, s * 0.55, maxLines || 2, p.primary ? color : (colorSecondary || color), p.primary ? 800 : 600);
    });
    return y;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function star(ctx, cx, cy, r, color) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx[i ? "lineTo" : "moveTo"](cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  /* ---------- QR ---------- */
  function makeQr(text, ecc) {
    var q = root.qrcodegen;
    return q.QrCode.encodeText(text, ecc === "Q" ? q.Ecc.QUARTILE : ecc === "H" ? q.Ecc.HIGH : q.Ecc.MEDIUM);
  }
  // Draws a QR with a 4-module quiet zone into the square (x, y, size). Module size is snapped to whole pixels.
  function drawQr(ctx, text, x, y, size, dark, light, ecc) {
    var qr = makeQr(text, ecc);
    var n = qr.size + 8, m = Math.max(1, Math.floor(size / n)), real = m * n;
    var ox = Math.round(x + (size - real) / 2), oy = Math.round(y + (size - real) / 2);
    ctx.fillStyle = light || "#ffffff"; ctx.fillRect(ox, oy, real, real);
    ctx.fillStyle = dark || "#000000";
    for (var r = 0; r < qr.size; r++) for (var c = 0; c < qr.size; c++)
      if (qr.getModule(c, r)) ctx.fillRect(ox + (c + 4) * m, oy + (r + 4) * m, m, m);
    return { x: ox, y: oy, size: real, version: qr.version };
  }
  // Plain QR on its own canvas (for "download QR only").
  function qrCanvas(text, px, ecc) {
    var c = document.createElement("canvas"); c.width = c.height = px;
    var ctx = c.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, px, px);
    drawQr(ctx, text, 0, 0, px, "#111111", "#ffffff", ecc);
    return c;
  }

  function credit(g, color, show) {
    if (!show) return;
    var ctx = g.ctx; ctx.font = font(g.u * 1.55, 500); ctx.fillStyle = color; ctx.textAlign = "center";
    ctx.fillText((root.DK_CONFIG && root.DK_CONFIG.posterCredit) || "", g.w / 2, g.h - g.u * 2.2);
  }

  /* ---------- export: PNG, PDF, print ---------- */
  function strBytes(s) { var b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; }
  function dataUrlBytes(url) {
    var bin = atob(url.split(",")[1]), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  // Minimal PDF: one full-bleed JPEG per page. pages = [canvas, ...]; page size in points.
  function makePdf(canvases, wPt, hPt) {
    var chunks = [], offsets = [], pos = 0;
    function add(x) { var b = typeof x === "string" ? strBytes(x) : x; chunks.push(b); pos += b.length; }
    function obj(n, body) { offsets[n] = pos; add(n + " 0 obj\n"); body(); add("\nendobj\n"); }
    var n = canvases.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + " 0 R");
    add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, function () { add("<< /Type /Catalog /Pages 2 0 R >>"); });
    obj(2, function () { add("<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>"); });
    canvases.forEach(function (cv, i) {
      var p = 3 + i * 3, w = wPt.toFixed(2), h = hPt.toFixed(2);
      var jpg = dataUrlBytes(cv.toDataURL("image/jpeg", 0.93));
      var content = "q " + w + " 0 0 " + h + " 0 0 cm /Im0 Do Q";
      obj(p, function () { add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + w + " " + h + "] /Resources << /XObject << /Im0 " + (p + 2) + " 0 R >> >> /Contents " + (p + 1) + " 0 R >>"); });
      obj(p + 1, function () { add("<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"); });
      obj(p + 2, function () {
        add("<< /Type /XObject /Subtype /Image /Width " + cv.width + " /Height " + cv.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n");
        add(jpg); add("\nendstream");
      });
    });
    var xref = pos, total = 3 + n * 3;
    add("xref\n0 " + total + "\n0000000000 65535 f \n");
    for (var k = 1; k < total; k++) add(String(offsets[k]).padStart(10, "0") + " 00000 n \n");
    add("trailer\n<< /Size " + total + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    return new Blob(chunks, { type: "application/pdf" });
  }
  function saveBlob(blob, name) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function downloadPng(canvas, name) {
    if (canvas.toBlob) canvas.toBlob(function (b) { saveBlob(b, name); }, "image/png");
    else saveBlob(new Blob([dataUrlBytes(canvas.toDataURL("image/png"))], { type: "image/png" }), name);
  }
  function downloadPdf(canvases, formatKey, landscape, name) {
    var f = FORMATS[formatKey] || FORMATS.A5;
    var w = landscape ? f.hPt : f.wPt, h = landscape ? f.wPt : f.hPt;
    saveBlob(makePdf(canvases, w, h), name);
  }
  // Prints the poster image(s) at the exact paper size.
  function print(canvases, formatKey, landscape) {
    var area = document.getElementById("print-area");
    if (!area) { area = document.createElement("div"); area.id = "print-area"; document.body.appendChild(area); }
    area.innerHTML = "";
    canvases.forEach(function (cv) { var img = new Image(); img.src = cv.toDataURL("image/png"); img.alt = ""; area.appendChild(img); });
    var st = document.getElementById("print-page-size");
    if (!st) { st = document.createElement("style"); st.id = "print-page-size"; document.head.appendChild(st); }
    st.textContent = "@page { size: " + formatKey + " " + (landscape ? "landscape" : "portrait") + "; margin: 0; }";
    document.body.classList.add("printing-poster");
    var done = function () { document.body.classList.remove("printing-poster"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(function () { window.print(); }, 60);
  }
  function slug(s) { return String(s || "poster").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "poster"; }

  root.DKPoster = {
    FONT: FONT, FORMATS: FORMATS, THEMES: THEMES, T: T, DAYS: DAYS, FESTIVALS: FESTIVALS, phrase: phrase,
    setup: setup, font: font, wrap: wrap, fit: fit, textBlock: textBlock, phraseBlock: phraseBlock,
    roundRect: roundRect, star: star, makeQr: makeQr, drawQr: drawQr, qrCanvas: qrCanvas, credit: credit,
    makePdf: makePdf, saveBlob: saveBlob, downloadPng: downloadPng, downloadPdf: downloadPdf, print: print, slug: slug
  };
})(typeof self !== "undefined" ? self : this);
