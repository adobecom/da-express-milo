import { expect } from '@esm-bundle/chai';

import { libraryGradientToBackgroundImage } from '../../../../../express/code/scripts/color-shared/components/libraries/libraryUtils.js';

describe('libraryGradientToBackgroundImage', () => {
  it('builds CSS from CC Library color stops', () => {
    const css = libraryGradientToBackgroundImage({
      angle: 90,
      colorStops: [
        {
          color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }],
          offset: 0,
        },
        {
          color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }],
          offset: 1,
        },
      ],
    });

    expect(css).to.equal('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
  });
});
