import { createTag, getIconElementDeprecated, getLibs } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';
import attachImageDragHandlers from '../../scripts/color-shared/components/image-upload/attachImageDragHandlers.js';
import { buildDragOverlay, buildLoadingOverlay } from '../../scripts/color-shared/components/image-extract/buildExtractOverlays.js';
import { DEFAULT_PLACEHOLDERS as IMAGE_UPLOAD_DEFAULTS } from '../../scripts/color-shared/i18n/loadImageUploadPlaceholders.js';
import loadColorImageContrastCheckerPlaceholders, { loadColorImageContrastUploadPlaceholders } from '../../scripts/color-shared/i18n/loadColorImageContrastCheckerPlaceholders.js';
import { createExpressTooltip } from '../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { getPictureSource } from '../../scripts/color-shared/utils/imageExtractUtils.js';
import parseContent from './content.js';
import { decodeImage } from './image.js';
import createRenderer from './analysis.js';
import createDropdown from '../../scripts/color-shared/components/dropdown/dropdown.js';

const instances = new WeakMap();
let nextId = 0;
const scrollLockOwners = new Set();
let lockedScrollY = 0;

function setPageScrollLock(owner, locked) {
  if (locked) scrollLockOwners.add(owner);
  else scrollLockOwners.delete(owner);
  const root = document.documentElement;
  if (scrollLockOwners.size && !root.classList.contains('icc-scroll-lock')) {
    lockedScrollY = window.scrollY;
    root.style.setProperty('--icc-scroll-y', `${lockedScrollY}px`);
    root.classList.add('icc-scroll-lock');
  } else if (!scrollLockOwners.size && root.classList.contains('icc-scroll-lock')) {
    root.classList.remove('icc-scroll-lock');
    root.style.removeProperty('--icc-scroll-y');
    window.scrollTo(0, lockedScrollY);
  }
}
const HISTORY_KEY = 'colorImageContrastChecker';
// Figma "Change color space" timing: 100ms ease-out fade in, 200ms hold, 100ms fade out.
const RECALC_FADE_MS = 100;
const RECALC_HOLD_MS = 200;
const COLOR_SPACE_STRINGS = { srgb: 'srgb', 'display-p3': 'p3', 'adobe-rgb': 'adobeRgb' };
// Figma Fill frames show the image pair at ~150% of its Fit size on mobile and tablet.
const FILL_OVER_FIT = 1.5;
const EXPORT_MAX_AREA = 16777216;
const EXPORT_MAX_SIDE = 16384;

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function colorSpaceLabel(strings, space) {
  return strings[COLOR_SPACE_STRINGS[space]];
}

function label(tag, className, value, attributes = {}) {
  const element = createTag(tag, { class: className, ...attributes });
  element.textContent = value;
  return element;
}

function legendIcon(name, size) {
  const asset = name === 'S2_Icon_AlertTriangle_20_N'
    ? undefined : new URL(`./icons.svg#${name}`, import.meta.url).href;
  const icon = getIconElementDeprecated(name, size, undefined, undefined, asset);
  icon.setAttribute('aria-hidden', 'true');
  if (icon.tagName === 'IMG') icon.alt = '';
  return icon;
}

function button(value, action, iconName) {
  const element = label('button', 'color-action-button', '', {
    type: 'button', 'aria-label': value,
  });
  if (action) element.dataset.action = action;
  if (iconName) {
    const asset = ['replace', 'expand', 'minimize', 'fit', 'fill'].includes(iconName)
      ? new URL(`./icons.svg#${iconName}`, import.meta.url).href : undefined;
    const icon = getIconElementDeprecated(iconName, 20, undefined, undefined, asset);
    icon.setAttribute('aria-hidden', 'true');
    if (icon.tagName === 'IMG') icon.alt = '';
    element.append(icon);
  } else element.textContent = value;
  return element;
}

