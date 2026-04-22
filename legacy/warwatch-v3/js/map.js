/* WarWatch V3 — MapLibre Map Module */

const MapModule = {
  map: null,
  layers: {},

  init() {
    this.map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com">CARTO</a>'
          }
        },
        layers: [{
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19
        }]
      },
      center: [53, 32],
      zoom: 4.5,
      minZoom: 2,
      maxZoom: 16
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.addHormuzLayer();
      this.addPointLayers();
      this.addAttackBubbles();
      this.addUSGSLayer();
      this.setupLayerToggles();
    });
  },

  addHormuzLayer() {
    this.map.addSource('hormuz', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [WW.HORMUZ_POLYGON]
        },
        properties: { name: 'Strait of Hormuz' }
      }
    });
    this.map.addLayer({
      id: 'hormuz-fill',
      type: 'fill',
      source: 'hormuz',
      paint: { 'fill-color': '#ff9100', 'fill-opacity': 0.12 }
    });
    this.map.addLayer({
      id: 'hormuz-line',
      type: 'line',
      source: 'hormuz',
      paint: { 'line-color': '#ff9100', 'line-width': 2, 'line-dasharray': [4, 2] }
    });
    this.layers['hormuz'] = ['hormuz-fill', 'hormuz-line'];
  },

  addPointLayers() {
    // Nuclear sites
    WW.NUCLEAR_SITES.forEach((site, i) => {
      const el = document.createElement('div');
      el.className = 'map-marker marker-nuclear';
      el.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#ffd600;border:2px solid rgba(255,214,0,0.5);box-shadow:0 0 8px rgba(255,214,0,0.5);cursor:pointer;';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lon, site.lat])
        .setPopup(new maplibregl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(
          `<div class="popup-title" style="color:#ffd600">☢ ${site.name}</div>
           <div class="popup-coords">${site.lat.toFixed(4)}°N, ${site.lon.toFixed(4)}°E</div>
           <div class="popup-desc">${site.desc}</div>
           <div style="margin-top:4px;font-size:10px;font-weight:600"><span style="color:${site.status==='INTACT'?'#00e676':(site.status==='DAMAGED'||site.status==='STATUS UNCLEAR'||site.status==='NEAR-MISS')?'#ffaa00':'#ff3b3b'}">● ${site.status}</span></div>`
        ))
        .addTo(this.map);
      if (!this.layers['nuclear']) this.layers['nuclear'] = [];
      this.layers['nuclear'].push(marker);
    });

    // Iran bases
    WW.IRAN_BASES.forEach((base, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#ef5350;border:2px solid rgba(239,83,80,0.4);box-shadow:0 0 6px rgba(239,83,80,0.4);cursor:pointer;';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([base.lon, base.lat])
        .setPopup(new maplibregl.Popup({ offset: 12, maxWidth: '260px' }).setHTML(
          `<div class="popup-title" style="color:#ef5350">✦ ${base.name}</div>
           <div class="popup-coords">${base.lat.toFixed(4)}°N, ${base.lon.toFixed(4)}°E · ${base.icao}</div>
           <div class="popup-desc">${base.desc}</div>`
        ))
        .addTo(this.map);
      if (!this.layers['iran-bases']) this.layers['iran-bases'] = [];
      this.layers['iran-bases'].push(marker);
    });

    // US bases
    WW.US_BASES.forEach((base, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#4fc3f7;border:2px solid rgba(79,195,247,0.4);box-shadow:0 0 6px rgba(79,195,247,0.4);cursor:pointer;';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([base.lon, base.lat])
        .setPopup(new maplibregl.Popup({ offset: 12, maxWidth: '260px' }).setHTML(
          `<div class="popup-title" style="color:#4fc3f7">★ ${base.name}</div>
           <div class="popup-coords">${base.lat.toFixed(4)}°N, ${base.lon.toFixed(4)}°E · ${base.country}</div>
           <div class="popup-desc">${base.desc}</div>`
        ))
        .addTo(this.map);
      if (!this.layers['us-bases']) this.layers['us-bases'] = [];
      this.layers['us-bases'].push(marker);
    });

    // Oil infrastructure
    WW.OIL_INFRA.forEach((site, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:12px;height:12px;border-radius:2px;background:#ff9100;border:2px solid rgba(255,145,0,0.4);box-shadow:0 0 6px rgba(255,145,0,0.3);cursor:pointer;';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lon, site.lat])
        .setPopup(new maplibregl.Popup({ offset: 12, maxWidth: '260px' }).setHTML(
          `<div class="popup-title" style="color:#ff9100">⛽ ${site.name}</div>
           <div class="popup-coords">${site.lat.toFixed(4)}°N, ${site.lon.toFixed(4)}°E · ${site.type}</div>
           <div class="popup-desc">${site.desc}</div>
           ${site.status ? `<div style="margin-top:4px;font-size:10px;color:#ffaa00">${site.status}</div>` : ''}`
        ))
        .addTo(this.map);
      if (!this.layers['oil']) this.layers['oil'] = [];
      this.layers['oil'].push(marker);
    });
  },

  addAttackBubbles() {
    if (!WW.COUNTRY_ATTACKS) return;
    WW.COUNTRY_ATTACKS.forEach(c => {
      const size = Math.max(16, Math.min(50, Math.sqrt(c.totalMunitions) * 1.2));
      const el = document.createElement('div');
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:rgba(224,64,251,0.25);border:2px solid rgba(224,64,251,0.7);box-shadow:0 0 12px rgba(224,64,251,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${size > 30 ? 10 : 8}px;color:#e040fb;font-weight:700;`;
      el.textContent = c.totalMunitions > 999 ? (c.totalMunitions / 1000).toFixed(1) + 'K' : c.totalMunitions;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.lon, c.lat])
        .setPopup(new maplibregl.Popup({ offset: 15, maxWidth: '300px' }).setHTML(
          `<div class="popup-title" style="color:#e040fb">${c.flag} ${c.country} — Iranian Attacks</div>
           <div class="popup-desc" style="margin-top:4px">
             <div>Ballistic: <strong>${c.ballistic}</strong> · Cruise: <strong>${c.cruise}</strong> · Drones: <strong>${c.drones.toLocaleString()}</strong></div>
             <div style="margin-top:4px;color:#ff3b3b">Killed: ${c.killed} · Wounded: ${c.wounded.toLocaleString()}</div>
             <div style="margin-top:4px;font-size:10px">${c.keyTargets}</div>
             ${c.patriotDepleted !== null ? `<div style="margin-top:4px;color:#ffaa00">Patriot ${c.patriotDepleted}% depleted</div>` : ''}
           </div>`
        ))
        .addTo(this.map);
      if (!this.layers['attacks']) this.layers['attacks'] = [];
      this.layers['attacks'].push(marker);
    });
  },

  async addUSGSLayer() {
    try {
      const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        // Filter to Iran/ME bounding box: lat 20-42, lon 40-68
        const meFeatures = data.features.filter(f => {
          const [lon, lat] = f.geometry.coordinates;
          return lat >= 20 && lat <= 42 && lon >= 40 && lon <= 68;
        });
        meFeatures.slice(0, 30).forEach(f => {
          const [lon, lat] = f.geometry.coordinates;
          const mag = f.properties.mag || 3;
          const size = Math.max(8, mag * 4);
          const el = document.createElement('div');
          el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,59,59,0.5);border:1px solid rgba(255,59,59,0.8);cursor:pointer;`;
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .setPopup(new maplibregl.Popup({ offset: 10, maxWidth: '240px' }).setHTML(
              `<div class="popup-title" style="color:#ff3b3b">🔴 M${mag.toFixed(1)} Seismic</div>
               <div class="popup-desc">${f.properties.place || 'Iran region'}</div>
               <div style="font-size:10px;color:var(--color-text-faint);margin-top:2px">${new Date(f.properties.time).toISOString()}</div>`
            ))
            .addTo(this.map);
          if (!this.layers['seismic']) this.layers['seismic'] = [];
          this.layers['seismic'].push(marker);
        });
      }
    } catch (e) {
      console.warn('USGS fetch failed:', e);
    }
  },

  setupLayerToggles() {
    document.querySelectorAll('.layer-toggle input').forEach(input => {
      input.addEventListener('change', () => {
        const layerKey = input.dataset.layer;
        const visible = input.checked;
        const items = this.layers[layerKey];
        if (!items) return;

        items.forEach(item => {
          if (item instanceof maplibregl.Marker) {
            item.getElement().style.display = visible ? '' : 'none';
          } else {
            // it's a layer id string
            this.map.setLayoutProperty(item, 'visibility', visible ? 'visible' : 'none');
          }
        });
      });
    });
  },

  toggleLayer(layerKey, visible) {
    const items = this.layers[layerKey];
    if (!items) return;
    items.forEach(item => {
      if (item instanceof maplibregl.Marker) {
        item.getElement().style.display = visible ? '' : 'none';
      } else {
        this.map.setLayoutProperty(item, 'visibility', visible ? 'visible' : 'none');
      }
    });
  }
};

window.MapModule = MapModule;
