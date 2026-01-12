const fs = require('fs');
const { chromium } = require('playwright');

async function loadHtml(src) {
  if (!src) throw new Error('loadHtml: missing src');
  if (src.startsWith('http')) {
    console.log(`🌐 Fetching HTML from: ${src}`);
    const res = await fetch(src);
    let html = await res.text();
    const looksDynamic = html.includes('<script') || html.includes('data-block-status="loading"');
    if (looksDynamic) {
      console.log('⚡ Detected dynamic page — rendering...');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(src, { waitUntil: 'networkidle' });
      html = await page.content();
      await browser.close();
    }
    return html;
  }
  console.log(`📂 Reading local HTML: ${src}`);
  return fs.readFileSync(src, 'utf-8');
}

module.exports = { loadHtml };
