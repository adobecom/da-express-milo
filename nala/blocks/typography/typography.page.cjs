export default class Typography {
  constructor(page) {
    this.page = page;
    this.paragraphs = page.locator('main p');
    this.unorderedLists = page.locator('main ul');
    this.orderedLists = page.locator('main ol');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async getFontSize(element) {
    return element.evaluate((el) => window.getComputedStyle(el).fontSize);
  }

  async getLineHeight(element) {
    return element.evaluate((el) => window.getComputedStyle(el).lineHeight);
  }

  async compareParagraphAndListFontSizes() {
    const pCount = await this.paragraphs.count();
    const ulCount = await this.unorderedLists.count();
    const olCount = await this.orderedLists.count();

    if (pCount === 0) {
      return { canCompare: false, reason: 'No p elements found' };
    }

    const pFontSize = await this.getFontSize(this.paragraphs.first());
    const results = {
      pFontSize,
      pCount,
      ulCount,
      olCount,
    };

    if (ulCount > 0) {
      const ulFontSize = await this.getFontSize(this.unorderedLists.first());
      results.ulFontSize = ulFontSize;
      results.ulMatchesP = pFontSize === ulFontSize;
    }

    if (olCount > 0) {
      const olFontSize = await this.getFontSize(this.orderedLists.first());
      results.olFontSize = olFontSize;
      results.olMatchesP = pFontSize === olFontSize;
    }

    return results;
  }

  async getAllTypographyStyles() {
    const pCount = await this.paragraphs.count();
    const ulCount = await this.unorderedLists.count();
    const olCount = await this.orderedLists.count();

    const results = {
      p: null,
      ul: null,
      ol: null,
    };

    if (pCount > 0) {
      const pElement = this.paragraphs.first();
      results.p = {
        fontSize: await this.getFontSize(pElement),
        lineHeight: await this.getLineHeight(pElement),
      };
    }

    if (ulCount > 0) {
      const ulElement = this.unorderedLists.first();
      results.ul = {
        fontSize: await this.getFontSize(ulElement),
        lineHeight: await this.getLineHeight(ulElement),
      };
    }

    if (olCount > 0) {
      const olElement = this.orderedLists.first();
      results.ol = {
        fontSize: await this.getFontSize(olElement),
        lineHeight: await this.getLineHeight(olElement),
      };
    }

    return results;
  }
}
