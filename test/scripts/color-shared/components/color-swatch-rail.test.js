/* eslint-env mocha */
/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import '../../../../express/code/libs/color-components/components/color-swatch-rail/index.js';

function createRail() {
  const rail = document.createElement('color-swatch-rail');
  rail.swatches = [];
  rail.lockedByIndex = new Set();
  rail.tintIndex = null;
  return rail;
}

describe('color-swatch-rail tint bands', () => {
  it('builds 7 tint bands with base in the middle', () => {
    const rail = createRail();
    const baseHex = '#1900AB';
    const bands = rail._buildTintBands(baseHex);

    expect(bands).to.have.length(7);
    expect(bands.map((band) => band.id)).to.deep.equal([
      'tint-1',
      'tint-2',
      'tint-3',
      'base',
      'shade-1',
      'shade-2',
      'shade-3',
    ]);
    bands.forEach((band) => {
      expect(band.hex).to.match(/^#[0-9A-F]{6}$/);
    });
    expect(bands[3].hex).to.equal(baseHex);
  });

  it('applies selected tint band hex and closes tint overlay', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }];
    rail.tintIndex = 0;

    let capturedState = null;
    let emitted = null;
    rail.controller = {
      setState(next) {
        capturedState = next;
        if (next.swatches) rail.swatches = next.swatches;
        if (Object.prototype.hasOwnProperty.call(next, 'tintIndex')) {
          rail.tintIndex = next.tintIndex;
        }
      },
    };
    rail.addEventListener('color-swatch-rail-tint-apply', (event) => {
      emitted = event.detail;
    });

    const selectedBand = rail._buildTintBands('#1900AB')[0];
    rail._handleTintBandSelect(0, selectedBand);

    expect(capturedState).to.exist;
    expect(capturedState.swatches[0].hex).to.equal(selectedBand.hex);
    expect(capturedState.tintIndex).to.equal(null);
    expect(rail.tintIndex).to.equal(null);
    expect(emitted).to.deep.include({
      index: 0,
      tone: 'tint-1',
      hex: selectedBand.hex,
    });
  });

  it('applies tint band even when swatch is locked', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }];
    rail.lockedByIndex = new Set([0]);

    let setStateCalled = false;
    rail.controller = {
      setState() {
        setStateCalled = true;
      },
    };

    const selectedBand = rail._buildTintBands('#1900AB')[1];
    rail._handleTintBandSelect(0, selectedBand);
    expect(setStateCalled).to.equal(true);
  });

  it('returns null when no tint swatch is currently selected', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }, { hex: '#000000' }];
    rail.tintIndex = null;
    expect(rail._resolveTintIndex()).to.equal(null);
  });

  it('builds accessible tint band labels with tone and position', () => {
    const rail = createRail();
    expect(rail._getTintBandA11yLabel({ id: 'base', hex: '#1900AB' }, 3, 7))
      .to.equal('Base color, 4 of 7, #1900AB');
    expect(rail._getTintBandA11yLabel({ id: 'tint-2', hex: '#7A75D5' }, 1, 7))
      .to.equal('Tint 2, 2 of 7, #7A75D5');
    expect(rail._getTintBandA11yLabel({ id: 'shade-3', hex: '#0A0044' }, 6, 7))
      .to.equal('Shade 3, 7 of 7, #0A0044');
  });

  it('traps tab focus within tint bands', () => {
    const rail = createRail();
    const tintBands = document.createElement('div');
    tintBands.className = 'tint-bands';

    const buttons = Array.from({ length: 3 }).map(() => {
      const btn = document.createElement('button');
      btn.className = 'tint-band-btn swatch-column-focusable';
      tintBands.appendChild(btn);
      return btn;
    });

    let focusedIndex = -1;
    buttons.forEach((btn, idx) => {
      btn.focus = () => { focusedIndex = idx; };
    });

    let prevented = false;
    const trapped = rail._trapTabInRail({
      key: 'Tab',
      target: buttons[1],
      shiftKey: false,
      preventDefault: () => { prevented = true; },
    });

    expect(trapped).to.equal(true);
    expect(prevented).to.equal(true);
    expect(focusedIndex).to.equal(2);

    prevented = false;
    const trappedShift = rail._trapTabInRail({
      key: 'Tab',
      target: buttons[0],
      shiftKey: true,
      preventDefault: () => { prevented = true; },
    });

    expect(trappedShift).to.equal(true);
    expect(prevented).to.equal(true);
    expect(focusedIndex).to.equal(2);
  });

  it('starts tint focus trap on first band even when another is active', () => {
    const rail = createRail();
    const column = document.createElement('div');

    const iconBtn = document.createElement('button');
    iconBtn.className = 'icon-button swatch-column-focusable';
    iconBtn.setAttribute('tabindex', '0');
    column.appendChild(iconBtn);

    const tintBands = document.createElement('div');
    tintBands.className = 'tint-bands';
    column.appendChild(tintBands);

    const buttons = Array.from({ length: 7 }).map((_, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tint-band-btn swatch-column-focusable';
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('aria-checked', idx === 4 ? 'true' : 'false');
      tintBands.appendChild(btn);
      return btn;
    });

    let focusedIndex = -1;
    buttons.forEach((btn, idx) => {
      btn.focus = () => { focusedIndex = idx; };
    });

    const activated = rail._activateTintBandFocusTrap(column);

    expect(activated).to.equal(true);
    expect(focusedIndex).to.equal(0);
    expect(iconBtn.getAttribute('tabindex')).to.equal('-1');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('tabindex')).to.equal('0');
    });
  });
});

