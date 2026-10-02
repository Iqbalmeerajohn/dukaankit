/* DukaanKit service worker: precache everything for offline use. Bump VERSION when files change. */
var VERSION = "dukaankit-v1";
var FILES = [
  "./", "upi-qr-standee/", "google-review-qr/", "whatsapp-qr/", "gst-invoice/", "shop-sign/", "recommended-gear/", "404.html",
  "manifest.webmanifest", "favicon.svg",
  "assets/css/site.css",
  "assets/js/config.js", "assets/js/site.js", "assets/js/links.js", "assets/js/invoice-core.js", "assets/js/poster.js",
  "assets/js/tool.js", "assets/js/upi.js", "assets/js/review.js", "assets/js/whatsapp.js", "assets/js/invoice.js", "assets/js/sign.js",
  "assets/js/vendor/qrcodegen.js",
  "assets/img/icon-192.png", "assets/img/icon-512.png", "assets/img/apple-touch-icon.png",
  "assets/img/sample-upi.jpg", "assets/img/sample-review.jpg", "assets/img/sample-whatsapp.jpg", "assets/img/sample-invoice.jpg", "assets/img/sample-sign.jpg"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("dukaankit-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Same-origin GET only. Pages: network first (fresh when online), cache fallback. Assets: cache first.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("./"); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) {
    return r || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
