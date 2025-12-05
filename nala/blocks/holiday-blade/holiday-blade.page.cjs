class HolidayBladeBlock {
  constructor(page, selector = '.holiday-blade', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HolidayBladeBlock;
