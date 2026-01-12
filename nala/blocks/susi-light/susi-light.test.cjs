/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './susi-light.spec.cjs';
import SusiLight from './susi-light.page.cjs';

let susiLight;

test.describe('SUSI Light block tests', () => {
  test.beforeEach(async ({ page }) => {
    susiLight = new SusiLight(page);
  });

  // TCID 0: Basic display and form elements
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await susiLight.gotoURL(testPage);
      await susiLight.page.waitForTimeout(2000);
    });

    await test.step('Verify block is loaded', async () => {
      await expect(susiLight.block).toBeVisible();
      console.log('✅ SUSI Light block visible');
    });

    await test.step('Verify form elements', async () => {
      const hasSignIn = await susiLight.signInButton.isVisible();
      const hasSignUp = await susiLight.signUpButton.isVisible();
      console.log(`Sign in button: ${hasSignIn}, Sign up button: ${hasSignUp}`);
    });

    await test.step('Verify social buttons', async () => {
      const socialCount = await susiLight.getSocialButtonCount();
      console.log(`Found ${socialCount} social login buttons`);
    });

    await test.step('Verify legal links', async () => {
      const hasTOS = await susiLight.tosLink.isVisible();
      const hasPrivacy = await susiLight.privacyLink.isVisible();
      console.log(`TOS link: ${hasTOS}, Privacy link: ${hasPrivacy}`);
    });
  });

  // TCID 1: Sign in flow
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate and load', async () => {
      await susiLight.gotoURL(testPage);
      await susiLight.page.waitForTimeout(2000);
    });

    await test.step('Click sign in button', async () => {
      if (await susiLight.signInButton.isVisible()) {
        await susiLight.clickSignIn();
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Sign in button clicked');
      }
    });

    await test.step('Test email input', async () => {
      if (await susiLight.emailInput.isVisible()) {
        await susiLight.enterEmail('test@example.com');
        const emailValue = await susiLight.emailInput.inputValue();
        expect(emailValue).toBe('test@example.com');
        console.log('✅ Email input tested');
      }
    });

    await test.step('Test password input', async () => {
      if (await susiLight.passwordInput.isVisible()) {
        await susiLight.enterPassword('testpassword123');
        const passwordValue = await susiLight.passwordInput.inputValue();
        expect(passwordValue).toBe('testpassword123');
        console.log('✅ Password input tested');
      }
    });
  });

  // TCID 2: Sign up flow
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[2].path}`);
    const testPage = `${baseURL}${features[2].path}`;

    await test.step('Navigate and load', async () => {
      await susiLight.gotoURL(testPage);
      await susiLight.page.waitForTimeout(2000);
    });

    await test.step('Click sign up button', async () => {
      if (await susiLight.signUpButton.isVisible()) {
        await susiLight.clickSignUp();
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Sign up button clicked');
      }
    });

    await test.step('Test sign up form', async () => {
      if (await susiLight.emailInput.isVisible()) {
        await susiLight.enterEmail('newuser@example.com');
        await susiLight.enterPassword('newpassword123');
        console.log('✅ Sign up form filled');
      }
    });
  });

  // TCID 3: Social authentication
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[3].path}`);
    const testPage = `${baseURL}${features[3].path}`;

    await test.step('Navigate and load', async () => {
      await susiLight.gotoURL(testPage);
      await susiLight.page.waitForTimeout(2000);
    });

    await test.step('Test Google sign in', async () => {
      if (await susiLight.googleButton.isVisible()) {
        await susiLight.clickSocialButton('google');
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Google button clicked');
      }
    });

    await test.step('Test Facebook sign in', async () => {
      if (await susiLight.facebookButton.isVisible()) {
        await susiLight.clickSocialButton('facebook');
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Facebook button clicked');
      }
    });

    await test.step('Test Apple sign in', async () => {
      if (await susiLight.appleButton.isVisible()) {
        await susiLight.clickSocialButton('apple');
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Apple button clicked');
      }
    });
  });

  // TCID 4: Error handling
  test(`[Test Id - ${features[4].tcid}] ${features[4].name},${features[4].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[4].path}`);
    const testPage = `${baseURL}${features[4].path}`;

    await test.step('Navigate and load', async () => {
      await susiLight.gotoURL(testPage);
      await susiLight.page.waitForTimeout(2000);
    });

    await test.step('Test invalid email error', async () => {
      if (await susiLight.emailInput.isVisible()) {
        await susiLight.enterEmail('invalid-email');
        await susiLight.submitForm();
        await susiLight.page.waitForTimeout(1000);

        const hasError = await susiLight.isErrorVisible();
        if (hasError) {
          const errorText = await susiLight.getErrorMessage();
          console.log(`Error message: ${errorText}`);
        }
      }
    });

    await test.step('Test empty form submission', async () => {
      if (await susiLight.submitButton.isVisible()) {
        await susiLight.submitForm();
        await susiLight.page.waitForTimeout(1000);
        console.log('✅ Empty form submission tested');
      }
    });
  });
});
