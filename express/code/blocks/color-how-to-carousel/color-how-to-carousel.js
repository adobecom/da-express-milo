import {
  getLibs, fixIcons, addTempWrapperDeprecated, getMetadata,
} from '../../scripts/utils.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import { createExpressTooltip } from '../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { createSpectrumIcon } from '../../scripts/color-shared/utils/icons.js';
import { loadIconsRail } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import { wrapInTheme } from '../../scripts/color-shared/spectrum/utils/theme.js';
import { applyCreateNowLink } from '../../scripts/color-shared/utils/utilities.js';

const GRAPH_SYMBOLS = ['hero-marquee', 'hero-marquee-localized', 'hands-and-heart', 'color-how-to-graph', 'color-bistro', 'color-how-to-bento'];

let createTag;
let getConfig;
let replaceKey;

// Shared by both the legacy render path and the specs-card render path.
function activate(block, target) {
  block.querySelectorAll('.tip, .tip-number')
    .forEach((item) => {
      item.classList.remove('active');
    });

  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  block.querySelectorAll(`.tip-${i}`)
    .forEach((elem) => elem.classList.add('active'));
}

function getColorSVG(svgName) {
  if (!GRAPH_SYMBOLS.includes(svgName)) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${svgName}">
    ${svgName ? `<title>${svgName}</title>` : ''}
    <use href="/express/code/icons/color-sprite.svg#${svgName}"></use>
  </svg>`;
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

// --- Legacy render path (unchanged from the live block) ---

function initRotationLegacy(payload) {
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

async function decorateLegacy(block) {
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

    initRotationLegacy(payload);

    observer.unobserve(block);
  };

  const colorHowToObserver = new IntersectionObserver(onIntersect, { rootMargin: '1000px', threshold: 0 });
  colorHowToObserver.observe(block);
}

// --- Specs-card render path (opt-in via the temporary-specs-card variant) ---

function initRotationSpecs(block, payload) {
  if (!payload.howToWindow || payload.rotationInterval) return;
  payload.rotationInterval = payload.howToWindow.setInterval(() => {
    const numbers = block.querySelector('.tip-numbers');
    if (!numbers) return;
    const next = numbers.querySelector('.tip-number.active + .tip-number') || numbers.firstElementChild;
    activate(block, next);
  }, 5000);
}

function hexToRgb(hex) {
  const clean = (hex || '').trim().replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToCmyk({ r, g, b }) {
  const [rf, gf, bf] = [r, g, b].map((v) => v / 255);
  const k = 1 - Math.max(rf, gf, bf);
  const denom = 1 - k;
  const toPct = (channel) => Math.round((denom ? (1 - channel - k) / denom : 0) * 100);
  return [toPct(rf), toPct(gf), toPct(bf), Math.round(k * 100)];
}

function rgbToHsl({ r, g, b }) {
  const [rf, gf, bf] = [r, g, b].map((v) => v / 255);
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta) {
    s = delta / (1 - Math.abs((2 * l) - 1));
    if (max === rf) h = ((gf - bf) / delta) % 6;
    else if (max === gf) h = ((bf - rf) / delta) + 2;
    else h = ((rf - gf) / delta) + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function isResolvedPlaceholder(value, key) {
  if (!value) return false;
  return value !== key && value !== key.replaceAll('-', ' ');
}

async function resolvePlaceholder(key, fallback) {
  const resolved = await replaceKey(key, getConfig());
  return isResolvedPlaceholder(resolved, key) ? resolved : fallback;
}

async function copySpecsValue(value, label, strings) {
  try {
    await navigator.clipboard.writeText(value);
    showExpressToast({
      message: strings.copied.replace('{value}', value),
      variant: 'positive',
      timeout: 2000,
    });
  } catch {
    showExpressToast({ message: strings.copyFailed, variant: 'negative', timeout: 2000 });
  }
}

async function buildSpecsCard(payload) {
  const [specsHeading, copyLabel, copied, copyFailed] = await Promise.all([
    resolvePlaceholder('color-how-to-carousel-specs-heading', 'Color specs'),
    resolvePlaceholder('color-how-to-carousel-copy-value', 'Copy {label} value'),
    resolvePlaceholder('color-how-to-carousel-value-copied', '{value} copied to clipboard'),
    resolvePlaceholder('color-how-to-carousel-copy-failed', 'Unable to copy value.'),
  ]);
  const strings = { copied, copyFailed };

  const rgb = hexToRgb(payload.primaryHex);
  const [c, m, y, k] = rgbToCmyk(rgb);
  const [h, s, l] = rgbToHsl(rgb);

  const rowsData = [
    ['HEX', payload.primaryHex.trim().toUpperCase()],
    ['RGB', `${rgb.r}, ${rgb.g}, ${rgb.b}`],
    ['CMYK', `${c}, ${m}, ${y}, ${k}`],
    ['HSL', `${h}°, ${s}%, ${l}%`],
  ];

  const card = createTag('div', { class: 'chtc-specs-card' });
  card.append(createTag('h3', { class: 'chtc-card-title' }, specsHeading));

  const table = createTag('div', { class: 'chtc-specs-table' });
  rowsData.forEach(([label, value]) => {
    const row = createTag('div', { class: 'chtc-specs-row' });
    const copyText = copyLabel.replace('{label}', label);
    const copyBtn = createTag('button', {
      type: 'button',
      class: 'chtc-specs-copy',
      'aria-label': copyText,
    });
    const copyIcon = createSpectrumIcon('copy');
    copyIcon.setAttribute('aria-hidden', 'true');
    copyBtn.append(wrapInTheme(copyIcon));
    copyBtn.addEventListener('click', () => copySpecsValue(value, label, strings));
    createExpressTooltip({ targetEl: copyBtn, content: copyText }).catch(() => {});

    const valueGroup = createTag('span', { class: 'chtc-specs-value-group' });
    valueGroup.append(createTag('span', { class: 'chtc-specs-value' }, value), copyBtn);

    row.append(createTag('span', { class: 'chtc-specs-label' }, label), valueGroup);
    table.append(row);
  });
  card.append(table);
  return card;
}

function buildGraphic(payload) {
  const graphic = createTag('div', { class: 'chtc-graphic' });
  graphic.style.backgroundColor = payload.primaryHex;
  graphic.innerHTML = getColorSVG(payload.colorGraphName) || '';

  const svg = graphic.querySelector('svg');
  if (svg && payload.secondaryHex) svg.style.fill = payload.secondaryHex;
  if (svg && payload.primaryHex) svg.style.setProperty('--chtc-graph-accent-color', payload.primaryHex);

  return graphic;
}

function buildHowToCard(block, rows, payload) {
  const card = createTag('div', { class: 'chtc-how-to-card' });
  const numbers = createTag('div', { class: 'tip-numbers', role: 'tablist' });
  const tips = createTag('div', { class: 'tips' });
  card.append(numbers, tips);

  rows.forEach((row, i) => {
    row.classList.add('tip', `tip-${i + 1}`);
    row.setAttribute('data-tip-index', i + 1);

    const cells = Array.from(row.children);
    const h3 = createTag('h3');
    h3.textContent = cells[0].textContent.trim();
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3, cells[1]);

    row.replaceChildren(text);
    tips.append(row);

    const number = createTag('div', {
      class: `tip-number tip-${i + 1}`,
      tabindex: '0',
      title: `${i + 1}`,
      role: 'tab',
    });
    number.innerHTML = `<span>${i + 1}</span>`;
    number.setAttribute('data-tip-index', i + 1);

    number.addEventListener('click', (e) => {
      if (payload.rotationInterval) payload.howToWindow.clearInterval(payload.rotationInterval);
      const target = e.target.nodeName.toLowerCase() === 'span' ? e.target.parentElement : e.target;
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

  if (payload.cta) card.append(createTag('p', { class: 'button-container' }, payload.cta));
  return card;
}

async function decorateSpecsCard(block) {
  block.classList.add('temporary-specs-card');
  addTempWrapperDeprecated(block, 'color-how-to-carousel');
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`).then((utils) => {
      ({ createTag, getConfig } = utils);
    }),
    fixIcons(block),
    loadIconsRail(),
  ]);
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));

  const payload = {
    rotationInterval: null,
    howToDocument: block.ownerDocument,
    howToWindow: block.ownerDocument.defaultView,
  };

  const rows = Array.from(block.children);
  const colorDataDiv = rows.shift();
  const contextRow = colorDataDiv?.querySelector('div');
  if (!contextRow) return;

  const colorDataRows = Array.from(contextRow.children);
  const hasIcon = !!colorDataRows[0]?.querySelector('img, svg');
  const minRequiredRows = hasIcon ? 5 : 4;
  if (colorDataRows.length < minRequiredRows) return;

  let cursor = hasIcon ? 1 : 0;

  payload.heading = colorDataRows[cursor];
  cursor += 1;
  payload.colorName = colorDataRows[cursor].textContent.trim();
  cursor += 1;
  [payload.primaryHex, payload.secondaryHex] = colorDataRows[cursor].textContent
    .split(',')
    .map((hex) => hex.trim());
  cursor += 1;
  payload.colorGraphName = colorDataRows[cursor].textContent.trim();
  cursor += 1;
  payload.cta = colorDataRows[cursor]?.querySelector('a') || null;
  payload.cta?.classList.add('button', 'chtc-cta');
  await applyCreateNowLink(payload.cta, payload.colorName);

  colorDataDiv.remove();

  if (block.classList.contains('schema')) buildSchema(rows, payload);

  const heading = createTag('div', { class: 'chtc-heading' });
  heading.append(payload.heading);

  const content = createTag('div', { class: 'chtc-content' });
  content.append(buildHowToCard(block, rows, payload), await buildSpecsCard(payload));

  const container = createTag('div', { class: 'chtc-container' });
  container.append(buildGraphic(payload), content);

  if (isDarkOverlayReadable(payload.primaryHex)) block.classList.add('shadow');

  block.replaceChildren(heading, container);

  activate(block, block.querySelector('.tip-number.tip-1'));

  const onIntersect = ([entry], observer) => {
    if (!entry.isIntersecting) return;
    initRotationSpecs(block, payload);
    observer.unobserve(block);
  };
  new IntersectionObserver(onIntersect, { threshold: 0 }).observe(block);
}

export default async function decorate(block) {
  const isColorSite = getMetadata('pagetype')?.toLowerCase() === 'color';
  if (isColorSite) {
    await decorateSpecsCard(block);
    return;
  }
  await decorateLegacy(block);
}
