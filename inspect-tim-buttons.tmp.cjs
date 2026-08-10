const { chromium } = require('playwright');

const BASE = 'https://milo-buttons--da-express-milo--adobecom.aem.live';
const PAGES = [
  { path: '/drafts/echen/transparent-img-marquee-cta-variations', selector: '.transparent-img-marquee', label: 'dark-with-cta' },
  { path: '/drafts/echen/transparent-img-marquee-light', selector: '.transparent-img-marquee', label: 'light' },
];

function styleOf(el) {
  const cs = getComputedStyle(el);
  return {
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    borderColor: cs.borderColor,
    outline: cs.outline,
    outlineOffset: cs.outlineOffset,
    boxShadow: cs.boxShadow,
    classList: el.className,
  };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  for (const { path, selector, label } of PAGES) {
    console.log(`\n=== ${label} — ${BASE}${path} ===`);
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('status:', resp.status());
    await page.waitForSelector(selector, { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      document.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', (e) => e.preventDefault(), true);
      });
    });

    const blocks = page.locator(selector);
    const blockCount = await blocks.count();
    console.log('block instances:', blockCount);
    const block = blocks.nth(blockCount - 1);
    console.log('block class:', await block.getAttribute('class'));

    const buttons = block.locator('a.con-button, a.button');
    const count = await buttons.count();
    console.log('button count:', count);

    for (let i = 0; i < count; i += 1) {
      const btn = buttons.nth(i);
      const cls = await btn.getAttribute('class');
      const text = (await btn.textContent()).trim();
      console.log(`\n-- button[${i}] class="${cls}" text="${text}" --`);

      const base = await btn.evaluate(styleOf);
      console.log('default:', JSON.stringify(base));

      await btn.hover();
      await page.waitForTimeout(400);
      const hover = await btn.evaluate(styleOf);
      console.log('hover:       ', JSON.stringify(hover));

      // active via mouse only (no keyboard focus) - real touch/mouse-without-tab state
      const box = await btn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(400);
        const activeNoFocus = await btn.evaluate(styleOf);
        console.log('active(mouse):', JSON.stringify(activeNoFocus));
        await page.mouse.up();
      }
      await page.mouse.move(0, 0);
      await btn.evaluate((el) => el.blur());
      await page.waitForTimeout(100);

      await btn.focus();
      await page.waitForTimeout(400);
      const focus = await btn.evaluate(styleOf);
      console.log('focus:       ', JSON.stringify(focus));

      // active while focused - what a real mouse click looks like in Chrome
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(400);
        const activeFocused = await btn.evaluate(styleOf);
        console.log('active+focus:', JSON.stringify(activeFocused));
        await page.mouse.up();
      }
      await page.mouse.move(0, 0);
      await btn.evaluate((el) => el.blur());
    }
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
