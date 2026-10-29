import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { waitFor } from '../../../helpers/waitfor.js';

setLibs('/libs');

const imports = await Promise.all([
  import('../../../../express/code/scripts/scripts.js'),
  import('../../../../express/code/scripts/widgets/compact-nav-carousel.js'),
]);

const { default: buildCompactNavCarousel } = imports[1];
const testBody = await readFile({ path: './mocks/body.html' });

function scrollToRight() {
  const platform = document.querySelector('.compact-nav-carousel-platform');
  if (platform) {
    platform.scrollLeft = platform.scrollWidth - platform.clientWidth;
  }
}

describe('Compact Nav Carousel', () => {
  let block;
  before(async () => {
    document.body.innerHTML = testBody;
    block = document.querySelector('.gen-ai-cards');
    await buildCompactNavCarousel('.card', block, {});
  });

  it('should have all things', async () => {
    expect(block).to.exist;
    await waitFor(() => !!block.querySelector('.gallery-control'));
    expect(document.querySelectorAll('.card').length).to.equal(6);
    expect(document.querySelector('button.prev')).to.exist;
    expect(document.querySelector('button.next')).to.exist;
    expect(document.querySelector('.compact-nav-carousel-platform')).to.exist;

    scrollToRight();
  });
});
