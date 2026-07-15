import { createTag } from '../utils.js';

// todo: remove this.needBackwardCompatibility() when template-list is deprecated
function nodeIsBefore(node, otherNode) {
  // eslint-disable-next-line no-bitwise
  const forward = node.compareDocumentPosition(otherNode)
    & Node.DOCUMENT_POSITION_FOLLOWING;
  return (!!forward);
}

/**
 * Column geometry for a masonry grid. Shared so callers that need to know the grid's shape
 * before it is drawn cannot drift from what setupColumns() actually does -- if these two
 * disagree, any height computed from this is wrong.
 */
export function getColumnLayout(block, width) {
  let colWidth = 264;
  if (block.classList.contains('sixcols') || block.classList.contains('fullwidth')) {
    colWidth = 175;
  }
  if (block.classList.contains('fullwidth')) {
    colWidth = 185;
  }
  if (window.innerWidth >= 900) {
    if (block.classList.contains('sm-view')) colWidth = 176;
    if (block.classList.contains('md-view')) colWidth = 270;
    if (block.classList.contains('lg-view')) colWidth = 340;
  } else if (window.innerWidth >= 600) {
    if (block.classList.contains('sm-view')) colWidth = 172;
    if (block.classList.contains('md-view')) colWidth = 240;
    if (block.classList.contains('lg-view')) colWidth = 364;
  } else {
    if (block.classList.contains('sm-view')) colWidth = 120;
    if (block.classList.contains('md-view')) colWidth = 172;
    if (block.classList.contains('lg-view')) colWidth = 340;
  }
  let columnWidth = colWidth - 4;
  if (colWidth === 175 || colWidth === 185) {
    columnWidth = colWidth - 10;
  }
  let numCols = Math.floor(width / colWidth);
  if (numCols < 1) numCols = 1;
  return { colWidth, columnWidth, numCols };
}

/**
 * Predict the drawn grid's height from the API's thumbnail dimensions, before any thumbnail
 * has loaded and given the cells a size of their own.
 *
 * This is only possible because placement is deterministic on a cold load: addCell derives
 * calculatedHeight from img.naturalWidth/naturalHeight, which are 0 until the thumbnail
 * decodes, so calculatedHeight is NaN; getNextColumn's `maxOuterHeight - minOuterHeight >=
 * height - 50` is then a NaN comparison and always false, fillToHeight never engages, and
 * cells land round-robin -- cell i in column i % numCols. Mirror that exactly.
 *
 * Geometry is measured from a real cell rather than derived from columnWidth. They are not the
 * same number: on `sixcols` the rendered image happens to be exactly columnWidth (165px), but
 * on `fullwidth sm-view` it renders at 156.4px against a columnWidth of 172 -- so using
 * columnWidth would bake in a ~10% error on those pages, and no CSS constant survives every
 * variant. Measuring is also immune to the CSS drifting later.
 *
 * cellHeight(i) is measured for cells with no usable API dimensions -- the `.template.placeholder`
 * first card carries an inline SVG and already has its final height here, and it is not a
 * failure case.
 *
 * Returns null if any cell's height is unknowable: an approximate reservation is worse than
 * none, because reserving too much leaves a permanent gap (PR #585 -> reverted by #600).
 */
export function computeMasonryHeight(cells, dims, numCols) {
  if (!cells?.length || !(numCols > 0)) return null;

  const columns = new Array(numCols).fill(0);
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const d = dims?.[i];
    // Width is measured per cell, not once: the `.template.placeholder` first card is
    // narrower than the image cells (measured 136px vs 156.4px on photo-collage), so probing
    // a single cell would mis-scale every other one.
    const cellWidth = cell.getBoundingClientRect().width;
    if (!(cellWidth > 0)) return null;
    const cs = window.getComputedStyle(cell);
    const margins = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);

    let h;
    if (d?.width > 0 && d?.height > 0) {
      h = (cellWidth / d.width) * d.height;
    } else {
      // No API dimensions: only trustworthy if the cell already stands at its final height,
      // which the placeholder card does (it carries an inline SVG, not a thumbnail). A zero
      // here is a thumbnail that has not loaded, whose height is unknowable -- bail rather
      // than reserve a wrong one.
      h = cell.getBoundingClientRect().height;
      if (!(h > 0)) return null;
    }
    columns[i % numCols] += h + margins;
  }
  return Math.max(...columns);
}

// eslint-disable-next-line import/prefer-default-export
export class Masonry {
  constructor(wrapper, cells) {
    this.wrapper = wrapper;
    this.cells = cells;
    this.columns = [];
    this.nextColumn = null;
    this.startResizing = 0;
    this.columnWidth = 0;
    this.debug = false;
    this.fillToHeight = 0;
  }

  needBackwardCompatibility() {
    return this.wrapper.classList.contains('template-list');
  }

  // set up fresh grid if necessary
  setupColumns() {
    const block = this.needBackwardCompatibility() ? this.wrapper : this.wrapper.parentElement;
    let result = 1;
    const width = this.wrapper.offsetWidth;
    if (!width) {
      return 0;
    }
    const { columnWidth, numCols } = getColumnLayout(block, width);
    const usp = new URLSearchParams(window.location.search);
    if (usp.has('debug-template-list')) {
      this.debug = true;
    }
    this.columnWidth = columnWidth;
    if (numCols !== this.wrapper.querySelectorAll('.masonry-col').length) {
      this.wrapper.querySelectorAll('.masonry-col').forEach((col) => {
        col.remove();
      });
      this.columns = [];
      for (let i = 0; i < numCols; i += 1) {
        const colEl = createTag('div', { class: 'masonry-col' });
        this.columns.push({
          outerHeight: 0,
          colEl,
        });
        this.wrapper.appendChild(colEl);
      }
      result = 2;
    }
    this.nextColumn = null;
    return result;
  }

