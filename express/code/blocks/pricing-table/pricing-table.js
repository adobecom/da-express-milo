import { getLibs, getFixedTopOffset, yieldToMain, fixIcons, decorateButtonsDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { debounce } from '../../scripts/utils/hofs.js';
import { splitAndAddVariantsWithDash } from '../../scripts/utils/decorate.js';
import { formatDynamicCartLink } from '../../scripts/utils/pricing.js';
import { sendEventToAnalytics } from '../../scripts/instrument.js';

let createTag;
let getConfig;
let replaceKey;
let headingCols;
let previousHeaderRow;
let previousHeaderRowHeadingId;

const MOBILE_SIZE = 981;
function defineDeviceByScreenSize() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= MOBILE_SIZE) return 'DESKTOP';
  return 'MOBILE';
}

function handleToggleMore(btn) {
  let prevElement = btn.previousElementSibling;
  const icon = btn.querySelector('.icon.expand');
  const expanded = icon?.getAttribute('aria-expanded') === 'false';
  icon?.setAttribute('aria-expanded', expanded.toString());
  while (prevElement && !prevElement.classList.contains('section-header-row') && !prevElement.classList.contains('spacer-row')) {
    if (expanded) {
      btn.classList.remove('collapsed');
      prevElement.classList.remove('collapsed');
    } else {
      btn.classList.add('collapsed');
      prevElement.classList.add('collapsed');
    }

    prevElement = prevElement.previousElementSibling;
  }
}

function handleHeading(headingRow) {
  if (headingCols.length > 3) headingRow.parentElement.classList.add('many-cols');
  else if (headingCols.length < 3) headingRow.parentElement.classList.add('few-cols');

  headingCols.forEach(async (col, colIdx) => {
    col.classList.add('col-heading');
    const elements = col.children;
    if (!elements?.length) {
      col.innerHTML = `<p class="tracking-header">${col.innerHTML}</p>`;
      return;
    }

    col.setAttribute('id', `${0}:${colIdx}`);
    col.setAttribute('role', 'columnheader');

    col.querySelectorAll('img').forEach((img) => {
      img.setAttribute('alt', '');
    });

    await decorateButtonsDeprecated(col, 'button-l');
    const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
    const buttons = col.querySelectorAll('.button, .con-button');

    buttons.forEach((btn) => {
      if (btn.classList.contains('con-button', 'blue')) {
        btn.classList.add('primary', 'button');
        btn.parentNode.remove();
      }
      formatDynamicCartLink(btn);
      const btnWrapper = btn.closest('p');
      btnWrapper.classList.add('button-container');
      buttonsWrapper.append(btnWrapper);
    });
    if (buttons.length > 0) {
      col.append(buttonsWrapper);
    }

    if (buttons.length > 1) {
      buttons.forEach((btn, index) => {
        if (index > 0) btn.remove();
      });
    }

    const div = document.createElement('div');
    const colLabel = document.createElement('div');
    colLabel.classList.add('col-heading');
    [...elements].forEach((e) => {
      if (!e.classList.contains('buttons-wrapper')) colLabel.append(e.cloneNode(true));
      div.append(e);
    });
    col.replaceChildren(div);
    const colIndex = col.getAttribute('data-col-index');
    const colItems = headingRow.parentElement.querySelectorAll(`.section-row > .col[data-col-index="${colIndex}"]`);
    colItems.forEach((colItem) => {
      const colWrapper = document.createElement('div');
      colWrapper.classList.add('col-wrapper');
      const colContent = document.createElement('div');
      colContent.classList.add('col-content');
      Array.from(colItem.children).forEach((colItemEl) => {
        colContent.appendChild(colItemEl);
      });
      colWrapper.append(colLabel.cloneNode(true), colContent);
      colItem.append(colWrapper);
    });
  });
}

