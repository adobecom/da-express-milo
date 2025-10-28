import { addTempWrapperDeprecated, isEmptyValue, hasContent } from '../../scripts/utils.js';

export default function decorate(block) {
  if (!block.parentElement.classList.contains('long-text-wrapper')) {
    addTempWrapperDeprecated(block, 'long-text');
  }

  if (block.classList.contains('plain')) {
    block.parentElement.classList.add('plain');
  }

  if (block.classList.contains('no-background')) {
    block.parentElement.classList.add('no-background');

    // Create simplified article structure for no-background variant
    const h2Elements = block.querySelectorAll('h2');
    if (h2Elements.length > 0) {
      const allContentElements = Array.from(block.querySelectorAll('h2, p'));
      block.innerHTML = '';

      let currentArticle = null;

      allContentElements.forEach((element) => {
        if (element.tagName === 'H2') {
          // Start a new article for each H2
          currentArticle = document.createElement('article');
          currentArticle.appendChild(element);
          block.appendChild(currentArticle);
        } else if (element.tagName === 'P'
                   && currentArticle
                   && hasContent(element)) {
          // Add valid paragraphs to the current article
          currentArticle.appendChild(element);
        }
      });
    }
  }

  if (block.textContent.trim() === '') {
    if (block.parentElement.classList.contains('long-text-wrapper')) {
      block.parentElement.remove();
    } else {
      block.remove();
    }
  }

  // Remove empty or null paragraphs
  block.querySelectorAll('p').forEach((p) => {
    if (isEmptyValue(p)) {
      p.remove();
    }
  });
}
