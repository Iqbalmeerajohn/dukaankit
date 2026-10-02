# DukaanKit growth plan (free channels only)

Everything here is for the owner to do by hand. Nothing has been posted or submitted.
Live URL once published: https://iqbalmeerajohn.github.io/dukaankit/

## 1. SEO: target keywords per page

No search-volume numbers are given on purpose: they were not measured. Before writing more content,
check real demand for free with Google Search Console (after launch), Google Trends (compare terms, region India)
and Google's own autocomplete / "People also ask" boxes.

The angle: generic "UPI QR generator" and "GST invoice generator" results are crowded by big apps and banks.
DukaanKit aims at the longer, more specific phrases a shop owner types when they want something to print.

| Page | Primary target | Long-tail / supporting | Why |
|---|---|---|---|
| Home `/` | free shop poster maker India | UPI standee and GST bill free tool; tools for kirana shop | Brand + umbrella page; links to every tool. Will rank mainly on brand and internal links at first. |
| `/upi-qr-standee/` | UPI QR code standee maker | UPI QR code poster printable; UPI QR with shop name A5; UPI QR in Telugu / Hindi; UPI QR with fixed amount; printable UPI payment QR for shop counter | "Standee" / "poster" / "printable" plus language words are more specific than "UPI QR generator", where bank and app pages dominate. Telugu/Hindi poster text is a real differentiator. |
| `/google-review-qr/` | Google review QR code poster | how to get Google review link; review us on Google poster printable; Google review QR code free | "How to get Google review link" is an informational query the how-to section answers directly, and it leads into the tool. |
| `/whatsapp-qr/` | WhatsApp QR code for shop | wa.me link generator with message; WhatsApp click to chat link; WhatsApp order poster | Crowded at the head term; the page targets the "for shop / poster / with message" variants. |
| `/gst-invoice/` | free GST invoice generator online | GST bill format with CGST SGST; IGST vs CGST SGST invoice; bill of supply format; GST invoice with UPI QR; amount in words Indian rupees | Very competitive head term. The FAQ and "how tax is calculated" section target explanation queries where a precise answer can rank. |
| `/shop-sign/` | shop open closed sign printable | shop timings board maker; Diwali holiday notice for shop; shop closed notice in Telugu / Hindi; festival holiday board | Seasonal: holiday-notice searches rise before Diwali, Sankranti, Ugadi, Eid etc. Refresh the page a few weeks before each festival. |
| `/recommended-gear/` | UPI soundbox buying guide | thermal printer 58mm vs 80mm; 1D vs 2D barcode scanner; label printer for small shop | Buying-guide queries; the only page with affiliate links. Keep it honest; thin affiliate pages get demoted. |

On-page work already done: unique title, meta description and one H1 per page, how-to + FAQ sections, FAQPage and
BreadcrumbList JSON-LD, canonical URLs, Open Graph image, sitemap.xml, robots.txt, fast pages with no third-party scripts.

Next content ideas (each a new small page, only if Search Console shows impressions for related terms):
- "UPI QR code in Telugu" and "in Hindi" landing pages pre-set to that language.
- Festival-specific holiday notice pages (Diwali, Sankranti) published 3 to 4 weeks before the festival.
- "GST invoice format for kirana shop" with a pre-filled example.

## 2. Google Search Console (owner does this)

1. After the site is live on GitHub Pages, open https://search.google.com/search-console and sign in with your Google account.
2. Add property, choose **URL prefix**, enter `https://iqbalmeerajohn.github.io/dukaankit/`.
3. Verify with the **HTML tag** method: copy the `<meta name="google-site-verification" ...>` tag, paste it into the `<head>` of
   `_build/build_pages.py` (the layout function), run `python _build/build_pages.py`, commit and push, then click Verify.
   (If you already verified `https://iqbalmeerajohn.github.io/` as a property, the subfolder is covered and you can skip this.)
4. Open **Sitemaps** and submit `https://iqbalmeerajohn.github.io/dukaankit/sitemap.xml`.
5. Use **URL inspection** on the home page and each tool page and click **Request indexing**.
6. Check **Performance** every week or two. Queries with impressions but low clicks tell you which titles to improve.
7. Optional: do the same in Bing Webmaster Tools (it can import from Search Console in one click).

## 3. Ten free places to share it (post manually, read each place's rules first)

General rules: post as yourself, say you built it, never post the same text everywhere on the same day, reply to every
comment, and do not spam groups you are not a member of. Several Reddit communities only allow self-promotion on set days
or in a pinned thread; read the sidebar first and skip the subreddit if links are not allowed. Finance subreddits such as
r/IndiaInvestments are not a fit for this and should not be used.

