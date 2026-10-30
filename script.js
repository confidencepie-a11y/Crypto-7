// Telegram Mini App integration (safe to run in a normal browser too)
const tg = window.Telegram && window.Telegram.WebApp;
const inTelegram = !!(tg && tg.initData !== undefined && tg.platform && tg.platform !== 'unknown');
const buzz = (type) => { try { if (inTelegram) tg.HapticFeedback[type === 'tab' ? 'selectionChanged' : 'impactOccurred']('light'); } catch (e) {} };

if (inTelegram) {
  document.documentElement.classList.add('tg');
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); tg.setBottomBarColor('#000000'); } catch (e) {}
  // The screen scrolls, so stop swipe-down from closing the app
  try { if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes(); } catch (e) {}
}

// Splash screen: show for 3.5 seconds (tap to skip), then reveal the app
(function () {
  const app = document.querySelector('.app');
  const splash = document.getElementById('splash');
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    splash.classList.add('out');
    app.classList.add('ready');
    setTimeout(() => splash.remove(), 900);
  };
  setTimeout(finish, 3500);
  splash.addEventListener('click', finish);
})();

// Assets / Accounts toggle
const segButtons = document.querySelectorAll('.seg-btn');
segButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    buzz('tab');
    segButtons.forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('assets').classList.toggle('hidden', btn.dataset.tab !== 'assets');
    document.getElementById('watchlist').classList.toggle('hidden', btn.dataset.tab !== 'watchlist');
  });
});

// Bottom nav active state
const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    buzz('tab');
    navButtons.forEach(b => b.classList.toggle('active', b === btn));
  });
});

// Haptics on quick actions and promo button
document.querySelectorAll('.action, .promo-btn').forEach(b => b.addEventListener('click', () => buzz('tap')));

// ---------- Live market data (CoinGecko: real prices, names and logos) ----------
const API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&sparkline=false&price_change_percentage=24h';
const PAGES = 13;                       // 13 x 250 = 3,250 coins
const TOP = ['bitcoin', 'ethereum', 'litecoin', 'tron'];
const NAMES = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', litecoin: 'Litecoin', tron: 'TRON' };
const CK = 'vero_coins_v1', WK = 'vero_watch_v1';
const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let coins = load(CK), watch = load(WK), byId = new Map(), fullLoaded = 0, loadingAll = false, query = '', shown = 0;
const reindex = () => { byId = new Map(coins.map(c => [c.id, c])); };
reindex();

const esc = (t) => String(t).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function usd(p) {
  if (p == null) return '\u2014';
  if (p >= 1) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p <= 0) return '$0.00';
  return '$' + p.toFixed(Math.min(12, Math.max(2, 3 - Math.floor(Math.log10(p)))));
}
const pct = (v) => v == null ? '' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const dir = (v) => v == null ? '' : v >= 0 ? 'up' : 'down';

function upsert(list) {
  list.forEach(c => {
    const n = { id: c.id, s: c.symbol, n: c.name, i: c.image, p: c.current_price, c: c.price_change_percentage_24h };
    const old = byId.get(c.id);
    if (old) Object.assign(old, n); else { coins.push(n); byId.set(n.id, n); }
  });
}
async function get(url, tries = 4) {
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url);
      if (r.status === 429) { await new Promise(r => setTimeout(r, 15000)); continue; }
      if (!r.ok) throw 0;
      return await r.json();
    } catch (e) { await new Promise(r => setTimeout(r, 3000)); }
  }
  return null;
}

const coinRow = (c, star) => `<div class="row crow"><img class="coin" src="${esc(c.i)}" alt="" loading="lazy" onerror="this.classList.add('noimg')"><div class="meta"><div class="name">${esc(c.n)}</div><div class="sub money">${usd(c.p)}</div></div><div class="val"><div class="sub ${dir(c.c)}" style="margin:0">${pct(c.c)}</div></div>${star ? `<button class="star${watch.includes(c.id) ? ' on' : ''}" data-id="${esc(c.id)}" aria-label="Watchlist"><svg viewBox="0 0 24 24"><path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg></button>` : ''}</div>`;

