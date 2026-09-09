// 8. Dense Pyroclastic Smoke & Ash Plumes (Humo Denso y Ceniza)
window.SHADER_SMOKE = {
  name: "Dense Pyroclastic Smoke Plumes",
  id: "smoke",
  description: "Dense billowy smoke curls with thermal buoyancy, ash embers and aerodynamic hover wind deflection.",
  defaultUniforms: {
    speed: 0.65,
    scale: 2.0,
    density: 2.2,
    buoyancy: 1.5,
    windPush: 1.8,
    blur: 1.4,
    brightness: 1.15,
    contrast: 1.35,
    grain: 0.055
  },
  glsl: `
uniform float u_density;
uniform float u_buoyancy;
uniform float u_windPush;

// Dense smoke curl noise generator
float denseSmokeField(vec2 p, float t, vec2 m) {
    // Thermal upward drift
    p.y -= t * 0.5 * u_buoyancy;
    
    // Aerodynamic cursor hover deflection (wind fan)
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        vec2 windDir = normalize(p - m + 0.001);
        p += windDir * exp(-mDist * 2.8) * 0.45 * u_windPush * u_hover_strength;
    }

    vec2 q = vec2(
        fbm(p * u_scale + vec2(0.0, 1.2 * t), 5),
        fbm(p * u_scale + vec2(4.3, 0.8 * t), 5)
    );

    vec2 r = vec2(
        fbm(p * u_scale + 2.0 * q + vec2(1.7, 9.2) - vec2(0.2 * t, 0.0), 4),
        fbm(p * u_scale + 2.0 * q + vec2(8.3, 2.8) + vec2(0.0, 0.15 * t), 4)
    );

    float f = fbm(p * u_scale + 2.5 * r + vec2(2.1, 4.3), 5);
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.45;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    float smoke = denseSmokeField(p, t, m);
    // S-curve contrast on smoke puff boundaries
    float billow = smoothstep(-0.4, 0.7, smoke * u_density);

    // Background abyssal gradient
    vec3 col = mix(u_color1, u_color2, smoothstep(-1.2, 1.0, p.y));

    // Smoke body coloring
    col = mix(col, u_color3, billow * 0.65);
    col = mix(col, u_color4, pow(billow, 2.0) * 0.8);

    // Core thermal ember glow
    float core = pow(billow, 3.5) * 1.2;
    col += core * u_color5;

    // Hover spotlight illuminating smoke
    float hoverDist = length(p - m);
    float hoverGlow = exp(-hoverDist * 2.5) * 0.5 * u_hover_strength * u_mouse_hover;
    col += hoverGlow * mix(u_color4, vec3(1.0), 0.4);

    // Ash embers drifting
    float ash = pow(max(0.0, snoise3(vec3(p * 9.0, t * 1.5))), 16.0) * 2.0;
    col += ash * u_color5;

    // Ripple highlight
    col += waveH * 0.22 * u_color4;

    // Post processing
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
