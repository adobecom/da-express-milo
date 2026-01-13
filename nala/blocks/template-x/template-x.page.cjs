export default class TemplateX {
  constructor(page) {
    this.page = page;
    this.searchBarWrapper = page.locator('.toolbar-wrapper .search-bar-wrapper');
  }
}