function renderTop() {
  document.getElementById('topCoins').innerHTML = TOP.map(id => {
    const c = byId.get(id);
    if (!c) return `<div class="row crow"><div class="coin noimg"></div><div class="meta"><div class="name">${NAMES[id]}</div><div class="sub money">\u2014</div></div></div>`;
    return coinRow(c, false);
  }).join('');
}
function renderAssets() {
  document.querySelectorAll('#assets .row').forEach(r => {
    const c = byId.get(r.dataset.id); if (!c || c.p == null) return;
    r.querySelector('.js-val').textContent = usd(c.p * parseFloat(r.dataset.amt));
    const e = r.querySelector('.js-chg'); e.textContent = pct(c.c); e.className = 'sub js-chg ' + dir(c.c);
  });
}
function renderWatch() {
  const el = document.getElementById('watchlist');
  const items = watch.map(id => byId.get(id)).filter(Boolean);
  el.innerHTML = items.length ? items.map(c => coinRow(c, true)).join('') : '<div class="empty">No coins in your watchlist yet.<br>Tap the star on any coin in All crypto.</div>';
}
function filtered() {
  const q = query.trim().toLowerCase();
  return q ? coins.filter(c => c.n.toLowerCase().includes(q) || c.s.toLowerCase().includes(q)) : coins;
}
function renderPanel(more) {
  const list = document.getElementById('panelList'), all = filtered();
  if (!more) { shown = 0; list.innerHTML = ''; list.scrollTop = 0; }
  const next = all.slice(shown, shown + 80); shown += next.length;
  list.insertAdjacentHTML('beforeend', next.map(c => coinRow(c, true)).join(''));
  if (!all.length) list.innerHTML = `<div class="empty">${coins.length ? 'No coins found.' : 'Loading coins\u2026'}</div>`;
  document.getElementById('panelCount').textContent = loadingAll ? `Loading ${coins.length.toLocaleString()}\u2026` : `${all.length.toLocaleString()} coins`;
}
const renderAll = () => { renderTop(); renderAssets(); renderWatch(); };

async function loadTop() {
  const ids = [...new Set([...TOP, ...watch])].slice(0, 250).join(',');
  const d = await get(API + '&per_page=250&ids=' + ids);
  if (d) { upsert(d); renderAll(); }
}
async function loadAll() {
  if (loadingAll) return; loadingAll = true;
  for (let p = 1; p <= PAGES; p++) {
    const d = await get(API + '&per_page=250&page=' + p);
    if (!d || !d.length) break;
    upsert(d);
    if (p === 1 || p % 3 === 0) { renderAll(); if (document.getElementById('panel').classList.contains('open')) renderPanel(false); }
    await new Promise(r => setTimeout(r, 2500));
  }
  loadingAll = false; fullLoaded = Date.now(); save(CK, coins); renderAll();
  if (document.getElementById('panel').classList.contains('open')) renderPanel(false);
}

// Stars (add / remove from watchlist)
document.addEventListener('click', (e) => {
  const b = e.target.closest('.star'); if (!b) return;
  buzz('tap');
  const id = b.dataset.id;
  watch = watch.includes(id) ? watch.filter(x => x !== id) : [...watch, id];
  save(WK, watch); renderWatch();
  document.querySelectorAll('#panelList .star[data-id="' + id + '"]').forEach(s => s.classList.toggle('on', watch.includes(id)));
});

// All crypto panel
const panel = document.getElementById('panel'), plist = document.getElementById('panelList');
document.getElementById('allCryptoBtn').addEventListener('click', () => {
  buzz('tap'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); renderPanel(false);
  if (!loadingAll && Date.now() - fullLoaded > 600000) loadAll();
});
document.getElementById('panelBack').addEventListener('click', () => { buzz('tap'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); });
document.getElementById('q').addEventListener('input', (e) => { query = e.target.value; renderPanel(false); });
plist.addEventListener('scroll', () => { if (plist.scrollTop + plist.clientHeight > plist.scrollHeight - 400 && shown < filtered().length) renderPanel(true); });

renderAll(); loadTop().then(loadAll);
setInterval(loadTop, 30000);   // keep prices live
