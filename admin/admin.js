(() => {
  const STORAGE_KEY = 'toppicks_products';

  // ── State ─────────────────────────────────────────────────────────────────

  let products = loadProducts();
  let filterCat = 'all';
  let filterQ   = '';
  let editingId = null;

  // ── Persistence ───────────────────────────────────────────────────────────

  function loadProducts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    // Deep-clone the bundled default data so mutations don't affect PRODUCTS
    return JSON.parse(JSON.stringify(PRODUCTS));
  }

  function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function nextId() {
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatPrice(n) {
    return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatReviews(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

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

  const CAT_COLORS = {
    tech:      '#3b82f6',
    home:      '#10b981',
    kitchen:   '#f97316',
    lifestyle: '#8b5cf6',
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  function updateStats() {
    document.getElementById('stat-total').textContent     = products.length;
    document.getElementById('stat-tech').textContent      = products.filter(p => p.category === 'tech').length;
    document.getElementById('stat-home').textContent      = products.filter(p => p.category === 'home').length;
    document.getElementById('stat-kitchen').textContent   = products.filter(p => p.category === 'kitchen').length;
    document.getElementById('stat-lifestyle').textContent = products.filter(p => p.category === 'lifestyle').length;
  }

  // ── Table render ──────────────────────────────────────────────────────────

  function renderTable() {
    const q = filterQ.toLowerCase();
    const visible = products.filter(p => {
      const matchCat    = filterCat === 'all' || p.category === filterCat;
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const tbody = document.getElementById('product-tbody');

    if (visible.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">
            No products match your filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = visible.map(p => {
      const color = CAT_COLORS[p.category] || '#999';
      return `
        <tr data-id="${p.id}">
          <td>
            <img class="prod-thumb"
              src="${escAttr(p.image || 'https://via.placeholder.com/44')}"
              alt="${escAttr(p.title)}"
              onerror="this.src='https://via.placeholder.com/44'">
          </td>
          <td>
            <div class="prod-name">${escText(p.title)}</div>
            <div class="prod-desc-cell">${escText(p.description)}</div>
          </td>
          <td>
            <span class="cat-tag" style="background:${color}">${escText(p.category)}</span>
          </td>
          <td>${formatPrice(p.price)}</td>
          <td>
            ★ ${Number(p.rating).toFixed(1)}
            <span style="color:var(--text-muted);font-size:.8em">(${formatReviews(p.reviews)})</span>
          </td>
          <td>
            <div class="actions">
              <button class="btn-edit" data-action="edit" data-id="${p.id}">Edit</button>
              <button class="btn-delete" data-action="delete" data-id="${p.id}">Delete</button>
            </div>
          </td>
        </tr>
      `.trim();
    }).join('');
  }

  function refresh() {
    updateStats();
    renderTable();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  const overlay    = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');

  function openModal(product = null) {
    editingId = product ? product.id : null;
    modalTitle.textContent = product ? 'Edit Product' : 'Add Product';

    document.getElementById('field-id').value        = product ? product.id : '';
    document.getElementById('field-title').value     = product ? product.title : '';
    document.getElementById('field-desc').value      = product ? product.description : '';
    document.getElementById('field-category').value  = product ? product.category : '';
    document.getElementById('field-price').value     = product ? product.price : '';
    document.getElementById('field-rating').value    = product ? product.rating : '';
    document.getElementById('field-reviews').value   = product ? product.reviews : '';
    document.getElementById('field-image').value     = product ? product.image : '';
    document.getElementById('field-affiliate').value = product ? product.affiliate : '';

    overlay.classList.remove('hidden');
    document.getElementById('field-title').focus();
  }

  function closeModal() {
    overlay.classList.add('hidden');
    editingId = null;
    document.getElementById('product-form').reset();
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const title     = document.getElementById('field-title').value.trim();
    const desc      = document.getElementById('field-desc').value.trim();
    const category  = document.getElementById('field-category').value;
    const price     = parseFloat(document.getElementById('field-price').value);
    const rating    = parseFloat(document.getElementById('field-rating').value) || 0;
    const reviews   = parseInt(document.getElementById('field-reviews').value, 10) || 0;
    const image     = document.getElementById('field-image').value.trim();
    const affiliate = document.getElementById('field-affiliate').value.trim();

    if (!title || !desc || !category || isNaN(price) || !affiliate) {
      showToast('Please fill in all required fields.');
      return;
    }

    if (editingId !== null) {
      const idx = products.findIndex(p => p.id === editingId);
      if (idx !== -1) {
        products[idx] = { id: editingId, title, description: desc, category, price, rating, reviews, image, affiliate };
        showToast('Product updated.');
      }
    } else {
      products.push({ id: nextId(), title, description: desc, category, price, rating, reviews, image, affiliate });
      showToast('Product added.');
    }

    saveProducts();
    closeModal();
    refresh();
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function handleDelete(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    refresh();
    showToast('Product deleted.');
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  // ── Event wiring ──────────────────────────────────────────────────────────

  document.getElementById('btn-add').addEventListener('click', () => openModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-save').addEventListener('click', handleSave);

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
  });

  // Table row actions (delegated)
  document.getElementById('product-tbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    if (btn.dataset.action === 'edit') {
      const product = products.find(p => p.id === id);
      if (product) openModal(product);
    } else if (btn.dataset.action === 'delete') {
      handleDelete(id);
    }
  });

  // Filters
  let searchTimer;
  document.getElementById('admin-search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filterQ = e.target.value.trim();
      renderTable();
    }, 200);
  });

  document.getElementById('cat-filter').addEventListener('change', e => {
    filterCat = e.target.value;
    renderTable();
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  refresh();
})();
