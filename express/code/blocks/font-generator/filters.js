import { createTag, getLibs } from '../../scripts/utils.js';
import { getState, setState, subscribe, getCategories } from './state.js';
import { createExpressAccordion } from '../../scripts/color-shared/spectrum/index.js';

const DEFAULT_PROMO = {
  title: 'Looking for more fonts?',
  cta: { text: 'Go to Adobe Fonts', href: 'https://fonts.adobe.com' },
};

const FONTS_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M11.5709 7.46269C10.9692 9.47976 10.4644 11.4177 9.8627 13.319C9.60178 14.2881 9.20181 15.2143 8.67525 16.0687C8.06157 16.9399 7.07274 17.4704 6.00748 17.5C5.17786 17.5 4.36426 17.1102 4.36426 16.2476C4.40532 15.7099 4.82051 15.2762 5.35584 15.2117C5.54487 15.2045 5.72145 15.3058 5.81067 15.4726C6.21747 16.2043 6.60827 16.6271 6.78719 16.6271C6.96611 16.6271 7.11301 16.3832 7.40493 15.3257L9.53688 7.46269H8.0076C7.8999 7.15708 7.99782 6.8168 8.25149 6.61518H9.78171C10.057 5.65784 10.433 4.73235 10.9032 3.85419C11.5424 2.47409 12.8981 1.56591 14.4176 1.5C15.6417 1.5 16.1418 2.08572 16.1418 2.83435C16.1383 3.43724 15.6964 3.94785 15.1003 4.03781C14.8404 4.03781 14.7104 3.84288 14.6294 3.56697C14.3535 2.52642 13.9948 2.21755 13.7819 2.21755C13.5691 2.21755 13.2452 2.6074 12.8873 3.42101C12.4421 4.45703 12.0828 5.52786 11.8129 6.62271H13.668C13.7839 6.93145 13.6772 7.27953 13.4081 7.47022L11.5709 7.46269Z"/></svg>';

export function createFontsIcon() {
  return new DOMParser().parseFromString(FONTS_ICON_SVG, 'image/svg+xml').documentElement;
}

// label: visual text shown in the button (Unicode-transformed)
// ariaKey: placeholder key resolved at init time; announced by screen readers
// data-category on the button always stays the raw category string for state matching.
const CATEGORY_CONFIG = {
  Cool: { label: 'ⓒⓞⓞⓛ', ariaKey: 'fg-cool' },
  Glitch: { label: 'G̶̶l̶̶i̶̶t̶̶c̶̶h̶̶', ariaKey: 'fg-glitch' },
  // Category renamed from "Symbol text" to "Symbol" in font-styles.csv.
  Symbol: { label: '❚█══Symbol══█❚', ariaKey: 'fg-symbol' },
};

export async function fetchStrings(keyFallbackMap) {
  const [{ replaceKeyArray }, { getConfig }] = await Promise.all([
    import(`${getLibs()}/features/placeholders.js`),
    import(`${getLibs()}/utils/utils.js`),
  ]);
  const keys = Object.keys(keyFallbackMap);
  const values = await replaceKeyArray(keys, getConfig());
  return Object.fromEntries(keys.map((key, i) => {
    const val = values[i];
    return [key, (val && val !== key.replaceAll('-', ' ')) ? val : keyFallbackMap[key]];
  }));
}

export function buildPromo(btnClass, promo = DEFAULT_PROMO) {
  const icon = createFontsIcon();
  icon.classList.add('fg-promo-icon');

  const text = createTag('p', { class: 'fg-promo-text' }, promo.title ?? DEFAULT_PROMO.title);

  const left = createTag('div', { class: 'fg-promo-left' });
  left.append(icon, text);

  const cta = promo.cta ?? DEFAULT_PROMO.cta;
  const link = createTag('a', {
    href: cta.href ?? DEFAULT_PROMO.cta.href,
    class: btnClass,
    target: '_blank',
    rel: 'noopener noreferrer',
  }, cta.text ?? DEFAULT_PROMO.cta.text);

  const promoEl = createTag('div', { class: 'fg-promo' });
  promoEl.append(left, link);
  return promoEl;
}

function buildFilterList(categories, strings) {
  const list = createTag('div', { class: 'fg-filter-list' });

  const allBtn = createTag('button', {
    class: 'fg-filter-btn',
    'data-category': '',
    'aria-label': strings['fg-all'],
  }, '𝓐𝓵𝓵');
  list.appendChild(allBtn);

  for (const cat of categories) {
    const config = CATEGORY_CONFIG[cat];
    const ariaLabel = config ? strings[config.ariaKey] : undefined;
    const btn = createTag('button', {
      class: 'fg-filter-btn',
      'data-category': cat,
      ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
    }, config ? config.label : cat);
    list.appendChild(btn);
  }

  return list;
}

function syncFilterButtons(filterList, activeFilters) {
  filterList.querySelectorAll('.fg-filter-btn').forEach((btn) => {
    const isAll = btn.dataset.category === '';
    const active = isAll ? !activeFilters.length : activeFilters.includes(btn.dataset.category);
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('tabindex', active ? '0' : '-1');
  });
}

function initArrowNav(filterList) {
  filterList.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft'
      && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    const idx = btns.indexOf(e.target);
    if (idx === -1) return;
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const next = btns[(idx + (forward ? 1 : -1) + btns.length) % btns.length];
    btns.forEach((btn) => btn.setAttribute('tabindex', '-1'));
    next.setAttribute('tabindex', '0');
    next.focus();
  });
}

export default async function init(els, { showCTA = true, onSelect, promo } = {}) {
  if (!els || !els.length) return () => {};

  const [categories, strings] = await Promise.all([
    Promise.resolve(getCategories()),
    fetchStrings({
      'fg-all': 'All',
      'fg-categories': 'Categories',
      'fg-cool': 'Cool',
      'fg-glitch': 'Glitch',
      'fg-symbol': 'Symbol text',
    }),
  ]);

  const cleanups = await Promise.all([...els].map(async (el) => {
    const filterList = buildFilterList(categories, strings);
    initArrowNav(filterList);

    const { element: accordion, destroy } = await createExpressAccordion({
      label: strings['fg-categories'],
      content: filterList,
      open: true,
      size: 's',
      density: 'spacious',
    });

    if (showCTA) {
      el.append(accordion, buildPromo('button primary medium fg-promo-btn', promo));
    } else {
      el.append(accordion);
    }

    filterList.addEventListener('click', (e) => {
      const btn = e.target.closest('.fg-filter-btn');
      if (!btn) return;
      const { category } = btn.dataset;
      let next;
      if (category === '') {
        next = [];
      } else {
        const { activeFilters } = getState();
        next = activeFilters.includes(category) ? [] : [category];
      }
      setState({ activeFilters: next });
      onSelect?.();
    });

    // subscribe() fires immediately with the current snapshot, so this also
    // reflects any URL-restored activeFilters (e.g. ?filters=Glitch) on load.
    const unsubscribe = subscribe(({ activeFilters }) => {
      syncFilterButtons(filterList, activeFilters);
    });

    return () => {
      destroy();
      unsubscribe();
    };
  }));

  return () => cleanups.forEach((fn) => fn());
}
