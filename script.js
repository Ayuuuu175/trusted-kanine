(function () {
  'use strict';

  // Always start at top on refresh (but keep hash navigation working)
  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch (e) {}

  function scrollToTopIfNoHash() {
    try {
      if (typeof window.location !== 'undefined' && !window.location.hash) {
        window.scrollTo(0, 0);
      }
    } catch (e) {}
  }

  window.addEventListener('load', scrollToTopIfNoHash);
  window.addEventListener('pageshow', scrollToTopIfNoHash);

  // Hero background slideshow (3 photos)
  var heroSlides = document.querySelectorAll('.hero-slide');
  if (heroSlides.length >= 2) {
    var currentSlide = 0;
    function nextHeroSlide() {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }
    setInterval(nextHeroSlide, 3000);
  }

  // Mobile menu toggle
  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-label', nav.classList.contains('is-open') ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
      });
    });
  }

  // Load products from API (or fallback to static if opened as file)
  var container = document.getElementById('products-container');
  if (container) {
    var apiBase = (typeof window.TRUSTED_KANINE_API !== 'undefined' && window.TRUSTED_KANINE_API)
      ? window.TRUSTED_KANINE_API
      : (function () {
          var s = document.querySelector('script[data-api]');
          return (s && s.getAttribute('data-api')) || '';
        })();
    if (!apiBase && typeof window.location !== 'undefined' && window.location.origin) {
      apiBase = window.location.origin;
    }
    var whatsappNumber = '23058311584';
    var categoryOrder = ['food', 'equipment', 'crates'];
    var categoryTitles = { food: 'Food & treats', equipment: 'Equipment', crates: 'Crates' };

    function escapeHtml(s) {
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    function buildProductCard(p) {
      var waUrl = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(p.whatsappMessage || ("Hi, I'm interested in: " + p.name));
      var images = (Array.isArray(p.images) && p.images.length) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
      var mainImage = images.length ? images[0] : '';
      var dataImages = images.length > 1 ? ' data-images=\'' + JSON.stringify(images).replace(/'/g, '&#39;') + '\' data-current-index=\'0\' title=\'Click to see more photos\'' : '';
      return (
        '<article class="product-card">' +
          '<div class="product-image">' + (images.length > 1 ? '<span class="product-image-hint">Click to view ' + images.length + ' photos</span>' : '') + '<img src="' + escapeHtml(mainImage) + '" alt="' + escapeHtml(p.name) + '"' + dataImages + ' /></div>' +
          '<div class="product-body">' +
            '<h4 class="product-name">' + escapeHtml(p.name) + '</h4>' +
            '<p class="product-desc">' + escapeHtml(p.description) + '</p>' +
            '<p class="product-price">' + escapeHtml(p.price) + '</p>' +
            '<a href="' + escapeHtml(waUrl) + '" class="btn btn-order" target="_blank" rel="noopener noreferrer">Contact to order</a>' +
          '</div>' +
        '</article>'
      );
    }

    function renderProducts(products) {
      var byCategory = {};
      categoryOrder.forEach(function (c) { byCategory[c] = []; });
      products.forEach(function (p) {
        if (byCategory[p.category]) byCategory[p.category].push(p);
      });
      var html = '';
      categoryOrder.forEach(function (cat) {
        var list = byCategory[cat];
        if (list.length === 0) return;
        html += '<div class="category">';
        html += '<h3 class="category-title">' + escapeHtml(categoryTitles[cat]) + '</h3>';
        html += '<div class="product-grid">';
        list.forEach(function (p) { html += buildProductCard(p); });
        html += '</div></div>';
      });
      container.innerHTML = html || '<p class="section-sub">No products at the moment.</p>';
      initImageToggles();
    }

    function initImageToggles() {
      var imgs = container.querySelectorAll('.product-image img[data-images]');
      imgs.forEach(function (img) {
        img.addEventListener('click', function () {
          try {
            var data = this.getAttribute('data-images');
            if (!data) return;
            try { data = data.replace(/&#39;/g, "'"); } catch (e) {}
            var arr = JSON.parse(data);
            if (!Array.isArray(arr) || arr.length < 2) return;
            var current = parseInt(this.getAttribute('data-current-index') || '0', 10);
            var next = (current + 1) % arr.length;
            this.src = arr[next];
            this.setAttribute('data-current-index', String(next));
          } catch (e) {
            // ignore parse errors
          }
        });
      });
    }

    // Fallback product list (same as your current catalogue when API is unavailable)
    var fallbackProducts = [
      { id: '4', category: 'food', name: 'FOCUS Starter Mother and Baby — 4kg', description: 'For mother and puppy.', price: 'Rs 1,450', imageUrl: 'images/focus-starter-4kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Starter Mother and Baby 4kg" },
      { id: '5', category: 'food', name: 'FOCUS Starter Mother and Baby — 12kg + 1kg free', description: 'For mother and puppy. 12kg + 1kg free.', price: 'Rs 4,000', imageUrl: 'images/focus-starter-13kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Starter Mother and Baby 12kg + 1kg free" },
      { id: '6', category: 'food', name: 'FOCUS Puppy — 4kg', description: 'For growing puppies.', price: 'Rs 1,350', imageUrl: 'images/focus-puppy-4kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Puppy 4kg" },
      { id: '7', category: 'food', name: 'FOCUS Puppy — 12kg + 1kg free', description: 'For growing puppies. 12kg + 1kg free.', price: 'Rs 3,770', imageUrl: 'images/focus-puppy-12kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Puppy 12kg + 1kg free" },
      { id: '8', category: 'food', name: 'FOCUS Adult — 4kg', description: 'For adult dogs.', price: 'Rs 1,250', imageUrl: 'images/focus-adult-4kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Adult 4kg" },
      { id: '9', category: 'food', name: 'FOCUS Adult — 12kg + 1kg free', description: 'For adult dogs. 12kg + 1kg free.', price: 'Rs 3,290', imageUrl: 'images/focus-adult-12kg.png', whatsappMessage: "Hi, I'm interested in: FOCUS Adult 12kg + 1kg free" },
      { id: '10', category: 'food', name: 'DROOLS dog biscuits', description: 'Dog biscuits by Drools.', price: 'Rs 475', imageUrl: 'images/drools-biscuits.png', whatsappMessage: "Hi, I'm interested in: DROOLS dog biscuits" },
      { id: '11', category: 'equipment', name: 'Slip leash', description: 'Slip leash.', price: 'Rs 275', imageUrl: 'images/slip-leash.png', whatsappMessage: "Hi, I'm interested in: Slip leash" },
      { id: '12', category: 'crates', name: 'Dog crate — Medium', description: '81 × 57 × 59 cm.', price: 'Rs 6,750', imageUrl: 'images/crate-view-1.png', images: ['images/crate-view-1.png', 'images/crate-view-2.png'], whatsappMessage: "Hi, I'm interested in: Dog crate Medium (81x57x59 cm)" },
      { id: '13', category: 'crates', name: 'Dog crate — Large', description: '99 × 66 × 72 cm.', price: 'Rs 8,990', imageUrl: 'images/crate-view-1.png', images: ['images/crate-view-1.png', 'images/crate-view-2.png'], whatsappMessage: "Hi, I'm interested in: Dog crate Large (99x66x72 cm)" }
    ];

    if (apiBase) {
      fetch(apiBase + '/api/products')
        .then(function (r) { return r.json(); })
        .then(renderProducts)
        .catch(function () { renderProducts(fallbackProducts); });
    } else {
      renderProducts(fallbackProducts);
    }
  }
})();
