const MOBILE_BREAKPOINT = 768;

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

  const existingHeading = titleDiv.querySelector('h1,h2,h3,h4,h5,h6');
  if (existingHeading) {
    headerText.appendChild(existingHeading);
  } else {
    const h2 = document.createElement('h2');
    h2.innerHTML = titleDiv.innerHTML;
    headerText.appendChild(h2);
  }

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

  if (isHeader) return th;

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
// On mobile the container uses overflow:visible + clip-path so position:sticky
// on thead propagates to the page viewport and transform:translateX can reveal
// off-screen columns (clip-path clips post-transform, overflow:clip does not).
// All .dt-label-col cells get a counter-transform to stay pinned at the left.

function initCarousel(block) {
  const container = block.querySelector('.dt-table-container');
  const table = block.querySelector('.dt-table');
  const sectionHeader = block.querySelector('.dt-section-header');
  const prevBtn = block.querySelector('.dt-prev');
  const nextBtn = block.querySelector('.dt-next');
  const headerCover = block.querySelector('.dt-header-cover');
  const headerCoverRight = block.querySelector('.dt-header-cover-right');
  const labelTh = table.querySelector('thead .dt-label-col');
  const dataColThs = Array.from(table.querySelectorAll('thead .dt-data-col'));
  const labelColCells = Array.from(table.querySelectorAll('.dt-label-col'));
  const totalCols = dataColThs.length;
  let current = 0;
  let dataColW = 0;

  function updateStickyOffsets() {
    block.style.setProperty('--dt-section-header-h', `${sectionHeader.offsetHeight}px`);
    if (headerCover) block.style.setProperty('--dt-thead-h', `${table.tHead.offsetHeight}px`);
  }

  function applyTransform(index) {
    if (dataColW === 0) return;
    const offset = index * dataColW;
    table.style.transform = `translateX(-${offset}px)`;
    labelColCells.forEach((cell) => { cell.style.transform = `translateX(${offset}px)`; });
    if (headerCover) headerCover.style.transform = `translateX(${offset}px)`;
    if (headerCoverRight) headerCoverRight.style.transform = `translateX(${offset + 300}px)`;
  }

  function setup() {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) {
      table.style.width = '';
      table.style.transform = '';
      labelTh.style.width = '';
      dataColThs.forEach((th) => { th.style.width = ''; });
      labelColCells.forEach((cell) => { cell.style.transform = ''; });
      if (headerCover) headerCover.style.transform = '';
      if (headerCoverRight) headerCoverRight.style.transform = '';
      dataColW = 0;
      return;
    }
    // CSS owns the label column width per breakpoint; read it back via offsetWidth.
    const actualLabelW = labelTh.offsetWidth;
    // 32px = 16px block left padding + 16px right gap. Sizing each data column
    // 32px narrower than the viewport leaves the label col + one data col on
    // screen, with a 16px gap between the last col and the device's right edge
    // when fully scrolled (mirroring the left padding). For intermediate scroll
    // positions the clip-path no longer insets the right, so the next column
    // bleeds to the device edge instead of being clipped off.
    const dataColTarget = window.innerWidth - 32 - actualLabelW;
    dataColThs.forEach((th) => { th.style.width = `${dataColTarget}px`; });
    dataColW = dataColThs[0]?.offsetWidth ?? dataColTarget;
    table.style.width = `${actualLabelW + totalCols * dataColW}px`;
    applyTransform(current);
  }

  function updateNav() {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === totalCols - 1;
  }

  function goToCol(index) {
    current = Math.max(0, Math.min(totalCols - 1, index));
    applyTransform(current);
    updateNav();
  }

  prevBtn.addEventListener('click', () => goToCol(current - 1));
  nextBtn.addEventListener('click', () => goToCol(current + 1));

  const SWIPE_THRESHOLD = 40;

  // Pointer drag — covers both mouse drag and touch swipe in one path.
  // (Native swipe is gone since there's no scroll container.) We only act on
  // pointerup so we never preventDefault during the gesture, leaving vertical
  // page scroll and link taps untouched.
  let dragStartX = 0;
  let dragStartY = 0;
  let dragging = false;
  container.addEventListener('pointerdown', (e) => {
    if (dataColW === 0) return; // desktop — carousel inactive
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragging = true;
    // Capture so pointerup fires here even if the pointer leaves the container.
    try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  container.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = dragStartX - e.clientX;
    const dy = dragStartY - e.clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      goToCol(current + (dx > 0 ? 1 : -1));
    }
  });
  container.addEventListener('pointercancel', () => { dragging = false; });

  // Wheel / trackpad — map horizontal intent (deltaX, or shift+deltaY) to a
  // single column step, throttled so one gesture moves one column. Vertical
  // scroll falls through to the page (no preventDefault).
  let wheelLock = false;
  container.addEventListener('wheel', (e) => {
    if (dataColW === 0) return; // desktop — carousel inactive
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      ? e.deltaX
      : (e.shiftKey ? e.deltaY : 0);
    if (Math.abs(delta) < 10) return; // vertical scroll → let the page handle it
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    goToCol(current + (delta > 0 ? 1 : -1));
    setTimeout(() => { wheelLock = false; }, 400);
  }, { passive: false });

  window.addEventListener('resize', () => {
    // Disable transition during resize snap to avoid visual jank.
    table.style.transition = 'none';
    labelColCells.forEach((cell) => { cell.style.transition = 'none'; });
    if (headerCover) headerCover.style.transition = 'none';
    if (headerCoverRight) headerCoverRight.style.transition = 'none';
    current = 0;
    setup();
    updateNav();
    updateStickyOffsets();
    requestAnimationFrame(() => {
      table.style.transition = '';
      labelColCells.forEach((cell) => { cell.style.transition = ''; });
      if (headerCover) headerCover.style.transition = '';
      if (headerCoverRight) headerCoverRight.style.transition = '';
    });
  });

  requestAnimationFrame(() => {
    setup();
    updateNav();
    updateStickyOffsets();
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function decorate(block) {
  const rows = Array.from(block.children);
  if (rows.length < 3) return;

  const [titleRow, colHeaderRow, ...dataRows] = rows;

  const titleDiv = titleRow.querySelector('div') ?? titleRow;
  const colHeaderDivs = Array.from(colHeaderRow.children);
  const totalDataCols = colHeaderDivs.length - 1;

  const sectionHeader = buildSectionHeader(titleDiv, totalDataCols);
  const tableContainer = buildTable(colHeaderDivs, dataRows);

  block.innerHTML = '';
  block.append(sectionHeader, tableContainer);

  const table = tableContainer.querySelector('.dt-table');
  labelCells(table);

  const headerCover = document.createElement('div');
  headerCover.className = 'dt-header-cover';
  headerCover.setAttribute('aria-hidden', 'true');
  table.insertBefore(headerCover, table.tBodies[0]);

  const headerCoverRight = document.createElement('div');
  headerCoverRight.className = 'dt-header-cover-right';
  headerCoverRight.setAttribute('aria-hidden', 'true');
  table.insertBefore(headerCoverRight, table.tBodies[0]);

  initCarousel(block);
}
