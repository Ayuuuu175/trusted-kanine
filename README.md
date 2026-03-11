# Trusted Kanine Ltd — Official website

Public landing page for dog training, dog food, equipment and crates. Customers see products and contact you via WhatsApp to order. **There is no admin link on this site** — the admin area is a separate site (web2) that only you access.

## What’s included

- **This folder (official site)** — Hero, about, products, WhatsApp contact. Products are loaded from the **admin site’s API** (web2) if you set `window.TRUSTED_KANINE_API`, or from a built-in list if the API is not set or fails.
- **web2 folder (admin site)** — Separate app: login and dashboard to add/remove products. Not linked from here. You open it by typing its URL (e.g. `https://admin.yourdomain.com`). Changes there update the data the official site fetches.

## Run the official site only (static)

- Open `index.html` in a browser, or host this folder on any static host (Netlify, Vercel, etc.). Products will show from the **built-in list** in `script.js` (same catalogue you had: FOCUS, DROOLS, crates, etc.).
- To have the official site use **live data** from the admin site, set in `index.html`:
  ```html
  <script>window.TRUSTED_KANINE_API = 'https://your-admin-site-url.com';</script>
  ```
  Then the official site will fetch products from that URL’s `/api/products`.

## Run official site + admin on one machine (development)

1. **Admin site (web2)** — In the `web2` folder: `npm install`, create `.env` with `ADMIN_PASSWORD`, then `npm start` (e.g. http://localhost:3001).
2. **Official site** — Either open `index.html` in the browser (products from built-in list) or run the **root** `npm start` (server.js) so the site is at http://localhost:3000 and can use same-origin API. For local dev with web2 only, set `window.TRUSTED_KANINE_API = 'http://localhost:3001'` in `index.html` and open `index.html` via a simple static server so the official site loads products from web2.

## Deploying (recommended)

- **Official site:** Deploy this folder (no server needed) to your public URL. In `index.html` set `window.TRUSTED_KANINE_API = 'https://admin.yourdomain.com'` (or whatever URL hosts web2).
- **Admin site:** Deploy the **web2** folder to a **private** URL (e.g. `admin.yourdomain.com`) and keep that URL secret. See `web2/README.md`.

## Customize

- **WhatsApp number** — In `script.js`, change the `whatsappNumber` variable.
- **Product list when API is unused** — Edit the `fallbackProducts` array in `script.js` if you want a different default list.

## Files (this folder)

- `index.html`, `styles.css`, `script.js` — Official public site (no admin link).
- `server.js`, `products.json` — Optional: run from this folder if you want one server for both site and API; otherwise use **web2** for admin and API only.
