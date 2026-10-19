const path = require('path');
const { expect } = require('@playwright/test');

class ColorImageContrastCheckerBlock {
  constructor(page, selector = 'div.color-image-contrast-checker', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.headline = page.locator('.color-headline.extract.color-image-contrast');
    this.upload = this.block.locator('.icc-upload');
    this.panel = this.block.locator('.icc-panel');
    this.input = this.block.locator('input[type="file"]');
    this.canvas = this.block.locator('canvas');
    this.save = this.block.locator('[data-action="save"]');
    this.expand = this.block.locator('[data-action="expand"]');
    this.dialog = this.block.locator('dialog');
    this.comparison = this.block.locator('.icc-comparison');
  }

  async uploadImage() {
    await this.input.setInputFiles(path.resolve(__dirname, '../../assets/test-image.jpg'));
    await this.block.locator('[data-action="save"]:enabled').waitFor();
  }

  async chooseColorSpace(space) {
    await this.block.locator('.color-dropdown-trigger').click();
    await this.block.locator(`.color-dropdown-option[data-value="${space}"]`).click();
  }

  async checkSynchronizedScroll() {
    const panes = this.panel.locator('.icc-frame');
    await panes.nth(0).evaluate((pane) => {
      pane.scrollTop = pane.scrollHeight;
      pane.scrollLeft = pane.scrollWidth;
    });
    await expect.poll(() => panes.evaluateAll((frames) => (
      frames[0].scrollTop === frames[1].scrollTop
      && frames[0].scrollLeft === frames[1].scrollLeft
    ))).toBe(true);
    expect(await panes.nth(0).evaluate((pane) => pane.scrollTop + pane.scrollLeft))
      .toBeGreaterThan(0);
    await panes.nth(1).evaluate((pane) => {
      pane.scrollTop = 0;
      pane.scrollLeft = 0;
    });
    await expect.poll(() => panes.nth(0).evaluate((pane) => (
      pane.scrollTop + pane.scrollLeft
    ))).toBe(0);
  }

  async focusOrder() {
    return this.panel.evaluate((panel) => [...panel.querySelectorAll(
      'button,select,[tabindex="0"]',
    )].filter((control) => !control.disabled && control.tabIndex >= 0
      && control.getClientRects().length)
      .map((control) => control.dataset.action || control.tagName.toLowerCase()));
  }
}

module.exports = ColorImageContrastCheckerBlock;
