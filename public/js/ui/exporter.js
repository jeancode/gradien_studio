// Code Exporter for Gradient Studio (GLSL, Standalone HTML, React, CSS)
window.CodeExporter = {
  // Generate standalone fragment shader code
  generateGLSL(renderer) {
    const p = renderer.currentUniforms;
    const c = renderer.colors;
    
    let colorUniformDefs = '';
    for (let i = 0; i < 5; i++) {
      const hex = c[i] || c[c.length - 1];
      const [r, g, b] = PaletteEngine.hexToRgbNorm(hex);
      colorUniformDefs += `// Color ${i + 1}: ${hex} -> vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})\n`;
    }

    return `/* =========================================================
 * Gradient Studio - ${renderer.currentShaderModule.name}
 * Engine: ${renderer.currentShaderId}
 * Generated: ${new Date().toISOString()}
 * ========================================================= */

${colorUniformDefs}
${window.GLSL_COMMON}

${renderer.currentShaderModule.glsl}
`;
  },

  // Generate zero-dependency Standalone HTML file
  generateStandaloneHTML(renderer) {
    const glslCode = this.generateGLSL(renderer);
    const p = renderer.currentUniforms;
    const colors = renderer.colors;
    const interMode = renderer.interactionMode;
    const rSpeed = renderer.rippleSpeed;
    const rFreq = renderer.rippleFreq;
    const rDecay = renderer.rippleDecay;
    const hMode = renderer.hoverMode || 0;
    const hStrength = renderer.hoverStrength !== undefined ? renderer.hoverStrength : 1.0;
    const hRadius = renderer.hoverRadius !== undefined ? renderer.hoverRadius : 0.38;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${renderer.currentShaderModule.name} - Gradient Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }
    #badge {
      position: absolute; bottom: 16px; right: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(255,255,255,0.45); pointer-events: none;
    }
  </style>
