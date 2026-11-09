# Tang Xu Travel website

Static, dependency-free site (HTML/CSS/JS with CSS-3D parallax, tilt cards and a 3D ring).

- `index.html` – shared home page + country chooser
- `malaysia.html` – Muslim-friendly Xi'an, halal/prayer angle, sample prices in RMB (¥), WhatsApp CTA
- `usa.html` – Heritage & Luxury Xi'an, history timeline, sample prices in USD ($), lead form

Open `index.html` in a browser, or run `npx serve .`.

## Before launch (TODO)
- Replace sample prices (Tang Xu Travel sets the real ones).
- Set the real WhatsApp number in `malaysia.html` (`data-wa`) and inbox in `usa.html` / `index.html` (`data-mail`).
- Swap SVG illustrations for real photos (Terracotta Army, Great Mosque, Muslim Quarter).
- Add Bahasa Malaysia copy for the Malaysia page.

## Babyglee shop (`babyglee/`)
Static, mobile-first kids'-sneaker store (teal `#24babc` theme): Home, Shop, 5 single-page-checkout landing pages
(`bounce-*.html`, one per colour, for ads), About, Contact, Privacy, Terms, Shipping & Returns.

- Pages are generated: edit `tools/build_babyglee.py`, then run `python3 tools/build_babyglee.py`.
- Settings (price, delivery charges, WhatsApp, optional Meta Pixel ID and order webhook): `babyglee/assets/config.js`.
- Orders are sent to WhatsApp; set `ORDER_ENDPOINT` to also post each order as JSON to a webhook / Google Sheet.
