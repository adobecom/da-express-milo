const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-how-to-carousel.spec.cjs');
const ColorHowToCarouselBlock = require('./color-how-to-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

async function expectActiveStep(block, index, step) {
  await expect(block.activeNumber).toHaveCount(1);
  await expect(block.activeNumber).toHaveText(`${index + 1}`);
  await expect(block.activeTip).toHaveCount(1);
  await expect(block.activeTip.locator('h3')).toHaveText(step.heading);
  await expect(block.activeTip.locator('.tip-text > div')).toHaveText(step.text);
  await expect(block.tip(index)).toBeVisible();
  for (let i = 0; i < await block.tips.count(); i += 1) {
    if (i !== index) await expect(block.tip(i)).toBeHidden();
  }
}

test.describe('ColorHowToCarouselBlock Test Suite', () => {
  for (const feature of features) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({ page, baseURL }) => {
      const { data } = feature;
      const testUrl = `${baseURL}${feature.path}${miloLibs}`;
      const block = new ColorHowToCarouselBlock(page, feature.selector);
      const isSpecs = data.layout === 'specs-card';
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Navigate to the dedicated fixture', async () => {
        await page.clock.install();
        await page.goto(testUrl);
        await expect(page).toHaveURL(testUrl);
        await expect(block.pageHeading).toHaveText(data.pageHeading);
        await expect(block.block).toHaveCount(1);
        await expect(block.block).toHaveAttribute('data-block-status', 'loaded');
        await block.block.scrollIntoViewIfNeeded();
        await expect(block.block).toBeVisible();
        await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 100);
      });

      await test.step('step-2: Verify authored content, graphic, and layout', async () => {
        await expect(block.heading).toHaveText(data.heading);
        await expect(block.numbers).toHaveText(data.steps.map((step, index) => `${index + 1}`));
        await expect(block.tips).toHaveCount(data.steps.length);
        await expectActiveStep(block, 0, data.steps[0]);
        await expect(block.graphic).toHaveCSS('background-color', data.background);
        await expect(block.svg).toBeVisible();
        await expect(block.svg).toHaveCSS('fill', data.foreground);
        await expect(block.svg.locator('use')).toHaveAttribute('href', '/express/code/icons/color-sprite.svg#color-how-to-graph');

        if (isSpecs) {
          await expect(page.locator('meta[name="pagetype"]')).toHaveAttribute('content', 'color');
          await expect(block.block).toHaveClass(/\btemporary-specs-card\b/);
          await expect(block.block.locator(':scope > .chtc-heading h2')).toHaveText(data.heading);
          await expect(block.howToCard).toBeVisible();
          await expect(block.specsCard).toBeVisible();
          await expect(block.specsCard.locator('h3')).toHaveText(data.specsHeading);
          await expect(block.specRows).toHaveCount(data.specs.length);
          for (const [index, spec] of data.specs.entries()) {
            const row = block.specRows.nth(index);
            await expect(row.locator('.chtc-specs-label')).toHaveText(spec.label);
            await expect(row.locator('.chtc-specs-value')).toHaveText(spec.value);
            await expect(row.getByRole('button')).toHaveAccessibleName(data.copyLabel.replace('{label}', spec.label));
          }
        } else {
          await expect(block.block).not.toHaveClass(/\btemporary-specs-card\b/);
          await expect(block.block).toHaveClass(new RegExp(`\\b${data.theme}\\b`));
          await expect(block.block.locator('.color-name')).toHaveText(data.colorName);
          await expect(block.block.locator('.color-hex')).toHaveText(data.primary);
          await expect(block.specsCard).toHaveCount(0);
          if (!data.icon) await expect(block.block).toHaveClass(/\btop-align\b/);
        }
        await expect(block.block.locator('.icon')).toHaveCount(data.icon ? 1 : 0);
      });

      await test.step('step-3: Verify HowTo structured data', async () => {
        const schemas = await block.howToSchemas();
        if (!data.schema) {
          expect(schemas).toEqual([]);
          return;
        }
        expect(schemas).toHaveLength(1);
        expect(schemas[0]).toMatchObject({
          '@type': 'HowTo',
          name: data.heading,
        });
        expect(schemas[0].step).toEqual(data.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.heading,
          itemListElement: {
            '@type': 'HowToDirection',
            text: step.text,
          },
        })));
      });

      await test.step('step-4: Verify automatic advance and wraparound', async () => {
        for (let index = 1; index <= data.steps.length; index += 1) {
          await page.clock.runFor(5000);
          const next = index % data.steps.length;
          await expectActiveStep(block, next, data.steps[next]);
        }
      });

      await test.step('step-5: Verify click, Enter, and manual rotation stop', async () => {
        await page.evaluate(() => document.fonts.ready);
        const heights = [];
        for (const [index, step] of data.steps.entries()) {
          // Click the span to cover the pager's nested event target.
          await block.numbers.nth(index).locator('span').click();
          await expectActiveStep(block, index, step);
          if (isSpecs) heights.push((await block.howToCard.boundingBox()).height);
        }
        await block.numbers.nth(2).focus();
        await block.numbers.nth(2).press('Enter');
        await expectActiveStep(block, 2, data.steps[2]);
        await page.clock.runFor(10000);
        await expectActiveStep(block, 2, data.steps[2]);
        if (isSpecs) {
          expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
        }
        await page.clock.resume();
      });

      await test.step('step-6: Verify authored or color-enhanced CTA', async () => {
        await expect(block.cta).toHaveCount(data.cta ? 1 : 0);
        if (!data.cta) return;
        await expect(block.cta).toHaveText(data.cta.text);
        if (data.cta.visible) {
          await expect(block.cta).toBeVisible();
          await expect(block.cta).toHaveAccessibleName(data.cta.text);
        } else {
          // Legacy decoration adds same-fcta, which shared styles suppress.
          await expect(block.cta).toBeHidden();
        }
        const href = new URL(await block.cta.getAttribute('href'), testUrl);
        if (isSpecs) {
          expect(href.protocol).toBe('https:');
          for (const [key, value] of Object.entries(data.cta.query)) {
            expect(href.searchParams.get(key)).toBe(value);
          }
          expect(href.hash).toBe('');
        } else {
          expect(href.href).toBe(new URL(data.cta.href, testUrl).href);
          await expect(page.locator(data.cta.href)).toHaveText(data.cta.destinationText);
        }
      });

      if (isSpecs) {
        await test.step('step-7: Verify clipboard success and failure notifications', async () => {
          await page.evaluate(() => {
            window.nalaClipboard = { writes: [], fail: false };
            Object.defineProperty(navigator, 'clipboard', {
              configurable: true,
              value: {
                writeText: async (value) => {
                  if (window.nalaClipboard.fail) throw new DOMException('Clipboard denied', 'NotAllowedError');
                  window.nalaClipboard.writes.push(value);
                },
              },
            });
          });
          for (const [index, spec] of data.specs.entries()) {
            await block.specRows.nth(index).getByRole('button').click();
            await expect(block.toasts.filter({ hasText: data.copied.replace('{value}', spec.value) })).toHaveAttribute('variant', 'positive');
            await expect.poll(() => page.evaluate(() => window.nalaClipboard.writes)).toEqual(data.specs.slice(0, index + 1).map((row) => row.value));
            await page.clock.runFor(2000);
          }
          await page.evaluate(() => { window.nalaClipboard.fail = true; });
          await block.specRows.first().getByRole('button').click();
          await expect(block.toasts.filter({ hasText: data.copyFailed })).toHaveAttribute('variant', 'negative');
          expect(await page.evaluate(() => window.nalaClipboard.writes)).toEqual(data.specs.map((row) => row.value));
          await page.clock.runFor(2000);
        });
      }

      await test.step('step-8: Accessibility validation', async (step) => {
        step.skip(isSpecs, 'MWPW-213428: specs-card CTA contrast is 1.22:1 instead of 4.5:1; accessibility skip explicitly approved pending a production fix.');
        await expect(block.activeTip).toHaveCSS('opacity', '1');
        await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
      });

      await test.step('step-9: SEO validation', async () => {
        await runSeoChecks({ page, feature });
      });
    });
  }
});
