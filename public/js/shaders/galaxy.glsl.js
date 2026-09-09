// 13. Spiral Galaxy & Cosmic Nebula (Galaxias Difuminadas)
window.SHADER_GALAXY = {
  name: "Spiral Galaxy & Cosmic Nebula",
  id: "galaxy",
  description: "Diffuse rotating spiral galaxy arms, interstellar cosmic gas, gravitational core glow and hover vortex steering.",
  defaultUniforms: {
    speed: 0.6,
    scale: 1.5,
    arms: 3.0,
    twist: 3.5,
    coreGlow: 2.0,
    blur: 1.8,
    brightness: 1.2,
    contrast: 1.3,
    grain: 0.04
  },
  glsl: `
uniform float u_arms;
uniform float u_twist;
uniform float u_coreGlow;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.3;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Gravitational mouse vortex tilt
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        float mGrav = exp(-mDist * 2.5) * 0.35 * u_hover_strength;
        p += normalize(p - m + 0.001) * mGrav;
    }

    // Polar coordinates for spiral rotation
    float r = length(p);
    float a = atan(p.y, p.x);

    // Differential galactic rotation (inner core rotates faster than outer rim)
    float spiralAngle = a + u_twist / (r + 0.35) - t;
    
    // Spiral arms density modulation
    float armPattern = sin(spiralAngle * u_arms);
    float armDensity = pow(0.5 + 0.5 * armPattern, 2.5) * exp(-r * 1.6);

    // Interstellar cosmic gas clouds (fbm turbulence)
    vec2 gasCoord = vec2(r * cos(spiralAngle), r * sin(spiralAngle)) * u_scale;
    float gas = fbm(gasCoord + vec2(t * 0.2, -t * 0.1), 4);
    float nebula = smoothstep(-0.3, 0.8, gas) * exp(-r * 1.2);

    // Supermassive core luminous glow
    float core = exp(-r * 5.0) * u_coreGlow;

    // Background deep space gradient
    vec3 col = mix(u_color1, u_color2, smoothstep(1.5, 0.0, r));

    // Galactic arm color blending
    vec3 armCol = mix(u_color3, u_color4, sin(r * 8.0 - t) * 0.5 + 0.5);
    col += armCol * (armDensity * 1.5 + nebula * 0.8);

    // Core stellar incandescent white-gold
    col += mix(u_color4, u_color5, 0.5) * core;
    col += vec3(1.0) * pow(core, 2.0) * 0.6;

    // Distant star dust sparkles
    float dust = pow(max(0.0, snoise3(vec3(p * 12.0, t * 0.5))), 14.0) * exp(-r * 1.8) * 1.6;
    col += dust * u_color5;

    // Wave impact flare
    col += waveH * 0.3 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
