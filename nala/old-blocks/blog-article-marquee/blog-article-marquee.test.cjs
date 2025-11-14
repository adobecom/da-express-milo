import { expect, test } from '@playwright/test';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';
import { features } from './blog-article-marquee.spec.cjs';
import BlogArticleMarquee from './blog-article-marquee.page.cjs';

let blogArticleMarquee;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express blog-article-marquee block test suite', () => {
  test.beforeEach(async ({ page }) => {
    blogArticleMarquee = new BlogArticleMarquee(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const pagePath = features[0].path;
    const isAbsolute = /^https?:\/\//.test(pagePath);
    const testPage = `${isAbsolute ? pagePath : `${baseURL}${pagePath}`}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to blog article marquee block test page', async () => {
      await blogArticleMarquee.gotoURL(testPage);
      await blogArticleMarquee.waitForDecoration();
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify blog article marquee structure', async () => {
      await blogArticleMarquee.scrollToBlock();
      await expect(blogArticleMarquee.block).toBeVisible();
      await expect(blogArticleMarquee.inner).toBeVisible();
      await expect(blogArticleMarquee.contentColumn).toBeVisible();
      await expect(blogArticleMarquee.heroImage).toBeVisible();
      await expect(blogArticleMarquee.eyebrow).toBeVisible();
      await expect(blogArticleMarquee.buttonContainer).toBeVisible();
    });

    await test.step('Verify product highlight placement', async () => {
      await expect(blogArticleMarquee.products).toBeVisible();
      await expect(blogArticleMarquee.productCards).toHaveCount(1);
      await expect.poll(async () => blogArticleMarquee.highlightBeforeCTA()).toBeTruthy();
    });

    await test.step('Verify image optimization attributes', async () => {
      await expect(blogArticleMarquee.heroImage).toHaveAttribute('loading', 'eager');
      await expect(blogArticleMarquee.heroImage).toHaveAttribute('fetchpriority', 'high');
      await expect(blogArticleMarquee.productImage).toHaveAttribute('loading', 'lazy');
      await expect(blogArticleMarquee.productImage).not.toHaveAttribute('fetchpriority', /.+/);
    });

    await test.step('Verify extra rows collapse into main row', async () => {
      await expect.poll(async () => blogArticleMarquee.getInnerRowCount()).toBe(1);
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: blogArticleMarquee.block });
    });
  });
});
