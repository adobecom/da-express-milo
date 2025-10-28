/* eslint-enable chai-friendly/no-unused-expressions */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { throttle, debounce } from '../../scripts/utils/hofs.js';

let createTag;

const scrollPadding = 16;

function createChevronButton(direction, ariaLabel) {
  const button = createTag('button', {
    class: `${direction} chevron-control`,
    'aria-label': ariaLabel,
    type: 'button',
  });
  const icon = getIconElementDeprecated('chevron-up', 22, 'chevron', 'chevron-icon');
  if (icon instanceof HTMLElement) {
    icon.setAttribute('aria-hidden', 'true');
    if (icon.tagName === 'IMG') icon.setAttribute('alt', '');
  }
  button.append(icon);
  return button;
}

function createControl(items, container) {
  const control = createTag('div', { class: 'gallery-control loading' });
  const status = createTag('div', { class: 'status' });
  const prevButton = createChevronButton('prev', 'Next');
  const nextButton = createChevronButton('next', 'Previous');

  const intersecting = Array.from(items).fill(false);

  const len = items.length;
  const pageInc = throttle((inc) => {
    const first = intersecting.indexOf(true);
    if (first === -1) return; // middle of swapping only page
    if (first + inc < 0 || first + inc >= len) return; // no looping
    const target = items[(first + inc + len) % len];
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, 200);
  prevButton.addEventListener('click', () => pageInc(-1));
  nextButton.addEventListener('click', () => pageInc(1));

  const dots = items.map(() => {
    const dot = createTag('div', { class: 'dot' });
    status.append(dot);
    return dot;
  });

  const updateDOM = debounce((first, last) => {
    prevButton.disabled = first === 0;
    nextButton.disabled = last === items.length - 1;
    dots.forEach((dot, i) => {
      /* eslint-disable chai-friendly/no-unused-expressions */
      i === first ? dot.classList.add('curr') : dot.classList.remove('curr');
      i === first ? items[i].classList.add('curr') : items[i].classList.remove('curr');
      i > first && i <= last ? dot.classList.add('hide') : dot.classList.remove('hide');
      /* eslint-disable chai-friendly/no-unused-expressions */
    });
    if (items.length === last - first + 1) {
      control.classList.add('hide');
      container.classList.add('gallery--all-displayed');
    } else {
      control.classList.remove('hide');
      container.classList.remove('gallery--all-displayed');
    }
    control.classList.remove('loading');
  }, 300);

  const reactToChange = (entries) => {
    entries.forEach((entry) => {
      intersecting[items.indexOf(entry.target)] = entry.isIntersecting;
    });
    const [first, last] = [intersecting.indexOf(true), intersecting.lastIndexOf(true)];
    if (first === -1) return; // middle of swapping only page
    updateDOM(first, last);
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    reactToChange(entries);
  }, { root: container, threshold: 1, rootMargin: `0px ${scrollPadding}px 0px ${scrollPadding}px` });

  items.forEach((item) => scrollObserver.observe(item));

  control.append(status, prevButton, nextButton);
  return control;
}

export async function buildGallery(
  items,
  container = items?.[0]?.parentNode,
  root = container?.parentNode,
) {
  if (!root) throw new Error('Invalid Gallery input');
  const control = createControl([...items], container);
  container.classList.add('gallery');
  [...items].forEach((item) => {
    item.classList.add('gallery--item');
  });
  root.append(control);
}

export function addSchema(bl, heading) {
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  bl.querySelectorAll('li').forEach((step, i) => {
    const h = step.querySelector('h3, h4, h5, h6');
    const p = step.querySelector('p');

    if (h && p) {
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: h.textContent.trim(),
        itemListElement: {
          '@type': 'HowToDirection',
          text: p.textContent.trim(),
        },
      });
    }
  });
  document.head.append(createTag('script', { type: 'application/ld+json' }, JSON.stringify(schema)));
}

export default async function init(bl) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const heading = bl.querySelector('h3, h4, h5, h6');
  const cardsContainer = createTag('ol', { class: 'cards-container' });
  let steps = [...bl.querySelectorAll(':scope > div')];
  if (steps[0].querySelector('h2')) {
    const text = steps[0];
    steps = steps.slice(1);
    text.classList.add('text');
  }
  const cards = steps.map((div, index) => {
    const li = createTag('li', { class: 'card' });
    const tipNumber = createTag('div', { class: 'number' });
    tipNumber.append(
      createTag('span', { class: 'number-txt' }, index + 1),
      createTag('div', { class: 'number-bg' }),
    );
    li.append(tipNumber);
    const content = div.querySelector('div');
    while (content.firstChild) {
      li.append(content.firstChild);
    }
    div.remove();
    cardsContainer.append(li);
    return li;
  });
  bl.append(cardsContainer);

  await buildGallery(cards, cardsContainer, bl);
  // add count-based class to top-level if not already present
  const existingCountClass = [...bl.classList].find((c) => c.startsWith('cards-count-'));
  if (!existingCountClass) {
    bl.classList.add(`cards-count-${cards.length}`);
  }
  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
  return bl;
}
