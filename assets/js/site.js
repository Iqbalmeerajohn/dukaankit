/* DukaanKit shared page script: offline support, affiliate tag, small helpers. No tracking. */
(function () {
  "use strict";
  var me = document.currentScript && document.currentScript.src;

  // Service worker for offline use (sw.js lives at the site root, two folders above this file).
  if ("serviceWorker" in navigator && me && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      try {
        var swUrl = new URL("../../sw.js", me);
        navigator.serviceWorker.register(swUrl.href, { scope: new URL("../../", me).pathname }).catch(function () {});
      } catch (e) { /* offline support is optional */ }
    });
  }

  // Amazon links: <a data-amazon="search words">. Adds the affiliate tag only if AMAZON_TAG is set in config.js.
  function amazonUrl(q) {
    var url = "https://www.amazon.in/s?k=" + encodeURIComponent(q);
    var tag = typeof AMAZON_TAG === "string" ? AMAZON_TAG.trim() : "";
    return tag ? url + "&tag=" + encodeURIComponent(tag) : url;
  }
  document.querySelectorAll("a[data-amazon]").forEach(function (a) { a.href = amazonUrl(a.getAttribute("data-amazon")); });

  window.DK = {
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    amazonUrl: amazonUrl,
    copy: function (text, statusEl) {
      function done(ok) { if (statusEl) { statusEl.textContent = ok ? "Copied." : "Could not copy. Select the text and copy it."; setTimeout(function () { statusEl.textContent = ""; }, 2500); } }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else {
        var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        t.remove(); done(ok);
      }
    },
    store: {
      get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    },
    // Field error helper: setError(input, message or "")
    setError: function (input, msg) {
      var box = input && input.closest(".field") && input.closest(".field").querySelector(".error");
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (box) box.textContent = msg || "";
    },
    debounce: function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  };
  var y = document.getElementById("year"); if (y) y.textContent = String(new Date().getFullYear());
})();
