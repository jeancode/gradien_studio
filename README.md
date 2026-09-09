# 🎨 Gradient Studio // Interactive GLSL & Atmospheric Shader Suite

Un estudio creativo y galería interactiva de shaders GLSL acelerados por hardware en WebGL para crear, personalizar y exportar gradientes líquidos, remolinos fluidos, humo atmosférico, domain warping y auroras boreales.

---

## 🚀 Inicio Rápido

1. Abre tu terminal en este directorio:
   ```bash
   cd C:\Users\jean\Desktop\gradien_studi
   ```

2. Inicia el servidor:
   ```bash
   npm start
   ```

3. Abre tu navegador en:
   **[http://localhost:3000](http://localhost:3000)**

---

## 🌟 12 Motores de Shaders Incluidos

1. **Interactive GLSL Fluid Gradient**:
   - Advección de fluidos viscosos y vórtices interactivos (*remolinos*).
2. **Hydro Caustics & Deep Water Waves (Agua)**:
   - Red de cáusticas solares bajo el agua, refracción cromática y ondas de superficie en tiempo real con estelas de hover.
3. **Dense Pyroclastic Smoke Plumes (Humo Denso)**:
   - Volutas densas de humo ascendente con convección térmica y deflexión aerodinámica por viento al pasar el cursor.
4. **Deep Gaussian Velvet Blur Shader (Super Blur Líquido)**:
   - Difusión Gaussiana de 13 muestras para nubes líquidas ultra aterciopeladas con sangrado de color y aura luminosa al hacer hover.
5. **Orbital Wave Interference & Resonance (Ondas Físicas)**:
   - Interferometría de ondas sinusoidales con emisores orbitales, nodos de resonancia y emisor interactivo en el cursor.
6. **Liquid Chrome & Iridescent Pearl (Cromo & Iridiscencia)**:
   - Interferencia óptica de película delgada (pompas de jabón / arcoíris metálico) con reflejos según el ángulo del cursor.
7. **Cyberpunk Neon Fog & Light Beams (Niebla Neón)**:
   - Niebla nocturna densa con sangrado de luz neón y haz volumétrico de linterna guiado por el puntero.
8. **Domain Warping Shader con Multi-tap Gaussian Blur**:
   - Plegado fractal recursivo fbm con filtro Gaussiano de 9 muestras.
9. **Procedural WebGL Noise Gradient**:
   - Ruido Simplex 3D con armónicos multifractales, crestas y distorsión paramétrica.
10. **Liquid Mesh Gradient (Interactive)**:
    - Malla fluida con física de resortes elásticos y mezcla metaball de distancias inversas.
11. **Cinematic Atmospheric Shader**:
    - Raymarching volumétrico de humo, rayos crepusculares (*god rays*) y partículas en suspensión.
12. **Soft Bokeh / Diffuse Aurora Shader**:
    - Cortinas de aurora polar con dispersión espectral y discos circulares de bokeh desenfocados.

---

## 🖱️ Interacción con Hover y Clic del Mouse

El sistema de ondas físicas ahora responde activamente **tanto al movimiento del cursor (Hover) como a los clics**:

- **Estela de Hover (Sin Clic)**: Al simplemente deslizar el mouse sobre el lienzo se generan micro-perturbaciones, estelas líquidas de desplazamiento, refracción cáustica y viento térmico que aparta el humo.
- **Sensibilidad al Hover Configurable**: Deslizador para calibrar qué tan sutil o intenso es el efecto al pasar el cursor.
- **Modos de Interacción con Clic**:
  1. 💧 Gota de Agua & Ondas Físicas
  2. 💥 Golpecitos de Superficie (Taps)
  3. 🌊 Expansión de Gota (Shockwave Ring Splash)
  4. 🌀 Remolinos / Vorticidad de Arrastre
  5. 🧲 Atractor Gravitacional
  6. 🌧️ Lluvia Continua (Auto Gotas)

---

## 🖱️ Modos de Interacción con el Mouse / Cursor

Se ha integrado un sistema físico de ondas y perturbaciones de superficie con 6 modalidades:

1. **💧 Gota de Agua & Ondas Físicas**:
   - Cada clic o pulsación suelta una gota que genera anillos de ondas armónicas concéntricas amortiguadas.
   - Arrastrar el mouse mientras se pulsa crea un sendero continuo de micro-gotas.
2. **💥 Golpecitos de Superficie (Taps)**:
   - Simula toques elásticos directos sobre la tensión superficial del líquido con hendidura central y onda de choque súbita.
3. **🌊 Expansión de Gota (Shockwave Ring Splash)**:
   - Impacto de gota expansiva con corona de onda ancha, perturbación interna y refracción cáustica luminosa.
4. **🌀 Remolinos / Vorticidad de Arrastre**:
   - Vórtices y cizallamiento viscoso clásico de fluidos al arrastrar el puntero.
5. **🧲 Atractor / Succión Gravitacional**:
   - Atrae y concentra las masas del gradiente hacia la posición del cursor.
6. **🌧️ Lluvia Continua (Auto Gotas)**:
   - Cascada automática de gotas de lluvia aleatorias con ondas cruzadas en tiempo real.

---

## 🎛️ Estudio Completo de Personalización

- **Física de Gotas & Ondas**:
  - Velocidad de propagación de onda.
  - Frecuencia / densidad de anillos concéntricos.
  - Tasa de amortiguación y decaimiento.
  - Botón directo para "Soltar Gota en el Centro".
- **Color Ramp Studio**: 5 selectores de color independientes, 12 paletas armónicas curadas (Cyber Neon, Cosmic Abyss, Velvet Orchid, Emerald Silk, Solar Coronal, etc.) y botón **Random** generador de armonías HSL.
- **Controles de Física y Dinámica**:
  - Fuerza de remolinos (*swirl*).
  - Densidad y convección de humo (*smoke curl*).
  - Rayos de luz (*god rays*).
  - Elasticidad de malla y rebote al arrastrar.
- **Óptica y Post-Procesado**:
  - Desenfoque Gaussiano configurable.
  - Dithering triangular anti-banding (elimina las bandas de color en gradientes sutiles).
  - Brillo, contraste, escala y velocidad de tiempo.
- **Captura y Grabación Multimedia**:
  - Descarga instantánea de capturas PNG en resolución Viewport, 1080p o **4K Ultra HD**.
  - Grabador de video WebM en bucle de 5 segundos con barra de progreso.

---

## 📦 Exportación de Fragmentos de Código

Haz clic en **"Export Snippet"** o presiona la tecla `E`:
- **Raw GLSL**: Código fuente fragment shader listo para Shadertoy, Three.js (`ShaderMaterial`) o WebGL nativo.
- **Standalone HTML**: Archivo `.html` único y autosuficiente con canvas interactivo a pantalla completa sin ninguna dependencia externa.
- **React / Next.js Component**: Componente JSX funcional con `canvas`, `requestAnimationFrame` y eventos de puntero.
- **CSS Mesh Fallback**: Código CSS con gradientes radiales aproximados para navegadores antiguos.

---

## ⌨️ Atajos de Teclado

- `Space`: Pausar / Reanudar la animación fluida.
- `R`: Aleatorizar paleta de colores armónica.
- `E`: Abrir modal de exportación de código.
- `G`: Alternar entre vista de **Galería (Tarjetas)** y **Estudio Completo**.
- `F`: Pantalla completa (*Fullscreen*).
