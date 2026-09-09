// 12. Cyberpunk Neon Fog & Light Beams (Niebla Neón y Haces de Luz)
window.SHADER_NEONMIST = {
  name: "Cyberpunk Neon Fog & Light Beams",
  id: "neonmist",
  description: "Dense nocturnal neon mist with diffuse color bleeding, volumetric light scattering and interactive hover flashlight.",
  defaultUniforms: {
    speed: 0.6,
    scale: 1.8,
    mistDensity: 1.8,
    beamGlow: 2.0,
    chromaBleed: 1.5,
    blur: 1.5,
    brightness: 1.2,
    contrast: 1.3,
    grain: 0.04
  },
  glsl: `
uniform float u_mistDensity;
uniform float u_beamGlow;
uniform float u_chromaBleed;

// Volumetric mist layer
float mistLayer(vec2 p, float t, float speedMul, float scaleMul) {
    vec2 q = p * scaleMul + vec2(t * 0.2 * speedMul, -t * 0.15 * speedMul);
    float n = snoise3(vec3(q, t * 0.3));
    return smoothstep(-0.5, 0.7, n);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, golpecitos, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Deep nocturnal background
    vec3 col = mix(u_color1, u_color2, smoothstep(-1.2, 0.8, p.y));

    // Multi-layer mist simulation
    float m1 = mistLayer(p, t, 1.0, 1.2 * u_scale);
    float m2 = mistLayer(p + vec2(1.7, 4.2), t, 0.7, 1.8 * u_scale);
    float m3 = mistLayer(p - vec2(3.1, 1.5), t, 1.4, 2.5 * u_scale);
    float totalMist = (m1 * 0.5 + m2 * 0.3 + m3 * 0.2) * u_mistDensity;

    // Saturated neon color bleeding through fog
    vec3 neonColor = mix(u_color3, u_color4, sin(p.x * 2.0 + t) * 0.5 + 0.5);
    col += neonColor * totalMist * 0.7 * u_chromaBleed;

    // Interactive hover flashlight / neon probe
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        // Volumetric light beam falloff
        float flashlight = exp(-mDist * 2.0) * u_beamGlow * u_hover_strength;
        float beamShaft = pow(max(0.0, 1.0 - abs(p.x - m.x) * 3.0), 2.0) * exp(-abs(p.y - m.y) * 2.0) * 0.3;
        
        vec3 lightCol = mix(u_color4, u_color5, 0.6);
        col += (flashlight + beamShaft) * lightCol * (0.8 + 0.4 * totalMist);
    }

    // Wet asphalt reflection at bottom
    float floorReflect = smoothstep(0.2, -1.0, p.y) * totalMist * 0.4;
    col += floorReflect * u_color5;

    // Wave impact flare
    col += waveH * 0.35 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
