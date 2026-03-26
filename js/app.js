'use strict';

let allProducts = [];
let activeCategory = 'all';
let searchQuery = '';
let associateTag = localStorage.getItem('amazon_tag') || '';

const grid        = document.getElementById('products-grid');
const countEl     = document.getElementById('result-count');
const searchInput = document.getElementById('search');
const catPills    = document.querySelectorAll('.cat-pill');

// Check localStorage for admin-edited products first, then fall back to JSON
const localOverride = localStorage.getItem('toppicks_products');
if (localOverride) {
  try {
    allProducts = JSON.parse(localOverride);
    if (!associateTag) showSetupModal();
    else render();
  } catch (_) {
    loadFromJSON();
  }
} else {
  loadFromJSON();
}

function loadFromJSON() {
  fetch('data/products.json')
    .then(r => r.json())
    .then(data => {
      allProducts = data;
      if (!associateTag) showSetupModal();
      else render();
    })
    .catch(() => {
      grid.innerHTML = '<div class="empty-state"><p>Could not load products. Must be served via GitHub Pages or a local server.</p></div>';
      countEl.textContent = '0 products';
    });
}

function showSetupModal() {
  const overlay = document.createElement('div');
  overlay.id = 'setup-overlay';
  overlay.innerHTML = `
    <div id="setup-modal">
      <div class="setup-icon">&#9889;</div>
      <h2>One-time setup</h2>
      <p>Enter your Amazon Associate Tag and every link on this site will earn you commissions automatically.</p>
      <div class="setup-steps">
        <div class="setup-step">
          <span class="setup-num">1</span>
          <span>Go to <strong>affiliate-program.amazon.com</strong> and sign in with your Amazon account</span>
        </div>
        <div class="setup-step">
          <span class="setup-num">2</span>
          <span>Complete sign-up — your tag looks like <code>yourname-20</code></span>
        </div>
        <div class="setup-step">
          <span class="setup-num">3</span>
          <span>Paste it below — done forever</span>
        </div>
      </div>
      <div class="setup-input-row">
        <input id="tag-input" type="text" placeholder="yourname-20" autocomplete="off">
        <button id="tag-save-btn" onclick="saveTag()">Save &amp; Start Earning</button>
      </div>
      <p class="setup-note">Saved in your browser only. Takes 30 seconds.</p>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('tag-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveTag();
  });
  setTimeout(() => document.getElementById('tag-input').focus(), 100);
}

function saveTag() {
  const val = document.getElementById('tag-input').value.trim();
  if (!val) {
    document.getElementById('tag-input').style.borderColor = '#ef4444';
    return;
  }
  associateTag = val;
  localStorage.setItem('amazon_tag', val);
  document.getElementById('setup-overlay').remove();
  render();
  showToast('Tag saved! All links are now active.');
}

catPills.forEach(pill => {
  pill.addEventListener('click', () => {
    catPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.cat;
    render();
  });
});

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value.toLowerCase().trim();
    render();
  }, 200);
});

function render() {
  const filtered = allProducts.filter(p => {
    const matchesCat    = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery
      || p.title.toLowerCase().includes(searchQuery)
      || p.description.toLowerCase().includes(searchQuery)
      || (p.tags || []).some(t => t.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  const noResults = document.getElementById('no-results');
  if (!filtered.length) {
    grid.innerHTML = '';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }
  if (noResults) noResults.classList.add('hidden');
  grid.innerHTML = filtered.map(cardHTML).join('');
}

function affiliateUrl(base) {
  if (!associateTag) return base;
  try {
    const u = new URL(base);
    u.searchParams.set('tag', associateTag);
    return u.toString();
  } catch (_) {
    return base;
  }
}

function cardHTML(p) {
  const reviews = p.reviews >= 1000 ? (p.reviews / 1000).toFixed(1) + 'k' : p.reviews;
  const full    = Math.floor(p.rating);
  const half    = p.rating % 1 >= 0.5 ? 1 : 0;
  const empty   = 5 - full - half;
  const stars   = '&#9733;'.repeat(full) + (half ? '&#189;' : '') + '&#9734;'.repeat(empty);
  // Escape title for use inside an onclick JS string (single-quoted)
  const titleForJs = esc(p.title).replace(/'/g, '&#39;');
  return `
    <article class="card">
      <div class="card-img">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.style.opacity='.3'">
      </div>
      <div class="card-body">
        <div class="card-title">${esc(p.title)}</div>
        <div class="card-desc">${esc(p.description)}</div>
        <div class="card-rating">
          <span class="stars">${stars}</span>
          <strong>${p.rating}</strong>
          <span class="review-count">(${reviews})</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="price">${esc(p.price)}</span>
        <a href="${esc(affiliateUrl(p.amazonUrl))}"
           target="_blank"
           rel="noopener sponsored"
           class="buy-btn"
           onclick="track(${p.id},'${titleForJs}')">View Deal &#8594;</a>
      </div>
    </article>`.trim();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function track(id, title) {
  const log = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
  log.push({ id, title, ts: new Date().toISOString() });
  if (log.length > 500) log.splice(0, log.length - 500);
  localStorage.setItem('affiliate_clicks', JSON.stringify(log));
  showToast(`Opening: "${title}"`);
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}
