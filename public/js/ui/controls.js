// Studio Controls Manager (sliders, palettes, engines, presets, mouse interactions)
window.StudioControls = {
  init(renderer, onParamChange) {
    this.renderer = renderer;
    this.onParamChange = onParamChange;

    this.engineSelect = document.getElementById('select-engine');
    this.controlsContainer = document.getElementById('dynamic-controls');
    this.paletteSelect = document.getElementById('select-palette');
    this.interactionSelect = document.getElementById('select-interaction');
    this.btnDropCenter = document.getElementById('btn-drop-center');
    this.hoverSelect = document.getElementById('select-hover-mode');
    this.hoverStrengthSlider = document.getElementById('slider-hover-strength');
    this.hoverStrengthVal = document.getElementById('val-hover-strength');
    this.hoverRadiusSlider = document.getElementById('slider-hover-radius');
    this.hoverRadiusVal = document.getElementById('val-hover-radius');

    this.colorPickers = [
      document.getElementById('col-1'),
      document.getElementById('col-2'),
      document.getElementById('col-3'),
      document.getElementById('col-4'),
      document.getElementById('col-5')
    ];
    this.btnRandomize = document.getElementById('btn-randomize');
    this.btnSavePreset = document.getElementById('btn-save-preset');

    this.populatePaletteDropdown();
    this.setupEventListeners();
  },

  populatePaletteDropdown() {
    if (!this.paletteSelect) return;
    this.paletteSelect.innerHTML = '<option value="" disabled selected>Choose Palette Preset</option>';
    PaletteEngine.presets.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = p.name;
      this.paletteSelect.appendChild(opt);
    });
  },

  setupEventListeners() {
    // Engine switcher
    if (this.engineSelect) {
      this.engineSelect.addEventListener('change', (e) => {
        const engineId = e.target.value;
        const mod = CardGallery.getShaderModule(engineId);
        this.renderer.loadEngine(mod, {}, this.getCurrentColors());
        this.buildDynamicControls(mod);
        if (this.onParamChange) this.onParamChange();
      });
    }

    // Interaction Mode switcher (Remolinos, Gota de agua, Golpecitos, Expansión de gota, Atractor, Lluvia)
    if (this.interactionSelect) {
      this.interactionSelect.addEventListener('change', (e) => {
        const mode = parseInt(e.target.value, 10);
        this.renderer.interactionMode = mode;
        this.updateHintPill(mode);
        if (this.onParamChange) this.onParamChange();
      });
    }

    // Drop center action
    if (this.btnDropCenter) {
      this.btnDropCenter.addEventListener('click', () => {
        this.renderer.addRipple(this.renderer.canvas.width / 2, this.renderer.canvas.height / 2, 1.2);
      });
    }

    // Hover Mode switcher (0: Swirl, 1: Ripples, 2: Spotlight, 3: Lens, 4: Wind, 5: Prism, 6: Stardust, 7: Shockwave)
    if (this.hoverSelect) {
      this.hoverSelect.addEventListener('change', (e) => {
        const mode = parseInt(e.target.value, 10);
        this.renderer.hoverMode = mode;
        this.updateHoverHintPill(mode);
        if (this.onParamChange) this.onParamChange();
      });
    }

    // Hover Strength slider
    if (this.hoverStrengthSlider) {
      this.hoverStrengthSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.renderer.hoverStrength = val;
        if (this.hoverStrengthVal) this.hoverStrengthVal.textContent = val.toFixed(2);
        if (this.onParamChange) this.onParamChange();
      });
    }

    // Hover Radius slider
    if (this.hoverRadiusSlider) {
      this.hoverRadiusSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.renderer.hoverRadius = val;
        if (this.hoverRadiusVal) this.hoverRadiusVal.textContent = val.toFixed(2);
        if (this.onParamChange) this.onParamChange();
      });
    }

    // Palette preset switcher
    if (this.paletteSelect) {
      this.paletteSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && PaletteEngine.presets[idx]) {
          this.setColors(PaletteEngine.presets[idx].colors);
        }
      });
    }

    // Individual color inputs
    this.colorPickers.forEach((picker) => {
      if (!picker) return;
      picker.addEventListener('input', () => {
        this.syncColorsToRenderer();
      });
    });

    // Randomize palette button
    if (this.btnRandomize) {
      this.btnRandomize.addEventListener('click', () => {
        const randomScheme = PaletteEngine.generateRandomPalette();
        this.setColors(randomScheme);
      });
    }

    // Save custom preset
    if (this.btnSavePreset) {
      this.btnSavePreset.addEventListener('click', () => {
        this.openSaveModal();
      });
    }
  },

  updateHintPill(mode) {
    const hintEl = document.getElementById('canvas-hint-text');
    if (!hintEl) return;
    switch (mode) {
      case 1:
        hintEl.innerHTML = '💧 Haz <span>clic o toca</span> para soltar gotas de agua con ondas físicas concéntricas • Arrastra para senderos de gotas';
        break;
      case 2:
        hintEl.innerHTML = '💥 Haz <span>clic</span> para dar <span>golpecitos elásticos</span> a la superficie líquida';
        break;
      case 3:
        hintEl.innerHTML = '🌊 Haz <span>clic</span> para ver la <span>expansión de gota</span> en anillos de choque con refracción';
        break;
      case 0:
        hintEl.innerHTML = '🌀 Arrastra el cursor para generar <span>remolinos y vórtices</span> de fluido viscoso';
        break;
      case 4:
        hintEl.innerHTML = '🧲 Mueve el cursor para <span>atraer y succionar</span> la materia del gradiente';
        break;
      case 5:
        hintEl.innerHTML = '🌧️ <span>Lluvia continua activa</span>: gotas cayendo automáticamente con ondas cruzadas';
        break;
      case -1:
        hintEl.innerHTML = '🚫 <span>Interacción de clic desactivada:</span> El lienzo solo mostrará la animación pura sin respuesta a los clics';
        break;
      default:
        hintEl.innerHTML = 'Interactúa con el mouse o toques táctiles sobre el gradiente';
    }
  },

  updateHoverHintPill(mode) {
    const hintEl = document.getElementById('canvas-hint-text');
    if (!hintEl) return;
    if (mode === -1) {
      hintEl.innerHTML = '🚫 <span>Hover desactivado:</span> El cursor no perturbará el gradiente al flotar por la pantalla';
      return;
    }
    const hints = [
      '🌀 <span>Hover Vórtice:</span> Pasa el cursor para crear remolinos y torbellinos líquidos fluidos que giran a tu paso',
      '💧 <span>Hover Ondas:</span> Pasa el cursor suavemente para generar estelas de ondas concéntricas armónicas en el agua',
      '💡 <span>Hover Linterna:</span> Pasa el cursor para proyectar un haz de luz volumétrico que ilumina las capas ocultas',
      '🧲 <span>Hover Lente Gravitacional:</span> El cursor curva el espacio-tiempo y deforma el gradiente magnéticamente hacia ti',
      '🌬️ <span>Hover Viento / Soplador:</span> La velocidad de tu cursor empuja y deflexiona el humo, fluidos y llamas como una corriente de aire',
      '🌈 <span>Hover Prisma:</span> Genera aberración cromática holográfica y franjas de interferencia arcoíris alrededor del puntero',
      '✨ <span>Hover Polvo Cósmico:</span> Deja un rastro de estrellas titilantes y chispas de polvo cósmico a su paso',
      '💥 <span>Hover Ondas de Choque:</span> Emite pulsos continuos de ondas de choque a alta velocidad que viajan por el lienzo'
    ];
    if (hints[mode]) {
      hintEl.innerHTML = hints[mode];
    }
  },

  setColors(colors) {
    colors.forEach((hex, i) => {
      if (this.colorPickers[i]) {
        this.colorPickers[i].value = hex;
        const swatch = this.colorPickers[i].parentElement.querySelector('.swatch-color');
        if (swatch) swatch.style.backgroundColor = hex;
      }
    });
    this.syncColorsToRenderer();
  },

  getCurrentColors() {
    return this.colorPickers.map(p => p ? p.value : '#ffffff');
  },

  syncColorsToRenderer() {
    const colors = this.getCurrentColors();
    this.renderer.setColors(colors);
    this.colorPickers.forEach(p => {
      if (p && p.parentElement) {
        const preview = p.parentElement.querySelector('.color-preview-badge');
        if (preview) preview.style.backgroundColor = p.value;
      }
    });
    if (this.onParamChange) this.onParamChange();
  },

  // Build reactive sliders matching the current engine's uniforms
  buildDynamicControls(shaderModule) {
    if (!this.controlsContainer) return;
    this.controlsContainer.innerHTML = '';

    // Group 1: Mouse Physical Wave Controls (Gota de agua, golpecitos, expansión)
    const rippleGroup = document.createElement('div');
    rippleGroup.className = 'control-group';
    rippleGroup.innerHTML = `<h4 class="group-title">Física de Gotas & Ondas (Mouse)</h4>`;

    const rippleSliders = [
      {
        id: 'hover_strength',
        label: 'Sensibilidad al Hover (Cursor)',
        min: 0.0,
        max: 2.5,
        step: 0.1,
        getVal: () => this.renderer.hoverStrength,
        setVal: (v) => { this.renderer.hoverStrength = v; }
      },
      {
        id: 'ripple_speed',
        label: 'Velocidad de Propagación',
        min: 0.5,
        max: 3.0,
        step: 0.1,
        getVal: () => this.renderer.rippleSpeed,
        setVal: (v) => { this.renderer.rippleSpeed = v; }
      },
      {
        id: 'ripple_freq',
        label: 'Frecuencia / Densidad Ondas',
        min: 15.0,
        max: 70.0,
        step: 1.0,
        getVal: () => this.renderer.rippleFreq,
        setVal: (v) => { this.renderer.rippleFreq = v; }
      },
      {
        id: 'ripple_decay',
        label: 'Amortiguación / Decaimiento',
        min: 0.8,
        max: 4.5,
        step: 0.1,
        getVal: () => this.renderer.rippleDecay,
        setVal: (v) => { this.renderer.rippleDecay = v; }
      }
    ];

    rippleSliders.forEach(s => {
      const row = document.createElement('div');
      row.className = 'slider-row';
      row.innerHTML = `
        <div class="slider-header">
          <span class="slider-label">${s.label}</span>
          <span class="slider-value" id="val-${s.id}">${Number(s.getVal()).toFixed(1)}</span>
        </div>
        <input type="range" class="studio-range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.getVal()}">
      `;
      const input = row.querySelector('input');
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        s.setVal(val);
        row.querySelector(`#val-${s.id}`).textContent = val.toFixed(1);
        if (this.onParamChange) this.onParamChange();
      });
      rippleGroup.appendChild(row);
    });
    this.controlsContainer.appendChild(rippleGroup);

    // Group 2: Dynamics & Flow (Engine Specific)
    const dynamicsGroup = document.createElement('div');
    dynamicsGroup.className = 'control-group';
    dynamicsGroup.innerHTML = `<h4 class="group-title">${shaderModule.name}</h4>`;

    const engineSliders = this.getSliderDefinitions(shaderModule.id);
    engineSliders.forEach(s => {
      const row = this.createSliderRow(s, this.renderer.currentUniforms[s.id] ?? s.default);
      dynamicsGroup.appendChild(row);
    });
    this.controlsContainer.appendChild(dynamicsGroup);

    // Group 3: Optical & Tone (Common)
    const opticalGroup = document.createElement('div');
    opticalGroup.className = 'control-group';
    opticalGroup.innerHTML = `<h4 class="group-title">Óptica & Desenfoque (Post-FX)</h4>`;

    const commonSliders = [
      { id: 'speed', label: 'Flow Speed', min: 0.0, max: 3.0, step: 0.05, default: 0.8 },
      { id: 'scale', label: 'Zoom / Frequency', min: 0.5, max: 5.0, step: 0.1, default: 1.5 },
      { id: 'blur', label: 'Gaussian Softness / Blur', min: 0.0, max: 4.0, step: 0.1, default: 1.0 },
      { id: 'brightness', label: 'Brightness', min: 0.5, max: 2.0, step: 0.05, default: 1.1 },
      { id: 'contrast', label: 'Contrast', min: 0.5, max: 2.5, step: 0.05, default: 1.25 },
      { id: 'grain', label: 'Film Grain (Anti-Banding)', min: 0.0, max: 0.1, step: 0.005, default: 0.035 }
    ];

    commonSliders.forEach(s => {
      const row = this.createSliderRow(s, this.renderer.currentUniforms[s.id] ?? s.default);
      opticalGroup.appendChild(row);
    });
    this.controlsContainer.appendChild(opticalGroup);
  },

  getSliderDefinitions(engineId) {
    switch (engineId) {
      case 'fluid':
        return [
          { id: 'swirl', label: 'Swirl Strength (Remolinos)', min: 0.2, max: 5.0, step: 0.1, default: 2.2 },
          { id: 'decay', label: 'Vorticity Dissipation', min: 0.8, max: 0.99, step: 0.01, default: 0.95 },
          { id: 'iterations', label: 'Advection Octaves', min: 1.0, max: 5.0, step: 1.0, default: 4.0 }
        ];
      case 'warp':
        return [
          { id: 'warp1', label: 'Primary Warp Fold (Alpha)', min: 0.2, max: 4.0, step: 0.1, default: 2.0 },
          { id: 'warp2', label: 'Secondary Warp Fold (Beta)', min: 0.2, max: 3.0, step: 0.1, default: 1.4 }
        ];
      case 'noise':
        return [
          { id: 'octaves', label: 'Noise Harmonics / Octaves', min: 1.0, max: 5.0, step: 1.0, default: 4.0 },
          { id: 'roughness', label: 'Fractal Roughness', min: 0.2, max: 0.9, step: 0.02, default: 0.52 },
          { id: 'distortion', label: 'Domain Distortion', min: 0.0, max: 3.0, step: 0.1, default: 1.4 }
        ];
      case 'mesh':
        return [
          { id: 'elasticity', label: 'Cursor Spring Elasticity', min: 0.1, max: 2.0, step: 0.05, default: 0.8 },
          { id: 'swirl', label: 'Liquid Curvature', min: 0.2, max: 3.0, step: 0.1, default: 1.5 }
        ];
      case 'atmosphere':
        return [
          { id: 'density', label: 'Smoke Density (Humo)', min: 0.5, max: 3.5, step: 0.1, default: 1.6 },
          { id: 'godrays', label: 'Crepuscular God Rays', min: 0.0, max: 3.0, step: 0.1, default: 1.4 },
          { id: 'smokeCurl', label: 'Thermal Convection Curl', min: 0.2, max: 4.0, step: 0.1, default: 2.0 }
        ];
      case 'aurora':
        return [
          { id: 'ribbons', label: 'Curtain Ribbon Count', min: 1.0, max: 4.0, step: 1.0, default: 3.0 },
          { id: 'bokehSize', label: 'Diffuse Bokeh Disc Size', min: 0.5, max: 3.0, step: 0.1, default: 1.4 },
          { id: 'bokehCount', label: 'Bokeh Orb Count', min: 5.0, max: 20.0, step: 1.0, default: 20.0 }
        ];
      case 'caustics':
        return [
          { id: 'clarity', label: 'Caustics Clarity & Glint', min: 0.5, max: 3.0, step: 0.1, default: 1.4 },
          { id: 'refraction', label: 'Refraction Dispersion', min: 0.2, max: 2.5, step: 0.1, default: 1.2 },
          { id: 'depth', label: 'Water Depth Absorption', min: 0.5, max: 3.0, step: 0.1, default: 1.5 }
        ];
      case 'smoke':
        return [
          { id: 'density', label: 'Densidad de Humo (Smoke)', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'buoyancy', label: 'Convección Térmica Ascendente', min: 0.2, max: 3.0, step: 0.1, default: 1.5 },
          { id: 'windPush', label: 'Fuerza de Viento Hover', min: 0.5, max: 3.5, step: 0.1, default: 1.8 }
        ];
      case 'blur':
        return [
          { id: 'softness', label: 'Radio Gaussian Blur Velvet', min: 1.0, max: 5.0, step: 0.1, default: 3.2 },
          { id: 'glowAura', label: 'Aura Larga de Hover', min: 0.5, max: 3.0, step: 0.1, default: 1.6 },
          { id: 'diffusion', label: 'Difusión de Capas', min: 1.0, max: 4.0, step: 0.1, default: 2.5 }
        ];
      case 'waves':
        return [
          { id: 'frequency', label: 'Frecuencia Ondas Armónicas', min: 10.0, max: 60.0, step: 1.0, default: 32.0 },
          { id: 'damping', label: 'Amortiguación Espacial', min: 0.5, max: 3.0, step: 0.1, default: 1.4 },
          { id: 'emitters', label: 'Emisores de Interferencia', min: 1.0, max: 3.0, step: 1.0, default: 3.0 }
        ];
      case 'iridescent':
        return [
          { id: 'iridescence', label: 'Intensidad de Película Delgada', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'metallic', label: 'Brillo Metálico / Lustre', min: 0.5, max: 3.0, step: 0.1, default: 1.5 },
          { id: 'curvature', label: 'Curvatura de Cromo Líquido', min: 0.2, max: 3.0, step: 0.1, default: 1.4 }
        ];
      case 'neonmist':
        return [
          { id: 'mistDensity', label: 'Densidad de Niebla Neón', min: 0.5, max: 3.5, step: 0.1, default: 1.8 },
          { id: 'beamGlow', label: 'Haz de Luz Linterna Hover', min: 0.5, max: 4.0, step: 0.1, default: 2.0 },
          { id: 'chromaBleed', label: 'Sangrado Cromático Nocturno', min: 0.5, max: 3.0, step: 0.1, default: 1.5 }
        ];
      case 'galaxy':
        return [
          { id: 'arms', label: 'Brazos Espirales Galácticos', min: 1.0, max: 6.0, step: 1.0, default: 3.0 },
          { id: 'twist', label: 'Torsión Gravitacional', min: 1.0, max: 6.0, step: 0.1, default: 3.5 },
          { id: 'coreGlow', label: 'Resplandor Núcleo Supermasivo', min: 0.5, max: 4.0, step: 0.1, default: 2.0 }
        ];
      case 'realsmoke':
        return [
          { id: 'wisps', label: 'Definición de Volutas de Humo', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'diffusion', label: 'Difusión y Translucidez', min: 0.5, max: 3.0, step: 0.1, default: 1.6 },
          { id: 'airDeflect', label: 'Deflexión Aerodinámica (Hover)', min: 0.5, max: 4.0, step: 0.1, default: 2.2 }
        ];
      case 'fire':
        return [
          { id: 'flameHeight', label: 'Altura / Vigor de Llamas', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'turbulence', label: 'Turbulencia Térmica Convectiva', min: 0.5, max: 3.5, step: 0.1, default: 2.0 },
          { id: 'sparkCount', label: 'Chispas y Ascuas en Vuelo', min: 0.5, max: 3.0, step: 0.1, default: 1.5 }
        ];
      case 'clouds':
        return [
          { id: 'cloudDensity', label: 'Densidad Bancos de Nubes', min: 0.5, max: 3.0, step: 0.1, default: 1.8 },
          { id: 'silverLining', label: 'Borde Plateado Solar (Silver Lining)', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'skyDepth', label: 'Gradiente Atmosférico Celeste', min: 0.5, max: 2.5, step: 0.1, default: 1.4 }
        ];
      case 'starfield':
        return [
          { id: 'starDensity', label: 'Densidad Campo Estelar', min: 0.5, max: 4.0, step: 0.1, default: 2.4 },
          { id: 'twinkle', label: 'Centelleo de Estrellas', min: 0.5, max: 4.0, step: 0.1, default: 2.2 },
          { id: 'nebulaGlow', label: 'Gases Cósmicos de Fondo', min: 0.5, max: 3.0, step: 0.1, default: 1.6 }
        ];
      case 'tunnel':
        return [
          { id: 'ribCount', label: 'Costillas / Anillos Neón', min: 6.0, max: 28.0, step: 2.0, default: 16.0 },
          { id: 'tunnelTwist', label: 'Torsión Relativista del Túnel', min: 0.5, max: 5.0, step: 0.1, default: 2.2 },
          { id: 'depthFade', label: 'Atenuación al Abismo Infinito', min: 0.5, max: 3.0, step: 0.1, default: 1.8 }
        ];
      default:
        return [];
    }
  },

  createSliderRow(def, initialValue) {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const header = document.createElement('div');
    header.className = 'slider-header';
    header.innerHTML = `
      <span class="slider-label">${def.label}</span>
      <span class="slider-value" id="val-${def.id}">${Number(initialValue).toFixed(def.step < 0.1 ? 2 : 1)}</span>
    `;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = def.min;
    input.max = def.max;
    input.step = def.step;
    input.value = initialValue;
    input.className = 'studio-range';

    input.addEventListener('input', (e) => {
      const num = parseFloat(e.target.value);
      const valEl = row.querySelector(`#val-${def.id}`);
      if (valEl) valEl.textContent = num.toFixed(def.step < 0.1 ? 2 : 1);
      
      const updateObj = {};
      updateObj[def.id] = num;
      this.renderer.updateParams(updateObj);
      if (this.onParamChange) this.onParamChange();
    });

    row.appendChild(header);
    row.appendChild(input);
    return row;
  },

  openSaveModal() {
    const name = prompt('Name for your custom preset:', 'My Custom Gradient');
    if (!name) return;

    const newPreset = {
      name: name,
      engine: this.renderer.currentShaderId,
      description: `Custom ${this.renderer.currentShaderModule.name} created in Studio.`,
      category: 'User Custom',
      params: {
        ...this.renderer.currentUniforms,
        colors: this.getCurrentColors()
      }
    };

    fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPreset)
    })
    .then(r => r.json())
    .then(saved => {
      alert(`Preset "${saved.name}" saved successfully! Available in Gallery.`);
      CardGallery.fetchPresets().then(() => CardGallery.renderCards());
    })
    .catch(err => {
      console.error('Error saving preset:', err);
      alert('Failed saving preset.');
    });
  }
};
