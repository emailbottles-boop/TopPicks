'use strict';

const associateTag = localStorage.getItem('amazon_tag') || '';
const params       = new URLSearchParams(location.search);
const productId    = parseInt(params.get('id'), 10);

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.value.trim())
    location.href = `/?search=${encodeURIComponent(e.target.value.trim())}`;
});

// ── Load ──────────────────────────────────────────────────────────────────────

const localOverride = localStorage.getItem('toppicks_products');
if (localOverride) {
  try { boot(JSON.parse(localOverride)); } catch (_) { fetchJSON(); }
} else { fetchJSON(); }

function fetchJSON() {
  fetch('data/products.json')
    .then(r => r.json())
    .then(boot)
    .catch(() => renderError('Could not load product data. Serve this site via a web server.'));
}

function boot(all) {
  if (!productId) { renderError('No product specified.'); return; }
  const product = all.find(p => p.id === productId);
  if (!product) { renderError('Product not found.'); return; }
  const related = all.filter(p => p.id !== productId && p.category === product.category).slice(0, 3);
  setMeta(product);
  setSchema(product);
  renderProduct(product, related);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

function setMeta(p) {
  const title = `${p.title} Review — Is It Worth It? | TopPicks`;
  const desc  = `${p.description} Rated ${p.rating}/5 by ${formatReviews(p.reviews)} Amazon buyers. See current price and deal.`;
  document.title = title;
  document.getElementById('meta-title').textContent    = title;
  document.getElementById('meta-desc').setAttribute('content', desc);
  document.getElementById('og-title').setAttribute('content', title);
  document.getElementById('og-desc').setAttribute('content', desc);
  document.getElementById('og-image').setAttribute('content', p.image || '');
}

// ── Schema ────────────────────────────────────────────────────────────────────

function setSchema(p) {
  document.getElementById('json-ld').textContent = JSON.stringify({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.title,
    description: p.description,
    image: p.image,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: p.price.replace(/[^0-9.]/g, ''),
      availability: 'https://schema.org/InStock',
      url: affiliateUrl(p.amazonUrl)
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviews,
      bestRating: 5,
      worstRating: 1
    }
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderProduct(p, related) {
  const full  = Math.floor(p.rating);
  const half  = p.rating % 1 >= 0.5 ? 1 : 0;
  const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  const url   = affiliateUrl(p.amazonUrl);

  const prosHTML = (p.pros || []).length
    ? `<ul class="pros-list">${(p.pros).map(pro => `<li>${esc(pro)}</li>`).join('')}</ul>`
    : '';

  const tagsHTML = (p.tags || []).map(t => `<span class="product-tag">${esc(t)}</span>`).join('');

  const relatedHTML = related.length ? `
    <div class="related-section">
      <h2>More ${esc(capitalize(p.category))} picks</h2>
      <div class="products-grid">${related.map(relatedCardHTML).join('')}</div>
    </div>` : '';

  document.getElementById('product-page').innerHTML = `
    <nav class="breadcrumb">
      <a href="/">Home</a> ›
      <a href="/?cat=${esc(p.category)}">${esc(capitalize(p.category))}</a> ›
      ${esc(p.title)}
    </nav>

    <div class="product-layout">
      <div class="product-image-wrap">
        <img src="${esc(p.image)}" alt="${esc(p.title)}" onerror="this.style.opacity='.3'">
      </div>

      <div class="product-info">
        ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ''}
        <h1 class="product-title">${esc(p.title)}</h1>

        <div class="product-rating">
          <span class="stars">${stars}</span>
          <strong>${p.rating}</strong>
          <span class="count">${formatReviews(p.reviews)} ratings on Amazon</span>
        </div>

        <p class="product-price">${esc(p.price)}</p>

        <p class="product-desc">${esc(p.description)}</p>

        ${prosHTML ? `<div class="pros-section"><h3>Why we recommend it</h3>${prosHTML}</div>` : ''}

        ${tagsHTML ? `<div class="product-tags">${tagsHTML}</div>` : ''}

        <div class="buy-block">
          <a href="${esc(url)}"
             class="buy-btn"
             target="_blank"
             rel="noopener sponsored"
             onclick="track(${p.id},'${esc(p.title).replace(/'/g, '&#39;')}')">
            Check Price on Amazon &#8594;
          </a>
          <div class="trust-row">
            <span>&#128274; Secure checkout on Amazon</span>
            <span>&#10003; Free returns on most items</span>
          </div>
          <p class="buy-note">Price may vary. Always check Amazon for the latest deal.</p>
        </div>

        <p class="disclosure-inline">
          <a href="disclosure.html">Affiliate disclosure</a> — we earn a small commission at no cost to you.
        </p>
      </div>
    </div>

    ${relatedHTML}
  `;
}

function relatedCardHTML(p) {
  return `
    <a href="product.html?id=${p.id}" class="card" style="text-decoration:none">
      <div class="card-img">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.style.opacity='.3'">
      </div>
      <div class="card-body">
        <div class="card-title">${esc(p.title)}</div>
      </div>
      <div class="card-footer">
        <span class="price">${esc(p.price)}</span>
        <span class="buy-btn" style="pointer-events:none">View</span>
      </div>
    </a>`;
}

function renderError(msg) {
  document.getElementById('product-page').innerHTML = `
    <div class="product-error">
      <p>${esc(msg)}</p>
      <a href="/" style="color:var(--primary)">&#8592; Back to all products</a>
    </div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function affiliateUrl(base) {
  if (!associateTag) return base;
  try { const u = new URL(base); u.searchParams.set('tag', associateTag); return u.toString(); }
  catch (_) { return base; }
}

function formatReviews(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); }
function capitalize(s)    { return s.charAt(0).toUpperCase() + s.slice(1); }
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function track(id, title) {
  const log = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
  log.push({ id, title, ts: new Date().toISOString() });
  if (log.length > 500) log.splice(0, log.length - 500);
  localStorage.setItem('affiliate_clicks', JSON.stringify(log));
}
