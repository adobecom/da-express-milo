const { expect } = require('@playwright/test');

async function applyTextSpacing(page) {
  await page.addStyleTag({
    content: `
      html body, html body * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      html body p { margin-bottom: 2em !important; }
    `,
  });
}

async function expectTextSpacing(locator) {
  const styles = await locator.evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const size = parseFloat(style.fontSize);
    return {
      line: parseFloat(style.lineHeight) / size,
      letter: parseFloat(style.letterSpacing) / size,
      word: parseFloat(style.wordSpacing) / size,
      paragraph: element.tagName === 'P' ? parseFloat(style.marginBottom) / size : null,
    };
  }));
  expect(styles.length, 'Spacing assertions must inspect actual text').toBeGreaterThan(0);
  expect(styles.some((style) => style.paragraph !== null), 'Include a paragraph to verify all four overrides').toBe(true);
  for (const style of styles) {
    expect(style.line).toBeCloseTo(1.5, 2);
    expect(style.letter).toBeCloseTo(0.12, 2);
    expect(style.word).toBeCloseTo(0.16, 2);
    if (style.paragraph !== null) expect(style.paragraph).toBeCloseTo(2, 2);
  }
}

async function expectNoClippedText(scope) {
  const clipped = await scope.evaluate((root) => {
    const failures = [];
    const elements = [...root.querySelectorAll('h2, h3, p, a, button')]
      .filter((element) => element.getClientRects().length && !element.closest('[aria-hidden="true"]'));
    for (const element of elements) {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
      for (let ancestor = element; ancestor && root.contains(ancestor); ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const box = ancestor.getBoundingClientRect();
        const left = box.left + ancestor.clientLeft;
        const top = box.top + ancestor.clientTop;
        const clipsX = /hidden|clip|auto|scroll/.test(style.overflowX);
        const clipsY = /hidden|clip|auto|scroll/.test(style.overflowY);
        if (rects.some((rect) => (clipsX && (rect.left < left - 1 || rect.right > left + ancestor.clientWidth + 1))
          || (clipsY && (rect.top < top - 1 || rect.bottom > top + ancestor.clientHeight + 1)))) {
          failures.push(element.textContent.trim());
          break;
        }
      }
    }
    return failures;
  });
  expect(clipped, 'Text must not be clipped by an overflow container').toEqual([]);
}

module.exports = { applyTextSpacing, expectTextSpacing, expectNoClippedText };
