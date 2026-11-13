import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../express/code/blocks/pricing-cards-credits/pricing-cards-credits.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Cards Credits', () => {
  let pricingCardsCredits;

  before(() => {
    pricingCardsCredits = document.querySelector('.pricing-cards-credits');
    decorate(pricingCardsCredits);
  });

  it('Pricing Cards Credits block exists and has important classes', () => {
    expect(pricingCardsCredits).to.exist;
    expect(pricingCardsCredits.classList.contains('pricing-cards-credits')).to.be.true;
  });

  it('Contains two card elements', () => {
    const cards = pricingCardsCredits.querySelectorAll('.card');
    expect(cards).to.have.length(2);
  });
  it('Contains one head count element', () => {
    const cards = pricingCardsCredits.querySelectorAll('.head-cnt');
    expect(cards).to.have.length(1);
  });

  it('Contains a card with gradient-promo class', () => {
    const gradientPromoCard = pricingCardsCredits.querySelector('.card.gradient-promo');
    expect(gradientPromoCard).to.exist;
  });

  it('Contains card-header elements', () => {
    const cardHeaders = pricingCardsCredits.querySelectorAll('.card-header');
    expect(cardHeaders).to.have.length(2);
  });

  it('Contains plan-explanation elements', () => {
    const planExplanations = pricingCardsCredits.querySelectorAll('.plan-explanation');
    expect(planExplanations).to.have.length(2);
  });

  it('Contains pricing-area-wrapper elements', () => {
    const pricingAreaWrappers = pricingCardsCredits.querySelectorAll('.pricing-area-wrapper');
    expect(pricingAreaWrappers).to.have.length(2);
  });

  it('Contains compare-all class on button containers', () => {
    const compareAllButtons = pricingCardsCredits.querySelectorAll('.compare-all');
    expect(compareAllButtons.length === 2).to.be.true;
  });
});
