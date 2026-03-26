'use strict';

// Show the email capture bar after 20 seconds if not already dismissed/subscribed
(function () {
  if (localStorage.getItem('email_subscribed') || localStorage.getItem('email_bar_dismissed')) return;
  setTimeout(() => {
    const bar = document.getElementById('email-bar');
    if (bar) bar.classList.remove('hidden');
  }, 20000);
})();

function subscribeEmail() {
  const input = document.getElementById('email-input');
  const email = input ? input.value.trim() : '';
  if (!email || !email.includes('@')) {
    if (input) input.style.borderColor = '#ef4444';
    return;
  }
  const list = JSON.parse(localStorage.getItem('email_list') || '[]');
  if (!list.find(e => e.email === email)) {
    list.push({ email, ts: new Date().toISOString() });
    localStorage.setItem('email_list', JSON.stringify(list));
  }
  localStorage.setItem('email_subscribed', '1');
  document.getElementById('email-bar').classList.add('hidden');
  showGlobalToast('You\'re subscribed! ');
}

function dismissEmailBar() {
  localStorage.setItem('email_bar_dismissed', '1');
  const bar = document.getElementById('email-bar');
  if (bar) bar.classList.add('hidden');
}

function showGlobalToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
