// 6. Soft Bokeh / Diffuse Aurora Shader
window.SHADER_AURORA = {
  name: "Soft Bokeh / Diffuse Aurora Shader",
  id: "aurora",
  description: "Ethereal polar aurora ribbon curtains with soft chromatic aberration, spectral dispersion, water drops and floating diffuse bokeh discs.",
  defaultUniforms: {
    speed: 0.65,
    scale: 1.5,
    ribbons: 3.0,
    bokehSize: 1.4,
    bokehCount: 20.0,
    blur: 2.2,
    brightness: 1.15,
    contrast: 1.2,
    grain: 0.03
  },
  glsl: `
uniform float u_ribbons;
uniform float u_bokehSize;
uniform float u_bokehCount;

// Aurora ribbon curtain wave generator
float auroraRibbon(vec2 p, float t, float offset) {
    float wave = sin(p.x * 2.0 + t + offset) * 0.35 +
                 sin(p.x * 4.5 - t * 0.8 + offset * 1.5) * 0.18 +
                 sin(p.x * 9.0 + t * 1.2) * 0.06;
                 
    float dist = abs(p.y - wave - 0.2);
    // Vertical drapery fold curtains
    float curtains = 0.5 + 0.5 * sin(p.x * 16.0 + wave * 8.0 + t * 2.0);
    
    return exp(-dist * 4.5) * (0.6 + 0.4 * curtains);
}

// Diffuse Bokeh circle evaluation
float bokehDisc(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    // Smooth out-of-focus aperture profile with soft falloff
    return smoothstep(radius, radius * 0.4, d) * 0.35;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.4;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Subtle pointer repulsion / wind in vortex mode 0
    if (u_interaction_mode == 0) {
        float mDist = length(p - m);
        p += (p - m) * exp(-mDist * 3.0) * (u_mouse_pressed > 0.5 ? 0.4 : 0.15);
    }

    // Deep starry atmospheric background
    vec3 col = mix(u_color1, u_color2, smoothstep(-1.2, 0.8, p.y));

    // Multi-tier undulating aurora curtains with chromatic separation
    float totalAurora = 0.0;
    vec3 auroraCol = vec3(0.0);

    for (int i = 0; i < 4; i++) {
        if (float(i) >= u_ribbons) break;
        float fi = float(i);
        
        float rR = auroraRibbon(p + vec2(0.01 * fi, 0.0), t * 0.9, fi * 1.8);
        float rG = auroraRibbon(p, t, fi * 1.8);
        float rB = auroraRibbon(p - vec2(0.01 * fi, 0.0), t * 1.1, fi * 1.8);

        vec3 layerColor = mix(u_color3, u_color4, fi / 3.0);
        layerColor.r *= (1.0 + rR * 0.5);
        layerColor.g *= (1.0 + rG * 0.5);
        layerColor.b *= (1.0 + rB * 0.5);

        float intensity = (rR + rG + rB) / 3.0;
        auroraCol += layerColor * intensity * (1.2 / (fi + 1.0));
        totalAurora += intensity;
    }

    col += auroraCol;

    // Diffuse Floating Bokeh Orbs
    const int MAX_BOKEH = 20;
    
    for (int i = 0; i < MAX_BOKEH; i++) {
        if (float(i) >= u_bokehCount) break;
        float fi = float(i);
        
        // Pseudo-random deterministic placement drifting upwards
        vec2 seed = vec2(fi * 17.13, fi * 43.71);
        vec2 bPos = vec2(
            fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453) * 2.8 - 1.4,
            fract(sin(dot(seed + 1.0, vec2(93.9898, 67.345))) * 23421.631) * 2.4 - 1.2
        );
        
        // Vertical upward drift and horizontal sway
        bPos.y += mod(t * 0.25 * (0.6 + fract(fi * 0.13)), 2.6) - 1.3;
        bPos.x += sin(t * 0.4 + fi) * 0.12;

        float bRadius = (0.08 + fract(fi * 0.27) * 0.14) * u_bokehSize;
        float bAlpha = bokehDisc(p, bPos, bRadius);
        
        vec3 bCol = mix(u_color4, u_color5, fract(fi * 0.41));
        col += bCol * bAlpha * 0.8;
    }

    // Ripple wave light reflection
    col += waveH * 0.28 * mix(u_color4, vec3(1.0), 0.7);

    // Vignette & color grading
    float vignette = 1.0 - length(p * 0.5);
    col *= smoothstep(0.0, 1.2, vignette);

    // Brightness, contrast & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
