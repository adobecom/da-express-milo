const MOBILE_BREAKPOINT = 768;
const SCROLL_PADDING_OFFSET = 6;

// ── DOM builders ─────────────────────────────────────────────────────────────

function buildCarouselNav(totalCols) {
  const nav = document.createElement('div');
  nav.className = 'dt-carousel-nav';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Navigate columns');

  const prevBtn = document.createElement('button');
  prevBtn.className = 'dt-nav-btn dt-prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.disabled = true;
  prevBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#FFFFFF"/><path d="M17.3984 21.1996L12.5984 16.3996L17.3984 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'dt-nav-btn dt-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#FFFFFF"/><path d="M14.6016 21.1996L19.4016 16.3996L14.6016 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  nav.append(prevBtn, nextBtn);
  return nav;
}

function buildSectionHeader(titleDiv, totalCols) {
  const header = document.createElement('div');
  header.className = 'dt-section-header';

  const headerText = document.createElement('div');
  headerText.className = 'dt-header-text';

  // Preserve an existing heading; otherwise wrap in h2
  const existingHeading = titleDiv.querySelector('h1,h2,h3,h4,h5,h6');
  if (existingHeading) {
    headerText.appendChild(existingHeading);
  } else {
    const h2 = document.createElement('h2');
    h2.innerHTML = titleDiv.innerHTML;
    headerText.appendChild(h2);
  }

  // Carry over any sub-paragraph (optional subtitle below the heading)
  const subtitleP = titleDiv.querySelector('p');
  if (subtitleP) headerText.appendChild(subtitleP);

  header.appendChild(headerText);
  header.appendChild(buildCarouselNav(totalCols));
  return header;
}

function parseColHeader(div) {
  const paras = Array.from(div.querySelectorAll('p'));
  if (paras.length >= 1) {
    return { primary: paras[0].innerHTML, subcopy: paras[1]?.innerHTML ?? null };
  }
  const heading = div.querySelector('h1,h2,h3,h4,h5,h6');
  if (heading) {
    return { primary: heading.innerHTML, subcopy: null };
  }
  return { primary: div.innerHTML.trim(), subcopy: null };
}

function buildColHeaderTh(div, colIndex) {
  const th = document.createElement('th');
  th.className = 'dt-data-col';
  th.dataset.col = colIndex;
  th.setAttribute('scope', 'col');

  const { primary, subcopy } = parseColHeader(div);

  const nameSpan = document.createElement('span');
  nameSpan.className = 'dt-col-name';
  nameSpan.innerHTML = primary;
  th.appendChild(nameSpan);

  if (subcopy) {
    const subSpan = document.createElement('span');
    subSpan.className = 'dt-col-price';
    subSpan.innerHTML = subcopy;
    th.appendChild(subSpan);
  }

  return th;
}

function buildLabelTh(cellDiv, isHeader = false) {
  const th = document.createElement('th');
  th.className = 'dt-label-col';
  th.setAttribute('scope', isHeader ? 'col' : 'row');

  if (isHeader) return th; // empty top-left cell

  const paras = Array.from(cellDiv.querySelectorAll('p'));
  const primaryText = paras[0]?.textContent ?? cellDiv.textContent;

  const primary = document.createElement('span');
  primary.className = 'dt-row-primary';
  primary.textContent = primaryText;
  th.appendChild(primary);

  if (paras.length >= 2) {
    const secondary = document.createElement('span');
    secondary.className = 'dt-row-secondary';
    secondary.textContent = paras[1].textContent;
    th.appendChild(secondary);
  }

  return th;
}

function buildDataTd(cellDiv, colIndex) {
  const td = document.createElement('td');
  td.className = 'dt-data-col';
  td.dataset.col = colIndex;
  td.innerHTML = cellDiv.innerHTML;
  return td;
}

