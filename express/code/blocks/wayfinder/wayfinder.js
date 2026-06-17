import { getMetadata } from '../../scripts/utils.js';

export default function decorate(el) {
  // metadata-triggered variant: only decorate when the page opts in via the
  // 'enable-wayfinder-promo' metadata; otherwise remove the block entirely.
  if (el.classList.contains('metadata-triggered')) {
    const enabled = ['yes', 'y', 'on', 'true']
      .includes(getMetadata('enable-wayfinder-promo')?.toLowerCase().trim());
    if (!enabled) {
      el.remove();
      return;
    }
  }

  const rows = el.querySelectorAll(':scope > div');
  const firstRowContent = rows[0].textContent.trim();

  const lastRow = rows[rows.length - 1];
  const bgValue = lastRow?.textContent.trim();
  const bgPattern = /^(linear-gradient\(|radial-gradient\(|#[0-9a-fA-F]{3,8}$|rgb\(|rgba\(|hsl\(|hsla\()/;
  if (bgValue && bgPattern.test(bgValue) && !lastRow.querySelector('a')) {
    if (bgValue.startsWith('linear-gradient') || bgValue.startsWith('radial-gradient')) {
      el.style.background = bgValue;
    } else {
      el.style.backgroundColor = bgValue;
    }
    lastRow.remove();
  }

  rows[0].classList.add('text-row');
  rows[1].classList.add('cta-row');
  rows[1].setAttribute('role', 'group');
  rows[1].setAttribute('aria-label', firstRowContent);
  rows[1].querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    a.setAttribute('role', 'button');
  });
}
