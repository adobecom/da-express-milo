export default class TemplateXPromo {
  constructor(page) {
    this.page = page;

    // Main block selectors - scope to first template-x-promo block
    this.templateXPromo = page.locator('.template-x-promo').first();
    this.carouselWrapper = this.templateXPromo.locator('.promo-carousel-wrapper');
    this.carouselViewport = this.templateXPromo.locator('.promo-carousel-viewport');
    this.carouselTrack = this.templateXPromo.locator('.promo-carousel-track');

    // Templates - scoped to first block
    this.templates = this.templateXPromo.locator('.template');
    this.templateImages = this.templateXPromo.locator('.template img');
    this.templateTitles = this.templateXPromo.locator('.template .template-title');

    // Navigation - scoped to first block
    this.prevButton = this.templateXPromo.locator('.promo-prev-btn');
    this.nextButton = this.templateXPromo.locator('.promo-next-btn');
    this.navControls = this.templateXPromo.locator('.promo-nav-controls');

    // Hover overlays - scoped to first block
    this.buttonContainers = this.templateXPromo.locator('.button-container');
    this.editButtons = this.templateXPromo.locator('.button-container a.button');
    this.shareButtons = this.templateXPromo.locator('.share-icon-wrapper');

    // A11y elements
    this.carouselStatus = page.locator('#carousel-status');

    // Global elements
    this.globalFooter = page.locator('.global-footer');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    // Wait for either global footer or the template-x-promo block to be visible
    try {
      await this.globalFooter.waitFor({ timeout: 5000 });
    } catch (error) {
      // If global footer is not present, wait for the template-x-promo block instead
      await this.templateXPromo.waitFor({ timeout: 10000 });
    }
  }

  async waitForTemplates() {
    await this.templates.first().waitFor();
    await this.templateImages.first().waitFor();
  }

  async getTemplateCount() {
    return this.templates.count();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickPrev() {
    await this.prevButton.click();
  }

  async hoverTemplate(index = 0) {
    await this.templates.nth(index).hover();
  }

  async isCarouselVisible() {
    return this.carouselWrapper.isVisible();
  }

  async areNavigationButtonsVisible() {
    return this.navControls.isVisible();
  }

  // Navigation and keyboard testing methods
  async focusTemplate(index = 0) {
    await this.templates.nth(index).focus();
  }

  async getFocusedTemplate() {
    return this.page.locator('.template:focus');
  }

  async getTemplateWithSingletonHover() {
    return this.page.locator('.template.singleton-hover');
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  async getActiveElement() {
    return this.page.locator(':focus');
  }

  async getTemplateTabIndex(index = 0) {
    return this.templates.nth(index).getAttribute('tabindex');
  }

  async getEditButtonTabIndex(index = 0) {
    return this.editButtons.nth(index).getAttribute('tabindex');
  }

  async getShareButtonTabIndex(index = 0) {
    return this.shareButtons.nth(index).getAttribute('tabindex');
  }

  async getCtaLinkTabIndex(index = 0) {
    return this.page.locator('.cta-link').nth(index).getAttribute('tabindex');
  }

  async isTemplateFocusable(index = 0) {
    const tabindex = await this.getTemplateTabIndex(index);
    return tabindex === '0';
  }

  async hasSingletonHoverClass(index = 0) {
    const template = this.templates.nth(index);
    const hasClass = await template.evaluate((el) => el.classList.contains('singleton-hover'));
    return hasClass;
  }

  async getTemplateAriaLabel(index = 0) {
    return this.templates.nth(index).getAttribute('aria-label');
  }

  async getTemplateRole(index = 0) {
    return this.templates.nth(index).getAttribute('role');
  }

  async getEditButtonAriaLabel(index = 0) {
    return this.editButtons.nth(index).getAttribute('aria-label');
  }

  async getShareButtonAriaLabel(index = 0) {
    return this.shareButtons.nth(index).getAttribute('aria-label');
  }

  async getShareButtonRole(index = 0) {
    return this.shareButtons.nth(index).getAttribute('role');
  }

  async isButtonContainerVisible(index = 0) {
    return this.buttonContainers.nth(index).isVisible();
  }

  async waitForButtonContainerToAppear(index = 0) {
    await this.buttonContainers.nth(index).waitFor({ state: 'visible' });
  }

  async waitForButtonContainerToDisappear(index = 0) {
    await this.buttonContainers.nth(index).waitFor({ state: 'hidden' });
  }

  // Carousel navigation methods
  async isNextButtonEnabled() {
    const button = this.nextButton;
    const isDisabled = await button.getAttribute('disabled');
    return isDisabled === null;
  }

  async isPrevButtonEnabled() {
    const button = this.prevButton;
    const isDisabled = await button.getAttribute('disabled');
    return isDisabled === null;
  }

  async getCarouselTrackHeight() {
    if (await this.carouselTrack.isVisible()) {
      return this.carouselTrack.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          minHeight: el.style.minHeight,
          computedHeight: computed.height,
          offsetHeight: el.offsetHeight,
        };
      });
    }
    return null;
  }

  async getCurrentTemplateIndex() {
    // Look for current-template class if in carousel mode
    const currentTemplate = this.page.locator('.template.current-template');
    if (await currentTemplate.isVisible()) {
      return currentTemplate.evaluate((el) => {
        const allTemplates = Array.from(el.closest('.promo-carousel-track').querySelectorAll('.template'));
        return allTemplates.indexOf(el);
      });
    }
    return 0;
  }

  async waitForCarouselAnimation() {
    // Wait for carousel transition to complete
    await this.page.waitForTimeout(500);
  }

  // API and loading methods
  async waitForApiResponse() {
    // Wait for network to be idle (API calls complete)
    await this.page.waitForLoadState('networkidle');
  }

  async hasTemplateWithClass(className) {
    const template = this.page.locator(`.template.${className}`);
    return template.isVisible();
  }

  // Responsive testing methods
  async setViewportSize(width, height) {
    await this.page.setViewportSize({ width, height });
  }

  async isMobileViewport() {
    const viewport = this.page.viewportSize();
    return viewport.width <= 767;
  }

  async isDesktopLayout() {
    // Check if templates are in parent container (desktop) vs carousel (mobile)
    const desktopTemplates = this.page.locator('.template:not(.prev-template):not(.next-template):not(.current-template)');
    return desktopTemplates.count() > 0;
  }

  // Enhanced interaction methods
  async clickEditButton(index = 0) {
    // Focus template first to make button visible
    await this.focusTemplate(index);
    await this.waitForButtonContainerToAppear(index);

    const editButton = this.editButtons.nth(index);
    await editButton.click();
  }

  async clickShareButton(index = 0) {
    await this.focusTemplate(index);
    await this.waitForButtonContainerToAppear(index);

    const shareButton = this.shareButtons.nth(index);
    await shareButton.click();
  }
}
