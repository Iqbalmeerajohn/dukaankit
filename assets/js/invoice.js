/* GST invoice / bill maker. All maths in invoice-core.js (unit tested). Saved only in this browser. */
(function () {
  "use strict";
  var I = window.DKInvoice, L = window.DKLinks, P = window.DKPoster, DK = window.DK, $ = DK.$, $$ = DK.$$;
  var K_SELLER = "dk-inv-seller-v1", K_DRAFT = "dk-inv-draft-v1", K_SAVED = "dk-inv-saved-v1";
  var RATES = ["0", "0.25", "3", "5", "12", "18", "28", "40"];
  var SELLER_FIELDS = ["s_name", "s_addr", "s_gstin", "s_state", "s_phone", "s_upi", "gst_on"];
  var form = $("#inv-form"), itemsBox = $("#items"), sheet = $("#sheet");

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmtDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  function money(p) { return I.formatPaise(p); }

  // state selects
  $$("select.state").forEach(function (sel) {
    I.STATES.forEach(function (st) { var o = document.createElement("option"); o.value = st.code; o.textContent = st.code + " - " + st.name; sel.appendChild(o); });
    sel.value = "37";
  });

  /* ---------- item rows ---------- */
  var rowId = 0;
  function addRow(it) {
    it = it || {};
    var id = "r" + (rowId++), row = document.createElement("div");
    row.className = "item-row"; row.setAttribute("data-row", id);
    var opts = RATES.map(function (r) { return '<option value="' + r + '"' + (String(it.gst == null ? "18" : it.gst) === r ? " selected" : "") + ">" + r + "%</option>"; }).join("");
    row.innerHTML =
      '<div class="f-desc"><label for="' + id + 'd">Item / service</label><input id="' + id + 'd" data-k="desc" type="text" maxlength="120" value="' + esc(it.desc) + '" placeholder="Basmati rice 5 kg"></div>' +
      '<div><label for="' + id + 'h">HSN/SAC</label><input id="' + id + 'h" data-k="hsn" type="text" inputmode="numeric" maxlength="8" value="' + esc(it.hsn) + '"></div>' +
      '<div><label for="' + id + 'q">Qty</label><input id="' + id + 'q" data-k="qty" type="text" inputmode="decimal" value="' + esc(it.qty == null ? "1" : it.qty) + '"></div>' +
      '<div><label for="' + id + 'u">Unit</label><input id="' + id + 'u" data-k="unit" type="text" maxlength="8" value="' + esc(it.unit || "") + '" placeholder="pcs"></div>' +
      '<div><label for="' + id + 'r">Rate &#8377;</label><input id="' + id + 'r" data-k="rate" type="text" inputmode="decimal" value="' + esc(it.rate) + '" placeholder="0.00"></div>' +
      '<div class="gst-col"><label for="' + id + 'g">GST</label><select id="' + id + 'g" data-k="gst">' + opts + '</select></div>' +
      '<div class="amt" aria-live="polite"></div>' +
      '<button type="button" class="btn btn-quiet btn-sm rm" aria-label="Remove this item">Remove</button>';
    row.querySelector(".rm").addEventListener("click", function () { row.remove(); if (!itemsBox.children.length) addRow(); update(); });
    itemsBox.appendChild(row);
    return row;
  }
  function readItems() {
    return $$(".item-row", itemsBox).map(function (row) {
      var o = {}; $$("[data-k]", row).forEach(function (el) { o[el.getAttribute("data-k")] = el.value; }); return o;
    });
  }

  /* ---------- state ---------- */
  function read() {
    var s = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      s[el.name] = el.type === "checkbox" ? el.checked : el.value;
    });
    s.items = readItems();
    return s;
  }
  function write(s) {
    Object.keys(s || {}).forEach(function (k) {
      var el = form.elements[k]; if (!el || k === "items") return;
      if (el.type === "checkbox") el.checked = !!s[k]; else el.value = s[k];
    });
    if (s && s.items) { itemsBox.innerHTML = ""; s.items.forEach(addRow); }
    if (!itemsBox.children.length) addRow();
  }

  /* ---------- compute + render ---------- */
  function validate(s) {
    var ok = true;
    var sg = I.validateGstin(s.s_gstin), bg = I.validateGstin(s.b_gstin);
    DK.setError(form.elements.s_gstin, sg.ok ? "" : sg.msg);
    DK.setError(form.elements.b_gstin, bg.ok ? "" : bg.msg);
    var upi = s.s_upi ? L.validateUpiId(s.s_upi) : { ok: true };
    DK.setError(form.elements.s_upi, upi.ok ? "" : upi.msg);
    return { sg: sg, bg: bg, upiOk: upi.ok && !!s.s_upi, ok: ok };
  }

  function render(s, v, r) {
    var gst = s.gst_on, sellerState = I.stateByCode(s.s_state), pos = I.stateByCode(s.pos);
    var sgLabel = r.useUT ? "UTGST" : "SGST";
    var title = gst ? "Tax Invoice" : "Bill of Supply";
    var h = [];
    h.push('<div class="s-top"><div class="s-seller"><strong>' + esc(s.s_name || "Your shop name") + "</strong>" +
      (s.s_addr ? esc(s.s_addr).replace(/\n/g, "<br>") + "<br>" : "") +
      (s.s_phone ? "Phone: " + esc(s.s_phone) + "<br>" : "") +
      (gst && s.s_gstin ? "GSTIN: <b>" + esc(s.s_gstin.toUpperCase()) + "</b><br>" : "") +
      (sellerState ? "State: " + esc(sellerState.name) + " (" + sellerState.code + ")" : "") + "</div>" +
      '<div class="s-meta"><div class="s-title">' + title + "</div>Invoice no: <b>" + esc(s.inv_no) + "</b><br>Date: <b>" + esc(fmtDate(s.inv_date)) + "</b>" +
      (gst && pos ? "<br>Place of supply: " + esc(pos.name) + " (" + pos.code + ")" : "") + "</div></div>");
    h.push('<div class="s-parties"><div><div class="s-label">Bill to</div><b>' + esc(s.b_name || "Cash customer") + "</b><br>" +
      (s.b_addr ? esc(s.b_addr).replace(/\n/g, "<br>") + "<br>" : "") +
      (s.b_gstin ? "GSTIN: " + esc(s.b_gstin.toUpperCase()) : "") + "</div></div>");
    var incl = s.inclusive && gst;
    h.push("<table><thead><tr><th>#</th><th>Item</th>" + (r.lines.some(function (l) { return l.hsn; }) ? "<th>HSN/SAC</th>" : "") +
      '<th class="n">Qty</th><th class="n">Rate' + (incl ? " (incl. GST)" : "") + "</th>" + (gst ? '<th class="n">GST</th>' : "") +
      '<th class="n">' + (incl ? "Amount" : "Taxable value") + "</th></tr></thead><tbody>");
    var showHsn = r.lines.some(function (l) { return l.hsn; });
    r.lines.forEach(function (l, i) {
      h.push("<tr><td>" + (i + 1) + "</td><td>" + esc(l.desc) + "</td>" + (showHsn ? "<td>" + esc(l.hsn) + "</td>" : "") +
        '<td class="n">' + I.formatQty(l.qtyMilli) + (l.unit ? " " + esc(l.unit) : "") + '</td><td class="n">' + money(l.ratePaise) + "</td>" +
        (gst ? '<td class="n">' + I.formatRateBp(l.bp) + "%</td>" : "") + '<td class="n">' + money(l.amount) + "</td></tr>");
    });
    if (!r.lines.length) h.push('<tr><td colspan="7" style="color:#777">Add items to see them here.</td></tr>');
    h.push("</tbody></table>");
    if (gst && r.summary.length) {
      h.push('<table><thead><tr><th>GST rate</th><th class="n">Taxable value</th>' +
        (r.intra ? '<th class="n">CGST</th><th class="n">' + sgLabel + "</th>" : '<th class="n">IGST</th>') + '<th class="n">Total tax</th></tr></thead><tbody>');
      r.summary.forEach(function (g) {
        var half = I.formatRateBp(g.bp / 2);
        h.push("<tr><td>" + I.formatRateBp(g.bp) + '%</td><td class="n">' + money(g.taxable) + "</td>" +
          (r.intra ? '<td class="n">' + money(g.cgst) + " (" + half + '%)</td><td class="n">' + money(g.sgst) + " (" + half + "%)</td>"
                   : '<td class="n">' + money(g.igst) + "</td>") +
          '<td class="n">' + money(g.cgst + g.sgst + g.igst) + "</td></tr>");
      });
      h.push("</tbody></table>");
    }
    var t = [["Taxable value", r.taxable]];
    if (gst) { if (r.intra) { t.push(["CGST", r.cgst]); t.push([sgLabel, r.sgst]); } else t.push(["IGST", r.igst]); }
    if (!gst) t = [["Total", r.total]];
    if (r.roundOff) t.push(["Round off", r.roundOff]);
    h.push('<div class="s-bottom"><div><div class="s-label">Amount in words</div><div class="s-words"><b>' + I.amountInWords(r.grandTotal) + "</b></div>" +
      (s.notes ? '<div class="s-label">Notes / terms</div><div>' + esc(s.notes).replace(/\n/g, "<br>") + "</div>" : "") +
      (v.upiOk && r.grandTotal > 0 ? '<div class="s-pay"><canvas id="pay-qr" width="330" height="330" aria-label="UPI payment QR"></canvas><div><b>Scan to pay with any UPI app</b><br>' +
        esc(s.s_upi) + "<br>Amount: &#8377;" + money(r.grandTotal) + "</div></div>" : "") +
      '</div><table class="s-totals"><tbody>' +
      t.map(function (x) { return '<tr><td>' + x[0] + '</td><td class="n">' + (x[1] < 0 ? "-" : "") + money(Math.abs(x[1])) + "</td></tr>"; }).join("") +
      '<tr class="g"><td>Grand total</td><td class="n">&#8377;' + money(r.grandTotal) + "</td></tr></tbody></table></div>");
    h.push('<div class="s-sign">For <b>' + esc(s.s_name || "Your shop name") + "</b><br><br><br>Authorised signatory</div>");
    if (!gst) h.push('<div class="s-foot">No GST is charged on this bill.</div>');
    sheet.innerHTML = h.join("");
    var qc = $("#pay-qr");
    if (qc) {
      var uri = L.buildUpiUri({ pa: s.s_upi.trim(), pn: s.s_name, am: (r.grandTotal / 100).toFixed(2), tn: "Invoice " + (s.inv_no || "") });
      var ctx = qc.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 330, 330);
      P.drawQr(ctx, uri, 0, 0, 330, "#111", "#fff", "M");
      qc.setAttribute("data-uri", uri);
    }
  }

  function update() {
    var s = read(), v = validate(s);
    // GSTIN decides the seller state and the buyer's place of supply when present.
    if (v.sg.ok && v.sg.stateCode && form.elements.s_state.value !== v.sg.stateCode) { form.elements.s_state.value = v.sg.stateCode; s.s_state = v.sg.stateCode; }
    if (v.bg.ok && v.bg.stateCode && form.elements.pos.value !== v.bg.stateCode && !form.elements.pos.dataset.touched) { form.elements.pos.value = v.bg.stateCode; s.pos = v.bg.stateCode; }
    $$(".gst-only").forEach(function (el) { el.hidden = !s.gst_on; });
    var r = I.computeInvoice({ items: s.items, sellerState: s.s_state, placeOfSupply: s.gst_on ? s.pos : s.s_state, inclusive: !!s.inclusive, gstEnabled: !!s.gst_on, roundOff: !!s.round });
    // per-row amount and errors
    var rows = $$(".item-row", itemsBox);
    rows.forEach(function (row, i) {
      var line = r.lines.filter(function (l) { return l.index === i; })[0];
      row.querySelector(".amt").textContent = line ? "₹" + money(line.amount) : "";
      $$("[data-k]", row).forEach(function (el) { el.setAttribute("aria-invalid", "false"); });
    });
    r.errors.forEach(function (e) { var el = rows[e.line] && rows[e.line].querySelector('[data-k="' + e.field + '"]'); if (el) { el.setAttribute("aria-invalid", "true"); el.title = e.msg; } });
    $("#item-errors").textContent = r.errors.length ? r.errors[0].msg + " (item " + (r.errors[0].line + 1) + ")" : "";
    var sg = r.useUT ? "UTGST" : "SGST";
    var mini = [["Taxable value", r.taxable]];
    if (s.gst_on) { if (r.intra) mini.push(["CGST", r.cgst], [sg, r.sgst]); else mini.push(["IGST", r.igst]); }
    if (r.roundOff) mini.push(["Round off", r.roundOff]);
    $("#mini").innerHTML = mini.map(function (m) { return "<div><span>" + m[0] + "</span><span>" + (m[1] < 0 ? "-" : "") + "₹" + money(Math.abs(m[1])) + "</span></div>"; }).join("") +
      '<div class="grand"><span>Grand total</span><span>₹' + money(r.grandTotal) + "</span></div>" +
      '<div class="small muted"><span>' + (s.gst_on ? (r.intra ? "Same state: CGST + " + sg : "Different state: IGST") : "No GST (bill of supply)") + "</span></div>";
    render(s, v, r);
    var seller = {}; SELLER_FIELDS.forEach(function (k) { seller[k] = s[k]; });
    DK.store.set(K_SELLER, seller);
    DK.store.set(K_DRAFT, s);
    window.DKInvoiceState = { s: s, r: r };
    return { s: s, r: r };
  }

  /* ---------- saved invoices ---------- */
  function savedList() { return DK.store.get(K_SAVED, []); }
  function drawSaved() {
    var list = savedList(), ul = $("#saved");
    if (!list.length) { ul.innerHTML = '<li class="empty">No saved invoices yet. Saved invoices stay only on this device.</li>'; return; }
    ul.innerHTML = list.map(function (x, i) {
      return '<li><span><b>' + esc(x.no) + "</b> " + esc(x.buyer || "Cash customer") + '<br><span class="meta">' + esc(fmtDate(x.date)) + " | ₹" + money(x.total) + "</span></span>" +
        '<span><button type="button" class="btn btn-quiet btn-sm" data-load="' + i + '">Open</button> <button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '">Delete</button></span></li>';
    }).join("");
  }
  function nextNumber(no) {
    var m = /^(.*?)(\d+)(\D*)$/.exec(no || "");
    if (!m) return (no ? no + "-" : "INV-") + "1";
    var n = String(Number(m[2]) + 1); while (n.length < m[2].length) n = "0" + n;
    return m[1] + n + m[3];
  }

  /* ---------- events ---------- */
  form.addEventListener("input", DK.debounce(update, 150));
  form.addEventListener("change", function (e) { if (e.target.name === "pos") e.target.dataset.touched = "1"; update(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  $("#add-item").addEventListener("click", function () { var row = addRow({ gst: (readItems().slice(-1)[0] || {}).gst }); row.querySelector("input").focus(); update(); });
  $("#print-inv").addEventListener("click", function () { update(); window.print(); });
  $("#save-inv").addEventListener("click", function () {
    var st = update(), list = savedList(), s = st.s;
    var rec = { no: s.inv_no || "(no number)", date: s.inv_date, buyer: s.b_name, total: st.r.grandTotal, data: s };
    var idx = -1; list.forEach(function (x, i) { if (x.no === rec.no) idx = i; });
    if (idx >= 0) list[idx] = rec; else list.unshift(rec);
    if (list.length > 100) list.length = 100;
    var ok = DK.store.set(K_SAVED, list);
    $("#inv-status").textContent = ok ? "Saved on this device as " + rec.no + "." : "Could not save. Your browser may block storage in private mode.";
    drawSaved();
  });
  $("#new-inv").addEventListener("click", function () {
    var s = read();
    var keep = {}; SELLER_FIELDS.concat(["inclusive", "round", "notes"]).forEach(function (k) { keep[k] = s[k]; });
    keep.inv_no = nextNumber(s.inv_no); keep.inv_date = today();
    keep.b_name = ""; keep.b_addr = ""; keep.b_gstin = ""; keep.pos = s.s_state; keep.items = [{}];
    delete form.elements.pos.dataset.touched;
    write(keep); update();
    $("#inv-status").textContent = "New invoice " + keep.inv_no + " started.";
  });
  $("#saved").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var list = savedList();
    if (b.hasAttribute("data-load")) { var x = list[Number(b.getAttribute("data-load"))]; if (x) { write(x.data); update(); $("#inv-status").textContent = "Opened " + x.no + "."; form.scrollIntoView({ behavior: "smooth" }); } }
    if (b.hasAttribute("data-del")) {
      var i = Number(b.getAttribute("data-del"));
      if (list[i] && window.confirm("Delete invoice " + list[i].no + " from this device?")) { list.splice(i, 1); DK.store.set(K_SAVED, list); drawSaved(); }
    }
  });

  /* ---------- init ---------- */
  var draft = DK.store.get(K_DRAFT, null), seller = DK.store.get(K_SELLER, null);
  if (draft) write(draft);
  else {
    write(Object.assign({ inv_no: "INV-001", inv_date: today(), gst_on: true, round: true, items: [{ desc: "", qty: "1", gst: "18" }] }, seller || {}));
    if (seller && seller.s_state) form.elements.pos.value = seller.s_state;
  }
  if (!form.elements.inv_date.value) form.elements.inv_date.value = today();
  drawSaved();
  update();
  window.DKInvoiceUI = { update: update, addRow: addRow, write: write, read: read };
})();
