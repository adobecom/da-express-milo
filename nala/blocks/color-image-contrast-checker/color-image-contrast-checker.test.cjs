const fs = require('fs');
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-image-contrast-checker.spec.cjs');
const ColorImageContrastCheckerBlock = require('./color-image-contrast-checker.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

async function checkVisualLayout(block, width, expanded = false) {
  const layout = await block.panel.evaluate((panel) => {
    const measure = (selector) => {
      const element = panel.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        color: style.color,
        background: style.backgroundColor,
        radius: style.borderRadius,
        padding: parseFloat(style.paddingLeft),
        shadow: style.boxShadow,
        outline: style.outlineColor,
      };
    };
    return {
      card: measure('.icc-workspace'),
      surface: measure('.icc-comparison-row'),
      zoom: measure('.icc-zoom'),
      fit: measure('[data-action="fit"]'),
      legend: measure('.icc-legend-full'),
      mini: measure('.icc-legend-mini'),
      footer: measure('.icc-footer'),
      frames: [...panel.querySelectorAll('.icc-frame')]
        .map((frame) => getComputedStyle(frame).backgroundColor),
      expandIcon: panel.querySelector('[data-action="expand"] use').getAttribute('href'),
    };
  });
  expect(layout.surface.background).toBe('rgb(243, 243, 243)');
  expect(layout.surface.outline).toBe('rgba(82, 88, 228, 0.1)');
  expect(layout.surface.radius).toBe(!expanded && width >= 900 ? '8px' : '16px');
  expect(layout.frames).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);
  expect(layout.zoom.left - layout.surface.left).toBe(width >= 900 ? 16 : 10);
  expect(layout.zoom.top - layout.surface.top).toBe(width >= 900 ? 16 : 10);
  expect(layout.zoom.width).toBe(width >= 900 ? 40 : 32);
  expect(layout.zoom.height).toBe(width >= 900 ? 68 : 60);
  expect(layout.fit.background).toBe('rgb(0, 0, 0)');
  expect(layout.fit.color).toBe('rgb(255, 255, 255)');
  expect(layout.expandIcon).toContain(`icons.svg#${expanded ? 'minimize' : 'expand'}`);
  if (!expanded) {
    expect(layout.card.shadow).toContain('0px 2px 8px');
    expect(layout.surface.width).toBeCloseTo(layout.card.width - 2 * layout.card.padding, 1);
    expect(layout.legend.outline).toBe('rgb(233, 233, 233)');
    if (width >= 900) expect(layout.legend.top).toBeCloseTo(layout.card.top, 1);
  } else {
    expect(layout.card.shadow).toBe('none');
    if (width < 600) {
      expect(layout.mini.top).toBeCloseTo(layout.surface.bottom + 16, 1);
      expect(layout.footer.top).toBeCloseTo(layout.mini.bottom + 16, 1);
    }
  }
}

async function checkToolbarClearance(block) {
  await expect.poll(() => block.panel.evaluate((panel) => {
    const surface = panel.querySelector('.icc-comparison-row');
    const surfaceBox = surface.getBoundingClientRect();
    const surfaceStyle = getComputedStyle(surface);
    const zoom = panel.querySelector('.icc-zoom');
    const toolbar = zoom.getBoundingClientRect();
    const comparison = panel.querySelector('.icc-comparison');
    const gap = parseFloat(getComputedStyle(comparison).gap);
    const expectedWidth = (surfaceBox.width - parseFloat(surfaceStyle.paddingLeft)
      - parseFloat(surfaceStyle.paddingRight) - gap) / 2;
    const canReserve = surfaceBox.height - (toolbar.bottom - surfaceBox.top + 8)
      - parseFloat(surfaceStyle.paddingBottom) >= zoom.firstElementChild.offsetHeight;
    return [...comparison.children].every((pane) => {
      const clip = pane.getBoundingClientRect();
      const image = pane.firstElementChild.getBoundingClientRect();
      const overlaps = Math.max(image.left, clip.left) < toolbar.right
        && Math.min(image.right, clip.right) > toolbar.left
        && Math.max(image.top, clip.top) < toolbar.bottom
        && Math.min(image.bottom, clip.bottom) > toolbar.top;
      return Math.abs(clip.width - expectedWidth) <= 1
        && (!overlaps || (!canReserve
          && Number(getComputedStyle(zoom).zIndex) > Number(getComputedStyle(comparison).zIndex)));
    });
  })).toBe(true);
}

