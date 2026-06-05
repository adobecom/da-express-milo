import { expect, test } from '@playwright/test';
import { features } from './transparent-img-marquee.spec.js';
import TransparentImgMarqueePage from './transparent-img-marquee.page.js';

let marquee;

test.describe('Transparent Image Marquee block test suite', () => {
  test.beforeEach(async ({ page }) => {
    marquee = new TransparentImgMarqueePage(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name}`, async ({ baseURL }) => {
    await test.step('Navigate to test page', async () => {
      await marquee.gotoURL(`${baseURL}${features[0].path}`);
    });

    await test.step('Block is visible', async () => {
      await marquee.scrollIntoView();
      await expect(marquee.block).toBeVisible();
    });

    await test.step('Heading is non-empty', async () => {
      await expect(marquee.heading).toBeVisible();
      const text = await marquee.heading.innerText();
      expect(text.length).toBeGreaterThan(0);
    });

    await test.step('Body text is visible', async () => {
      await expect(marquee.bodyText).toBeVisible();
    });

    await test.step('Primary CTA is present with href', async () => {
      await expect(marquee.primaryCta).toBeVisible();
      await expect(marquee.primaryCta).toHaveAttribute('href');
    });

    await test.step('Secondary CTA is present with href', async () => {
      if (await marquee.secondaryCta.count() > 0) {
        await expect(marquee.secondaryCta).toBeVisible();
        await expect(marquee.secondaryCta).toHaveAttribute('href');
      }
    });

    await test.step('Disclaimer text is visible', async () => {
      await expect(marquee.disclaimer).toBeVisible();
    });

    await test.step('Image is present', async () => {
      await expect(marquee.image).toBeVisible();
    });

    await test.step('Image container is a sibling of foreground', async () => {
      await expect(marquee.foreground).toBeVisible();
      await expect(marquee.imageContainer).toBeVisible();
    });
  });

  test(`[Test Id - ${features[1].tcid}] ${features[1].name}`, async ({ baseURL }) => {
    await test.step('Navigate to test page', async () => {
      await marquee.gotoURL(`${baseURL}${features[1].path}`);
    });

    await test.step('Adobe Express logo is injected', async () => {
      await marquee.scrollIntoView();
      await expect(marquee.logo).toBeVisible();
    });

    await test.step('Logo appears above heading', async () => {
      const logoBox = await marquee.logo.boundingBox();
      const headingBox = await marquee.heading.boundingBox();
      expect(logoBox.y).toBeLessThan(headingBox.y);
    });
  });
});
