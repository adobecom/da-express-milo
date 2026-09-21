import { getLibs, fixIcons, addTempWrapperDeprecated } from '../../scripts/utils.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';

let createTag;

function activate(block, target) {
  // de-activate all
  block.querySelectorAll('.tip, .tip-number')
    .forEach((item) => {
      item.classList.remove('active');
    });

  // get index of the target
  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  // activate corresponding number and tip
  block.querySelectorAll(`.tip-${i}`)
    .forEach((elem) => elem.classList.add('active'));
}

function buildSchema(rows, payload) {
  const schemaObj = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: payload.heading?.textContent.trim() || payload.howToDocument.title,
    step: [],
  };

  rows.forEach((row, i) => {
    const cells = Array.from(row.children);

    schemaObj.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: cells[0].textContent.trim(),
      itemListElement: {
        '@type': 'HowToDirection',
        text: cells[1].textContent.trim(),
      },
    });
  });

  const schema = createTag('script', { type: 'application/ld+json' });
  schema.innerHTML = JSON.stringify(schemaObj);
  const { head } = payload.howToDocument;
  head.append(schema);
}

function initRotation(payload) {
  if (payload.howToWindow && !payload.rotationInterval) {
    payload.rotationInterval = payload.howToWindow.setInterval(() => {
      payload.howToDocument.querySelectorAll('.tip-numbers')
        .forEach((numbers) => {
          // find next adjacent sibling of the currently activated tip
          let activeAdjacentSibling = numbers.querySelector('.tip-number.active+.tip-number');
          if (!activeAdjacentSibling) {
            // if no next adjacent, back to first
            activeAdjacentSibling = numbers.firstElementChild;
          }
          activate(numbers.parentElement, activeAdjacentSibling);
        });
    }, 5000);
  }
}

function buildColorHowToCarousel(block, payload) {
  const carouselDivs = block.querySelector('.content-wrapper');
  const rows = Array.from(carouselDivs.children);
  const carousel = createTag('div', { class: 'carousel-wrapper' });

  const includeSchema = block.classList.contains('schema');

  const numbers = createTag('div', {
    class: 'tip-numbers',
    role: 'tablist',
  });
  carousel.prepend(numbers);
  const tips = createTag('div', { class: 'tips' });
  carousel.append(tips);
  if (payload.icon) carouselDivs.append(payload.icon);
  carouselDivs.append(payload.heading, carousel);
  if (payload.cta) carouselDivs.append(payload.cta);

  if (includeSchema) {
    buildSchema(rows, payload);
  }

  rows.forEach((row, i) => {
    row.classList.add('tip');
    row.classList.add(`tip-${i + 1}`);
    row.setAttribute('data-tip-index', i + 1);

    const cells = Array.from(row.children);

    const h3 = createTag('h3');
    h3.innerHTML = cells[0].textContent.trim();
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3);
    text.append(cells[1]);

    row.innerHTML = '';
    row.append(text);

    tips.prepend(row);

    const number = createTag('div', {
      class: `tip-number tip-${i + 1}`,
      tabindex: '0',
      title: `${i + 1}`,
      role: 'tab',
    });

    number.innerHTML = `<span>${i + 1}</span>`;
    number.setAttribute('data-tip-index', i + 1);

    number.addEventListener('click', (e) => {
      if (payload.rotationInterval) {
        payload.howToWindow.clearTimeout(payload.rotationInterval);
      }

      let { target } = e;
      if (e.target.nodeName.toLowerCase() === 'span') {
        target = e.target.parentElement;
      }
      activate(block, target);
    });

    number.addEventListener('keyup', (e) => {
      if (e.which === 13) {
        e.preventDefault();
        e.target.click();
      }
    });

    numbers.append(number);

    if (i === 0) {
      row.classList.add('active');
      number.classList.add('active');
    }
  });
}

