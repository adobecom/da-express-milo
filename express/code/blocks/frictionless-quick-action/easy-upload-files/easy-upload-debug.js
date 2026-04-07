const DEBUG_QR_PLACEHOLDER_SRC = '/express/code/blocks/frictionless-quick-action/easy-upload-files/placeholder.png';
const DEBUG_LOADER_PREVIEW_SRC = '/express/code/blocks/frictionless-quick-action/easy-upload-files/dummy.png';
const DEBUG_LOADER_INDICATOR_SRC = '/express/code/blocks/frictionless-quick-action/easy-upload-files/progress.png';
const DEBUG_TOOLTIP_TIMEOUT = 4000;
const DEFAULT_PENDING_MESSAGE = 'Wait for a few more seconds for mobile upload to complete.';
const DEFAULT_FAILED_MESSAGE = 'Invalid file, try uploading another file.';

export const DEBUG_MODES = {
  NONE: 'none',
  PLACEHOLDER: 'placeholder',
  LOADER: 'loader',
  AUTOFAIL: 'autofail',
  UPLOADING: 'uploading',
};

export const PLACEHOLDER_DEBUG_MODES = new Set([
  DEBUG_MODES.PLACEHOLDER,
  DEBUG_MODES.AUTOFAIL,
  DEBUG_MODES.UPLOADING,
]);

export function getDebugMode(block) {
  const classes = block?.classList;
  if (!classes) {
    return DEBUG_MODES.NONE;
  }
  const hasClass = (name) => classes.contains(name)
    || classes.contains(`frictionless-quick-action--${name}`);
  if (hasClass('debug-autofail')) return DEBUG_MODES.AUTOFAIL;
  if (hasClass('debug-uploading')) return DEBUG_MODES.UPLOADING;
  if (hasClass('debug-loading')) return DEBUG_MODES.LOADER;
  if (hasClass('debug')) return DEBUG_MODES.PLACEHOLDER;
  return DEBUG_MODES.NONE;
}

function disableConfirmButton(confirmButton) {
  if (!confirmButton) return;
  confirmButton.classList.add('disabled');
  confirmButton.setAttribute('aria-disabled', 'true');
  confirmButton.style.pointerEvents = 'none';
}

function enableDebugConfirmButton(confirmButton) {
  confirmButton.classList.remove('disabled');
  confirmButton.removeAttribute('aria-disabled');
  confirmButton.removeAttribute('disabled');
  confirmButton.style.pointerEvents = 'auto';
}

function renderDebugQrPaneState(qrPane, createTag) {
  qrPane.dataset.qrInitialized = 'debug';
  const qrWidgetContainer = qrPane.querySelector('.qr-code-widget-container');
  if (qrWidgetContainer) {
    let placeholderWrapper = qrWidgetContainer.querySelector('.qr-code-container');
    if (!placeholderWrapper) {
      placeholderWrapper = createTag('div', { class: 'qr-code-container debug-placeholder' });
      qrWidgetContainer.append(placeholderWrapper);
    } else {
      placeholderWrapper.innerHTML = '';
      placeholderWrapper.classList.add('debug-placeholder');
    }
    const placeholderImage = createTag('img', {
      src: DEBUG_QR_PLACEHOLDER_SRC,
      alt: 'Placeholder QR code',
      loading: 'lazy',
    });
    placeholderWrapper.append(placeholderImage);
  }

  const confirmButton = qrPane.querySelector('.confirm-import-button');
  if (confirmButton) {
    enableDebugConfirmButton(confirmButton);
  }
  return confirmButton;
}

export function renderDebugLoaderPaneState({ qrPane, createTag }) {
  qrPane.dataset.qrInitialized = 'debug-loading';
  const qrWidgetContainer = qrPane.querySelector('.qr-code-widget-container');
  if (qrWidgetContainer) {
    qrWidgetContainer.innerHTML = '';
    const loaderContainer = createTag('div', { class: 'qr-code-loader debug-loader' });
    const loaderContent = createTag('div', { class: 'qr-code-loader-content' });
    const preview = createTag('img', {
      class: 'qr-code-loader-preview',
      src: DEBUG_LOADER_PREVIEW_SRC,
      alt: '',
      loading: 'lazy',
    });
    const indicator = createTag('img', {
      class: 'qr-code-loader-indicator',
      src: DEBUG_LOADER_INDICATOR_SRC,
      alt: 'Loading',
      loading: 'lazy',
    });
    loaderContent.append(preview, indicator);
    loaderContainer.append(loaderContent);
    qrWidgetContainer.append(loaderContainer);
  }

  const confirmButton = qrPane.querySelector('.confirm-import-button');
  if (confirmButton) {
    disableConfirmButton(confirmButton);
  }
}

function attachDebugConfirmHandler(confirmButton, handlerId, handler) {
  if (!confirmButton) {
    return;
  }
  if (confirmButton.dataset.debugConfirmHandler === handlerId) {
    return;
  }
  confirmButton.dataset.debugConfirmHandler = handlerId;
  confirmButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler?.(event);
  });
}

function showDebugTooltipMessage(confirmButton, message) {
  if (!confirmButton || !message) {
    return false;
  }
  const tooltipElement = confirmButton.closest('.tooltip')?.querySelector('.tooltip-text');
  if (!tooltipElement) {
    return false;
  }
  tooltipElement.textContent = message;
  tooltipElement.classList.remove('hidden');
  tooltipElement.classList.add('hover');
  clearTimeout(confirmButton.debugTooltipTimeout);
  confirmButton.debugTooltipTimeout = setTimeout(() => {
    tooltipElement.classList.remove('hover');
    confirmButton.debugTooltipTimeout = null;
  }, DEBUG_TOOLTIP_TIMEOUT);
  return true;
}

export function renderDebugPlaceholderVariant({ qrPane, createTag }) {
  const confirmButton = renderDebugQrPaneState(qrPane, createTag);
  attachDebugConfirmHandler(confirmButton, 'debug-placeholder', () => {});
}

export function renderDebugPendingUploadVariant({
  qrPane,
  createTag,
  showErrorToast,
  block,
  paneContent,
}) {
  const confirmButton = renderDebugQrPaneState(qrPane, createTag);
  attachDebugConfirmHandler(confirmButton, 'debug-uploading', () => {
    const message = paneContent?.primary?.tooltipText || DEFAULT_PENDING_MESSAGE;
    if (!showDebugTooltipMessage(confirmButton, message)) {
      showErrorToast?.(block, message);
    }
  });
}

export function renderDebugAutofailVariant({
  qrPane,
  createTag,
  showErrorToast,
  block,
  paneContent,
}) {
  const confirmButton = renderDebugQrPaneState(qrPane, createTag);
  attachDebugConfirmHandler(confirmButton, 'debug-autofail', () => {
    const message = paneContent?.primary?.errorText || DEFAULT_FAILED_MESSAGE;
    showDebugTooltipMessage(confirmButton, message);
    showErrorToast?.(block, message);
  });
}
