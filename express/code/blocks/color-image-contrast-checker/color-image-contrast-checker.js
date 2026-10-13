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

const instances = new WeakMap();
let nextId = 0;
const HISTORY_KEY = 'colorImageContrastChecker';

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

function createView(content, strings, id) {
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
  const select = createTag('select', { 'aria-labelledby': colorHelp.id });
  select.append(
    label('option', '', strings.srgb, { value: 'srgb' }),
    label('option', '', strings.p3, { value: 'display-p3' }),
  );
  if (strings.adobeRgb) select.append(label('option', '', strings.adobeRgb, { value: 'adobe-rgb' }));
  color.append(colorHelp, select);
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
  comparisonRow.append(zoom, comparison);
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
      large.append(largeTrigger, label('span', '', largeValue));
      small.append(smallTrigger, label('span', '', smallValue));
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
    select,
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
    analysisFrame,
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
  let sourceName;
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
  };
  const busy = (value) => {
    block.classList.toggle('is-loading', value);
    block.setAttribute('aria-busy', String(value));
    syncLoadingOverlay();
    if (view) {
      if (value && view.dialog.open
        && [view.save, view.select].includes(document.activeElement)) {
        view.comparison.focus({ preventScroll: true });
      }
      view.save.disabled = value || !ready;
      view.select.disabled = value;
    }
  };
  const resize = () => {
    if (!source || !view) return;
    const { comparisonRow, analysisFrame, zoom } = view;
    const surfaceStyle = getComputedStyle(comparisonRow);
    const basePadding = parseFloat(surfaceStyle.getPropertyValue('--icc-comparison-padding-block'));
    const extraPadding = parseFloat(surfaceStyle.paddingTop) - basePadding;
    const frame = analysisFrame.getBoundingClientRect();
    const toolbar = zoom.getBoundingClientRect();
    const width = analysisFrame.clientWidth;
    const fullHeight = analysisFrame.clientHeight + extraPadding;
    if (!width || fullHeight <= 0) return;
    const fullScale = (mode === 'fit' ? Math.min : Math.max)(width / source.width, fullHeight / source.height);
    const imageLeft = frame.left + Math.max(0, (width - source.width * fullScale) / 2);
    const imageTop = frame.top - extraPadding
      + Math.max(0, (fullHeight - source.height * fullScale) / 2);
    const overlaps = imageLeft < toolbar.right
      && imageLeft + Math.min(width, source.width * fullScale) > toolbar.left
      && imageTop < toolbar.bottom
      && imageTop + Math.min(fullHeight, source.height * fullScale) > toolbar.top;
    const topInset = toolbar.bottom - comparisonRow.getBoundingClientRect().top + 8;
    // Reserve vertical space only for a collision, without narrowing the images.
    if (overlaps && fullHeight - (topInset - basePadding) >= view.fit.offsetHeight) {
      comparisonRow.style.setProperty('--icc-image-top-inset', `${topInset}px`);
    } else {
      comparisonRow.style.removeProperty('--icc-image-top-inset');
    }
    const height = analysisFrame.clientHeight;
    const scale = (mode === 'fit' ? Math.min : Math.max)(width / source.width, height / source.height);
    view.panel.style.setProperty('--icc-image-width', `${source.width * scale}px`);
    view.panel.style.setProperty('--icc-image-height', `${source.height * scale}px`);
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
    view.select.value = colorSpace;
    view.save.disabled = block.classList.contains('is-loading');
    resize();
    if (announce) announceReady();
  };
  const close = () => {
    if (!view?.dialog.open) return;
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
    generation += 1;
    imageGeneration += 1;
    request?.abort();
    selectSample();
    sampleButtons.length = 0;
    lifecycle.abort();
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
    view = createView(content, strings, id);
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
        sourceName = file.name.replace(/\.[^.]+$/, '');
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
    resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    });
    resizeObserver.observe(view.analysisFrame);
    media.addEventListener('change', arrange, { signal });
    window.addEventListener('popstate', () => {
      if (window.history.state?.[HISTORY_KEY] !== id) landing();
    }, { signal });
    view.select.addEventListener('change', async () => {
      generation += 1;
      colorSpace = view.select.value;
      try {
        analyze();
      } catch (error) {
        await report(error, strings.analysisError);
      }
    }, { signal });
    view.panel.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'replace') dropzone.input.click();
      if (action === 'expand') {
        if (view.dialog.open) close();
        else {
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
      }
      if (action === 'save' && ready && !view.save.disabled) {
        try {
          const version = generation;
          const filename = `${sourceName}-contrast-${colorSpace}.png`;
          const blob = await new Promise((resolve) => {
            view.canvas.toBlob(resolve, 'image/png');
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
        const open = tooltips.filter((tip) => tip.element.querySelector('sp-tooltip[open]'));
        if (open.length) {
          event.preventDefault();
          event.stopPropagation();
          open.forEach((tip) => tip.hide());
        }
      }
      if (event.key === 'Tab') {
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
