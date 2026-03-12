require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const PRODUCTS_PATH = path.join(__dirname, 'products.json');

function readProducts() {
  const data = fs.readFileSync(PRODUCTS_PATH, 'utf8');
  return JSON.parse(data);
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf8');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Allow the official website (any origin) to fetch products. Restrict in production if you prefer.
const corsOptions = {
  origin: true,
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
  secret: process.env.SESSION_SECRET || 'trusted-kanine-admin-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // allow over HTTP/HTTPS so hosted dashboards keep sessions reliably
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ——— Public API (used by the official website to display products) ———
app.get('/api/products', function (req, res) {
  try {
    const products = readProducts();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// ——— Admin auth ———
app.post('/api/login', function (req, res) {
  const password = process.env.ADMIN_PASSWORD || 'admin';
  if (req.body.password === password) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/logout', function (req, res) {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/admin/me', function (req, res) {
  res.json({ ok: !!req.session.admin });
});

// ——— Admin product API (protected) ———
app.post('/api/products', requireAdmin, function (req, res) {
  try {
    const products = readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, parseInt(p.id, 10) || 0), 0);
    const newId = String(maxId + 1);
    const { category, name, description, price, imageUrl, whatsappMessage } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'Category and name required' });
    }
    const msg = whatsappMessage || "Hi, I'm interested in: " + name;
    const product = {
      id: newId,
      category: category,
      name: name,
      description: description || '',
      price: price || 'Contact for price',
      imageUrl: imageUrl || 'https://placehold.co/600x400/e8e4df/6b6560?text=Product',
      whatsappMessage: msg
    };
    products.push(product);
    writeProducts(products);
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', requireAdmin, function (req, res) {
  try {
    const products = readProducts();
    const i = products.findIndex(p => p.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Product not found' });
    const { category, name, description, price, imageUrl, whatsappMessage } = req.body;
    if (category) products[i].category = category;
    if (name !== undefined) products[i].name = name;
    if (description !== undefined) products[i].description = description;
    if (price !== undefined) products[i].price = price;
    if (imageUrl !== undefined) products[i].imageUrl = imageUrl;
    if (whatsappMessage !== undefined) products[i].whatsappMessage = whatsappMessage;
    writeProducts(products);
    res.json(products[i]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, function (req, res) {
  try {
    const products = readProducts();
    const filtered = products.filter(p => p.id !== req.params.id);
    if (filtered.length === products.length) return res.status(404).json({ error: 'Product not found' });
    writeProducts(filtered);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(PORT, function () {
  console.log('Trusted Kanine admin site (web2) running at http://localhost:' + PORT);
  console.log('Keep this URL private. Set ADMIN_PASSWORD in .env');
});