function createView(content, strings, id, onColorChange) {
  const tips = [];
  const help = (value, explanation) => {
    const trigger = button(value);
    trigger.classList.add('icc-help');
    tips.push({ target: trigger, content: explanation });
    return trigger;
  };
  const panel = createTag('div', { class: 'icc-panel' });
  const main = createTag('div', { class: 'icc-main' });
  const copy = createTag('div', { class: 'icc-copy' });
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.setAttribute('aria-hidden', 'true');
  if (logo.tagName === 'IMG') logo.alt = '';
  copy.append(logo, ...content.results.childNodes);
  const workspace = createTag('div', { class: 'icc-workspace' });
  const controls = createTag('div', { class: 'icc-controls' });
  const left = createTag('div', { class: 'icc-controls-left' });
  const right = createTag('div', { class: 'icc-controls-right' });
  const color = createTag('div', { class: 'icc-color' });
  const colorHelp = label('span', 'icc-help', strings.colorSpace, {
    id: `${id}-color`, tabindex: '0',
  });
  tips.push({ target: colorHelp, content: strings.colorSpaceHelp });
  const items = [
    { value: 'srgb', label: strings.srgb },
    { value: 'display-p3', label: strings.p3 },
  ];
  if (strings.adobeRgb) items.push({ value: 'adobe-rgb', label: strings.adobeRgb });
  const selector = createDropdown({
    items, value: 'srgb', labelledBy: colorHelp.id, onChange: onColorChange,
  });
  color.append(colorHelp, selector.element);
  const replace = button(strings.replaceImage, 'replace', 'replace');
  const save = button(strings.savePng, 'save', 'S2_Icon_Download_20_N');
  save.classList.add('icc-save');
  save.append(label('span', '', strings.savePng));
  save.disabled = true;
  const expand = button(strings.expand, 'expand', 'expand');
  const minimizeIcon = button(strings.minimize, null, 'minimize').firstElementChild;
  tips.push(
    { target: replace, content: strings.replaceImage },
    { target: expand, content: strings.expand },
  );
  controls.append(left, right);
  const comparisonRow = createTag('div', { class: 'icc-comparison-row' });
  const zoom = createTag('div', {
    class: 'icc-zoom', role: 'toolbar', 'aria-label': strings.toolbarAria,
  });
  const fit = button(strings.fit, 'fit', 'fit');
  const fill = button(strings.fill, 'fill', 'fill');
  fit.setAttribute('aria-pressed', 'true');
  fill.setAttribute('aria-pressed', 'false');
  fill.tabIndex = -1;
  zoom.append(fit, fill);
  tips.push({ target: fit, content: strings.fit }, { target: fill, content: strings.fill });
  const comparison = createTag('div', {
    class: 'icc-comparison', tabindex: '0', role: 'region', 'aria-label': strings.comparison,
  });
  const analysisFrame = createTag('div', { class: 'icc-frame' });
  const originalFrame = createTag('div', { class: 'icc-frame' });
  const canvas = createTag('canvas', { role: 'img', 'aria-label': strings.analysis });
  const original = createTag('img', { alt: strings.original, draggable: 'false' });
  analysisFrame.append(canvas);
  originalFrame.append(original);
  comparison.append(analysisFrame, originalFrame);
  // Figma "Change color space": spinner overlay over the analysis area only.
  const recalc = createTag('div', { class: 'icc-recalc', 'aria-hidden': 'true' });
  recalc.append(createTag('div', { class: 'icc-recalc-spinner' }));
  comparisonRow.append(zoom, comparison, recalc);
  const footer = createTag('div', { class: 'icc-footer' });
  workspace.append(controls, comparisonRow, footer);
  main.append(copy, workspace);

  const aside = createTag('aside', { class: 'icc-legend', 'aria-label': strings.legend });
  const fullLegend = createTag('div', { class: 'icc-legend-full' });
  fullLegend.append(label('h2', '', strings.legend));
  const cards = createTag('div', { class: 'icc-legend-cards' });
  const miniLegend = createTag('aside', { class: 'icc-legend-mini', 'aria-label': strings.legend });
  miniLegend.append(label('h2', '', strings.legend));
  const miniItems = createTag('div', { class: 'icc-mini-items' });
  ['green', 'blue', 'dark'].forEach((kind) => {
    const status = strings[{ green: 'passes', blue: 'partial', dark: 'fails' }[kind]];
    const swatch = createTag('span', { class: 'icc-swatch', 'aria-hidden': 'true' });
    const card = createTag('div', { class: `icc-legend-card icc-${kind}` });
    const heading = label('h3', '', strings[kind]);
    heading.prepend(swatch);
    const badge = createTag('span', { class: 'icc-badge' });
    badge.append(
      legendIcon({
        green: 'passes', blue: 'S2_Icon_AlertTriangle_20_N', dark: 'fails',
      }[kind], 16),
      label('span', '', status),
    );
    heading.append(badge);
    card.append(heading);
    const rows = createTag('div', { class: 'icc-legend-labels' });
    if (kind === 'dark') {
      rows.append(label('p', '', strings.darkDescription), label('p', '', strings.darkSize));
    } else {
      const large = createTag('p');
      const small = createTag('p');
      const largeTrigger = help(strings.largeText, strings.largeTextHelp);
      const smallTrigger = help(strings.smallText, strings.smallTextHelp);
      const largeValue = strings[`${kind}Large`].replace(/>=/g, '\u2265');
      const smallValue = strings[`${kind}Small`].replace(/>=/g, '\u2265');
      // dir=auto keeps "≥ 4.5:1 (AAA)" from being mirrored inside RTL pages.
      const largeLabel = label('span', '', largeValue);
      const smallLabel = label('span', '', smallValue);
      largeLabel.dir = 'auto';
      smallLabel.dir = 'auto';
      large.append(largeTrigger, largeLabel);
      small.append(smallTrigger, smallLabel);
      rows.append(large, small);
    }
    card.append(rows);
    cards.append(card);
    if (kind !== 'dark') {
      cards.append(createTag('span', { class: 'icc-legend-divider', 'aria-hidden': 'true' }));
    }
    const miniItem = createTag('span', {
      class: `icc-mini-item icc-${kind}`, role: 'group', 'aria-label': strings[kind],
    });
    miniItem.append(swatch.cloneNode(true), label('span', 'icc-badge', status));
    miniItems.append(miniItem);
  });
  fullLegend.append(cards);
  miniLegend.append(miniItems);
  const accuracy = createTag('div', { class: 'icc-accuracy' });
  const accuracyCopy = createTag('div', { class: 'icc-accuracy-copy' });
  accuracyCopy.append(...content.accuracy.childNodes);
  accuracy.append(legendIcon('info', 20), accuracyCopy);
  aside.append(fullLegend, accuracy);
  panel.append(main, aside, miniLegend);
  const dialog = createTag('dialog', {
    class: 'color-image-contrast-checker icc-dialog', 'aria-label': strings.comparison,
  });
  return {
    panel,
    controls,
    left,
    right,
    color,
    selector,
    replace,
    save,
    expand,
    expandIcon: expand.firstElementChild,
    minimizeIcon,
    comparisonRow,
    comparison,
    zoom,
    fit,
    fill,
    footer,
    canvas,
    original,
    dialog,
    tips,
  };
}

