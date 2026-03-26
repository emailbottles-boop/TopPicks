(() => {
  const grid        = document.getElementById('products-grid');
  const countEl     = document.getElementById('result-count');
  const noResults   = document.getElementById('no-results');
  const searchInput = document.getElementById('search');
  const catPills    = document.querySelectorAll('.cat-pill');

  let activeCategory = 'all';
  let searchQuery    = '';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function starsHTML(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  function formatPrice(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatReviews(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderProducts() {
    const source = getSource(); // live or localStorage
    const q = searchQuery.toLowerCase();

    const filtered = source.filter(p => {
      const matchCat    = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    countEl.textContent = filtered.length === 1
      ? '1 product'
      : `${filtered.length} products`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      noResults.classList.remove('hidden');
      return;
    }

    noResults.classList.add('hidden');
    grid.innerHTML = filtered.map(p => cardHTML(p)).join('');
  }

  function cardHTML(p) {
    return `
      <div class="product-card">
        <div class="card-image">
          <img src="${escAttr(p.image)}" alt="${escAttr(p.title)}" loading="lazy">
          <span class="card-badge badge-${escAttr(p.category)}">${escText(p.category)}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${escText(p.title)}</div>
          <div class="card-desc">${escText(p.description)}</div>
          <div class="card-meta">
            <div class="card-rating">
              <span class="stars" aria-hidden="true">${starsHTML(p.rating)}</span>
              <span class="rating-val">${p.rating}</span>
              <span class="review-count">(${formatReviews(p.reviews)})</span>
            </div>
            <div class="card-price">${formatPrice(p.price)}</div>
          </div>
        </div>
        <div class="card-footer">
          <a class="btn-buy" href="${escAttr(p.affiliate)}" target="_blank" rel="noopener noreferrer sponsored">
            View on Amazon
          </a>
        </div>
      </div>
    `.trim();
  }

  // ── Data source (localStorage overrides default PRODUCTS) ─────────────────

  function getSource() {
    try {
      const saved = localStorage.getItem('toppicks_products');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return PRODUCTS;
  }

  // ── Escaping ──────────────────────────────────────────────────────────────

  function escText(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      renderProducts();
    });
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderProducts();
    }, 200);
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  renderProducts();
})();
