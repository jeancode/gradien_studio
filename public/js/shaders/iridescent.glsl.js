// 11. Liquid Chrome & Iridescent Pearl Shader (Iridiscencia Óptica y Cromo Líquido)
window.SHADER_IRIDESCENT = {
  name: "Liquid Chrome & Iridescent Pearl",
  id: "iridescent",
  description: "Thin-film optical interference, prismatic soap-bubble rainbow sheen, liquid metallic luster and cursor view angle shifting.",
  defaultUniforms: {
    speed: 0.7,
    scale: 1.8,
    iridescence: 2.2,
    metallic: 1.5,
    curvature: 1.4,
    blur: 1.1,
    brightness: 1.15,
    contrast: 1.3,
    grain: 0.03
  },
  glsl: `
uniform float u_iridescence;
uniform float u_metallic;
uniform float u_curvature;

// Thin-film interference color spectrum approximation
vec3 thinFilmColor(float t) {
    return vec3(
        0.5 + 0.5 * cos(6.28318 * (t + 0.0)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.33)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.67))
    );
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.4;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, golpecitos, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Organic liquid chrome folding
    vec2 v = p * u_scale;
    float n1 = snoise3(vec3(v * 1.4, t * 0.6));
    float n2 = snoise3(vec3(v * 1.4 + 12.4, t * 0.6 + 1.5));
    v += vec2(n1, n2) * 0.4 * u_curvature;

    // View vector towards cursor (fresnel & angular interference)
    vec2 toMouse = m - p;
    float distMouse = length(toMouse);
    float viewAngle = atan(toMouse.y, toMouse.x);

    // Optical film optical path difference (OPD)
    float opd = (snoise3(vec3(v * 1.2, t * 0.3)) * 0.5 + 0.5) * u_iridescence;
    // Modulate OPD with cursor distance and angle
    opd += (1.0 / (distMouse + 0.4)) * 0.25 * u_mouse_hover * u_hover_strength;
    opd += waveH * 0.6;

    // Spectral dispersion colors
    vec3 spectral = thinFilmColor(opd);

    // Base metallic surface
    float surfaceGrad = 0.5 + 0.5 * sin(v.x * 2.5 + v.y * 2.5 + t);
    vec3 baseCol = mapPalette(surfaceGrad);

    // Blend metallic luster with spectral rainbow
    vec3 col = mix(baseCol, spectral, 0.65);

    // Specular Fresnel rim & light reflection
    float fresnel = pow(clamp(1.0 - length(p * 0.6), 0.0, 1.0), 3.0);
    col += fresnel * 0.35 * u_metallic * mix(u_color4, vec3(1.0), 0.7);

    // Hover spotlight specular glint
    float hoverGlint = pow(max(0.0, 1.0 - distMouse * 0.8), 5.0) * 0.5 * u_mouse_hover;
    col += hoverGlint * vec3(1.0);

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
