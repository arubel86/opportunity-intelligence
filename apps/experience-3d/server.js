const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Directorios de subida persistente
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');
const DB_FILE = path.join(__dirname, 'data', 'experiences.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// Configuración de Multer para almacenar imágenes en alta resolución
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({ storage });

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper DB local
function getExperiences() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function saveExperience(exp) {
  const list = getExperiences();
  const index = list.findIndex(e => e.slug === exp.slug);
  if (index >= 0) {
    list[index] = exp;
  } else {
    list.push(exp);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
}

// ── Rutas API ──

// Obtener experiencia por slug
app.get('/api/experiences/:slug', (req, res) => {
  const list = getExperiences();
  const exp = list.find(e => e.slug === req.params.slug);
  if (!exp) {
    // Retornar datos demo por defecto si el slug no existe aún
    return res.json({
      title: req.params.slug.replace(/-/g, ' ').toUpperCase(),
      slug: req.params.slug,
      asset_type: req.params.slug.includes('auto') || req.params.slug.includes('toyota') ? 'vehicle' : 'property',
      landing_url: 'https://opportunity.aizprua.com',
      whatsapp_phone: '50760000000',
      images: []
    });
  }
  res.json(exp);
});

// Crear nueva experiencia
app.post('/api/experiences', upload.array('photos', 60), (req, res) => {
  const { title, slug, asset_type, landing_url, whatsapp_phone } = req.body;
  const imagePaths = req.files.map(f => `/uploads/${f.filename}`);

  const newExp = {
    id: `exp_${Date.now()}`,
    title,
    slug,
    asset_type: asset_type || 'property',
    landing_url: landing_url || 'https://opportunity.aizprua.com',
    whatsapp_phone: whatsapp_phone || '50760000000',
    images: imagePaths,
    created_at: new Date().toISOString()
  };

  saveExperience(newExp);
  res.status(201).json({ success: true, experience: newExp });
});

// ── Rutas Frontend ──

// Ruta del Creador PWA: /3d o /
app.get(['/', '/3d'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'creator.html'));
});

// Ruta del Visor Público: /3d/:slug o /:slug
app.get(['/3d/:slug', '/:slug'], (req, res, next) => {
  // Ignorar archivos estáticos
  if (req.params.slug.includes('.')) return next();
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Experience-3D] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
});
