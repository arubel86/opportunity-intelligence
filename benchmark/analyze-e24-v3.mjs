#!/usr/bin/env node
// Deep analysis of Encuentra24 listing cards
import { chromium } from 'playwright';

async function deepAnalyze() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ locale: 'es-PA', viewport: { width: 1920, height: 1080 } });
  
  // Go directly to a listing search page
  await page.goto('https://www.encuentra24.com/panama-en/real-estate?category=real-estate-for-sale', { 
    waitUntil: 'domcontentloaded', timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  
  const cards = await page.evaluate(() => {
    // Find all d3-ad-tile elements
    const tiles = document.querySelectorAll('.d3-ad-tile');
    const results = [];
    tiles.forEach((tile, idx) => {
      const html = tile.innerHTML?.slice(0, 500);
      const price = tile.querySelector('.d3-ad-tile__price')?.textContent?.trim();
      const title = tile.querySelector('.d3-ad-tile__description')?.textContent?.trim();
      const desc = tile.querySelector('.d3-ad-tile__short-description')?.textContent?.trim();
      const seller = tile.querySelector('.d3-ad-tile__seller')?.textContent?.trim();
      const img = tile.querySelector('img')?.src;
      const link = tile.querySelector('a.d3-ad-tile__description')?.href;
      const features = tile.querySelectorAll('.d3-ad-tile__feature');
      const featureText = Array.from(features).map(f => f.textContent?.trim()).filter(Boolean);
      
      results.push({
        idx, price, title, desc: desc?.slice(0, 100), seller,
        img: img?.slice(0, 100), link, features: featureText,
        html: html?.slice(0, 300)
      });
    });
    return results;
  });
  
  console.log(`\n=== FOUND ${cards.length} LISTING CARDS ===\n`);
  cards.forEach((c, i) => {
    console.log(`--- Card ${i+1} ---`);
    console.log(`  Title: ${c.title}`);
    console.log(`  Price: ${c.price}`);
    console.log(`  Features: ${c.features.join(', ')}`);
    console.log(`  Seller: ${c.seller}`);
    console.log(`  Link: ${c.link}`);
    console.log(`  Desc: ${c.desc}`);
    console.log();
  });
  
  // If we found a detail link, analyze it
  if (cards.length > 0 && cards[0].link) {
    console.log('\n=== ANALYZING DETAIL PAGE ===');
    await page.goto(cards[0].link, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const detail = await page.evaluate(() => {
      const results = {};
      
      // Title
      results.title = document.title;
      
      // Price
      const priceEl = document.querySelector('[class*="price"], .d3-ad-tile__price, [class*="Price"]');
      results.price = priceEl?.textContent?.trim();
      
      // All elements with important data
      const allElements = [];
      document.querySelectorAll('[class]').forEach(el => {
        const cls = el.className;
        if (typeof cls === 'string') {
          const text = el.textContent?.trim() || '';
          if (text.length > 3 && text.length < 200 && el.children.length <= 1) {
            allElements.push({ tag: el.tagName, class: cls.slice(0, 100), text: text.slice(0, 150) });
          }
        }
      });
      
      results.elements = allElements.filter(
        (e, i, arr) => arr.findIndex(x => x.text === e.text && x.class === e.class) === i
      ).slice(0, 50);
      
      // JSON-LD structured data
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      results.jsonld = [];
      scripts.forEach(s => {
        try { results.jsonld.push(JSON.parse(s.textContent || '')); } catch(e) {}
      });
      
      return results;
    });
    
    console.log(JSON.stringify(detail, null, 2).slice(0, 5000));
  }
  
  await browser.close();
}

deepAnalyze().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
