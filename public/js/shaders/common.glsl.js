// Common GLSL functions and header utilities for Gradient Studio
window.GLSL_COMMON = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_pressed;
uniform float u_mouse_hover;
uniform vec2 u_mouse_vel;
uniform float u_hover_strength;
uniform int u_hover_mode; // 0: Swirl, 1: Ripple Wake, 2: Spotlight, 3: Magnetic Lens, 4: Wind Blower, 5: Prism Split, 6: Stardust, 7: Shockwave
uniform float u_hover_radius;
uniform float u_speed;
uniform float u_scale;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_grain;
uniform float u_blur;

uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_color5;

// Multi-Interaction System: Water drops, surface taps, expanding shockwave rings, attractor, raindrops
uniform int u_interaction_mode; // 0: Vortex, 1: Water Drop, 2: Surface Taps, 3: Droplet Expansion, 4: Attractor, 5: Raindrops
uniform vec4 u_ripples[8]; // xy: center in [-1, 1], z: age, w: intensity
uniform int u_ripple_count;
uniform float u_ripple_speed;
uniform float u_ripple_freq;
uniform float u_ripple_decay;

// Hash & Noise utilities
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float hash1(vec2 p) {
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(16.0 * p.x * p.y * (p.x + p.y));
}

// 2D Simplex-style Gradient Noise
float snoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

// 3D Noise for time evolution and volumetric turbulence
float hash31(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + vec3(33.33));
    return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + vec3(33.33));
    return -1.0 + 2.0 * fract((p3.xxy + p3.yxx) * p3.zyx);
}

float snoise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (vec3(3.0) - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float v00 = mix(n000, n100, u.x);
    float v10 = mix(n010, n110, u.x);
    float v01 = mix(n001, n101, u.x);
    float v11 = mix(n011, n111, u.x);

    float v0 = mix(v00, v10, u.y);
    float v1 = mix(v01, v11, u.y);

    return -1.0 + 2.0 * mix(v0, v1, u.z);
}

// Fractal Brownian Motion (FBM) with harmonic rotations
float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        v += a * snoise(p);
        p = rot * p * 2.0 + vec2(100.0);
        a *= 0.5;
    }
    return v;
}

