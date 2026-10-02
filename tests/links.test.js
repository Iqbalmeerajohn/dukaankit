const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../assets/js/links.js");

test("UPI ID validation", () => {
  assert.equal(L.validateUpiId("ravistores@okaxis").ok, true);
  assert.equal(L.validateUpiId("9876543210@ybl").ok, true);
  assert.equal(L.validateUpiId("shop.name-1_a@oksbi").ok, true);
  assert.equal(L.validateUpiId("ravi stores@okaxis").ok, false);
  assert.equal(L.validateUpiId("ravistores").ok, false);
  assert.equal(L.validateUpiId("a@b@c").ok, false);
  assert.equal(L.validateUpiId("ravi@1bank").ok, false);
  assert.equal(L.validateUpiId("").ok, false);
});

test("UPI URI is built exactly", () => {
  assert.equal(L.buildUpiUri({ pa: "ravistores@okaxis", pn: "Ravi General Stores" }),
    "upi://pay?pa=ravistores@okaxis&pn=Ravi%20General%20Stores&cu=INR");
  assert.equal(L.buildUpiUri({ pa: "a1@ybl", pn: "Sri Lakshmi & Sons", am: "250.00" }),
    "upi://pay?pa=a1@ybl&pn=Sri%20Lakshmi%20%26%20Sons&am=250.00&cu=INR");
});

test("amount normalisation", () => {
  assert.equal(L.normaliseAmount("").value, "");
  assert.equal(L.normaliseAmount("250").value, "250.00");
  assert.equal(L.normaliseAmount("1,250.5").value, "1250.50");
  assert.equal(L.normaliseAmount("0").ok, false);
  assert.equal(L.normaliseAmount("12.345").ok, false);
  assert.equal(L.normaliseAmount("abc").ok, false);
});

test("WhatsApp number and link", () => {
  assert.equal(L.normalisePhone("91", "98765 43210").value, "919876543210");
  assert.equal(L.normalisePhone("91", "+91 98765-43210").value, "919876543210");
  assert.equal(L.normalisePhone("91", "098765 43210").value, "919876543210");
  assert.equal(L.normalisePhone("91", "12345 67890").ok, false);
  assert.equal(L.normalisePhone("971", "050 123 4567").value, "971501234567");
  assert.equal(L.buildWaLink("919876543210", "Hi, I want to order"), "https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20order");
  assert.equal(L.buildWaLink("919876543210", ""), "https://wa.me/919876543210");
});

test("Google review link checks", () => {
  assert.equal(L.checkReviewLink("https://g.page/r/CabcDEF123/review").ok, true);
  assert.equal(L.checkReviewLink("g.page/r/CabcDEF123/review").value, "https://g.page/r/CabcDEF123/review");
  assert.ok(!L.checkReviewLink("https://search.google.com/local/writereview?placeid=ChIJabc").warn);
  assert.ok(L.checkReviewLink("https://example.com/x").warn);
  assert.equal(L.checkReviewLink("ChIJN1t_tDeuEmsRUsoyG83frY4").value,
    "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4");
  assert.equal(L.checkReviewLink("").ok, false);
});