describe('color-swatch-rail _scheduleTooltipsRefresh', () => {
  it('skips RAF scheduling on touch-only (hover: none) devices', () => {
    const rail = createRail();
    rail._tooltipRefreshRafId = null;

    const origMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({ matches: query === '(hover: none)' });

    rail._scheduleTooltipsRefresh();

    window.matchMedia = origMatchMedia;

    expect(rail._tooltipRefreshRafId).to.equal(null);
  });

  it('refreshes tooltips when colorMode changes, so per-channel copy buttons stop showing the previous mode\'s stale tooltip text', async () => {
    const rail = createRail();
    document.body.appendChild(rail);
    await rail.updateComplete;

    let refreshCount = 0;
    rail._scheduleTooltipsRefresh = () => { refreshCount += 1; };

    rail.colorMode = 'HSB';
    await rail.updateComplete;

    expect(refreshCount).to.be.greaterThan(0);
    rail.remove();
  });
});

describe('color-swatch-rail icon order', () => {
  let rail;

  afterEach(() => {
    rail?.remove();
    rail = null;
  });

  async function renderRail(features, orientation = 'vertical') {
    rail = document.createElement('color-swatch-rail');
    rail.swatches = [{ hex: '#FF0000' }, { hex: '#00FF00' }];
    rail.lockedByIndex = new Set();
    rail.tintIndex = null;
    rail.swatchFeatures = features;
    rail.orientation = orientation;
    document.body.appendChild(rail);
    await rail.updateComplete;
    return rail;
  }

  it('vertical: lock appears before drag, drag before trash', async () => {
    await renderRail(['lock', 'editTint', 'drag', 'trash', 'colorPicker']);
    const topRight = rail.shadowRoot.querySelector('.top-actions--right');
    const buttons = [...topRight.querySelectorAll('button')];
    const lockIdx = buttons.findIndex((b) => b.classList.contains('icon-button--lock'));
    const tintIdx = buttons.findIndex((b) => b.classList.contains('icon-button--edit-tint'));
    const dragIdx = buttons.findIndex((b) => b.classList.contains('icon-button--drag'));
    const trashIdx = buttons.findIndex((b) => b.classList.contains('icon-button--trash'));
    expect(lockIdx).to.be.lessThan(tintIdx);
    expect(tintIdx).to.be.lessThan(dragIdx);
    expect(dragIdx).to.be.lessThan(trashIdx);
  });

  it('stacked: lock appears before trash, trash before drag', async () => {
    await renderRail(['lock', 'editTint', 'drag', 'trash', 'colorPicker'], 'stacked');
    const iconsDiv = rail.shadowRoot.querySelector('.stacked-row__icons');
    const buttons = [...iconsDiv.querySelectorAll('button')];
    const lockIdx = buttons.findIndex((b) => b.classList.contains('icon-button--lock'));
    const tintIdx = buttons.findIndex((b) => b.classList.contains('icon-button--edit-tint'));
    const dragIdx = buttons.findIndex((b) => b.classList.contains('icon-button--drag'));
    const trashIdx = buttons.findIndex((b) => b.classList.contains('icon-button--trash'));
    expect(lockIdx).to.be.lessThan(tintIdx);
    expect(tintIdx).to.be.lessThan(trashIdx);
    expect(trashIdx).to.be.lessThan(dragIdx);
  });
});

