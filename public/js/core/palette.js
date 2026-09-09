// Palette presets, color conversions and randomizer for Gradient Studio
window.PaletteEngine = {
  presets: [
    {
      name: "Cyber Neon",
      colors: ["#090514", "#7928ca", "#ff0080", "#00dfd8", "#4338ca"]
    },
    {
      name: "Cosmic Abyss",
      colors: ["#020617", "#0f172a", "#0284c7", "#38bdf8", "#f0f9ff"]
    },
    {
      name: "Velvet Orchid",
      colors: ["#180b2b", "#491069", "#b5179e", "#f72585", "#7209b7"]
    },
    {
      name: "Emerald Silk",
      colors: ["#022c22", "#064e3b", "#059669", "#34d399", "#fef08a"]
    },
    {
      name: "Solar Coronal",
      colors: ["#1a0500", "#7c2d12", "#ea580c", "#facc15", "#fffbeb"]
    },
    {
      name: "Boreal Lights",
      colors: ["#020617", "#064e3b", "#10b981", "#06b6d4", "#c084fc"]
    },
    {
      name: "Volumetric Charcoal",
      colors: ["#050505", "#18181b", "#27272a", "#71717a", "#e4e4e7"]
    },
    {
      name: "Twilight Pastel",
      colors: ["#0f172a", "#312e81", "#831843", "#ec4899", "#fbcfe8"]
    },
    {
      name: "Inferno Embers",
      colors: ["#0a0505", "#450a0a", "#b91c1c", "#f97316", "#ffedd5"]
    },
    {
      name: "Electric Prism",
      colors: ["#111827", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    },
    {
      name: "Holographic Silver",
      colors: ["#0f172a", "#475569", "#94a3b8", "#cbd5e1", "#f8fafc"]
    },
    {
      name: "Acid Mirage",
      colors: ["#0d1117", "#164e63", "#06b6d4", "#a3e635", "#facc15"]
    }
  ],

  // Convert Hex string #RRGGBB to normalized [R, G, B] floats (0.0 to 1.0)
  hexToRgbNorm(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [
      ((num >> 16) & 255) / 255.0,
      ((num >> 8) & 255) / 255.0,
      (num & 255) / 255.0
    ];
  },

  // Convert [R, G, B] floats (0.0 to 1.0) to Hex string #RRGGBB
  rgbNormToHex([r, g, b]) {
    const toHex = c => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  // Generate harmonious random 5-color palette
  generateRandomPalette() {
    // Generate base hue in HSL
    const baseHue = Math.random() * 360;
    const mode = Math.floor(Math.random() * 4); // 0: Analogous, 1: Complementary, 2: Triadic, 3: Cyberpunk contrast

    const hslToRgb = (h, s, l) => {
      h = (h % 360 + 360) % 360;
      s = Math.max(0, Math.min(1, s));
      l = Math.max(0, Math.min(1, l));
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) [r, g, b] = [c, x, 0];
      else if (h < 120) [r, g, b] = [x, c, 0];
      else if (h < 180) [r, g, b] = [0, c, x];
      else if (h < 240) [r, g, b] = [0, x, c];
      else if (h < 300) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      return [r + m, g + m, b + m];
    };

    let colors = [];
    if (mode === 0) {
      // Analogous deep to luminous
      colors = [
        hslToRgb(baseHue - 30, 0.85, 0.05),
        hslToRgb(baseHue - 15, 0.75, 0.25),
        hslToRgb(baseHue, 0.85, 0.45),
        hslToRgb(baseHue + 20, 0.90, 0.65),
        hslToRgb(baseHue + 40, 0.95, 0.85)
      ];
    } else if (mode === 1) {
      // Complementary
      const compHue = (baseHue + 180) % 360;
      colors = [
        hslToRgb(baseHue, 0.9, 0.06),
        hslToRgb(baseHue, 0.8, 0.32),
        hslToRgb((baseHue + 90) % 360, 0.85, 0.50),
        hslToRgb(compHue, 0.9, 0.62),
        hslToRgb(compHue, 0.95, 0.85)
      ];
    } else if (mode === 2) {
      // Triadic
      colors = [
        hslToRgb(baseHue, 0.9, 0.05),
        hslToRgb(baseHue, 0.8, 0.35),
        hslToRgb((baseHue + 120) % 360, 0.85, 0.55),
        hslToRgb((baseHue + 240) % 360, 0.9, 0.65),
        hslToRgb(baseHue + 30, 0.95, 0.88)
      ];
    } else {
      // Cyberpunk Contrast
      colors = [
        hslToRgb(260, 0.95, 0.06),
        hslToRgb(280, 0.9, 0.38),
        hslToRgb(330, 0.95, 0.55),
        hslToRgb(175, 0.95, 0.60),
        hslToRgb(55, 0.95, 0.88)
      ];
    }

    return colors.map(c => this.rgbNormToHex(c));
  }
};
