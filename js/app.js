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
    else boot();
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
      else boot();
    })
    .catch(() => {
      // Can't fetch (e.g. opened as a local file) — use embedded defaults
      allProducts = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      if (!associateTag) showSetupModal();
      else boot();
    });
}

function boot() {
  renderFeatured();
  render();
}

function renderFeatured() {
  const wrap = document.getElementById('featured-wrap');
  if (!wrap) return;
  const featured = allProducts.find(p => p.featured);
  if (!featured) return;
  const url = affiliateUrl(featured.amazonUrl);
  wrap.innerHTML = `
    <div class="featured-section">
      <div class="featured-inner">
        <div class="featured-img">
          <img src="${esc(featured.image)}" alt="${esc(featured.title)}"
               onerror="this.style.opacity='.3'">
        </div>
        <div class="featured-body">
          <span class="featured-label">&#9733; Featured Pick</span>
          <h2 class="featured-title">${esc(featured.title)}</h2>
          <p class="featured-desc">${esc(featured.description)}</p>
          <div class="featured-footer">
            <span class="featured-price">${esc(featured.price)}</span>
            <a href="${esc(url)}"
               class="buy-btn"
               target="_blank"
               rel="noopener sponsored"
               onclick="track(${featured.id},'${esc(featured.title).replace(/'/g,'&#39;')}')">
              View Deal &#8594;
            </a>
          </div>
        </div>
      </div>
    </div>`;
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
  boot();
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
  const reviews    = p.reviews >= 1000 ? (p.reviews / 1000).toFixed(1) + 'k' : p.reviews;
  const full       = Math.floor(p.rating);
  const half       = p.rating % 1 >= 0.5 ? 1 : 0;
  const empty      = 5 - full - half;
  const stars      = '&#9733;'.repeat(full) + (half ? '&#189;' : '') + '&#9734;'.repeat(empty);
  const titleForJs = esc(p.title).replace(/'/g, '&#39;');
  const pageUrl    = `product.html?id=${p.id}`;
  return `
    <article class="card">
      <a href="${pageUrl}" style="display:contents;text-decoration:none;color:inherit">
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
      </a>
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

// ── Embedded default products (used when data/products.json can't be fetched) ─
const DEFAULT_PRODUCTS = [
  {"id":1,"title":"Anker 65W USB-C Charger (3-Port)","category":"tech","price":"$27.99","rating":4.8,"reviews":12400,"description":"Charges a MacBook, phone, and tablet simultaneously. Travel-friendly and incredibly fast.","pros":["Charges 3 devices at once","Folds flat for travel","Half the size of Apple's charger","Works with MacBook, iPad, iPhone, Android"],"badge":"Best Seller","featured":false,"amazonUrl":"https://www.amazon.com/dp/B09C6XMPKB","image":"https://m.media-amazon.com/images/I/61TTY5mJLPL._AC_SL1500_.jpg","tags":["charger","usb-c","travel"]},
  {"id":2,"title":"Logitech MX Master 3S Mouse","category":"tech","price":"$79.99","rating":4.9,"reviews":8300,"description":"Virtually silent clicks, ultra-fast scroll wheel. Works across 3 computers seamlessly.","pros":["Near-silent clicking","Scroll wheel adapts to content speed","Switch between 3 computers with one button","8,000 DPI precision sensor"],"badge":"Editor's Pick","featured":true,"amazonUrl":"https://www.amazon.com/dp/B09HM94VDS","image":"https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg","tags":["mouse","wireless","productivity"]},
  {"id":3,"title":"LEVOIT Air Purifier Core 300","category":"home","price":"$99.99","rating":4.7,"reviews":54000,"description":"3-stage filtration, whisper-quiet. Cleans a 219 sq ft room in 12 minutes.","pros":["Removes 99.97% of particles","Quieter than a whisper at lowest setting","No filter indicator light at night","Covers up to 219 sq ft"],"badge":"Top Rated","featured":false,"amazonUrl":"https://www.amazon.com/dp/B07VVK39F7","image":"https://m.media-amazon.com/images/I/61ZCE7XEGWL._AC_SL1500_.jpg","tags":["air purifier","home","health"]},
  {"id":4,"title":"Kindle Paperwhite 16GB","category":"tech","price":"$139.99","rating":4.8,"reviews":31000,"description":"Glare-free display, 10 weeks of battery, waterproof. Best e-reader on the market.","pros":["Reads like real paper in any light","10-week battery life","Fully waterproof — safe in the bath","16GB holds thousands of books"],"badge":"Fan Favorite","featured":false,"amazonUrl":"https://www.amazon.com/dp/B09TMF6742","image":"https://m.media-amazon.com/images/I/61Ww4abDRoL._AC_SY879_.jpg","tags":["kindle","reading","waterproof"]},
  {"id":5,"title":"Instant Pot Duo 7-in-1 (6 Qt)","category":"kitchen","price":"$79.95","rating":4.7,"reviews":120000,"description":"Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker & warmer.","pros":["Replaces 7 kitchen appliances","Cooks meals up to 70% faster","Set it and forget it","Easy to clean — pot is dishwasher safe"],"badge":"Most Reviewed","featured":false,"amazonUrl":"https://www.amazon.com/dp/B00FLYWNYQ","image":"https://m.media-amazon.com/images/I/71V1LoPTpJL._AC_SL1500_.jpg","tags":["instant pot","kitchen","cooking"]},
  {"id":6,"title":"Hatch Restore 2 Sleep Machine","category":"home","price":"$129.99","rating":4.6,"reviews":9200,"description":"Sunrise alarm, white noise, and sleep sounds. Build a perfect wind-down routine.","pros":["Sunrise alarm wakes you naturally","40+ sleep sounds","No phone needed after setup","Proven to improve sleep quality"],"badge":"Staff Pick","featured":false,"amazonUrl":"https://www.amazon.com/dp/B0BYY94VY6","image":"https://m.media-amazon.com/images/I/61LxRHfSjSL._AC_SL1500_.jpg","tags":["sleep","alarm","wellness"]},
  {"id":7,"title":"Samsung T7 Portable SSD 1TB","category":"tech","price":"$89.99","rating":4.8,"reviews":47000,"description":"540 MB/s transfer speed, shock-resistant metal casing. Fits in your pocket.","pros":["540 MB/s — 5x faster than a hard drive","Drop-resistant up to 6 feet","Fits in your pocket","Works with PC, Mac, iPhone, Android"],"badge":"Best Value","featured":false,"amazonUrl":"https://www.amazon.com/dp/B0874XN4D8","image":"https://m.media-amazon.com/images/I/71KwWRJIMLL._AC_SL1300_.jpg","tags":["ssd","storage","portable"]},
  {"id":8,"title":"Hydro Flask 32oz Wide Mouth","category":"lifestyle","price":"$44.95","rating":4.8,"reviews":62000,"description":"Keeps drinks cold 24 hrs, hot 12 hrs. TempShield insulation. Lifetime warranty.","pros":["Cold 24 hours, hot 12 hours","Lifetime warranty — they mean it","No sweat on the outside","Fits most car cup holders"],"badge":"Classic Choice","featured":false,"amazonUrl":"https://www.amazon.com/dp/B01ACAX6WI","image":"https://m.media-amazon.com/images/I/61o3IpWDuLL._AC_SL1500_.jpg","tags":["water bottle","hydration","outdoors"]},
  {"id":9,"title":"Blue Yeti USB Microphone","category":"tech","price":"$99.99","rating":4.7,"reviews":38500,"description":"Studio-quality sound for podcasts, streaming, gaming, and video calls.","pros":["Plug-and-play — no drivers needed","4 recording patterns for any situation","Built-in headphone jack for zero-latency monitoring","Used by professional podcasters worldwide"],"badge":"Creator Favorite","featured":false,"amazonUrl":"https://www.amazon.com/dp/B00N1YPXW2","image":"https://m.media-amazon.com/images/I/81CqiSAHGCL._AC_SL1500_.jpg","tags":["microphone","podcast","streaming"]},
  {"id":10,"title":"Philips Hue Smart Bulb Starter Kit","category":"home","price":"$69.99","rating":4.6,"reviews":18700,"description":"16 million colors, voice & app controlled. Transform your home lighting forever.","pros":["Works with Alexa, Google, Apple HomeKit","16 million colors","Set schedules and automations","No electrician needed — just screw in the bulbs"],"badge":"Smart Pick","featured":false,"amazonUrl":"https://www.amazon.com/dp/B014H2P42K","image":"https://m.media-amazon.com/images/I/71-MVT3RFRL._AC_SL1500_.jpg","tags":["smart home","lighting","alexa"]},
  {"id":11,"title":"Ninja Creami Ice Cream Maker","category":"kitchen","price":"$169.99","rating":4.6,"reviews":24000,"description":"Make ice cream, gelato, sorbet, and smoothie bowls from healthy ingredients.","pros":["Make ice cream from protein shakes","7 one-touch programs","No ice or salt needed","Results in under 5 minutes"],"badge":"Trending Now","featured":false,"amazonUrl":"https://www.amazon.com/dp/B08XTJLL6Z","image":"https://m.media-amazon.com/images/I/71Y4k1eBBDL._AC_SL1500_.jpg","tags":["ice cream","kitchen","dessert"]},
  {"id":12,"title":"Flexispot E7 Standing Desk Frame","category":"home","price":"$349.99","rating":4.8,"reviews":7600,"description":"Electric height adjustment, anti-collision tech. Supports up to 355 lbs.","pros":["Adjusts height in 3 seconds","Anti-collision stops if it hits something","Holds up to 355 lbs — monitor arms included","7-year warranty on the motor"],"badge":"Premium Pick","featured":false,"amazonUrl":"https://www.amazon.com/dp/B08DJBZGGL","image":"https://m.media-amazon.com/images/I/71DEb3Gk6GL._AC_SL1500_.jpg","tags":["standing desk","ergonomic","home office"]}
];
