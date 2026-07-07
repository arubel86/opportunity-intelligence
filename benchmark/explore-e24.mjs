#!/usr/bin/env node
// Explore Encuentra24 navigation
import { chromium } from 'playwright';

async function explore() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ locale: 'es-PA' });
  
  // Start at homepage and find real estate section
  await page.goto('https://www.encuentra24.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('=== HOMEPAGE NAVIGATION ===\n');
  
  const links = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      const text = a.textContent?.trim().slice(0, 60);
      if (href && (href.includes('bienes') || href.includes('inmueble') || href.includes('raices') || href.includes('real-estate'))) {
        results.push({ href, text });
      }
    });
    return results;
  });
  
  console.log('Real estate links found:', JSON.stringify(links, null, 2));
  
  // Try all main nav links
  const allNavLinks = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('.d3-header__navigation-item a, .d3-header__link, nav a').forEach(a => {
      const href = a.getAttribute('href');
      const text = a.textContent?.trim().slice(0, 50);
      if (href && !href.startsWith('javascript') && !href.startsWith('#')) {
        results.push({ href, text, class: a.className?.slice(0, 60) });
      }
    });
    return results;
  });
  
  console.log('\n=== ALL NAVIGATION LINKS ===');
  console.log(JSON.stringify(allNavLinks, null, 2));
  
  await browser.close();
}

explore().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
