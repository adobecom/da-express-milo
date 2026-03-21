import { createTag } from '../../../scripts/utils.js';
import { MARKER } from './constants.js';

/**
 * Creates a magnified lens that shows an 8x zoomed view of the image
 * near the active marker while dragging.
 *
 * @param {HTMLCanvasElement} canvas - The extraction canvas
 * @returns {{ element: HTMLElement, show: Function, move: Function, hide: Function }}
 */
export function createZoomLens(canvas) {
  const size = MARKER.ZOOM_SIZE;
  const scale = MARKER.ZOOM_SCALE;
  const sampleRadius = Math.floor(size / scale / 2);

  const lens = createTag('div', {
    class: 'color-extract-zoom',
    'aria-hidden': 'true',
  });

  const lensCanvas = document.createElement('canvas');
  lensCanvas.width = size;
  lensCanvas.height = size;
  lens.append(lensCanvas);

  const lensCtx = lensCanvas.getContext('2d');

  function drawZoom(cx, cy) {
    lensCtx.clearRect(0, 0, size, size);
    lensCtx.imageSmoothingEnabled = false;

    const sx = Math.max(0, Math.round(cx) - sampleRadius);
    const sy = Math.max(0, Math.round(cy) - sampleRadius);
    const sw = Math.min(sampleRadius * 2, canvas.width - sx);
    const sh = Math.min(sampleRadius * 2, canvas.height - sy);

    if (sw > 0 && sh > 0) {
      lensCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, size, size);
    }

    lensCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    lensCtx.lineWidth = 1;
    lensCtx.beginPath();
    lensCtx.moveTo(size / 2, 0);
    lensCtx.lineTo(size / 2, size);
    lensCtx.moveTo(0, size / 2);
    lensCtx.lineTo(size, size / 2);
    lensCtx.stroke();
  }

  function positionLens(markerEl) {
    const markerRect = markerEl.getBoundingClientRect();
    const parentRect = markerEl.closest('.color-extract-markers')?.getBoundingClientRect();
    if (!parentRect) return;

    const markerCenterX = markerRect.left - parentRect.left + markerRect.width / 2;
    const markerCenterY = markerRect.top - parentRect.top + markerRect.height / 2;

    let lensX = markerCenterX - size / 2;
    let lensY = markerCenterY - size - MARKER.ACTIVE_DIAMETER - 8;

    if (lensY < 0) {
      lensY = markerCenterY + MARKER.ACTIVE_DIAMETER + 8;
    }
    lensX = Math.max(0, Math.min(lensX, parentRect.width - size));

    lens.style.left = `${lensX}px`;
    lens.style.top = `${lensY}px`;
  }

  return {
    element: lens,
    show(markerEl, cx, cy) {
      drawZoom(cx, cy);
      positionLens(markerEl);
      lens.hidden = false;
    },
    move(markerEl, cx, cy) {
      drawZoom(cx, cy);
      positionLens(markerEl);
    },
    hide() {
      lens.hidden = true;
    },
  };
}
