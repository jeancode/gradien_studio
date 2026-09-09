// 2. Domain Warping Shader with Multi-tap Gaussian Blur
window.SHADER_WARP = {
  name: "Domain Warping Shader (Gaussian Softness)",
  id: "warp",
  description: "Recursive fractal Brownian motion domain warping with multi-tap Gaussian blur, water drop ripples and surface taps.",
  defaultUniforms: {
    speed: 0.6,
    scale: 2.4,
    warp1: 2.0,
    warp2: 1.4,
    blur: 2.0,
    brightness: 1.1,
    contrast: 1.25,
    grain: 0.03
  },
  glsl: `
uniform float u_warp1;
uniform float u_warp2;

// Evaluates the raw domain warping field at a given point
float sampleWarpField(vec2 p, float t, vec2 m) {
    p *= u_scale * 0.8;
    
    // Mouse interactive ripple when in vortex mode 0
    if (u_interaction_mode == 0) {
        float mDist = length(p - m);
        p += normalize(p - m + 0.001) * exp(-mDist * 2.0) * (u_mouse_pressed > 0.5 ? 0.6 : 0.2);
    }

    vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + vec2(0.15 * t, 0.0), 4),
        fbm(p + vec2(5.2, 1.3) + vec2(0.0, 0.12 * t), 4)
    );

    vec2 r = vec2(
        fbm(p + u_warp1 * q + vec2(1.7, 9.2) + vec2(0.18 * t, 0.0), 4),
        fbm(p + u_warp1 * q + vec2(8.3, 2.8) + vec2(0.0, 0.14 * t), 4)
    );

    float f = fbm(p + u_warp2 * r + vec2(4.1, 3.5) + vec2(0.2 * t, 0.0), 4);
    
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Multi-tap Gaussian Blur sampling for silky soft transitions
    float blurRadius = u_blur * 0.006;
    float accum = 0.0;
    float weightSum = 0.0;

    // 9-tap 2D Gaussian Kernel
    const int TAP_COUNT = 9;
    vec2 offsets[9];
    offsets[0] = vec2( 0.0,  0.0);
    offsets[1] = vec2(-1.0,  0.0);
    offsets[2] = vec2( 1.0,  0.0);
    offsets[3] = vec2( 0.0, -1.0);
    offsets[4] = vec2( 0.0,  1.0);
    offsets[5] = vec2(-0.7, -0.7);
    offsets[6] = vec2( 0.7, -0.7);
    offsets[7] = vec2(-0.7,  0.7);
    offsets[8] = vec2( 0.7,  0.7);

    float weights[9];
    weights[0] = 0.25;
    weights[1] = 0.12;
    weights[2] = 0.12;
    weights[3] = 0.12;
    weights[4] = 0.12;
    weights[5] = 0.0675;
    weights[6] = 0.0675;
    weights[7] = 0.0675;
    weights[8] = 0.0675;

    for (int i = 0; i < TAP_COUNT; i++) {
        vec2 samplePos = p + offsets[i] * blurRadius;
        float val = sampleWarpField(samplePos, t, m);
        accum += val * weights[i];
        weightSum += weights[i];
    }

    float blurredVal = accum / weightSum;
    
    // Normalize into 0..1 range with smooth S-curve
    float normVal = smoothstep(-0.6, 0.7, blurredVal);
    
    vec3 col = mapPalette(normVal);

    // Subtle edge luminescence
    float edge = abs(blurredVal - sampleWarpField(p + vec2(0.005, 0.005), t, m));
    col += edge * 0.6 * u_color3;

    // Liquid ripple wave caustic & reflection highlight
    col += waveH * 0.26 * mix(u_color3, vec3(1.0), 0.6);

    // Adjust color balance
    col = adjustColor(col, u_brightness, u_contrast);

    // Apply dither against color quantization
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
