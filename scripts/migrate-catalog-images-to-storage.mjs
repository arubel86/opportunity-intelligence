// Script de migración: Transfiere imágenes Base64 de catalog_assets a InsForge Storage
const INSFORGE_CONFIG = {
  baseUrl: 'https://insforge.aizprua.com',
  apiKey: 'ik_2bed7411a0830c9985681c4a5ccf2dadc81df1c78a3f30b8e8710d64ecb2d13f',
  endpoint: 'https://insforge.aizprua.com/api/database/records/catalog_assets',
  storageEndpoint: 'https://insforge.aizprua.com/api/storage/buckets/catalog-assets/objects'
};

async function uploadBase64ToStorage(base64Str, filenameHint = 'asset') {
  if (!base64Str || !base64Str.startsWith('data:')) {
    return base64Str; // Ya es una URL o está vacío
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Str;

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';

    const safeFilename = `${filenameHint}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), safeFilename);

    const res = await fetch(INSFORGE_CONFIG.storageEndpoint, {
      method: 'POST',
      headers: {
        'x-api-key': INSFORGE_CONFIG.apiKey
      },
      body: form
    });

    if (!res.ok) {
      console.warn(`Error subiendo imagen (${res.status}):`, await res.text());
      return base64Str;
    }

    const json = await res.json();
    return json.url || base64Str;
  } catch (err) {
    console.error('Error en uploadBase64ToStorage:', err);
    return base64Str;
  }
}

async function migrate() {
  console.log('--- Iniciando migración de imágenes a Storage ---');
  const res = await fetch(INSFORGE_CONFIG.endpoint, {
    headers: { 'x-api-key': INSFORGE_CONFIG.apiKey }
  });

  if (!res.ok) {
    console.error('Error al obtener registros:', res.status, await res.text());
    return;
  }

  const items = await res.json();
  const initialSizeKB = Math.round(JSON.stringify(items).length / 1024);
  console.log(`Registros encontrados: ${items.length}. Tamaño inicial en BD: ${initialSizeKB} KB`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] Procesando "${item.title}" (${item.id})...`);
    let modified = false;

    // 1. Imagen principal
    if (item.image && item.image.startsWith('data:')) {
      const publicUrl = await uploadBase64ToStorage(item.image, `${item.id}-main`);
      if (publicUrl !== item.image) {
        item.image = publicUrl;
        modified = true;
        console.log(`  ✓ Foto principal migrada a: ${publicUrl}`);
      }
    }

    // 2. Galería dentro de specs
    if (item.specs) {
      let specsArr = [];
      try {
        specsArr = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
      } catch (e) {
        specsArr = [];
      }

      if (Array.isArray(specsArr)) {
        let specsChanged = false;
        const newSpecs = [];
        for (const s of specsArr) {
          if (typeof s === 'string' && s.startsWith('__IMAGES__:')) {
            try {
              const gallery = JSON.parse(s.slice(11));
              if (Array.isArray(gallery)) {
                const newGallery = [];
                for (let g = 0; g < gallery.length; g++) {
                  const gImg = gallery[g];
                  if (gImg && gImg.startsWith('data:')) {
                    const gUrl = await uploadBase64ToStorage(gImg, `${item.id}-gallery-${g}`);
                    newGallery.push(gUrl);
                    specsChanged = true;
                  } else {
                    newGallery.push(gImg);
                  }
                }
                newSpecs.push(`__IMAGES__:${JSON.stringify(newGallery)}`);
                continue;
              }
            } catch (err) {
              console.warn('  Error procesando galería en specs:', err);
            }
          }
          newSpecs.push(s);
        }

        if (specsChanged) {
          item.specs = JSON.stringify(newSpecs);
          modified = true;
          console.log(`  ✓ Galería migrada exitosamente a Storage`);
        }
      }
    }

    // Guardar en la base de datos si hubo cambios
    if (modified) {
      item.updated_at = new Date().toISOString();
      const patchRes = await fetch(INSFORGE_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': INSFORGE_CONFIG.apiKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify([item])
      });

      if (patchRes.ok) {
        console.log(`  ✓ Registro actualizado en la base de datos.`);
      } else {
        console.error(`  ✗ Error actualizando registro:`, patchRes.status, await patchRes.text());
      }
    } else {
      console.log(`  - No requería migración (ya usa URLs externas).`);
    }
  }

  // Comprobar nuevo tamaño
  const verifyRes = await fetch(INSFORGE_CONFIG.endpoint, {
    headers: { 'x-api-key': INSFORGE_CONFIG.apiKey }
  });
  const finalItems = await verifyRes.json();
  const finalSizeKB = Math.round(JSON.stringify(finalItems).length / 1024);
  console.log('----------------------------------------------------');
  console.log(`Migración completada con éxito.`);
  console.log(`Tamaño inicial: ${initialSizeKB} KB (~${(initialSizeKB/1024).toFixed(1)} MB)`);
  console.log(`Tamaño final:   ${finalSizeKB} KB (~${(finalSizeKB/1024).toFixed(2)} MB)`);
  console.log(`Reducción:      ${Math.round((1 - finalSizeKB/initialSizeKB) * 100)}% de espacio ahorrado`);
}

migrate().catch(console.error);
