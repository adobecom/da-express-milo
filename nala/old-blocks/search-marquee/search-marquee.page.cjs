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
    return this.searchForm.first().isVisible();
  }

  async getSearchBarPlaceholder() {
    const count = await this.searchBar.count();
    if (count === 0) return null;
    return this.searchBar.first().getAttribute('placeholder');
  }

  async getSearchBarEnterKeyHint() {
    const count = await this.searchBar.count();
    if (count === 0) return null;
    return this.searchBar.first().getAttribute('enterkeyhint');
  }

  async isSearchBarWrapperVisible() {
    return this.searchBarWrapper.first().isVisible();
  }

  async hasSearchBarWrapperShowClass() {
    return this.searchBarWrapper.first().evaluate((el) => el.classList.contains('show'));
  }

  async typeInSearchBar(text) {
    await this.searchBar.first().fill(text);
  }

  async clickSearchBar() {
    await this.searchBar.first().click();
  }

  async isSearchDropdownVisible() {
    return this.searchDropdown.first().isVisible();
  }

  async isClearButtonVisible() {
    return this.clearButton.first().isVisible();
  }
}
