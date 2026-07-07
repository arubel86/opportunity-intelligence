#!/usr/bin/env node
// Encuentra24 Real Scraper - v3 with corrected URL for 2025 site
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'https://www.encuentra24.com';

export class Encuentra24Scraper {
  async initialize() {
    const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/data/hermes/.browsers';
    this.browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'en-PA',
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await this.context.newPage();
    return true;
  }

  async scrapeListings(maxItems = 10) {
    const properties = [];

    try {
      console.log('  → Navigating to Encuentra24 real estate listings...');
      // Use the English URL — Spanish URL now returns 404
      await this.page.goto(`${BASE}/panama-en/real-estate?category=real-estate-for-sale`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      await this.page.waitForSelector('.d3-ad-tile', { timeout: 15000 }).catch(() => {
        console.log('  → No .d3-ad-tile found, page may have changed layout');
      });
      await this.page.waitForTimeout(3000);

      const cards = await this.page.evaluate((max) => {
        const results = [];
        // Get ALL ad tiles, not just featured ones
        const tiles = document.querySelectorAll('.d3-ad-tile--bordered');
        
        // Also try getting non-featured tiles from a broader selector
        const allTiles = tiles.length > 0 ? tiles : document.querySelectorAll('.d3-ad-tile:not(.d3-ad-tile--feat-super):not(.d3-ad-tile--feat-xl)');
        
        // If we still have too many featured tiles, try getting tiles from the main listing area
        let selectedTiles = allTiles;
        const mainList = document.querySelector('[class*=\"listing\"], [class*=\"grid\"], .d3-top-selection__tiles + *');
        if (mainList) {
          const listTiles = mainList.querySelectorAll('.d3-ad-tile--bordered');
          if (listTiles.length > 0) selectedTiles = listTiles;
        }

        selectedTiles.forEach((tile) => {
          // Price from the dedicated element
          const priceEl = tile.querySelector('.d3-ad-tile__price');
          const priceText = priceEl?.textContent?.trim() || '';

          // Title — use the dedicated title element
          const titleEl = tile.querySelector('.d3-ad-tile__title');
          const title = titleEl?.textContent?.trim() || '';

          // Seller name
          const sellerEl = tile.querySelector('.d3-ad-tile__seller span');
          const seller = sellerEl?.textContent?.trim() || '';

          // URL from the closest anchor (look for a link inside the tile)
          let url = '';
          const descLink = tile.querySelector('.d3-ad-tile__description');
          const linkEl = descLink?.closest('a') || tile.querySelector('a[href*="/panama-en/"]');
          if (linkEl?.href) url = linkEl.href;

          // Short description
          const descEl = tile.querySelector('.d3-ad-tile__short-description');
          const description = descEl?.textContent?.trim() || '';

          // Location
          let neighborhood = '';
          const locEl = tile.querySelector('.d3-ad-tile__location');
          if (locEl) {
            // Remove nested elements (SVG icons, compare/favorite text)
            const locClone = locEl.cloneNode(true);
            locClone.querySelectorAll('svg, use, .tool-compare, .tool-favorite').forEach(el => el.remove());
            neighborhood = locClone.textContent?.trim() || '';
          }

          // Details (sqm, bedrooms, bathrooms)
          const detailItems = tile.querySelectorAll('.d3-ad-tile__details-item');
          const details = Array.from(detailItems).map(d => d.textContent?.trim() || '');

          results.push({ title, price: priceText, seller, neighborhood, description: description.slice(0, 400), details, url });
        });

        return results.slice(0, max);
      }, maxItems);

      console.log(`  → Found ${cards.length} cards`);

      for (const card of cards) {
        if (!card.url) continue;

        // Parse price — strip currency symbols (keep digits, commas, dots), take first token.
        // The price element may include extra text like "(Reduced 6%)", so we must
        // extract the FIRST contiguous [0-9,.] token only and sanity-check it.
        const priceRaw = String(card.price || '');
        const priceClean = priceRaw.replace(/[^0-9,.]/g, ' ').trim();
        const priceMatch = priceClean.match(/\d[\d,.]*\d|\d/);
        let price = priceMatch ? parseInt(priceMatch[0].replace(/[,.]/g, '')) : 0;
        // If the first token is suspiciously small (< $1,000) we likely picked a
        // fragment (e.g. the "6" from "Reduced 6%") — fall back to the largest
        // token that looks like a real-estate price (>= $1,000).
        const allTokens = priceClean.match(/\d[\d,.]*\d|\d/g) || [];
        if (price > 0 && price < 1000 && allTokens.length > 1) {
          const plausible = allTokens
            .map(t => parseInt(t.replace(/[,.]/g, '')))
            .filter(n => n >= 1000)
            .sort((a, b) => b - a);
          if (plausible.length > 0) price = plausible[0];
        }

        // Skip rentals (price < $8,000 and contains monthly indicators)
        const isRental = price < 8000 || 
          card.description.toLowerCase().includes('rent') || 
          card.description.toLowerCase().includes('alquiler') ||
          card.price.toLowerCase().includes('/month') ||
          card.price.toLowerCase().includes('/mo');
        if (isRental) {
          console.log(`  → Skipping rental: $${price} - ${card.title?.slice(0, 40)}`);
          continue;
        }

        // Parse details (sqm, bedrooms, bathrooms, parking)
        let areaM2 = 0, bedrooms = 0, bathrooms = 0, parking = 0;
        for (const d of card.details) {
          const m2Match = d.match(/^([\d.]+)\s*m/i);
          if (m2Match) { areaM2 = parseFloat(m2Match[1]); continue; }
          
          // Try to parse numeric-only and text details
          const cleaned = d.replace(/[^0-9.]/g, '');
          const num = parseFloat(cleaned);
          
          if (!isNaN(num)) {
            if (d.toLowerCase().includes('bed') || d.toLowerCase().includes('dorm')) {
              if (!bedrooms) bedrooms = num;
            } else if (d.toLowerCase().includes('bath') || d.toLowerCase().includes('bañ')) {
              if (!bathrooms) bathrooms = num;
            } else if (d.toLowerCase().includes('park') || d.toLowerCase().includes('estac')) {
              parking = num;
            } else if (num >= 10) {
              parking = num;
            } else {
              if (!bedrooms) bedrooms = num;
              else if (!bathrooms) bathrooms = num;
              else parking = num;
            }
          }
        }

        // Determine property type from URL
        let propertyType = 'property';
        if (card.url.includes('house') || card.url.includes('homes')) propertyType = 'house';
        else if (card.url.includes('apartment') || card.url.includes('condo')) propertyType = 'apartment';
        else if (card.url.includes('land') || card.url.includes('lot')) propertyType = 'land';
        else if (card.url.includes('commercial') || card.url.includes('comercial')) propertyType = 'commercial';
        else if (card.url.includes('office')) propertyType = 'commercial';

        // Seller — if empty, try extracting from title
        const seller = card.seller || '';

        // Determine seller type
        const sellerText = (seller || card.title || '').toLowerCase();
        const isAgent = sellerText.includes('realty') || 
                       sellerText.includes('real estate') ||
                       sellerText.includes('inversiones') ||
                       sellerText.includes('properties') ||
                       sellerText.includes('inmobiliaria') ||
                       sellerText.includes('realtor') ||
                       sellerText.includes('realestate');

        properties.push({
          id: `E24-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: 'Encuentra24',
          title: card.title || 'Property',
          description: card.description,
          price,
          currency: 'USD',
          propertyType,
          bedrooms,
          bathrooms,
          areaM2,
          parking,
          location: {
            neighborhood: card.neighborhood || '',
            province: 'Panama',
            district: ''
          },
          seller: seller,
          seller_type: isAgent ? 'agent' : 'owner',
          url: card.url,
          scrapedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('  ✗ Error scraping:', e.message);
    }

    return properties;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

async function main() {
  const count = parseInt(process.argv[2]) || 10;
  console.log(`\n📡 Scraping ${count} properties from Encuentra24...\n`);

  const scraper = new Encuentra24Scraper();
  await scraper.initialize();
  const properties = await scraper.scrapeListings(count);
  await scraper.close();

  console.log(`\n✅ ${properties.length} properties extracted\n`);
  properties.forEach((p, i) => {
    const loc = Object.values(p.location).filter(Boolean).join(', ') || 'N/A';
    console.log(`  ${i+1}. ${p.title?.slice(0,60)}: $${p.price.toLocaleString()} | ${p.areaM2}m2 | ${p.bedrooms}bd | ${p.bathrooms}ba | ${loc}`);
  });

  const output = `/opt/data/hermes/benchmark/reports/scraped-${Date.now()}.json`;
  writeFileSync(output, JSON.stringify(properties, null, 2));
  console.log(`\n→ Saved: ${output}\n`);
}

if (process.argv[1]?.endsWith('e24-scraper.mjs')) {
  main().catch(console.error);
}

export default Encuentra24Scraper;
