import { createAdminClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.INSFORGE_URL || 'https://insforge.aizprua.com';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_2bed7411a0830c9985681c4a5ccf2dadc81df1c78a3f30b8e8710d64ecb2d13f';

const DEFAULT_INVENTORY = [
  {
    id: 'prop-1',
    category: 'real_estate',
    title: 'Condominio de Lujo en Bella Vista',
    location: 'Calle 44 Este, Bella Vista, Panamá',
    price: 350000,
    market_price: 410000,
    badge: '-15% Bajo Avalúo',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    specs: ['145 m²', '3 Recámaras', '2.5 Baños', '2 Estac.'],
    status: 'available',
    landing_url: '../landings/landing1.html?id=OI-RE-2026'
  },
  {
    id: 'prop-2',
    category: 'real_estate',
    title: 'Apartamento Frente al Mar en Punta Pacífica',
    location: 'Punta Pacífica, Ciudad de Panamá',
    price: 690000,
    market_price: 820000,
    badge: 'Oportunidad VIP',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    specs: ['320 m²', '4 Recámaras', '4.5 Baños', '3 Estac.'],
    status: 'available',
    landing_url: '../landings/landing1.html?id=OI-RE-2027'
  },
  {
    id: 'prop-3',
    category: 'real_estate',
    title: 'Beachfront Apartment en Playa Escondida',
    location: 'Playa Escondida Resort, Costa Arriba, Colón',
    price: 400000,
    market_price: 490000,
    badge: 'Adjudicación Bancaria',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
    specs: ['185 m²', '3 Recámaras', '3 Baños', 'Piscina Infinity'],
    status: 'sold',
    landing_url: '../landings/landing1.html?id=OI-RE-PLAYA'
  },
  {
    id: 'car-1',
    category: 'vehicles',
    title: 'Toyota Hilux 4x4 Diésel 2.8L',
    location: 'Bella Vista / San Francisco, Panamá',
    price: 24500,
    market_price: 31000,
    badge: '-21% Debajo de Mercado',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    specs: ['Año 2022', '48,000 km', 'Manual 6 Vel', 'Diésel 4x4'],
    status: 'available',
    landing_url: '../landings/landing2.html?id=OI-AUTO-2022'
  },
  {
    id: 'car-2',
    category: 'vehicles',
    title: 'Toyota Land Cruiser Prado TXL Diésel',
    location: 'Costa del Este, Panamá',
    price: 69500,
    market_price: 78000,
    badge: 'Inspección 50 Pts',
    image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80',
    specs: ['Año 2023', '25,000 km', 'Automático', 'Diésel 4x4'],
    status: 'available',
    landing_url: '../landings/landing2.html?id=OI-AUTO-PRADO'
  },
  {
    id: 'car-3',
    category: 'vehicles',
    title: 'MINI Cooper S John Cooper Works',
    location: 'Costa del Este, Panamá',
    price: 40000,
    market_price: 49000,
    badge: '-27% Ganga',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    specs: ['Año 2023', '21,000 km', 'Automático', 'Gasolina Turbo'],
    status: 'sold',
    landing_url: '../landings/landing2.html?id=OI-AUTO-MINI'
  }
];

async function seed() {
  console.log(`Seeding catalog items to InsForge at ${INSFORGE_URL}...`);
  const admin = createAdminClient({
    baseUrl: INSFORGE_URL,
    apiKey: INSFORGE_API_KEY
  });

  const payload = DEFAULT_INVENTORY.map(item => ({
    id: item.id,
    category: item.category,
    title: item.title,
    price: item.price,
    market_price: item.market_price,
    location: item.location,
    image: item.image,
    badge: item.badge,
    status: item.status,
    landing_url: item.landing_url,
    specs: JSON.stringify(item.specs)
  }));

  const { data, error } = await admin.database.from('catalog_assets').upsert(payload, { onConflict: 'id' }).select('*');
  if (error) {
    console.error('Error seeding catalog:', error);
    process.exit(1);
  }
  console.log(`✅ Successfully seeded ${data.length} catalog items into InsForge!`);
  for (const item of data) {
    console.log(`  - [${item.category}] ${item.title} ($${item.price}) -> ${item.status}`);
  }
}

seed().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