describe('color-swatch-rail color modes', () => {
  let rail;

  afterEach(() => {
    rail?.remove();
    rail = null;
  });

  async function renderRail(colorMode, orientation = 'vertical') {
    rail = document.createElement('color-swatch-rail');
    rail.swatches = [{ hex: '#FF0000' }];
    rail.lockedByIndex = new Set();
    rail.tintIndex = null;
    rail.swatchFeatures = {
      copy: true, copyFromHex: false, colorPicker: false, hexCode: true, baseColor: false,
    };
    rail.orientation = orientation;
    rail.colorMode = colorMode;
    document.body.appendChild(rail);
    await rail.updateComplete;
    return rail;
  }

  it('HEX mode (default): renders a single static hex label, no multi-row block', async () => {
    await renderRail('HEX');
    expect(rail.shadowRoot.querySelector('.hex-code-multi')).to.equal(null);
    expect(rail.shadowRoot.querySelector('.hex-code--static').textContent.trim()).to.equal('#FF0000');
  });

  it('HEX mode: swatch-column aria-label uses the hex template', async () => {
    await renderRail('HEX');
    const column = rail.shadowRoot.querySelector('.swatch-column');
    expect(column.getAttribute('aria-label')).to.equal('#FF0000 color strip');
  });

  it('RGB mode: swatch-column aria-label is "R {value}, G {value}, B {value}" — not the hex template', async () => {
    await renderRail('RGB');
    const column = rail.shadowRoot.querySelector('.swatch-column');
    expect(column.getAttribute('aria-label')).to.equal('R 255, G 0, B 0');
  });

  it('HSB mode: swatch-column aria-label follows the same "Label value" pattern', async () => {
    await renderRail('HSB');
    const column = rail.shadowRoot.querySelector('.swatch-column');
    expect(column.getAttribute('aria-label')).to.equal('H 0, S 100, B 100');
  });

  it('Lab mode: swatch-column aria-label follows the same "Label value" pattern', async () => {
    await renderRail('Lab');
    const column = rail.shadowRoot.querySelector('.swatch-column');
    const label = column.getAttribute('aria-label');
    expect(label).to.match(/^L -?\d+(\.\d+)?, a -?\d+(\.\d+)?, b -?\d+(\.\d+)?$/);
  });

  it('stacked orientation, non-HEX mode: aria-label keeps the "Color {index}, " position prefix ahead of the channel values', async () => {
    await renderRail('RGB', 'stacked');
    const column = rail.shadowRoot.querySelector('.swatch-column');
    expect(column.getAttribute('aria-label')).to.equal('Color 1, R 255, G 0, B 0');
  });

  it('RGB mode: renders one row per channel with correct values', async () => {
    await renderRail('RGB');
    const rows = [...rail.shadowRoot.querySelectorAll('.hex-code-row')];
    expect(rows).to.have.length(3);
    const values = rows.map((row) => ({
      label: row.querySelector('.hex-code-row__label').textContent.trim(),
      value: row.querySelector('.hex-code-row__value').textContent.trim(),
    }));
    expect(values).to.deep.equal([
      { label: 'R', value: '255' },
      { label: 'G', value: '0' },
      { label: 'B', value: '0' },
    ]);
  });

  it('HSB mode: renders H/S/B rows for pure red', async () => {
    await renderRail('HSB');
    const rows = [...rail.shadowRoot.querySelectorAll('.hex-code-row')];
    const values = rows.map((row) => ({
      label: row.querySelector('.hex-code-row__label').textContent.trim(),
      value: row.querySelector('.hex-code-row__value').textContent.trim(),
    }));
    expect(values).to.deep.equal([
      { label: 'H', value: '0' },
      { label: 'S', value: '100' },
      { label: 'B', value: '100' },
    ]);
  });

  it('Lab mode: renders L/a/b rows', async () => {
    await renderRail('Lab');
    const rows = [...rail.shadowRoot.querySelectorAll('.hex-code-row')];
    expect(rows).to.have.length(3);
    expect(rows.map((row) => row.querySelector('.hex-code-row__label').textContent.trim()))
      .to.deep.equal(['L', 'a', 'b']);
  });

  it('Lab mode: does not visually force the lowercase "a"/"b" labels to uppercase', async () => {
    await renderRail('Lab');
    const labels = [...rail.shadowRoot.querySelectorAll('.hex-code-row__label')];
    labels.forEach((label) => {
      expect(getComputedStyle(label).textTransform).to.equal('none');
    });
  });

  it('clicking a channel value (no icon) copies just that value, not the full code', async () => {
    await renderRail('RGB');
    const originalWriteText = navigator.clipboard?.writeText;
    let copiedText = null;
    navigator.clipboard.writeText = (text) => {
      copiedText = text;
      return Promise.resolve();
    };

    const rows = [...rail.shadowRoot.querySelectorAll('.hex-code-row')];
    const greenRow = rows[1];
    const valueBtn = greenRow.querySelector('.hex-code-row__value');
    expect(valueBtn.tagName).to.equal('BUTTON');
    expect(greenRow.querySelector('.icon-button')).to.equal(null);
    valueBtn.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(copiedText).to.equal('0');

    if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
  });

  it('the single bottom copy-icon button copies the full comma-joined code', async () => {
    await renderRail('RGB');
    const originalWriteText = navigator.clipboard?.writeText;
    let copiedText = null;
    navigator.clipboard.writeText = (text) => {
      copiedText = text;
      return Promise.resolve();
    };

    const copyAllBtn = rail.shadowRoot.querySelector('.hex-code-multi__copy-all');
    expect(copyAllBtn).to.exist;
    copyAllBtn.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(copiedText).to.equal('255, 0, 0');

    if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
  });

  it('renders exactly one copy-icon button per swatch in multi-value mode', async () => {
    await renderRail('RGB');
    expect(rail.shadowRoot.querySelectorAll('.hex-code-multi__copy-all')).to.have.length(1);
    expect(rail.shadowRoot.querySelectorAll('.hex-code-multi .icon-button')).to.have.length(1);
  });

  it('stacked orientation (mobile/tablet) renders channels in a single inline row', async () => {
    await renderRail('RGB', 'stacked');
    const rows = [...rail.shadowRoot.querySelectorAll('.hex-code-row')];
    expect(rows).to.have.length(3);
    expect(rail.shadowRoot.querySelector('.hex-code-multi--inline')).to.exist;
  });

  it('stacked orientation has no per-swatch copy-all button (reuses the existing stacked-row icon)', async () => {
    await renderRail('RGB', 'stacked');
    expect(rail.shadowRoot.querySelector('.hex-code-multi__copy-all')).to.equal(null);
    expect(rail.shadowRoot.querySelector('.stacked-row__icons .icon-button--copy')).to.exist;
  });

  it('stacked orientation: the existing stacked-row copy icon copies the joined code, not the hex', async () => {
    await renderRail('RGB', 'stacked');
    const originalWriteText = navigator.clipboard?.writeText;
    let copiedText = null;
    navigator.clipboard.writeText = (text) => {
      copiedText = text;
      return Promise.resolve();
    };

    rail.shadowRoot.querySelector('.stacked-row__icons .icon-button--copy').click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(copiedText).to.equal('255, 0, 0');

    if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
  });

  it('stacked orientation in HEX mode: the existing stacked-row copy icon still copies the hex', async () => {
    await renderRail('HEX', 'stacked');
    const originalWriteText = navigator.clipboard?.writeText;
    let copiedText = null;
    navigator.clipboard.writeText = (text) => {
      copiedText = text;
      return Promise.resolve();
    };

    rail.shadowRoot.querySelector('.stacked-row__icons .icon-button--copy').click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(copiedText).to.equal('#FF0000');

    if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
  });

  it('the bottom copy-icon button says "Copy all values" (not mode-specific, and not "Copy hex") whenever it copies the joined mode code', async () => {
    await renderRail('RGB');
    const copyAllBtn = rail.shadowRoot.querySelector('.hex-code-multi__copy-all');
    expect(copyAllBtn.getAttribute('aria-label')).to.equal('Copy all values');
    expect(copyAllBtn.getAttribute('title')).to.equal('Copy all values');
  });

  it('the bottom copy-icon button says "Copy all values" for HSB/Lab too', async () => {
    await renderRail('HSB');
    const hsbBtn = rail.shadowRoot.querySelector('.hex-code-multi__copy-all');
    expect(hsbBtn.getAttribute('aria-label')).to.equal('Copy all values');

    await renderRail('Lab');
    const labBtn = rail.shadowRoot.querySelector('.hex-code-multi__copy-all');
    expect(labBtn.getAttribute('aria-label')).to.equal('Copy all values');
  });

  it('stacked orientation: the copy icon says "Copy all values" too, since it copies the joined code in non-HEX modes', async () => {
    await renderRail('RGB', 'stacked');
    const stackedCopyBtn = rail.shadowRoot.querySelector('.stacked-row__icons .icon-button--copy');
    expect(stackedCopyBtn.getAttribute('aria-label')).to.equal('Copy all values');
    expect(stackedCopyBtn.getAttribute('title')).to.equal('Copy all values');
  });

  it('stacked orientation in HEX mode: the copy icon\'s label stays "Copy hex", since it still copies the hex', async () => {
    await renderRail('HEX', 'stacked');
    const stackedCopyBtn = rail.shadowRoot.querySelector('.stacked-row__icons .icon-button--copy');
    expect(stackedCopyBtn.getAttribute('aria-label')).to.equal('Copy hex');
  });
});
