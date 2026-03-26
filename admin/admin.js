'use strict';

const STORAGE_KEY = 'toppicks_products';
const CLICKS_KEY  = 'affiliate_clicks';
const EMAILS_KEY  = 'email_list';
const JSON_PATH   = '../data/products.json';

const CAT_COLORS  = { tech:'#2563eb', home:'#10b981', kitchen:'#f59e0b', lifestyle:'#8b5cf6' };

// ── State ──────────────────────────────────────────────────────────────────────
let products  = [];
let filterCat = 'all';
let filterQ   = '';
let editingId = null;

// ── Boot ───────────────────────────────────────────────────────────────────────
(function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { products = JSON.parse(saved); refresh(); return; } catch (_) {} }
  fetch(JSON_PATH)
    .then(r => r.json())
    .then(data => { products = data; refresh(); })
    .catch(() => { products = []; refresh(); showToast('Open via GitHub Pages or a local server to load the default products.'); });
})();

// Populate the affiliate tag field in Settings
const tagInput = document.getElementById('settings-tag');
tagInput.value = localStorage.getItem('amazon_tag') || '';

// ── Tab switching ──────────────────────────────────────────────────────────────
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function saveProducts() { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
function nextId()       { return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1; }
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Amazon URL parser ──────────────────────────────────────────────────────────
function parseAmazonUrl(raw) {
  try {
    const m = raw.match(/amazon\.[a-z.]+\/(?:[^/]+\/)*dp\/([A-Z0-9]{10})/i);
    if (m) return `https://www.amazon.com/dp/${m[1]}`;
  } catch (_) {}
  return raw.trim();
}

document.getElementById('btn-parse-url').addEventListener('click', () => {
  const raw = document.getElementById('field-amazon-paste').value.trim();
  if (!raw) return;
  document.getElementById('field-amazon').value = parseAmazonUrl(raw);
  document.getElementById('field-amazon-paste').value = '';
  showToast('URL cleaned ✓');
});

// ── Image preview ──────────────────────────────────────────────────────────────
function previewImage(url) {
  const wrap = document.getElementById('image-preview');
  const img  = document.getElementById('preview-img');
  if (!url) { wrap.style.display = 'none'; return; }
  img.src    = url;
  img.onerror = () => { wrap.style.display = 'none'; };
  img.onload  = () => { wrap.style.display = 'block'; };
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-total').textContent  = products.length;
  try { document.getElementById('stat-clicks').textContent = JSON.parse(localStorage.getItem(CLICKS_KEY)||'[]').length; } catch(_){}
  const emailCount = (() => { try { return JSON.parse(localStorage.getItem(EMAILS_KEY)||'[]').length; } catch(_){ return 0; } })();
  document.getElementById('stat-emails').textContent = emailCount;
  document.getElementById('settings-email-desc').textContent =
    emailCount ? `${emailCount} subscriber${emailCount !== 1 ? 's' : ''} — download as CSV to use in Mailchimp, etc.`
               : 'No subscribers yet. The email bar on your site collects them.';
}

// ── Table ──────────────────────────────────────────────────────────────────────
function renderTable() {
  const q = filterQ.toLowerCase();
  const visible = products.filter(p => {
    const matchCat    = filterCat === 'all' || p.category === filterCat;
    const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const tbody = document.getElementById('product-tbody');
  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No products match.</td></tr>`;
    return;
  }
  tbody.innerHTML = visible.map(p => {
    const color = CAT_COLORS[p.category] || '#94a3b8';
    const star  = p.featured ? ' &#9733;' : '';
    return `
      <tr data-id="${p.id}">
        <td><img class="prod-thumb" src="${esc(p.image||'')}" alt="" onerror="this.style.opacity='.2'"></td>
        <td>
          <div class="prod-name">${esc(p.title)}${star}</div>
          <div class="prod-desc-cell">${esc(p.description||'')}</div>
        </td>
        <td><span class="cat-tag" style="background:${color}">${esc(p.category)}</span></td>
        <td>${esc(p.price)}</td>
        <td>&#9733; ${Number(p.rating||0).toFixed(1)}</td>
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

// ── Modal ──────────────────────────────────────────────────────────────────────
const overlay    = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');

function openModal(product = null) {
  editingId = product ? product.id : null;
  modalTitle.textContent = product ? 'Edit Product' : 'Add Product';

  document.getElementById('field-id').value        = product ? product.id : '';
  document.getElementById('field-title').value     = product ? product.title : '';
  document.getElementById('field-desc').value      = product ? (product.description||'') : '';
  document.getElementById('field-pros').value      = product ? (product.pros||[]).join('\n') : '';
  document.getElementById('field-category').value  = product ? product.category : '';
  document.getElementById('field-price').value     = product ? product.price : '';
  document.getElementById('field-rating').value    = product ? (product.rating||'') : '';
  document.getElementById('field-reviews').value   = product ? (product.reviews||'') : '';
  document.getElementById('field-badge').value     = product ? (product.badge||'') : '';
  document.getElementById('field-featured').checked = product ? !!product.featured : false;
  document.getElementById('field-image').value     = product ? (product.image||'') : '';
  document.getElementById('field-amazon').value    = product ? (product.amazonUrl||'') : '';
  document.getElementById('field-amazon-paste').value = '';
  previewImage(product ? product.image : '');

  overlay.classList.remove('hidden');
  // Auto-focus first empty required field
  const firstEmpty = ['field-amazon-paste','field-title','field-price'].find(id => !document.getElementById(id).value);
  setTimeout(() => document.getElementById(firstEmpty || 'field-title').focus(), 50);
}

function closeModal() {
  overlay.classList.add('hidden');
  editingId = null;
  document.getElementById('product-form').reset();
  document.getElementById('image-preview').style.display = 'none';
}

// ── Save product ───────────────────────────────────────────────────────────────
function handleSave() {
  const title     = document.getElementById('field-title').value.trim();
  const desc      = document.getElementById('field-desc').value.trim();
  const prosRaw   = document.getElementById('field-pros').value.trim();
  const pros      = prosRaw ? prosRaw.split('\n').map(l => l.trim()).filter(Boolean) : [];
  const category  = document.getElementById('field-category').value;
  const price     = document.getElementById('field-price').value.trim();
  const rating    = parseFloat(document.getElementById('field-rating').value) || 0;
  const reviews   = parseInt(document.getElementById('field-reviews').value, 10) || 0;
  const badge     = document.getElementById('field-badge').value.trim() || null;
  const featured  = document.getElementById('field-featured').checked;
  const image     = document.getElementById('field-image').value.trim();
  const amazonUrl = document.getElementById('field-amazon').value.trim();

  if (!title || !category || !price || !amazonUrl) {
    showToast('Please fill in: name, price, category, and Amazon URL.');
    return;
  }

  if (featured) products.forEach(p => { p.featured = false; });

  const entry = { title, description: desc, pros, category, price, rating, reviews, image, amazonUrl, featured };
  if (badge) entry.badge = badge;

  if (editingId !== null) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) { products[idx] = { id: editingId, ...entry }; }
  } else {
    products.push({ id: nextId(), ...entry });
  }

  saveProducts();
  closeModal();
  refresh();
  showToast(editingId !== null ? 'Product updated ✓' : 'Product added ✓');
}

// ── Delete ─────────────────────────────────────────────────────────────────────
function handleDelete(id) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  refresh();
  showToast('Deleted.');
}

// ── Settings actions ───────────────────────────────────────────────────────────
document.getElementById('btn-save-tag').addEventListener('click', () => {
  const val = document.getElementById('settings-tag').value.trim();
  if (!val) { showToast('Enter your tag first.'); return; }
  localStorage.setItem('amazon_tag', val);
  const status = document.getElementById('settings-tag-status');
  status.textContent = '✓ Saved! All links on the site now use this tag.';
  status.style.color = 'var(--success)';
  showToast('Affiliate tag saved ✓');
});

document.getElementById('btn-export-emails').addEventListener('click', () => {
  let emails = [];
  try { emails = JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]'); } catch (_) {}
  if (!emails.length) { showToast('No subscribers yet.'); return; }
  const csv  = 'email,subscribed_at\n' + emails.map(e => `${e.email},${e.ts}`).join('\n');
  download('subscribers.csv', csv, 'text/csv');
  showToast(`Exported ${emails.length} subscribers.`);
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  download('products.json', JSON.stringify(products, null, 2), 'application/json');
  showToast('Downloaded — commit it to data/products.json to make edits permanent.');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm('Reset ALL products back to the default list? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  fetch(JSON_PATH)
    .then(r => r.json())
    .then(data => { products = data; refresh(); showToast('Reset to defaults.'); })
    .catch(() => { showToast('Could not fetch products.json — are you on GitHub Pages?'); });
});

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Event wiring ───────────────────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click',    () => openModal());
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click',  closeModal);
document.getElementById('btn-save').addEventListener('click',    handleSave);

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
});

document.getElementById('product-tbody').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id, 10);
  if (btn.dataset.action === 'edit')   { const p = products.find(p => p.id === id); if (p) openModal(p); }
  if (btn.dataset.action === 'delete') handleDelete(id);
});

let searchTimer;
document.getElementById('admin-search').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { filterQ = e.target.value.trim(); renderTable(); }, 200);
});
document.getElementById('cat-filter').addEventListener('change', e => { filterCat = e.target.value; renderTable(); });
