// Core WebGL Renderer for Gradient Studio with Multi-Interaction Ripple & Drop System
class GLRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      antialias: true,
      powerPreference: 'high-performance'
    }) || canvas.getContext('experimental-webgl');

    if (!this.gl) {
      console.warn('WebGL is not supported in your browser.');
      throw new Error('WebGL not supported');
    }

    this.programCache = new Map();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.program = null;
    this.currentShaderId = null;
    this.currentUniforms = {};
    this.colors = [];
    
    // Animation state
    this.isPlaying = true;
    this.startTime = performance.now();
    this.lastFrameTime = performance.now();
    this.totalTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    
    // Interactive mouse tracking
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      isPressed: 0.0,
      velocity: 0.0
    };

    // Multi-Interaction Physical Wave / Ripple System
    // 0: Vortex Swirl, 1: Water Drop, 2: Surface Taps, 3: Droplet Expansion, 4: Attractor, 5: Raindrops
    this.interactionMode = 1; 
    this.rippleSpeed = 1.3;
    this.rippleFreq = 42.0;
    this.rippleDecay = 2.2;
    this.ripples = []; // Up to 8 ripples { x, y, age: 0, intensity: 1.0 }
    this.maxRipples = 8;
    this.lastDragRippleTime = 0;

    this.hoverMode = 0; // 0: Swirl, 1: Ripple Wake, 2: Spotlight, 3: Lens, 4: Wind, 5: Prism, 6: Stardust, 7: Shockwave
    this.hoverStrength = 1.0;
    this.hoverRadius = 0.38;
    this.mouse.isHovered = 1.0;
    this.mouse.vx = 0.0;
    this.mouse.vy = 0.0;
    this.lastHoverX = null;
    this.lastHoverY = null;
    this.lastHoverTime = performance.now();

    this.initQuad();
    if (!this.options.noEvents) {
      this.setupListeners();
    }
  }

  initQuad() {
    const gl = this.gl;
    // Standard 2D Fullscreen Quad Clip Space [-1, 1]
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
  }

  // Add physical drop / ripple / surface tap impact
  addRipple(pixelX, pixelY, intensity = 1.0) {
    // Convert canvas pixels into shader normalized coordinates [-1, 1]
    const minDim = Math.min(this.canvas.width, this.canvas.height);
    const glX = (pixelX * 2.0 - this.canvas.width) / minDim;
    const glY = (pixelY * 2.0 - this.canvas.height) / minDim;

    if (this.ripples.length >= this.maxRipples) {
      this.ripples.shift(); // Remove oldest ripple
    }

    this.ripples.push({
      x: glX,
      y: glY,
      age: 0.0,
      intensity: intensity
    });
  }

  setupListeners() {
    const updatePointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.canvas.width / rect.width);
      // Invert Y for GL coordinate system (0,0 at bottom-left)
      const y = (rect.height - (clientY - rect.top)) * (this.canvas.height / rect.height);
      
      const now = performance.now();
      const dt = Math.max((now - this.lastHoverTime) / 1000, 0.001);
      if (this.lastHoverX !== null) {
        this.mouse.vx = (x - this.lastHoverX) / dt;
        this.mouse.vy = (y - this.lastHoverY) / dt;
      }
      this.lastHoverTime = now;

      this.mouse.targetX = x;
      this.mouse.targetY = y;
      this.mouse.isHovered = 1.0;
      return { x, y };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y } = updatePointer(e.clientX, e.clientY);
      const now = performance.now();

      const dx = this.lastHoverX !== null ? (x - this.lastHoverX) : 0;
      const dy = this.lastHoverY !== null ? (y - this.lastHoverY) : 0;
      const dist = Math.hypot(dx, dy);

      // 1. DRAG with button pressed: strong drops & ripples
      if (this.mouse.isPressed > 0.5) {
        if (this.interactionMode >= 0 && now - this.lastDragRippleTime > 80 && dist > 8) {
          this.addRipple(x, y, 0.7);
          this.lastDragRippleTime = now;
        }
      } else {
        // 2. HOVER without click: only generate gentle ripple wakes if hoverMode >= 0
        if (this.hoverMode >= 0 && now - this.lastDragRippleTime > 90 && dist > 12) {
          this.addRipple(x, y, 0.38 * this.hoverStrength);
          this.lastDragRippleTime = now;
        }
      }

      this.lastHoverX = x;
      this.lastHoverY = y;
    });

    this.canvas.addEventListener('mouseenter', () => {
      this.mouse.isHovered = 1.0;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isHovered = 0.0;
      this.lastHoverX = null;
      this.lastHoverY = null;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.isPressed = 1.0;
      const { x, y } = updatePointer(e.clientX, e.clientY);
      if (this.interactionMode >= 0) {
        this.addRipple(x, y, 1.0);
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isPressed = 0.0;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const { x, y } = updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        const now = performance.now();
        if (this.interactionMode >= 0 && now - this.lastDragRippleTime > 90) {
          this.addRipple(x, y, 0.45);
          this.lastDragRippleTime = now;
        }
        this.lastHoverX = x;
        this.lastHoverY = y;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchstart', (e) => {
      this.mouse.isPressed = 1.0;
      if (e.touches.length > 0) {
        const { x, y } = updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        if (this.interactionMode >= 0) {
          this.addRipple(x, y, 1.0);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isPressed = 0.0;
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize(dpr = this.dpr) {
    this.dpr = dpr;
    const width = this.canvas.clientWidth || this.canvas.width;
    const height = this.canvas.clientHeight || this.canvas.height;
    
    if (width === 0 || height === 0) return;

    const displayWidth = Math.floor(width * this.dpr);
    const displayHeight = Math.floor(height * this.dpr);

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error('Shader compile error:', info);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  loadEngine(shaderModule, params = {}, colors = []) {
    if (!shaderModule) return;
    const gl = this.gl;
    this.currentShaderModule = shaderModule;
    this.currentShaderId = shaderModule.id;
    this.currentUniforms = { ...shaderModule.defaultUniforms, ...params };
    this.colors = colors && colors.length > 0 ? colors : (PaletteEngine.presets[0].colors);

    // Fast program switch if already compiled
    if (this.programCache.has(shaderModule.id)) {
      const cached = this.programCache.get(shaderModule.id);
      this.program = cached.program;
      this.uniformLocs = cached.uniformLocs;
      this.rippleLocs = cached.rippleLocs;
      gl.useProgram(this.program);

      const aPos = gl.getAttribLocation(this.program, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      this.resize();
      return;
    }

    const fullFragmentSource = window.GLSL_COMMON + '\n' + shaderModule.glsl;

    try {
      const vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShaderSource);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fullFragmentSource);

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(prog);
        gl.deleteProgram(prog);
        throw new Error(`Program link error: ${info}`);
      }

      this.program = prog;
      gl.useProgram(this.program);

      // Attribute position
      const aPos = gl.getAttribLocation(this.program, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // Cache uniform locations
      this.uniformLocs = {};
      const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < numUniforms; i++) {
        const u = gl.getActiveUniform(this.program, i);
        this.uniformLocs[u.name] = gl.getUniformLocation(this.program, u.name);
      }

      // Pre-cache ripple array uniforms
      this.rippleLocs = [];
      for (let i = 0; i < this.maxRipples; i++) {
        this.rippleLocs[i] = gl.getUniformLocation(this.program, `u_ripples[${i}]`);
      }

      // Cache program and uniform map
      this.programCache.set(shaderModule.id, {
        program: this.program,
        uniformLocs: this.uniformLocs,
        rippleLocs: this.rippleLocs
      });

      this.resize();
    } catch (err) {
      console.error(`Failed to load shader engine ${shaderModule.name}:`, err);
    }
  }

  updateParams(params) {
    this.currentUniforms = { ...this.currentUniforms, ...params };
  }

  setColors(colors) {
    this.colors = colors;
  }

  render(timestamp) {
    if (!this.program) return;
    const gl = this.gl;

    // Smooth mouse interpolation (spring inertia)
    const lerp = 0.12;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * lerp;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * lerp;

    // Time delta
    const now = timestamp || performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    if (this.isPlaying) {
      this.totalTime += dt;
    }

    // Advance physical ripples
    for (let i = 0; i < this.ripples.length; i++) {
      this.ripples[i].age += dt;
    }
    // Filter expired ripples (max age ~2.8s)
    this.ripples = this.ripples.filter(r => r.age < 2.8);

    // Mode 5: Raindrops automatic cascade
    if (this.interactionMode === 5 && Math.random() < 0.08) {
      const rx = Math.random() * this.canvas.width;
      const ry = Math.random() * this.canvas.height;
      this.addRipple(rx, ry, 0.6 + Math.random() * 0.4);
    }

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    gl.useProgram(this.program);

    // Standard Uniforms
    if (this.uniformLocs['u_resolution']) {
      gl.uniform2f(this.uniformLocs['u_resolution'], this.canvas.width, this.canvas.height);
    }
    if (this.uniformLocs['u_time']) {
      gl.uniform1f(this.uniformLocs['u_time'], this.totalTime);
    }
    if (this.uniformLocs['u_mouse']) {
      gl.uniform2f(this.uniformLocs['u_mouse'], this.mouse.x, this.mouse.y);
    }
    if (this.uniformLocs['u_mouse_pressed']) {
      gl.uniform1f(this.uniformLocs['u_mouse_pressed'], this.mouse.isPressed);
    }
    if (this.uniformLocs['u_mouse_hover']) {
      gl.uniform1f(this.uniformLocs['u_mouse_hover'], this.mouse.isHovered);
    }
    if (this.uniformLocs['u_mouse_vel']) {
      gl.uniform2f(this.uniformLocs['u_mouse_vel'], this.mouse.vx, this.mouse.vy);
    }
    if (this.uniformLocs['u_hover_strength']) {
      gl.uniform1f(this.uniformLocs['u_hover_strength'], this.hoverStrength);
    }
    if (this.uniformLocs['u_hover_mode']) {
      gl.uniform1i(this.uniformLocs['u_hover_mode'], this.hoverMode);
    }
    if (this.uniformLocs['u_hover_radius']) {
      gl.uniform1f(this.uniformLocs['u_hover_radius'], this.hoverRadius);
    }

    // Multi-Interaction Uniforms
    if (this.uniformLocs['u_interaction_mode']) {
      gl.uniform1i(this.uniformLocs['u_interaction_mode'], this.interactionMode);
    }
    if (this.uniformLocs['u_ripple_count']) {
      gl.uniform1i(this.uniformLocs['u_ripple_count'], this.ripples.length);
    }
    if (this.uniformLocs['u_ripple_speed']) {
      gl.uniform1f(this.uniformLocs['u_ripple_speed'], this.rippleSpeed);
    }
    if (this.uniformLocs['u_ripple_freq']) {
      gl.uniform1f(this.uniformLocs['u_ripple_freq'], this.rippleFreq);
    }
    if (this.uniformLocs['u_ripple_decay']) {
      gl.uniform1f(this.uniformLocs['u_ripple_decay'], this.rippleDecay);
    }

    // Bind active ripples (vec4: x, y, age, intensity)
    for (let i = 0; i < this.maxRipples; i++) {
      if (this.rippleLocs && this.rippleLocs[i]) {
        if (i < this.ripples.length) {
          const r = this.ripples[i];
          gl.uniform4f(this.rippleLocs[i], r.x, r.y, r.age, r.intensity);
        } else {
          gl.uniform4f(this.rippleLocs[i], 0.0, 0.0, -1.0, 0.0);
        }
      }
    }

    // Engine specific & common sliders
    for (const [key, val] of Object.entries(this.currentUniforms)) {
      const uName = `u_${key}`;
      if (this.uniformLocs[uName] && typeof val === 'number') {
        gl.uniform1f(this.uniformLocs[uName], val);
      }
    }

    // Palette Colors (1 to 5)
    for (let i = 0; i < 5; i++) {
      const uColName = `u_color${i + 1}`;
      if (this.uniformLocs[uColName]) {
        const hex = this.colors[i] || this.colors[this.colors.length - 1] || '#ffffff';
        const [r, g, b] = PaletteEngine.hexToRgbNorm(hex);
        gl.uniform3f(this.uniformLocs[uColName], r, g, b);
      }
    }

    // Draw full screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Generate an offscreen capture at specific dimensions (e.g. 1920x1080, 3840x2160)
  captureImage(width = 1920, height = 1080) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;

    const offRenderer = new GLRenderer(offCanvas);
    offRenderer.loadEngine(this.currentShaderModule, this.currentUniforms, this.colors);
    offRenderer.totalTime = this.totalTime;
    offRenderer.interactionMode = this.interactionMode;
    offRenderer.ripples = [...this.ripples];
    offRenderer.mouse = { ...this.mouse };
    offRenderer.render();

    const dataUrl = offCanvas.toDataURL('image/png');
    return dataUrl;
  }
}
