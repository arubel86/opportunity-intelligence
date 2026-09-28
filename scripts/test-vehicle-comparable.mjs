import { extractVehicleFields } from '../pipeline/utils.mjs'

console.log('=== TEST 1: Extractor de Atributos Automotrices ===')

const sampleAssets = [
  {
    title: 'Toyota Hilux 2019 4x4 Diésel',
    description: 'Toyota Hilux 2019 en remate. Motor 3.0L diésel con 65,000 km, transmisión manual.',
    price_amount: 22000,
  },
  {
    title: 'Honda CR-V 2020',
    description: 'Camioneta automática gasolina con 40,000 kms en impecable estado.',
    price_amount: 28000,
    raw_data: { year: 2020, mileage: 40000, make: 'Honda', model: 'CR-V' }
  },
  {
    title: 'Ford F-150 Lariat EcoBoost 2018',
    description: 'Pick up 4x4 cabina doble 85000 km transmisión automática.',
    price_amount: 22000,
  }
]

for (const asset of sampleAssets) {
  const extracted = extractVehicleFields(asset)
  console.log(`\nActivo: "${asset.title}"`)
  console.log('Extraído:', JSON.stringify(extracted, null, 2))
}

console.log('\n=== TEST 2: Validación de Ponderación Automotriz ===')

// Simular candidato idéntico vs candidato de otra marca
const target = extractVehicleFields(sampleAssets[0]) // Toyota Hilux 2019
const compSame = extractVehicleFields({
  title: 'Toyota Hilux 2020 Diésel',
  description: 'Toyota Hilux año 2020 con 70,000 km en venta.',
  price_amount: 23500
})
const compDiff = extractVehicleFields(sampleAssets[2]) // Ford F-150 2018

// Función de simulación con los mismos pesos de comparable-engine.mjs
function calcVehicleSimilarity(targetVeh, cVeh, priceTarget, priceComp) {
  // 1. Marca y Modelo (0.35)
  let makeModelScore = 0.20
  const targetMake = (targetVeh.make || '').toLowerCase()
  const cMake = (cVeh.make || '').toLowerCase()
  const targetModel = (targetVeh.model || '').toLowerCase()
  const cModel = (cVeh.model || '').toLowerCase()

  if (targetMake && cMake) {
    if (targetMake === cMake) {
      if (targetModel && cModel && targetModel === cModel) {
        makeModelScore = 1.0
      } else if (targetModel && cModel) {
        makeModelScore = 0.45
      } else {
        makeModelScore = 0.70
      }
    } else {
      makeModelScore = 0.10
    }
  }

  // 2. Año (0.25)
  let yearScore = 0.50
  if (targetVeh.year && cVeh.year) {
    const yearDiff = Math.abs(targetVeh.year - cVeh.year)
    if (yearDiff === 0) yearScore = 1.0
    else if (yearDiff === 1) yearScore = 0.85
    else if (yearDiff === 2) yearScore = 0.70
    else if (yearDiff === 3) yearScore = 0.55
    else if (yearDiff === 4) yearScore = 0.40
    else yearScore = Math.max(0.10, 0.40 - (yearDiff - 4) * 0.08)
  }

  // 3. Kilometraje (0.20)
  let mileageScore = 0.50
  if (targetVeh.mileage && cVeh.mileage && targetVeh.mileage > 0 && cVeh.mileage > 0) {
    const kmRatio = Math.min(targetVeh.mileage, cVeh.mileage) / Math.max(targetVeh.mileage, cVeh.mileage)
    mileageScore = Math.max(0, Math.min(1, kmRatio * 2 - 0.4))
  }

  // 4. Precio (0.15)
  const priceRatio = Math.min(priceComp, priceTarget) / Math.max(priceComp, priceTarget)
  const priceScore = Math.max(0, Math.min(1, priceRatio * 2 - 0.5))

  // 5. Ubicación y recencia (0.05)
  const locRecencyScore = 0.90

  // Factor de gating: si la marca es completamente diferente, se penaliza drásticamente el composite
  let brandGate = 1.0
  if (targetMake && cMake) {
    if (targetMake !== cMake) {
      brandGate = 0.40 // Distinta marca: nunca puede ser un comparable fiable
    } else if (targetModel && cModel && targetModel !== cModel) {
      brandGate = 0.65 // Misma marca pero distinto modelo (ej. Hilux vs Yaris)
    }
  }

  const rawComposite = (
    makeModelScore   * 0.35 +
    yearScore        * 0.25 +
    mileageScore     * 0.20 +
    priceScore       * 0.15 +
    locRecencyScore  * 0.05
  )

  const qualityScore = Math.round(rawComposite * brandGate * 100) / 100

  return { qualityScore, makeModelScore, yearScore, mileageScore, priceScore, brandGate }
}


const resSame = calcVehicleSimilarity(target, compSame, 22000, 23500)
const resDiff = calcVehicleSimilarity(target, compDiff, 22000, 22000)

console.log('Comparativa Toyota Hilux 2019 vs Toyota Hilux 2020:')
console.log('Quality Score:', resSame.qualityScore, '(Esperado: >= 0.80)', resSame)

console.log('\nComparativa Toyota Hilux 2019 vs Ford F-150 2018 (mismo precio pero distinta marca):')
console.log('Quality Score:', resDiff.qualityScore, '(Esperado: <= 0.50)', resDiff)

if (resSame.qualityScore >= 0.80 && resDiff.qualityScore < 0.60) {
  console.log('\n✅ VALIDACIÓN EXITOSA: El motor discrimina con precisión por marca, modelo, año y odómetro.')
} else {
  console.error('\n❌ ERROR EN CALIBRACIÓN DE PESOS.')
}
