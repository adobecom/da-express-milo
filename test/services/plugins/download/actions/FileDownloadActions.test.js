/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// eslint-disable-next-line import/no-unresolved
import { FileDownloadActions } from '../../../../../../express/code/libs/services/plugins/download/actions/DownloadActions.js';

const themeData = {
  name: 'Jolly Rancher',
  swatches: [
    { rgb: { r: 217 / 255, g: 159 / 255, b: 89 / 255 } },
    { rgb: { r: 1, g: 1, b: 1 } },
  ],
};

const gradientThemeData = {
  name: 'Sunset',
  assetType: 'gradient',
  swatches: [
    { rgb: { r: 217 / 255, g: 159 / 255, b: 89 / 255 }, offset: 0, midpoint: 0.5 },
    { rgb: { r: 1, g: 1, b: 1 }, offset: 1, midpoint: 0.5 },
  ],
};

describe('FileDownloadActions — downloadAsJPEG', () => {
  let actions;
  let clickSpy;

  beforeEach(() => {
    actions = new FileDownloadActions();
    // performDownload triggers a real anchor click — spy on it instead of
    // letting jsdom/Chrome actually navigate, same approach as stubbing
    // clipboard writes in the ExportActions tests.
    clickSpy = sinon.spy(HTMLAnchorElement.prototype, 'dispatchEvent');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('regression: gradients render a real gradient image, not the per-swatch palette JPEG layout', async () => {
    const { fileName } = await actions.downloadAsJPEG(gradientThemeData);
    expect(fileName).to.equal('AdobeColorGradient Sunset.jpeg');
    expect(clickSpy.calledOnce).to.equal(true);
  });

  it('palette JPEGs are unaffected — same filename convention as before', async () => {
    const { fileName } = await actions.downloadAsJPEG(themeData);
    expect(fileName).to.equal('AdobeColor-Jolly Rancher.jpeg');
    expect(clickSpy.calledOnce).to.equal(true);
  });
});
