# Trusted Kanine — Admin site (web2)

**If Safari says "Can't Connect to the Server" for localhost:3001:** Node.js is required. Install it from [nodejs.org](https://nodejs.org), then in Terminal run `npm install` and `npm start` in this folder. Keep that terminal open.

This is a **separate, admin-only** site. It is **not linked** from the official website. Only you (the admin) should know its URL. Use it to add, edit, and remove products; changes appear on the official site as soon as it loads products from this site’s API.

## How it connects to the official site

- **Official website (web1)** — Public. Shows products by calling this admin site’s **GET /api/products** (no login required for that). Set `window.TRUSTED_KANINE_API` in the official site’s `index.html` to this site’s URL (e.g. `https://admin.yourdomain.com`).
- **This admin site (web2)** — You open it directly (bookmark or type the URL). Log in with your password, then add/delete products. Data is stored in `products.json` here. The official site fetches that data from **/api/products** on this server.

## Run the admin site

1. **Install dependencies**
   ```bash
   cd web2
   npm install
   ```

2. **Set your password**
   - Copy `.env.example` to `.env`
   - Set `ADMIN_PASSWORD` to a strong password (and optionally `SESSION_SECRET`)

3. **Start the server**
   ```bash
   npm start
   ```
   By default it runs on **http://localhost:3001**.

4. **Open in browser**
   - Login: **http://localhost:3001/admin.html**
   - After login you’ll see the dashboard to manage products.

## Deploying

- **Admin site (this folder):** Deploy `web2` to a **private URL** only you use (e.g. `admin.yourdomain.com` or a path like `yourdomain.com/manage`). Do not link to it from the official site or anywhere public.
- **Official site:** Deploy the main project (parent folder) to your public URL (e.g. `www.yourdomain.com`). In `index.html`, set:
  ```html
  <script>window.TRUSTED_KANINE_API = 'https://admin.yourdomain.com';</script>
  ```
  so the official site loads products from the admin site’s API.

## Optional: “View official site” link

In `admin-dashboard.html`, set `OFFICIAL_SITE_URL` in the script to your public website URL so the “View official site” button opens it in a new tab.
