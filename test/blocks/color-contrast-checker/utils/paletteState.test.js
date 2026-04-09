import { expect } from '@esm-bundle/chai';

import syncPaletteSelections from '../../../../express/code/blocks/color-contrast-checker/utils/paletteState.js';

describe('color-contrast-checker paletteState', () => {
  it('replaces the previously selected foreground and background colors in the palette', () => {
    const colors = ['#FFFFFF', '#999999', '#111111', '#333333'];

    const nextColors = syncPaletteSelections(
      colors,
      '#FFFFFF',
      '#111111',
      '#F5F5F5',
      '#0A0A0A',
    );

    expect(nextColors).to.deep.equal(['#F5F5F5', '#999999', '#0A0A0A', '#333333']);
  });

  it('keeps repeated edits in sync by replacing the last selected colors', () => {
    const colors = ['#F5F5F5', '#999999', '#0A0A0A', '#333333'];

    const nextColors = syncPaletteSelections(
      colors,
      '#F5F5F5',
      '#0A0A0A',
      '#EFEFEF',
      '#050505',
    );

    expect(nextColors).to.deep.equal(['#EFEFEF', '#999999', '#050505', '#333333']);
  });

  it('falls back to leading slots when previous selections are missing', () => {
    const colors = ['#AAAAAA', '#BBBBBB', '#CCCCCC'];

    const nextColors = syncPaletteSelections(
      colors,
      '#FFFFFF',
      '#000000',
      '#123456',
      '#654321',
    );

    expect(nextColors).to.deep.equal(['#123456', '#654321', '#CCCCCC']);
  });
});
