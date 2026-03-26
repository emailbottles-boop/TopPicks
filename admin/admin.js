'use strict';

const STORAGE_KEY   = 'toppicks_products';
const CLICKS_KEY    = 'affiliate_clicks';
const JSON_PATH     = '../data/products.json';

const CAT_COLORS = {
  tech:      '#2563eb',
  home:      '#10b981',
  kitchen:   '#f59e0b',
  lifestyle: '#8b5cf6',
};

// ── State ─────────────────────────────────────────────────────────────────────

let products  = [];
let filterCat = 'all';
let filterQ   = '';
let editingId = null;

// ── Boot: load from localStorage → fall back to JSON ─────────────────────────

(function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { products = JSON.parse(saved); refresh(); return; } catch (_) {}
  }
  fetch(JSON_PATH)
    .then(r => r.json())
    .then(data => { products = data; refresh(); })
    .catch(() => {
      products = [];
      refresh();
      showToast('Could not load products.json — run via a local server.');
    });
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function nextId() {
  return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function updateStats() {
  document.getElementById('stat-total').textContent     = products.length;
  document.getElementById('stat-tech').textContent      = products.filter(p => p.category === 'tech').length;
  document.getElementById('stat-home').textContent      = products.filter(p => p.category === 'home').length;
  document.getElementById('stat-kitchen').textContent   = products.filter(p => p.category === 'kitchen').length;
  document.getElementById('stat-lifestyle').textContent = products.filter(p => p.category === 'lifestyle').length;
  try {
    const clicks = JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]');
    document.getElementById('stat-clicks').textContent = clicks.length;
  } catch (_) {
    document.getElementById('stat-clicks').textContent = '—';
  }
}

// ── Table render ──────────────────────────────────────────────────────────────

function renderTable() {
  const q = filterQ.toLowerCase();
  const visible = products.filter(p => {
    const matchCat    = filterCat === 'all' || p.category === filterCat;
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const tbody = document.getElementById('product-tbody');

  if (!visible.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">
          No products match your filter.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = visible.map(p => {
    const color = CAT_COLORS[p.category] || '#94a3b8';
    const thumb = p.image || 'https://via.placeholder.com/44';
    return `
      <tr data-id="${p.id}">
        <td>
          <img class="prod-thumb" src="${esc(thumb)}" alt="${esc(p.title)}"
               onerror="this.src='https://via.placeholder.com/44'">
        </td>
        <td>
          <div class="prod-name">${esc(p.title)}</div>
          <div class="prod-desc-cell">${esc(p.description)}</div>
        </td>
        <td><span class="cat-tag" style="background:${color}">${esc(p.category)}</span></td>
        <td>${esc(p.price)}</td>
        <td>&#9733; ${Number(p.rating).toFixed(1)}</td>
        <td>
          <div class="actions">
            <button class="btn-edit"   data-action="edit"   data-id="${p.id}">Edit</button>
            <button class="btn-delete" data-action="delete" data-id="${p.id}">Delete</button>
          </div>
        </td>
      </tr>`.trim();
  }).join('');
}

function refresh() { updateStats(); renderTable(); }

// ── Modal ─────────────────────────────────────────────────────────────────────

const overlay    = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');

function openModal(product = null) {
  editingId = product ? product.id : null;
  modalTitle.textContent = product ? 'Edit Product' : 'Add Product';

  document.getElementById('field-id').value       = product ? product.id : '';
  document.getElementById('field-title').value    = product ? product.title : '';
  document.getElementById('field-desc').value     = product ? product.description : '';
  document.getElementById('field-category').value = product ? product.category : '';
  document.getElementById('field-price').value    = product ? product.price : '';
  document.getElementById('field-rating').value   = product ? product.rating : '';
  document.getElementById('field-reviews').value  = product ? product.reviews : '';
  document.getElementById('field-badge').value    = product ? (product.badge || '') : '';
  document.getElementById('field-image').value    = product ? (product.image || '') : '';
  document.getElementById('field-amazon').value   = product ? (product.amazonUrl || '') : '';
  document.getElementById('field-tags').value     = product ? (product.tags || []).join(', ') : '';

  overlay.classList.remove('hidden');
  document.getElementById('field-title').focus();
}

function closeModal() {
  overlay.classList.add('hidden');
  editingId = null;
  document.getElementById('product-form').reset();
}

// ── Save ──────────────────────────────────────────────────────────────────────

function handleSave() {
  const title     = document.getElementById('field-title').value.trim();
  const desc      = document.getElementById('field-desc').value.trim();
  const category  = document.getElementById('field-category').value;
  const price     = document.getElementById('field-price').value.trim();
  const rating    = parseFloat(document.getElementById('field-rating').value) || 0;
  const reviews   = parseInt(document.getElementById('field-reviews').value, 10) || 0;
  const badge     = document.getElementById('field-badge').value.trim() || null;
  const image     = document.getElementById('field-image').value.trim();
  const amazonUrl = document.getElementById('field-amazon').value.trim();
  const tagsRaw   = document.getElementById('field-tags').value.trim();
  const tags      = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!title || !desc || !category || !price || !amazonUrl) {
    showToast('Please fill in all required fields.');
    return;
  }

  const entry = { title, description: desc, category, price, rating, reviews, image, amazonUrl, tags };
  if (badge) entry.badge = badge;

  if (editingId !== null) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) { products[idx] = { id: editingId, ...entry }; showToast('Product updated.'); }
  } else {
    products.push({ id: nextId(), ...entry });
    showToast('Product added.');
  }

  saveProducts();
  closeModal();
  refresh();
}

// ── Delete ────────────────────────────────────────────────────────────────────

function handleDelete(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  refresh();
  showToast('Product deleted.');
}

// ── Export JSON ───────────────────────────────────────────────────────────────

function exportJSON() {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'products.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded products.json — commit it to data/');
}

// ── Reset to JSON ─────────────────────────────────────────────────────────────

function resetToJSON() {
  if (!confirm('Discard all local edits and reload from data/products.json?')) return;
  localStorage.removeItem(STORAGE_KEY);
  fetch(JSON_PATH)
    .then(r => r.json())
    .then(data => { products = data; refresh(); showToast('Reset to data/products.json'); })
    .catch(() => showToast('Could not fetch products.json — is the server running?'));
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Event wiring ──────────────────────────────────────────────────────────────

document.getElementById('btn-add').addEventListener('click', () => openModal());
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-save').addEventListener('click', handleSave);
document.getElementById('btn-export').addEventListener('click', exportJSON);
document.getElementById('btn-reset').addEventListener('click', resetToJSON);

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
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
  searchTimer = setTimeout(() => { filterQ = e.target.value.trim(); renderTable(); }, 200);
});

document.getElementById('cat-filter').addEventListener('change', e => {
  filterCat = e.target.value;
  renderTable();
});
