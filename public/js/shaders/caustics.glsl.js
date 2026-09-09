// 7. Hydro Caustics & Deep Water Surface Shader (Agua & Refracción)
window.SHADER_CAUSTICS = {
  name: "Hydro Caustics & Deep Water Waves",
  id: "caustics",
  description: "Underwater sunlight caustics network, refractive surface ripples, chromatic dispersion and hover wake disturbance.",
  defaultUniforms: {
    speed: 0.8,
    scale: 2.2,
    clarity: 1.4,
    refraction: 1.2,
    depth: 1.5,
    blur: 0.9,
    brightness: 1.15,
    contrast: 1.25,
    grain: 0.03
  },
  glsl: `
uniform float u_clarity;
uniform float u_refraction;
uniform float u_depth;

// Analytical water caustics generator
float waterCaustics(vec2 p, float t) {
    vec2 p1 = p * 1.5 + vec2(t * 0.4, t * 0.3);
    vec2 p2 = p * 1.8 - vec2(t * 0.3, -t * 0.4);
    
    // Intersecting sine wave fronts
    float w1 = sin(p1.x * 2.4 + sin(p1.y * 3.1 + t)) * cos(p1.y * 2.2 - t * 0.8);
    float w2 = sin(p2.x * 3.2 - t * 0.6) * cos(p2.y * 2.7 + sin(p2.x * 2.5 + t));
    
    float c = abs(w1 + w2);
    // Sharp caustic concentration
    c = pow(1.0 - clamp(c * 0.45, 0.0, 1.0), 3.5);
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, golpecitos, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Hover wake stirring
    float mDist = length(p - m);
    vec2 hoverPush = (p - m) * exp(-mDist * 3.0) * 0.15 * u_hover_strength;
    p += hoverPush;

    // Normal disturbance for chromatic refraction
    vec2 eps = vec2(0.008, 0.0);
    float hC = snoise3(vec3(p * u_scale * 1.2, t * 0.6)) + waveH * 0.5;
    float hR = snoise3(vec3((p + eps.xy) * u_scale * 1.2, t * 0.6));
    float hU = snoise3(vec3((p + eps.yx) * u_scale * 1.2, t * 0.6));
    vec2 normalDistort = vec2(hR - hC, hU - hC) * 0.08 * u_refraction;

    // Deep water bed gradient
    float depthGrad = smoothstep(-1.2, 1.0, p.y + snoise(p * 0.8) * 0.3);
    vec3 deepWater = mix(u_color1, u_color2, depthGrad);

    // Chromatic caustics dispersion (R, G, B separation)
    float caustR = waterCaustics(p + normalDistort * 1.15, t);
    float caustG = waterCaustics(p + normalDistort, t);
    float caustB = waterCaustics(p + normalDistort * 0.85, t);

    vec3 caustColor = vec3(caustR, caustG, caustB) * u_clarity;

    // Water surface color layering
    vec3 col = deepWater;
    col = mix(col, u_color3, caustG * 0.45);
    col += caustColor * mix(u_color4, u_color5, 0.5) * 0.85;

    // Specular sunlight glint on wave crests
    float glint = pow(max(0.0, 1.0 - length(p - m) * 0.7), 4.0) * 0.35 * u_mouse_hover;
    col += glint * vec3(1.0);

    // Physical wave reflection highlight
    col += waveH * 0.32 * mix(u_color4, vec3(1.0), 0.6);

    // Post color balance
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