function colorizeSVG(block, payload) {
  block.querySelectorAll(':scope > div')
    ?.forEach((div) => {
      div.style.backgroundColor = payload.primaryHex;
      div.style.color = payload.secondaryHex;
    });

  block.querySelectorAll('svg')
    ?.forEach((svg) => {
      svg.style.fill = payload.secondaryHex;
    });

  if (!(block.classList.contains('dark') || block.classList.contains('light'))) {
    if (isDarkOverlayReadable(payload.primaryHex)) {
      block.classList.add('light');
      block.classList.add('shadow');
    } else {
      block.classList.add('dark');
    }
  }
}

function getColorSVG(svgName) {
  const symbols = ['hero-marquee', 'hero-marquee-localized', 'hands-and-heart', 'color-how-to-graph'];

  if (symbols.includes(svgName)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="${svgName}">
      ${svgName ? `<title>${svgName}</title>` : ''}
      <use href="/express/code/icons/color-sprite.svg#${svgName}"></use>
    </svg>`;
  }

  return null;
}

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'color-how-to-carousel');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), fixIcons(block)]).then(([utils]) => {
    ({ createTag } = utils);
  });

  const payload = {
    rotationInterval: null,
    fixedImageSize: false,
    howToDocument: block.ownerDocument,
    howToWindow: block.ownerDocument.defaultView,
  };

  const rows = Array.from(block.children);

  const colorDataDiv = rows.shift();
  const contextRow = colorDataDiv.querySelector('div');
  const colorCarouselDiv = createTag('div', { class: 'content-wrapper' });

  if (contextRow) {
    const colorDataRows = contextRow.children;

    if (colorDataRows.length === 6) {
      payload.icon = colorDataRows[0].querySelector('svg');
      [, payload.heading] = colorDataRows;
      payload.colorName = colorDataRows[2].textContent.trim();
      [payload.primaryHex, payload.secondaryHex] = colorDataRows[3].textContent.split(',');
      payload.colorGraphName = colorDataRows[4].textContent.trim();
      payload.cta = colorDataRows[5].querySelector('a');
      payload.cta.classList.add('button', 'accent', 'same-fcta');
      const imgWrapper = createTag('div', { class: 'img-wrapper' });
      imgWrapper.innerHTML = getColorSVG(payload.colorGraphName);

      const colorTextOverlay = createTag('div', { class: 'color-graph-text-overlay' });
      const colorName = createTag('p', { class: 'color-name' });
      const colorHex = createTag('p', { class: 'color-hex' });
      colorName.textContent = payload.colorName;
      colorHex.textContent = payload.primaryHex;

      colorTextOverlay.append(colorName, colorHex);
      imgWrapper.prepend(colorTextOverlay);
      block.prepend(imgWrapper);
      colorDataDiv.remove();
    }

    if (colorDataRows.length === 4) {
      [payload.heading] = colorDataRows;
      payload.colorName = colorDataRows[1].textContent.trim();
      [payload.primaryHex, payload.secondaryHex] = colorDataRows[2].textContent.split(',');
      payload.colorGraphName = colorDataRows[3].textContent.trim();
      const imgWrapper = createTag('div', { class: 'img-wrapper' });
      imgWrapper.innerHTML = getColorSVG(payload.colorGraphName);

      const colorTextOverlay = createTag('div', { class: 'color-graph-text-overlay' });
      const colorName = createTag('p', { class: 'color-name' });
      const colorHex = createTag('p', { class: 'color-hex' });
      colorName.textContent = payload.colorName;
      colorHex.textContent = payload.primaryHex;

      colorTextOverlay.append(colorName, colorHex);
      imgWrapper.prepend(colorTextOverlay);
      block.prepend(imgWrapper);
      colorDataDiv.remove();
      block.classList.add('top-align');
    }

    rows.forEach((step) => {
      colorCarouselDiv.append(step);
    });

    block.append(colorCarouselDiv);
  }

  buildColorHowToCarousel(block, payload);
  colorizeSVG(block, payload);
  activate(block, block.querySelector('.tip-number.tip-1'));

  const onIntersect = ([entry], observer) => {
    if (!entry.isIntersecting) return;

    initRotation(payload);

    observer.unobserve(block);
  };

  const colorHowToObserver = new IntersectionObserver(onIntersect, { rootMargin: '1000px', threshold: 0 });
  colorHowToObserver.observe(block);
}
