// 14. Real Drifting Smoke & Wisps (Humo Real Flotando)
window.SHADER_REALSMOKE = {
  name: "Real Drifting Smoke & Wisps",
  id: "realsmoke",
  description: "Silky curling smoke tendrils floating upwards with realistic fluid turbulence, aerodynamic hand deflection and soft dissipation.",
  defaultUniforms: {
    speed: 0.6,
    scale: 1.8,
    wisps: 2.2,
    diffusion: 1.6,
    airDeflect: 2.2,
    blur: 1.5,
    brightness: 1.15,
    contrast: 1.3,
    grain: 0.04
  },
  glsl: `
uniform float u_wisps;
uniform float u_diffusion;
uniform float u_airDeflect;

// Multi-layered curl noise wisp generator
float smokeWisp(vec2 p, float t, vec2 m) {
    p.y += t * 0.45; // Smoke drifts upward
    
    // Aerodynamic obstacle deflection (smoke parts around cursor)
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        vec2 deflectDir = normalize(p - m + vec2(0.001, 0.001));
        // Divergence around pointer
        p += deflectDir * exp(-mDist * 2.8) * 0.4 * u_airDeflect * u_hover_strength;
    }

    vec2 q = vec2(
        fbm(p * u_scale + vec2(0.0, t * 0.4), 4),
        fbm(p * u_scale + vec2(3.1, -t * 0.3), 4)
    );

    vec2 r = vec2(
        fbm(p * u_scale + 2.0 * q + vec2(1.7, 9.2), 4),
        fbm(p * u_scale + 2.0 * q + vec2(8.3, 2.8), 4)
    );

    float f = fbm(p * u_scale + 2.2 * r, 5);
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Evaluate layered smoke fields
    float wisp1 = smokeWisp(p, t, m);
    float wisp2 = smokeWisp(p * 1.3 + vec2(1.2, 4.5), t * 0.8, m);
    
    // Thin wispy tendril profile
    float smokeAlpha1 = smoothstep(-0.4, 0.6, wisp1 * u_wisps) * smoothstep(1.2, -1.0, p.y);
    float smokeAlpha2 = smoothstep(-0.3, 0.7, wisp2 * u_wisps * 0.8) * smoothstep(1.2, -0.8, p.y);

    // Atmospheric dark background
    vec3 col = mix(u_color1, u_color2, smoothstep(-1.2, 1.0, p.y));

    // Outer diffuse smoke halo
    col = mix(col, u_color3, (smokeAlpha1 + smokeAlpha2) * 0.45 * u_diffusion);

    // Core dense smoke ribbons
    col = mix(col, u_color4, pow(smokeAlpha1, 1.8) * 0.75);

    // Edge rim luminescence / backlighting
    float rim = abs(smokeAlpha1 - smokeAlpha2);
    col += rim * 0.5 * u_color5;

    // Hover light source illuminating smoke
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        float lantern = exp(-mDist * 2.2) * 0.35 * u_hover_strength;
        col += lantern * mix(u_color4, vec3(1.0), 0.5);
    }

    // Ripple wave crest highlight
    col += waveH * 0.25 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
