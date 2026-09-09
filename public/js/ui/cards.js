// Card Gallery UI & thumbnail rendering system
window.CardGallery = {
  presets: [],
  activeFilter: 'all',
  searchQuery: '',
  cardItems: [],
  sharedRenderer: null,
  sharedCanvas: null,
  loopStarted: false,

  async init(onSelectPreset) {
    this.onSelectPreset = onSelectPreset;
    this.container = document.getElementById('cards-grid');
    this.filterContainer = document.getElementById('cards-filters');
    this.searchInput = document.getElementById('cards-search');

    this.initSharedRenderer();
    await this.fetchPresets();
    this.setupFilters();
    this.renderCards();

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCards();
      });
    }
  },

  initSharedRenderer() {
    if (this.sharedRenderer) return;
    try {
      this.sharedCanvas = document.createElement('canvas');
      this.sharedCanvas.width = 300;
      this.sharedCanvas.height = 180;
      this.sharedRenderer = new GLRenderer(this.sharedCanvas, { noEvents: true });
      this.sharedRenderer.dpr = 1.0;
    } catch (err) {
      console.error('Failed to initialize shared gallery WebGL renderer:', err);
    }
  },

  async fetchPresets() {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        this.presets = await res.json();
      }
    } catch (err) {
      console.warn('Could not fetch presets from API, using defaults:', err);
    }
  },

  setupFilters() {
    const filters = [
      { id: 'all', label: 'All Shaders (18)' },
      { id: 'galaxy', label: 'Galaxias Cósmicas' },
      { id: 'realsmoke', label: 'Humo Real Flotando' },
      { id: 'fire', label: 'Fuego & Plasma' },
      { id: 'clouds', label: 'Nubes Celestes' },
      { id: 'starfield', label: 'Estrellas & Warp' },
      { id: 'tunnel', label: 'Túneles Ciberespacio' },
      { id: 'caustics', label: 'Agua & Cáusticas' },
      { id: 'smoke', label: 'Humo Denso (Smoke)' },
      { id: 'blur', label: 'Super Blur Velvet' },
      { id: 'waves', label: 'Ondas & Interferencia' },
      { id: 'fluid', label: 'Fluid & Swirls (Remolinos)' },
      { id: 'iridescent', label: 'Cromo & Iridiscencia' },
      { id: 'neonmist', label: 'Niebla Neón' },
      { id: 'warp', label: 'Domain Warping' },
      { id: 'noise', label: 'Procedural Noise' },
      { id: 'mesh', label: 'Liquid Mesh' },
      { id: 'atmosphere', label: 'Atmosphere & Rays' },
      { id: 'aurora', label: 'Bokeh & Aurora' }
    ];

    if (!this.filterContainer) return;
    this.filterContainer.innerHTML = '';

    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${this.activeFilter === f.id ? 'active' : ''}`;
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        this.activeFilter = f.id;
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCards();
      });
      this.filterContainer.appendChild(btn);
    });
  },

  getShaderModule(engineId) {
    switch (engineId) {
      case 'fluid': return window.SHADER_FLUID;
      case 'warp': return window.SHADER_WARP;
      case 'noise': return window.SHADER_NOISE;
      case 'mesh': return window.SHADER_MESH;
      case 'atmosphere': return window.SHADER_ATMOSPHERE;
      case 'aurora': return window.SHADER_AURORA;
      case 'caustics': return window.SHADER_CAUSTICS;
      case 'smoke': return window.SHADER_SMOKE;
      case 'blur': return window.SHADER_BLUR;
      case 'waves': return window.SHADER_WAVES;
      case 'iridescent': return window.SHADER_IRIDESCENT;
      case 'neonmist': return window.SHADER_NEONMIST;
      case 'galaxy': return window.SHADER_GALAXY;
      case 'realsmoke': return window.SHADER_REALSMOKE;
      case 'fire': return window.SHADER_FIRE;
      case 'clouds': return window.SHADER_CLOUDS;
      case 'starfield': return window.SHADER_STARFIELD;
      case 'tunnel': return window.SHADER_TUNNEL;
      default: return window.SHADER_FLUID;
    }
  },

  renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.cardItems = [];

    const filtered = this.presets.filter(p => {
      const matchFilter = this.activeFilter === 'all' || p.engine === this.activeFilter;
      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>No presets found matching your filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';

      // Swatches HTML
      const swatchesHtml = preset.params.colors.map(c => 
        `<span class="palette-dot" style="background-color: ${c}" title="${c}"></span>`
      ).join('');

      card.innerHTML = `
        <div class="card-preview">
          <canvas class="card-canvas"></canvas>
          <div class="card-overlay">
            <button class="btn-card-action btn-open-studio" title="Open in Studio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Edit in Studio
            </button>
            <button class="btn-card-action btn-quick-export" title="Export Code">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              Export
            </button>
          </div>
          <span class="card-category-badge">${preset.category || preset.engine}</span>
        </div>
        <div class="card-info">
          <div class="card-header-row">
            <h3 class="card-title">${preset.name}</h3>
            <div class="card-swatches">${swatchesHtml}</div>
          </div>
          <p class="card-desc">${preset.description}</p>
        </div>
      `;

      // Event listeners
      const btnOpen = card.querySelector('.btn-open-studio');
      btnOpen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onSelectPreset) this.onSelectPreset(preset);
      });

      const btnExport = card.querySelector('.btn-quick-export');
      btnExport.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.StudioApp) {
          window.StudioApp.openExportForPreset(preset);
        }
      });

      card.addEventListener('click', () => {
        if (this.onSelectPreset) this.onSelectPreset(preset);
      });

      this.container.appendChild(card);

      // Setup 2D Canvas Thumbnail backed by shared WebGL renderer
      const canvas = card.querySelector('.card-canvas');
      canvas.width = 300;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      const shaderModule = this.getShaderModule(preset.engine);

      const cardItem = {
        cardEl: card,
        canvas: canvas,
        ctx: ctx,
        preset: preset,
        shaderModule: shaderModule,
        isHovered: false,
        hoverPos: { x: 150, y: 90, isPressed: 0 },
        lastDrawTime: 0
      };

      const previewEl = card.querySelector('.card-preview');
      previewEl.addEventListener('mouseenter', () => {
        cardItem.isHovered = true;
      });
      previewEl.addEventListener('mouseleave', () => {
        cardItem.isHovered = false;
        cardItem.hoverPos.isPressed = 0;
      });
      previewEl.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        cardItem.hoverPos.x = (e.clientX - rect.left) * (300 / rect.width);
        cardItem.hoverPos.y = (rect.height - (e.clientY - rect.top)) * (180 / rect.height);
      });
      previewEl.addEventListener('mousedown', () => {
        cardItem.hoverPos.isPressed = 1.0;
      });
      window.addEventListener('mouseup', () => {
        cardItem.hoverPos.isPressed = 0.0;
      });

      this.cardItems.push(cardItem);
    });

    // Start single shared thumbnail loop if not already running
    if (!this.loopStarted) {
      this.loopStarted = true;
      this.animateThumbnails();
    }
  },

  animateThumbnails() {
    const renderLoop = (timestamp) => {
      requestAnimationFrame(renderLoop);

      // Pause card thumbnail loop completely when Studio view is active
      if (window.StudioApp && window.StudioApp.activeView !== 'gallery') {
        return;
      }

      if (!this.sharedRenderer || this.cardItems.length === 0) return;

      const windowHeight = window.innerHeight;
      const timeInSec = timestamp * 0.001;

      for (let i = 0; i < this.cardItems.length; i++) {
        const item = this.cardItems[i];
        const rect = item.canvas.getBoundingClientRect();
        const isVisible = rect.top < windowHeight + 100 && rect.bottom > -100;

        if (!isVisible) continue;

        // If hovered, render every frame (60fps) with full interactive mouse control
        // If not hovered, render smoothly at ~25fps to conserve GPU
        const timeSinceLast = timestamp - item.lastDrawTime;
        if (!item.isHovered && timeSinceLast < 40) {
          continue;
        }

        item.lastDrawTime = timestamp;

        try {
          this.sharedRenderer.loadEngine(item.shaderModule, item.preset.params, item.preset.params.colors);

          if (item.isHovered) {
            this.sharedRenderer.mouse.x = item.hoverPos.x;
            this.sharedRenderer.mouse.y = item.hoverPos.y;
            this.sharedRenderer.mouse.isPressed = item.hoverPos.isPressed;
            this.sharedRenderer.mouse.isHovered = 1.0;
            const activeHover = (window.StudioControls && window.StudioControls.renderer) ? window.StudioControls.renderer.hoverMode : 0;
            this.sharedRenderer.hoverMode = activeHover;
            this.sharedRenderer.hoverStrength = activeHover >= 0 ? 1.2 : 0.0;
          } else {
            // Natural gentle ambient oscillation
            this.sharedRenderer.mouse.x = 150 + Math.sin(timeInSec * 1.3 + i * 0.7) * 35;
            this.sharedRenderer.mouse.y = 90 + Math.cos(timeInSec * 0.9 + i * 0.5) * 25;
            this.sharedRenderer.mouse.isPressed = 0.0;
            this.sharedRenderer.mouse.isHovered = 0.5;
          }

          this.sharedRenderer.render(timestamp);
          item.ctx.drawImage(this.sharedCanvas, 0, 0, item.canvas.width, item.canvas.height);
        } catch (err) {
          if (!item._loggedError) {
            console.warn(`Card render error for ${item.preset.name}:`, err);
            item._loggedError = true;
          }
        }
      }
    };
    requestAnimationFrame(renderLoop);
  }
};
