import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/gen-ai-cards/gen-ai-cards.js'),
]);

const { default: decorate, windowHelper, decorateTextWithTag } = imports[1];
const testBody = await readFile({ path: './mocks/body.html' });

describe('Gen AI Cards', () => {
  let blocks;
  before(async () => {
    window.isTestEnv = true;
    document.body.innerHTML = testBody;
    window.placeholders = { 'search-branch-links': 'https://adobesparkpost.app.link/c4bWARQhWAb' };
    blocks = [...document.querySelectorAll('.gen-ai-cards')];
    await Promise.all(blocks.map((bl) => decorate(bl)));
  });
  afterEach(() => {
    window.placeholders = undefined;
  });

  it('should have all things', async () => {
    for (const block of blocks) {
      console.log(block);
      expect(block).to.exist;
      expect(block.querySelector('.gen-ai-cards-heading-section')).to.exist;
      expect(block.querySelectorAll('.card').length).to.equal(5);
      const cards = Array.from(block.querySelectorAll('.card'));
      expect(cards[0].classList.contains('gen-ai-action')).to.be.true;
      expect(cards[1].classList.contains('gen-ai-action')).to.be.false;
      expect(cards[2].classList.contains('gen-ai-action')).to.be.true;
      expect(cards[3].classList.contains('gen-ai-action')).to.be.true;
    }
  });

  it('should have all cards with proper children', async () => {
    for (const block of blocks) {
      const cards = Array.from(block.querySelectorAll('.card'));
      for (const card of cards) {
        expect(card.querySelector('.text-wrapper .cta-card-desc')).to.exist;
        expect(card.querySelector('.text-wrapper .cta-card-title')).to.exist;
        expect(card.querySelector('.media-wrapper picture')).to.exist;
      }
      const ctaCard = cards[1];
      const cta = ctaCard.querySelector('.links-wrapper a');
      expect(cta).to.exist;
      expect(cta.textContent).to.exist;
      expect(cta.href).to.exist;

      const form = cards[0].querySelector('.gen-ai-input-form');
      expect(form).to.exist;
      const input = form.querySelector('input');
      const button = form.querySelector('button');
      expect(input).to.exist;
      expect(button).to.exist;
      expect(input.placeholder).to.exist;
      expect(button.textContent).to.exist;
      expect(button.classList.contains('gen-ai-submit')).to.be.true;
    }
  });

  function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  it('should toggle submit button disabled based on input content', async () => {
    for (const block of blocks) {
      const cards = Array.from(block.querySelectorAll('.card'));
      const card = cards[0];
      const form = card.querySelector('.gen-ai-input-form');
      const input = form.querySelector('input');
      const button = form.querySelector('button');
      const stub = sinon.stub(windowHelper, 'redirect');
      expect(button.disabled).to.be.true;
      const enterEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(enterEvent);
      expect(button.disabled).to.be.true;
      expect(stub.called).to.be.false;
      form.dispatchEvent(new Event('submit'));
      expect(stub.called).to.be.false;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      expect(button.disabled).to.be.false;

      input.value = '';
      input.dispatchEvent(new Event('input'));
      expect(button.disabled).to.be.true;
      input.value = 'fakeInput';
      input.dispatchEvent(enterEvent);
      expect(stub.called).to.be.true;
      expect(decodeHTMLEntities(stub.firstCall.args[0])).to.equal(
        decodeHTMLEntities('https://new.express.adobe.com/new?category=media&#x26;prompt=fakeInput&#x26;action=text+to+image&#x26;width=1080&#x26;height=1080'),
      );

      stub.restore();
    }
  });

  it('should decorate text with tag', () => {
    const textWithTag = 'Sample text [NEW]';
    const result = decorateTextWithTag(textWithTag);
    expect(result.textContent).to.include('Sample text');
    expect(result.querySelector('.tag')).to.exist;
    expect(result.querySelector('.tag').textContent).to.equal('NEW');
  });

  it('should decorate text without tag', () => {
    const textWithoutTag = 'Sample text only';
    const result = decorateTextWithTag(textWithoutTag);
    expect(result.textContent).to.equal('Sample text only');
    expect(result.querySelector('.tag')).to.not.exist;
  });
});
