// Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const I = require("../assets/js/invoice-core.js");

const item = (rate, gst, qty = "1", desc = "Item") => ({ desc, rate, gst, qty });

test("amount in words: small numbers and paise", () => {
  assert.equal(I.amountInWords(0), "Rupees Zero Only");
  assert.equal(I.amountInWords(100), "Rupees One Only");
  assert.equal(I.amountInWords(1), "Rupees Zero and One Paise Only");
  assert.equal(I.amountInWords(1550), "Rupees Fifteen and Fifty Paise Only");
  assert.equal(I.amountInWords(2100), "Rupees Twenty-One Only");
  assert.equal(I.amountInWords(10000), "Rupees One Hundred Only");
  assert.equal(I.amountInWords(10100), "Rupees One Hundred One Only");
  assert.equal(I.amountInWords(99999), "Rupees Nine Hundred Ninety-Nine and Ninety-Nine Paise Only");
});

test("amount in words: thousand / lakh / crore (Indian system)", () => {
  assert.equal(I.numberToWordsIndian(1000), "One Thousand");
  assert.equal(I.numberToWordsIndian(1001), "One Thousand One");
  assert.equal(I.numberToWordsIndian(99999), "Ninety-Nine Thousand Nine Hundred Ninety-Nine");
  assert.equal(I.numberToWordsIndian(100000), "One Lakh");
  assert.equal(I.numberToWordsIndian(105000), "One Lakh Five Thousand");
  assert.equal(I.numberToWordsIndian(123456), "One Lakh Twenty-Three Thousand Four Hundred Fifty-Six");
  assert.equal(I.numberToWordsIndian(9999999), "Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine");
  assert.equal(I.numberToWordsIndian(10000000), "One Crore");
  assert.equal(I.numberToWordsIndian(10000001), "One Crore One");
  assert.equal(I.numberToWordsIndian(12345678), "One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight");
  assert.equal(I.numberToWordsIndian(1000000000), "One Hundred Crore");
  assert.equal(I.numberToWordsIndian(250000000000), "Twenty-Five Thousand Crore");
  assert.equal(I.amountInWords(1234567890), "Rupees One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight and Ninety Paise Only");
});

test("Indian digit grouping", () => {
  assert.equal(I.formatPaise(0), "0.00");
  assert.equal(I.formatPaise(99900), "999.00");
  assert.equal(I.formatPaise(100000), "1,000.00");
  assert.equal(I.formatPaise(10000000), "1,00,000.00");
  assert.equal(I.formatPaise(1234567890, true), "₹1,23,45,678.90");
  assert.equal(I.formatPaise(-150), "-1.50");
});

test("parsing is exact (no floating point drift)", () => {
  assert.equal(I.rupeesToPaise("0.1"), 10);
  assert.equal(I.rupeesToPaise("19.99"), 1999);
  assert.equal(I.rupeesToPaise("1,250.5"), 125050);
  assert.ok(Number.isNaN(I.rupeesToPaise("1.234")));
  assert.ok(Number.isNaN(I.rupeesToPaise("-5")));
  assert.equal(I.qtyToMilli("2.5"), 2500);
  assert.equal(I.rateToBp("0.25"), 25);
  assert.equal(I.rateToBp("18"), 1800);
});

test("intra-state: CGST + SGST, each half the rate", () => {
  const r = I.computeInvoice({ items: [item("1000", "18")], sellerState: "37", placeOfSupply: "37" });
  assert.equal(r.intra, true);
  assert.equal(r.taxable, 100000);
  assert.equal(r.cgst, 9000);
  assert.equal(r.sgst, 9000);
  assert.equal(r.igst, 0);
  assert.equal(r.grandTotal, 118000);
  assert.equal(r.roundOff, 0);
});

test("inter-state: IGST only", () => {
  const r = I.computeInvoice({ items: [item("1000", "18")], sellerState: "37", placeOfSupply: "36" });
  assert.equal(r.intra, false);
  assert.equal(r.cgst + r.sgst, 0);
  assert.equal(r.igst, 18000);
  assert.equal(r.grandTotal, 118000);
});

test("UT without legislature uses UTGST label, Delhi uses SGST", () => {
  assert.equal(I.computeInvoice({ items: [item("100", "5")], sellerState: "04", placeOfSupply: "04" }).useUT, true);
  assert.equal(I.computeInvoice({ items: [item("100", "5")], sellerState: "07", placeOfSupply: "07" }).useUT, false);
  assert.equal(I.computeInvoice({ items: [item("100", "5")], sellerState: "38", placeOfSupply: "38" }).useUT, true);
});

test("odd paise: each half rounded half-up, CGST always equals SGST", () => {
  // 33.33 x 5% = 1.6665 -> half 0.83325 -> 0.83 each
  const r = I.computeInvoice({ items: [item("33.33", "5")], sellerState: "29", placeOfSupply: "29" });
  assert.equal(r.cgst, 83);
  assert.equal(r.sgst, 83);
  // 10.10 x 5% = 0.505 -> half 0.2525 -> 0.25 each; IGST 0.505 -> 0.51 (half-up)
  const a = I.computeInvoice({ items: [item("10.10", "5")], sellerState: "29", placeOfSupply: "29" });
  assert.equal(a.cgst, 25); assert.equal(a.sgst, 25);
  const b = I.computeInvoice({ items: [item("10.10", "5")], sellerState: "29", placeOfSupply: "27" });
  assert.equal(b.igst, 51);
  // exactly half a paisa rounds up: 1.00 x 5% / 2 = 0.025 -> 0.03
  const c = I.computeInvoice({ items: [item("1", "5")], sellerState: "29", placeOfSupply: "29" });
  assert.equal(c.cgst, 3); assert.equal(c.sgst, 3);
});

