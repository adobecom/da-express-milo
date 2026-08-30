import { getLibs, fixIcons, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';

const GRAPH_SYMBOLS = ['hero-marquee', 'hero-marquee-localized', 'hands-and-heart', 'color-how-to-graph'];
// Same copy glyph as the hero's swatch-rail icon-button (ICON_MAP.copy fallback in
// color-swatch-rail/index.js), reused directly since this block skips the sp-icon-copy bundle.
const COPY_ICON = `<svg class="icon-fallback" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
  <path d="m11.75,18h-7.5c-1.24023,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75v7.5c0,.41309.33691.75.75.75h7.5c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Zm-5-13c-.41406,0-.75-.33594-.75-.75,0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75,0,.41406-.33594.75-.75.75Zm6.25-1.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Zm0,10.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Zm2.75,0c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Zm1.5-9c-.41406,0-.75-.33594-.75-.75,0-.41309-.33691-.75-.75-.75-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c1.24023,0,2.25,1.00977,2.25,2.25,0,.41406-.33594.75-.75.75Zm0,4.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Zm-10.5,0c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Zm1.5,4.25c-1.24023,0-2.25-1.00977-2.25-2.25,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,.41309.33691.75.75.75.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"></path>
</svg>`;

let createTag;
let getConfig;
let replaceKey;

function activate(block, target) {
  block.querySelectorAll('.tip, .tip-number')
    .forEach((item) => item.classList.remove('active'));

  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  block.querySelectorAll(`.tip-${i}`).forEach((elem) => elem.classList.add('active'));
}

function buildSchema(rows, payload) {
  const schemaObj = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: payload.heading?.textContent.trim(),
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
  payload.howToDocument.head.append(schema);
}

function initRotation(block, payload) {
  if (!payload.howToWindow || payload.rotationInterval) return;
  payload.rotationInterval = payload.howToWindow.setInterval(() => {
    const numbers = block.querySelector('.tip-numbers');
    if (!numbers) return;
    const next = numbers.querySelector('.tip-number.active + .tip-number') || numbers.firstElementChild;
    activate(block, next);
  }, 5000);
}

function getColorSVG(svgName) {
  if (!GRAPH_SYMBOLS.includes(svgName)) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${svgName}">
    <title>${svgName}</title>
    <use href="/express/code/icons/color-sprite.svg#${svgName}"></use>
  </svg>`;
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
    const copyBtn = createTag('button', {
      type: 'button',
      class: 'chtc-specs-copy',
      'aria-label': copyLabel.replace('{label}', label),
    });
    copyBtn.innerHTML = COPY_ICON;
    copyBtn.addEventListener('click', () => copySpecsValue(value, label, strings));

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
    h3.innerHTML = cells[0].textContent.trim();
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3, cells[1]);

    row.innerHTML = '';
    row.append(text);
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
      if (payload.rotationInterval) payload.howToWindow.clearTimeout(payload.rotationInterval);
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

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'color-how-to-carousel-v2');
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`).then((utils) => {
      ({ createTag, getConfig } = utils);
    }),
    fixIcons(block),
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
  if (colorDataRows.length < 4) return;

  const hasIcon = !!colorDataRows[0].querySelector('img, svg');
  let cursor = hasIcon ? 1 : 0;

  payload.heading = colorDataRows[cursor];
  cursor += 1;
  payload.colorName = colorDataRows[cursor].textContent.trim();
  cursor += 1;
  [payload.primaryHex, payload.secondaryHex] = colorDataRows[cursor].textContent.split(',');
  cursor += 1;
  payload.colorGraphName = colorDataRows[cursor].textContent.trim();
  cursor += 1;
  payload.cta = colorDataRows[cursor]?.querySelector('a') || null;
  payload.cta?.classList.add('button', 'chtc-cta');

  colorDataDiv.remove();

  if (block.classList.contains('schema')) buildSchema(rows, payload);

  const heading = createTag('div', { class: 'chtc-heading' });
  heading.append(payload.heading);

  const content = createTag('div', { class: 'chtc-content' });
  content.append(buildHowToCard(block, rows, payload), await buildSpecsCard(payload));

  const container = createTag('div', { class: 'chtc-container' });
  container.append(buildGraphic(payload), content);

  block.replaceChildren(heading, container);

  activate(block, block.querySelector('.tip-number.tip-1'));

  const onIntersect = ([entry], observer) => {
    if (!entry.isIntersecting) return;
    initRotation(block, payload);
    observer.unobserve(block);
  };
  new IntersectionObserver(onIntersect, { rootMargin: '1000px', threshold: 0 }).observe(block);
}
