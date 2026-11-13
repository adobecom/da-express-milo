import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});
const { default: decorate } = await import('../../../express/code/blocks/app-ratings/app-ratings.js');

describe('App Ratings', () => {
  before(async () => {
    const body = await readFile({ path: './mocks/body.html' });
    document.body.innerHTML = body;
    window.placeholders = {
      'app-store-ratings': '4.9, 233.8k ratings; 4.6, 117k ratings; https://adobesparkpost.app.link/GJrBPFUWBBb',
      'app-store-stars': 'Stars',
      'app-store-ratings-play-store': 'app-store-ratings-play-store',
      'app-store-ratings-apple-store': 'app-store-ratings-apple-store',
    };
  });

  after(async () => {
    document.body.innerHTML = '';
  });

  it('App Ratings exists', async () => {
    const blocks = document.getElementsByClassName('app-ratings');
    expect(blocks.length).to.equal(1);
    for (const block of blocks) {
      await decorate(block);
      const googleRating = block.querySelector('.ratings');
      expect(googleRating).to.exist;
    }
  });
});
