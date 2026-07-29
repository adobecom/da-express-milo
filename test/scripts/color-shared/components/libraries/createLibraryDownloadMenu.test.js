/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { serviceManager } from '../../../../../express/code/libs/services/index.js';
import { createLibraryDownloadMenu } from '../../../../../express/code/scripts/color-shared/components/libraries/createLibraryDownloadMenu.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

const strings = createColorLibrariesPlaceholders();

describe('createLibraryDownloadMenu', () => {
  let menu;

  afterEach(() => {
    menu?.destroy?.();
    menu = null;
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('renders ASE and JPEG options for themes', () => {
    menu = createLibraryDownloadMenu({
      item: {
        type: 'theme',
        name: 'Ocean',
        colors: ['#001122', '#334455'],
      },
      strings,
    });

    const labels = [...menu.element.querySelectorAll('sp-menu-item')].map((item) => item.textContent);
    expect(labels).to.include(strings.librariesDownloadAsASE);
    expect(labels).to.include(strings.librariesDownloadAsJPEG);
  });

  it('renders PNG and SVG options for gradients', () => {
    menu = createLibraryDownloadMenu({
      item: {
        type: 'gradient',
        name: 'Sunset',
        colorStops: [
          { color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
        ],
      },
      strings,
    });

    const labels = [...menu.element.querySelectorAll('sp-menu-item')].map((item) => item.textContent);
    expect(labels).to.deep.equal([
      strings.librariesDownloadAsPNG,
      strings.librariesDownloadAsSVG,
    ]);
  });

  it('invokes download provider when a theme format is selected', async () => {
    const downloadJPEG = sinon.stub().resolves();
    sinon.stub(serviceManager, 'init').resolves();
    sinon.stub(serviceManager, 'getProvider').resolves({ downloadJPEG });

    menu = createLibraryDownloadMenu({
      item: {
        type: 'theme',
        name: 'Ocean',
        colors: ['#001122'],
      },
      strings,
    });
    document.body.appendChild(menu.element);

    menu.element.querySelector('sp-menu-item[value="jpeg"]').click();
    await Promise.resolve();
    await Promise.resolve();

    expect(downloadJPEG.calledOnce).to.be.true;
    expect(downloadJPEG.firstCall.args[0].name).to.equal('Ocean');
  });
});
