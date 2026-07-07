// Asset Normalizer for Reality Benchmark
import crypto from 'node:crypto'

export class AssetNormalizer {
  normalize(rawListing, source) {
    const errors = []
    const asset = {
      assetId: rawListing.id || crypto.randomUUID(),
      source: source || rawListing.source || 'Encuentra24',
      sourceListingUrl: rawListing.sourceListingUrl || '',
      vertical: rawListing.propertyType ? 'real_estate' : (rawListing.make ? 'vehicles' : 'unknown'),
      title: this._normalizeString(rawListing.title),
      description: this._normalizeString(rawListing.description),
      priceAmount: this._parsePrice(rawListing.price, errors),
      currency: rawListing.currency || 'USD',
      location: this._normalizeLocation(rawListing.location, errors),
      sellerType: this._normalizeSellerType(rawListing.sellerType),
      condition: this._normalizeCondition(rawListing.condition),
      features: rawListing.features || [],
      listingDate: rawListing.listingDate || null,
      status: this._normalizeStatus(rawListing.status),
      normalizedAt: new Date().toISOString(),
      errors
    }

    if (asset.vertical === 'real_estate') {
      asset.propertyType = this._normalizePropertyType(rawListing.propertyType)
      asset.areaM2 = this._parseArea(rawListing.areaM2, errors)
      asset.bedrooms = this._parseInt(rawListing.bedrooms) || 0
      asset.bathrooms = this._parseInt(rawListing.bathrooms) || 0
    } else if (asset.vertical === 'vehicles') {
      asset.make = rawListing.make || 'Unknown'
      asset.model = rawListing.model || 'Unknown'
      asset.year = this._parseInt(rawListing.year) || 2020
      asset.kilometers = this._parseInt(rawListing.kilometers) || 0
      asset.fuel = rawListing.fuel || 'gasoline'
      asset.transmission = rawListing.transmission || 'automatic'
      asset.color = rawListing.color || 'N/D'
      if (rawListing.type) asset.type = rawListing.type
    }

    if (!asset.priceAmount || asset.priceAmount <= 0) {
      errors.push({ field: 'price', type: 'Invalid Price', detail: `Price is ${asset.priceAmount}` })
    }
    if (!asset.location || (!asset.location.lat && !asset.location.lng)) {
      errors.push({ field: 'location', type: 'Missing Coordinates', detail: 'No coordinates found' })
    }

    return { asset, errors }
  }

  generateAssetHash(asset) {
    const key = `${asset.title?.toLowerCase().trim()}|${asset.priceAmount}|${asset.location?.neighborhood || asset.location?.district || ''}`
    return crypto.createHash('md5').update(key).digest('hex')
  }

  validateRequired(asset) {
    const required = ['source', 'priceAmount', 'currency']
    if (asset.vertical === 'real_estate') {
      if (asset.propertyType !== 'lot') {
        required.push('bedrooms', 'bathrooms')
      }
      if (asset.areaM2 && asset.areaM2 > 0) {
        // area is nice-to-have but not strictly required for lots
      } else if (asset.propertyType !== 'lot') {
        required.push('areaM2')
      }
    } else if (asset.vertical === 'vehicles') {
      required.push('make', 'model', 'year')
    }

    const missing = required.filter(field => {
      const val = asset[field]
      return val === undefined || val === null || val === '' || val === 0
    })

    return { valid: missing.length === 0, missingFields: missing }
  }

  detectDuplicates(assets) {
    const hashMap = new Map()
    const duplicates = []

    for (const asset of assets) {
      const hash = this.generateAssetHash(asset)
      if (hashMap.has(hash)) {
        duplicates.push({
          original: hashMap.get(hash),
          duplicate: asset.assetId,
          hash
        })
      } else {
        hashMap.set(hash, asset.assetId)
      }
    }

    return duplicates
  }

  _parsePrice(val, errors) {
    if (typeof val === 'number') return val
    if (!val) {
      errors.push({ field: 'price', type: 'Invalid Price', detail: 'No price provided' })
      return 0
    }
    const cleaned = String(val).replace(/[$,]/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed) || parsed <= 0) {
      errors.push({ field: 'price', type: 'Invalid Price', detail: `Cannot parse: "${val}"` })
      return 0
    }
    return Math.round(parsed)
  }

  _parseArea(val, errors) {
    if (typeof val === 'number') return val
    if (!val) {
      errors.push({ field: 'area', type: 'Missing Area', detail: 'No area provided' })
      return 0
    }
    const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''))
    if (isNaN(parsed)) {
      errors.push({ field: 'area', type: 'Parsing Error', detail: `Cannot parse area: "${val}"` })
      return 0
    }
    return Math.round(parsed)
  }

  _parseInt(val) {
    if (!val && val !== 0) return null
    if (typeof val === 'number') return Math.round(val)
    const cleaned = String(val).replace(/[^0-9]/g, '')
    return parseInt(cleaned) || null
  }

  _normalizeString(val) {
    if (!val) return ''
    return String(val).trim()
  }

  _normalizeLocation(loc, errors) {
    if (!loc) {
      errors.push({ field: 'location', type: 'Missing Coordinates', detail: 'No location data' })
      return { province: null, district: null, corregimiento: null, neighborhood: null, lat: null, lng: null }
    }
    return {
      province: loc.province || null,
      district: loc.district || null,
      corregimiento: loc.corregimiento || null,
      neighborhood: loc.neighborhood || null,
      lat: this._parseFloat(loc.lat),
      lng: this._parseFloat(loc.lng)
    }
  }

  _parseFloat(val) {
    if (typeof val === 'number') return val
    if (!val) return null
    const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? null : parsed
  }

  _normalizePropertyType(val) {
    const map = {
      'apartment': 'apartment', 'apto': 'apartment', 'apartamento': 'apartment',
      'house': 'house', 'casa': 'house',
      'condo': 'condo', 'condominio': 'condo',
      'penthouse': 'penthouse',
      'townhouse': 'townhouse',
      'lot': 'lot', 'terreno': 'lot', 'land': 'lot'
    }
    return map[String(val).toLowerCase()] || val || 'unknown'
  }

  _normalizeSellerType(val) {
    const map = {
      'bank': 'bank', 'banco': 'bank',
      'owner': 'owner', 'dueño': 'owner', 'dueno': 'owner',
      'agency': 'agency', 'agencia': 'agency',
      'developer': 'developer', 'desarrollador': 'developer',
      'inheritance': 'inheritance', 'herencia': 'inheritance',
      'divorce': 'divorce', 'divorcio': 'divorce',
      'dealer': 'dealer', 'concesionario': 'dealer',
      'investor': 'investor', 'inversionista': 'investor',
      'import': 'import', 'importador': 'import'
    }
    return map[String(val).toLowerCase()] || val || 'unknown'
  }

  _normalizeCondition(val) {
    if (!val) return 'good'
    const map = {
      'new': 'new', 'nuevo': 'new',
      'excellent': 'excellent', 'excelente': 'excellent',
      'good': 'good', 'bueno': 'good',
      'fair': 'fair', 'regular': 'fair',
      'needs_repair': 'needs_repair', 'needs repair': 'needs_repair', 'necesita reparaciones': 'needs_repair',
      'renovation': 'renovation', 'remodel': 'renovation', 'remodelar': 'renovation'
    }
    return map[String(val).toLowerCase()] || 'good'
  }

  _normalizeStatus(val) {
    const map = {
      'active': 'active',
      'pending': 'pending',
      'sold': 'sold',
      'rented': 'rented',
      'inactive': 'inactive'
    }
    return map[String(val).toLowerCase()] || 'active'
  }
}
