import { createSidePanel } from './side-panel/output/side-panel.js';

// Reads the side-panel copy from the authored block. The first paragraph holds
// comma-separated preview suggestions; the link is the promo CTA; the remaining
// paragraph is the promo title. Order-independent so authoring stays forgiving.
function extractContent(block) {
  const paragraphs = [...block.querySelectorAll('p')];
  const ctaLink = block.querySelector('a');
  const ctaParagraph = ctaLink?.closest('p');
  const suggestionsParagraph = paragraphs[0];
  const promoTitleParagraph = paragraphs.find(
    (p) => p !== suggestionsParagraph && p !== ctaParagraph,
  );

  return {
    suggestions: (suggestionsParagraph?.textContent ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    promoTitle: promoTitleParagraph?.textContent.trim() ?? '',
    promoCta: ctaLink
      ? { text: ctaLink.textContent.trim(), href: ctaLink.href }
      : null,
  };
}

export default function decorate(block) {
  block.classList.add('loading');

  const content = extractContent(block);

  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  const sideCol = document.createElement('div');
  sideCol.className = 'font-generator-col font-generator-col--side';
  sideCol.append(createSidePanel({
    ...content,
    categoryStyles: { all: 'bold-script', 'symbol text': 'weights' },
  }));

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  const auxCol = document.createElement('div');
  auxCol.className = 'font-generator-col font-generator-col--aux';

  grid.append(sideCol, mainCol, auxCol);
  block.replaceChildren(grid);
  block.classList.remove('loading');
}