</head>
<body>
  <canvas id="gl-canvas"></canvas>
  <div id="badge">Click/Tap for Water Drops & Ripples • Gradient Studio</div>

  <script>
    (function() {
      const canvas = document.getElementById('gl-canvas');
      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true }) 
              || canvas.getContext('experimental-webgl');

      if (!gl) { alert('WebGL not supported'); return; }

      const vsSource = \`
        attribute vec2 a_position;
        void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
      \`;

      const fsSource = \`${glslCode.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

      function createShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      }

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      // Vertex quad
      const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

      const aPos = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // Uniforms
      const uRes = gl.getUniformLocation(program, 'u_resolution');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uMousePressed = gl.getUniformLocation(program, 'u_mouse_pressed');

      // Ripple Uniforms
      const uInterMode = gl.getUniformLocation(program, 'u_interaction_mode');
      const uRipCount = gl.getUniformLocation(program, 'u_ripple_count');
      const uRipSpeed = gl.getUniformLocation(program, 'u_ripple_speed');
      const uRipFreq = gl.getUniformLocation(program, 'u_ripple_freq');
      const uRipDecay = gl.getUniformLocation(program, 'u_ripple_decay');
      const uHoverMode = gl.getUniformLocation(program, 'u_hover_mode');
      const uHoverStrength = gl.getUniformLocation(program, 'u_hover_strength');
      const uHoverRadius = gl.getUniformLocation(program, 'u_hover_radius');
      const uMouseHover = gl.getUniformLocation(program, 'u_mouse_hover');
      const uMouseVel = gl.getUniformLocation(program, 'u_mouse_vel');
      const ripLocs = [];
      for (let i = 0; i < 8; i++) {
        ripLocs[i] = gl.getUniformLocation(program, 'u_ripples[' + i + ']');
      }

      // Params
      const params = ${JSON.stringify(p, null, 2)};
      for (const [key, val] of Object.entries(params)) {
        const loc = gl.getUniformLocation(program, 'u_' + key);
        if (loc) gl.uniform1f(loc, val);
      }

      // Colors
      const hexColors = ${JSON.stringify(colors)};
      function hexToRgb(hex) {
        hex = hex.replace('#', '');
        const n = parseInt(hex, 16);
        return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
      }

      for (let i = 0; i < 5; i++) {
        const loc = gl.getUniformLocation(program, 'u_color' + (i+1));
        if (loc) {
          const hex = hexColors[i] || hexColors[hexColors.length - 1];
          const rgb = hexToRgb(hex);
          gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]);
        }
      }

      // Pointer & Ripple physics
      let ripples = [];
      function addRipple(px, py, intensity = 1.0) {
        const minDim = Math.min(canvas.width, canvas.height);
        const gx = (px * 2.0 - canvas.width) / minDim;
        const gy = (py * 2.0 - canvas.height) / minDim;
        if (ripples.length >= 8) ripples.shift();
        ripples.push({ x: gx, y: gy, age: 0.0, intensity });
      }

      let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
      let targetX = mouseX, targetY = mouseY;
      let isPressed = 0.0;

      function updatePointer(cx, cy) {
        const r = canvas.getBoundingClientRect();
        targetX = (cx - r.left) * (canvas.width / r.width);
        targetY = (r.height - (cy - r.top)) * (canvas.height / r.height);
        return { x: targetX, y: targetY };
      }

      window.addEventListener('mousemove', e => {
        const p = updatePointer(e.clientX, e.clientY);
        if (isPressed > 0.5) addRipple(p.x, p.y, 0.4);
      });
      window.addEventListener('mousedown', e => {
        isPressed = 1.0;
        const p = updatePointer(e.clientX, e.clientY);
        addRipple(p.x, p.y, 1.0);
      });
      window.addEventListener('mouseup', () => { isPressed = 0.0; });
      window.addEventListener('touchmove', e => {
        if (e.touches.length) {
          const p = updatePointer(e.touches[0].clientX, e.touches[0].clientY);
          addRipple(p.x, p.y, 0.4);
        }
      }, { passive: true });
      window.addEventListener('touchstart', e => {
        isPressed = 1.0;
        if (e.touches.length) {
          const p = updatePointer(e.touches[0].clientX, e.touches[0].clientY);
          addRipple(p.x, p.y, 1.0);
        }
      }, { passive: true });
      window.addEventListener('touchend', () => { isPressed = 0.0; });

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }
      window.addEventListener('resize', resize);
      resize();

      let lastTime = performance.now();
      let startTime = performance.now();

      function render(time) {
        const dt = Math.min((time - lastTime) * 0.001, 0.1);
        lastTime = time;
        const t = (time - startTime) * 0.001;

        mouseX += (targetX - mouseX) * 0.12;
        mouseY += (targetY - mouseY) * 0.12;

        for (let i = 0; i < ripples.length; i++) ripples[i].age += dt;
        ripples = ripples.filter(r => r.age < 2.8);

        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, t);
        if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
        if (uMousePressed) gl.uniform1f(uMousePressed, isPressed);

        if (uInterMode) gl.uniform1i(uInterMode, ${interMode});
        if (uRipCount) gl.uniform1i(uRipCount, ripples.length);
        if (uRipSpeed) gl.uniform1f(uRipSpeed, ${rSpeed});
        if (uRipFreq) gl.uniform1f(uRipFreq, ${rFreq});
        if (uRipDecay) gl.uniform1f(uRipDecay, ${rDecay});
        if (uHoverMode) gl.uniform1i(uHoverMode, ${hMode});
        if (uHoverStrength) gl.uniform1f(uHoverStrength, ${hStrength});
        if (uHoverRadius) gl.uniform1f(uHoverRadius, ${hRadius});
        if (uMouseHover) gl.uniform1f(uMouseHover, 1.0);

        for (let i = 0; i < 8; i++) {
          if (ripLocs[i]) {
            if (i < ripples.length) {
              gl.uniform4f(ripLocs[i], ripples[i].x, ripples[i].y, ripples[i].age, ripples[i].intensity);
            } else {
              gl.uniform4f(ripLocs[i], 0, 0, -1, 0);
            }
          }
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    })();
  </script>
</body>
</html>`;
  },

  // Generate React / JSX Component snippet
  generateReactComponent(renderer) {
    const glslCode = this.generateGLSL(renderer);
    const params = renderer.currentUniforms;
    const colors = renderer.colors;
    const interMode = renderer.interactionMode;
    const rSpeed = renderer.rippleSpeed;
    const rFreq = renderer.rippleFreq;
    const rDecay = renderer.rippleDecay;
    const hMode = renderer.hoverMode || 0;
    const hStrength = renderer.hoverStrength !== undefined ? renderer.hoverStrength : 1.0;
    const hRadius = renderer.hoverRadius !== undefined ? renderer.hoverRadius : 0.38;

    return `import React, { useEffect, useRef } from 'react';

const FRAGMENT_SHADER = \`${glslCode.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

const VERTEX_SHADER = \`
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
\`;

export default function GradientCanvas({ className = '', style = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true })
            || canvas.getContext('experimental-webgl');
    if (!gl) return;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMousePressed = gl.getUniformLocation(program, 'u_mouse_pressed');

    const uInterMode = gl.getUniformLocation(program, 'u_interaction_mode');
    const uRipCount = gl.getUniformLocation(program, 'u_ripple_count');
    const uRipSpeed = gl.getUniformLocation(program, 'u_ripple_speed');
    const uRipFreq = gl.getUniformLocation(program, 'u_ripple_freq');
    const uRipDecay = gl.getUniformLocation(program, 'u_ripple_decay');
    const uHoverMode = gl.getUniformLocation(program, 'u_hover_mode');
    const uHoverStrength = gl.getUniformLocation(program, 'u_hover_strength');
    const uHoverRadius = gl.getUniformLocation(program, 'u_hover_radius');
    const uMouseHover = gl.getUniformLocation(program, 'u_mouse_hover');
    const ripLocs = [];
    for (let i = 0; i < 8; i++) ripLocs[i] = gl.getUniformLocation(program, \`u_ripples[\${i}]\`);

    const params = ${JSON.stringify(params)};
    for (const [k, v] of Object.entries(params)) {
      const loc = gl.getUniformLocation(program, 'u_' + k);
      if (loc) gl.uniform1f(loc, v);
    }

    const hexColors = ${JSON.stringify(colors)};
    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      const n = parseInt(hex, 16);
      return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
    }
    for (let i = 0; i < 5; i++) {
      const loc = gl.getUniformLocation(program, 'u_color' + (i+1));
      if (loc) {
        const rgb = hexToRgb(hexColors[i] || hexColors[hexColors.length - 1]);
        gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]);
      }
    }

    let ripples = [];
    function addRipple(px, py, intensity = 1.0) {
      const minDim = Math.min(canvas.width, canvas.height);
      const gx = (px * 2.0 - canvas.width) / minDim;
      const gy = (py * 2.0 - canvas.height) / minDim;
      if (ripples.length >= 8) ripples.shift();
      ripples.push({ x: gx, y: gy, age: 0.0, intensity });
    }

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0, isPressed = 0.0;
    const updatePointer = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      targetX = (cx - r.left) * (canvas.width / r.width);
      targetY = (r.height - (cy - r.top)) * (canvas.height / r.height);
      return { x: targetX, y: targetY };
    };

    const onMouseMove = (e) => {
      const p = updatePointer(e.clientX, e.clientY);
      if (isPressed > 0.5) addRipple(p.x, p.y, 0.4);
    };
    const onMouseDown = (e) => {
      isPressed = 1.0;
      const p = updatePointer(e.clientX, e.clientY);
      addRipple(p.x, p.y, 1.0);
    };
    const onMouseUp = () => { isPressed = 0.0; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    let animId;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();
    let startTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) * 0.001, 0.1);
      lastTime = time;
      const t = (time - startTime) * 0.001;

      mouseX += (targetX - mouseX) * 0.12;
      mouseY += (targetY - mouseY) * 0.12;

      for (let i = 0; i < ripples.length; i++) ripples[i].age += dt;
      ripples = ripples.filter(r => r.age < 2.8);

      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      if (uMousePressed) gl.uniform1f(uMousePressed, isPressed);

      if (uInterMode) gl.uniform1i(uInterMode, ${interMode});
      if (uRipCount) gl.uniform1i(uRipCount, ripples.length);
      if (uRipSpeed) gl.uniform1f(uRipSpeed, ${rSpeed});
      if (uRipFreq) gl.uniform1f(uRipFreq, ${rFreq});
      if (uRipDecay) gl.uniform1f(uRipDecay, ${rDecay});
      if (uHoverMode) gl.uniform1i(uHoverMode, ${hMode});
      if (uHoverStrength) gl.uniform1f(uHoverStrength, ${hStrength});
      if (uHoverRadius) gl.uniform1f(uHoverRadius, ${hRadius});
      if (uMouseHover) gl.uniform1f(uMouseHover, 1.0);

      for (let i = 0; i < 8; i++) {
        if (ripLocs[i]) {
          if (i < ripples.length) {
            gl.uniform4f(ripLocs[i], ripples[i].x, ripples[i].y, ripples[i].age, ripples[i].intensity);
          } else {
            gl.uniform4f(ripLocs[i], 0, 0, -1, 0);
          }
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', ...style }}
    />
  );
}
`;
  },

  // Generate CSS Fallback gradient
  generateCSSFallback(renderer) {
    const c = renderer.colors;
    return `/* CSS Fallback Gradient */
background-color: ${c[0]};
background-image: 
  radial-gradient(at 18% 22%, ${c[1]} 0px, transparent 50%),
  radial-gradient(at 82% 16%, ${c[2]} 0px, transparent 50%),
  radial-gradient(at 48% 62%, ${c[3]} 0px, transparent 50%),
  radial-gradient(at 78% 85%, ${c[4]} 0px, transparent 55%);
filter: blur(40px);
`;
  }
};
