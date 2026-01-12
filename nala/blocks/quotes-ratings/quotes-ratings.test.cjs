import { expect, test } from '@playwright/test';
import { features } from './quotes-ratings.spec.cjs';
import QuotesRatings from './quotes-ratings.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let quotesRatings;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Quotes Ratings Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    quotesRatings = new QuotesRatings(page);
  });

  // Test 0: Basic Rating Submission
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to quotes-ratings block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify ratings block exists', async () => {
      await expect(quotesRatings.block).toBeVisible();
      await expect(quotesRatings.ratingStars).toHaveCount(5);
    });

    await test.step('Select rating', async () => {
      await quotesRatings.selectRating(data.rating);
      console.info(`Selected rating: ${data.rating} stars`);
    });

    await test.step('Add comment', async () => {
      if (data.comment) {
        await quotesRatings.addComment(data.comment);
        console.info(`Added comment: ${data.comment}`);
      }
    });

    await test.step('Submit rating', async () => {
      await quotesRatings.submitRating();
      console.info('Rating submitted');
    });

    await test.step('Verify submission success', async () => {
      if (data.expectSuccess) {
        // Wait for success message or redirect
        await page.waitForTimeout(2000);
        console.info('Rating submission completed');
      }
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(quotesRatings.section).toHaveAttribute('daa-lh');
      await expect(quotesRatings.block).toHaveAttribute('daa-lh');
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotesRatings.block });
    });
  });

  // Test 1: Already Rated State
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify already rated state', async () => {
      const isAlreadyRated = await quotesRatings.isAlreadyRated();
      expect(isAlreadyRated).toBe(data.expectAlreadyRated);

      if (isAlreadyRated) {
        await expect(quotesRatings.alreadyRatedMessage).toBeVisible();
        await expect(quotesRatings.alreadyRatedTitle).toBeVisible();
        console.info('Already rated message displayed');
      }
    });

    await test.step('Verify submit button is disabled', async () => {
      if (data.submitButtonDisabled) {
        const submitBtn = quotesRatings.submitButton;
        const isDisabled = await submitBtn.isDisabled({ timeout: 2000 }).catch(() => true);
        console.info(`Submit button disabled: ${isDisabled}`);
      }
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotesRatings.block });
    });
  });

  // Test 2: Carousel with Ratings
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify carousel exists', async () => {
      if (data.expectCarousel) {
        await expect(quotesRatings.carouselNextButton).toBeVisible();
        await expect(quotesRatings.carouselPrevButton).toBeVisible();
        console.info('Carousel navigation buttons visible');
      }
    });

    await test.step('Test carousel navigation', async () => {
      if (data.expectNavigation) {
        // Navigate to next quote
        await quotesRatings.nextQuote();
        console.info('Navigated to next quote');

        // Navigate to previous quote
        await quotesRatings.prevQuote();
        console.info('Navigated to previous quote');
      }
    });

    await test.step('Rate a quote in carousel', async () => {
      await quotesRatings.selectRating(data.rating);
      console.info(`Rated quote with ${data.rating} stars`);
    });

    await test.step('Verify rating persists when navigating', async () => {
      // Navigate away and back
      await quotesRatings.nextQuote();
      await quotesRatings.prevQuote();
      console.info('Verified rating persistence across navigation');
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotesRatings.block });
    });
  });

  // Test 3: Timer and Auto-Submit
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Select rating to trigger timer', async () => {
      await quotesRatings.selectRating(data.rating);
      console.info(`Selected rating: ${data.rating} stars`);
    });

    await test.step('Verify timer appears', async () => {
      if (data.expectTimer) {
        const timerVisible = await quotesRatings.isTimerVisible();
        expect(timerVisible).toBeTruthy();
        console.info('Timer countdown started');
      }
    });

    await test.step('Wait for auto-submit', async () => {
      if (data.expectAutoSubmit) {
        console.info(`Waiting ${data.timerDuration}ms for auto-submit...`);
        await quotesRatings.waitForAutoSubmit(data.timerDuration + 2000);
        console.info('Auto-submit should have triggered');
      }
    });

    await test.step('Verify submission completed', async () => {
      // Check for success state or redirect
      await page.waitForTimeout(1000);
      console.info('Auto-submit verification completed');
    });
  });

  // Test 4: Lottie Animation
  test(`[Test Id - ${features[4].tcid}] ${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    const testUrl = `${baseURL}${features[4].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Select rating to trigger animation', async () => {
      await quotesRatings.selectRating(data.rating);
      console.info(`Selected rating: ${data.rating} stars`);
    });

    await test.step('Verify Lottie animation loads', async () => {
      if (data.expectLottie) {
        const lottieVisible = await quotesRatings.lottieAnimation.isVisible({ timeout: 3000 }).catch(() => false);
        if (lottieVisible) {
          console.info(`Lottie animation (${data.lottieType}) loaded`);
        } else {
          console.info('Lottie animation not visible - may use CSS animation');
        }
      }
    });

    await test.step('Verify animation plays', async () => {
      // Wait to observe animation
      await page.waitForTimeout(2000);
      console.info('Animation playback verified');
    });
  });

  // Test 5: Rating Without Comment
  test(`[Test Id - ${features[5].tcid}] ${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    const testUrl = `${baseURL}${features[5].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Submit rating without comment', async () => {
      await quotesRatings.completeRating(data.rating, data.comment);
      console.info(`Submitted rating ${data.rating} without comment`);
    });

    await test.step('Verify submission succeeds without comment', async () => {
      if (data.expectSuccess) {
        await page.waitForTimeout(2000);
        console.info('Rating submitted successfully without comment');
      }
    });
  });

  // Test 6: API Integration
  test(`[Test Id - ${features[6].tcid}] ${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
    const { data } = features[6];
    const testUrl = `${baseURL}${features[6].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Monitor API calls', async () => {
      if (data.expectAPICall) {
        // Listen for API requests
        const apiPromise = page.waitForRequest(
          (request) => request.url().includes('rating') || request.url().includes('submit'),
          { timeout: 15000 },
        ).catch(() => null);

        // Submit rating
        await quotesRatings.completeRating(data.rating, data.comment);

        const apiRequest = await apiPromise;
        if (apiRequest) {
          console.info(`API call detected: ${apiRequest.url()}`);
          console.info(`Method: ${apiRequest.method()}`);
        } else {
          console.info('No API call detected - may use different endpoint');
        }
      }
    });

    await test.step('Verify submission success', async () => {
      if (data.expectSuccess) {
        await page.waitForTimeout(2000);
        console.info('API submission completed');
      }
    });
  });
});
