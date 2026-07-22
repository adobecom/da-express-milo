import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;
const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});
const { default: init } = await import('../../../express/code/blocks/how-to-cards/how-to-cards.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('How-to-cards', () => {
  let blocks;
  before(async () => {
    blocks = [...document.querySelectorAll('.how-to-cards')];
  });
  after(() => {});
  it('decorates into gallery of steps', async () => {
    const bl = await init(blocks[0]);
    const ol = bl.querySelector('ol');
    expect(ol).to.exist;
    expect(ol.classList.contains('gallery')).to.be.true;
    expect(ol.classList.contains('cards-container')).to.be.true;
    const lis = [...ol.querySelectorAll('li')];
    lis.forEach((li) => {
      expect(li.classList.contains('gallery--item'));
      expect(li.classList.contains('card'));
    });
    expect(lis.length).to.equal(5);
  });

  it('adds step numbers to cards', async () => {
    const numbers = blocks[0].querySelectorAll('number');
    [...numbers].forEach((number, i) => {
      expect(number.querySelector('number-txt')?.textContent === i + 1);
    });
  });
  it('adds schema with schema variant', async () => {
    const ldjson = document.head.querySelector('script[type="application/ld+json"]');
    expect(ldjson).to.exist;
    expect(ldjson.textContent).to.equal(JSON.stringify({
      '@context': 'http://schema.org',
      '@type': 'HowTo',
      name: 'Get started for free.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Get started for free.',
          itemListElement: {
            '@type': 'HowToDirection',
            text: 'Go to Adobe Express and sign into your Adobe account. If you don’t have one, you can quickly create a free account.',
          },
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Enter your prompt.',
          itemListElement: {
            '@type': 'HowToDirection',
            text: 'Type a description of what you want to see in the prompt field. Get specific.',
          },
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Brand your poster.',
          itemListElement: {
            '@type': 'HowToDirection',
            text: 'When you’re satisfied with your prompt, click Generate. The results will appear in a few seconds.',
          },
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Share your poster.',
          itemListElement: {
            '@type': 'HowToDirection',
            text: 'Play with settings to explore different variations. In the panel on the right, you can adjust everything from aspect ratio to content type to camera angle.',
          },
        },
        {
          '@type': 'HowToStep',
          position: 5,
          name: 'Share your poster.',
          itemListElement: {
            '@type': 'HowToDirection',
            text: 'Play with settings to explore different variations. In the panel on the right, you can adjust everything from aspect ratio to content type to camera angle.',
          },
        },
      ],
    }));
  });
  it('decorates h2 headline + text', async () => {
    const bl = await init(blocks[1]);
    expect(bl.querySelector('div').classList.contains('text')).to.be.true;
    expect(bl.querySelector('div h2')).to.exist;
  });

  it('supports summary variant without carousel and numbers', async () => {
    const bl = await init(blocks[2]);
    const cardsContainer = bl.querySelector('.cards-container');
    expect(cardsContainer).to.exist;
    expect(cardsContainer.classList.contains('gallery')).to.be.false;
    expect(bl.querySelector('.gallery-control')).to.not.exist;
    expect(bl.querySelectorAll('.number').length).to.equal(0);
    expect(bl.querySelectorAll('.step-icon').length).to.equal(3);
  });
});
