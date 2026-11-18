import { expect } from '@esm-bundle/chai';
import { setLibs, getIconElementDeprecated } from '../../../express/code/scripts/utils.js';
import {
  labelLoadMoreButton as labelTemplateX,
  LOAD_MORE_ARIA_LABEL as LABEL_X,
} from '../../../express/code/blocks/template-x/template-x.js';
import {
  labelLoadMoreButton as labelTemplateList,
  LOAD_MORE_ARIA_LABEL as LABEL_LIST,
} from '../../../express/code/blocks/template-list/template-list.js';

setLibs('/libs');

const blocks = [
  ['template-x', labelTemplateX, LABEL_X],
  ['template-list', labelTemplateList, LABEL_LIST],
];

function buildButton() {
  const button = document.createElement('button');
  button.className = 'load-more-button';
  button.append(getIconElementDeprecated('plus-icon'));
  return button;
}

describe('Load more button accessible name', () => {
  blocks.forEach(([name, label, constant]) => {
    describe(name, () => {
      it('load more button has aria-label "Load More templates"', () => {
        const button = buildButton();
        label(button);
        expect(constant).to.equal('Load More templates');
        expect(button.getAttribute('aria-label')).to.equal('Load More templates');
        expect(button.getAttribute('aria-label')).to.include('Load More');
      });

      it('makes the plus icon decorative and keeps the class', () => {
        const button = buildButton();
        label(button);
        const icon = button.querySelector('.icon');
        expect(icon.getAttribute('aria-hidden')).to.equal('true');
        if (icon.tagName === 'IMG') expect(icon.getAttribute('alt')).to.equal('');
        expect(button.className).to.equal('load-more-button');
      });

      it('an unlabelled button has no aria-label', () => {
        expect(buildButton().hasAttribute('aria-label')).to.be.false;
      });
    });
  });
});
