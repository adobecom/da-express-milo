export default class SearchMarquee {
  constructor(page) {
    this.page = page;

    // Main block selectors
    this.searchMarquee = page.locator('.search-marquee');
    this.searchBarWrapper = page.locator('.search-bar-wrapper');
    this.searchForm = page.locator('.search-form');
    this.searchBar = page.locator('input.search-bar');
    this.searchDropdown = page.locator('.search-dropdown-container');

    // Search functionality elements
    this.clearButton = page.locator('.icon-search-clear');
    this.trendsContainer = page.locator('.trends-container');
    this.suggestionsContainer = page.locator('.suggestions-container');
    this.suggestionsList = page.locator('.suggestions-list');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForSearchBar() {
    await this.searchBar.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async isSearchFormVisible() {
    return this.searchForm.isVisible();
  }

  async getSearchBarPlaceholder() {
    const count = await this.searchBar.count();
    if (count === 0) return null;
    return this.searchBar.getAttribute('placeholder');
  }

  async getSearchBarEnterKeyHint() {
    const count = await this.searchBar.count();
    if (count === 0) return null;
    return this.searchBar.getAttribute('enterkeyhint');
  }

  async isSearchBarWrapperVisible() {
    return this.searchBarWrapper.isVisible();
  }

  async hasSearchBarWrapperShowClass() {
    return this.searchBarWrapper.evaluate((el) => el.classList.contains('show'));
  }

  async typeInSearchBar(text) {
    await this.searchBar.fill(text);
  }

  async clickSearchBar() {
    await this.searchBar.click();
  }

  async isSearchDropdownVisible() {
    return this.searchDropdown.isVisible();
  }

  async isClearButtonVisible() {
    return this.clearButton.isVisible();
  }
}
