/* DukaanKit invoice maths (browser + Node). All money is handled in integer paise.
   Rounding: half-up to the nearest paisa (all values are non-negative). */
(function (root) {
  "use strict";

  // GST state codes. Third value true = Union Territory without legislature, where UTGST applies instead of SGST.
  var STATES = [
    ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh", true],
    ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
    ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"],
    ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"],
    ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
    ["26", "Dadra and Nagar Haveli and Daman and Diu", true], ["27", "Maharashtra"], ["29", "Karnataka"],
    ["30", "Goa"], ["31", "Lakshadweep", true], ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"],
    ["35", "Andaman and Nicobar Islands", true], ["36", "Telangana"], ["37", "Andhra Pradesh"],
    ["38", "Ladakh", true], ["97", "Other Territory", true]
  ].map(function (s) { return { code: s[0], name: s[1], ut: !!s[2] }; });

  function stateByCode(code) {
    for (var i = 0; i < STATES.length; i++) if (STATES[i].code === code) return STATES[i];
    return null;
  }

  /* ---------- parsing ---------- */
  // Parse a decimal string to an integer scaled by 10^dp. Returns NaN if invalid or too precise.
  function toScaled(v, dp) {
    var s = String(v == null ? "" : v).trim().replace(/,/g, "");
    if (s === "") return 0;
    var m = /^(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) return NaN;
    var frac = m[2] || "";
    if (frac.length > dp) return NaN;
    while (frac.length < dp) frac += "0";
    return Number(m[1]) * Math.pow(10, dp) + (frac ? Number(frac) : 0);
  }
  function rupeesToPaise(v) { return toScaled(v, 2); }
  function qtyToMilli(v) { return toScaled(v, 3); }
  function rateToBp(v) { return toScaled(v, 2); }   // 18 -> 1800 basis points, 0.25 -> 25

  // Half-up integer division for non-negative integers.
  function divRound(num, den) { return Math.floor((num * 2 + den) / (den * 2)); }

  /* ---------- GSTIN ---------- */
  var GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  function gstinCheckChar(first14) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var v = GST_CHARS.indexOf(first14.charAt(i));
      var p = v * (i % 2 === 0 ? 1 : 2);
      sum += Math.floor(p / 36) + (p % 36);
    }
    return GST_CHARS.charAt((36 - (sum % 36)) % 36);
  }
  function validateGstin(g) {
    var s = String(g || "").trim().toUpperCase();
    if (!s) return { ok: true, empty: true };
    if (s.length !== 15) return { ok: false, msg: "A GSTIN has 15 characters." };
    if (!GSTIN_RE.test(s)) return { ok: false, msg: "GSTIN format looks wrong (2 digits, PAN, entity number, Z, check character)." };
    if (!stateByCode(s.slice(0, 2))) return { ok: false, msg: "The first two digits are not a valid GST state code." };
    if (gstinCheckChar(s.slice(0, 14)) !== s.charAt(14)) return { ok: false, msg: "The last character (checksum) does not match. Check for a typo." };
    return { ok: true, value: s, stateCode: s.slice(0, 2) };
  }

  /* ---------- totals ---------- */
  /*
    input = {
      items: [{ desc, hsn, qty, unit, rate, gst }],   // strings or numbers, rupees / percent
      sellerState: "37", placeOfSupply: "37",
      inclusive: false,     // rates already include GST
      gstEnabled: true,     // false = Bill of Supply, no tax
      roundOff: true        // round grand total to the nearest rupee
    }
    Tax is computed per GST rate group (sum of line amounts at that rate), which is how the
    tax summary on an invoice is usually prepared and avoids per-line rounding drift.
    Intra-state: CGST and SGST/UTGST are each half the rate. Exclusive prices: each half is
    rounded separately so CGST always equals SGST. Inclusive prices: total tax is derived from
    the gross so the invoice total equals what the customer was quoted; an odd paisa goes to CGST.
  */
  function computeInvoice(input) {
    var errors = [];
    var intra = input.sellerState === input.placeOfSupply;
    var st = stateByCode(input.placeOfSupply);
    var useUT = !!(intra && st && st.ut);
    var gstOn = input.gstEnabled !== false;
    var lines = [];
    var groups = {};

    (input.items || []).forEach(function (it, idx) {
      var blank = !String(it.desc || "").trim() && !String(it.rate || "").trim();
      if (blank) return;
      var q = qtyToMilli(it.qty === "" || it.qty == null ? "1" : it.qty);
      var r = rupeesToPaise(it.rate);
      var bp = gstOn ? rateToBp(it.gst == null || it.gst === "" ? "0" : it.gst) : 0;
      if (isNaN(q)) errors.push({ line: idx, field: "qty", msg: "Quantity: numbers with up to 3 decimals." });
      if (isNaN(r)) errors.push({ line: idx, field: "rate", msg: "Rate: numbers with up to 2 decimals." });
      if (isNaN(bp) || bp > 10000) errors.push({ line: idx, field: "gst", msg: "GST rate is not valid." });
      if (isNaN(q) || isNaN(r) || isNaN(bp) || bp > 10000) return;
      var amount = divRound(q * r, 1000);
      lines.push({ index: idx, desc: String(it.desc || "").trim(), hsn: String(it.hsn || "").trim(), unit: String(it.unit || "").trim(),
        qtyMilli: q, ratePaise: r, bp: bp, amount: amount });
      var g = groups[bp] || (groups[bp] = { bp: bp, amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 });
      g.amount += amount;
    });

    var taxable = 0, cgst = 0, sgst = 0, igst = 0;
    var summary = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; }).map(function (bp) {
      var g = groups[bp];
      if (input.inclusive) {
        g.taxable = divRound(g.amount * 10000, 10000 + bp);
        var tax = g.amount - g.taxable;
        if (intra) { g.cgst = tax - Math.floor(tax / 2); g.sgst = Math.floor(tax / 2); } else { g.igst = tax; }
      } else {
        g.taxable = g.amount;
        if (intra) { g.cgst = divRound(g.taxable * bp, 20000); g.sgst = g.cgst; }
        else { g.igst = divRound(g.taxable * bp, 10000); }
      }
      taxable += g.taxable; cgst += g.cgst; sgst += g.sgst; igst += g.igst;
      return g;
    });

    var total = taxable + cgst + sgst + igst;
    var grand = total, roundOff = 0;
    if (input.roundOff !== false) { grand = divRound(total, 100) * 100; roundOff = grand - total; }

    return {
      errors: errors, lines: lines, summary: summary, intra: intra, useUT: useUT, gstEnabled: gstOn,
      taxable: taxable, cgst: cgst, sgst: sgst, igst: igst, totalTax: cgst + sgst + igst,
      total: total, roundOff: roundOff, grandTotal: grand
    };
  }

  /* ---------- formatting ---------- */
  function pad(n, w) { var s = String(n); while (s.length < w) s = "0" + s; return s; }
  function groupIndian(intStr) {
    if (intStr.length <= 3) return intStr;
    var last3 = intStr.slice(-3), rest = intStr.slice(0, -3), out = "";
    while (rest.length > 2) { out = "," + rest.slice(-2) + out; rest = rest.slice(0, -2); }
    return rest + out + "," + last3;
  }
  function formatPaise(p, withSymbol) {
    var neg = p < 0; p = Math.abs(p);
    var s = groupIndian(String(Math.floor(p / 100))) + "." + pad(p % 100, 2);
    return (neg ? "-" : "") + (withSymbol ? "₹" + s : s);
  }
  function formatQty(milli) {
    var whole = Math.floor(milli / 1000), frac = milli % 1000;
    if (!frac) return String(whole);
    return whole + "." + pad(frac, 3).replace(/0+$/, "");
  }
  function formatRateBp(bp) {
    var whole = Math.floor(bp / 100), frac = bp % 100;
    return frac ? whole + "." + pad(frac, 2).replace(/0+$/, "") : String(whole);
  }

  /* ---------- amount in words (Indian system) ---------- */
  var ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n) {
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  }
  function threeDigits(n) {
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(ONES[h] + " Hundred");
    if (r) out.push(twoDigits(r));
    return out.join(" ");
  }
  // Whole number to words using crore / lakh / thousand. Above 99 crore the crore count is itself spelled out.
  function numberToWordsIndian(n) {
    n = Math.floor(n);
    if (n === 0) return "Zero";
    var parts = [];
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(numberToWordsIndian(crore) + " Crore");
    if (lakh) parts.push(twoDigits(lakh) + " Lakh");
    if (thousand) parts.push(twoDigits(thousand) + " Thousand");
    if (n) parts.push(threeDigits(n));
    return parts.join(" ");
  }
  function amountInWords(paise) {
    var rupees = Math.floor(paise / 100), ps = paise % 100;
    var s = "Rupees " + numberToWordsIndian(rupees);
    if (ps) s += " and " + twoDigits(ps) + " Paise";
    return s + " Only";
  }

  var api = {
    STATES: STATES, stateByCode: stateByCode, rupeesToPaise: rupeesToPaise, qtyToMilli: qtyToMilli, rateToBp: rateToBp,
    divRound: divRound, validateGstin: validateGstin, gstinCheckChar: gstinCheckChar, computeInvoice: computeInvoice,
    formatPaise: formatPaise, formatQty: formatQty, formatRateBp: formatRateBp, groupIndian: groupIndian,
    numberToWordsIndian: numberToWordsIndian, amountInWords: amountInWords
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DKInvoice = api;
})(typeof self !== "undefined" ? self : this);