export default async function decorate(block) {
  instances.get(block)?.();
  const authoredRows = [...block.children].map((row) => row.cloneNode(true));
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const id = `icc-${nextId += 1}`;
  let content;
  let background;
  let view;
  let renderer;
  let source;
  let dropzone;
  let loadingOverlay;
  let detachDrag;
  let resizeObserver;
  let resizeFrame;
  let request;
  let generation = 0;
  // Image transactions remain independent of color-space and export generations.
  let imageGeneration = 0;
  const sampleButtons = [];
  const selectSample = (selected = null) => {
    sampleButtons.forEach((sample) => {
      const active = sample === selected;
      sample.classList.toggle('is-selected', active);
      sample.setAttribute('aria-pressed', String(active));
    });
  };
  let destroyed = false;
  let ready = false;
  let mode = 'fit';
  let colorSpace = 'srgb';
  let strings;
  const tooltips = [];
  const tooltipTargets = new Map();
  const downloads = new Map();
  const media = window.matchMedia('(min-width: 700px)');
  let uploadStrings = IMAGE_UPLOAD_DEFAULTS;
  const report = async (error, message) => {
    window.lana?.log(`Image contrast: ${error.message}`, {
      tags: 'color-image-contrast-checker', severity: 'error',
    });
    const { showExpressToast } = await import('../../scripts/color-shared/spectrum/components/express-toast.js');
    showExpressToast({ message, variant: 'negative' });
  };
  const syncLoadingOverlay = () => {
    if (!loadingOverlay || destroyed) return;
    const active = block.classList.contains('is-loading');
    const parent = active && view.dialog.open ? view.dialog : document.body;
    if (loadingOverlay.parentElement !== parent) parent.append(loadingOverlay);
    loadingOverlay.classList.toggle('is-loading', active);
    // Freeze the document behind either transition without moving its scroll position.
    setPageScrollLock(block, active || view.dialog.open);
  };
  const busy = (value) => {
    block.classList.toggle('is-loading', value);
    block.setAttribute('aria-busy', String(value));
    syncLoadingOverlay();
    if (view) {
      view.comparisonRow.classList.remove('is-recalculating');
      if (value && view.dialog.open
        && (document.activeElement === view.save
          || view.selector.element.contains(document.activeElement))) {
        view.comparison.focus({ preventScroll: true });
      }
      view.save.disabled = value || !ready;
      view.selector.setDisabled(value);
    }
  };
  const resize = () => {
    if (!source || !view) return;
    const { comparisonRow, comparison, zoom } = view;
    comparisonRow.classList.toggle('is-fill', mode === 'fill');
    comparisonRow.style.removeProperty('block-size');
    comparisonRow.style.removeProperty('padding-inline-start');
    comparison.style.removeProperty('padding-inline-start');
    const surfaceStyle = getComputedStyle(comparisonRow);
    const gap = parseFloat(getComputedStyle(comparison).columnGap) || 0;
    // Measure against the scroller's border box so fill-mode scrollbars never feed back.
    const measure = () => {
      const width = (comparison.offsetWidth - gap) / 2;
      const height = comparison.offsetHeight;
      // Fit: whole image visible. Fill: cover the pane and zoom at least 150% of Fit
      // (Figma "Zoomed in toggle"), so Fill always magnifies even when Fit already covers.
      const fit = Math.min(width / source.width, height / source.height);
      const scale = mode === 'fit'
        ? fit
        : Math.max(width / source.width, height / source.height, FILL_OVER_FIT * fit);
      return { width, height, scale };
    };
    // Desktop minimized: hug the fitted image height, capped by the authored aspect ratio.
    const hug = () => {
      if (surfaceStyle.getPropertyValue('--icc-hug-height').trim() !== '1') return;
      const [ratioWidth, ratioHeight] = surfaceStyle.aspectRatio.split('/').map(parseFloat);
      const rowWidth = comparisonRow.getBoundingClientRect().width;
      const chrome = parseFloat(surfaceStyle.paddingTop) + parseFloat(surfaceStyle.paddingBottom);
      const hugHeight = measure().width * (source.height / source.width) + chrome;
      // Never shorter than the zoom toolbar plus its inset, so it stays inside the row.
      const toolbarFloor = zoom.offsetHeight + 2 * zoom.offsetTop;
      const capped = Math.min(hugHeight, rowWidth * (ratioHeight / ratioWidth));
      comparisonRow.style.blockSize = `${Math.max(capped, toolbarFloor)}px`;
    };
    hug();
    let { width, height, scale } = measure();
    if (!width || height <= 0) return;
    const toolbar = zoom.getBoundingClientRect();
    // Inline-start gutter beside the toolbar, measured from the row's start edge either way.
    const toolbarGutter = () => {
      const toolbarGap = parseFloat(surfaceStyle.getPropertyValue('--spacing-100'));
      const row = comparisonRow.getBoundingClientRect();
      const rtl = surfaceStyle.direction === 'rtl';
      return (rtl ? row.right - toolbar.left : toolbar.right - row.left) + toolbarGap;
    };
    const reserveGutter = (target) => {
      target.style.paddingInlineStart = `${toolbarGutter()}px`;
      hug();
      ({ width, height, scale } = measure());
    };
    if (mode === 'fit') {
      // The pair is centered; only when it would sit under the toolbar does it get a
      // start gutter beside the toolbar (narrower than the toolbar is tall).
      const frame = comparison.getBoundingClientRect();
      const pairWidth = 2 * source.width * scale + gap;
      const imageLeft = frame.left + (frame.width - pairWidth) / 2;
      const imageTop = frame.top + (height - source.height * scale) / 2;
      if (imageLeft < toolbar.right && imageLeft + pairWidth > toolbar.left
        && imageTop < toolbar.bottom && imageTop + source.height * scale > toolbar.top) {
        reserveGutter(comparisonRow);
      }
    } else {
      // Fill: the gutter is scroller padding, so the initial view clears the toolbar while
      // scrolling still carries the images under it to the surface's start edge.
      reserveGutter(comparison);
    }
    // Floor so fitted images never overflow the shared scroller by a sub-pixel.
    view.panel.style.setProperty('--icc-image-width', `${Math.floor(source.width * scale)}px`);
    view.panel.style.setProperty('--icc-image-height', `${Math.floor(source.height * scale)}px`);
  };
  const scheduleResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  };
  const arrange = () => {
    if (!view) return;
    const active = document.activeElement;
    if (media.matches) {
      view.left.append(view.color, view.replace);
      view.right.append(view.save, view.expand);
    } else {
      view.left.append(view.replace);
      view.right.append(view.expand);
      view.controls.after(view.color);
      view.footer.append(view.save);
    }
    if (active && active !== document.body && view.panel.contains(active)) active.focus();
    resize();
  };
  const announceReady = () => {
    block.dispatchEvent(new CustomEvent('color-image-contrast-checker:ready', {
      bubbles: true, detail: { width: source.width, height: source.height, colorSpace },
    }));
  };
  const analyze = (announce = true) => {
    ready = false;
    view.save.disabled = true;
    renderer.render(source, colorSpace);
    ready = true;
    view.selector.setValue(colorSpace);
    view.save.disabled = block.classList.contains('is-loading');
    resize();
    if (announce) announceReady();
  };
  const close = () => {
    if (!view?.dialog.open) return;
    view.selector.close();
    view.dialog.close();
    block.append(view.panel);
    syncLoadingOverlay();
    if (destroyed) return;
    tooltips.forEach((tip) => tip.hide());
    view.expand.firstElementChild.replaceWith(view.expandIcon);
    view.expand.setAttribute('aria-label', strings.expand);
    tooltipTargets.get(view.expand)?.setContent(strings.expand);
    view.expand.focus();
    arrange();
  };
  const landing = () => {
    view?.selector.close();
    generation += 1;
    imageGeneration += 1;
    request?.abort();
    selectSample();
    close();
    block.classList.remove('has-image');
    content.headline.hidden = false;
    content.headline.inert = false;
    background.hidden = false;
    source?.destroy();
    source = null;
    ready = false;
    dropzone.container.classList.remove('has-image');
    busy(false);
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    setPageScrollLock(block, false);
    generation += 1;
    imageGeneration += 1;
    request?.abort();
    selectSample();
    sampleButtons.length = 0;
    lifecycle.abort();
    view?.selector.destroy();
    tooltips.forEach((tip) => tip.destroy());
    close();
    detachDrag?.();
    resizeObserver?.disconnect();
    cancelAnimationFrame(resizeFrame);
    downloads.forEach((timer, url) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    });
    downloads.clear();
    tooltipTargets.clear();
    source?.destroy();
    renderer?.destroy();
    view?.dialog.remove();
    background?.remove();
    if (view) block.replaceChildren(...authoredRows);
    block.classList.remove('has-image', 'is-loading', 'is-dragging');
    block.removeAttribute('aria-busy');
    if (content) {
      content.headline.hidden = false;
      content.headline.inert = false;
    }
    instances.delete(block);
  };
  instances.set(block, destroy);
  block.addEventListener('color-image-contrast-checker:destroy', destroy, { signal });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) destroy();
  }, { signal });
  try {
    uploadStrings = await loadColorImageContrastUploadPlaceholders();
    if (destroyed) return;
    content = parseContent(block);
    strings = await loadColorImageContrastCheckerPlaceholders();
    if (destroyed) return;
    const { loadStyle } = await import(`${getLibs()}/utils/utils.js`);
    await Promise.all([
      '../../scripts/color-shared/components/image-upload/image-upload.css',
      '../../scripts/color-shared/components/image-extract/buildExtractOverlays.css',
      '../../scripts/color-shared/action-menu.css',
    ].map((path) => loadStyle(new URL(path, import.meta.url).href)));
    if (destroyed) return;
    view = createView(content, strings, id, async (value) => {
      generation += 1;
      const version = generation;
      const current = () => !destroyed && version === generation;
      colorSpace = value;
      ready = false;
      view.save.disabled = true;
      // Figma: overlay fades in, holds while the new space is applied, then fades out.
      view.comparisonRow.classList.add('is-recalculating');
      await wait(RECALC_FADE_MS);
      if (!current()) return;
      try {
        analyze();
      } catch (error) {
        view.comparisonRow.classList.remove('is-recalculating');
        await report(error, strings.analysisError);
        return;
      }
      await wait(RECALC_HOLD_MS);
      if (!current()) return;
      view.comparisonRow.classList.remove('is-recalculating');
      await wait(RECALC_FADE_MS);
      if (!current() || !strings.colorSpaceUpdated) return;
      const { showExpressToast } = await import('../../scripts/color-shared/spectrum/components/express-toast.js');
      if (!current()) return;
      showExpressToast({
        message: strings.colorSpaceUpdated.replace('{colorSpace}', colorSpaceLabel(strings, colorSpace)),
        variant: 'positive',
      });
    });
    const upload = createTag('div', { class: 'icc-upload', role: 'region', 'aria-label': strings.landingAria });
    background = createTag('div', {
      class: 'color-image-contrast-checker-background', 'aria-hidden': 'true',
    });
    if (content.background) background.append(...content.background.childNodes);
    const load = async (file, selectedSample = null) => {
      if (destroyed) return;
      generation += 1;
      imageGeneration += 1;
      const version = imageGeneration;
      request?.abort();
      busy(true);
      let candidate;
      try {
        // Let the interstitial paint before synchronous profile/GPU work.
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
        if (destroyed || imageGeneration !== version) return;
        if (!renderer) renderer = createRenderer(view.canvas);
        candidate = await decodeImage(file, renderer.maxTextureSize);
        if (destroyed || imageGeneration !== version) {
          candidate.destroy();
          return;
        }
        if (candidate.colorSpace === 'adobe-rgb' && !strings.adobeRgb) {
          candidate.destroy();
          throw new Error('Missing image contrast placeholders: color-image-contrast-checker-adobe-rgb');
        }
        const previous = source;
        const previousSpace = colorSpace;
        source = candidate;
        colorSpace = candidate.colorSpace;
        try {
          analyze(false);
        } catch (error) {
          source = previous;
          colorSpace = previousSpace;
          ready = false;
          view.save.disabled = true;
          candidate.destroy();
          throw error;
        }
        previous?.destroy();
        view.original.src = source.url;
        selectSample(selectedSample);
        block.classList.add('has-image');
        content.headline.hidden = true;
        content.headline.inert = true;
        background.hidden = true;
        if (window.history.state?.[HISTORY_KEY] !== id) {
          window.history.pushState({ ...window.history.state, [HISTORY_KEY]: id }, '');
        }
        arrange();
        announceReady();
      } catch (error) {
        if (!destroyed && version === imageGeneration) {
          await report(error, strings[error.message] || uploadStrings.loadError);
        }
      } finally {
        if (!destroyed && version === imageGeneration) busy(false);
      }
    };
    dropzone = createUploadDropzone({
      strings: uploadStrings, loadingText: strings.analyzingImage, onFileSelected: load,
    });
    upload.append(dropzone.container);
    if (content.samples) {
      const suggestions = createTag('div', { class: 'icc-suggestions' });
      suggestions.append(label('p', '', strings.noImageTryOurs));
      const samples = createTag('div', { class: 'icc-sample-list' });
      [...content.samples.querySelectorAll('picture')].forEach((picture) => {
        const image = picture.querySelector('img');
        const anchor = picture.closest('a[href]');
        const src = anchor?.href || getPictureSource(picture);
        if (!image || !src) throw new Error('Sample requires an authored image source');
        const url = new URL(src, document.baseURI);
        if (!anchor && /\/media_[^/]+$/.test(url.pathname)) {
          ['width', 'height', 'format', 'optimize', 'fit'].forEach((key) => url.searchParams.delete(key));
        }
        const description = image.alt.trim();
        const sample = button(description
          ? `${strings.useThisImage}: ${description}` : strings.useThisImage);
        sample.classList.add('icc-sample');
        sample.setAttribute('aria-pressed', 'false');
        sampleButtons.push(sample);
        const preview = picture.cloneNode(true);
        const previewImage = preview.querySelector('img');
        previewImage.alt = description;
        previewImage.draggable = false;
        sample.replaceChildren(preview);
        sample.addEventListener('click', async () => {
          request?.abort();
          generation += 1;
          imageGeneration += 1;
          const version = imageGeneration;
          busy(true);
          const controller = new AbortController();
          request = controller;
          try {
            const response = await fetch(url.href, { signal: controller.signal });
            if (!response.ok) throw new Error(`Sample HTTP ${response.status}`);
            const blob = await response.blob();
            if (!destroyed && !controller.signal.aborted && imageGeneration === version) {
              await load(new File([blob], url.pathname.split('/').pop(), { type: blob.type }), sample);
            }
          } catch (error) {
            if (!controller.signal.aborted && !destroyed && imageGeneration === version) {
              await report(error, uploadStrings.loadError);
            }
          } finally {
            if (!destroyed && imageGeneration === version) busy(false);
          }
        }, { signal });
        samples.append(sample);
      });
      suggestions.append(samples);
      upload.append(suggestions);
    }
    const dragOverlay = buildDragOverlay(strings);
    loadingOverlay = buildLoadingOverlay({ uploadingImage: strings.analyzingImage });
    [dragOverlay, loadingOverlay].forEach((overlay) => overlay.classList.add('icc-overlay'));
    document.body.append(dragOverlay, loadingOverlay);
    block.replaceChildren(upload, view.panel, view.dialog);
    block.closest('.section').prepend(background);
    detachDrag = attachImageDragHandlers(block, dropzone, dragOverlay, loadingOverlay, destroy);
    arrange();
    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(view.panel);
    resizeObserver.observe(view.comparisonRow);
    resizeObserver.observe(view.comparison);
    media.addEventListener('change', arrange, { signal });
    window.addEventListener('resize', scheduleResize, { signal });
    window.visualViewport?.addEventListener('resize', scheduleResize, { signal });
    window.addEventListener('popstate', () => {
      if (window.history.state?.[HISTORY_KEY] !== id) landing();
    }, { signal });
    view.panel.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'replace') dropzone.input.click();
      if (action === 'expand') {
        if (view.dialog.open) close();
        else {
          view.selector.close();
          view.dialog.append(view.panel);
          tooltips.forEach((tip) => tip.hide());
          view.expand.firstElementChild.replaceWith(view.minimizeIcon);
          view.expand.setAttribute('aria-label', strings.minimize);
          tooltipTargets.get(view.expand)?.setContent(strings.minimize);
          view.dialog.showModal();
          syncLoadingOverlay();
          arrange();
          view.left.querySelector('button, [tabindex="0"]').focus();
        }
      }
      if (action === 'fit' || action === 'fill') {
        mode = action;
        [view.fit, view.fill].forEach((control) => {
          const selected = control.dataset.action === mode;
          control.setAttribute('aria-pressed', String(selected));
          control.tabIndex = selected ? 0 : -1;
        });
        resize();
        if (mode === 'fit') view.comparison.scrollTo(0, 0);
      }
      if (action === 'save' && ready && !view.save.disabled) {
        try {
          const version = generation;
          const filename = 'image-contrast-analysis.png';
          const { width, height } = view.canvas;
          // Side-by-side doubles the width; stay within the strictest browser canvas
          // limits (iOS Safari: 16,777,216 px area; 16,384 px per side).
          const fit = Math.min(
            1,
            Math.sqrt(EXPORT_MAX_AREA / (2 * width * height)),
            EXPORT_MAX_SIDE / (2 * width),
            EXPORT_MAX_SIDE / height,
          );
          const pane = Math.floor(width * fit);
          const paneHeight = Math.floor(height * fit);
          const output = createTag('canvas', { width: pane * 2, height: paneHeight });
          const context = output.getContext('2d');
          if (!context) throw new Error('saveError');
          context.drawImage(view.canvas, 0, 0, pane, paneHeight);
          context.drawImage(view.original, pane, 0, pane, paneHeight);
          const blob = await new Promise((resolve) => {
            output.toBlob(resolve, 'image/png');
          });
          if (destroyed || version !== generation) return;
          if (!blob) throw new Error('saveError');
          const url = URL.createObjectURL(blob);
          const anchor = createTag('a', { href: url, download: filename });
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          downloads.set(url, setTimeout(() => {
            URL.revokeObjectURL(url);
            downloads.delete(url);
          }, 1000));
          const { showExpressToast } = await import('../../scripts/color-shared/spectrum/components/express-toast.js');
          if (!destroyed && version === generation) {
            showExpressToast({ message: strings.saved, variant: 'positive' });
          }
        } catch (error) {
          await report(error, strings.saveError);
        }
      }
    }, { signal });
    view.zoom.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        let target = document.activeElement === view.fit ? view.fill : view.fit;
        if (event.key === 'Home') target = view.fit;
        if (event.key === 'End') target = view.fill;
        target.click();
        target.focus();
      }
    }, { signal });
    view.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    view.dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (view.selector.isOpen) {
          event.preventDefault();
          event.stopPropagation();
          view.selector.close(true);
          return;
        }
        const open = tooltips.filter((tip) => tip.element.querySelector('sp-tooltip[open]'));
        if (open.length) {
          event.preventDefault();
          event.stopPropagation();
          open.forEach((tip) => tip.hide());
        }
      }
      if (event.key === 'Tab') {
        if (view.selector.isOpen) view.selector.close(true);
        const controls = [...view.panel.querySelectorAll('button, select, [tabindex="0"]')]
          .filter((control) => !control.disabled && control.tabIndex >= 0
            && control.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }, { capture: true, signal });
    view.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      generation += 1;
      imageGeneration += 1;
      request?.abort();
      ready = false;
      busy(false);
      report(new Error('WebGL context lost'), strings.analysisError);
    }, { signal });
    view.canvas.addEventListener('webglcontextrestored', async () => {
      try {
        // The browser has invalidated the previous renderer's GPU objects.
        renderer = createRenderer(view.canvas);
        if (source) analyze();
      } catch (error) {
        await report(error, strings.analysisError);
      }
    }, { signal });
    await Promise.all(view.tips.map(async ({ target, content: description }) => {
      const tip = await createExpressTooltip({
        targetEl: target,
        content: description,
        placement: 'top',
        dismissOnActivate: !target.classList.contains('icc-help'),
      });
      if (destroyed) tip.destroy();
      else {
        tooltips.push(tip);
        tooltipTargets.set(target, tip);
        view.panel.append(tip.element);
      }
    }));
    if (!destroyed) {
      block.dataset.blockStatus = 'loaded';
      busy(false);
      trackColorBlockLoad('color-image-contrast-checker');
    }
  } catch (error) {
    destroy();
    block.dataset.blockStatus = 'failed';
    await report(error, uploadStrings.loadError);
  }
}
