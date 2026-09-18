/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { getColorModeChannels } from '../../../../express/code/libs/color-components/utils/colorModeChannels.js';

describe('getColorModeChannels', () => {
  it('returns null for HEX and for unrecognized modes', () => {
    expect(getColorModeChannels('#ff0000', 'HEX')).to.equal(null);
    expect(getColorModeChannels('#ff0000', 'nonsense')).to.equal(null);
  });

  it('RGB: plain numbers, no unit suffix', () => {
    expect(getColorModeChannels('#ff0000', 'RGB')).to.deep.equal([
      { label: 'R', value: '255' },
      { label: 'G', value: '0' },
      { label: 'B', value: '0' },
    ]);
  });

  it('HSB: plain numbers, no % on any channel', () => {
    expect(getColorModeChannels('#ff0000', 'HSB')).to.deep.equal([
      { label: 'H', value: '0' },
      { label: 'S', value: '100' },
      { label: 'B', value: '100' },
    ]);
  });

  it('Lab: plain numbers, no % on any channel', () => {
    const [l, a, b] = getColorModeChannels('#ff0000', 'Lab');
    expect(l.label).to.equal('L');
    expect(l.value).to.not.include('%');
    expect(a.label).to.equal('a');
    expect(a.value).to.not.include('%');
    expect(b.label).to.equal('b');
    expect(b.value).to.not.include('%');
  });

  it('joining channel values reproduces the same string regardless of caller (swatch rail vs gradient editor)', () => {
    const channels = getColorModeChannels('#0d00f4', 'HSB');
    expect(channels.map((c) => c.value).join(', ')).to.equal('243, 100, 96');
  });
});
