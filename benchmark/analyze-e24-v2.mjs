#!/usr/bin/env node
// Analyze Encuentra24 Bienes Raíces page structure
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function analyze() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ locale: 'es-PA', viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  
  // Try the Panama real estate page
  await page.goto('https://www.encuentra24.com/panama-en/real-estate', { 
    waitUntil: 'domcontentloaded', timeout: 30000 
  });
  await page.waitForTimeout(4000);
  
  const analysis = await page.evaluate(() => {
    const results = {};
    
    // All listing-related elements
    results.containers = [];
    document.querySelectorAll('[class]').forEach(el => {
      const cls = el.className;
      if (typeof cls === 'string') {
        const text = el.textContent?.trim() || '';
        // Look for price patterns in element text
        if (/\$\s*[\d,]+/.test(text) && el.children.length <= 2) {
          results.containers.push({
            tag: el.tagName,
            class: cls.slice(0, 100),
            text: text.slice(0, 100),
            childCount: el.children.length,
            inner: el.innerHTML?.slice(0, 200)
          });
        }
      }
    });
    
    // All article/card elements
    results.cards = [];
    (document.querySelectorAll('article, [class*="listing"], [class*="card"], [class*="property"], [class*="item"], [class*="ad-list"]')).forEach(el => {
      results.cards.push({
        tag: el.tagName,
        class: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        id: el.id || '',
        childCount: el.children.length,
        html: el.innerHTML?.slice(0, 300)
      });
    });
    
    // Links containing property info
    results.propertyLinks = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      const text = a.textContent?.trim() || '';
      if ((href.includes('real-estate/') || href.includes('inmueble') || href.includes('propiedad')) && text.length > 10) {
        results.propertyLinks.push({ href: href.slice(0, 120), text: text.slice(0, 80), class: a.className?.slice(0, 60) });
      }
    });
    
    return results;
  });
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  console.log('\n=== CONTAINERS WITH PRICES ===');
  console.log(JSON.stringify(analysis.containers.slice(0, 20), null, 2));
  console.log('\n=== PROPERTY LINKS ===');
  console.log(JSON.stringify(analysis.propertyLinks.slice(0, 15), null, 2));
  
  // Save HTML
  const html = await page.content();
  writeFileSync('/opt/data/hermes/benchmark/reports/e24-listings.html', html.slice(0, 50000));
  console.log('\nHTML saved (50K chars)');
  
  await browser.close();
}

analyze().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
