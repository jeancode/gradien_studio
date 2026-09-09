// 10. Orbital Wave Interference & Resonance (Interferencia de Ondas Físicas)
window.SHADER_WAVES = {
  name: "Orbital Wave Interference & Resonance",
  id: "waves",
  description: "Multi-source circular wave interferometry, standing wave resonance, nodal lines and interactive hover emitter.",
  defaultUniforms: {
    speed: 0.75,
    scale: 2.0,
    frequency: 32.0,
    damping: 1.4,
    emitters: 3.0,
    blur: 1.0,
    brightness: 1.15,
    contrast: 1.3,
    grain: 0.035
  },
  glsl: `
uniform float u_frequency;
uniform float u_damping;
uniform float u_emitters;

// Calculate wave height from a single physical emitter
float singleWave(vec2 p, vec2 center, float t, float freq) {
    float d = length(p - center);
    float phase = d * freq - t * 4.0;
    // Spatial 1/sqrt(r) energy decay and viscous exponential damping
    float amplitude = exp(-d * (u_damping * 0.8)) / (sqrt(d + 0.15));
    return sin(phase) * amplitude;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.8;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, golpecitos, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Dynamic ambient orbital emitters
    vec2 e1 = vec2(sin(t * 0.4) * 0.7, cos(t * 0.5) * 0.5);
    vec2 e2 = vec2(cos(t * 0.5 + 2.0) * 0.8, sin(t * 0.4 + 1.5) * 0.6);
    vec2 e3 = vec2(sin(t * 0.3 + 4.0) * 0.6, cos(t * 0.6 + 3.0) * 0.7);

    // Intersecting wave accumulation (interference)
    float totalWave = singleWave(p, e1, t, u_frequency);
    if (u_emitters > 1.5) totalWave += singleWave(p, e2, t * 1.1, u_frequency * 1.05);
    if (u_emitters > 2.5) totalWave += singleWave(p, e3, t * 0.9, u_frequency * 0.95);

    // Interactive cursor emitter on hover
    if (u_mouse_hover > 0.5) {
        float hoverWave = singleWave(p, m, t * 1.6, u_frequency * 1.2) * 1.4 * u_hover_strength;
        totalWave += hoverWave;
    }

    // Add physical click/tap ripple height
    totalWave += waveH * 1.8;

    // Normal mapping across wave interference field
    float normVal = 0.5 + 0.5 * clamp(totalWave * 0.6, -1.0, 1.0);
    vec3 col = mapPalette(normVal);

    // Sharp specular reflection along constructive interference crests
    float crest = pow(max(0.0, totalWave * 0.7), 4.0) * 0.45;
    col += crest * mix(u_color4, vec3(1.0), 0.6);

    // Subtle dark nodal valleys
    float valley = pow(max(0.0, -totalWave * 0.7), 3.0) * 0.3;
    col -= valley * 0.2;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
