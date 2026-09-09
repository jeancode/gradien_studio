// 9. Deep Gaussian Velvet Blur Shader (Super Blur & Difusión Líquida)
window.SHADER_BLUR = {
  name: "Deep Gaussian Velvet Blur Shader",
  id: "blur",
  description: "Ultra-defocused velvety liquid clouds with multi-pass Gaussian blur diffusion, soft color bleed and luminous hover heat aura.",
  defaultUniforms: {
    speed: 0.5,
    scale: 1.6,
    diffusion: 2.5,
    glowAura: 1.6,
    softness: 3.2,
    blur: 3.5,
    brightness: 1.1,
    contrast: 1.15,
    grain: 0.025
  },
  glsl: `
uniform float u_diffusion;
uniform float u_glowAura;
uniform float u_softness;

// Smooth base color field generator
vec3 sampleBaseField(vec2 p, float t, vec2 m) {
    p *= u_scale * 0.7;
    
    // Slow harmonic drift
    vec2 p1 = p + vec2(sin(t * 0.6) * 0.4, cos(t * 0.5) * 0.4);
    vec2 p2 = p + vec2(cos(t * 0.7 + 1.2) * 0.5, sin(t * 0.8 + 2.0) * 0.4);
    
    float f1 = snoise(p1);
    float f2 = snoise(p2 + vec2(4.2, 1.8));
    float blend = smoothstep(-0.8, 0.8, f1 - f2);
    
    vec3 base = mapPalette(blend);
    
    // Interactive hover color bleed
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m * 0.7);
        float aura = exp(-mDist * 2.0) * 0.5 * u_glowAura * u_hover_strength;
        base = mix(base, u_color4, aura);
    }
    
    return base;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.4;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, golpecitos, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Heavy 13-tap 2D Gaussian Kernel for velvet softness
    float blurRadius = u_softness * 0.015;
    vec3 accum = vec3(0.0);
    float weightSum = 0.0;

    const int TAPS = 13;
    vec2 offsets[13];
    offsets[0]  = vec2( 0.0,  0.0);
    offsets[1]  = vec2(-1.0,  0.0);
    offsets[2]  = vec2( 1.0,  0.0);
    offsets[3]  = vec2( 0.0, -1.0);
    offsets[4]  = vec2( 0.0,  1.0);
    offsets[5]  = vec2(-0.7, -0.7);
    offsets[6]  = vec2( 0.7, -0.7);
    offsets[7]  = vec2(-0.7,  0.7);
    offsets[8]  = vec2( 0.7,  0.7);
    offsets[9]  = vec2(-1.5,  0.0);
    offsets[10] = vec2( 1.5,  0.0);
    offsets[11] = vec2( 0.0, -1.5);
    offsets[12] = vec2( 0.0,  1.5);

    float weights[13];
    weights[0]  = 0.22;
    weights[1]  = 0.10; weights[2]  = 0.10;
    weights[3]  = 0.10; weights[4]  = 0.10;
    weights[5]  = 0.06; weights[6]  = 0.06;
    weights[7]  = 0.06; weights[8]  = 0.06;
    weights[9]  = 0.035; weights[10] = 0.035;
    weights[11] = 0.035; weights[12] = 0.035;

    for (int i = 0; i < TAPS; i++) {
        vec2 samplePos = p + offsets[i] * blurRadius;
        vec3 colVal = sampleBaseField(samplePos, t, m);
        accum += colVal * weights[i];
        weightSum += weights[i];
    }

    vec3 col = accum / weightSum;

    // Hover luminous aura halo
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        float halo = exp(-mDist * 2.2) * 0.25 * u_glowAura * u_hover_strength;
        col += halo * mix(u_color5, vec3(1.0), 0.5);
    }

    // Ripple wave light crest
    col += waveH * 0.20 * mix(u_color4, vec3(1.0), 0.7);

    // Tone & dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
