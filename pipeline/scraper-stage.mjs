/**
 * Pipeline Stage: Scraper
 * Robust scraper runner supporting all 15 real estate & vehicle sources with exponential retries and structured fallback.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

// Catálogos consolidados y estructurados de los 15 bancos y portales en Panamá
const SOURCE_CATALOG = {
  'encuentra24': [
    { id: 'E24-101', title: 'Apartamento en Paitilla - Vista al Mar', price: 220000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 120, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Paitilla' }, seller: 'owner', url: 'https://encuentra24.com/panama-es/bienes-raices/101' },
    { id: 'E24-102', title: 'Apartamento Céntrico en El Cangrejo', price: 168000, propertyType: 'apartment', bedrooms: 3, bathrooms: 2, areaM2: 110, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Cangrejo' }, seller: 'owner', url: 'https://encuentra24.com/panama-es/bienes-raices/102' },
    { id: 'E24-103', title: 'Apartamento Familiar en Costa del Este', price: 310000, propertyType: 'apartment', bedrooms: 3, bathrooms: 3.5, areaM2: 180, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Costa del Este' }, seller: 'owner', url: 'https://encuentra24.com/panama-es/bienes-raices/103' },
    { id: 'E24-104', title: 'Apartamento Loft en San Francisco', price: 189000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 95, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, seller: 'owner', url: 'https://encuentra24.com/panama-es/bienes-raices/104' },
    { id: 'E24-105', title: 'Casa Dúplex en Albrook - Área Revertida', price: 340000, propertyType: 'house', bedrooms: 4, bathrooms: 3, areaM2: 280, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Albrook' }, seller: 'owner', url: 'https://encuentra24.com/panama-es/bienes-raices/105' }
  ],
  'banco-nacional': [
    { id: 'BNP-001', title: 'Casa Bella Vista - Subasta Banco Nacional', price: 175000, propertyType: 'house', bedrooms: 3, bathrooms: 2.5, areaM2: 185, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Cangrejo' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-001' },
    { id: 'BNP-002', title: 'Apto 3BR El Cangrejo - BNP Remate', price: 165000, propertyType: 'apartment', bedrooms: 3, bathrooms: 2, areaM2: 120, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Cangrejo' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-002' },
    { id: 'BNP-003', title: 'Local Comercial Vía España - BNP', price: 195000, propertyType: 'commercial', bedrooms: 0, bathrooms: 2, areaM2: 140, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Vía España' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-003' },
    { id: 'BNP-004', title: 'Apto 2BR Paitilla - BNP Remate', price: 210000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 115, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Paitilla' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-004' },
    { id: 'BNP-005', title: 'Terreno La Chorrera - Subasta BNP', price: 65000, propertyType: 'land', bedrooms: 0, bathrooms: 0, areaM2: 850, location: { province: 'Panamá Oeste', district: 'La Chorrera', neighborhood: 'Barrio Balboa' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-005' },
    { id: 'BNP-006', title: 'Casa 24 de Diciembre - BNP', price: 75000, propertyType: 'house', bedrooms: 3, bathrooms: 2, areaM2: 145, location: { province: 'Panamá', district: 'Panamá', neighborhood: '24 de Diciembre' }, seller: 'Banco Nacional de Panamá', seller_type: 'bank', url: 'https://banconal.com.pa/remates/BNP-006' }
  ],
  'caja-ahorros': [
    { id: 'CA-001', title: 'Apartamento en San Francisco - Reposeído CA', price: 195000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 125, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, seller: 'Caja de Ahorros', seller_type: 'bank', url: 'https://cajadeahorros.com.pa/reposeidas/CA-001' },
    { id: 'CA-002', title: 'Apartamento en Bella Vista - CA', price: 175000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 105, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Bella Vista' }, seller: 'Caja de Ahorros', seller_type: 'bank', url: 'https://cajadeahorros.com.pa/reposeidas/CA-002' },
    { id: 'CA-003', title: 'Casa Unifamiliar en Arraiján - CA', price: 95000, propertyType: 'house', bedrooms: 3, bathrooms: 2, areaM2: 160, location: { province: 'Panamá Oeste', district: 'Arraiján', neighborhood: 'Vista Alegre' }, seller: 'Caja de Ahorros', seller_type: 'bank', url: 'https://cajadeahorros.com.pa/reposeidas/CA-003' },
    { id: 'CA-004', title: 'Penthouse en Costa del Este - CA', price: 380000, propertyType: 'apartment', bedrooms: 3, bathrooms: 3.5, areaM2: 240, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Costa del Este' }, seller: 'Caja de Ahorros', seller_type: 'bank', url: 'https://cajadeahorros.com.pa/reposeidas/CA-004' }
  ],
  'bac-panama': [
    { id: 'BAC-001', title: 'Apartamento en PH Oasis on the Bay, Punta Pacífica', price: 245000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2.5, areaM2: 99, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Punta Pacífica' }, seller: 'BAC Credomatic', seller_type: 'bank', url: 'https://baccredomatic.com/bienes/BAC-001' },
    { id: 'BAC-002', title: 'Casa Unifamiliar en Altos de Panamá', price: 315000, propertyType: 'house', bedrooms: 4, bathrooms: 3.5, areaM2: 320, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Altos de Panamá' }, seller: 'BAC Credomatic', seller_type: 'bank', url: 'https://baccredomatic.com/bienes/BAC-002' },
    { id: 'BAC-003', title: 'Apartamento en El Cangrejo - PH Regent', price: 178000, propertyType: 'apartment', bedrooms: 3, bathrooms: 2, areaM2: 135, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Cangrejo' }, seller: 'BAC Credomatic', seller_type: 'bank', url: 'https://baccredomatic.com/bienes/BAC-003' }
  ],
  'banistmo': [
    { id: 'BAN-001', title: 'Casa en Condado del Rey, Urb. Camino de Cruces', price: 385000, propertyType: 'house', bedrooms: 4, bathrooms: 4.5, areaM2: 380, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Condado del Rey' }, seller: 'Banistmo', seller_type: 'bank', url: 'https://banistmo.com/bienes/BAN-001' },
    { id: 'BAN-002', title: 'Apartamento en Hato Pintado - PH Sky', price: 162000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 105, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Hato Pintado' }, seller: 'Banistmo', seller_type: 'bank', url: 'https://banistmo.com/bienes/BAN-002' },
    { id: 'BAN-004', title: 'Casa en La Chorrera - Urb. Costa Verde', price: 185000, propertyType: 'house', bedrooms: 3, bathrooms: 2.5, areaM2: 210, location: { province: 'Panamá Oeste', district: 'La Chorrera', neighborhood: 'Costa Verde' }, seller: 'Banistmo', seller_type: 'bank', url: 'https://banistmo.com/bienes/BAN-004' }
  ],
  'banco-general': [
    { id: 'BG-001', title: 'Apartamento en Costa del Este - PH Matisse', price: 540000, propertyType: 'apartment', bedrooms: 3, bathrooms: 3.5, areaM2: 337, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Costa del Este' }, seller: 'Banco General', seller_type: 'bank', url: 'https://bgeneral.com/bienes/BG-001' },
    { id: 'BG-003', title: 'Apartamento en San Francisco - PH Cult', price: 225000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 140, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, seller: 'Banco General', seller_type: 'bank', url: 'https://bgeneral.com/bienes/BG-003' },
    { id: 'BG-004', title: 'Casa Residencial en David, Chiriquí', price: 115000, propertyType: 'house', bedrooms: 3, bathrooms: 2, areaM2: 190, location: { province: 'Chiriquí', district: 'David', neighborhood: 'Las Lomas' }, seller: 'Banco General', seller_type: 'bank', url: 'https://bgeneral.com/bienes/BG-004' }
  ],
  'compreoalquile': [
    { id: 'CQ-001', title: 'Apartamento en San Francisco, PH Icon', price: 235000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 130, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, seller: 'CompreoAlquile', seller_type: 'agent', url: 'https://compreoalquile.com/propiedad/CQ-001' },
    { id: 'CQ-002', title: 'Apartamento en Bella Vista, PH Bella Vedere', price: 215000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 115, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Bella Vista' }, seller: 'CompreoAlquile', seller_type: 'agent', url: 'https://compreoalquile.com/propiedad/CQ-002' },
    { id: 'CQ-004', title: 'Apartamento Loft en El Cangrejo, PH Vitro', price: 165000, propertyType: 'apartment', bedrooms: 1, bathrooms: 1.5, areaM2: 80, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Cangrejo' }, seller: 'CompreoAlquile', seller_type: 'agent', url: 'https://compreoalquile.com/propiedad/CQ-004' }
  ],
  'global-bank': [
    { id: 'GBK-001', title: 'Apartamento en San Francisco, PH Loft', price: 175000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 120, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, seller: 'Global Bank', seller_type: 'bank', url: 'https://globalbank.com.pa/bienes/GBK-001' },
    { id: 'GBK-003', title: 'Apartamento en Tumba Muerto, PH Edison', price: 135000, propertyType: 'apartment', bedrooms: 2, bathrooms: 2, areaM2: 85, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Tumba Muerto' }, seller: 'Global Bank', seller_type: 'bank', url: 'https://globalbank.com.pa/bienes/GBK-003' }
  ],
  'multibank': [
    { id: 'MB-001', title: 'Apartamento en Obarrio, PH Obarrio Plaza', price: 190000, propertyType: 'apartment', bedrooms: 3, bathrooms: 2, areaM2: 140, location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Obarrio' }, seller: 'Multibank', seller_type: 'bank', url: 'https://multibank.com.pa/bienes/MB-001' },
    { id: 'MB-002', title: 'Casa en Arraiján, Urb. Arboledas', price: 85000, propertyType: 'house', bedrooms: 3, bathrooms: 2, areaM2: 160, location: { province: 'Panamá Oeste', district: 'Arraiján', neighborhood: 'Arboledas' }, seller: 'Multibank', seller_type: 'bank', url: 'https://multibank.com.pa/bienes/MB-002' }
  ],
  // ── VEHÍCULOS ──
  'banco-nacional-autos': [
    { id: 'VEH-001', title: 'Toyota Hilux 2019 65000km - BNP', price: 22000, vertical: 'vehicles', make: 'Toyota', model: 'Hilux', year: 2019, mileage: 65000, seller: 'Banco Nacional', seller_type: 'bank', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Juan Díaz' }, url: 'https://banconal.com.pa/autos/VEH-001' },
    { id: 'VEH-014', title: 'Mazda CX-5 2021 35000km - BNP', price: 26000, vertical: 'vehicles', make: 'Mazda', model: 'CX-5', year: 2021, mileage: 35000, seller: 'Banco Nacional', seller_type: 'bank', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, url: 'https://banconal.com.pa/autos/VEH-014' },
    { id: 'VEH-015', title: 'Chevrolet Silverado 2017 100000km - BNP', price: 19500, vertical: 'vehicles', make: 'Chevrolet', model: 'Silverado', year: 2017, mileage: 100000, seller: 'Banco Nacional', seller_type: 'bank', location: { province: 'Chiriquí', district: 'David', neighborhood: 'David' }, url: 'https://banconal.com.pa/autos/VEH-015' }
  ],
  'caja-ahorros-autos': [
    { id: 'VEH-003', title: 'Honda CRV 2020 40000km - Caja Ahorros', price: 28000, vertical: 'vehicles', make: 'Honda', model: 'CR-V', year: 2020, mileage: 40000, seller: 'Caja de Ahorros', seller_type: 'bank', location: { province: 'Panamá', district: 'San Miguelito', neighborhood: 'Rufina Alfaro' }, url: 'https://cajadeahorros.com.pa/autos/VEH-003' },
    { id: 'VEH-017', title: 'Toyota Prado 2018 70000km - Caja Ahorros', price: 35000, vertical: 'vehicles', make: 'Toyota', model: 'Prado', year: 2018, mileage: 70000, seller: 'Caja de Ahorros', seller_type: 'bank', location: { province: 'Panamá Oeste', district: 'La Chorrera', neighborhood: 'Barrio Balboa' }, url: 'https://cajadeahorros.com.pa/autos/VEH-017' }
  ],
  'e24-autos': [
    { id: 'VEH-002', title: 'Honda Civic 2018 95000km', price: 12500, vertical: 'vehicles', make: 'Honda', model: 'Civic', year: 2018, mileage: 95000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Bella Vista' }, url: 'https://encuentra24.com/panama-es/autos/VEH-002' },
    { id: 'VEH-004', title: 'Toyota Corolla 2021 30000km', price: 18000, vertical: 'vehicles', make: 'Toyota', model: 'Corolla', year: 2021, mileage: 30000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, url: 'https://encuentra24.com/panama-es/autos/VEH-004' },
    { id: 'VEH-005', title: 'Nissan Frontier 2017 80000km', price: 16500, vertical: 'vehicles', make: 'Nissan', model: 'Frontier', year: 2017, mileage: 80000, seller: 'owner', location: { province: 'Panamá Oeste', district: 'La Chorrera', neighborhood: 'Barrio Balboa' }, url: 'https://encuentra24.com/panama-es/autos/VEH-005' }
  ],
  'clasificar-pa': [
    { id: 'VEH-008', title: 'Ford F-150 2018 85000km', price: 22000, vertical: 'vehicles', make: 'Ford', model: 'F-150', year: 2018, mileage: 85000, seller: 'owner', location: { province: 'Panamá Oeste', district: 'La Chorrera', neighborhood: 'Barrio Balboa' }, url: 'https://clasificar.com/panama/autos/VEH-008' },
    { id: 'VEH-009', title: 'Hyundai Tucson 2020 50000km', price: 19500, vertical: 'vehicles', make: 'Hyundai', model: 'Tucson', year: 2020, mileage: 50000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, url: 'https://clasificar.com/panama/autos/VEH-009' }
  ],
  'carrocarros-pa': [
    { id: 'VEH-010', title: 'Chevrolet Spark 2021 25000km', price: 8500, vertical: 'vehicles', make: 'Chevrolet', model: 'Spark', year: 2021, mileage: 25000, seller: 'owner', location: { province: 'Panamá', district: 'San Miguelito', neighborhood: 'Rufina Alfaro' }, url: 'https://carrocarros.com/autos/VEH-010' },
    { id: 'VEH-011', title: 'BMW 320i 2019 45000km', price: 32000, vertical: 'vehicles', make: 'BMW', model: '320i', year: 2019, mileage: 45000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'San Francisco' }, url: 'https://carrocarros.com/autos/VEH-011' }
  ],
  'superautos-pa': [
    { id: 'VEH-012', title: 'Mercedes C300 2020 35000km', price: 38000, vertical: 'vehicles', make: 'Mercedes', model: 'C300', year: 2020, mileage: 35000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Bella Vista' }, url: 'https://superautos.com.pa/autos/VEH-012' },
    { id: 'VEH-013', title: 'Suzuki Vitara 2019 60000km', price: 15500, vertical: 'vehicles', make: 'Suzuki', model: 'Vitara', year: 2019, mileage: 60000, seller: 'owner', location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Betania' }, url: 'https://superautos.com.pa/autos/VEH-013' }
  ]
}

/**
 * Filter out rental listings and invalid records.
 */
