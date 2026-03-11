#!/usr/bin/env python3
"""
Trusted Kanine admin site (web2) — run with: python3 server.py
Serves admin pages and products API. No Node.js required.
"""
import json
import os
import re
import secrets
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

PORT = int(os.environ.get("PORT", 3001))
DIR = Path(__file__).resolve().parent
PRODUCTS_FILE = DIR / "products.json"

# Load password from .env if present
ADMIN_PASSWORD = "admin"
_env = DIR / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        line = line.strip()
        if line.startswith("ADMIN_PASSWORD=") and not line.startswith("#"):
            ADMIN_PASSWORD = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

# In-memory sessions: token -> True
sessions = {}


def read_products():
    with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def write_products(products):
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)


def get_session_cookie(headers):
    # Header keys can be lowercase in some environments
    cookie = (headers.get("Cookie") or headers.get("cookie") or "")
    for part in cookie.split(";"):
        part = part.strip()
        if part.startswith("admin_session="):
            return part.split("=", 1)[1].strip()
    return None


def is_admin(handler):
    token = get_session_cookie(handler.headers)
    return token and sessions.get(token)


def send_json(handler, data, status=200, extra_headers=None):
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", handler.headers.get("Origin") or "*")
    handler.send_header("Access-Control-Allow-Credentials", "true")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    if extra_headers:
        for k, v in extra_headers:
            handler.send_header(k, v)
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_json_body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin") or "*")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.unquote(self.path).split("?")[0]

        # API: GET /api/products (public)
        if path == "/api/products":
            try:
                products = read_products()
                send_json(self, products)
            except Exception:
                send_json(self, {"error": "Failed to load products"}, 500)
            return

        # API: GET /api/admin/me
        if path == "/api/admin/me":
            send_json(self, {"ok": is_admin(self)})
            return

        # Static files
        if path in ("/", ""):
            path = "/admin.html"
        file_path = DIR / path.lstrip("/")
        if not file_path.resolve().is_relative_to(DIR.resolve()):
            self.send_error(404)
            return
        if file_path.is_dir():
            file_path = file_path / "index.html"
        if not file_path.is_file():
            self.send_error(404)
            return
        content = file_path.read_bytes()
        content_type = "text/html"
        if file_path.suffix == ".json":
            content_type = "application/json"
        elif file_path.suffix == ".css":
            content_type = "text/css"
        elif file_path.suffix == ".js":
            content_type = "application/javascript"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        path = urllib.parse.unquote(self.path).split("?")[0]
        body = read_json_body(self)

        # API: POST /api/login
        if path == "/api/login":
            if body.get("password") == ADMIN_PASSWORD:
                token = secrets.token_urlsafe(32)
                sessions[token] = True
                send_json(
                    self,
                    {"ok": True},
                    extra_headers=[("Set-Cookie", f"admin_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400")],
                )
            else:
                send_json(self, {"error": "Invalid password"}, 401)
            return

        # API: POST /api/logout
        if path == "/api/logout":
            token = get_session_cookie(self.headers)
            if token:
                sessions.pop(token, None)
            send_json(self, {"ok": True})
            return

        # API: POST /api/products (protected)
        if path == "/api/products":
            if not is_admin(self):
                send_json(self, {"error": "Not authenticated"}, 401)
                return
            try:
                products = read_products()
                max_id = max((int(p.get("id", 0) or 0) for p in products), default=0)
                new_id = str(max_id + 1)
                name = body.get("name", "").strip()
                category = body.get("category", "").strip()
                if not name or not category:
                    send_json(self, {"error": "Category and name required"}, 400)
                    return
                msg = body.get("whatsappMessage") or ("Hi, I'm interested in: " + name)
                product = {
                    "id": new_id,
                    "category": category,
                    "name": name,
                    "description": body.get("description") or "",
                    "price": body.get("price") or "Contact for price",
                    "imageUrl": body.get("imageUrl") or "https://placehold.co/600x400/e8e4df/6b6560?text=Product",
                    "whatsappMessage": msg,
                }
                products.append(product)
                write_products(products)
                print("[Admin] Product added: %s (id=%s)" % (product.get("name"), new_id))
                send_json(self, product)
            except Exception:
                send_json(self, {"error": "Failed to add product"}, 500)
            return

        self.send_error(404)

    def do_DELETE(self):
        path = urllib.parse.unquote(self.path).split("?")[0]
        match = re.match(r"^/api/products/(.+)$", path)
        if not match:
            self.send_error(404)
            return
        pid = match.group(1)
        if not is_admin(self):
            send_json(self, {"error": "Not authenticated"}, 401)
            return
        try:
            products = read_products()
            new_list = [p for p in products if str(p.get("id")) != str(pid)]
            if len(new_list) == len(products):
                send_json(self, {"error": "Product not found"}, 404)
                return
            write_products(new_list)
            send_json(self, {"ok": True})
        except Exception:
            send_json(self, {"error": "Failed to delete product"}, 500)

    def do_PUT(self):
        path = urllib.parse.unquote(self.path).split("?")[0]
        match = re.match(r"^/api/products/(.+)$", path)
        if not match:
            self.send_error(404)
            return
        pid = match.group(1)
        if not is_admin(self):
            send_json(self, {"error": "Not authenticated"}, 401)
            return
        body = read_json_body(self)
        try:
            products = read_products()
            idx = next((i for i, p in enumerate(products) if str(p.get("id")) == str(pid)), -1)
            if idx == -1:
                send_json(self, {"error": "Product not found"}, 404)
                return
            p = products[idx]
            if "category" in body:
                p["category"] = body["category"]
            if "name" in body:
                p["name"] = body["name"]
            if "description" in body:
                p["description"] = body["description"]
            if "price" in body:
                p["price"] = body["price"]
            if "imageUrl" in body:
                p["imageUrl"] = body["imageUrl"]
            if "whatsappMessage" in body:
                p["whatsappMessage"] = body["whatsappMessage"]
            write_products(products)
            send_json(self, p)
        except Exception:
            send_json(self, {"error": "Failed to update product"}, 500)

    def log_message(self, format, *args):
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def main():
    if not PRODUCTS_FILE.exists():
        print("Error: products.json not found in", DIR)
        return
    server = HTTPServer(("", PORT), Handler)
    print("Trusted Kanine admin site (web2) running at http://localhost:%s" % PORT)
    print("Open http://localhost:%s/admin.html in your browser. Keep this window open." % PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
