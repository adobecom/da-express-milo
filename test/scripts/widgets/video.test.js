import { expect } from '@esm-bundle/chai';
import { isVideoLink } from '../../../express/code/scripts/widgets/video.js';

describe('video widget URL detection', () => {
  it('recognizes Creative Cloud Player embed URLs as video links', () => {
    const url = 'https://cdn.cp.adobe.io/content/2/video/7f769ad6-be61-4d2e-a338-e9ef051cea90/embed?api_key=MarvelCP1';
    expect(isVideoLink(url)).to.be.true;
  });

  it('does not classify generic cdn.cp.adobe.io URLs as video links', () => {
    const url = 'https://cdn.cp.adobe.io/content/2/image/some-id/embed?api_key=MarvelCP1';
    expect(isVideoLink(url)).to.be.false;
  });
});
