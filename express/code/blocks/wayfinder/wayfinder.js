export default function decorate(el) {
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
