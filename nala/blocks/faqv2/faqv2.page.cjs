class Faqv2 {
  constructor(page) {
    this.page = page;

    // Selectors
    this.faqv2 = this.page.locator('.faqv2');
    this.section = this.page.locator('.section').filter({ has: this.faqv2 });

    // Default variant selectors
    this.defaultAccordion = this.page.locator('.faqv2-accordion');
    this.defaultHeader = this.page.locator('.faqv2-header');
    this.defaultSubHeader = this.page.locator('.faqv2-sub-header');
    this.toggleButton = this.page.locator('.faqv2-toggle-btn');

    // Expandable variant selectors
    this.expandableWrapper = this.page.locator('.faqv2-wrapper');
    this.expandableToggle = this.page.locator('.faqv2-toggle');
    this.expandableHeader = this.page.locator('.faqv2-header');
    this.expandableContent = this.page.locator('.faqv2-content');
    this.toggleIcon = this.page.locator('.toggle-icon');
    this.accordionsCol = this.page.locator('.faqv2-accordions-col');

    // Longform variant selectors
    this.longformHeaderContainer = this.page.locator('.faqv2-longform-header-container');
    this.accordionTitle = this.page.locator('.faqv2-accordion.title');

    // Variants
    this.variants = {
      default: this.page.locator('.faqv2:not(.expandable)'),
      expandable: this.page.locator('.faqv2.expandable:not(.longform)'),
      longform: this.page.locator('.faqv2.expandable.longform'),
    };
  }
}

module.exports = Faqv2;
