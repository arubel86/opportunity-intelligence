// Panama reference locations with quality scores for comparable matching
export interface LocationRef {
  province: string
  district: string
  corregimiento: string
  neighborhood: string
  lat: number
  lng: number
  avgPricePerM2: number
  qualityScore: number
}

export const PANAMA_LOCATIONS: LocationRef[] = [
  { province:'Panamá', district:'Panamá', corregimiento:'Bella Vista', neighborhood:'El Cangrejo', lat:8.9824, lng:-79.5199, avgPricePerM2:1800, qualityScore:8 },
  { province:'Panamá', district:'Panamá', corregimiento:'Bella Vista', neighborhood:'Vía Argentina', lat:8.9815, lng:-79.5212, avgPricePerM2:1750, qualityScore:8 },
  { province:'Panamá', district:'Panamá', corregimiento:'San Francisco', neighborhood:'San Francisco', lat:8.9789, lng:-79.5000, avgPricePerM2:2000, qualityScore:9 },
  { province:'Panamá', district:'Panamá', corregimiento:'San Francisco', neighborhood:'Costa del Este', lat:8.9770, lng:-79.4727, avgPricePerM2:2800, qualityScore:9 },
  { province:'Panamá', district:'Panamá', corregimiento:'San Francisco', neighborhood:'Marbella', lat:8.9820, lng:-79.5060, avgPricePerM2:2200, qualityScore:9 },
  { province:'Panamá', district:'Panamá', corregimiento:'Punta Pacífica', neighborhood:'Punta Pacífica', lat:8.9740, lng:-79.5050, avgPricePerM2:3200, qualityScore:10 },
  { province:'Panamá', district:'Panamá', corregimiento:'Bethania', neighborhood:'Bethania', lat:8.9900, lng:-79.5300, avgPricePerM2:1500, qualityScore:7 },
  { province:'Panamá', district:'Panamá', corregimiento:'Bethania', neighborhood:'El Dorado', lat:8.9940, lng:-79.5350, avgPricePerM2:1400, qualityScore:7 },
  { province:'Panamá', district:'Panamá', corregimiento:'Pueblo Nuevo', neighborhood:'Pueblo Nuevo', lat:8.9930, lng:-79.5180, avgPricePerM2:1300, qualityScore:6 },
  { province:'Panamá', district:'Panamá', corregimiento:'Pueblo Nuevo', neighborhood:'Campo Alegre', lat:8.9950, lng:-79.5150, avgPricePerM2:1600, qualityScore:7 },
  { province:'Panamá', district:'Panamá', corregimiento:'Parque Lefevre', neighborhood:'Parque Lefevre', lat:8.9880, lng:-79.4960, avgPricePerM2:1700, qualityScore:7 },
  { province:'Panamá', district:'Panamá', corregimiento:'Río Abajo', neighborhood:'Río Abajo', lat:9.0000, lng:-79.5000, avgPricePerM2:1200, qualityScore:6 },
  { province:'Panamá', district:'Panamá', corregimiento:'Juan Díaz', neighborhood:'Juan Díaz', lat:9.0200, lng:-79.4700, avgPricePerM2:1100, qualityScore:5 },
  { province:'Panamá', district:'Panamá', corregimiento:'Pedregal', neighborhood:'Pedregal', lat:9.0700, lng:-79.4500, avgPricePerM2:900, qualityScore:4 },
  { province:'Panamá', district:'San Miguelito', corregimiento:'San Miguelito', neighborhood:'San Miguelito', lat:9.0400, lng:-79.5000, avgPricePerM2:850, qualityScore:4 },
  { province:'Panamá', district:'Panamá', corregimiento:'Tocumen', neighborhood:'Tocumen', lat:9.0800, lng:-79.3800, avgPricePerM2:700, qualityScore:3 },
  { province:'Panamá Oeste', district:'Arraiján', corregimiento:'Arraiján', neighborhood:'Arraiján', lat:8.9500, lng:-79.6500, avgPricePerM2:800, qualityScore:4 },
  { province:'Panamá Oeste', district:'Arraiján', corregimiento:'Vista Alegre', neighborhood:'Vista Alegre', lat:8.9300, lng:-79.6800, avgPricePerM2:750, qualityScore:4 },
  { province:'Panamá Oeste', district:'Arraiján', corregimiento:'Juan Demóstenes Arosemena', neighborhood:'Brisas del Golf', lat:8.9400, lng:-79.6300, avgPricePerM2:850, qualityScore:4 },
  { province:'Panamá Oeste', district:'Arraiján', corregimiento:'Arraiján', neighborhood:'Villas de Roma', lat:8.9600, lng:-79.6600, avgPricePerM2:700, qualityScore:3 },
  { province:'Panamá Oeste', district:'La Chorrera', corregimiento:'La Chorrera', neighborhood:'La Chorrera', lat:8.8800, lng:-79.7800, avgPricePerM2:750, qualityScore:5 },
  { province:'Panamá Oeste', district:'La Chorrera', corregimiento:'El Arado', neighborhood:'El Arado', lat:8.8300, lng:-79.8300, avgPricePerM2:650, qualityScore:3 },
  { province:'Colón', district:'Colón', corregimiento:'Colón', neighborhood:'Colón Centro', lat:9.3600, lng:-79.9000, avgPricePerM2:500, qualityScore:2 },
  { province:'Panamá', district:'Panamá', corregimiento:'Don Bosco', neighborhood:'Don Bosco', lat:9.0100, lng:-79.4550, avgPricePerM2:1600, qualityScore:7 },
  { province:'Panamá', district:'Panamá', corregimiento:'San Francisco', neighborhood:'Coco del Mar', lat:8.9750, lng:-79.4900, avgPricePerM2:2500, qualityScore:9 },
  { province:'Panamá', district:'Panamá', corregimiento:'Obarrio', neighborhood:'Obarrio', lat:8.9800, lng:-79.5150, avgPricePerM2:2200, qualityScore:8 },
  { province:'Panamá Oeste', district:'Arraiján', corregimiento:'Burunga', neighborhood:'Burunga', lat:8.9100, lng:-79.7000, avgPricePerM2:600, qualityScore:3 },
  { province:'Panamá', district:'Panamá', corregimiento:'Panamá', neighborhood:'El Bosque', lat:8.9970, lng:-79.5280, avgPricePerM2:1400, qualityScore:6 },
  { province:'Panamá', district:'Panamá', corregimiento:'Las Mañanitas', neighborhood:'Las Mañanitas', lat:9.0600, lng:-79.4400, avgPricePerM2:650, qualityScore:3 },
  { province:'Panamá', district:'Panamá', corregimiento:'Santa Ana', neighborhood:'Santa Ana', lat:8.9570, lng:-79.5370, avgPricePerM2:1000, qualityScore:4 },
  { province:'Coclé', district:'Antón', corregimiento:'Antón', neighborhood:'Antón', lat:8.4000, lng:-80.2600, avgPricePerM2:550, qualityScore:3 },
  { province:'Chiriquí', district:'David', corregimiento:'David', neighborhood:'David', lat:8.4300, lng:-82.4300, avgPricePerM2:700, qualityScore:4 },
  { province:'Panamá', district:'San Miguelito', corregimiento:'Rufina Alfaro', neighborhood:'Rufina Alfaro', lat:9.0300, lng:-79.5100, avgPricePerM2:800, qualityScore:3 },
  { province:'Panamá', district:'San Miguelito', corregimiento:'Belisario Porras', neighborhood:'Belisario Porras', lat:9.0500, lng:-79.4900, avgPricePerM2:750, qualityScore:3 },
  { province:'Panamá', district:'Panamá', corregimiento:'Calidonia', neighborhood:'Calidonia', lat:8.9660, lng:-79.5300, avgPricePerM2:1100, qualityScore:5 },
]
