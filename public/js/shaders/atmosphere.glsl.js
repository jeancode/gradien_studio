// 5. Cinematic Atmospheric Shader (Smoke, Godrays & Volumetric Haze)
window.SHADER_ATMOSPHERE = {
  name: "Cinematic Atmospheric Shader",
  id: "atmosphere",
  description: "Volumetric raymarched smoke plumes (humo), atmospheric light scattering, crepuscular god rays, water drops and shockwave ripples.",
  defaultUniforms: {
    speed: 0.55,
    scale: 1.8,
    density: 1.6,
    godrays: 1.4,
    smokeCurl: 2.0,
    blur: 1.6,
    brightness: 1.1,
    contrast: 1.3,
    grain: 0.05
  },
  glsl: `
uniform float u_density;
uniform float u_godrays;
uniform float u_smokeCurl;

// Volumetric smoke density evaluation
float smokeDensity(vec3 p, float t) {
    vec3 q = p - vec3(0.0, t * 0.4, 0.0);
    
    // Curl distortion representing turbulent convection
    vec3 curl = vec3(
        snoise3(q * 1.2),
        snoise3(q * 1.2 + 15.3),
        snoise3(q * 1.2 + 37.1)
    ) * 0.4 * u_smokeCurl;
    
    float f = 0.0;
    vec3 pos = (q + curl) * u_scale;
    float amp = 0.5;
    
    for (int i = 0; i < 4; i++) {
        f += amp * (snoise3(pos) * 0.5 + 0.5);
        pos = pos * 2.1 + vec3(1.7, 9.2, 0.5);
        amp *= 0.48;
    }
    
    return clamp(f * u_density, 0.0, 2.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.5;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Light source position (default top center or controlled by mouse)
    vec2 lightPos = mix(vec2(0.0, 0.85), m, 0.35);

    // Ray direction from virtual camera through fragment
    vec3 ro = vec3(0.0, 0.0, -2.0);
    vec3 rd = normalize(vec3(p, 1.8));

    // Volumetric raymarching accumulation
    const int STEPS = 16;
    float stepSize = 0.18;
    float marchT = 0.1;
    float transmittance = 1.0;
    vec3 scatteredLight = vec3(0.0);

    for (int i = 0; i < STEPS; i++) {
        vec3 pos = ro + rd * marchT;
        float d = smokeDensity(pos, t);
        
        if (d > 0.01) {
            // Light path to source for god rays
            vec2 toLight = lightPos - pos.xy;
            float distToLight = length(toLight);
            float lightShadow = exp(-distToLight * 1.8);
            
            // Crepuscular ray beam intensity
            float angle = atan(toLight.y, toLight.x);
            float beams = 0.5 + 0.5 * sin(angle * 12.0 + t * 0.6) * sin(angle * 5.0 - t * 0.4);
            float lightInscatter = (lightShadow + beams * u_godrays * 0.4);
            
            // Map smoke depth to colors
            float colorPhase = clamp(pos.z * 0.5 + d * 0.4, 0.0, 1.0);
            vec3 stepColor = mapPalette(colorPhase);
            
            // Extinction and scattering
            float extinction = d * stepSize * 1.5;
            scatteredLight += stepColor * lightInscatter * extinction * transmittance;
            transmittance *= exp(-extinction);
            
            if (transmittance < 0.05) break;
        }
        
        marchT += stepSize;
    }

    // Ambient background gradient
    float bgGrad = smoothstep(-1.0, 1.0, -p.y);
    vec3 bg = mix(u_color1, u_color2, bgGrad * 0.8);
    vec3 col = bg * transmittance + scatteredLight;

    // Glowing core at light source
    float coreDist = length(p - lightPos);
    float glow = exp(-coreDist * 2.8) * 0.8;
    col += glow * mix(u_color4, u_color5, 0.5);

    // Floating atmospheric dust embers
    float emberNoise = snoise3(vec3(p * 8.0, t * 1.2));
    float ember = pow(max(0.0, emberNoise), 14.0) * 1.5;
    col += ember * u_color5;

    // Ripple shockwave caustic reflection
    col += waveH * 0.25 * u_color4;

    // Post processing
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
