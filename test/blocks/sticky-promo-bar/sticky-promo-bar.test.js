import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const styles = await Promise.all([
  '../../../express/code/styles/styles.css',
  '../../../express/code/blocks/sticky-promo-bar/sticky-promo-bar.css',
].map((path) => readFile({ path })));

describe('Sticky promo bar link contrast', () => {
  const styleElements = [];
  let main;
  let hero;

  before(() => {
    styles.forEach((css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
      styleElements.push(style);
    });
  });

  beforeEach(() => {
    main = document.createElement('main');
    hero = document.createElement('div');
    hero.id = 'hero';
    main.append(hero);
    document.body.append(main);
  });

  afterEach(() => main.remove());
  after(() => styleElements.forEach((style) => style.remove()));

  [
    'shown',
    'rounded shown',
    'loadinbody rounded inbody shown',
    'loadinbody rounded clone',
  ].forEach((variant) => {
    it(`keeps ${variant} links white inside a hero without a background image`, () => {
      const block = document.createElement('div');
      block.className = `sticky-promo-bar ${variant}`;
      const content = document.createElement('div');
      const link = document.createElement('a');
      link.href = '#signup';
      link.textContent = 'Sign up';
      content.append(link);
      block.append(content);
      hero.append(block);

      expect(getComputedStyle(link).color).to.equal('rgb(255, 255, 255)');
    });
  });

  it('preserves the color of ordinary hero links', () => {
    const link = document.createElement('a');
    link.href = '#details';
    link.textContent = 'Details';
    hero.append(link);

    expect(getComputedStyle(link).color).to.equal('rgb(0, 0, 0)');
  });
});
