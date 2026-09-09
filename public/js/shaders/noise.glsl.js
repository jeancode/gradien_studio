// 3. Procedural WebGL Noise Gradient
window.SHADER_NOISE = {
  name: "Procedural WebGL Noise Gradient",
  id: "noise",
  description: "Procedural 3D Simplex & ridged multifractal noise with harmonic octaves, water drops and expanding ripple rings.",
  defaultUniforms: {
    speed: 0.7,
    scale: 2.2,
    octaves: 4.0,
    roughness: 0.52,
    distortion: 1.4,
    blur: 0.8,
    brightness: 1.1,
    contrast: 1.25,
    grain: 0.035
  },
  glsl: `
uniform float u_octaves;
uniform float u_roughness;
uniform float u_distortion;

// Ridged multifractal noise
float ridgedNoise(vec3 p) {
    return 1.0 - abs(snoise3(p));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.35;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Physical ripples, water drop impacts and surface taps
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Mouse influence in vortex mode 0
    if (u_interaction_mode == 0) {
        float mDist = length(p - m);
        vec2 mPush = (p - m) * exp(-mDist * 2.5) * (u_mouse_pressed > 0.5 ? 0.8 : 0.3);
        p += mPush;
    }

    // Harmonic coordinates
    vec3 coord = vec3(p * u_scale, t);

    // Dynamic distortion field
    float distortX = snoise3(coord * 0.8 + vec3(1.2, 3.4, 0.0)) * u_distortion;
    float distortY = snoise3(coord * 0.8 + vec3(5.6, 7.8, 1.0)) * u_distortion;
    coord.xy += vec2(distortX, distortY);

    // Multi-octave accumulation
    float value = 0.0;
    float amplitude = 0.55;
    float frequency = 1.0;
    float weight = 1.0;

    for (int i = 0; i < 6; i++) {
        if (float(i) >= u_octaves) break;
        
        // Blend standard simplex and ridged harmonics
        float n1 = snoise3(coord * frequency) * 0.5 + 0.5;
        float r1 = ridgedNoise(coord * frequency + vec3(10.0, 0.0, 0.0));
        
        float octaveVal = mix(n1, r1, 0.35);
        value += octaveVal * amplitude;
        
        frequency *= 2.02;
        amplitude *= u_roughness;
    }

    // Secondary cellular pattern overlay
    float cellVal = snoise3(vec3(coord.xy * 1.5, t * 0.5));
    value = mix(value, value * (0.8 + 0.4 * cellVal), 0.3);

    // Normalize value
    value = smoothstep(0.1, 0.9, value);

    vec3 col = mapPalette(value);

    // Luminous ridge veins
    float vein = pow(abs(sin(value * 6.28318)), 8.0) * 0.15;
    col += vein * u_color4;

    // Liquid ripple wave caustic & reflection highlight
    col += waveH * 0.25 * mix(u_color4, vec3(1.0), 0.6);

    // Post color balance
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
