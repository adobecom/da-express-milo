import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/simplified-pricing-cards/simplified-pricing-cards.js')]);
const { getLibs } = imports[0];
const { default: decorate } = imports[2];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'iwo3rvz.css' } } });
});

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Cards', () => {
  let blocks;
  let cardCnts;
  let fetchStub;

  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.simplified-pricing-cards'));
    await Promise.all(blocks.map((block) => decorate(block)));
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    // Restore the original functionality after each test
    fetchStub.restore();
  });

  it('Pricing Cards exists', () => {
    expect(blocks.every((block) => !!block.querySelector('div.card'))).to.be.true;
  });

  it(`Card counts to be ${cardCnts}`, () => {
    const cards = document.querySelectorAll('.card');
    expect(cards.length).to.equal(4);
  });

  it('Cards contain necessary elements', () => {
    blocks.forEach((block) => {
      const cardContainer = block.querySelector('div.card-wrapper');
      expect(cardContainer).to.exist;
      const cards = cardContainer.querySelectorAll('.card');

      cards.forEach((card) => {
        expect(card.querySelector('.card-header')).to.exist;
        expect(card.querySelector('.plan-explanation')).to.exist;
        expect(card.querySelector('.pricing-area')).to.exist;
        expect(card.querySelector('.card-cta-group')).to.exist;
      });

      expect(block.querySelectorAll('.compare-all-button')).to.exist;
    });
  });

  it('Special and gradient promo classes are added', () => {
    expect(document.querySelectorAll('.gradient-promo')).to.have.lengthOf.at.least(2);
  });
});
