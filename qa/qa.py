"""DukaanKit QA. Serve the folder above this repo first, e.g.
     cd "E:/lets do/ventures" && python -m http.server 5531
   then: python qa/qa.py [base_url]
Checks every page at 1440 and 390 px for console errors, failed requests and horizontal scroll,
decodes the generated QR codes with OpenCV, checks PDF output, the invoice totals and offline mode."""
import asyncio, base64, sys
from pathlib import Path
import cv2, numpy as np
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5531/dukaankit/").rstrip("/") + "/"
PAGES = ["", "upi-qr-standee/", "google-review-qr/", "whatsapp-qr/", "gst-invoice/", "shop-sign/", "recommended-gear/"]
SHOTS = Path(__file__).parent / "shots"; SHOTS.mkdir(exist_ok=True)
fails = []

def check(cond, label):
    print(("PASS " if cond else "FAIL ") + label)
    if not cond: fails.append(label)

def decode(dataurl):
    img = cv2.imdecode(np.frombuffer(base64.b64decode(dataurl.split(",")[1]), np.uint8), cv2.IMREAD_COLOR)
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    if not text:  # try a downscaled copy (the detector prefers moderate sizes)
        small = cv2.resize(img, (img.shape[1] // 2, img.shape[0] // 2), interpolation=cv2.INTER_AREA)
        text, _, _ = cv2.QRCodeDetector().detectAndDecode(small)
    return text

async def new_page(b, vp):
    pg = await b.new_page(viewport=vp)
    pg.errs, pg.bad = [], []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)[:160]))
    pg.on("console", lambda m: m.type == "error" and pg.errs.append(m.text[:160]))
    pg.on("response", lambda r: r.status >= 400 and pg.bad.append(f"{r.status} {r.url}"))
    return pg

async def shot(pg, path):
    # Screenshots are evidence only: capped in height and never fatal (large captures can fail on low-memory machines).
    try:
        h = min(await pg.evaluate("document.documentElement.scrollHeight"), 4000)
        await pg.screenshot(path=str(path), clip={"x": 0, "y": 0, "width": pg.viewport_size["width"], "height": h}, full_page=True)
    except Exception as e:
        print("note: screenshot skipped", path.name, str(e)[:80])

async def canvas_url(pg, sel="#preview canvas"):
    return await pg.evaluate(f"document.querySelector('{sel}').toDataURL('image/png')")

async def layout_checks(b):
    for slug in PAGES:
        for tag, vp in [("1440", {"width": 1440, "height": 900}), ("390", {"width": 390, "height": 844})]:
            pg = await new_page(b, vp)
            await pg.goto(BASE + slug, wait_until="networkidle"); await pg.wait_for_timeout(700)
            ov = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            h1 = await pg.evaluate("document.querySelectorAll('h1').length")
            promo = await pg.evaluate("!!document.querySelector('.promo a[href*=\"portfolio\"]') && !!document.querySelector('.promo a[href*=\"kits\"]')")
            small = await pg.evaluate("""[...document.querySelectorAll('main button, main .btn, main input:not([type=checkbox]):not([type=radio]), main select')]
                .filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).length""")
            name = slug.strip("/") or "home"
            await shot(pg, SHOTS / f"{name}-{tag}.png")
            check(not pg.errs and not pg.bad and ov <= 0 and h1 == 1 and promo and small == 0,
                  f"{name:18s} @{tag}: errors={pg.errs[:2]} bad={pg.bad[:2]} hscroll={ov} h1={h1} promo={promo} small_targets={small}")
            await pg.close()

UPI_CASES = [
    ({"shop": "Sri Lakshmi General Stores", "pa": "ravistores@okaxis", "pn": "Ravi Kumar", "am": ""}, "en+hi", "A5",
     "upi://pay?pa=ravistores@okaxis&pn=Ravi%20Kumar&cu=INR"),
    ({"shop": "Annapurna Mess", "pa": "9876543210@ybl", "pn": "Sri Lakshmi & Sons", "am": "250"}, "en+te", "A6",
     "upi://pay?pa=9876543210@ybl&pn=Sri%20Lakshmi%20%26%20Sons&am=250.00&cu=INR"),
    ({"shop": "", "pa": "shop.name-1_a@oksbi", "pn": "K. Venkata Rao", "am": "1,499.5"}, "te", "A5",
     "upi://pay?pa=shop.name-1_a@oksbi&pn=K.%20Venkata%20Rao&am=1499.50&cu=INR"),
]

