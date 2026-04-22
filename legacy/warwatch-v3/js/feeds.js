/* WarWatch V2 — RSS Feed Aggregation */

const Feeds = {
  allItems: [],
  currentFilter: 'all',
  mediaItems: [],
  independentMediaItems: [],
  podcastItems: [],

  // Fetch all news feeds
  async fetchAllNews() {
    const container = document.getElementById('intel-feed');
    if (!container) return;
    container.innerHTML = '<div class="feed-empty">⟳ Loading intelligence feeds...</div>';

    const cached = Utils.cacheGet('news-feeds');
    if (cached) {
      this.allItems = cached;
      this.renderNews();
      return;
    }

    const promises = WW.RSS_FEEDS.map(async (feed) => {
      const items = await Utils.fetchRSS(feed.url);
      return items.map(item => ({
        ...item,
        sourceName: feed.name,
        category: feed.category,
        badge: feed.badge
      }));
    });

    try {
      const results = await Promise.allSettled(promises);
      this.allItems = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 60);
      Utils.cacheSet('news-feeds', this.allItems, 600000);
      this.renderNews();
    } catch (e) {
      container.innerHTML = '<div class="feed-empty">⚠ Failed to load feeds. Try refreshing.</div>';
    }
  },

  renderNews() {
    const container = document.getElementById('intel-feed');
    if (!container) return;

    let items = this.allItems;
    if (this.currentFilter !== 'all') {
      items = items.filter(i => i.category === this.currentFilter);
    }

    if (items.length === 0) {
      container.innerHTML = '<div class="feed-empty">No items match current filter.</div>';
      return;
    }

    container.innerHTML = items.map(item => `
      <a href="${item.link}" target="_blank" rel="noopener" class="feed-card">
        <div class="feed-card-body">
          <div class="feed-card-headline">${Utils.stripHTML(item.title)}</div>
          <div class="feed-card-meta">
            <span class="feed-card-source">${item.sourceName}</span>
            <span class="badge badge-${item.badge}">${item.badge}</span>
            <span>${Utils.timeAgo(item.pubDate)}</span>
          </div>
        </div>
      </a>
    `).join('');
  },

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.intel-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderNews();
  },

  // YouTube feeds
  async fetchYouTube() {
    const container = document.getElementById('media-youtube');
    if (!container) return;
    container.innerHTML = '<div class="feed-empty">⟳ Loading video feeds...</div>';

    const cached = Utils.cacheGet('yt-feeds');
    if (cached) {
      this.mediaItems = cached;
      this.renderMedia();
      return;
    }

    const promises = WW.YT_CHANNELS.map(async (ch) => {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
      const items = await Utils.fetchRSS(feedUrl);
      return items.slice(0, 3).map(item => ({
        ...item,
        channelName: ch.name,
        videoId: Feeds.extractVideoId(item.link),
        thumb: item.thumbnail || item.enclosure?.link || `https://i.ytimg.com/vi/${Feeds.extractVideoId(item.link)}/mqdefault.jpg`
      }));
    });

    try {
      const results = await Promise.allSettled(promises);
      this.mediaItems = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 21);
      Utils.cacheSet('yt-feeds', this.mediaItems, 600000);
      this.renderMedia();
    } catch (e) {
      container.innerHTML = '<div class="feed-empty">⚠ Failed to load video feeds.</div>';
    }
  },

  extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : '';
  },

  renderMedia() {
    const container = document.getElementById('media-youtube');
    if (!container) return;

    if (this.mediaItems.length === 0) {
      container.innerHTML = '<div class="feed-empty">No videos available.</div>';
      return;
    }

    container.innerHTML = this.mediaItems.map(item => `
      <div class="media-card" onclick="Feeds.openVideo('${item.videoId}')">
        <div class="media-thumb">
          <img src="${item.thumb}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div class="media-play-icon">▶</div>
        </div>
        <div class="media-card-body">
          <div class="media-title">${Utils.stripHTML(item.title)}</div>
          <div class="media-meta">${item.channelName} · ${Utils.timeAgo(item.pubDate)}</div>
        </div>
      </div>
    `).join('');
  },

  openVideo(videoId) {
    if (!videoId) return;
    const modal = document.getElementById('video-modal');
    const frame = document.getElementById('video-frame');
    frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active');
  },

  closeVideo() {
    const modal = document.getElementById('video-modal');
    const frame = document.getElementById('video-frame');
    frame.src = '';
    modal.classList.remove('active');
  },

  // Independent YouTube feeds
  async fetchIndependentYouTube() {
    const container = document.getElementById('media-youtube-independent');
    if (!container || !WW.YT_INDEPENDENT) return;
    container.innerHTML = '<div class="feed-empty" style="grid-column:1/-1">⟳ Loading independent video feeds...</div>';

    const cached = Utils.cacheGet('yt-independent');
    if (cached) {
      this.independentMediaItems = cached;
      this.renderIndependentMedia();
      return;
    }

    const promises = WW.YT_INDEPENDENT.map(async (ch) => {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
      const items = await Utils.fetchRSS(feedUrl);
      return items.slice(0, 3).map(item => ({
        ...item,
        channelName: ch.name,
        badge: ch.badge,
        videoId: Feeds.extractVideoId(item.link),
        thumb: item.thumbnail || item.enclosure?.link || `https://i.ytimg.com/vi/${Feeds.extractVideoId(item.link)}/mqdefault.jpg`
      }));
    });

    try {
      const results = await Promise.allSettled(promises);
      this.independentMediaItems = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 18);
      Utils.cacheSet('yt-independent', this.independentMediaItems, 600000);
      this.renderIndependentMedia();
    } catch (e) {
      container.innerHTML = '<div class="feed-empty" style="grid-column:1/-1">⚠ Failed to load independent video feeds.</div>';
    }
  },

  renderIndependentMedia() {
    const container = document.getElementById('media-youtube-independent');
    if (!container) return;

    if (this.independentMediaItems.length === 0) {
      container.innerHTML = '<div class="feed-empty" style="grid-column:1/-1">No independent videos available.</div>';
      return;
    }

    container.innerHTML = this.independentMediaItems.map(item => `
      <div class="media-card" onclick="Feeds.openVideo('${item.videoId}')" style="border-left:2px solid var(--color-warning)">
        <div class="media-thumb">
          <img src="${item.thumb}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div class="media-play-icon">▶</div>
        </div>
        <div class="media-card-body">
          <div class="media-title">${Utils.stripHTML(item.title)}</div>
          <div class="media-meta">
            <span style="color:var(--color-warning)">${item.channelName}</span>
            <span style="font-size:9px;padding:0 4px;background:var(--color-warning)18;color:var(--color-warning);border-radius:2px">${item.badge}</span>
            · ${Utils.timeAgo(item.pubDate)}
          </div>
        </div>
      </div>
    `).join('');
  },

  // Podcast feeds
  async fetchPodcasts() {
    const container = document.getElementById('media-podcasts');
    if (!container) return;

    const cached = Utils.cacheGet('podcast-feeds');
    if (cached) {
      this.podcastItems = cached;
      this.renderPodcasts();
      return;
    }

    const promises = WW.PODCAST_FEEDS.map(async (feed) => {
      const items = await Utils.fetchRSS(feed.url);
      return items.slice(0, 3).map(item => ({
        ...item,
        podcastName: feed.name,
        podcastIcon: feed.icon
      }));
    });

    try {
      const results = await Promise.allSettled(promises);
      this.podcastItems = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 8);
      Utils.cacheSet('podcast-feeds', this.podcastItems, 600000);
      this.renderPodcasts();
    } catch (e) {
      container.innerHTML = '<div class="feed-empty">⚠ Failed to load podcasts.</div>';
    }
  },

  renderPodcasts() {
    const container = document.getElementById('media-podcasts');
    if (!container) return;

    if (this.podcastItems.length === 0) {
      container.innerHTML = '<div class="feed-empty">No podcast episodes available.</div>';
      return;
    }

    container.innerHTML = this.podcastItems.map(item => `
      <a href="${item.link}" target="_blank" rel="noopener" class="podcast-card">
        <div class="podcast-icon">${item.podcastIcon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${Utils.stripHTML(item.title)}
          </div>
          <div style="font-size:10px;color:var(--color-text-muted)">${item.podcastName} · ${Utils.timeAgo(item.pubDate)}</div>
        </div>
      </a>
    `).join('');
  }
};

window.Feeds = Feeds;
