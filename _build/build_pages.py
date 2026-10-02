"""Assembles the static HTML pages from _build/pages/*.html partials.

The generated HTML is committed and served as-is (no build step is needed to deploy).
Run this only after editing a partial or the shared layout:  python _build/build_pages.py
Folders starting with "_" are not published by GitHub Pages (Jekyll), so this stays private.
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://iqbalmeerajohn.github.io/dukaankit/"
PORTFOLIO = "https://iqbalmeerajohn.github.io/portfolio/"
KITS = "https://iqbalmeerajohn.github.io/kits/"

PAGES = [
    # slug, partial, title, description, nav label, scripts, body class
    ("", "home", "DukaanKit: Free UPI QR Standee, GST Bill and Shop Poster Maker",
     "Free print-ready tools for Indian shops: UPI payment QR standee, Google review QR poster, WhatsApp QR, GST invoice maker and shop timing signs. Works offline, nothing uploaded.",
     None, [], "home"),
    ("upi-qr-standee/", "upi", "UPI QR Code Standee Maker (Free, Print-Ready A5/A6 PDF) | DukaanKit",
     "Make a UPI payment QR standee for your shop counter. Enter your UPI ID, get a print-ready A5 or A6 poster in English, Hindi or Telugu. Free, works offline.",
     "UPI QR", ["vendor/qrcodegen.js", "links.js", "invoice-core.js", "poster.js", "tool.js", "upi.js"], "tool-page"),
    ("google-review-qr/", "review", "Google Review QR Code Poster Maker for Shops (Free) | DukaanKit",
     "Turn your Google review link into a printable \"Review us on Google\" QR poster. Shows how to find the link in Google Business Profile. Free, no sign-up.",
     "Review QR", ["vendor/qrcodegen.js", "links.js", "poster.js", "tool.js", "review.js"], "tool-page"),
    ("whatsapp-qr/", "whatsapp", "WhatsApp QR Code and Click-to-Chat Link Generator (Free) | DukaanKit",
     "Create a wa.me click-to-chat link with a ready message, a WhatsApp QR code and a printable poster for your shop. Free, runs in your browser.",
     "WhatsApp", ["vendor/qrcodegen.js", "links.js", "poster.js", "tool.js", "whatsapp.js"], "tool-page"),
    ("gst-invoice/", "invoice", "Free GST Invoice Generator: CGST, SGST, IGST Bill Maker | DukaanKit",
     "Make a GST tax invoice or simple bill in your browser. Automatic CGST+SGST or IGST by place of supply, amount in words, UPI QR, print or save as PDF. Free.",
     "GST bill", ["vendor/qrcodegen.js", "links.js", "invoice-core.js", "poster.js", "invoice.js"], "tool-page printing-invoice"),
    ("shop-sign/", "sign", "Open/Closed Sign, Shop Timings and Holiday Notice Maker (Free) | DukaanKit",
     "Print an Open/Closed door sign, a shop timings board or a festival holiday notice in English, Hindi or Telugu. Free A4, A5 and A6 PDFs.",
     "Signs", ["poster.js", "tool.js", "sign.js"], "tool-page"),
    ("recommended-gear/", "gear", "UPI Soundbox, Thermal Printer and Barcode Scanner Buying Guide | DukaanKit",
     "What to look for when buying a UPI soundbox, thermal receipt printer, label printer or barcode scanner for a small shop in India. Honest, no paid rankings.",
     "Gear", [], "gear-page"),
]
NAV = [(p[0], p[4]) for p in PAGES if p[4]]


THEMES = [("leaf", "#0f5132", "Green"), ("saffron", "#d9620b", "Saffron"), ("indigo", "#23306a", "Indigo"),
          ("yellow", "#ffd23f", "Yellow"), ("maroon", "#76202b", "Maroon"), ("white", "#fbfbf9", "White (saves ink)")]
SIZES = {"A4": "A4 (door / wall)", "A5": "A5 (half of A4)", "A6": "A6 (quarter of A4)"}


def poster_options(theme="leaf", sizes="A5,A6", size="A5", langs=True):
    out = []
    if langs:
        out.append('<fieldset class="chips field">\n<legend>Poster language</legend>\n' + "\n".join(
            f'<label class="chip"><input type="radio" name="lang" value="{v}"{" checked" if v == "en+hi" else ""}><span>{l}</span></label>'
            for v, l in [("en+hi", "English + Hindi"), ("en+te", "English + Telugu"), ("en", "English"), ("hi", "हिन्दी"), ("te", "తెలుగు")]) + "\n</fieldset>")
    out.append('<fieldset class="chips field">\n<legend>Colour</legend>\n' + "\n".join(
        f'<label class="chip"><input type="radio" name="theme" value="{k}"{" checked" if k == theme else ""}><span><i class="swatch" style="background:{c}"></i>{n}</span></label>'
        for k, c, n in THEMES) + "\n</fieldset>")
    out.append('<fieldset class="chips field">\n<legend>Paper size</legend>\n' + "\n".join(
        f'<label class="chip"><input type="radio" name="size" value="{k}"{" checked" if k == size else ""}><span>{SIZES[k]}</span></label>'
        for k in sizes.split(",")) + "\n</fieldset>")
    return "\n".join(out)


def preview(label="Link inside the QR:", test="Test on this phone", qr=True, demo="Showing a sample. Fill in your details to make your own poster."):
    qrbtn = '<button class="btn btn-quiet" type="button" data-action="qr">QR only (PNG)</button>' if qr else ""
    link = f"""<div class="link-out">
