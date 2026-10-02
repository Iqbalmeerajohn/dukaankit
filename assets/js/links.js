/* DukaanKit: pure link builders and validators (browser + Node). No network calls. */
(function (root) {
  "use strict";

  // UPI virtual payment address: handle@psp. Handles allow letters, digits, dot, hyphen, underscore.
  var UPI_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

  function validateUpiId(id) {
    var v = String(id || "").trim();
    if (!v) return { ok: false, msg: "Enter your UPI ID, for example ravistores@okaxis." };
    if (v.indexOf(" ") !== -1) return { ok: false, msg: "A UPI ID has no spaces." };
    if ((v.match(/@/g) || []).length !== 1) return { ok: false, msg: "A UPI ID has exactly one @, like name@bank." };
    if (!UPI_RE.test(v)) return { ok: false, msg: "This does not look like a UPI ID. It should look like name@bank (letters, numbers, dot, hyphen or underscore)." };
    return { ok: true, value: v };
  }

  // Amount: optional, > 0, max 2 decimals. Returns canonical string like "250.00" or "" if empty.
  function normaliseAmount(a) {
    var s = String(a == null ? "" : a).trim().replace(/,/g, "");
    if (s === "") return { ok: true, value: "" };
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return { ok: false, msg: "Use numbers only, with up to 2 decimals (e.g. 250 or 99.50)." };
    var n = Number(s);
    if (!(n > 0)) return { ok: false, msg: "Amount must be more than zero." };
    return { ok: true, value: n.toFixed(2) };
  }

  // Encode for UPI query values: RFC 3986 percent-encoding (spaces as %20).
  function enc(s) {
    return encodeURIComponent(s).replace(/[!'()*]/g, function (c) {
      return "%" + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  function buildUpiUri(o) {
    var parts = ["pa=" + o.pa];
    if (o.pn) parts.push("pn=" + enc(String(o.pn).trim()));
    if (o.am) parts.push("am=" + o.am);
    if (o.tn) parts.push("tn=" + enc(String(o.tn).trim()));
    parts.push("cu=INR");
    return "upi://pay?" + parts.join("&");
  }

  // WhatsApp: digits only, country code first, no + or leading zeros.
  function normalisePhone(cc, num) {
    var c = String(cc || "").replace(/\D/g, "");
    var n = String(num || "").replace(/\D/g, "");
    if (!c) return { ok: false, msg: "Choose a country code." };
    if (c === "91") {
      if (n.length === 12 && n.indexOf("91") === 0) n = n.slice(2);
      if (n.length === 11 && n.charAt(0) === "0") n = n.slice(1);
      if (!/^[6-9]\d{9}$/.test(n)) return { ok: false, msg: "Indian mobile numbers have 10 digits and start with 6, 7, 8 or 9." };
    } else {
      n = n.replace(/^0+/, "");
      if (n.length < 4 || (c + n).length > 15) return { ok: false, msg: "Check the number. With the country code it can have at most 15 digits." };
    }
    return { ok: true, value: c + n };
  }

  function buildWaLink(fullNumber, text) {
    var url = "https://wa.me/" + fullNumber;
    var t = String(text || "").trim();
    if (t) url += "?text=" + enc(t);
    return url;
  }

  // Google review link checks. Accepts g.page/r/... short links, search.google.com writereview links,
  // maps.app.goo.gl share links, and builds a link from a Place ID.
  function checkReviewLink(raw) {
    var s = String(raw || "").trim();
    if (!s) return { ok: false, msg: "Paste your Google review link." };
    if (/^ChIJ[\w-]{10,}$/.test(s)) return { ok: true, value: reviewLinkFromPlaceId(s), note: "Built a review link from your Place ID." };
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    var host;
    try { host = new URL(s).hostname.toLowerCase(); } catch (e) { return { ok: false, msg: "That is not a valid link." }; }
    if (host.indexOf(".") === -1) return { ok: false, msg: "That is not a valid link." };
    var googleish = /(^|\.)g\.page$|(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$/.test(host);
    if (!googleish) return { ok: true, value: s, warn: "This link is not on a Google domain. Check that it opens your review page before printing." };
    return { ok: true, value: s };
  }

  function reviewLinkFromPlaceId(id) {
    return "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(id);
  }

  var api = {
    validateUpiId: validateUpiId, normaliseAmount: normaliseAmount, buildUpiUri: buildUpiUri,
    normalisePhone: normalisePhone, buildWaLink: buildWaLink, checkReviewLink: checkReviewLink,
    reviewLinkFromPlaceId: reviewLinkFromPlaceId, enc: enc
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DKLinks = api;
})(typeof self !== "undefined" ? self : this);
