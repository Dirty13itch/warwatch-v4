/* WarWatch V3 — Main Application Orchestrator */

const App = {
  currentTab: 'map',
  theme: 'dark',
  lastUpdated: null,

  init() {
    this.setupTabs();
    this.setupClocks();
    this.setupKPIs();
    this.setupDeadlineCountdown();
    this.setupThemeToggle();
    this.setupRefresh();
    this.setupVideoModal();
    this.setupIntelFilters();
    this.renderAnalysis();
    this.renderIndicators();
    this.renderQuickLinks();
    this.renderIndependentJournalists();
    this.renderOSINTAccounts();
    this.renderKeyAnalysts();
    this.renderFronts();
    this.renderCasualties();
    this.renderCountryAttacks();
    this.renderDepletion();
    this.renderCSGStatus();
    this.renderHVT();
    this.renderUSLosses();
    this.renderIranAchievements();
    this.renderNegotiation();
    this.renderTimeline();
    this.renderWarTimeline();
    this.switchTab('map');
    this.updateLastUpdated();
  },

  // ═══════════ Tab switching ═══════════
  setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.tab === tabId);
    });

    if (tabId === 'map' && !MapModule.map) {
      MapModule.init();
    } else if (tabId === 'map' && MapModule.map) {
      MapModule.map.resize();
    }
    if (tabId === 'intel' && Feeds.allItems.length === 0) {
      Feeds.fetchAllNews();
    }
    if (tabId === 'media' && Feeds.mediaItems.length === 0) {
      Feeds.fetchYouTube();
      Feeds.fetchIndependentYouTube();
      Feeds.fetchPodcasts();
    }
    if (tabId === 'timeline') {
      // Ensure filters are wired up on first visit
      this._setupTimelineFilters();
    }
  },

  // ═══════════ Clocks ═══════════
  setupClocks() {
    const utcEl = document.getElementById('clock-utc');
    const localEl = document.getElementById('clock-local');
    const update = () => {
      if (utcEl) utcEl.textContent = Utils.formatUTC();
      if (localEl) localEl.textContent = Utils.formatLocal();
    };
    update();
    setInterval(update, 1000);
  },

  // ═══════════ KPIs ═══════════
  setupKPIs() {
    const dayEl = document.getElementById('kpi-conflict-day');
    if (dayEl) dayEl.textContent = 'DAY ' + Utils.conflictDay();
    setInterval(() => {
      if (dayEl) dayEl.textContent = 'DAY ' + Utils.conflictDay();
    }, 60000);

    const frontsDay = document.getElementById('fronts-day');
    if (frontsDay) frontsDay.textContent = Utils.conflictDay();
  },

  // ═══════════ DEADLINE COUNTDOWN ═══════════
  setupDeadlineCountdown() {
    if (!WW.DEADLINE) return;
    const target = WW.DEADLINE.target.getTime();
    const daysEl = document.getElementById('cd-days');
    const hrsEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
      if (hrsEl) hrsEl.textContent = String(h).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(s).padStart(2, '0');

      if (diff === 0) {
        const banner = document.getElementById('deadline-banner');
        if (banner) banner.style.background = 'linear-gradient(90deg, #3d0000, #5a0000, #3d0000)';
        const threat = document.getElementById('deadline-threat');
        if (threat) threat.textContent = 'DEADLINE EXPIRED — Awaiting US response';
      }
    };
    update();
    setInterval(update, 1000);
  },

  // ═══════════ Theme ═══════════
  setupThemeToggle() {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      btn.textContent = this.theme === 'dark' ? '☀' : '☾';
    });
  },

  // ═══════════ Refresh ═══════════
  setupRefresh() {
    const btn = document.getElementById('btn-refresh');
    if (!btn) return;
    btn.addEventListener('click', () => {
      Utils._cache = {};
      if (this.currentTab === 'intel') Feeds.fetchAllNews();
      if (this.currentTab === 'media') { Feeds.fetchYouTube(); Feeds.fetchPodcasts(); }
      this.updateLastUpdated();
    });
  },

  updateLastUpdated() {
    this.lastUpdated = new Date();
    const el = document.getElementById('last-updated');
    if (el) el.textContent = this.lastUpdated.toLocaleTimeString('en-US', { hour12: false });
  },

  // ═══════════ Video modal ═══════════
  setupVideoModal() {
    const modal = document.getElementById('video-modal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-close')) {
        Feeds.closeVideo();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Feeds.closeVideo();
    });
  },

  // ═══════════ Intel filters ═══════════
  setupIntelFilters() {
    document.querySelectorAll('.intel-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => Feeds.setFilter(btn.dataset.filter));
    });
  },

  // ═══════════ FRONTS (NEW V3) ═══════════
  renderFronts() {
    const container = document.getElementById('fronts-grid');
    if (!container || !WW.FRONTS) return;
    container.innerHTML = WW.FRONTS.map(f => `
      <div class="front-card level-${f.level}">
        <div class="front-card-header">
          <div class="front-name">${f.icon} ${f.name}</div>
          <div class="front-status status-${f.level}">${f.status}</div>
        </div>
        <div class="front-summary">${f.summary}</div>
        <div class="front-keyfact">${f.keyFact}</div>
        <div style="font-size:9px;color:var(--color-text-faint);margin-top:4px;font-family:var(--font-mono)">Updated: ${f.lastUpdate}</div>
      </div>
    `).join('');
  },

  // ═══════════ CASUALTIES (NEW V3) ═══════════
  renderCasualties() {
    const container = document.getElementById('casualties-panel');
    if (!container || !WW.CASUALTIES) return;

    const maxKilled = Math.max(...WW.CASUALTIES.parties.map(p => p.killedHigh || 0));
    const maxWounded = Math.max(...WW.CASUALTIES.parties.map(p => p.woundedNum || 0));

    let html = `<div style="display:flex;justify-content:space-between;margin-bottom:var(--sp-3);padding-bottom:var(--sp-2);border-bottom:1px solid var(--color-divider)">
      <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-danger)">
        TOTAL KILLED: ${WW.CASUALTIES.totalRange.low.toLocaleString()}–${WW.CASUALTIES.totalRange.high.toLocaleString()}+
      </div>
      <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-warning)">
        TOTAL WOUNDED: ${WW.CASUALTIES.totalRange.wounded.toLocaleString()}+
      </div>
    </div>`;

    // legend
    html += `<div style="display:flex;gap:16px;margin-bottom:var(--sp-2);font-size:10px;font-family:var(--font-mono)">
      <span style="color:var(--color-danger)">█ Killed</span>
      <span style="color:var(--color-warning)">█ Wounded</span>
    </div>`;

    WW.CASUALTIES.parties.forEach(p => {
      const killedPct = maxKilled > 0 ? ((p.killedHigh || 0) / maxKilled * 100) : 0;
      const woundedPct = maxWounded > 0 ? ((p.woundedNum || 0) / maxWounded * 100) : 0;
      html += `
        <div class="casualty-bar-row">
          <div class="casualty-country">${p.flag} ${p.country}</div>
          <div style="flex:1;display:flex;flex-direction:column;gap:3px">
            <div class="casualty-bar-container" style="height:10px">
              <div class="casualty-bar-fill bar-killed" style="width:${Math.max(2, killedPct)}%"></div>
            </div>
            <div class="casualty-bar-container" style="height:10px">
              <div class="casualty-bar-fill bar-wounded" style="width:${Math.max(2, woundedPct)}%"></div>
            </div>
          </div>
          <div class="casualty-numbers">
            <span style="color:var(--color-danger)">☠ ${p.killed}</span>
            <span style="color:var(--color-warning);margin-left:6px">⚕ ${p.wounded}</span>
          </div>
        </div>
        ${p.displaced ? `<div style="font-size:9px;color:var(--color-primary);padding-left:110px;margin-top:-2px;margin-bottom:2px;font-family:var(--font-mono)">🏠 ${p.displaced} displaced</div>` : ''}
        ${p.note ? `<div style="font-size:9px;color:var(--color-text-faint);padding-left:110px;margin-top:-2px;margin-bottom:2px">${p.note}</div>` : ''}`;
    });

    html += `<div style="font-size:9px;color:var(--color-text-faint);margin-top:var(--sp-2);font-style:italic">
      ${WW.CASUALTIES.source}. Iranian figures contested — MoH figure likely undercount.
    </div>`;
    container.innerHTML = html;
  },

  // ═══════════ COUNTRY ATTACKS (NEW V3) ═══════════
  renderCountryAttacks() {
    const container = document.getElementById('country-attacks');
    if (!container || !WW.COUNTRY_ATTACKS) return;

    container.innerHTML = WW.COUNTRY_ATTACKS.map(c => {
      let patriotHTML = '';
      if (c.patriotDepleted !== null) {
        const color = c.patriotDepleted >= 80 ? 'var(--color-danger)' : c.patriotDepleted >= 60 ? 'var(--color-warning)' : 'var(--color-primary)';
        patriotHTML = `
          <div class="attack-patriot">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-faint);margin-bottom:3px">Patriot Depletion</div>
            <div style="height:6px;background:var(--color-surface-offset);border-radius:3px;overflow:hidden">
              <div style="width:${c.patriotDepleted}%;height:100%;background:${color};border-radius:3px"></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:11px;color:${color};margin-top:2px">${c.patriotDepleted}% depleted</div>
          </div>`;
      }
      return `
        <div class="attack-card">
          <div class="attack-card-header">
            <div class="attack-flag">${c.flag}</div>
            <div class="attack-country-name">${c.country}</div>
            <div class="attack-total">${c.totalMunitions.toLocaleString()}</div>
          </div>
          <div class="attack-breakdown">
            <div class="attack-type">
              <div class="attack-type-num">${c.ballistic}</div>
              <div class="attack-type-label">Ballistic</div>
            </div>
            <div class="attack-type">
              <div class="attack-type-num">${c.cruise}</div>
              <div class="attack-type-label">Cruise</div>
            </div>
            <div class="attack-type">
              <div class="attack-type-num">${c.drones.toLocaleString()}</div>
              <div class="attack-type-label">Drones</div>
            </div>
          </div>
          <div class="attack-casualties">
            <span style="color:var(--color-danger)">☠ ${c.killed} killed</span>
            <span style="color:var(--color-warning)">⚕ ${c.wounded.toLocaleString()} wounded</span>
          </div>
          <div class="attack-targets">${c.keyTargets}</div>
          ${patriotHTML}
        </div>`;
    }).join('');
  },

  // ═══════════ DEPLETION GAUGES (NEW V3) ═══════════
  renderDepletion() {
    const container = document.getElementById('depletion-panel');
    if (!container || !WW.MUNITION_DEPLETION) return;

    const makeGauge = (label, depleted, sublabel, flag) => {
      if (depleted === null) return `
        <div class="depletion-card">
          <div class="depletion-label">${flag || ''} ${label}</div>
          <div style="font-family:var(--font-mono);font-size:14px;color:var(--color-warning);margin:20px 0">DATA CLASSIFIED</div>
          <div class="depletion-sublabel">${sublabel}</div>
        </div>`;
      const r = 42;
      const circ = 2 * Math.PI * r;
      const offset = circ * (1 - depleted / 100);
      const color = depleted >= 80 ? 'var(--color-danger)' : depleted >= 60 ? 'var(--color-warning)' : 'var(--color-primary)';
      return `
        <div class="depletion-card">
          <div class="depletion-label">${flag || ''} ${label}</div>
          <div class="depletion-gauge">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle class="depletion-gauge-bg" cx="50" cy="50" r="${r}"/>
              <circle class="depletion-gauge-fill" cx="50" cy="50" r="${r}" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="depletion-gauge-text" style="color:${color}">${depleted}%</div>
          </div>
          <div class="depletion-sublabel">${sublabel}</div>
        </div>`;
    };

    const md = WW.MUNITION_DEPLETION;
    let html = '';
    html += makeGauge('ATACMS/PrSM', md.us.atacms_prsm.depleted, 'US inventory expended', '🇺🇸');
    html += makeGauge('THAAD Interceptors', md.us.thaad.depleted, 'US stockpile expended', '🇺🇸');
    md.gulf.forEach(g => {
      html += makeGauge(`${g.system}`, g.depleted, `${g.country} depleted`, g.flag);
    });

    html += `<div class="depletion-card" style="grid-column:1/-1;text-align:left;padding:var(--sp-3)">
      <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--color-warning);margin-bottom:6px">⚠ STRATEGIC IMPLICATION</div>
      <div style="font-size:11px;color:var(--color-text-muted);line-height:1.5">${md.us.productionGap}</div>
      <div style="font-size:10px;color:var(--color-text-faint);margin-top:4px">
        Total war cost: ${md.us.totalCost} · ${md.us.missilesFired} · Daily burn: ${md.us.dailyBurnRate}
      </div>
      <div style="font-size:9px;color:var(--color-text-faint);margin-top:2px">Source: ${md.source}</div>
    </div>`;

    container.innerHTML = html;
  },

  // ═══════════ CSG STATUS (NEW V3) ═══════════
  renderCSGStatus() {
    const container = document.getElementById('csg-panel');
    if (!container || !WW.CSG_STATUS) return;
    const colors = { success: 'var(--color-success)', warning: 'var(--color-warning)', primary: 'var(--color-primary)' };
    container.innerHTML = WW.CSG_STATUS.map(c => `
      <div class="csg-card">
        <div class="csg-status-dot" style="background:${colors[c.statusColor]}"></div>
        <div>
          <div class="csg-name">${c.name}</div>
          <div class="csg-status-badge" style="background:${colors[c.statusColor]}18;color:${colors[c.statusColor]}">${c.status}</div>
          <div class="csg-location">📍 ${c.location}</div>
          <div class="csg-note">${c.note}</div>
        </div>
      </div>
    `).join('');
  },

  // ═══════════ HVT TRACKER (NEW V3) ═══════════
  renderHVT() {
    const container = document.getElementById('hvt-panel');
    if (!container || !WW.HVT) return;
    container.innerHTML = WW.HVT.map(h => {
      const statusClass = h.status.includes('KILLED') ? 'killed' : 'missing';
      return `
        <div class="hvt-card">
          <div class="hvt-name">${h.name}</div>
          <div class="hvt-role">${h.role}</div>
          <div class="hvt-status-badge ${statusClass}">${h.status}</div>
          <div class="hvt-detail">📍 ${h.location} · ${h.date}</div>
          <div style="font-size:9px;color:var(--color-text-faint);margin-top:2px">Source: ${h.source}</div>
        </div>`;
    }).join('');
  },

  // ═══════════ US/COALITION LOSSES (REBALANCING) ═══════════
  renderUSLosses() {
    const container = document.getElementById('us-losses-panel');
    if (!container || !WW.US_LOSSES) return;
    const L = WW.US_LOSSES;

    let html = `<div style="background:var(--color-surface);border:1px solid var(--color-danger);border-radius:6px;padding:var(--sp-4)">`;

    // Top summary
    html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-3);margin-bottom:var(--sp-4)">
      <div class="kpi-card" style="border-left:3px solid var(--color-danger)">
        <div class="kpi-label">Equipment Losses</div>
        <div class="kpi-value" style="font-size:16px;color:var(--color-danger)">$${(L.totalEquipmentCost.low/1000).toFixed(1)}–$${(L.totalEquipmentCost.high/1000).toFixed(1)}B</div>
        <div class="kpi-sub">${L.totalEquipmentCost.source}</div>
      </div>
      <div class="kpi-card" style="border-left:3px solid var(--color-danger)">
        <div class="kpi-label">Aircraft Lost</div>
        <div class="kpi-value" style="font-size:16px;color:var(--color-danger)">${L.aircraftLost}+</div>
        <div class="kpi-sub">${L.aircraftNote}</div>
      </div>
      <div class="kpi-card" style="border-left:3px solid var(--color-warning)">
        <div class="kpi-label">Bases/Sites Damaged</div>
        <div class="kpi-value" style="font-size:16px;color:var(--color-warning)">${L.sitesConfirmedDamaged}</div>
        <div class="kpi-sub">${L.basesHit} of ${L.basesTotal} bases hit</div>
      </div>
      <div class="kpi-card" style="border-left:3px solid var(--color-warning)">
        <div class="kpi-label">Base Infrastructure</div>
        <div class="kpi-value" style="font-size:16px;color:var(--color-warning)">$${L.baseDamage.cost}M</div>
        <div class="kpi-sub">${L.baseDamage.source}</div>
      </div>
    </div>`;

    // Aircraft losses
    html += `<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-danger);margin-bottom:var(--sp-2)">✈️ Aircraft Losses</div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--sp-3);margin-bottom:var(--sp-4)">`;
    L.aircraft.forEach(a => {
      const isNote = a.note ? `<div style="font-size:9px;padding:2px 6px;background:rgba(255,59,59,0.15);color:var(--color-danger);border-radius:3px;font-family:var(--font-mono);font-weight:700;margin-top:4px;display:inline-block">${a.note}</div>` : '';
      html += `<div class="attack-card" style="border-left:3px solid var(--color-danger)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--color-text)">${a.type}</div>
          <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--color-danger)">${a.lost > 0 ? a.lost + ' lost' : ''}${a.damaged > 0 ? (a.lost > 0 ? ' / ' : '') + a.damaged + ' dmg' : ''}</div>
        </div>
        <div style="font-size:11px;color:var(--color-text-muted);line-height:1.4;margin-bottom:4px">${a.cause}</div>
        <div style="font-size:10px;color:var(--color-text-faint)">Cost: ${a.cost}</div>
        <div style="font-size:10px;color:var(--color-text-faint)">Crew: ${a.crew}</div>
        ${isNote}
        <div style="font-size:9px;color:var(--color-text-faint);margin-top:4px">Source: ${a.source}</div>
      </div>`;
    });
    html += `</div>`;

    // Radar/Comms
    html += `<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-danger);margin-bottom:var(--sp-2)">📡 Radar & Communications Destroyed/Damaged</div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--sp-3);margin-bottom:var(--sp-4)">`;
    L.radarAndComms.forEach(r => {
      const statusColor = r.status === 'DESTROYED' ? 'var(--color-danger)' : r.status.includes('HIT') ? 'var(--color-warning)' : 'var(--color-text-muted)';
      html += `<div class="attack-card">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--color-text);margin-bottom:2px">${r.system}</div>
        <div style="font-size:10px;color:var(--color-text-faint);margin-bottom:4px">📍 ${r.location}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:${statusColor}18;color:${statusColor}">${r.status}</span>
          <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--color-danger)">${r.cost}</span>
        </div>
        <div style="font-size:10px;color:var(--color-text-muted);line-height:1.4">${r.detail}</div>
        <div style="font-size:9px;color:var(--color-text-faint);margin-top:4px">Source: ${r.source}</div>
      </div>`;
    });
    html += `</div>`;

    // Embassies
    html += `<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-warning);margin-bottom:var(--sp-2)">🏛️ Diplomatic Facilities Struck</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-4)">`;
    L.embassiesHit.forEach(e => {
      html += `<div class="attack-card">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--color-text)">${e.name}</div>
        <div style="font-size:10px;color:var(--color-text-muted);margin-top:4px">${e.detail}</div>
        <div style="font-size:9px;color:var(--color-text-faint);margin-top:2px">Source: ${e.source}</div>
      </div>`;
    });
    html += `</div>`;

    // Russia intel + strategic implication
    html += `<div style="padding:var(--sp-3);background:rgba(255,59,59,0.06);border:1px solid rgba(255,59,59,0.2);border-radius:6px;margin-bottom:var(--sp-3)">
      <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--color-danger);margin-bottom:4px">🇷🇺 RUSSIA INTELLIGENCE SUPPORT</div>
      <div style="font-size:11px;color:var(--color-text-muted);line-height:1.5">${L.russiaIntel}</div>
    </div>`;
    html += `<div style="padding:var(--sp-3);background:rgba(255,170,0,0.06);border:1px solid rgba(255,170,0,0.2);border-radius:6px">
      <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--color-warning);margin-bottom:4px">⚠️ STRATEGIC IMPLICATION</div>
      <div style="font-size:11px;color:var(--color-text-muted);line-height:1.5">${L.strategicImplication}</div>
    </div>`;

    html += `</div>`;
    container.innerHTML = html;
  },

  // ═══════════ IRAN ACHIEVEMENTS (REBALANCING) ═══════════
  renderIranAchievements() {
    const container = document.getElementById('iran-achievements-panel');
    if (!container || !WW.IRAN_ACHIEVEMENTS) return;

    const sigColors = { CRITICAL: 'var(--color-danger)', HIGH: 'var(--color-warning)' };
    container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:var(--sp-3)">
      ${WW.IRAN_ACHIEVEMENTS.map(a => `
        <div class="attack-card" style="border-left:3px solid ${sigColors[a.significance] || 'var(--color-text-faint)'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--color-text)">${a.category}</div>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:${sigColors[a.significance]}18;color:${sigColors[a.significance]}">${a.significance}</span>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);line-height:1.45">${a.detail}</div>
          <div style="font-size:9px;color:var(--color-text-faint);margin-top:4px">Source: ${a.source}</div>
        </div>
      `).join('')}
    </div>`;
  },

  // ═══════════ NEGOTIATION TRACKER (NEW V3) ═══════════
  renderNegotiation() {
    const container = document.getElementById('negotiation-panel');
    if (!container || !WW.NEGOTIATION) return;

    const n = WW.NEGOTIATION;
    let html = `<div class="negotiation-grid">
      <div class="negotiation-column">
        <h4 style="color:var(--color-primary)">${n.usPlan.label}</h4>`;
    n.usPlan.points.forEach(p => {
      html += `<div class="negotiation-point">
        <div class="negotiation-status-dot ${p.status}"></div>
        <div>${p.text} <span style="font-size:9px;color:${p.status === 'rejected' ? 'var(--color-danger)' : p.status === 'disputed' ? 'var(--color-warning)' : 'var(--color-text-faint)'};font-family:var(--font-mono);text-transform:uppercase">[${p.status}]</span></div>
      </div>`;
    });
    html += `</div><div class="negotiation-column">
        <h4 style="color:var(--color-hostile)">${n.iranConditions.label}</h4>`;
    n.iranConditions.points.forEach(p => {
      html += `<div class="negotiation-point">
        <div class="negotiation-status-dot ${p.status}"></div>
        <div>${p.text} <span style="font-size:9px;color:var(--color-danger);font-family:var(--font-mono);text-transform:uppercase">[REJECTED BY US]</span></div>
      </div>`;
    });
    html += `</div></div>`;

    html += `<div class="negotiation-contradiction">
      <strong>KEY CONTRADICTION:</strong> ${n.keyContradiction}
      <div style="margin-top:6px;font-size:10px;color:var(--color-text-faint)">
        Intermediary: ${WW.DEADLINE.intermediary} · Supporting: ${n.supportingParties}
      </div>
    </div>`;

    container.innerHTML = html;
  },

  // ═══════════ TIMELINE (NEW V3) ═══════════
  renderTimeline() {
    const container = document.getElementById('war-timeline');
    if (!container || !WW.TIMELINE) return;

    const colors = {
      danger: 'var(--color-danger)', warning: 'var(--color-warning)',
      nuclear: '#ffd600', primary: 'var(--color-primary)'
    };

    container.innerHTML = WW.TIMELINE.map(e => `
      <div class="timeline-event">
        <div class="timeline-dot" style="background:${colors[e.color] || 'var(--color-primary)'}"></div>
        <div class="timeline-date">${e.date} <span class="timeline-label">${e.label}</span></div>
        <div class="timeline-text">${e.text}</div>
      </div>
    `).join('');
  },

  // ═══════════ ANALYSIS TAB ═══════════
  renderAnalysis() {
    this.renderEscalationLadder();
    this.renderScenarios();
    this.renderDIME();
    this.renderORBAT();
  },

  renderEscalationLadder() {
    const container = document.getElementById('escalation-ladder');
    if (!container) return;
    container.innerHTML = WW.ESCALATION_LADDER.map(rung => {
      const statusColors = {
        past: 'var(--color-text-faint)', active: 'var(--color-success)',
        current: 'var(--color-warning)', approaching: 'var(--color-oil)',
        watch: 'var(--color-danger)', threshold: 'var(--color-nuclear)'
      };
      return `
        <div class="escalation-rung ${rung.status}">
          <div class="rung-number" style="color:${statusColors[rung.status]}">${rung.rung}</div>
          <div class="rung-label">${rung.label}</div>
          <div class="rung-status" style="color:${statusColors[rung.status]};background:${statusColors[rung.status]}15">${rung.status.toUpperCase()}</div>
        </div>
      `;
    }).join('');
  },

  renderScenarios() {
    const container = document.getElementById('scenario-cards');
    if (!container) return;
    container.innerHTML = WW.SCENARIOS.map(sc => {
      const indicatorDots = sc.indicators.map(ind => {
        const colors = { green: '#00e676', amber: '#ffaa00', grey: '#3d5168', red: '#ff3b3b' };
        return `<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--color-text-muted)">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${colors[ind.status]}"></span>
          ${ind.label}
        </div>`;
      }).join('');

      return `
        <div class="scenario-card">
          <div class="scenario-card-header">
            <div>
              <div class="scenario-name">Scenario ${sc.id}: ${sc.name}</div>
              <div style="font-size:10px;color:var(--color-text-faint);font-style:italic">${sc.nickname}</div>
            </div>
            <div class="scenario-prob">${sc.probability}%</div>
          </div>
          <div class="prob-bar"><div class="prob-bar-fill" style="width:${sc.probability}%;background:${sc.id==='A'?'var(--color-primary)':sc.id==='C'?'var(--color-danger)':sc.id==='E'?'var(--color-warning)':'var(--color-primary)'}"></div></div>
          <div class="scenario-desc">${sc.desc}</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
            <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-faint)">Key Indicators</div>
            ${indicatorDots}
          </div>
        </div>
      `;
    }).join('');
  },

  renderDIME() {
    const container = document.getElementById('dime-chart');
    if (!container) return;

    const dimensions = ['Diplomatic', 'Information', 'Military', 'Economic'];
    const usData = WW.DIME.us;
    const iranData = WW.DIME.iran;

    let html = '<div style="display:flex;flex-direction:column;gap:12px;width:100%">';
    dimensions.forEach(dim => {
      const key = dim.toLowerCase();
      const usVal = usData[key];
      const iranVal = iranData[key];
      html += `
        <div>
          <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:4px">${dim}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="flex:1;display:flex;align-items:center;gap:6px">
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--color-friendly);width:20px;text-align:right">${usVal}</span>
              <div style="flex:1;height:8px;background:var(--color-surface-offset);border-radius:4px;overflow:hidden">
                <div style="width:${usVal*10}%;height:100%;background:var(--color-friendly);border-radius:4px;transition:width 0.5s"></div>
              </div>
              <span style="font-size:9px;color:var(--color-friendly);font-family:var(--font-mono)">US</span>
            </div>
            <div style="flex:1;display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;color:var(--color-hostile);font-family:var(--font-mono)">IRN</span>
              <div style="flex:1;height:8px;background:var(--color-surface-offset);border-radius:4px;overflow:hidden">
                <div style="width:${iranVal*10}%;height:100%;background:var(--color-hostile);border-radius:4px;transition:width 0.5s"></div>
              </div>
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--color-hostile);width:20px">${iranVal}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    // DIME downgrade notes
    if (WW.DIME.notes) {
      html += '<div style="margin-top:12px;padding:8px 10px;background:rgba(255,59,59,0.06);border:1px solid rgba(255,59,59,0.15);border-radius:4px">';
      html += '<div style="font-size:9px;font-family:var(--font-mono);font-weight:700;color:var(--color-danger);margin-bottom:4px">US SCORE ADJUSTMENTS:</div>';
      Object.values(WW.DIME.notes).forEach(n => {
        html += `<div style="font-size:9px;color:var(--color-text-faint);line-height:1.4;margin-bottom:2px">&bull; ${n}</div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;
  },

  renderORBAT() {
    const container = document.getElementById('orbat-table');
    if (!container) return;
    let html = `
      <table class="orbat-table">
        <thead>
          <tr><th>Category</th><th style="color:var(--color-hostile)">Iran</th><th style="color:var(--color-hostile)">Iran Losses</th><th style="color:var(--color-friendly)">US/Coalition</th><th style="color:var(--color-friendly)">US Losses</th><th>Notes</th></tr>
        </thead>
        <tbody>
    `;
    WW.ORBAT.forEach(row => {
      html += `<tr>
        <td style="font-weight:500">${row.category}</td>
        <td class="orbat-col-iran">${row.iran}</td>
        <td style="color:var(--color-danger);font-size:10px">${row.iranLoss || ''}</td>
        <td class="orbat-col-us">${row.us}</td>
        <td style="color:var(--color-danger);font-size:10px">${row.usLoss || ''}</td>
        <td style="color:var(--color-text-muted);font-size:10px">${row.notes}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  },

  // ═══════════ INDICATORS ═══════════
  renderIndicators() {
    const container = document.getElementById('indicators-grid');
    if (!container) return;

    container.innerHTML = WW.INDICATORS.map(ind => {
      const statusColors = {
        danger: 'var(--color-danger)', warning: 'var(--color-warning)',
        success: 'var(--color-success)', primary: 'var(--color-primary)'
      };
      const dotColor = statusColors[ind.statusColor] || 'var(--color-text-muted)';

      let extra = '';
      if (ind.hasWidget && ind.name.includes('Oil')) {
        extra = `<div class="tv-widget-container" style="height:80px;margin-top:4px"><div id="tv-mini-oil" style="height:100%"></div></div>`;
      }
      if (ind.hasWidget && ind.name.includes('Defense')) {
        extra = `<div class="tv-widget-container" style="height:80px;margin-top:4px"><div id="tv-mini-defense" style="height:100%"></div></div>`;
      }
      if (ind.hasSeismic) {
        extra = `<div id="seismic-mini-list" style="margin-top:4px;font-size:10px;color:var(--color-text-muted)">Loading seismic data...</div>`;
      }

      return `
        <div class="indicator-card">
          <div class="indicator-header">
            <div class="indicator-icon">${ind.icon}</div>
            <div style="flex:1;min-width:0">
              <div class="indicator-name">${ind.name}</div>
              <div class="indicator-status">
                <span class="pulse-dot" style="color:${dotColor};width:6px;height:6px"></span>
                <span style="color:${dotColor};font-weight:600;font-size:10px">${ind.status}</span>
              </div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);line-height:1.4">${ind.desc}</div>
          ${extra}
          ${ind.link ? `<a href="${ind.link}" target="_blank" rel="noopener" class="indicator-link">Open ${ind.source} →</a>` : `<span style="font-size:10px;color:var(--color-text-faint)">Source: ${ind.source}</span>`}
        </div>
      `;
    }).join('');

    this.loadSeismicMini();
  },

  async loadSeismicMini() {
    const container = document.getElementById('seismic-mini-list');
    if (!container) return;
    try {
      const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
      const res = await fetch(url);
      const data = await res.json();
      const meFeatures = (data.features || []).filter(f => {
        const [lon, lat] = f.geometry.coordinates;
        return lat >= 20 && lat <= 42 && lon >= 40 && lon <= 68;
      }).slice(0, 5);
      if (meFeatures.length > 0) {
        container.innerHTML = meFeatures.map(f =>
          `<div style="padding:2px 0;border-bottom:1px solid var(--color-divider)">
            M${f.properties.mag?.toFixed(1)} — ${f.properties.place || 'Iran region'} · ${Utils.timeAgo(new Date(f.properties.time).toISOString())}
          </div>`
        ).join('');
      } else {
        container.textContent = 'No significant seismic events in period.';
      }
    } catch (e) {
      container.textContent = 'Failed to load seismic data.';
    }
  },

  renderQuickLinks() {
    const container = document.getElementById('quick-links');
    if (!container) return;
    container.innerHTML = WW.QUICK_LINKS.map(link =>
      `<a href="${link.url}" target="_blank" rel="noopener" class="quick-link">
        <span class="quick-link-icon">${link.icon}</span>
        <span>${link.name}</span>
      </a>`
    ).join('');
  },

  // ═══════════ MEDIA RENDERERS ═══════════
  renderIndependentJournalists() {
    const container = document.getElementById('independent-journalists');
    if (!container || !WW.YT_INDEPENDENT) return;
    container.innerHTML = WW.YT_INDEPENDENT.map(j => {
      const linkBtns = Object.entries(j.links || {}).map(([key, url]) => {
        const labels = { substack: 'Substack', x: 'X/Twitter', rumble: 'Rumble', site: 'Website' };
        return `<a href="${url}" target="_blank" rel="noopener" style="font-size:9px;padding:2px 6px;border:1px solid var(--color-divider);border-radius:3px;color:var(--color-text-muted);text-decoration:none;transition:border-color 0.2s" onmouseover="this.style.borderColor='var(--color-primary)'" onmouseout="this.style.borderColor='var(--color-divider)'">${labels[key] || key}</a>`;
      }).join('');
      return `
        <div class="indicator-card" style="border-left:2px solid var(--color-warning)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
            <a href="https://www.youtube.com/channel/${j.id}" target="_blank" rel="noopener" style="color:var(--color-text);text-decoration:none;font-weight:600;font-size:13px;font-family:var(--font-mono)" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text)'">${j.name}</a>
            <span style="font-size:9px;padding:1px 6px;background:var(--color-warning)18;color:var(--color-warning);border-radius:3px;font-family:var(--font-mono);font-weight:700;white-space:nowrap">${j.badge}</span>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);line-height:1.45;margin-bottom:8px">${j.desc}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <a href="https://www.youtube.com/channel/${j.id}" target="_blank" rel="noopener" style="font-size:9px;padding:2px 6px;border:1px solid var(--color-danger);border-radius:3px;color:var(--color-danger);text-decoration:none;font-weight:600">YouTube</a>
            ${linkBtns}
          </div>
        </div>
      `;
    }).join('');
  },

  renderOSINTAccounts() {
    const container = document.getElementById('osint-accounts');
    if (!container || !WW.OSINT_ACCOUNTS) return;
    container.innerHTML = WW.OSINT_ACCOUNTS.map(a => `
      <a href="${a.url}" target="_blank" rel="noopener" class="indicator-card" style="text-decoration:none;color:inherit;border-left:2px solid var(--color-primary)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-weight:600;font-size:13px;font-family:var(--font-mono);color:var(--color-primary)">${a.name}</div>
          <span style="font-size:9px;padding:1px 6px;background:var(--color-primary)18;color:var(--color-primary);border-radius:3px;font-family:var(--font-mono);font-weight:700">${a.badge}</span>
        </div>
        <div style="font-size:10px;color:var(--color-text-faint);margin-bottom:4px">${a.platform}</div>
        <div style="font-size:11px;color:var(--color-text-muted);line-height:1.45">${a.desc}</div>
      </a>
    `).join('');
  },

  renderKeyAnalysts() {
    const container = document.getElementById('key-analysts');
    if (!container || !WW.KEY_ANALYSTS) return;
    container.innerHTML = WW.KEY_ANALYSTS.map(a => `
      <div class="indicator-card">
        <div style="font-weight:700;font-size:12px;font-family:var(--font-mono);color:var(--color-text);margin-bottom:2px">${a.name}</div>
        <div style="font-size:9px;color:var(--color-warning);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${a.role}</div>
        <div style="font-size:10px;color:var(--color-text-faint);margin-bottom:4px">Appears on: ${a.freq}</div>
        <div style="font-size:11px;color:var(--color-text-muted);line-height:1.4">${a.value}</div>
      </div>
    `).join('');
  },

  // Media filter
  filterMedia(filter) {
    document.querySelectorAll('[data-media-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mediaFilter === filter);
    });
    document.querySelectorAll('.media-section').forEach(section => {
      if (filter === 'all') {
        section.style.display = '';
      } else {
        section.style.display = section.dataset.mediaSection === filter ? '' : 'none';
      }
    });
  },

  // ═══════════════════════════════
  // WAR TIMELINE TAB (NEW V3)
  // ═══════════════════════════════

  // Category color map
  _tlColors: {
    us_strike:   '#4fc3f7',  // blue
    iran_strike: '#ef5350',  // red
    diplomatic:  '#00d4ff',  // cyan
    economic:    '#ffaa00',  // amber
    proxy:       '#ff9100',  // orange
    cyber:       '#ce93d8',  // purple
    humanitarian:'#66bb6a',  // green
    intel:       '#90a4ae'   // steel-gray
  },

  // Category human labels
  _tlLabels: {
    us_strike:   'US STRIKE',
    iran_strike: 'IRAN STRIKE',
    diplomatic:  'DIPLOMATIC',
    economic:    'ECONOMIC',
    proxy:       'PROXY',
    cyber:       'CYBER',
    humanitarian:'HUMANIT.',
    intel:       'INTEL'
  },

  _tlCurrentCat: 'all',
  _tlSearchQuery: '',
  _tlFiltersReady: false,

  renderWarTimeline() {
    const container = document.getElementById('war-timeline-tab');
    if (!container) return;

    const data = (typeof WW !== 'undefined' && WW.WAR_TIMELINE) ? WW.WAR_TIMELINE : [];
    if (data.length === 0) {
      container.innerHTML = '<div class="feed-empty">No timeline data available. Ensure timeline-data.js is loaded.</div>';
      return;
    }

    // Sort chronologically
    const sorted = [...data].sort((a, b) => {
      const da = new Date(a.date + (a.time ? 'T' + a.time : 'T00:00:00Z'));
      const db = new Date(b.date + (b.time ? 'T' + b.time : 'T00:00:00Z'));
      return da - db;
    });

    this._tlAllEvents = sorted;
    this._tlCurrentCat = 'all';
    this._tlSearchQuery = '';
    this._renderFilteredTimeline();
    this._setupTimelineFilters();
  },

  _renderFilteredTimeline() {
    const container = document.getElementById('war-timeline-tab');
    const countEl = document.getElementById('timeline-count');
    if (!container || !this._tlAllEvents) return;

    const cat = this._tlCurrentCat;
    const q = this._tlSearchQuery.toLowerCase().trim();

    const filtered = this._tlAllEvents.filter(ev => {
      if (cat !== 'all' && ev.category !== cat) return false;
      if (q) {
        const hay = (ev.title + ' ' + ev.detail + ' ' + ev.category + ' ' + ev.source + ' ' + ev.date).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${this._tlAllEvents.length} events  ·  ${cat === 'all' ? 'All categories' : this._tlLabels[cat] || cat}${q ? ` · matching "${q}"` : ''}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = '<div class="feed-empty">No events match your filters.</div>';
      return;
    }

    const sigClass = { critical: 'wtl-sig-critical', high: 'wtl-sig-high', medium: 'wtl-sig-medium' };
    const colors = this._tlColors;
    const labels = this._tlLabels;

    let lastDate = null;
    let html = '';

    filtered.forEach(ev => {
      const color = colors[ev.category] || '#90a4ae';
      const catLabel = labels[ev.category] || ev.category.toUpperCase();
      const sig = (ev.significance || 'medium').toLowerCase();
      const sigBadgeClass = sigClass[sig] || 'wtl-sig-medium';
      const sigLabel = (ev.significance || 'MEDIUM').toUpperCase();

      // Day divider
      if (ev.date !== lastDate) {
        const d = new Date(ev.date + 'T12:00:00Z');
        const dayNum = Math.max(0, Math.round((d - new Date('2026-02-28T00:00:00Z')) / 86400000)) + 1;
        const dayLabel = ev.date === '2026-02-27' ? 'PRE-WAR · FEB 27' :
          `DAY ${dayNum} · ${d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'UTC' }).toUpperCase()}`;
        html += `<div class="wtl-day-divider">${dayLabel}</div>`;
        lastDate = ev.date;
      }

      html += `
        <div class="wtl-event" style="--wtl-color:${color}" data-cat="${ev.category || ''}">
          <div class="wtl-dot" style="background:${color}"></div>
          <div class="wtl-header">
            <span class="wtl-date">${ev.date}${ev.time ? '' : ''}</span>
            ${ev.time ? `<span class="wtl-time">${ev.time}</span>` : ''}
            <span class="wtl-sig-badge ${sigBadgeClass}">${sigLabel}</span>
            <span class="wtl-cat-badge" style="background:${color}">${catLabel}</span>
          </div>
          <div class="wtl-title">${ev.title || ''}</div>
          <div class="wtl-detail">${ev.detail || ''}</div>
          <div class="wtl-source">▸ ${ev.source || 'Multiple sources'}</div>
        </div>`;
    });

    container.innerHTML = html;
  },

  _setupTimelineFilters() {
    if (this._tlFiltersReady) return;

    // Category buttons
    document.querySelectorAll('.timeline-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._tlCurrentCat = btn.dataset.cat;
        document.querySelectorAll('.timeline-cat-btn').forEach(b => b.classList.toggle('active', b === btn));
        this._renderFilteredTimeline();
      });
    });

    // Search input
    const searchEl = document.getElementById('timeline-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        this._tlSearchQuery = searchEl.value;
        this._renderFilteredTimeline();
      });
    }

    this._tlFiltersReady = true;
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