async function checkTooltipPosition(page, target) {
  const id = await target.getAttribute('aria-describedby');
  const tooltip = page.locator(`sp-tooltip[id="${id}"]`);
  const content = tooltip.locator('sp-tooltip-openable');
  await expect(tooltip).toHaveAttribute('open', '');
  await expect(content).toBeVisible();
  expect(await tooltip.evaluate((element) => (
    element.shadowRoot.querySelector('sp-overlay').triggerElement
      .getAttribute('aria-describedby') === element.id
  ))).toBe(true);
  await expect.poll(async () => {
    const anchor = await target.boundingBox();
    const box = await content.boundingBox();
    if (!anchor || !box) return false;
    const verticalGap = Math.min(
      Math.abs(anchor.y - box.y - box.height),
      Math.abs(box.y - anchor.y - anchor.height),
    );
    const aboveWhenPossible = anchor.y < box.height + 12
      || Math.abs(anchor.y - box.y - box.height - 8) <= 2;
    return box.x < anchor.x + anchor.width && box.x + box.width > anchor.x
      && Math.abs(verticalGap - 8) <= 2 && aboveWhenPossible;
  }).toBe(true);
}

async function checkAllTooltips(page, block) {
  const targets = await block.panel.locator(
    '.icc-help, .icc-zoom button, [data-action="replace"], [data-action="expand"]',
  ).all();
  for (const target of targets) {
    if (await target.isVisible()) {
      await target.hover();
      await checkTooltipPosition(page, target);
      await page.mouse.move(0, 0);
    }
  }
}

