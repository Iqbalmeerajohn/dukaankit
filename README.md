# DukaanKit

Free, print-ready tools for small shops in India: UPI QR standee, Google review QR poster, WhatsApp QR and link,
GST invoice / bill maker, and Open/Closed, shop timings and festival holiday signs. English, Hindi and Telugu.

- 100% client-side. No backend, no trackers, no external requests. Works offline (service worker, installable PWA).
- Plain HTML, CSS and JavaScript. No build step is needed to deploy: the committed HTML is served as-is.
- QR codes use the MIT-licensed Nayuki QR Code generator, vendored in `assets/js/vendor/`.

Live (after publishing): https://iqbalmeerajohn.github.io/dukaankit/

## Configuration

`assets/js/config.js` holds the only settings, including `AMAZON_TAG` (Amazon Associates tag for the gear page).
Leave it empty for plain Amazon search links with no tag.

## Develop

    # serve the parent folder so the site lives under /dukaankit/ like on GitHub Pages
    cd ..  &&  python -m http.server 5531
    # open http://127.0.0.1:5531/dukaankit/

Pages are assembled from `_build/pages/*.html` by `python _build/build_pages.py` (only needed after editing a partial
or the shared layout). Bump `VERSION` in `sw.js` whenever files change so offline copies update.

## Test

    node --test tests/*.test.js     # GST maths, amount in words, GSTIN, UPI/WhatsApp/review links
    python qa/qa.py                 # Playwright: pages at 1440/390px, QR decoding (OpenCV), PDFs, invoice, offline

## Licence

Code by Sheik Iqbal Meera John. QR library: MIT, Copyright (c) Project Nayuki (see `assets/js/vendor/LICENSE-qrcodegen.txt`).