function handleSection(sectionParams) {
  const {
    row,
    index,
    allRows,
    rowCols,
    isToggle,
    firstSection,
    INCLUDE_ICON,
    EXCLUDE_ICON,
  } = sectionParams;

  const previousRow = allRows[index - 1];
  const nextRow = allRows[index + 1];
  if (!nextRow) row.classList.add('table-end-row');
  if (rowCols.length === 0) {
    row.classList.add('blank-row');
    row.removeAttribute('role');
    if (index > 0) previousRow.classList.add('table-end-row');
    if (nextRow) nextRow.classList.add('table-start-row');
  } else if (isToggle) {
    const toggleIconTag = createTag('span', { class: 'icon expand', 'aria-expanded': firstSection });
    row.querySelector('.toggle-content').prepend(toggleIconTag);
    row.classList.add('collapsed');
    let prevRow = previousRow;
    let i = index;
    // TODO: clean up this func please...
    while (prevRow && !prevRow.classList.contains('section-header-row') && !prevRow.classList.contains('blank-row')) {
      if (!firstSection) prevRow.classList.add('collapsed');
      i -= 1;
      prevRow = allRows[i].previousElementSibling;
    }
  } else if (rowCols.length === 1) {
    row.classList.add('section-header-row');
    rowCols[0].classList.add('section-head-title');
    rowCols[0].setAttribute('role', 'rowheader');
    rowCols[0].setAttribute('id', `${index}:${0}`);
    previousHeaderRowHeadingId = `${index}:${0}`;
    previousHeaderRow = row;
  } else if (index === 0) {
    row.classList.add('row-heading', 'table-start-row');
  } else {
    row.classList.add('section-row');
    rowCols.forEach((col, idx) => {
      decorateButtonsDeprecated(col);
      if (idx === 0) {
        col.setAttribute('aria-labelledby', previousHeaderRowHeadingId);
        col.setAttribute('role', 'rowheader');
        col.setAttribute('id', `${index}:${idx}`);
        if (!col.children?.length || col.querySelector(':scope > sup')) col.innerHTML = `<p>${col.innerHTML}</p>`;
        return;
      }

      const dim = col.querySelectorAll('em').length > 0;
      if (dim) {
        col.classList.add('dim');
      }

      if (previousHeaderRow) {
        col.setAttribute('aria-labelledby', `${`${index}:${0}`} ${`${0}:${idx}`}`);
      }

      const child = col.children?.[0] || col;
      if (!child.innerHTML || child.textContent === '-') {
        col.classList.add('excluded-feature');
        child.innerHTML = EXCLUDE_ICON;
        child.classList.add('icon-container');
      } else if (child.textContent === '+') {
        col.classList.add('included-feature');
        child.innerHTML = INCLUDE_ICON;
        child.classList.add('icon-container');
      } else if (!col.children.length) {
        child.innerHTML = `<p >${col.innerHTML}</p>`;
      }
    });
    if (nextRow?.classList.contains('toggle-row')) {
      row.classList.add('table-end-row');
    }
  }
}

const assignEvents = (tableEl) => {
  const buttons = tableEl.querySelectorAll('.toggle-row');
  if (!buttons?.length) return;

  buttons.forEach((btn) => {
    btn.classList.add('point-cursor');
    btn.addEventListener('click', () => handleToggleMore(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleMore(btn);
      }
    });
  });

  const linksPopulated = new CustomEvent('linkspopulated', { detail: buttons });
  document.dispatchEvent(linksPopulated);
};

// multiple live on same page
const getId = (function idSetups() {
  const gen = (function* g() {
    let id = 0;
    while (true) {
      yield id;
      id += 1;
    }
  }());
  return () => gen.next().value;
}());