async def upi_checks(b):
    pg = await new_page(b, {"width": 1440, "height": 900})
    await pg.goto(BASE + "upi-qr-standee/", wait_until="networkidle")
    for fields, lang, size, expected in UPI_CASES:
        for k, v in fields.items(): await pg.fill(f"#{k}", v)
        await pg.check(f"input[name=lang][value='{lang}']"); await pg.check(f"input[name=size][value='{size}']")
        await pg.wait_for_timeout(500)
        got = decode(await canvas_url(pg)); shown = await pg.inner_text("#uri-out")
        check(got == expected and shown == expected, f"UPI QR decodes exactly ({lang}, {size}): {got}")
    await pg.fill("#pa", "not a upi id"); await pg.wait_for_timeout(400)
    err = await pg.inner_text("#pa ~ .error")
    disabled = await pg.evaluate("document.querySelector('[data-action=pdf]').disabled")
    check(bool(err) and disabled, "UPI: invalid ID shows an error and disables downloads")
    await pg.fill("#pa", "ravistores@okaxis"); await pg.wait_for_timeout(400)
    async with pg.expect_download() as dl:
        await pg.click("[data-action=pdf]")
    path = await (await dl.value).path(); data = Path(path).read_bytes()
    check(data.startswith(b"%PDF-1.4") and b"/MediaBox [0 0 419.53 595.28]" in data and data.rstrip().endswith(b"%%EOF"), f"UPI: A5 PDF download is a valid PDF ({len(data)} bytes)")
    async with pg.expect_download() as dl:
        await pg.click("[data-action=png]")
    png = Path(await (await dl.value).path()).read_bytes()
    check(png[:8] == b"\x89PNG\r\n\x1a\n", "UPI: PNG download works")
    check(not pg.errs, f"UPI: no console errors during interaction {pg.errs[:2]}")
    await pg.close()

async def other_tools(b):
    pg = await new_page(b, {"width": 1440, "height": 900})
    await pg.goto(BASE + "google-review-qr/", wait_until="networkidle")
    link = "https://g.page/r/CQx3kQ9example/review"
    await pg.fill("#link", link); await pg.fill("#shop", "Sai Ram Tiffins"); await pg.check("input[name=lang][value='en+te']")
    await pg.wait_for_timeout(500)
    check(decode(await canvas_url(pg)) == link, "Review QR decodes to the review link")
    await pg.fill("#link", "ChIJN1t_tDeuEmsRUsoyG83frY4"); await pg.wait_for_timeout(500)
    check(decode(await canvas_url(pg)) == "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4", "Review: Place ID builds the writereview link")

    await pg.goto(BASE + "whatsapp-qr/", wait_until="networkidle")
    await pg.fill("#phone", "98765 43210"); await pg.fill("#msg", "Namaste, mujhe order dena hai. నమస్తే!"); await pg.wait_for_timeout(500)
    got = decode(await canvas_url(pg))
    exp = "https://wa.me/919876543210?text=Namaste%2C%20mujhe%20order%20dena%20hai.%20%E0%B0%A8%E0%B0%AE%E0%B0%B8%E0%B1%8D%E0%B0%A4%E0%B1%87%21"
    check(got == exp, f"WhatsApp QR decodes exactly: {got}")
    await pg.fill("#phone", "12345"); await pg.wait_for_timeout(400)
    check(bool(await pg.inner_text("#phone ~ .error")), "WhatsApp: invalid number shows an error")

    await pg.goto(BASE + "shop-sign/", wait_until="networkidle")
    n = await pg.evaluate("document.querySelectorAll('#preview canvas').length")
    check(n == 2, f"Sign: Open/Closed makes 2 pages (got {n})")
    await pg.check("input[name=mode][value=timings]"); await pg.wait_for_timeout(400)
    check(await pg.evaluate("document.querySelectorAll('#preview canvas').length") == 1 and await pg.is_visible("#days"), "Sign: timings mode shows day rows and one page")
    await pg.check("input[name=mode][value=holiday]"); await pg.select_option("#fest", "diwali")
    await pg.fill("#d_from", "2026-11-08"); await pg.fill("#d_to", "2026-11-09"); await pg.wait_for_timeout(500)
    check("10" in await pg.inner_text("#reopen-hint") or await pg.inner_text("#reopen-hint") != "", "Sign: holiday reopen date auto-filled")
    async with pg.expect_download() as dl:
        await pg.click("[data-action=pdf]")
    data = Path(await (await dl.value).path()).read_bytes()
    check(data.startswith(b"%PDF") and b"/MediaBox [0 0 841.89 595.28]" in data, "Sign: A4 landscape PDF")
    await pg.screenshot(path=str(SHOTS / "sign-holiday.png"))
    check(not pg.errs and not pg.bad, f"Other tools: no console errors {pg.errs[:2]} {pg.bad[:2]}")
    await pg.close()

