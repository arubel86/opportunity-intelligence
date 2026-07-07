#!/usr/bin/env node
// Debug feature extraction on Encuentra24
import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('https://www.encuentra24.com/panama-en/real-estate?category=real-estate-for-sale', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await page.waitForSelector('.d3-ad-tile', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  const debug = await page.evaluate(() => {
    const tiles = document.querySelectorAll('.d3-ad-tile');
    const result = [];
    
    tiles.forEach((tile, i) => {
      if (i >= 3) return;
      const cardResult = { index: i, html: tile.innerHTML?.slice(0, 800), features: [] };
      
      // Check all possible feature class names
      tile.querySelectorAll('[class]').forEach(el => {
        const cls = el.className;
        if (typeof cls === 'string') {
          const text = el.textContent?.trim() || '';
          const isFeatureText = /\d+\s*m2/.test(text) || /^\d+(\.\d+)?$/.test(text) && text.length < 5;
          if (isFeatureText) {
            cardResult.features.push({ class: cls.slice(0, 80), text: text.slice(0, 30), tag: el.tagName });
          }
        }
      });
      
      result.push(cardResult);
    });
    
    return result;
  });
  
  console.log(JSON.stringify(debug, null, 2));
  await browser.close();
}

debug().catch(console.error);
