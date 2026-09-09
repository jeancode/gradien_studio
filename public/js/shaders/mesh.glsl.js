// 4. Liquid Mesh Gradient (Interactive)
window.SHADER_MESH = {
  name: "Liquid Mesh Gradient (Interactive)",
  id: "mesh",
  description: "Silky multi-node liquid mesh gradient deformed by spring physics, spatial metaballs, water drops and expanding ripple rings.",
  defaultUniforms: {
    speed: 0.75,
    scale: 1.1,
    swirl: 1.5,
    elasticity: 0.8,
    blur: 2.5,
    brightness: 1.05,
    contrast: 1.18,
    grain: 0.02
  },
  glsl: `
uniform float u_elasticity;
uniform float u_swirl;

// Compute smooth radial influence for a liquid node
float nodeWeight(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return smoothstep(radius, 0.0, d);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Physical ripples, water drop impacts and surface taps
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Dynamic node positions simulated with harmonic Lissajous curves & spring pull
    vec2 n1 = vec2(sin(t * 0.7) * 0.7, cos(t * 0.9) * 0.6);
    vec2 n2 = vec2(cos(t * 0.8 + 1.5) * 0.8, sin(t * 0.6 + 0.8) * 0.7);
    vec2 n3 = vec2(sin(t * 1.1 + 3.1) * 0.6, cos(t * 0.7 + 2.1) * 0.7);
    vec2 n4 = vec2(cos(t * 0.5 + 4.2) * 0.75, sin(t * 1.0 + 5.0) * 0.65);
    vec2 n5 = vec2(sin(t * 0.9 + 2.0) * 0.5, sin(t * 1.2 + 1.0) * 0.5);

    // Mouse attractor dragging nearby nodes
    float mInfluence = u_mouse_pressed > 0.5 ? 1.0 : 0.5;
    n1 = mix(n1, m, exp(-length(n1 - m) * 2.0) * mInfluence * u_elasticity);
    n2 = mix(n2, m, exp(-length(n2 - m) * 2.0) * mInfluence * u_elasticity);
    n3 = mix(n3, m, exp(-length(n3 - m) * 2.0) * mInfluence * u_elasticity);
    n4 = mix(n4, m, exp(-length(n4 - m) * 2.0) * mInfluence * u_elasticity);
    n5 = mix(n5, m, exp(-length(n5 - m) * 2.0) * mInfluence * u_elasticity);

    // Organic warp field on sampling space
    vec2 warp = vec2(
        snoise(p * u_scale + vec2(t * 0.3, 0.0)),
        snoise(p * u_scale + vec2(0.0, t * 0.3))
    ) * 0.35 * u_swirl;
    p += warp;

    // Evaluate soft inverse distance weights
    float d1 = length(p - n1);
    float d2 = length(p - n2);
    float d3 = length(p - n3);
    float d4 = length(p - n4);
    float d5 = length(p - n5);

    // Metaball-style smooth inverse weighting
    float w1 = 1.0 / (pow(d1, 2.2) + 0.08);
    float w2 = 1.0 / (pow(d2, 2.2) + 0.08);
    float w3 = 1.0 / (pow(d3, 2.2) + 0.08);
    float w4 = 1.0 / (pow(d4, 2.2) + 0.08);
    float w5 = 1.0 / (pow(d5, 2.2) + 0.08);

    float totalW = w1 + w2 + w3 + w4 + w5;
    w1 /= totalW;
    w2 /= totalW;
    w3 /= totalW;
    w4 /= totalW;
    w5 /= totalW;

    // Blend the 5 palette colors according to liquid mesh weights
    vec3 col = u_color1 * w1 +
               u_color2 * w2 +
               u_color3 * w3 +
               u_color4 * w4 +
               u_color5 * w5;

    // Silky liquid gloss highlight
    float specular = pow(max(0.0, 1.0 - length(p - m) * 0.8), 3.0) * 0.2;
    col += specular * vec3(1.0);

    // Liquid ripple wave caustic & reflection highlight
    col += waveH * 0.30 * vec3(1.0);

    // Color balance & dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
