// 15. Liquid Fire & Volcanic Plasma (Fuego y Llamas)
window.SHADER_FIRE = {
  name: "Liquid Fire & Volcanic Plasma",
  id: "fire",
  description: "Volumetric rising fire tongues with incandescent heat radiation, turbulent thermal convection and interactive hover sparks.",
  defaultUniforms: {
    speed: 0.85,
    scale: 1.8,
    flameHeight: 2.2,
    turbulence: 2.0,
    sparkCount: 1.5,
    blur: 1.0,
    brightness: 1.2,
    contrast: 1.35,
    grain: 0.035
  },
  glsl: `
uniform float u_flameHeight;
uniform float u_turbulence;
uniform float u_sparkCount;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 1.2;
    vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-interaction physical wave displacement (gotas, ondas de choque, hover wake)
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Hover attraction / torch pulling
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        vec2 pull = (m - p) * exp(-mDist * 2.2) * 0.35 * u_hover_strength;
        p += pull;
    }

    // Flame coordinates: rising rapidly upwards
    vec2 q = p * u_scale;
    q.y += 0.8; // Base of fire near bottom
    
    // Convective turbulence
    float n1 = snoise3(vec3(q * 1.2, t * 1.5)) * u_turbulence;
    float n2 = snoise3(vec3(q * 2.4 + vec2(1.7, 4.3), t * 2.2)) * (u_turbulence * 0.5);
    
    // Vertical displacement with flame curl
    vec2 flameCoord = q + vec2(n1 * 0.3, -t * 2.0 + n2 * 0.2);
    float flameNoise = fbm(flameCoord, 4);

    // Vertical tapered flame cone mask
    float flameBase = smoothstep(1.5, -0.8, q.y);
    float flameWidth = (q.y + 1.2) * 0.55;
    float flameShape = exp(-pow(q.x / max(0.1, flameWidth), 2.0));

    // Calculate physical flame temperature (0.0 = cold, 1.0 = incandescent white)
    float temp = (flameNoise * 0.8 + 0.4) * flameShape * flameBase * u_flameHeight;
    temp = clamp(temp, 0.0, 1.8);

    // Cold dark background
    vec3 col = mix(u_color1, u_color2, smoothstep(-1.2, 1.2, p.y));

    // Blackbody heat temperature color grading
    if (temp > 0.05) {
        vec3 heatColor;
        if (temp < 0.4) {
            heatColor = mix(u_color2, u_color3, temp / 0.4);
        } else if (temp < 0.8) {
            heatColor = mix(u_color3, u_color4, (temp - 0.4) / 0.4);
        } else if (temp < 1.2) {
            heatColor = mix(u_color4, u_color5, (temp - 0.8) / 0.4);
        } else {
            heatColor = mix(u_color5, vec3(1.0, 1.0, 0.95), (temp - 1.2) / 0.6);
        }
        col = mix(col, heatColor, min(1.0, temp * 1.4));
    }

    // Floating sparks & hot embers rising
    float sparkNoise = snoise3(vec3(p * 14.0, t * 2.5));
    float sparks = pow(max(0.0, sparkNoise), 18.0) * flameBase * u_sparkCount * 3.0;
    col += sparks * vec3(1.0, 0.8, 0.4);

    // Hover torch flare
    if (u_mouse_hover > 0.5) {
        float mDist = length(p - m);
        float torch = exp(-mDist * 3.5) * 0.6 * u_hover_strength;
        col += torch * mix(u_color5, vec3(1.0), 0.5);
    }

    // Ripple flare
    col += waveH * 0.35 * u_color4;

    // Tone & anti-banding dither
    col = adjustColor(col, u_brightness, u_contrast);
    col = applyDither(col, uv, u_grain);

    gl_FragColor = vec4(col, 1.0);
}
`
};
