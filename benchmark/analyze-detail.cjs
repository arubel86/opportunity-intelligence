const { chromium } = require('playwright')
;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  // Visit a specific listing detail page
  const url = 'https://www.encuentra24.com/panama-es/bienes-raices-venta-de-propiedades-apartamentos/apartamento-a-estrenar-en-el-cangrejo/32564990'

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(5000)

  console.log('Title:', await page.title())
  console.log('URL:', page.url())

  // Extract structured data from the page
  const data = await page.evaluate(() => {
    const text = document.body.innerText
    
    // Try to find structured data in a more targeted way
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    
    // Look for price
    const priceLine = lines.find(l => /^\$\s*[0-9,]+/.test(l))
    
    // Find the listing details section
    const detailsStart = lines.findIndex(l => l.includes('Detalles') || l.includes('Características'))
    const detailsSection = detailsStart >= 0 ? lines.slice(detailsStart, detailsStart + 40) : []
    
    // Find location
    const locationLine = lines.find(l => l.includes('Ubicación') || l.includes('Dirección'))
    
    return {
      priceLine,
      detailsSection,
      locationLine,
      lines: lines.slice(0, 80).map((l, i) => `${i}: ${l}`)
    }
  })

  console.log('\nPrice line:', data.priceLine)
  console.log('\nLocation:', data.locationLine)
  console.log('\nDetails section:', data.detailsSection?.join(' | '))
  console.log('\n\nPage structure (first 80 lines):')
  data.lines.forEach(l => console.log(l))

  await browser.close()
})()
