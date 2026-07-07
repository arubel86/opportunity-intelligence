#!/usr/bin/env node
// Analyze Encuentra24 page structure
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ locale: 'es-PA' });
  
  console.log('📡 Navegando a Encuentra24...\n');
  
  await page.goto('https://www.encuentra24.com/panama/bienes-raices-venta', { 
    waitUntil: 'domcontentloaded', timeout: 30000 
  });
  await page.waitForTimeout(5000);
  
  console.log('URL final:', page.url());
  console.log('Título:', await page.title());
  
  // Get the full HTML structure for analysis
  const analysis = await page.evaluate(() => {
    // 1. Find all links containing property listings
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const propertyLinks = allLinks
      .filter(a => a.href.match(/\/panama\/(?!search|register|login)/) && !a.href.includes('-es/'))
      .map(a => ({ href: a.href, text: a.textContent?.trim().slice(0, 80), class: a.className?.slice(0, 100) }));
    
    // 2. Find all cards/listing containers
    const cards = [];
    document.querySelectorAll('[class]').forEach(el => {
      const cls = el.className;
      if (typeof cls === 'string' && 
          (cls.includes('card') || cls.includes('listing') || cls.includes('property') || 
           cls.includes('item') || cls.includes('post') || cls.includes('ad'))) {
        cards.push(cls.slice(0, 120));
      }
    });
    
    // 3. Find price patterns
    const priceElements = [];
    document.querySelectorAll('[class]').forEach(el => {
      const text = el.textContent?.trim() || '';
      if (/\$[\d,]+/.test(text) && el.children.length === 0) {
        const cls = typeof el.className === 'string' ? el.className.slice(0, 120) : '';
        priceElements.push({ text: text.slice(0, 60), tag: el.tagName, class: cls });
      }
    });
    
    // 4. Find main content containers
    const mainContainers = [];
    document.querySelectorAll('main, [role="main"], .content, .container, .wrapper').forEach(el => {
      mainContainers.push({
        tag: el.tagName,
        id: el.id || '',
        class: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
        childCount: el.children.length,
        textLength: el.textContent?.length || 0
      });
    });
    
    return {
      url: window.location.href,
      title: document.title,
      linkCount: allLinks.length,
      propertyLinks: propertyLinks.slice(0, 20),
      cards: [...new Set(cards)].slice(0, 30),
      priceElements: priceElements.slice(0, 15),
      mainContainers
    };
  });
  
  console.log('\n=== ANÁLISIS ===');
  console.log(JSON.stringify(analysis, null, 2));
  
  // Get a sample of the page HTML
  const htmlSample = await page.evaluate(() => {
    return document.querySelector('body')?.innerHTML?.slice(0, 5000) || '';
  });
  console.log('\n=== HTML SAMPLE (first 5000 chars) ===');
  console.log(htmlSample);
  
  await browser.close();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
