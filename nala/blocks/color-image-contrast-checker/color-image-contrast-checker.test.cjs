const fs = require('fs');
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-image-contrast-checker.spec.cjs');
const ColorImageContrastCheckerBlock = require('./color-image-contrast-checker.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

test.describe('ColorImageContrastCheckerBlock Test Suite', () => {
  for (const feature of features) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({
      page, baseURL,
    }, testInfo) => {
      const block = new ColorImageContrastCheckerBlock(page, feature.selector);
      const desktop = feature.viewport.width >= 900;
      const sequence = desktop
        ? ['button', 'select', 'replace', 'save', 'expand', 'fit', 'div']
        : ['replace', 'expand', 'button', 'select', 'fit', 'div', 'save'];
      await page.setViewportSize(feature.viewport);
      await test.step('step-1: Navigate and verify authored composition', async () => {
        await page.goto(`${baseURL}${feature.path}`);
        await expect(block.block).toHaveAttribute('data-block-status', 'loaded');
        await expect(block.headline).toBeVisible();
        await expect(block.upload).toBeVisible();
        for (const text of feature.data.semantic.texts) {
          await expect(block.block.locator(text.selector).nth(text.nth || 0))
            .toContainText(text.text);
        }
        await runSeoChecks({ page, feature });
        await runAccessibilityTest({ page, testScope: feature.selector });
      });

      await test.step('step-2: Analyze, zoom, export and validate results', async () => {
        await page.evaluate(() => {
          document.querySelector('.color-image-contrast-checker input[type="file"]')
            .addEventListener('change', (event) => {
              const file = event.target.files[0];
              const read = file.arrayBuffer.bind(file);
              let frames = 0;
              let frame;
              const countFrames = () => {
                frames += 1;
                frame = requestAnimationFrame(countFrames);
              };
              frame = requestAnimationFrame(countFrames);
              file.arrayBuffer = () => {
                file.arrayBuffer = read;
                const overlay = document.querySelector('.icc-overlay.color-extract-loading-overlay');
                window.checkerUploadBeforeRead = {
                  frames,
                  opacity: getComputedStyle(overlay).opacity,
                  covering: document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
                    .closest('.color-extract-loading-overlay') === overlay,
                  label: overlay.querySelector('.color-extract-loading-label').textContent,
                };
                cancelAnimationFrame(frame);
                return read();
              };
            }, { capture: true, once: true });
        });
        await block.uploadImage();
        const uploadState = await page.evaluate(() => window.checkerUploadBeforeRead);
        expect(uploadState.frames).toBeGreaterThanOrEqual(2);
        expect(uploadState.opacity).toBe('1');
        expect(uploadState.covering).toBe(true);
        expect(uploadState.label.trim().length).toBeGreaterThan(0);
        await expect(page.locator('.icc-overlay.color-extract-loading-overlay'))
          .toHaveCSS('opacity', '0');
        await expect(block.headline).toBeHidden();
        await expect(block.panel).toBeVisible();
        await expect(block.block.locator('.icc-legend-full')).toBeVisible();
        await expect(block.block.locator('.icc-accuracy')).toBeVisible();
        await expect(block.block.locator('.icc-legend-mini')).toBeHidden();
        await expect(block.block.locator('.icc-legend-card')).toHaveCount(3);
        await expect(block.block.locator('.icc-legend-full .icc-swatch')).toHaveCount(3);
        await expect(block.block.locator('.icc-legend-full .icc-badge .icon')).toHaveCount(3);
        await expect(block.block.locator('.icc-green .icc-legend-labels p').first())
          .toContainText('4.5:1');
        const thresholds = [/\u2265\s*4\.5:1/, /\u2265\s*4\.5:1/, /\u2265\s*3:1/];
        for (const [index, threshold] of thresholds.entries()) {
          await expect(block.block.locator('.icc-legend-labels > p > span').nth(index))
            .toHaveText(threshold);
        }
        const legendBox = await block.block.locator('.icc-legend-full').boundingBox();
        expect(legendBox.height).toBeCloseTo(feature.viewport.width === 768 ? 178 : 444, 0);
        const headings = await block.block.locator('.icc-legend-card h3').evaluateAll(
          (elements) => elements.map((heading) => heading.getBoundingClientRect().top),
        );
        if (feature.viewport.width === 768) {
          expect(headings[0]).toBe(headings[1]);
          expect(headings[1]).toBe(headings[2]);
        } else {
          expect(headings[0]).toBeLessThan(headings[1]);
          expect(headings[1]).toBeLessThan(headings[2]);
        }
        const clippedLabel = await block.save.locator('span').last().evaluate(
          (label) => label.scrollWidth > label.clientWidth || label.scrollHeight > label.clientHeight,
        );
        expect(clippedLabel).toBe(false);
        expect(await block.focusOrder()).toEqual([...sequence, ...Array(4).fill('button')]);
        await block.block.locator('[data-action="fit"]').focus();
        await page.keyboard.press('End');
        await expect(block.block.locator('[data-action="fill"]'))
          .toHaveAttribute('aria-pressed', 'true');
        await page.keyboard.press('Home');
        const dimensions = await block.canvas.evaluate((canvas) => [canvas.width, canvas.height]);
        for (const space of ['srgb', 'display-p3']) {
          await block.block.locator('select').selectOption(space);
          const downloadEvent = page.waitForEvent('download');
          await block.save.click();
          const download = await downloadEvent;
          expect(download.suggestedFilename()).toBe(`test-image-contrast-${space}.png`);
          const bytes = fs.readFileSync(await download.path());
          expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
          expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(dimensions);
        }
        await runAccessibilityTest({ page, testScope: feature.selector });
      });

      await test.step('step-3: Modal focus containment and tooltip-first Escape', async () => {
        await block.expand.click();
        await expect(block.dialog).toBeVisible();
        await expect(block.dialog.locator('.icc-legend-full')).toBeHidden();
        await expect(block.dialog.locator('.icc-accuracy')).toBeHidden();
        await expect(block.dialog.locator('.icc-legend-mini')).toBeVisible();
        await expect(block.dialog.locator('.icc-legend-mini .icc-swatch')).toHaveCount(3);
        await expect(block.dialog.locator('.icc-legend-mini .icc-badge')).toHaveCount(3);
        await expect(block.dialog.locator('.icc-legend-mini button')).toHaveCount(0);
        const miniBox = await block.dialog.locator('.icc-legend-mini').boundingBox();
        expect(miniBox.height).toBe(40);
        expect(miniBox.width).toBe({ 375: 343, 768: 341, 1440: 337 }[feature.viewport.width]);
        expect(await block.focusOrder()).toEqual(sequence);
        const first = desktop ? block.block.locator('.icc-color .icc-help')
          : block.block.locator('[data-action="replace"]');
        const last = desktop ? block.comparison : block.save;
        await last.focus();
        await page.keyboard.press('Tab');
        await expect(first).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(last).toBeFocused();
        await page.evaluate(() => {
          document.querySelector('.color-image-contrast-checker input[type="file"]')
            .addEventListener('change', (event) => {
              const file = event.target.files[0];
              const read = file.arrayBuffer.bind(file);
              file.arrayBuffer = () => {
                file.arrayBuffer = read;
                return new Promise((resolve) => {
                  window.resumeCheckerUpload = () => resolve(read());
                });
              };
            }, { capture: true, once: true });
        });
        const replacement = block.uploadImage();
        const interstitial = block.dialog.locator('.icc-overlay.color-extract-loading-overlay');
        await expect(interstitial).toHaveCSS('opacity', '1');
        await page.waitForFunction(() => typeof window.resumeCheckerUpload === 'function');
        await expect(block.save).toBeDisabled();
        if (!desktop) {
          await expect(block.comparison).toBeFocused();
        }
        expect(await interstitial.evaluate((overlay) => {
          const center = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
          return center.closest('.color-extract-loading-overlay') === overlay;
        })).toBe(true);
        await page.screenshot({ path: testInfo.outputPath('modal-upload-interstitial.png') });
        await page.evaluate(() => window.resumeCheckerUpload());
        await replacement;
        await expect(block.dialog).toBeVisible();
        await expect(page.locator('.icc-overlay.color-extract-loading-overlay'))
          .toHaveCSS('opacity', '0');
        const colorHelp = block.block.locator('.icc-color .icc-help');
        await colorHelp.hover();
        await expect(block.dialog.locator('sp-tooltip[open]').first()).toBeAttached();
        await page.keyboard.press('Escape');
        await expect(block.dialog).toBeVisible();
        await expect(block.dialog.locator('sp-tooltip[open]')).toHaveCount(0);
        await runAccessibilityTest({ page, testScope: 'dialog[open]' });
        await page.keyboard.press('Escape');
        await expect(block.dialog).toBeHidden();
        await expect(block.expand).toBeFocused();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow).toBe(false);
      });

      await test.step('step-4: Browser Back restores upload', async () => {
        await page.goBack();
        await expect(block.upload).toBeVisible();
        await expect(block.headline).toBeVisible();
      });
    });
  }
});
