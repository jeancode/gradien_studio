// Main Application Coordinator for Gradient Studio
window.StudioApp = {
  activeView: 'gallery', // 'gallery' | 'studio'
  
  async init() {
    console.log('✨ Initializing Gradient Studio...');

    // 1. Setup Studio Canvas Renderer
    this.canvas = document.getElementById('studio-canvas');
    this.renderer = new GLRenderer(this.canvas);
    
    // FPS Counter
    this.fpsBadge = document.getElementById('badge-fps');
    this.renderer.onFpsUpdate = (fps) => {
      if (this.fpsBadge) this.fpsBadge.textContent = `${fps} FPS`;
    };

    // 2. Initialize default shader (Fluid Gradient)
    const initialEngine = window.SHADER_FLUID;
    this.renderer.loadEngine(initialEngine, initialEngine.defaultUniforms, PaletteEngine.presets[0].colors);

    // 3. Initialize UI Controls
    StudioControls.init(this.renderer, () => {
      // Callback on param changes
    });
    StudioControls.setColors(PaletteEngine.presets[0].colors);
    StudioControls.buildDynamicControls(initialEngine);

    // 4. Initialize Card Gallery
    await CardGallery.init((selectedPreset) => {
      this.loadPresetIntoStudio(selectedPreset);
      this.switchView('studio');
    });

    // 5. Setup Topbar & Modal Listeners
    this.setupViewNavigation();
    this.setupMediaControls();
    this.setupExportModal();
    this.setupShortcuts();

    // 6. Start Studio Main Animation Loop
    this.startLoop();
  },

  startLoop() {
    const loop = (timestamp) => {
      if (this.activeView === 'studio') {
        this.renderer.render(timestamp);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  switchView(viewName) {
    this.activeView = viewName;
    const viewGallery = document.getElementById('view-gallery');
    const viewStudio = document.getElementById('view-studio');
    const navGallery = document.getElementById('nav-btn-gallery');
    const navStudio = document.getElementById('nav-btn-studio');

    if (viewName === 'gallery') {
      viewGallery.classList.remove('hidden');
      viewStudio.classList.add('hidden');
      navGallery.classList.add('active');
      navStudio.classList.remove('active');
    } else {
      viewGallery.classList.add('hidden');
      viewStudio.classList.remove('hidden');
      navGallery.classList.remove('active');
      navStudio.classList.add('active');
      this.renderer.resize();
    }
  },

  setupViewNavigation() {
    const navGallery = document.getElementById('nav-btn-gallery');
    const navStudio = document.getElementById('nav-btn-studio');

    if (navGallery) navGallery.addEventListener('click', () => this.switchView('gallery'));
    if (navStudio) navStudio.addEventListener('click', () => this.switchView('studio'));
  },

  loadPresetIntoStudio(preset) {
    const shaderModule = CardGallery.getShaderModule(preset.engine);
    const selectEngine = document.getElementById('select-engine');
    if (selectEngine) selectEngine.value = preset.engine;

    this.renderer.loadEngine(shaderModule, preset.params, preset.params.colors);
    StudioControls.setColors(preset.params.colors);
    StudioControls.buildDynamicControls(shaderModule);

    // Update active preset title in topbar
    const titleEl = document.getElementById('active-preset-name');
    if (titleEl) titleEl.textContent = preset.name;
  },

  setupMediaControls() {
    // Play / Pause
    const btnPlay = document.getElementById('btn-play-pause');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.renderer.isPlaying = !this.renderer.isPlaying;
        btnPlay.innerHTML = this.renderer.isPlaying ? `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ` : `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
      });
    }

    // Fullscreen
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Resolution DPR
    const selDpr = document.getElementById('select-dpr');
    if (selDpr) {
      selDpr.addEventListener('change', (e) => {
        const factor = parseFloat(e.target.value);
        this.renderer.resize(factor);
      });
    }

    // Download PNG Snapshot
    const btnSnapshot = document.getElementById('btn-snapshot');
    if (btnSnapshot) {
      btnSnapshot.addEventListener('click', () => {
        const choice = prompt('Choose Snapshot Quality:\n1 = Standard Viewport\n2 = 1080p Full HD (1920x1080)\n3 = 4K Ultra HD (3840x2160)\n4 = Square (2048x2048)', '2');
        if (!choice) return;
        const map = { '1': 'viewport', '2': '1080p', '3': '4k', '4': 'square' };
        MediaRecorderStudio.downloadSnapshot(this.renderer, map[choice] || '1080p');
      });
    }

    // Record WebM Video
    const btnRecord = document.getElementById('btn-record-video');
    const recBadge = document.getElementById('rec-status-badge');
    if (btnRecord) {
      btnRecord.addEventListener('click', () => {
        btnRecord.disabled = true;
        if (recBadge) recBadge.classList.remove('hidden');

        MediaRecorderStudio.recordVideo(
          this.renderer,
          5, // 5 seconds clip
          (progress) => {
            if (recBadge) recBadge.textContent = `REC: ${progress}%`;
          },
          () => {
            btnRecord.disabled = false;
            if (recBadge) {
              recBadge.classList.add('hidden');
              recBadge.textContent = 'REC: 0%';
            }
          }
        );
      });
    }
  },

  setupExportModal() {
    const modal = document.getElementById('export-modal');
    const btnOpenModal = document.getElementById('btn-open-export');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const codeArea = document.getElementById('export-code-display');
    const btnCopy = document.getElementById('btn-copy-code');
    const btnDownloadHtml = document.getElementById('btn-download-html');
    const tabButtons = document.querySelectorAll('.export-tab-btn');

    let currentFormat = 'glsl';

    const refreshCode = () => {
      if (!codeArea) return;
      if (currentFormat === 'glsl') {
        codeArea.textContent = CodeExporter.generateGLSL(this.renderer);
      } else if (currentFormat === 'html') {
        codeArea.textContent = CodeExporter.generateStandaloneHTML(this.renderer);
      } else if (currentFormat === 'react') {
        codeArea.textContent = CodeExporter.generateReactComponent(this.renderer);
      } else if (currentFormat === 'css') {
        codeArea.textContent = CodeExporter.generateCSSFallback(this.renderer);
      }
    };

    if (btnOpenModal) {
      btnOpenModal.addEventListener('click', () => {
        refreshCode();
        modal.classList.remove('hidden');
      });
    }

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFormat = btn.getAttribute('data-format');
        refreshCode();
      });
    });

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeArea.textContent).then(() => {
          const originalText = btnCopy.textContent;
          btnCopy.textContent = '✓ Copied to Clipboard!';
          setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
        });
      });
    }

    if (btnDownloadHtml) {
      btnDownloadHtml.addEventListener('click', () => {
        const html = CodeExporter.generateStandaloneHTML(this.renderer);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gradient-${this.renderer.currentShaderId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  },

  openExportForPreset(preset) {
    this.loadPresetIntoStudio(preset);
    const btnOpenModal = document.getElementById('btn-open-export');
    if (btnOpenModal) btnOpenModal.click();
  },

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if inside an input or prompt
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const btnPlay = document.getElementById('btn-play-pause');
        if (btnPlay) btnPlay.click();
      } else if (e.key === 'r' || e.key === 'R') {
        const btnRand = document.getElementById('btn-randomize');
        if (btnRand) btnRand.click();
      } else if (e.key === 'e' || e.key === 'E') {
        const btnExport = document.getElementById('btn-open-export');
        if (btnExport) btnExport.click();
      } else if (e.key === 'g' || e.key === 'G') {
        this.switchView(this.activeView === 'gallery' ? 'studio' : 'gallery');
      } else if (e.key === 'f' || e.key === 'F') {
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) btnFullscreen.click();
      }
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.StudioApp.init();
});
