import {
  getLibs,
  getIconElementDeprecated,
} from '../../scripts/utils.js';
import { isExpressTypographyClass, isMiloTypographyClass } from '../../scripts/typography-utils.js';

let createTag;
let getConfig;
let replaceKey;
let showCopyToast;
let trackMiniEditorExport;
let quoteActionDepsPromise;

const USE_QUOTE_EVENT = 'mini-editor:use-quote';

async function loadQuoteActionDeps() {
  if (showCopyToast && trackMiniEditorExport) return;
  quoteActionDepsPromise ??= Promise.all([
    import('../../scripts/utils/copy-toast.js'),
    import('../../scripts/utils/mini-editor-analytics.js'),
  ]).then(([copyToastModule, analyticsModule]) => {
    showCopyToast = copyToastModule.default;
    trackMiniEditorExport = analyticsModule.default;
  });

  await quoteActionDepsPromise;
}

function buildQuoteActions(quote, author) {
  const actions = createTag('div', { class: 'collapsible-row-actions collapsible-row-actions--mini-editor' });
  const copyIcon = getIconElementDeprecated('copy-quote');
  copyIcon.classList.add('collapsible-row-action-icon', 'collapsible-row-action-icon--copy');

  const copyBtn = createTag('button', { type: 'button', class: 'collapsible-row-action collapsible-row-action--copy' }, [
    copyIcon,
    createTag('span', {}, ['Copy quote']),
  ]);
  copyBtn.addEventListener('click', async () => {
    const text = author ? `${quote} — ${author}` : quote;
    try {
      await navigator.clipboard.writeText(text);
      trackMiniEditorExport({
        exportMethod: 'copy-clipboard',
        uiLocation: 'seo-discover-page-collapsible-row',
      });
      showCopyToast('Quote copied to clipboard');
    } catch {
      // Clipboard write failed (e.g. permissions) — no toast, nothing else to do.
    }
  });

  const designIcon = getIconElementDeprecated('create-design');
  designIcon.classList.add('collapsible-row-action-icon', 'collapsible-row-action-icon--design');

  const designBtn = createTag('button', { type: 'button', class: 'collapsible-row-action collapsible-row-action--design' }, [
    designIcon,
    createTag('span', {}, ['Create a design']),
  ]);
  designBtn.setAttribute('daa-ll', 'Create a design');
  designBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent(USE_QUOTE_EVENT, { detail: { quote, author } }));
  });

  actions.append(copyBtn, designBtn);
  return actions;
}

function shouldReuseSingleElement(tempContainer) {
  const childElements = Array.from(tempContainer.children);
  if (childElements.length !== 1) return false;
  const hasNonEmptyText = Array.from(tempContainer.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0,
  );
  return !hasNonEmptyText;
}

function createContentElement(html, baseClass, options = {}) {
  const {
    extraClasses = [],
    allowSingleChildReuse = false,
    fallbackTag = 'div',
  } = options;
  const safeHtml = html ?? '';

  const temp = document.createElement('div');
  temp.innerHTML = safeHtml;

  let element;
  if (allowSingleChildReuse && shouldReuseSingleElement(temp)) {
    [element] = temp.children;
  }

  if (!element) {
    element = createTag(fallbackTag, { class: baseClass });
    element.innerHTML = temp.innerHTML;
  } else {
    element.classList.add(baseClass);
  }

  extraClasses.filter(Boolean).forEach((cls) => element.classList.add(cls));

  return element;
}

function buildTableLayout(block, typographyClasses = {}) {
  const rows = Array.from(block.children);
  block.innerHTML = '';
  const background = rows.shift();
  background.classList.add('collapsible-rows-background');
  block.prepend(background);
  const headerText = rows.shift()?.innerText.trim();

  if (headerText) {
    const rowAccordionHeader = createTag('h2', { class: 'collapsible-row-accordion title' });
    rowAccordionHeader.textContent = headerText;
    block.prepend(rowAccordionHeader);
  }

  const collapsibleRows = [];
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.innerHTML,
      subHeader: subHeader.innerHTML,
    });
  });

  collapsibleRows.forEach((row) => {
    const { header, subHeader } = row;

    const rowWrapper = createTag('div', { class: 'collapsible-row-wrapper collapsible-row-wrapper--mini-editor' });
    const headerAccordion = createTag('div', { class: 'collapsible-row-accordion expandable header-accordion' });

    rowWrapper.append(headerAccordion);
    block.append(rowWrapper);

    const headerEl = createContentElement(header, 'collapsible-row-header', {
      extraClasses: ['expandable', 'collapsible-row-header--mini-editor'],
      allowSingleChildReuse: true,
    });
    if (typographyClasses.header && typographyClasses.header.length > 0) {
      headerEl.classList.add(...typographyClasses.header);
    }
    headerAccordion.append(headerEl);

    const iconElement = createTag('img', {
      src: '/express/code/icons/plus-heavy.svg',
      alt: 'toggle-icon',
      class: 'toggle-icon',
    });

    headerEl.appendChild(iconElement);

    const subHeaderAccordion = createTag('div', { class: 'collapsible-row-accordion expandable sub-header-accordion collapsible-row-accordion--mini-editor' });
    rowWrapper.append(subHeaderAccordion);

    const subHeaderEl = createContentElement(subHeader, 'collapsible-row-sub-header', {
      extraClasses: ['expandable', 'collapsible-row-sub-header--mini-editor'],
      allowSingleChildReuse: true,
    });
    if (typographyClasses.body && typographyClasses.body.length > 0) {
      subHeaderEl.classList.add(...typographyClasses.body);
    }
    subHeaderAccordion.append(subHeaderEl);
    subHeaderAccordion.append(buildQuoteActions(
      headerEl.textContent.trim(),
      subHeaderEl.textContent.trim(),
    ));

    headerEl.addEventListener('click', () => {
      headerAccordion.classList.toggle('rounded-corners');
      const isCollapsed = subHeaderAccordion.classList.toggle('collapsed');
      subHeaderAccordion.style.display = isCollapsed ? 'flex' : 'none';
      subHeaderAccordion.style.paddingTop = 0;

      iconElement.src = isCollapsed ? '/express/code/icons/minus-heavy.svg' : '/express/code/icons/plus-heavy.svg';
    });
  });
}