async def invoice_checks(b):
    pg = await new_page(b, {"width": 390, "height": 844})
    await pg.goto(BASE + "gst-invoice/", wait_until="networkidle")
    await pg.fill("#s_name", "Sri Venkateswara Traders"); await pg.fill("#s_gstin", "37AAPFU0939F1ZU")
    await pg.fill("#b_name", "Lakshmi Tiffin Centre")
    rows = await pg.query_selector_all(".item-row")
    await (await rows[0].query_selector("[data-k=desc]")).fill("Basmati rice 5 kg")
    r0 = rows[0]
    await (await r0.query_selector("[data-k=qty]")).fill("2"); await (await r0.query_selector("[data-k=rate]")).fill("540")
    await (await r0.query_selector("[data-k=gst]")).select_option("5")
    await pg.click("#add-item"); r1 = (await pg.query_selector_all(".item-row"))[1]
    await (await r1.query_selector("[data-k=desc]")).fill("Steel tiffin box"); await (await r1.query_selector("[data-k=rate]")).fill("450.25")
    await (await r1.query_selector("[data-k=gst]")).select_option("18")
    await pg.wait_for_timeout(400)
    sheet = await pg.inner_text("#sheet")
    # 1080 @5% -> 27.00 + 27.00 ; 450.25 @18% -> 40.5225 -> 40.52 each ; total 1665.29 -> 1665.00, round off -0.29
    check("CGST" in sheet and "IGST" not in sheet and "1,665.00" in sheet and "One Thousand Six Hundred Sixty-Five Only" in sheet and "-0.29" in sheet,
          "Invoice: intra-state CGST+SGST totals, round off and words correct")
    await pg.select_option("#pos", "36"); await pg.wait_for_timeout(400)
    sheet = await pg.inner_text("#sheet")
    check("IGST" in sheet and "SGST" not in sheet and "81.05" in sheet, "Invoice: changing place of supply switches to IGST")
    await pg.fill("#s_upi", "svtraders@oksbi"); await pg.wait_for_timeout(400)
    uri = await pg.get_attribute("#pay-qr", "data-uri")
    got = decode(await canvas_url(pg, "#pay-qr"))
    check(got == uri and "am=" in uri and "tn=Invoice%20INV-001" in uri, f"Invoice: UPI QR decodes with exact amount: {got}")
    await pg.click("#save-inv"); await pg.wait_for_timeout(200)
    check("Saved" in await pg.inner_text("#inv-status") and await pg.evaluate("document.querySelectorAll('#saved li button').length") == 2, "Invoice: saved locally")
    await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(400)
    check(await pg.input_value("#s_name") == "Sri Venkateswara Traders", "Invoice: draft restored after reload")
    await pg.emulate_media(media="print"); await shot(pg, SHOTS / "invoice-print.png")
    vis = await pg.evaluate("[...document.querySelectorAll('main > *')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.className)")
    check(vis == ["section invoice-print"], f"Invoice: print stylesheet shows only the invoice ({vis})")
    await pg.emulate_media(media="screen")
    ov = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
    check(ov <= 0 and not pg.errs, f"Invoice @390 after filling: hscroll={ov} errors={pg.errs[:2]}")
    await pg.close()

async def offline_check(b):
    ctx = await b.new_context()
    pg = await ctx.new_page()
    await pg.goto(BASE, wait_until="networkidle")
    await pg.evaluate("navigator.serviceWorker.ready.then(() => true)")
    await pg.wait_for_timeout(1500)
    await ctx.set_offline(True)
    ok = True
    for slug in ["upi-qr-standee/", "gst-invoice/", "shop-sign/"]:
        try:
            await pg.goto(BASE + slug, wait_until="load"); await pg.wait_for_timeout(500)
            ok = ok and await pg.evaluate("!!document.querySelector('#preview canvas, #sheet')")
        except Exception as e:
            ok = False; print("offline error", slug, e)
    check(ok, "Offline: tool pages load and work from the service worker cache")
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await layout_checks(b); await upi_checks(b); await other_tools(b); await invoice_checks(b); await offline_check(b)
        await b.close()
    print(f"\n{len(fails)} failure(s)")
    sys.exit(1 if fails else 0)

asyncio.run(main())