  // calculate least tallest column to add next cell to
  getNextColumn(height) {
    const columnIndex = this.columns.indexOf(this.nextColumn);
    const nextColumnIndex = (columnIndex + 1) % this.columns.length;
    const minOuterHeight = Math.min(...this.columns.map((col) => col.outerHeight));
    this.nextColumn = this.columns[nextColumnIndex];
    if (!nextColumnIndex) {
      const maxOuterHeight = Math.max(...this.columns.map((col) => col.outerHeight));
      if (!this.fillToHeight) {
        if (maxOuterHeight - minOuterHeight >= height - 50) {
          this.fillToHeight = maxOuterHeight;
          // console.log('entering fill mode');
        }
      }
    }

    if (this.fillToHeight) {
      if (this.fillToHeight - minOuterHeight >= height - 50) {
        // console.log(this.fillToHeight, minOuterHeight, height, cell);
        this.nextColumn = this.columns.find((col) => col.outerHeight === minOuterHeight);
      } else {
        // console.log(this.fillToHeight, minOuterHeight, height, cell);
        this.fillToHeight = 0;
        [this.nextColumn] = this.columns;
        // console.log('no more fill mode');
      }
    }
    return this.nextColumn || this.columns[0];
  }

  // add cell to next column
  addCell(cell) {
    let mediaHeight = 0;
    let mediaWidth = 0;
    let calculatedHeight = 0;

    const img = cell.querySelector('img');
    if (img) {
      mediaHeight = img.naturalHeight;
      mediaWidth = img.naturalWidth;
      calculatedHeight = ((this.columnWidth) / mediaWidth) * mediaHeight;
    }
    const video = cell.querySelector('video');
    if (video) {
      mediaHeight = video.videoHeight;
      mediaWidth = video.videoWidth;
      calculatedHeight = ((this.columnWidth) / mediaWidth) * mediaHeight;
    }
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(cell.offsetHeight, calculatedHeight, cell);
    }

    const column = this.getNextColumn(calculatedHeight);
    column.colEl.append(cell);
    cell.classList.add('appear');

    column.outerHeight += calculatedHeight;

    if (!calculatedHeight && cell.classList.contains('placeholder') && cell.style.height) {
      column.outerHeight += +cell.style.height.split('px')[0] + 20;
    }

    const $btnC = cell.querySelector(':scope > div:nth-of-type(2)');
    if ($btnC) $btnC.classList.add('button-container');

    if (this.needBackwardCompatibility()) {
      /* set tab index and event listeners */
      if (this.cells[0] === cell) {
        /* first cell focus handler */
        cell.addEventListener('focus', (event) => {
          if (event.relatedTarget) {
            const backward = nodeIsBefore(event.target, event.relatedTarget);
            if (backward) this.cells[this.cells.length - 1].focus();
          }
        });
        /* first cell blur handler */
        cell.addEventListener('blur', (event) => {
          if (!event.relatedTarget.classList.contains('template')) {
            const forward = nodeIsBefore(event.target, event.relatedTarget);
            if (forward) {
              if (this.cells.length > 1) {
                this.cells[1].focus();
              }
            }
          }
        });
      } else {
        /* all other cells get custom blur handler and no tabindex */
        cell.setAttribute('tabindex', '-1');
        cell.addEventListener('blur', (event) => {
          if (event.relatedTarget) {
            const forward = nodeIsBefore(event.target, event.relatedTarget);
            const backward = !forward;
            const index = this.cells.indexOf(cell);
            if (forward) {
              if (index < this.cells.length - 1) {
                this.cells[index + 1].focus();
              }
            }
            if (backward) {
              if (index > 0) {
                this.cells[index - 1].focus();
              }
            }
          }
        });
      }
    }
  }

  // distribute cells to columns
  draw(cells) {
    if (!cells) {
      const setup = this.setupColumns();
      if (setup === 1) {
        // no redrawing needed
        return;
      } if (setup === 0) {
        // setup incomplete, try again
        window.setTimeout(() => {
          this.draw(cells);
        }, 200);
        return;
      }
    }
    const workList = [...(cells || this.cells)];

    while (workList.length > 0) {
      for (let i = 0; i < 5 && i < workList.length; i += 1) {
        const cell = workList[i];
        const image = cell.querySelector(':scope picture > img');
        if (image) image.setAttribute('loading', 'eager');
      }
      const cell = workList[0];
      const image = cell.querySelector(':scope picture > img');
      if (image && !image.complete) {
        // continue when image is loaded
        image.addEventListener('load', () => {
          this.draw(workList);
        });

        return;
      }

      if (this.needBackwardCompatibility()) {
        const video = cell.querySelector('video');
        if (video && video.readyState === 0) {
          video.addEventListener('loadedmetadata', () => {
            this.draw(workList);
          });

          return;
        }
      }

      this.addCell(cell);
      // remove already processed cell
      workList.shift();
    }
    if (workList.length > 0) {
      // draw rest
      this.draw(workList);
    } else if (this.needBackwardCompatibility()) {
      this.wrapper.classList.add('template-list-complete');
    } else {
      this.wrapper.parentElement.classList.add('template-x-complete');
      // draw() is not necessarily done when it returns -- setupColumns bails while the
      // wrapper has no width (the body is display:none until load completes) and reschedules
      // itself 200ms later. Callers that need the drawn columns have to be told, not assume.
      this.onDrawn?.();
    }
  }
}