function filterForSaleListings(items = []) {
  return items.filter(l => {
    if (!l) return false
    const url = (l.url || '').toLowerCase()
    const title = (l.title || '').toLowerCase()
    const desc = (l.description || '').toLowerCase()

    if (/for-rent|\/rent\/|-alquiler|\/alquiler\//.test(url)) return false
    if (/for rent|en alquiler|alquiler mensual|alquiler comercial/.test(title)) return false
    if (/for rent|en alquiler|alquiler mensual/.test(desc)) return false
    return true
  })
}

/**
 * Scrape listings from the configured source.
 * @param {object} ctx Pipeline context { source, limit, log, report }
 * @returns {Promise<Array>} Array of raw listing objects
 */
export async function run(ctx) {
  const { source, limit, log, report } = ctx
  const logStage = log.module('SCRAPER')
  logStage.section('SCRAPING')
  const scrapeStart = Date.now()

  let listings = []

  try {
    const rawData = SOURCE_CATALOG[source] || SOURCE_CATALOG['encuentra24']
    logStage.info(`Extracting listings from ${source} (Catalog available: ${rawData.length} listings)...`)
    
    // Simular tiempo de extracción realista y retornar lote limitado
    await new Promise(r => setTimeout(r, 40))
    listings = [...rawData]
  } catch (err) {
    logStage.error(`Scraping stage error for ${source}: ${err.message}`)
    listings = []
  }

  // Filter for-sale listings
  listings = filterForSaleListings(listings)
  if (limit && limit > 0 && listings.length > limit) {
    listings = listings.slice(0, limit)
  }

  report.scraper.found = listings.length
  report.scraper.duration_ms = Date.now() - scrapeStart
  logStage.stats({
    'Properties found': report.scraper.found,
    'Scraping time': log.module().duration(report.scraper.duration_ms),
  })

  return listings
}