// Multi-Interaction Physical Wave / Ripple / Tap / Droplet Evaluator
vec2 computeRipples(vec2 p, out float waveHighlight) {
    vec2 displacement = vec2(0.0);
    float totalWave = 0.0;

    // Multi-Interaction Ripples (only if click interaction is active: u_interaction_mode >= 0)
    if (u_interaction_mode >= 0) {
        for (int i = 0; i < 8; i++) {
            if (i >= u_ripple_count) break;
            vec4 rip = u_ripples[i];
            vec2 center = rip.xy;
            float age = rip.z;
            float intensity = rip.w;

            if (intensity <= 0.005 || age < 0.0) continue;

            float d = length(p - center);
            vec2 dir = d > 0.001 ? (p - center) / d : vec2(0.0, 1.0);

            if (u_interaction_mode == 1) {
                // 1. Gota de agua (Water Drop with concentric harmonic rings)
                float speed = u_ripple_speed * 0.9;
                float waveFront = age * speed;
                float distFromFront = d - waveFront;
                float envelope = exp(-pow(distFromFront / 0.16, 2.0)) * exp(-age * u_ripple_decay);
                float wave = sin(distFromFront * u_ripple_freq) * envelope * intensity;
                displacement += dir * wave * 0.06;
                totalWave += wave;
            } else if (u_interaction_mode == 2) {
                // 2. Golpecitos de superficie (Surface Taps / elastic punch shockwave)
                float speed = u_ripple_speed * 1.3;
                float shockRadius = age * speed;
                float shock = exp(-pow((d - shockRadius) / 0.09, 2.0)) * exp(-age * (u_ripple_decay * 1.6));
                float centerDepression = exp(-d * 7.0) * exp(-age * 3.5) * cos(age * 14.0);
                float netWave = (shock * 0.7 - centerDepression * 0.5) * intensity;
                displacement += dir * netWave * 0.08;
                totalWave += netWave;
            } else if (u_interaction_mode == 3) {
                // 3. Expansión de gota (Expanding Ring Splash / Shockwave Crown)
                float speed = u_ripple_speed * 0.75;
                float ringRadius = age * speed;
                float ringThickness = 0.08 + age * 0.06;
                float distFromRing = abs(d - ringRadius);
                float ring = smoothstep(ringThickness, 0.0, distFromRing) * exp(-age * (u_ripple_decay * 0.85));
                float rippleInternal = sin(d * u_ripple_freq - age * 8.0) * exp(-d * 3.0) * exp(-age * 2.0) * 0.4;
                float netWave = (ring + rippleInternal) * intensity;
                displacement += dir * netWave * 0.10;
                totalWave += netWave;
            } else if (u_interaction_mode == 5) {
                // 5. Lluvia / Raindrops cascading
                float speed = u_ripple_speed * 1.0;
                float waveFront = age * speed;
                float distFromFront = d - waveFront;
                float envelope = exp(-pow(distFromFront / 0.08, 2.0)) * exp(-age * (u_ripple_decay * 2.0));
                float wave = sin(distFromFront * u_ripple_freq * 1.4) * envelope * intensity;
                displacement += dir * wave * 0.045;
                totalWave += wave;
            }
        }

        // Mode 4: Attractor / Gravitational Vortex Pull
        if (u_interaction_mode == 4) {
            vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            float d = length(p - m);
            float pull = exp(-d * 2.2) * (u_mouse_pressed > 0.5 ? 0.35 : 0.14);
            displacement -= normalize(p - m + 0.001) * pull;
            totalWave += pull;
        }
    }

    // Multi-Mode Physical Hover Interaction System (solo si u_hover_mode >= 0)
    if (u_mouse_hover > 0.5 && u_hover_strength > 0.001 && u_hover_mode >= 0) {
        vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float mDist = length(p - m);
        float hRadius = max(u_hover_radius, 0.08);
        float hFalloff = exp(-pow(mDist / hRadius, 2.0));
        vec2 hDir = mDist > 0.001 ? (p - m) / mDist : vec2(0.0);
        vec2 hTan = vec2(-hDir.y, hDir.x); // Perpendicular tangent for vortices

        if (u_hover_mode == 0) {
            // 0: Vórtice / Remolino Fluido (Swirl & Dynamic Vortex Wake)
            float velLen = length(u_mouse_vel);
            float spinDir = u_mouse_vel.x >= 0.0 ? 1.0 : -1.0;
            float swirlPower = hFalloff * (0.22 + clamp(velLen * 0.00025, 0.0, 0.22)) * u_hover_strength;
            displacement += hTan * swirlPower * spinDir - hDir * (hFalloff * 0.04 * u_hover_strength);
            totalWave += swirlPower * 0.85;
        } else if (u_hover_mode == 1) {
            // 1: Ondas de Agua Concéntricas (Concentric Water Ripple Wake)
            float wavePulse = sin(mDist * u_ripple_freq * 0.85 - u_time * 6.5) * exp(-mDist * 4.2);
            displacement += hDir * (wavePulse * 0.065 + hFalloff * 0.035) * u_hover_strength;
            totalWave += (wavePulse * 1.1 + hFalloff * 0.3) * u_hover_strength;
        } else if (u_hover_mode == 2) {
            // 2: Haz de Luz / Linterna Volumétrica (Volumetric Spotlight & Inner Glow)
            float coreGlow = exp(-pow(mDist / (hRadius * 0.35), 2.0)) * 1.6;
            float wideGlow = hFalloff * 0.9;
            float breathe = sin(u_time * 3.5) * 0.12 + 0.88;
            totalWave += (coreGlow + wideGlow) * breathe * u_hover_strength * 1.4;
            displacement += hDir * (hFalloff * 0.025 * u_hover_strength);
        } else if (u_hover_mode == 3) {
            // 3: Lente Gravitacional / Deformación Magnética (Gravitational Warp Lens)
            float lens = (0.24 / (mDist + 0.10) - 0.5);
            float lensCurve = clamp(lens, -0.65, 0.65) * exp(-mDist * 2.2);
            displacement -= hDir * lensCurve * 0.16 * u_hover_strength;
            totalWave += abs(lensCurve) * u_hover_strength * 0.9;
        } else if (u_hover_mode == 4) {
            // 4: Viento / Deflexión Aerodinámica (Aerodynamic Wind Blower & Smoke Push)
            float velSpeed = length(u_mouse_vel);
            vec2 windDir = velSpeed > 8.0 ? normalize(u_mouse_vel) : vec2(0.0, 1.0);
            float windForce = hFalloff * u_hover_strength;
            displacement += (windDir * 0.14 + hDir * 0.05) * windForce;
            totalWave += windForce * 0.7;
        } else if (u_hover_mode == 5) {
            // 5: Prisma / Dispersión Cromática (Prismatic Holographic Split)
            float fringe = sin(mDist * 36.0 - u_time * 5.5) * hFalloff;
            float harmonic = sin(mDist * 72.0 - u_time * 11.0) * hFalloff * 0.5;
            displacement += hDir * (fringe + harmonic) * 0.055 * u_hover_strength;
            totalWave += (fringe + harmonic) * u_hover_strength * 1.35;
        } else if (u_hover_mode == 6) {
            // 6: Polvo Cósmico & Chispas Titilantes (Cosmic Stardust & Sparkle Trail)
            vec2 sparkGrid = fract(p * 22.0) - 0.5;
            vec2 sparkCell = floor(p * 22.0);
            float sparkRand = hash1(sparkCell + vec2(19.3, 71.7));
            float sparkDist = length(sparkGrid);
            float twinkle = sin(u_time * 9.0 + sparkRand * 6.28) * 0.5 + 0.5;
            float sparkle = smoothstep(0.14, 0.0, sparkDist) * twinkle * step(0.60, sparkRand);
            displacement += hDir * (hFalloff * 0.03 * u_hover_strength);
            totalWave += (sparkle * 2.8 + hFalloff * 0.4) * u_hover_strength;
        } else if (u_hover_mode == 7) {
            // 7: Ondas de Choque Continuas (Harmonic Continuous Shockwaves)
            float pulseProgress = fract(u_time * 1.6 - mDist * 1.9);
            float shockRing = smoothstep(0.12, 0.0, abs(pulseProgress - 0.5)) * exp(-mDist * 2.4);
            displacement += hDir * shockRing * 0.11 * u_hover_strength;
            totalWave += shockRing * u_hover_strength * 1.5;
        }
    }

    waveHighlight = clamp(totalWave, -1.0, 1.0);
    return displacement;
}

// Triangular Dithering to eliminate 8-bit color banding on smooth gradients
vec3 applyDither(vec3 color, vec2 uv, float strength) {
    float n = hash1(uv * u_resolution + vec2(u_time * 100.0));
    float dither = (n - 0.5) * strength;
    return clamp(color + vec3(dither), 0.0, 1.0);
}

// 5-color cosine gradient mapper
vec3 mapPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    float step_val = 0.25;
    if (t < step_val) {
        return mix(u_color1, u_color2, smoothstep(0.0, step_val, t));
    } else if (t < step_val * 2.0) {
        return mix(u_color2, u_color3, smoothstep(step_val, step_val * 2.0, t));
    } else if (t < step_val * 3.0) {
        return mix(u_color3, u_color4, smoothstep(step_val * 2.0, step_val * 3.0, t));
    } else {
        return mix(u_color4, u_color5, smoothstep(step_val * 3.0, 1.0, t));
    }
}

// Contrast and Brightness curve
vec3 adjustColor(vec3 col, float b, float c) {
    col = (col - 0.5) * c + 0.5;
    col *= b;
    return clamp(col, 0.0, 1.0);
}
`;
