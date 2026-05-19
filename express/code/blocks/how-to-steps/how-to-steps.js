/* eslint-disable import/named, import/extensions */
import { getLibs, getIconElementDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';

let createTag;

function renderHoverContainer(imgElement, row, buttonContainer) {
  let hoverContainer;

  imgElement.addEventListener('mouseenter', () => {
    if (!hoverContainer) {
      const templateHref = buttonContainer.querySelector('a').href;
      hoverContainer = document.createElement('div', { class: 'hover-container' });
      row.style.position = 'relative';

      const wrapper = createTag('div', { class: 'share-icon-wrapper' });
      const shareIcon = getIconElementDeprecated('share-arrow');
      wrapper.appendChild(shareIcon);
      hoverContainer.appendChild(wrapper);

      buttonContainer.classList.add('visible');

      shareIcon.addEventListener('click', () => {
        if (templateHref) {
          navigator.clipboard.writeText(templateHref).catch((err) => {
            console.error('Failed to copy template-x link: ', err);
          });
        }
      });

      const imageWrapper = createTag('div', { class: 'image-wrapper' });

      const enlargedImg = imgElement.cloneNode(true);
      enlargedImg.classList.add('enlarged-template-img');
      enlargedImg.style.width = `${imgElement.offsetWidth * 1.2}px`;
      enlargedImg.style.height = `${imgElement.offsetHeight * 1.2}px`;

      hoverContainer.style.pointerEvents = 'auto';
      hoverContainer.style.position = 'absolute';
      hoverContainer.style.top = `${imgElement.offsetTop - (imgElement.offsetHeight * 0.1) - 10}px`;
      hoverContainer.style.left = `${imgElement.offsetLeft - (imgElement.offsetWidth * 0.1) - 10}px`;

      imageWrapper.appendChild(enlargedImg);
      imageWrapper.appendChild(buttonContainer);
      hoverContainer.appendChild(imageWrapper);
      imgElement.parentElement.appendChild(hoverContainer);

      hoverContainer.addEventListener('mouseleave', () => {
        if (hoverContainer) {
          buttonContainer.classList.remove('visible');
          hoverContainer.remove();
          hoverContainer = null;
        }
      });
    }
  });
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), decorateButtonsDeprecated(block)]).then(([utils]) => {
    ({ createTag } = utils);
  });
  const howto = block;
  const heading = howto.closest('.section').querySelector('h2, h3, h4');
  const rows = Array.from(howto.children);

  let numberStepStart = 1;
  const isStepNumberDefined = rows[0].innerHTML.includes('number-step-start');
  if (isStepNumberDefined) {
    numberStepStart = +rows[0].querySelectorAll('div')[1].innerText.trim();
    rows[0].remove();
    rows.splice(0, 1);
  }

  const narrowVariant = block?.classList.contains('narrow');
  const container = document.querySelector('div.how-to-steps');
  const desktop = document.body.dataset.device === 'desktop';
  if (desktop && narrowVariant && container) {
    container.classList.add('narrow');
    container.classList.remove('narrow-mobile-width');
  } else if (narrowVariant && container) {
    container.classList.remove('narrow');
    container.classList.add('narrow-mobile-width');
  }

  const includeSchema = !block.classList.contains('noschema');

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  const templateXVariant = block?.classList.contains('template-x');
  const templateXContainer = templateXVariant && createTag('div', { class: 'template-x-container' });
  if (templateXContainer && document.body.dataset.device === 'desktop') {
    templateXContainer.classList.add('desktop');
  } else if (templateXContainer) {
    templateXContainer.classList.remove('desktop');
  }
  rows.forEach((row, i) => {
    const index = (typeof numberStepStart === 'number' ? numberStepStart : 1) + i;
    if (templateXVariant && row.querySelector('picture')) {
      row.classList.add('template-x-thumbnail');

      const imgElement = row.querySelector('picture img');
      imgElement.style.borderRadius = '10px';
      const buttonContainer = row.querySelector('.button-container');
      buttonContainer.classList.add('template-x');
      renderHoverContainer(imgElement, row, buttonContainer);
      const templateXText = row.lastElementChild;
      const text = templateXText?.textContent.trim();
      const templateXHeading = createTag('h4', { class: 'template-x-heading' }, text);
      row.insertBefore(templateXHeading, row.firstChild);
      if (templateXText) {
        templateXText.remove();
      }

      templateXContainer.appendChild(row);
    } else {
      const cells = Array.from(row.children);
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: cells[0].textContent.trim(),
        itemListElement: {
          '@type': 'HowToDirection',
          text: cells[1].textContent.trim(),
        },
      });
      const h3 = createTag('h3');
      h3.innerHTML = cells[0].textContent.trim();
      const p = createTag('p');
      p.innerHTML = cells[1].innerHTML;

      const isVideo = p.innerHTML.includes('.mp4');
      let content;

      if (isVideo) {
        const video = createTag('video', { width: '320', height: '240', controls: true });
        const sourceMp4 = createTag('source', { src: p.innerHTML.trim(), type: 'video/mp4' });
        video.appendChild(sourceMp4);
        content = video;
      } else {
        content = p;
      }

      const text = createTag('div', { class: 'tip-text' });
      text.append(h3);
      text.append(content);
      const number = createTag('div', { class: 'tip-number' });
      number.innerHTML = `<span>${index}</span>`;
      cells[0].remove();
      cells[1].innerHTML = '';
      cells[1].classList.add('tip');
      cells[1].append(number);
      cells[1].append(text);
    }
  });

  if (templateXVariant) {
    block.appendChild(templateXContainer);
  }
  if (includeSchema) {
    const schemaTag = createTag('script', { type: 'application/ld+json' });
    schemaTag.innerHTML = JSON.stringify(schema);
    const docHead = document.head;
    docHead.append(schemaTag);
  }
}