<span class="small muted">{label}</span>
<code id="link-out"></code>
<div class="actions">
<button class="btn btn-ghost btn-sm" type="button" data-action="copy">Copy link</button>
<a class="btn btn-ghost btn-sm" id="test-link" href="#" hidden rel="noopener" target="_blank">{test}</a>
</div>
</div>""" if label else ""
    return f"""<div class="preview-col">
<div class="panel">
<h2>Preview</h2>
<p class="notice" id="demo-hint">{demo}</p>
<div class="preview-frame" id="preview" aria-live="polite" aria-busy="true"></div>
<div class="actions">
<button class="btn" type="button" data-action="pdf">Download PDF</button>
<button class="btn btn-quiet" type="button" data-action="png">Download PNG</button>
<button class="btn btn-quiet" type="button" data-action="print">Print</button>
{qrbtn}
</div>
<p class="status" id="status" role="status"></p>
{link}
</div>
</div>"""


def expand(body):
    def rep(m):
        name, args = m.group(1), dict(a.split("=", 1) for a in m.group(2).split("|") if a)
        for k in ("qr", "langs"):
            if k in args: args[k] = args[k] == "1"
        return {"poster-options": poster_options, "preview": preview}[name](**args)
    return re.sub(r"<!--@([\w-]+)\s*([^>]*?)-->", rep, body)


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def faq_jsonld(body):
    qa = re.findall(r"<details>\s*<summary>(.*?)</summary>\s*<div>(.*?)</div>\s*</details>", body, re.S)
    if not qa:
        return None
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": strip_tags(q), "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}} for q, a in qa]}


def layout(slug, partial, title, desc, scripts, bodyclass):
    depth = slug.count("/")
    root = "../" * depth if depth else "./"
    url = SITE + slug
    body = (ROOT / "_build" / "pages" / f"{partial}.html").read_text(encoding="utf-8")
    h1 = strip_tags(re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S).group(1))
    ld = []
    if slug:
        ld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "DukaanKit", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": h1, "item": url}]})
    else:
        ld.append({"@context": "https://schema.org", "@type": "WebSite", "name": "DukaanKit", "url": SITE,
                   "description": desc, "inLanguage": "en-IN"})
    f = faq_jsonld(body)
    if f:
        ld.append(f)
    nav = "".join(
        f'<a href="{root}{s}"{" aria-current=\"page\"" if s == slug else ""}>{label}</a>' for s, label in NAV)
    nav += f'<a class="nav-all" href="{root}#tools">All tools</a>'
    crumbs = "" if not slug else f'<nav class="crumbs" aria-label="Breadcrumb"><a href="{root}">DukaanKit</a> / <span>{html.escape(h1)}</span></nav>'
    js = "".join(f'\n<script src="{root}assets/js/{s}"></script>' for s in scripts)
    ldjs = "\n".join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + "</script>" for x in ld)
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    body = expand(body.replace("{root}", root))
    return f'''<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0f6b4f">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DukaanKit">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="DukaanKit: free print-ready QR posters and GST bills for Indian shops">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="{root}assets/img/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="{root}assets/img/apple-touch-icon.png">
<link rel="manifest" href="{root}manifest.webmanifest">
<link rel="stylesheet" href="{root}assets/css/site.css">
{ldjs}
</head>
<body class="{bodyclass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="{root}"><img src="{root}assets/img/icon-192.png" alt="" width="30" height="30">DukaanKit</a>
<nav class="nav" aria-label="Tools">{nav}</nav>
</div></header>
<main id="main" class="wrap">
{crumbs}
{body}
<aside class="promo" aria-label="Website for your shop">
<div>
<p class="promo-title">Want customers to find you on Google? Get a full website for your shop, from &#8377;8,000.</p>
<p class="muted">Built by the maker of DukaanKit. &#8377;8,000 one-time plus &#8377;800 a month.</p>
</div>
<div class="promo-links">
<a class="btn" href="{PORTFOLIO}">See websites I've built</a>
<a class="btn btn-ghost" href="{KITS}">Ready-made templates</a>
</div>
</aside>
</main>
<footer class="site-footer"><div class="wrap">
<div>
<p><strong>DukaanKit</strong> is a free set of tools for small shops in India. Everything runs in your browser. Nothing you type is uploaded or stored on any server, and it keeps working without internet once opened.</p>
<p class="small">&copy; <span id="year">2026</span> Sheik Iqbal Meera John, Visakhapatnam. <a href="{PORTFOLIO}">Portfolio</a></p>
</div>
<div><h2>Tools</h2><ul>
<li><a href="{root}upi-qr-standee/">UPI QR standee</a></li>
<li><a href="{root}google-review-qr/">Google review poster</a></li>
<li><a href="{root}whatsapp-qr/">WhatsApp QR and link</a></li>
<li><a href="{root}gst-invoice/">GST invoice maker</a></li>
<li><a href="{root}shop-sign/">Open/Closed and holiday signs</a></li>
</ul></div>
<div><h2>More</h2><ul>
<li><a href="{root}recommended-gear/">Recommended shop gear</a></li>
<li><a href="{KITS}">Website templates</a></li>
<li><a href="{PORTFOLIO}">Get a website for your shop</a></li>
</ul></div>
</div></footer>
<script src="{root}assets/js/config.js"></script>
<script src="{root}assets/js/site.js"></script>{js}
</body>
</html>
'''


def main():
    for slug, partial, title, desc, _nav, scripts, bodyclass in PAGES:
        out = ROOT / slug / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(layout(slug, partial, title, desc, scripts, bodyclass), encoding="utf-8", newline="\n")
        print("wrote", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
