export default class HowToV2 {
  constructor(page) {
    this.page = page;
    // Main block locators
    this.section = page.locator('.section').first();
    this.howToV2 = page.locator('.how-to-v2').first();

    // All how-to-v2 blocks on the page
    this.allHowToV2 = page.locator('.how-to-v2');

    // Structure elements
    this.stepsContent = page.locator('.how-to-v2 .steps-content');
    this.mediaContainer = page.locator('.how-to-v2 .media-container');
    this.stepsList = page.locator('.how-to-v2 .steps');
    this.stepItems = page.locator('.how-to-v2 .step');
    this.stepIndicators = page.locator('.how-to-v2 .step-indicator');
    this.stepContent = page.locator('.how-to-v2 .step-content');
    this.detailContainers = page.locator('.how-to-v2 .detail-container');
    this.detailText = page.locator('.how-to-v2 .detail-text');

    // Step titles and details
    this.stepTitles = page.locator('.how-to-v2 h3 h3');
    this.firstStepTitle = page.locator('.how-to-v2 h3 h3').first();
    this.lastStepTitle = page.locator('.how-to-v2 h3 h3').last();

    // Media elements
    this.mediaPicture = page.locator('.how-to-v2 .media-container picture');
    this.mediaImage = page.locator('.how-to-v2 .media-container img');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getStepCount() {
    return this.stepItems.count();
  }

  async getStepData(stepIndex) {
    const step = this.stepItems.nth(stepIndex);
    // Get the text from the inner H3 (the one with actual content, not the wrapper)
    const title = await step.locator('h3 h3').textContent();
    const detail = await step.locator('.detail-text').textContent();
    const isExpanded = await step.getAttribute('aria-expanded') === 'true';
    const detailContainer = step.locator('.detail-container');
    const hasClosedClass = await detailContainer.evaluate((el) => el.classList.contains('closed'));

    return {
      title,
      detail,
      isExpanded,
      isClosed: hasClosedClass,
    };
  }

  async getAllStepsData() {
    const stepCount = await this.getStepCount();
    const stepsData = [];

    for (let i = 0; i < stepCount; i += 1) {
      const stepData = await this.getStepData(i);
      stepsData.push(stepData);
    }

    return stepsData;
  }

  async clickStep(stepIndex) {
    const step = this.stepItems.nth(stepIndex);
    await step.click();
  }

  async clickStepTitle(stepIndex) {
    const stepTitle = this.stepTitles.nth(stepIndex);
    await stepTitle.click();
  }

  async testKeyboardNavigation(stepIndex) {
    const step = this.stepItems.nth(stepIndex);
    await step.focus();
    await this.page.keyboard.press('Enter');
  }

  async getBackgroundImageURL() {
    const backgroundImage = await this.howToV2.evaluate((el) => window.getComputedStyle(el).getPropertyValue('--background-image'));
    return backgroundImage;
  }

  async hasBackgroundImage() {
    const bgImage = await this.getBackgroundImageURL();
    return bgImage && bgImage !== 'none' && bgImage.includes('url(');
  }

  async testAccordionBehavior() {
    const stepCount = await this.getStepCount();
    if (stepCount === 0) return false;

    // Test clicking different steps
    for (let i = 0; i < Math.min(stepCount, 3); i += 1) {
      await this.clickStep(i);
      await this.page.waitForTimeout(100); // Wait for animation

      const stepData = await this.getStepData(i);
      if (!stepData.isExpanded) {
        return false; // Step should be expanded after clicking
      }
    }

    return true;
  }

  async getAriaAttributes(stepIndex) {
    const step = this.stepItems.nth(stepIndex);
    const detailContainer = step.locator('.detail-container');

    return {
      ariaExpanded: await step.getAttribute('aria-expanded'),
      ariaControls: await step.getAttribute('aria-controls'),
      tabindex: await step.getAttribute('tabindex'),
      role: await step.getAttribute('role'),
      ariaLabelledby: await detailContainer.getAttribute('aria-labelledby'),
    };
  }

  async verifyAllAriaAttributes() {
    const stepCount = await this.getStepCount();
    const results = [];

    for (let i = 0; i < stepCount; i += 1) {
      const attrs = await this.getAriaAttributes(i);
      results.push({
        stepIndex: i,
        hasAriaExpanded: !!attrs.ariaExpanded,
        hasAriaControls: !!attrs.ariaControls,
        hasTabindex: attrs.tabindex === '0',
        hasRole: attrs.role === 'button',
        hasAriaLabelledby: !!attrs.ariaLabelledby,
      });
    }

    return results;
  }

  async getMediaData() {
    const hasPicture = await this.mediaPicture.count() > 0;
    const hasImage = await this.mediaImage.count() > 0;
    const hasVideo = await this.page.locator('.how-to-v2 .milo-video').count() > 0;
    const imageSrc = hasImage ? await this.mediaImage.first().getAttribute('src') : null;

    return {
      hasPicture,
      hasImage,
      hasVideo,
      imageSrc,
    };
  }
}
