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
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveExperience(exp) {
  const list = getExperiences();
  const index = list.findIndex(e => e.slug === exp.slug);
  if (index >= 0) {
    list[index] = { ...list[index], ...exp };
  } else {
    list.push(exp);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
}

function getDirectorySize(dirPath) {
  let size = 0;
  let count = 0;
  if (!fs.existsSync(dirPath)) return { size: 0, count: 0 };
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          size += stat.size;
          count++;
        }
      } catch(e) {}
    }
  } catch(e) {}
  return { size, count };
}

// ── Rutas API de Almacenamiento & Galería ──

// Estadísticas de almacenamiento en disco
app.get('/api/storage/stats', (req, res) => {
  const uploads = getDirectorySize(UPLOADS_DIR);
  const prado = getDirectorySize(path.join(__dirname, 'public', 'prado-360'));
  const totalBytes = uploads.size + prado.size;
  const totalFiles = uploads.count + prado.count;
  const maxStorageBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const percentage = Math.min(100, ((totalBytes / maxStorageBytes) * 100)).toFixed(1);
  
  res.json({
    totalBytes,
    totalFiles,
    usedMB,
    maxMB: 5120,
    percentage,
    formatted: `${usedMB} MB / 5.0 GB`
  });
});

// Obtener todas las experiencias para el Gestor y Galería
app.get('/api/experiences', (req, res) => {
  const list = getExperiences();
  
  // Si no están en DB, inyectar experiencias por defecto
  const hasPrado = list.some(e => e.slug === 'auto-toyota-prado-txl');
  const hasProp = list.some(e => e.slug === 'propiedad-san-francisco-1');

  const defaultSeed = [];
  if (!hasPrado) {
    defaultSeed.push({
      id: 'exp_seed_prado',
      title: 'Toyota Land Cruiser Prado TXL 2024 — Showroom 360°',
      slug: 'auto-toyota-prado-txl',
      asset_type: 'vehicle',
      status: 'available',
      views: 184,
      landing_url: 'https://opportunity.aizprua.com',
      whatsapp_phone: '50760000000',
      images: [
        '/prado-360/frame-1.jpg', '/prado-360/frame-2.jpg', '/prado-360/frame-3.jpg', '/prado-360/frame-4.jpg',
        '/prado-360/frame-5.jpg', '/prado-360/frame-6.jpg', '/prado-360/frame-7.jpg', '/prado-360/frame-8.jpg'
      ],
      interior_image: '/prado-360/interior.jpg',
      inspection: {
        engine: '/prado-360/engine.jpg',
        trunk: '/prado-360/trunk.jpg',
        odometer: '/prado-360/odometer.jpg',
        wheel: '/prado-360/wheel.jpg'
      },
      created_at: new Date('2024-03-01').toISOString(),
      is_seed: true
    });
  }
  if (!hasProp) {
    defaultSeed.push({
      id: 'exp_seed_prop',
      title: 'Propiedad San Francisco — PH Vista del Mar 360°',
      slug: 'propiedad-san-francisco-1',
      asset_type: 'property',
      status: 'available',
      views: 92,
      landing_url: 'https://opportunity.aizprua.com',
      whatsapp_phone: '50760000000',
      images: ['/sample-san-francisco-360.jpg', '/sample-balcon-360.jpg'],
      scenes: [
        { id: 'sala', name: '🛋️ Sala & Comedor', image: '/sample-san-francisco-360.jpg' },
        { id: 'balcon', name: '🌅 Balcón & Terraza', image: '/sample-balcon-360.jpg' }
      ],
      created_at: new Date('2024-03-05').toISOString(),
      is_seed: true
    });
  }

  const all = [...list, ...defaultSeed].map(exp => {
    const allImages = [
      ...(exp.images || []),
      ...(exp.scenes ? exp.scenes.map(s => s.image) : []),
      exp.interior_image,
      ...(exp.inspection ? Object.values(exp.inspection).filter(Boolean) : [])
    ].filter(Boolean);

    const uniqueImages = Array.from(new Set(allImages));
    let estimatedBytes = 0;

    uniqueImages.forEach(img => {
      try {
        let filePath = '';
        if (img.startsWith('/uploads/')) {
          filePath = path.join(UPLOADS_DIR, img.replace('/uploads/', ''));
        } else {
          filePath = path.join(__dirname, 'public', img.replace(/^\//, ''));
        }
        if (fs.existsSync(filePath)) {
          estimatedBytes += fs.statSync(filePath).size;
        }
      } catch(e) {}
    });

    const storageMB = estimatedBytes > 0 ? (estimatedBytes / (1024 * 1024)).toFixed(2) : (uniqueImages.length * 0.45).toFixed(2);

    return {
      ...exp,
      status: exp.status || 'available',
      views: exp.views || 0,
      photo_count: uniqueImages.length,
      storage_mb: storageMB,
      thumbnail: uniqueImages[0] || '/sample-san-francisco-360.jpg',
      all_photos: uniqueImages
    };
  });

  res.json(all);
});

// Cambiar estado de una experiencia (Disponible, Reservado, Vendido)
app.patch('/api/experiences/:slug/status', (req, res) => {
  const { status } = req.body;
  if (!['available', 'reserved', 'sold'].includes(status)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  let list = getExperiences();
  let exp = list.find(e => e.slug === req.params.slug);

  if (!exp) {
    if (req.params.slug === 'auto-toyota-prado-txl') {
      exp = {
        title: 'Toyota Land Cruiser Prado TXL 2024 — Showroom 360°',
        slug: 'auto-toyota-prado-txl',
        asset_type: 'vehicle',
        status,
        views: 184
      };
      list.push(exp);
    } else if (req.params.slug === 'propiedad-san-francisco-1') {
      exp = {
        title: 'Propiedad San Francisco — PH Vista del Mar 360°',
        slug: 'propiedad-san-francisco-1',
        asset_type: 'property',
        status,
        views: 92
      };
      list.push(exp);
    } else {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
  } else {
    exp.status = status;
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
  res.json({ success: true, slug: req.params.slug, status });
});

// Eliminar experiencia y sus archivos asociados del disco
app.delete('/api/experiences/:slug', (req, res) => {
  let list = getExperiences();
  const expIndex = list.findIndex(e => e.slug === req.params.slug);

  let freedBytes = 0;
  if (expIndex >= 0) {
    const exp = list[expIndex];
    const allImages = [
      ...(exp.images || []),
      ...(exp.scenes ? exp.scenes.map(s => s.image) : []),
      exp.interior_image,
      ...(exp.inspection ? Object.values(exp.inspection).filter(Boolean) : [])
    ].filter(Boolean);

    allImages.forEach(img => {
      if (img.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, img.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          try {
            freedBytes += fs.statSync(filePath).size;
            fs.unlinkSync(filePath);
          } catch(e) {}
        }
      }
    });

    list.splice(expIndex, 1);
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
  }

  res.json({ 
    success: true, 
    slug: req.params.slug, 
    freed_mb: (freedBytes / (1024 * 1024)).toFixed(2) 
  });
});

// Purgar fotos de activos vendidos para liberar almacenamiento
app.post('/api/storage/purge-sold', (req, res) => {
  let list = getExperiences();
  let freedBytes = 0;
  let purgedCount = 0;

  list.forEach(exp => {
    if (exp.status === 'sold') {
      const allImages = [
        ...(exp.images || []),
        ...(exp.scenes ? exp.scenes.map(s => s.image) : []),
        exp.interior_image,
        ...(exp.inspection ? Object.values(exp.inspection).filter(Boolean) : [])
      ].filter(Boolean);

      allImages.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const filePath = path.join(UPLOADS_DIR, img.replace('/uploads/', ''));
          if (fs.existsSync(filePath)) {
            try {
              freedBytes += fs.statSync(filePath).size;
              fs.unlinkSync(filePath);
            } catch(e) {}
          }
        }
      });

      exp.images = [];
      exp.interior_image = null;
      exp.inspection = null;
      if (exp.scenes) exp.scenes = [];
      exp.purged = true;
      purgedCount++;
    }
  });

  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
  res.json({
    success: true,
    purgedCount,
    freedMB: (freedBytes / (1024 * 1024)).toFixed(2)
  });
});

// Obtener experiencia por slug con soporte para Auto (Exterior, Cabina, Inspección) y Propiedades
app.get('/api/experiences/:slug', (req, res) => {
  const list = getExperiences();
  const exp = list.find(e => e.slug === req.params.slug);
  
  if (!exp) {
    const isVehicle = req.params.slug.includes('auto') || req.params.slug.includes('toyota') || req.params.slug.includes('prado');
    
    // Escenas con hotspots para propiedades inteligentes
    const defaultScenes = [
      {
        id: 'sala',
        name: '🛋️ Sala & Comedor',
        image: '/sample-san-francisco-360.jpg',
        hotspots: [
          { yaw: 0.15, pitch: -0.05, title: 'Ventanales Piso a Techo', text: 'Vidrios con aislamiento térmico y vista panorámica a la bahía.' },
          { yaw: 1.75, pitch: -0.12, title: 'Cocina Abierta de Lujo', text: 'Sobres de cuarzo blanco con desayunador y gabinetes cierre suave.' },
          { yaw: -1.35, pitch: -0.02, title: 'Pisos de Mármol', text: 'Acabados importados de alto tráfico en toda el área social.' }
        ]
      },
      {
        id: 'balcon',
        name: '🌅 Balcón & Terraza',
        image: '/sample-balcon-360.jpg',
        hotspots: [
          { yaw: 0.0, pitch: -0.08, title: 'Vista al Mar', text: 'Orientación privilegiada con brisa marina constante y atardeceres.' },
          { yaw: 2.1, pitch: 0.05, title: 'Área BBQ & Lounge', text: 'Espacio amplio para mobiliario exterior y parrilla.' }
        ]
      }
    ];

    const defaultVehicleFrames = [
      '/prado-360/frame-1.jpg',
      '/prado-360/frame-2.jpg',
      '/prado-360/frame-3.jpg',
      '/prado-360/frame-4.jpg',
      '/prado-360/frame-5.jpg',
      '/prado-360/frame-6.jpg',
      '/prado-360/frame-7.jpg',
      '/prado-360/frame-8.jpg'
    ];

    let defaultTitle = req.params.slug.replace(/-/g, ' ').toUpperCase();
    if (req.params.slug === 'propiedad-san-francisco-1') {
      defaultTitle = 'Propiedad San Francisco — PH Vista del Mar';
    } else if (isVehicle) {
      defaultTitle = 'Toyota Land Cruiser Prado TXL 2024 — Showroom 360°';
    }

    return res.json({
      title: defaultTitle,
      slug: req.params.slug,
      asset_type: isVehicle ? 'vehicle' : 'property',
      status: 'available', // available | reserved | sold
      views: 184,
      landing_url: 'https://opportunity.aizprua.com',
      whatsapp_phone: '50760000000',
      images: isVehicle ? defaultVehicleFrames : defaultScenes.map(s => s.image),
      scenes: isVehicle ? [] : defaultScenes,
      interior_image: isVehicle ? '/prado-360/interior.jpg' : null,
      inspection: isVehicle ? {
        engine: '/prado-360/engine.jpg',
        trunk: '/prado-360/trunk.jpg',
        odometer: '/prado-360/odometer.jpg',
        wheel: '/prado-360/wheel.jpg'
      } : null,
      specs: isVehicle ? {
        year: '2024',
        mileage: '28,450 km',
        transmission: 'Automática Secuencial',
        engine: '2.8L D-4D Turbo Diésel',
        traction: '4x4 Integral con Reductora'
      } : {
        area: '185 m²',
        bedrooms: '3 Recámaras',
        bathrooms: '3.5 Baños',
        parking: '2 Estacionamientos'
      }
    });
  }

  // Si existe en DB, devolver datos enriquecidos
  res.json({
    ...exp,
    status: exp.status || 'available',
    views: exp.views || 1
  });
});

// Registrar incremento de visita
app.post('/api/experiences/:slug/view', (req, res) => {
  const list = getExperiences();
  const exp = list.find(e => e.slug === req.params.slug);
  if (exp) {
    exp.views = (exp.views || 0) + 1;
    saveExperience(exp);
    return res.json({ success: true, views: exp.views });
  }
  res.json({ success: true, views: 1 });
});

// Crear o actualizar experiencia
app.post('/api/experiences', upload.array('photos', 60), (req, res) => {
  const { 
    title, 
    slug, 
    asset_type, 
    landing_url, 
    whatsapp_phone, 
    status,
    specs_json,
    inspection_indices 
  } = req.body;

  const imagePaths = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  let parsedSpecs = {};
  try {
    if (specs_json) parsedSpecs = JSON.parse(specs_json);
  } catch(e) {}

  let parsedIndices = {};
  try {
    if (inspection_indices) parsedIndices = JSON.parse(inspection_indices);
  } catch(e) {}

  // Mapear fotos categorizadas si se enviaron índices
  let inspectionObj = null;
  let interiorImg = null;
  let exteriorFrames = imagePaths;

  if (asset_type === 'vehicle' && parsedIndices) {
    if (parsedIndices.interior !== undefined && imagePaths[parsedIndices.interior]) {
      interiorImg = imagePaths[parsedIndices.interior];
    }
    inspectionObj = {
      engine: parsedIndices.engine !== undefined ? imagePaths[parsedIndices.engine] : null,
      trunk: parsedIndices.trunk !== undefined ? imagePaths[parsedIndices.trunk] : null,
      odometer: parsedIndices.odometer !== undefined ? imagePaths[parsedIndices.odometer] : null,
      wheel: parsedIndices.wheel !== undefined ? imagePaths[parsedIndices.wheel] : null
    };
    if (parsedIndices.exterior && Array.isArray(parsedIndices.exterior)) {
      exteriorFrames = parsedIndices.exterior.map(i => imagePaths[i]).filter(Boolean);
    }
  }

  let propertyScenes = [];
  if (asset_type === 'property' && parsedIndices && Array.isArray(parsedIndices.scenes)) {
    propertyScenes = parsedIndices.scenes.map(s => ({
      id: s.id,
      name: s.name,
      image: imagePaths[s.photoIndex] || imagePaths[0],
      hotspots: []
    }));
  }

  const newExp = {
    id: `exp_${Date.now()}`,
    title,
    slug,
    asset_type: asset_type || 'property',
    status: status || 'available',
    views: 0,
    landing_url: landing_url || 'https://opportunity.aizprua.com',
    whatsapp_phone: whatsapp_phone || '50760000000',
    images: exteriorFrames,
    scenes: propertyScenes,
    interior_image: interiorImg,
    inspection: inspectionObj,
    specs: parsedSpecs,
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

// Ruta de Autenticación: /login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta del Gestor de Experiencias 3D y Almacenamiento: /galeria o /gallery
app.get(['/galeria', '/gallery'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});

// Ruta del Visor Público con inyección dinámica de OpenGraph para WhatsApp / Telegram / iMessage
app.get(['/3d/:slug', '/:slug'], (req, res, next) => {
  const slug = req.params.slug;
  if (slug.includes('.')) return next();

  const viewerPath = path.join(__dirname, 'public', 'viewer.html');
  if (!fs.existsSync(viewerPath)) return next();

  let html = fs.readFileSync(viewerPath, 'utf-8');

  // Metadatos para compartir en WhatsApp
  let title = 'Experiencia 3D Interactiva — Opportunity Intelligence';
  let desc = 'Recorrido interactivo 360° en alta resolución con inspección técnica.';
  let ogImage = 'https://3d.aizprua.com/prado-360/frame-2.jpg';

  if (slug === 'propiedad-san-francisco-1') {
    title = 'Propiedad San Francisco — PH Vista del Mar 360°';
    desc = 'Recorrido virtual inmersivo con vista panorámica al mar y acabados de lujo.';
    ogImage = 'https://3d.aizprua.com/sample-san-francisco-360.jpg';
  } else if (slug.includes('toyota') || slug.includes('auto') || slug.includes('prado')) {
    title = 'Toyota Land Cruiser Prado TXL 2024 — Showroom 360°';
    desc = 'Giro interactivo 360°, cabina interior, motor D-4D, maletero y kilometraje verificado.';
    ogImage = 'https://3d.aizprua.com/prado-360/frame-2.jpg';
  }

  // Reemplazar metatags en el HTML
  html = html.replace(/<title id="view-title">.*?<\/title>/, `<title id="view-title">${title}</title>`);
  
  const ogTags = `
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="https://3d.aizprua.com/${slug}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImage}">
  `;

  html = html.replace('<!-- OPENGRAPH_TAGS -->', ogTags);

  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Experience-3D] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
});
