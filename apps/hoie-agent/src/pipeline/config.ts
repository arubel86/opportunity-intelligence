// Pipeline configuration - no database required
// Processes assets through HIL → HOIE in memory

export interface PipelineConfig {
  sourceName: string
  sourceConfig: {
    vertical: 'real_estate' | 'vehicles'
    baseUrl: string
    selectors: Record<string, string>
  }
  output: 'console' | 'json' | 'html'
}

export const PIPELINE_SOURCES = {
  encuentra24: {
    sourceName: 'encuentra24',
    sourceConfig: {
      vertical: 'real_estate',
      baseUrl: 'https://www.encuentra24.com.pa/categoria/inmuebles',
      selectors: {
        listing_container: 'article.item, .listing-item',
        item_link: 'a',
        pagination: 'a.next, .pagination-next',
        fields: {
          title: 'h2.title, .item-title',
          price: '.price, .item-price',
          location: '.location, .item-location',
          bedrooms: '.bedrooms, .item-bedrooms',
          bathrooms: '.bathrooms, .item-bathrooms',
          area: '.area, .item-area',
          images: '.gallery img, .item-images img'
        }
      }
    },
    output: 'console'
  }
} as const