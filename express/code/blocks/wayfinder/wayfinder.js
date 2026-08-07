import { getMetadata } from '../../scripts/utils.js';

// Bulk/spreadsheet-provided metadata values can resolve to malformed hrefs
// (e.g. a scheme-less value gets treated as relative and mangled). Validate
// before trusting it, same guard as blog-posts-v2's getSafeHrefFromText.
function getSafeHref(value) {
  const trimmed = value && value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (error) {
    window.lana?.log(`Failed to resolve wayfinder CTA href: ${error}`, { tags: 'wayfinder', severity: 'error' });
    return null;
  }
  return null;
}

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

  if (el.classList.contains('spreadsheet-powered')) {
    rows[1].querySelectorAll('a').forEach((a) => {
      const safeHref = getSafeHref(a.getAttribute('href'));
      if (safeHref) {
        a.href = safeHref;
      } else {
        a.removeAttribute('href');
      }
    });
  }
}
