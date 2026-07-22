import { expect } from '@esm-bundle/chai';
import {
  capitalizeTagLabel,
  createTagPill,
} from '../../../../express/code/scripts/color-shared/toolbar/createTagField.js';

describe('createTagField helpers', () => {
  it('capitalizes the first character of localized tag labels', () => {
    expect(capitalizeTagLabel('bleu')).to.equal('Bleu');
    expect(capitalizeTagLabel('vert fonce')).to.equal('Vert fonce');
  });

  it('renders a capitalized label while preserving the saved tag value', () => {
    const pill = createTagPill('bold', { removeLabel: 'Remove {{tag}}' });

    expect(pill.dataset.tagValue).to.equal('bold');
    expect(pill.querySelector('.ax-tag-pill-label').textContent).to.equal('Bold');
    expect(pill.querySelector('.ax-tag-pill-close').getAttribute('aria-label')).to.equal('Remove Bold');
  });
});
