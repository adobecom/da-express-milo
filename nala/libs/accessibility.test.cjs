const { readFile } = require('fs/promises');
const { test, expect } = require('../utils/test.cjs');
const { runAccessibilityTest } = require('./accessibility.cjs');
const { applyTextSpacing, expectTextSpacing, expectNoClippedText } = require('./text-spacing.cjs');

test.describe('Accessibility helper regressions @a11y-regression @express', () => {
  test('locator scopes target the exact match, restore attributes, and keep passing results', async ({ page }, testInfo) => {
    await page.setContent('<main><section><img src="data:," /></section><section data-nala-a11y-scope="authored"><button>Save design</button></section></main>');
    const scope = page.locator('section').nth(1);
    const results = await runAccessibilityTest({ page, testScope: scope });
    expect(results.violations).toEqual([]);
    await expect(scope).toHaveAttribute('data-nala-a11y-scope', 'authored');
    const attachment = testInfo.attachments.find((item) => item.contentType === 'application/json');
    const report = JSON.parse(await readFile(attachment.path, 'utf8'));
    expect(report.incomplete).toEqual(results.incomplete);
    expect(report.passes.length).toBeGreaterThan(0);
  });

  test('selector and locator violations fail, retain reports, and clean up markers', async ({ page }, testInfo) => {
    await page.setContent('<main><div id="target"><img src="data:," /></div></main>');
    for (const scope of ['#target', page.locator('#target')]) {
      await expect(runAccessibilityTest({ page, testScope: scope })).rejects.toThrow('violation(s) found');
      await expect(page.locator('[data-nala-a11y-scope]')).toHaveCount(0);
    }
    expect(testInfo.attachments.filter((item) => item.contentType === 'application/json')).toHaveLength(2);
    const results = await runAccessibilityTest({ page, testScope: '#target', maxViolations: 1 });
    expect(results.violations.map((item) => item.id)).toEqual(['image-alt']);
    expect(testInfo.attachments.filter((item) => item.contentType === 'application/json')).toHaveLength(3);
  });

  test('text-spacing checks detect blocked overrides and clipped text', async ({ page }) => {
    await page.setContent('<main><p style="font-size:16px">A long paragraph with enough words to wrap over several lines in a narrow box.</p></main>');
    await applyTextSpacing(page);
    const paragraph = page.locator('p');
    await expectTextSpacing(paragraph);
    await expectNoClippedText(page.locator('main'));
    await paragraph.evaluate((element) => {
      element.style.setProperty('word-spacing', 'normal', 'important');
    });
    await expect(expectTextSpacing(paragraph)).rejects.toThrow();
    await paragraph.evaluate((element) => {
      element.style.cssText = 'height: 8px; width: 100px; overflow: hidden;';
    });
    await expect(expectNoClippedText(page.locator('main'))).rejects.toThrow('Text must not be clipped');
  });
});
