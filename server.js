const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PRESETS_FILE = path.join(DATA_DIR, 'presets.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder and presets file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// GET all presets
app.get('/api/presets', (req, res) => {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, 'utf8');
      return res.json(JSON.parse(data));
    }
    return res.json([]);
  } catch (err) {
    console.error('Error reading presets:', err);
    res.status(500).json({ error: 'Failed to read presets' });
  }
});

// POST new custom preset
app.post('/api/presets', (req, res) => {
  try {
    const newPreset = req.body;
    if (!newPreset.name || !newPreset.engine) {
      return res.status(400).json({ error: 'Name and engine are required' });
    }

    let presets = [];
    if (fs.existsSync(PRESETS_FILE)) {
      presets = JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf8'));
    }

    newPreset.id = newPreset.id || `custom-${Date.now()}`;
    newPreset.createdAt = new Date().toISOString();
    presets.push(newPreset);

    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf8');
    res.status(201).json(newPreset);
  } catch (err) {
    console.error('Error saving preset:', err);
    res.status(500).json({ error: 'Failed to save preset' });
  }
});

// DELETE preset
app.delete('/api/presets/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (fs.existsSync(PRESETS_FILE)) {
      let presets = JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf8'));
      presets = presets.filter(p => p.id !== id);
      fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf8');
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Presets file not found' });
  } catch (err) {
    console.error('Error deleting preset:', err);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

// Single page fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎨 Gradient Studio is live on http://localhost:${PORT}`);
  console.log(`✨ GLSL Fluid, Domain Warping, Noise, Liquid Mesh,`);
  console.log(`   Atmosphere & Bokeh Aurora Shaders Ready!`);
  console.log(`====================================================`);
});
