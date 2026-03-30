let maskCounter = 0;

export function createOverlayMask(targetEls, containerEl) {
  const targets = Array.isArray(targetEls) ? targetEls : [targetEls];
  const validTargets = targets.filter(Boolean);

  if (!validTargets.length || !containerEl) return null;

  const containerRect = containerEl.getBoundingClientRect();
  const padding = 4;

  maskCounter += 1;
  const maskId = `cc-region-mask-${maskCounter}`;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('cc-preview-overlay');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'position: absolute; inset: 0; pointer-events: none; z-index: 10;';

  const defs = document.createElementNS(svgNS, 'defs');
  const mask = document.createElementNS(svgNS, 'mask');
  mask.setAttribute('id', maskId);

  const whiteRect = document.createElementNS(svgNS, 'rect');
  whiteRect.setAttribute('width', '100%');
  whiteRect.setAttribute('height', '100%');
  whiteRect.setAttribute('fill', 'white');
  mask.appendChild(whiteRect);

  validTargets.forEach((targetEl) => {
    const targetRect = targetEl.getBoundingClientRect();
    const x = targetRect.left - containerRect.left - padding;
    const y = targetRect.top - containerRect.top - padding;
    const width = targetRect.width + padding * 2;
    const height = targetRect.height + padding * 2;

    const cutout = document.createElementNS(svgNS, 'rect');
    cutout.setAttribute('x', Math.max(0, x));
    cutout.setAttribute('y', Math.max(0, y));
    cutout.setAttribute('width', width);
    cutout.setAttribute('height', height);
    cutout.setAttribute('rx', '4');
    cutout.setAttribute('fill', 'black');
    mask.appendChild(cutout);
  });

  defs.appendChild(mask);
  svg.appendChild(defs);

  const scrimRect = document.createElementNS(svgNS, 'rect');
  scrimRect.setAttribute('width', '100%');
  scrimRect.setAttribute('height', '100%');
  scrimRect.setAttribute('fill', 'var(--cc-preview-overlay-scrim, rgba(0, 0, 0, 0.5))');
  scrimRect.setAttribute('mask', `url(#${maskId})`);
  svg.appendChild(scrimRect);

  return svg;
}

export function removeOverlay(containerEl) {
  const existing = containerEl?.querySelector('.cc-preview-overlay');
  if (existing) existing.remove();
}