test.describe('ColorImageContrastCheckerBlock Test Suite', () => {
  for (const feature of features) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({
      page, baseURL,
    }, testInfo) => {
      const block = new ColorImageContrastCheckerBlock(page, feature.selector);
      const desktop = feature.viewport.width >= 700;
      const sequence = desktop
        ? ['span', 'button', 'replace', 'save', 'expand', 'fit', 'div']
        : ['replace', 'expand', 'span', 'button', 'fit', 'div', 'save'];
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
        expect(await block.block.locator('.icc-color .icc-help')
          .evaluate((text) => text.tagName)).toBe('SPAN');
        await expect(block.block.locator('.icc-color .icc-help:is(button, [role="button"])'))
          .toHaveCount(0);
        await checkVisualLayout(block, feature.viewport.width);
        await checkToolbarClearance(block);
        await expect(block.block.locator('.icc-dimensions')).toHaveCount(0);
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
        await checkAllTooltips(page, block);
        await block.block.locator('[data-action="fit"]').focus();
        await page.keyboard.press('End');
        await expect(block.block.locator('[data-action="fill"]'))
          .toHaveAttribute('aria-pressed', 'true');
        await block.block.locator('[data-action="fill"]').hover();
        await checkToolbarClearance(block);
        await block.panel.locator('.icc-frame').evaluateAll((panes) => {
          panes.forEach((pane) => {
            pane.scrollTop = pane.scrollHeight;
            pane.scrollLeft = pane.scrollWidth;
          });
        });
        await checkToolbarClearance(block);
        await expect(block.block.locator('[data-action="fill"]'))
          .toHaveCSS('background-color', 'rgb(0, 0, 0)');
        await page.keyboard.press('Home');
        await checkToolbarClearance(block);
        await expect(block.block.locator('[data-action="fill"]'))
          .toHaveCSS('background-color', 'rgb(225, 225, 225)');
        await block.block.locator('[data-action="fit"]').hover();
        await expect(block.block.locator('[data-action="fit"]'))
          .toHaveCSS('background-color', 'rgb(0, 0, 0)');
        await page.mouse.move(0, 0);
        const dimensions = await block.canvas.evaluate((canvas) => [canvas.width, canvas.height]);
        await expect(block.block.locator('[data-value="adobe-rgb"]')).toHaveText('Adobe RGB (1998)');
        for (const space of ['srgb', 'display-p3', 'adobe-rgb']) {
          await block.chooseColorSpace(space);
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
        await checkVisualLayout(block, feature.viewport.width, true);
        await checkToolbarClearance(block);
        await expect(block.dialog.locator('.icc-dimensions')).toHaveCount(0);
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
        await checkAllTooltips(page, block);
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
        const colorTrigger = block.block.locator('.color-dropdown-trigger');
        await colorTrigger.focus();
        await page.keyboard.press('ArrowDown');
        const colorMenu = block.block.locator('.color-dropdown-popover');
        await expect(colorMenu).toBeVisible();
        await expect(colorMenu.locator('[aria-selected="true"]')).toBeFocused();
        await page.screenshot({ path: testInfo.outputPath('color-space-dropdown-open.png') });
        await page.keyboard.press('End');
        await expect(colorMenu.locator('[data-value="adobe-rgb"]')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(colorMenu).toBeHidden();
        await expect(block.dialog).toBeVisible();
        await expect(colorTrigger).toBeFocused();
        await colorTrigger.click();
        await page.keyboard.press('Tab');
        await expect(colorMenu).toBeHidden();
        if (desktop) await expect(block.block.locator('[data-action="replace"]')).toBeFocused();
        else await expect(block.block.locator('[data-action="fit"]')).toBeFocused();
        await colorTrigger.focus();
        await page.keyboard.press('Enter');
        await expect(colorMenu).toBeVisible();
        await page.keyboard.press('Home');
        await page.keyboard.press('Enter');
        await expect(colorTrigger).toHaveAttribute('value', 'srgb');
        await expect(colorTrigger).toBeFocused();
        await expect(colorMenu).toBeHidden();
        await block.block.locator('.color-dropdown-trigger').focus();
        await page.keyboard.press('Shift+Tab');
        await expect(colorHelp).toBeFocused();
        await expect(block.dialog.locator('sp-tooltip[open]').first()).toBeAttached();
        await checkTooltipPosition(page, colorHelp);
        await page.keyboard.press('Escape');
        await expect(block.dialog).toBeVisible();
        await expect(block.dialog.locator('sp-tooltip[open]')).toHaveCount(0);
        await block.comparison.focus();
        await colorHelp.hover();
        await expect(block.dialog.locator('sp-tooltip[open]').first()).toBeAttached();
        await checkTooltipPosition(page, colorHelp);
        await page.keyboard.press('Escape');
        await expect(block.dialog).toBeVisible();
        await expect(block.dialog.locator('sp-tooltip[open]')).toHaveCount(0);
        await runAccessibilityTest({ page, testScope: 'dialog[open]' });
        await page.keyboard.press('Escape');
        await expect(block.dialog).toBeHidden();
        await expect(block.expand).toBeFocused();
        await checkAllTooltips(page, block);
        await block.expand.click();
        await expect(block.dialog).toBeVisible();
        await checkAllTooltips(page, block);
        await block.expand.click();
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

      await test.step('step-5: Automatically detect and export an Adobe RGB upload', async () => {
        const buffer = fs.readFileSync('test/blocks/color-image-contrast-checker/mocks/adobe-rgb.png');
        await test.step('Upload the profiled fixture', async () => {
          await block.block.locator('input[type="file"]').setInputFiles({
            name: 'profiled-image.png', mimeType: 'image/png', buffer,
          });
        });
        await test.step('Verify automatic selection and native analysis dimensions', async () => {
          await expect(block.panel).toBeVisible();
          await expect(block.block).toHaveAttribute('aria-busy', 'false');
          await expect(block.block.locator('.color-dropdown-trigger')).toHaveAttribute('value', 'adobe-rgb');
          await expect(block.save).toBeEnabled();
        });
        const dimensions = await block.canvas.evaluate((canvas) => [canvas.width, canvas.height]);
        expect(dimensions).toEqual([3, 1]);
        const pixels = await block.canvas.evaluate((canvas) => {
          const gl = canvas.getContext('webgl');
          const values = new Uint8Array(12);
          gl.readPixels(0, 0, 3, 1, gl.RGBA, gl.UNSIGNED_BYTE, values);
          return [...values];
        });
        expect(pixels).toEqual([0, 0, 0, 255, 0, 255, 0, 255, 0, 128, 242, 255]);
        await test.step('Export the automatically selected analysis', async () => {
          const downloadEvent = page.waitForEvent('download');
          await block.save.click();
          const download = await downloadEvent;
          expect(download.suggestedFilename()).toBe('profiled-image-contrast-adobe-rgb.png');
          const bytes = fs.readFileSync(await download.path());
          expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(dimensions);
        });
      });
    });
  }
});
