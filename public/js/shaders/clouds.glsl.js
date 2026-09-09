// 16. Atmospheric Cumulus Clouds (Nubes Celestes)
window.SHADER_CLOUDS = {
  name: "Atmospheric Cumulus Clouds",
  id: "clouds",
  description: "Volumetric soft fluffy cumulus cloud banks drifting across a sky gradient with sunlight silver lining and hover sunbeam scattering.",
  defaultUniforms: {
    speed: 0.5,
    scale: 1.6,
    cloudDensity: 1.8,
    silverLining: 2.2,
    skyDepth: 1.4,
    blur: 1.3,
    brightness: 1.15,
    contrast: 1.25,
    grain: 0.03
  },
  glsl: `
uniform float u_cloudDensity;
uniform float u_silverLining;
uniform float u_skyDepth;

// Multi-octave cumulus cloud density
float cloudDensity(vec2 p, float t) {
    p += vec2(t * 0.25, t * 0.05);
    
    float f = 0.0;
    float amp = 0.55;
    vec2 coord = p * u_scale;
    
    for (int i = 0; i < 5; i++) {
        f += amp * (snoise(coord) * 0.5 + 0.5);
        coord = coord * 2.05 + vec2(1.7, 4.2);
        amp *= 0.5;
    }
    
    // Billowy cumulus carve
    f = smoothstep(0.35, 0.85, f * u_cloudDensity);
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.35;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Dynamic sun position (controlled by mouse hover or upper right default)
    vec2 sunPos = mix(vec2(0.6, 0.6), m, u_mouse_hover * 0.8);
    vec2 toSun = sunPos - p;
    float sunDist = length(toSun);

    // Sky gradient from zenith to horizon
    float skyGrad = smoothstep(-1.2, 1.2, p.y);
    vec3 sky = mix(u_color1, u_color2, skyGrad * u_skyDepth);

    // Sample cloud density and light absorption
    float d = cloudDensity(p, t);
    // Offset sample towards sun for shadow / light transmission
    float dSun = cloudDensity(p + normalize(toSun) * 0.04, t);
    float sunTransmission = clamp(d - dSun, 0.0, 1.0);

    // Cloud shading: shadowed bottom to brightly lit tops
    vec3 cloudShadow = mix(u_color3, u_color4, 0.5);
    vec3 cloudLit = mix(u_color4, u_color5, 0.7);
    
    vec3 cloudColor = mix(cloudShadow, cloudLit, smoothstep(0.0, 0.6, d));
    
    // Silver lining: intense forward scattering on cloud edges facing the sun
    float silver = pow(sunTransmission, 1.5) * exp(-sunDist * 1.5) * u_silverLining;
    cloudColor += silver * vec3(1.0, 0.96, 0.9) * 0.9;

    // Blend clouds over sky
    vec3 col = mix(sky, cloudColor, d * 0.92);

    // Solar halo / crepuscular beam glow around sun
    float sunGlow = exp(-sunDist * 2.0) * 0.6;
    col += sunGlow * mix(u_color5, vec3(1.0), 0.6);

    // Ripple highlight
    col += waveH * 0.25 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
