export default class FloatingButton {
  constructor(page) {
    this.page = page;
    this.section = page.locator('.floating-button-wrapper'); // Adjusted to match the test case
    this.floatingButton = page.locator('.floating-button');
  }
}
