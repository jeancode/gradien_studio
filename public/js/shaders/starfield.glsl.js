// 17. Deep Cosmic Starfield & Warp (Estrellas y Nebulosas)
window.SHADER_STARFIELD = {
  name: "Deep Cosmic Starfield & Warp",
  id: "starfield",
  description: "3D parallax deep starfield with twinkling colored stars, diffuse interstellar nebulae, shooting meteors and hover warp acceleration.",
  defaultUniforms: {
    speed: 0.7,
    scale: 2.0,
    starDensity: 2.4,
    twinkle: 2.2,
    nebulaGlow: 1.6,
    blur: 0.9,
    brightness: 1.25,
    contrast: 1.35,
    grain: 0.04
  },
  glsl: `
uniform float u_starDensity;
uniform float u_twinkle;
uniform float u_nebulaGlow;

// Individual star layer with 3D projection
float starLayer(vec2 p, float t, float layerDepth) {
    vec2 gridP = p * (12.0 * layerDepth);
    vec2 id = floor(gridP);
    vec2 gv = fract(gridP) - 0.5;

    float rand = hash1(id + vec2(layerDepth * 17.13, 0.0));
    // Twinkle modulation
    float twinkle = sin(t * 3.0 + rand * 6.28) * 0.5 + 0.5;
    
    // Star center offset inside cell
    vec2 starOffset = vec2(hash1(id + vec2(1.0, 0.0)), hash1(id + vec2(0.0, 2.0))) * 0.6 - 0.3;
    float dist = length(gv - starOffset);
    
    float size = (0.012 + rand * 0.02) * (1.0 + twinkle * u_twinkle * 0.5);
    float star = smoothstep(size, 0.0, dist) * pow(rand, 3.0) * u_starDensity;
    // Cross diffraction spike for brighter stars
    if (rand > 0.85) {
        float spikeX = smoothstep(0.003, 0.0, abs(gv.y - starOffset.y)) * smoothstep(0.12, 0.0, abs(gv.x - starOffset.x));
        float spikeY = smoothstep(0.003, 0.0, abs(gv.x - starOffset.x)) * smoothstep(0.12, 0.0, abs(gv.y - starOffset.y));
        star += (spikeX + spikeY) * 0.5;
    }
    return star;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.6;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Hover warp direction steering
    if (u_mouse_hover > 0.5) {
        p += (p - m) * 0.12 * u_hover_strength;
    }

    // Deep cosmic void background
    vec3 col = mix(u_color1, u_color2, smoothstep(1.4, 0.0, length(p)));

    // Diffuse gaseous nebulae clouds behind stars
    float neb1 = fbm(p * u_scale + vec2(t * 0.1, -t * 0.08), 4);
    float neb2 = fbm(p * u_scale * 1.5 - vec2(t * 0.08, t * 0.1), 4);
    float nebTotal = smoothstep(-0.2, 0.7, neb1 - neb2) * u_nebulaGlow;
    col += mix(u_color3, u_color4, nebTotal) * nebTotal * 0.7;

    // Multi-tier 3D parallax star layers
    float s1 = starLayer(p, t * 0.8, 1.0);
    float s2 = starLayer(p, t * 1.1, 1.8);
    float s3 = starLayer(p, t * 1.4, 2.8);

    vec3 starCol1 = mix(u_color4, vec3(1.0), 0.8) * s1;
    vec3 starCol2 = mix(u_color5, vec3(1.0), 0.85) * s2;
    vec3 starCol3 = vec3(1.0) * s3;

    col += starCol1 + starCol2 + starCol3;

    // Shooting star / meteor streak
    float meteorSeed = floor(t * 0.4);
    vec2 meteorStart = vec2(hash1(vec2(meteorSeed, 1.0)) * 2.0 - 1.0, 1.0);
    vec2 meteorDir = normalize(vec2(-1.2, -1.0));
    float meteorProgress = fract(t * 0.4);
    vec2 meteorPos = meteorStart + meteorDir * meteorProgress * 2.8;
    float meteorDist = length(p - meteorPos);
    float meteor = smoothstep(0.04, 0.0, meteorDist) * (1.0 - meteorProgress) * 1.8;
    col += meteor * vec3(1.0, 0.95, 0.8);

    // Ripple wave glow
    col += waveH * 0.28 * mix(u_color4, vec3(1.0), 0.7);

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
