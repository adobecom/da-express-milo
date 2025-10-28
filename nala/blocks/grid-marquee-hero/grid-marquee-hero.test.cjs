/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './grid-marquee-hero.spec.cjs';
import GridMarqueeHero from './grid-marquee-hero.page.cjs';

let hero;

test.describe('grid-marquee-hero test suite', () => {
  test.beforeEach(async ({ page }) => {
    hero = new GridMarqueeHero(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}, validate headline and responsive CTAs`, async ({ baseURL, page }) => {
      const testPage = `${baseURL}${path}`;

      // Ensure block exists on page; skip if not present on this env/page
      await hero.gotoURL(testPage);
      const blockCount = await hero.hero.count();
      test.skip(blockCount === 0, 'grid-marquee-hero block not present on page');

      // Mobile: CTAs hidden
      await page.setViewportSize({ width: 375, height: 800 });
      await page.waitForSelector('.global-footer');
      await test.step('mobile: headline visible, CTAs hidden', async () => {
        await expect(hero.logo).toBeVisible();
        await expect(hero.heading).toBeVisible();
        await expect(hero.ctas).toBeHidden();
      });

      // Desktop: CTAs visible
      await page.setViewportSize({ width: 1280, height: 900 });
      await test.step('desktop: headline and CTAs visible', async () => {
        await expect(hero.logo).toBeVisible();
        await expect(hero.heading).toBeVisible();
        await expect(hero.ctas).toBeVisible();
        await expect(hero.ctaButton.nth(0)).toBeVisible();
        await expect(hero.ctaButton.nth(1)).toBeVisible();
      });
    });
  });
});
