// 18. Cyber Hyperspace Tunnel & Wormhole (Túneles)
window.SHADER_TUNNEL = {
  name: "Cyber Hyperspace Tunnel & Wormhole",
  id: "tunnel",
  description: "Infinite 3D neon rib warp tunnel plunging forward with cylindrical perspective, relativistic twist and interactive hover flight steering.",
  defaultUniforms: {
    speed: 0.9,
    scale: 1.5,
    ribCount: 16.0,
    tunnelTwist: 2.2,
    depthFade: 1.8,
    blur: 0.8,
    brightness: 1.2,
    contrast: 1.35,
    grain: 0.035
  },
  glsl: `
uniform float u_ribCount;
uniform float u_tunnelTwist;
uniform float u_depthFade;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 1.0;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Camera flight steering towards cursor on hover
    vec2 tunnelCenter = mix(vec2(0.0), m * 0.45, u_mouse_hover * u_hover_strength);
    p -= tunnelCenter;

    // Polar coordinates for cylindrical 3D tunnel mapping
    float r = length(p);
    float a = atan(p.y, p.x);

    // Texture space coordinates: u = angle / 2pi, v = 1/r (depth into tunnel)
    float z = 1.0 / max(0.04, r);
    float u = a / 6.2831853 + z * 0.05 * u_tunnelTwist;
    float v = z - t * 2.0;

    // Tunnel wall lattice / neon ribs
    float ringLines = pow(abs(sin(v * 3.14159)), 12.0);
    float rayLines = pow(abs(sin(u * u_ribCount * 3.14159)), 8.0);
    float grid = ringLines + rayLines;

    // Surface texture noise along tunnel walls
    float wallNoise = snoise3(vec3(u * 6.0, v * 0.8, t * 0.4));
    float pattern = smoothstep(-0.2, 0.8, wallNoise) * 0.5 + grid * 0.8;

    // Infinite vanishing point abyss
    float depthAtten = exp(-r * 0.6) * smoothstep(0.05, 0.4, r);

    // Color gradient mapped along tunnel rings and depth
    float colorPhase = fract(v * 0.08 + u * 0.2);
    vec3 tunnelCol = mapPalette(colorPhase);

    vec3 col = tunnelCol * pattern * depthAtten;

    // Glowing neon rib lines
    col += grid * mix(u_color4, u_color5, fract(z * 0.1)) * depthAtten * 1.5;

    // Central singularity glow / light at the end of the tunnel
    float coreGlow = exp(-r * 8.0) * 1.2;
    col += coreGlow * vec3(1.0);

    // Wave impact ripple along tunnel walls
    col += waveH * 0.35 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
