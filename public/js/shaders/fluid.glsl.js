// 1. Interactive GLSL Fluid Gradient
window.SHADER_FLUID = {
  name: "Interactive GLSL Fluid Gradient",
  id: "fluid",
  description: "Interactive dye advection with swirling vortices (remolinos), physical water drops, ripples and reactive pointer turbulence.",
  defaultUniforms: {
    speed: 0.8,
    scale: 1.5,
    swirl: 2.2,
    decay: 0.95,
    iterations: 4.0,
    brightness: 1.1,
    contrast: 1.25,
    grain: 0.035,
    blur: 1.0
  },
  glsl: `
uniform float u_swirl;
uniform float u_decay;
uniform float u_iterations;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.4;
    
    // Multi-interaction ripples, water drops, taps and expanding shockwaves
    float waveH = 0.0;
    p += computeRipples(p, waveH);

    // Mouse interactive whirlpool / vortex influence (when in vortex mode 0)
    if (u_interaction_mode == 0) {
        vec2 m = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float mDist = length(p - m);
        float mForce = exp(-mDist * 3.5) * (u_mouse_pressed > 0.5 ? 2.5 : (1.3 * u_hover_strength * u_mouse_hover));
        
        // Pointer swirl / vortex twist
        float angle = mForce * u_swirl * 2.5;
        mat2 mRot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        p = mix(p, mRot * (p - m) + m, mForce * 0.7);
    }

    // Multi-pass fluid curl advection
    vec2 v = p * u_scale;
    float totalAdvection = 0.0;
    
    for (int i = 1; i <= 5; i++) {
        if (float(i) > u_iterations) break;
        float fi = float(i);
        
        // Curl noise simulation for vorticity
        float n1 = snoise3(vec3(v.yx * 1.5, t * 0.6 + fi));
        float n2 = snoise3(vec3(v.xy * 1.5 + vec2(24.5, 17.3), t * 0.6 + fi * 1.3));
        
        vec2 curl = vec2(n1, -n2) * (0.6 / fi) * u_swirl;
        v += curl;
        
        // Dye intensity accumulator
        totalAdvection += sin(v.x * 2.0 + t * 0.5) * cos(v.y * 2.0 - t * 0.4) / fi;
    }
    
    // Map advection field into normalized gradient coordinate
    float field = 0.5 + 0.5 * sin(totalAdvection * 2.2 + length(v) * 0.8 + t);
    
    // Soft blurred boundary mapping
    field = smoothstep(0.05, 0.95, field);
    
    vec3 col = mapPalette(field);
    
    // Highlights along high vorticity / whirlpool currents
    float crest = pow(abs(sin(totalAdvection * 3.1415)), 4.0) * 0.25;
    col += crest * mix(u_color4, vec3(1.0), 0.4);
    
    // Liquid ripple wave caustic & reflection highlight
    col += waveH * 0.28 * mix(u_color3, vec3(1.0), 0.5);

    // Brightness and contrast
    col = adjustColor(col, u_brightness, u_contrast);
    
    // Dithering to eliminate 8-bit banding
    col = applyDither(col, uv, u_grain);
    
    gl_FragColor = vec4(col, 1.0);
}
`
};