function buildOriginalLayout(
  block,
  typographyClasses = {},
  viewMoreText = 'View more',
  viewLessText = 'View less',
) {
  const collapsibleRows = [];
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.innerHTML,
      subHeader: subHeader?.innerHTML,
    });
  });

  block.innerHTML = '';

  const visibleCount = 4;
  let isExpanded = false;

  collapsibleRows.forEach((row, index) => {
    const { header, subHeader } = row;

    const accordion = createTag('div', { class: 'collapsible-row-accordion collapsible-row-accordion--mini-editor', tabIndex: 0 });

    if (index >= visibleCount) {
      accordion.classList.add('collapsed');
      accordion.style.display = 'none';
    }

    block.append(accordion);

    const headerEl = createContentElement(header, 'collapsible-row-header', {
      allowSingleChildReuse: true,
      extraClasses: ['collapsible-row-header--mini-editor'],
    });
    accordion.append(headerEl);
    if (typographyClasses.header && typographyClasses.header.length > 0) {
      headerEl.classList.add(...typographyClasses.header);
    }

    const subHeaderEl = createContentElement(subHeader, 'collapsible-row-sub-header', {
      allowSingleChildReuse: true,
      extraClasses: ['collapsible-row-sub-header--mini-editor'],
    });
    if (typographyClasses.body && typographyClasses.body.length > 0) {
      subHeaderEl.classList.add(...typographyClasses.body);
    }
    accordion.append(subHeaderEl);
    accordion.append(buildQuoteActions(
      headerEl.textContent.trim(),
      subHeaderEl.textContent.trim(),
    ));
  });

  const toggleButton = createTag('a', { class: 'collapsible-row-toggle-btn button' });
  toggleButton.textContent = viewMoreText;
  collapsibleRows.length > 4 && block.append(toggleButton);

  toggleButton.addEventListener('click', () => {
    const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
    hiddenItems.forEach((item, index) => {
      if (index >= visibleCount) {
        if (item.classList.contains('collapsed')) {
          item.classList.remove('collapsed');
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
          item.classList.add('collapsed');
        }
      }
    });
    isExpanded = !isExpanded;
    toggleButton.textContent = isExpanded ? viewLessText : viewMoreText;
  });
}

function convertStrongToSpan(element) {
  const strongTags = element.querySelectorAll('strong');
  strongTags.forEach((strong) => {
    const span = createTag('span', { class: 'collapsible-row-bold' });
    span.innerHTML = strong.innerHTML;
    strong.replaceWith(span);
  });
}

function extractTypographyClasses(block) {
  const typographyClasses = Array
    .from(block.classList)
    .filter((cls) => isMiloTypographyClass(cls) || isExpressTypographyClass(cls));

  const headerClasses = typographyClasses.filter((cls) => cls.includes('heading'));
  const bodyClasses = typographyClasses.filter((cls) => cls.includes('body'));

  return {
    header: headerClasses,
    body: bodyClasses,
  };
}

export default async function decorate(block) {
  block.classList.add('ax-mini-editor-quotes');
  [{ createTag, getConfig }, { replaceKey }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);

  await loadQuoteActionDeps();
  convertStrongToSpan(block);

  const typographyClasses = extractTypographyClasses(block);
  const isExpandableVariant = block.classList.contains('expandable');

  if (isExpandableVariant) {
    buildTableLayout(block, typographyClasses);
  } else {
    const [viewMoreText, viewLessText] = await Promise.all([
      replaceKey('view-more', getConfig()),
      replaceKey('view-less', getConfig()),
    ]);
    buildOriginalLayout(block, typographyClasses, viewMoreText || 'View more', viewLessText || 'View less');
  }
}