### 1. Local WhatsApp business / traders groups (Vizag and nearby)
Ask the group admin before posting.
> Namaste, I made a free tool for shop owners: print a UPI QR standee with your shop name in Telugu or Hindi, a Google review poster, a WhatsApp order QR, shop timing boards and GST bills. Works on any Android phone, no sign-up, nothing uploaded. https://iqbalmeerajohn.github.io/dukaankit/  If anything is confusing, message me and I will fix it.

Telugu version:
> నమస్తే, షాప్ యజమానుల కోసం ఒక ఉచిత టూల్ తయారు చేశాను: మీ షాప్ పేరుతో UPI QR స్టాండీ, Google రివ్యూ పోస్టర్, WhatsApp QR, దుకాణం వేళల బోర్డు, GST బిల్లు. ఏ ఆండ్రాయిడ్ ఫోన్‌లోనైనా పనిచేస్తుంది, సైన్-అప్ అవసరం లేదు. https://iqbalmeerajohn.github.io/dukaankit/

### 2. Facebook groups for small business owners (AP / Telangana / India)
> I built DukaanKit, a free set of print-ready tools for small shops: UPI QR standee (A5/A6 PDF), "Review us on Google" poster, WhatsApp QR, Open/Closed and festival holiday signs, and a GST invoice maker with automatic CGST/SGST or IGST. English, Hindi and Telugu. It runs in the browser, works offline and does not collect any data. Feedback welcome: https://iqbalmeerajohn.github.io/dukaankit/

### 3. LinkedIn (personal post)
> Most UPI QR and GST bill tools are built for screens. Shop owners need something they can print and stick on the counter.
>
> So I built DukaanKit: free, print-ready tools for Indian shops.
> - UPI QR standee with shop name, A5/A6 PDF, English/Hindi/Telugu
> - Google review and WhatsApp QR posters
> - Open/Closed, timings and festival holiday signs
> - GST invoice maker: CGST+SGST vs IGST by place of supply, amount in words in lakh/crore, UPI QR with the exact amount
>
> Plain HTML/CSS/JS, 100% client-side, works offline as a PWA, no trackers. The tax maths runs in integer paise with unit tests.
> https://iqbalmeerajohn.github.io/dukaankit/
>
> If you know a shop owner who would use this, please share it with them.

### 4. Peerlist (Project / Launchpad)
Title: DukaanKit: print-ready QR posters and GST bills for Indian shops
> Free toolkit for small shops in India. Generates UPI payment QR standees, Google review and WhatsApp QR posters, shop signs in English/Hindi/Telugu, and GST invoices with correct CGST/SGST/IGST split. Vanilla JS, no backend, offline PWA, QR codes verified by decoding in automated tests.

### 5. Product Hunt
Tagline (60 chars max): Free print-ready UPI QR standees and GST bills for shops
> Hi Product Hunt. DukaanKit is a free, no-sign-up toolkit for small shops in India. Shop owners need things they can print: a UPI QR standee with their shop name, a "review us on Google" card, an Open/Closed sign in their language, and a correct GST bill. Everything runs in the browser and nothing is uploaded. I would love feedback on what else a shop counter needs.
Launch on a weekday; ask people to try it, not to upvote.

### 6. r/developersIndia (only in the thread or on the day the rules allow showcases)
> Built a 100% client-side toolkit for Indian shops: UPI QR standees (upi://pay deep links, verified by decoding the QR with OpenCV in Playwright tests), GST invoices (integer-paise maths, CGST/SGST vs IGST vs UTGST, amount in words in lakh/crore, node:test unit tests), Telugu/Hindi poster text on canvas, a tiny hand-written PDF writer, offline PWA. No framework, no build step. Happy to take code feedback: https://iqbalmeerajohn.github.io/dukaankit/

### 7. Indie Hackers (post in "Show IH" / product page)
> DukaanKit: free tools for Indian shop owners, built as a funnel for my small-business website service. Curious how others measure a free tool's value without any analytics. Here is the plan and what I learn.

### 8. Hacker News (Show HN)
Title: Show HN: DukaanKit, print-ready UPI QR standees and GST invoices, fully client-side
> A small no-build PWA for Indian shops. Interesting bits: the GST maths is in integer paise with tests, the PDF is generated by a ~60-line writer that embeds a JPEG, and the QR codes are checked by decoding them in CI-style Playwright tests.

### 9. Print shops and DTP centres (offline, in person)
Print a few A6 cards with a QR to the site and leave them at local print/xerox shops; they are where shop owners go to print standees.
> Free UPI QR standee and shop poster maker. Make it on your phone, print it here. iqbalmeerajohn.github.io/dukaankit

### 10. Your own channels
- Add DukaanKit to the portfolio site and the kits store footer, with a link back.
- Add the link to your GitHub profile README and the repo description.
- Share the link on your WhatsApp status with a photo of a printed standee on a real counter (with the shop owner's permission).
