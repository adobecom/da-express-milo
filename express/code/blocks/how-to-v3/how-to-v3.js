/* eslint-disable import/named, import/extensions */
import { createTag, getMetadata } from '../../scripts/utils.js';

function setStepDetails(block, indexOpenedStep) {
  const listItems = block.querySelectorAll(':scope li');

  listItems.forEach((item, i) => {
    const detail = item.querySelector('.detail-container');
    const isOpen = i === indexOpenedStep;

    if (isOpen) {
      detail.classList.remove('closed');
      detail.style.maxHeight = `${detail.scrollHeight}px`;
      item.setAttribute('aria-expanded', 'true');
    } else {
      detail.classList.add('closed');
      detail.style.maxHeight = '0';
      item.setAttribute('aria-expanded', 'false');
    }
  });
}

function buildAccordion(block, rows, stepsContent) {
  let indexOpenedStep = 0;
  const list = createTag('OL', { class: 'steps' });

  rows.forEach((row, i) => {
    const [stepTitle, stepDetail] = row.querySelectorAll(':scope div');
    stepTitle.textContent = `${1 + i}. ${stepTitle.textContent}`;
    const titleId = `step-title-${i}`;
    const detailId = `step-detail-${i}`;

    const newStepTitle = createTag('h3', { id: titleId });
    newStepTitle.replaceChildren(...stepTitle.childNodes);

    const listItem = createTag('LI', {
      class: 'step',
      tabindex: '0',
      'aria-expanded': i === 0 ? 'true' : 'false',
      'aria-controls': detailId,
    });
    list.append(listItem);

    const listItemIndicator = createTag('div', { class: 'step-indicator' });
    const listItemContent = createTag('div', { class: 'step-content' });

    const detailText = stepDetail;
    detailText && detailText.classList.add('detail-text');
    const ariaLabelStepTitle = newStepTitle.innerText.replace(/^\d+\.\s*/, '');
    const detailContainer = createTag('div', {
      class: 'detail-container',
      id: detailId,
      'aria-labelledby': ariaLabelStepTitle,
    });

    if (i !== 0) {
      detailContainer.classList.add('closed');
    }

    detailContainer.append(detailText);

    listItem.append(listItemIndicator);
    listItem.append(listItemContent);

    listItemContent.append(newStepTitle);
    listItemContent.append(detailContainer);

    const handleOpenDetails = (ev) => {
      indexOpenedStep = i;
      setStepDetails(block, indexOpenedStep);
      ev.preventDefault();
    };

    newStepTitle.addEventListener('click', handleOpenDetails);
    listItem.addEventListener('keyup', (ev) => ev.which === 13 && handleOpenDetails(ev));
  });

  stepsContent.append(list);

  setTimeout(() => {
    const firstStepTitle = list.querySelector('h3');
    firstStepTitle.click();
  }, 100);
}

export default function decorate(block) {
  block.parentElement.classList.add('ax-how-to-v3-container');
  const rows = Array.from(block.children);

  const backgroundRow = block.children[0];
  const backgroundImage = backgroundRow.querySelector('img');
  const backgroundURL = backgroundImage?.src;
  const hasBackground = !!backgroundURL;
  const stepsContent = createTag('div', { class: 'steps-content' });

  if (hasBackground) {
    rows.shift();
    block.style.setProperty('--background-image', `url('${backgroundURL}')`);
  }

  const mediaData = rows.shift();
  const mediaEl = mediaData.querySelector('picture') || mediaData.querySelector('a');
  block.removeChild(block.children[0]);
  const mediaContainerEl = createTag('div', { class: 'media-container' });
  mediaContainerEl.append(mediaEl);
  stepsContent.append(mediaContainerEl);

  block.append(stepsContent);
  buildAccordion(block, rows, stepsContent);

  // Inject HowTo JSON-LD schema automatically unless opted-out
  const hideSchemaPageLevel = getMetadata('show-howto-schema') === 'no';
  const hideSchemaBlockLevel = block.classList.contains('hide-howto-schema');
  if (!hideSchemaPageLevel && !hideSchemaBlockLevel) {
    try {
      const steps = [...block.querySelectorAll('li.step')];
      if (steps.length === 0) return;

      const firstHeading = block.querySelector('h2, h3');
      const name = (firstHeading?.textContent || document.title || '').trim();

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        step: [],
      };

      steps.forEach((li, i) => {
        const h = li.querySelector('h3');
        const detail = li.querySelector('.detail-container');
        const title = (h?.textContent || '').replace(/^\d+\.\s*/, '').trim();
        const text = (detail?.textContent || '').trim();
        if (title && text) {
          schema.step.push({
            '@type': 'HowToStep',
            position: i + 1,
            name: title,
            itemListElement: {
              '@type': 'HowToDirection',
              text,
            },
          });
        }
      });

      if (schema.step.length > 0) {
        // avoid duplicate injection for this block
        const existing = document.head.querySelector('script[type="application/ld+json"][data-how-to-v3]');
        if (!existing) {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.setAttribute('data-how-to-v3', 'true');
          script.textContent = JSON.stringify(schema);
          document.head.appendChild(script);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-unused-expressions
      window.lana?.log(`how-to-v3 schema error: ${e?.message || e}`);
    }
  }
}
