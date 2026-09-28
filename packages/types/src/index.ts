// @hermes/types — barrel export
// golden-dataset (v1) - base interface and datasets
export type { GoldenAsset } from './golden-dataset.js'
export { GOLDEN_REAL_ESTATE, GOLDEN_VEHICLES, GOLDEN_DATASET, validateAgainstGolden } from './golden-dataset.js'

// golden-dataset-v2 - extended
export type { GoldenAsset as GoldenAssetV2 } from './golden-dataset-v2.js'
export { GOLDEN_RE, GOLDEN_VEHICLES as GOLDEN_VEHICLES_V2, GOLDEN_ASSETS } from './golden-dataset-v2.js'

// schemas
export * from './schemas.js'