test("tax is computed per rate group, not per line", () => {
  // three lines of 0.10 at 5%: per-line rounding would give 3 x 0.01; grouped gives round(0.015) = 0.02
  const r = I.computeInvoice({ items: [item("0.10", "5"), item("0.10", "5"), item("0.10", "5")], sellerState: "37", placeOfSupply: "27", roundOff: false });
  assert.equal(r.summary.length, 1);
  assert.equal(r.taxable, 30);
  assert.equal(r.igst, 2);
  assert.equal(r.grandTotal, 32);
});

test("mixed rates, decimal quantities, summary sorted by rate", () => {
  const r = I.computeInvoice({
    items: [item("45.50", "18", "2.5"), item("120", "5", "3"), item("60", "0", "1"), item("", "", "", "")],
    sellerState: "37", placeOfSupply: "37", roundOff: false
  });
  assert.equal(r.lines.length, 3);
  assert.deepEqual(r.summary.map(g => g.bp), [0, 500, 1800]);
  assert.equal(r.lines[0].amount, 11375);           // 2.5 x 45.50 = 113.75
  assert.equal(r.taxable, 11375 + 36000 + 6000);
  assert.equal(r.summary.find(g => g.bp === 1800).cgst, 1024); // 113.75 x 9% = 10.2375 -> 10.24
  assert.equal(r.summary.find(g => g.bp === 500).cgst, 900);
  assert.equal(r.total, 53375 + 2 * 1024 + 2 * 900);
});

test("round off to nearest rupee, half-up, reported separately", () => {
  const up = I.computeInvoice({ items: [item("99.50", "0")], sellerState: "37", placeOfSupply: "37" });
  assert.equal(up.grandTotal, 10000); assert.equal(up.roundOff, 50);
  const down = I.computeInvoice({ items: [item("99.49", "0")], sellerState: "37", placeOfSupply: "37" });
  assert.equal(down.grandTotal, 9900); assert.equal(down.roundOff, -49);
  const off = I.computeInvoice({ items: [item("99.49", "0")], sellerState: "37", placeOfSupply: "37", roundOff: false });
  assert.equal(off.grandTotal, 9949); assert.equal(off.roundOff, 0);
});

test("prices inclusive of GST: back-calculated, total unchanged", () => {
  const r = I.computeInvoice({ items: [item("118", "18")], sellerState: "37", placeOfSupply: "37", inclusive: true, roundOff: false });
  assert.equal(r.taxable, 10000); assert.equal(r.cgst, 900); assert.equal(r.sgst, 900); assert.equal(r.grandTotal, 11800);
  const s = I.computeInvoice({ items: [item("100", "5")], sellerState: "37", placeOfSupply: "37", inclusive: true, roundOff: false });
  assert.equal(s.taxable, 9524); assert.equal(s.cgst + s.sgst, 476); assert.equal(s.grandTotal, 10000);
  // odd tax paisa goes to CGST: 10 incl 18% -> taxable 8.47, tax 1.53 -> 0.77 + 0.76
  const o = I.computeInvoice({ items: [item("10", "18")], sellerState: "37", placeOfSupply: "37", inclusive: true, roundOff: false });
  assert.equal(o.taxable, 847); assert.equal(o.cgst, 77); assert.equal(o.sgst, 76); assert.equal(o.grandTotal, 1000);
  const i = I.computeInvoice({ items: [item("100", "5")], sellerState: "37", placeOfSupply: "36", inclusive: true, roundOff: false });
  assert.equal(i.igst, 476); assert.equal(i.grandTotal, 10000);
});

test("GST disabled (bill of supply) charges no tax", () => {
  const r = I.computeInvoice({ items: [item("250", "18", "2")], sellerState: "37", placeOfSupply: "37", gstEnabled: false });
  assert.equal(r.totalTax, 0); assert.equal(r.grandTotal, 50000);
});

test("invalid inputs are reported, not silently computed", () => {
  const r = I.computeInvoice({ items: [item("12.345", "18"), item("10", "abc"), item("5", "18", "x")], sellerState: "37", placeOfSupply: "37" });
  assert.equal(r.errors.length, 3);
  assert.equal(r.lines.length, 0);
  assert.equal(r.grandTotal, 0);
});

test("GSTIN validation with checksum", () => {
  assert.equal(I.validateGstin("27AAPFU0939F1ZV").ok, true);
  assert.equal(I.validateGstin("29aagcb7383j1z4").ok, true);
  assert.equal(I.validateGstin("29AAGCB7383J1Z4").stateCode, "29");
  assert.equal(I.validateGstin("27AAPFU0939F1ZW").ok, false);
  assert.equal(I.validateGstin("99AAPFU0939F1ZV").ok, false);
  assert.equal(I.validateGstin("27AAPFU0939F1Z").ok, false);
  assert.equal(I.validateGstin("").ok, true);
});
