const path = require('path');
const { test, expect } = require('../../utils/test.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { applyTextSpacing, expectTextSpacing, expectNoClippedText } = require('../../libs/text-spacing.cjs');

const origin = 'http://nala-a11y.test';
const root = path.resolve(__dirname, '../../..');
const files = [
  '/express/code/styles/styles.css',
  '/express/code/blocks/faqv2/faqv2.css',
  '/express/code/blocks/faqv2/faqv2.js',
  '/express/code/scripts/utils.js',
  '/express/code/icons/plus-heavy.svg',
  '/express/code/icons/minus-heavy.svg',
];

async function loadFixture(page, { longform, spacing }) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) throw new Error(`Unexpected external request: ${url.origin}`);
    if (url.pathname === '/') {
      await route.fulfill({ path: path.join(__dirname, 'fixtures/accessibility.html') });
    } else if (files.includes(url.pathname)) {
      await route.fulfill({ path: path.join(root, url.pathname) });
    } else if (url.pathname === '/libs/utils/utils.js') {
      await route.fulfill({
        contentType: 'text/javascript',
        body: "export const getConfig = () => ({ codeRoot: '/express/code' });",
      });
    } else if (url.pathname === '/libs/features/placeholders.js') {
      await route.fulfill({ contentType: 'text/javascript', body: "export const replaceKey = async (key) => { throw new Error('Unexpected placeholder: ' + key); };" });
    } else {
      throw new Error(`Unexpected fixture request: ${url.pathname}`);
    }
  });
  await page.goto(origin);
  if (spacing) await applyTextSpacing(page);
  await page.evaluate(async ({ isLongform, utilsPath, blockPath }) => {
    const { setLibs } = await import(utilsPath);
    setLibs('/libs');
    const block = document.querySelector('.faqv2');
    if (isLongform) block.classList.add('longform');
    const { default: decorate } = await import(blockPath);
    await decorate(block);
  }, {
    isLongform: longform,
    utilsPath: '/express/code/scripts/utils.js',
    blockPath: '/express/code/blocks/faqv2/faqv2.js',
  });
  await expect(page.getByRole('button', { name: 'How do I start a design?', exact: true })).toHaveAttribute('aria-expanded', 'true');
}

async function tab(page, browserName, backwards = false) {
  const modifiers = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+' : '';
  await page.keyboard.press(`${modifiers}${backwards ? 'Shift+' : ''}Tab`);
}

async function expectFocusIndicator(button) {
  const visible = await button.evaluate((element) => {
    for (let target = element; target && target.tagName !== 'BODY'; target = target.parentElement) {
      const style = getComputedStyle(target);
      if (target.matches(':focus-visible, :has(:focus-visible)')
        && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) return true;
    }
    return false;
  });
  expect(visible, 'Keyboard focus has an outline on the control or its wrapper').toBe(true);
}

for (const longform of [false, true]) {
  for (const width of [375, 1280]) {
    test.describe(`FAQv2 ${longform ? 'longform' : 'expandable'} ${width}px @faqv2 @a11y-regression @express`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const spacing of [false, true]) {
        test(`keyboard, semantics and live-region states${spacing ? ' with text spacing' : ''}`, async ({ page, browserName }, testInfo) => {
          await loadFixture(page, { longform, spacing });
          const block = page.locator('.faqv2');
          const first = block.getByRole('button', { name: 'How do I start a design?', exact: true });
          const second = block.getByRole('button', { name: 'Can I share my finished work?', exact: true });
          const panels = block.locator('.faqv2-content');
          const live = block.locator('[aria-live="polite"]');
          await expect(live).toHaveAttribute('aria-atomic', 'true');
          await expect(block.getByRole('heading', { level: 2, name: 'Common design questions' })).toBeVisible();
          for (let i = 0; i < 2; i++) {
            const button = block.getByRole('button').nth(i);
            await expect(button).toHaveAccessibleName(i === 0 ? 'How do I start a design?' : 'Can I share my finished work?');
            await expect(button).toHaveAttribute('aria-controls', await panels.nth(i).getAttribute('id'));
            await expect(panels.nth(i)).toHaveAttribute('aria-labelledby', await button.getAttribute('id'));
          }
          if (spacing) {
            await expectTextSpacing(block.locator('h2, button, .faqv2-content:not([aria-hidden="true"]) p'));
          }
          await tab(page, browserName);
          await expect(page.locator('#before')).toBeFocused();
          await tab(page, browserName);
          await expect(first).toBeFocused();
          await expectFocusIndicator(first);
          await page.keyboard.press('Space');
          await expect(first).toBeFocused();
          await expect(first).toHaveAttribute('aria-expanded', 'false');
          await expect(panels.first()).toHaveAttribute('aria-hidden', 'true');
          await expect(live).toHaveText('How do I start a design? closed');
          await expect(block.getByRole('link')).toHaveCount(0);
          await runAccessibilityTest({ page, testScope: block });

          await tab(page, browserName);
          await expect(second).toBeFocused();
          await page.keyboard.press('Enter');
          await expect(second).toBeFocused();
          await expect(second).toHaveAttribute('aria-expanded', 'true');
          await expect(panels.nth(1)).toHaveAttribute('aria-hidden', 'false');
          await expect(live).toHaveText('Can I share my finished work? opened');
          const link = block.getByRole('link', { name: 'Read the sharing guide', exact: true });
          await expect(link).toHaveAccessibleName('Read the sharing guide');
          await tab(page, browserName);
          await expect(link).toBeFocused();
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(`${origin}/#share`);
          await tab(page, browserName);
          await expect(page.locator('#after')).toBeFocused();
          await tab(page, browserName, true);
          await expect(link).toBeFocused();
          await tab(page, browserName, true);
          await expect(second).toBeFocused();
          await expect(async () => {
            const height = await panels.nth(1).evaluate((element) => element.scrollHeight - element.clientHeight);
            expect(height).toBeLessThanOrEqual(1);
          }).toPass();
          await expectNoClippedText(block);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
          await runAccessibilityTest({ page, testScope: block });
          if (spacing) {
            const screenshotPath = testInfo.outputPath('text-spacing-review.png');
            await block.screenshot({ path: screenshotPath });
            await testInfo.attach('Text spacing review evidence (not a visual baseline)', {
              path: screenshotPath,
              contentType: 'image/png',
            });
          }
          await tab(page, browserName, true);
          await expect(first).toBeFocused();
          await page.keyboard.press('Enter');
          await expect(first).toHaveAttribute('aria-expanded', 'true');
          await expect(second).toHaveAttribute('aria-expanded', 'false');
          await expect(panels.nth(1)).toHaveAttribute('aria-hidden', 'true');
          await expect(live).toHaveText('How do I start a design? opened');
          await tab(page, browserName);
          await expect(block.getByRole('link', { name: 'Read the getting started guide' })).toBeFocused();
        });
      }
    });
  }
}
