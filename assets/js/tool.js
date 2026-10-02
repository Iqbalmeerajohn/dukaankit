/* DukaanKit poster tool wiring: form state, live preview, downloads. Shared by the poster pages. */
(function () {
  "use strict";
  var P = window.DKPoster;

  function readForm(form) {
    var s = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "radio") { if (el.checked) s[el.name] = el.value; else if (!(el.name in s)) s[el.name] = s[el.name]; }
      else if (el.type === "checkbox") s[el.name] = el.checked;
      else s[el.name] = el.value;
    });
    return s;
  }
  function writeForm(form, s) {
    Object.keys(s || {}).forEach(function (k) {
      var els = form.querySelectorAll('[name="' + k + '"]');
      Array.prototype.forEach.call(els, function (el) {
        if (el.type === "radio") el.checked = el.value === s[k];
        else if (el.type === "checkbox") el.checked = !!s[k];
        else if (s[k] != null) el.value = s[k];
      });
    });
  }

  function init(cfg) {
    var form = document.querySelector(cfg.form);
    var box = document.querySelector(cfg.preview);
    var status = document.querySelector(cfg.status || "#status");
    var actions = document.querySelectorAll("[data-action]");
    var last = null;
    var saved = window.DK.store.get(cfg.storageKey, null);
    if (saved) writeForm(form, saved);

    function canvasAt(i) {
      var list = box.querySelectorAll("canvas");
      if (list[i]) return list[i];
      var c = document.createElement("canvas");
      c.setAttribute("role", "img");
      box.appendChild(c);
      return c;
    }
    function trim(n) { var list = box.querySelectorAll("canvas"); for (var i = list.length - 1; i >= n; i--) list[i].remove(); }

    function update() {
      var s = readForm(form);
      window.DK.store.set(cfg.storageKey, s);
      var res;
      try { res = cfg.render(s, canvasAt); } catch (e) { res = { ok: false, message: "Could not draw the poster: " + e.message }; }
      last = res;
      if (res && res.canvases) trim(res.canvases.length);
      box.classList.toggle("landscape", !!(res && res.landscape));
      if (res && res.canvases) res.canvases.forEach(function (c) { c.setAttribute("aria-label", res.alt || "Poster preview"); });
      Array.prototype.forEach.call(actions, function (b) { if (b.tagName === "BUTTON") b.disabled = !(res && res.ok); });
      box.setAttribute("aria-busy", "false");
      if (cfg.after) cfg.after(res, s);
    }
    var deb = window.DK.debounce(update, 180);
    form.addEventListener("input", deb);
    form.addEventListener("change", deb);
    form.addEventListener("submit", function (e) { e.preventDefault(); update(); });

    Array.prototype.forEach.call(actions, function (btn) {
      btn.addEventListener("click", function () {
        if (!last || !last.ok) return;
        var a = btn.getAttribute("data-action"), name = last.name || "dukaankit-poster";
        if (a === "png") last.canvases.forEach(function (c, i) { P.downloadPng(c, name + (last.canvases.length > 1 ? "-" + (last.pageNames ? last.pageNames[i] : i + 1) : "") + ".png"); });
        if (a === "pdf") P.downloadPdf(last.canvases, last.size, last.landscape, name + ".pdf");
        if (a === "print") P.print(last.canvases, last.size, last.landscape);
        if (a === "qr" && last.qrText) P.downloadPng(P.qrCanvas(last.qrText, 1200, "M"), name + "-qr.png");
        if (a === "copy" && last.copyText) window.DK.copy(last.copyText, status);
        if (status && a !== "copy") { status.textContent = a === "print" ? "Opening print dialog..." : "Download started."; setTimeout(function () { status.textContent = ""; }, 2500); }
      });
    });
    update();
    return { update: update, read: function () { return readForm(form); } };
  }
  window.DKTool = { init: init, readForm: readForm, writeForm: writeForm };
})();
