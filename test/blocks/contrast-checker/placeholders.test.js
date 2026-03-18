import { expect } from '@esm-bundle/chai';
import { createContrastCheckerPlaceholders, DEFAULT_PLACEHOLDERS } from '../../../express/code/blocks/contrast-checker/utils/placeholders.js';

describe('contrast-checker placeholders', () => {
  it('returns default tabs from the shared placeholder source', () => {
    const placeholders = createContrastCheckerPlaceholders();

    expect(placeholders.randomPresetName).to.equal(DEFAULT_PLACEHOLDERS.randomPresetName);
    expect(placeholders.contrastRatioTooltip).to.equal(DEFAULT_PLACEHOLDERS.contrastRatioTooltip);
    expect(placeholders.tabs).to.deep.equal([
      { label: DEFAULT_PLACEHOLDERS.summaryTabLabel, value: 'summary' },
      { label: DEFAULT_PLACEHOLDERS.suggestionsTabLabel, value: 'suggestions' },
      { label: DEFAULT_PLACEHOLDERS.setRatioTabLabel, value: 'set-ratio' },
    ]);
  });

  it('rebuilds dependent values when overrides are provided', () => {
    const placeholders = createContrastCheckerPlaceholders({
      summaryTabLabel: 'Overview',
      suggestionsTabLabel: 'Recommendations',
      setRatioTabLabel: 'Target ratio',
      contrastRatioTooltip: 'Check this ratio against WCAG',
      preview: 'Live preview',
    });

    expect(placeholders.preview).to.equal('Live preview');
    expect(placeholders.contrastRatioTooltip).to.equal('Check this ratio against WCAG');
    expect(placeholders.tabs).to.deep.equal([
      { label: 'Overview', value: 'summary' },
      { label: 'Recommendations', value: 'suggestions' },
      { label: 'Target ratio', value: 'set-ratio' },
    ]);
  });
});
