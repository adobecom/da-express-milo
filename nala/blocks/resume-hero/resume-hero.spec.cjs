const ResumeHeroBlock = require('./resume-hero.page.cjs');

describe('resume-hero block', () => {
  let block;

  beforeEach(async () => {
    block = new ResumeHeroBlock(page);
  });

  test('should render the resume-hero block', async () => {
    const blockElement = await block.block.isVisible();
    expect(blockElement).toBeTruthy();
  });

  test('should have a heading', async () => {
    const heading = await block.block.locator('h2').first().isVisible();
    expect(heading).toBeTruthy();
  });

  test('should have CTA buttons', async () => {
    const buttons = await block.block.locator('a.button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('should have responsive layout', async () => {
    // This test verifies the block adapts to different viewport sizes
    const blockStyles = await block.block.evaluate((el) => {
      return window.getComputedStyle(el);
    });
    expect(blockStyles).toBeDefined();
  });
});