export default async function init(el) {
  await fixIcons(el);
  splitAndAddVariantsWithDash(el);
  const isSingleSectionVariant = el.classList.contains('single-section');
  let deviceBySize = defineDeviceByScreenSize();

  addTempWrapperDeprecated(el, 'pricing-table');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ createTag, getConfig } = utils);
    ({ replaceKey } = placeholders);
  });

  const blockId = getId();
  el.id = `pricing-table-${blockId + 1}`;
  el.setAttribute('role', 'table');
  const visibleCount = parseInt(Array.from(el.classList).find((c) => /^show(\d+)/i.test(c))?.substring(4) ?? '3', 10);
  const rows = Array.from(el.children);
  let sectionItem = 0;
  const viewAllFeatures = await replaceKey('view-all-features', getConfig());
  const ariaLabelForCheckIcon = await replaceKey('aria-label-pricing-icon-check', getConfig()) || 'yes';
  const ariaLabelForCrossIcon = await replaceKey('aria-label-pricing-icon-cross', getConfig()) || 'no';

  const INCLUDE_ICON = `<span class="feat-icon check" aria-label=${ariaLabelForCheckIcon} role="img"></span>`;
  const EXCLUDE_ICON = `<span class="feat-icon cross" aria-label=${ariaLabelForCrossIcon} role="img"></span>`;

  let firstSection = true;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    row.classList.add('row', `row-${index + 1}`);
    if (row.tagName !== 'BUTTON') row.setAttribute('role', 'row');
    const cols = Array.from(row.children);
    if (index === 0) {
      headingCols = cols;
    }

    let isAdditional = false;
    const isToggle = row.classList.contains('toggle-row');

    if (!isToggle) {
      if (cols.length <= 1) {
        if (!cols[0]?.innerHTML) {
          cols.shift().remove();
        } else {
          sectionItem = 0;
        }
      }
      if (sectionItem > visibleCount) isAdditional = true;
      sectionItem += 1;
      cols.forEach((col, cdx) => {
        col.dataset.colIndex = cdx + 1;
        col.classList.add('col', `col-${cdx + 1}`);
        col.setAttribute('role', 'cell');
      });

      if (isSingleSectionVariant && isAdditional && cols.length > 1) {
        const viewAllText = viewAllFeatures ?? 'View all features';
        const isFirstSection = sectionItem === 4;

        const toggleBtn = createTag('button', {
          class: 'toggle-row toggle-content col col-1',
          'aria-expanded': isFirstSection ? 'true' : 'false',
        }, viewAllText);

        const toggleIconTag = createTag('span', {
          class: 'icon expand',
          'aria-expanded': isFirstSection ? 'true' : 'false',
        });

        toggleBtn.prepend(toggleIconTag);

        const colsToToggle = row.querySelectorAll('[data-col-index="2"], [data-col-index="3"]');
        if (!isFirstSection) {
          colsToToggle.forEach((col) => {
            col.classList.add('collapsed');
          });
        }

        toggleBtn.addEventListener('click', () => {
          const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'false';
          toggleBtn.setAttribute('aria-expanded', isExpanded.toString());
          colsToToggle.forEach((col) => {
            if (!isExpanded) {
              col.classList.add('collapsed');
            } else {
              col.classList.remove('collapsed');
            }
          });
        });

        row.appendChild(toggleBtn);
      }

      if (sectionItem % 2 === 0 && cols.length > 1) row.classList.add('shaded');
    } else {
      row.setAttribute('tabindex', 0);
    }

    const nextRow = rows[index + 1];
    if (!isSingleSectionVariant && index > 0 && !isToggle && cols.length > 1
      && (!nextRow || Array.from(nextRow.children).length <= 1)) {
      const toggleRow = createTag('button', { class: 'toggle-row' });
      if (!isAdditional) toggleRow.classList.add('desktop-hide');

      const viewAllText = viewAllFeatures ?? 'View all features';
      const toggleOverflowContent = createTag('div', { class: 'toggle-content col', role: 'cell', 'aria-label': viewAllText }, viewAllText);

      toggleOverflowContent.addEventListener('click', () => {
        const buttonEl = toggleOverflowContent.querySelector('span.expand');
        const action = buttonEl && buttonEl.getAttribute('aria-expanded') === 'true' ? 'closed' : 'opened';
        sendEventToAnalytics(`adobe.com:express:cta:pricing:tableToggle:${action || ''}`);
      });
      toggleRow.append(toggleOverflowContent);

      if (nextRow) {
        rows.splice(index + 1, 0, toggleRow);
        el.insertBefore(toggleRow, nextRow);
      } else {
        rows.push(toggleRow);
        el.append(toggleRow);
      }
    }
    if (isAdditional && cols.length > 1) row.classList.add('additional-row');
    const sectionParams = {
      row,
      index,
      allRows: rows,
      rowCols: cols,
      isToggle,
      firstSection,
      INCLUDE_ICON,
      EXCLUDE_ICON,
    };
    handleSection(sectionParams);
    // eslint-disable-next-line no-await-in-loop
    await yieldToMain();

    if (isToggle) {
      firstSection = false;
    }
  }

  handleHeading(rows[0]);
  assignEvents(el);

  const handleResize = () => {
    const collapisbleRows = el.querySelectorAll('.section-row, .toggle-row');
    const toggleRows = el.querySelectorAll('.toggle-row');
    if (isSingleSectionVariant) {
      const newDeviceSize = defineDeviceByScreenSize();
      if (deviceBySize !== newDeviceSize) {
        deviceBySize = newDeviceSize;

        if (newDeviceSize === 'DESKTOP') {
          el.classList.remove('single-section');
        } else {
          el.classList.add('single-section');
        }

        collapisbleRows.forEach((collapisbleRow) => {
          collapisbleRow.classList.add('collapsed');
        });
      }
      toggleRows.forEach((toggleRow) => {
        toggleRow.querySelector('.icon.expand').setAttribute('aria-expanded', false);
      });
    } else {
      toggleRows.forEach((toggleRow) => {
        toggleRow.querySelector('.icon.expand').setAttribute('aria-expanded', false);
      });
    }
  };

  window.addEventListener('resize', debounce(() => {
    if (deviceBySize === defineDeviceByScreenSize()) return;
    deviceBySize = defineDeviceByScreenSize();
    handleResize();
  }, 100));

  if (el.classList.contains('sticky')) {
    const scrollHandler = () => {
      if (deviceBySize === 'MOBILE') return;
      if (el.closest('div.tabpanel')?.getAttribute('hidden')) {
        return;
      }
      const gnavHeight = getFixedTopOffset();
      const { top } = rows[0].getBoundingClientRect();
      if (top <= gnavHeight && !rows[0].classList.contains('stuck')) {
        rows[0].style.top = `${gnavHeight}px`;
      } else if (rows[0].classList.contains('stuck') && top > gnavHeight) {
        rows[0].classList.remove('stuck');
      }
      const p = rows[1].getBoundingClientRect();
      if (top >= p.top && top > 0) {
        rows[0].classList.add('stuck');
      }
    };
    window.addEventListener('scroll', debounce(scrollHandler, 16), { passive: true });
  }
}