function buildTable(colHeaderDivs, dataRowDivs) {
  const container = document.createElement('div');
  container.className = 'dt-table-container';

  const table = document.createElement('table');
  table.className = 'dt-table';

  // thead — first div in the header row is the label-column header (e.g. "Feature"),
  // the rest are the data-column headers. This matches the data rows where the first
  // child is also the label cell, keeping column counts in sync.
  const [labelHeaderDiv, ...dataHeaderDivs] = colHeaderDivs;
  const thead = document.createElement('thead');
  const headerTr = document.createElement('tr');
  const labelHeaderTh = document.createElement('th');
  labelHeaderTh.className = 'dt-label-col';
  labelHeaderTh.setAttribute('scope', 'col');
  labelHeaderTh.textContent = labelHeaderDiv?.textContent.trim() ?? '';
  headerTr.appendChild(labelHeaderTh);
  dataHeaderDivs.forEach((div, i) => headerTr.appendChild(buildColHeaderTh(div, i)));
  thead.appendChild(headerTr);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement('tbody');
  dataRowDivs.forEach((rowDiv) => {
    const tr = document.createElement('tr');
    const cells = Array.from(rowDiv.children);
    cells.forEach((cellDiv, i) => {
      tr.appendChild(i === 0 ? buildLabelTh(cellDiv) : buildDataTd(cellDiv, i - 1));
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
  return container;
}

// ── Position classes (corner/edge borders via CSS) ────────────────────────────

function labelCells(table) {
  const allRows = [table.querySelector('thead tr'), ...table.querySelectorAll('tbody tr')];
  const lastRowIdx = allRows.length - 1;
  allRows.forEach((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('th, td'));
    const lastColIdx = cells.length - 1;
    cells.forEach((cell, colIdx) => {
      cell.classList.toggle('dt-first-row', rowIdx === 0);
      cell.classList.toggle('dt-last-row', rowIdx === lastRowIdx);
      cell.classList.toggle('dt-first-col', colIdx === 0);
      cell.classList.toggle('dt-last-col', colIdx === lastColIdx);
    });
  });
}

// ── Carousel ─────────────────────────────────────────────────────────────────

function initCarousel(block) {
  const container = block.querySelector('.dt-table-container');
  const table = block.querySelector('.dt-table');
  const prevBtn = block.querySelector('.dt-prev');
  const nextBtn = block.querySelector('.dt-next');
  const labelTh = table.querySelector('thead .dt-label-col');
  const dataColThs = Array.from(table.querySelectorAll('thead .dt-data-col'));
  const totalCols = dataColThs.length;
  let current = 0;
  let dataColW = 0;

  function setup() {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) {
      table.style.width = '';
      labelTh.style.width = '';
      dataColThs.forEach((th) => { th.style.width = ''; });
      container.style.scrollPaddingLeft = '';
      dataColW = 0;
      return;
    }
    // CSS owns the label column width per breakpoint; read it back via offsetWidth.
    const actualLabelW = labelTh.offsetWidth;
    // Use window.innerWidth directly — container.clientWidth can be 0 on first paint.
    // 32px = block left padding (16px) + container right padding (16px).
    dataColThs.forEach((th) => { th.style.width = `${window.innerWidth - 32 - actualLabelW}px`; });

    // Read back actual rendered width — CSS max-width may have capped it.
    dataColW = dataColThs[0]?.offsetWidth ?? (window.innerWidth - 32 - actualLabelW);

    table.style.width = `${actualLabelW + totalCols * dataColW}px`;
    container.style.scrollPaddingLeft = `${actualLabelW + SCROLL_PADDING_OFFSET}px`;
  }

  function updateNav() {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === totalCols - 1;
  }

  function scrollToCol(index) {
    current = Math.max(0, Math.min(totalCols - 1, index));
    container.scrollTo({ left: Math.max(0, current * dataColW - SCROLL_PADDING_OFFSET), behavior: 'smooth' });
    updateNav();
  }

  function syncFromScroll() {
    if (dataColW === 0) return;
    const snapped = Math.max(0, Math.min(totalCols - 1, Math.round((container.scrollLeft + SCROLL_PADDING_OFFSET) / dataColW)));
    if (snapped !== current) { current = snapped; updateNav(); }
  }

  if ('onscrollend' in window) {
    container.addEventListener('scrollend', syncFromScroll);
  } else {
    let t;
    container.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(syncFromScroll, 120); });
  }

  prevBtn.addEventListener('click', () => scrollToCol(current - 1));
  nextBtn.addEventListener('click', () => scrollToCol(current + 1));

  window.addEventListener('resize', () => {
    current = 0;
    container.scrollLeft = 0;
    setup();
    updateNav();
  });

  // Defer initial setup by one rAF so the browser has finished layout and
  // container.clientWidth reflects the real rendered width, not 0.
  requestAnimationFrame(() => {
    setup();
    updateNav();
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function decorate(block) {
  const rows = Array.from(block.children);
  if (rows.length < 3) return; // title + col headers + at least 1 data row

  const [titleRow, colHeaderRow, ...dataRows] = rows;

  const titleDiv = titleRow.querySelector('div') ?? titleRow;
  const colHeaderDivs = Array.from(colHeaderRow.children);
  // First child is the label-column header; the rest are data column headers.
  const totalDataCols = colHeaderDivs.length - 1;

  const sectionHeader = buildSectionHeader(titleDiv, totalDataCols);
  const tableContainer = buildTable(colHeaderDivs, dataRows);

  block.innerHTML = '';
  block.append(sectionHeader, tableContainer);

  labelCells(tableContainer.querySelector('.dt-table'));
  initCarousel(block);
}
