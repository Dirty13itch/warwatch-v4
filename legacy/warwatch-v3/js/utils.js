/* WarWatch V2 — Utilities */

const Utils = {
  // Time since conflict start
  conflictDay() {
    const now = new Date();
    const diff = now - WW.CONFLICT_START;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  },

  // Relative time
  timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },

  // Format UTC clock
  formatUTC() {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  },

  // Format local clock
  formatLocal() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },

  // Format date
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // RSS fetch via rss2json proxy
  async fetchRSS(feedUrl) {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'ok') return data.items || [];
      return [];
    } catch (e) {
      console.warn('RSS fetch failed:', feedUrl, e);
      return [];
    }
  },

  // Truncate string
  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  },

  // Strip HTML
  stripHTML(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  // Debounce
  debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  },

  // Simple in-memory cache
  _cache: {},
  cacheGet(key) {
    const entry = this._cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) { delete this._cache[key]; return null; }
    return entry.data;
  },
  cacheSet(key, data, ttlMs) {
    this._cache[key] = { data, ts: Date.now(), ttl: ttlMs || 600000 };
  }
};

window.Utils = Utils;
