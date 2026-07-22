class PlaylistBlock {
  constructor(page, selector = '.playlist', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = PlaylistBlock;
