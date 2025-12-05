import { getIconElementDeprecated } from '../utils.js';

/**
 * Icon loader using altText
 * @param {Object} el the container of the buttons to be decorated
 */

// eslint-disable-next-line import/prefer-default-export
export function decorateSocialIcons(block) {
  block.querySelectorAll(':scope a').forEach(($a) => {
    if (!$a.href) return;
    const urlObject = new URL($a.href);
    if (urlObject.hash === '#embed-video') return;
    if ($a.closest('.embed')?.dataset.blockName === 'embed') return;
    if ($a.href === $a.textContent.trim()) {
      let icon = '';
      switch (urlObject.hostname) {
        case 'www.instagram.com':
          icon = 'instagram';
          break;
        case 'www.twitter.com':
          icon = 'twitter';
          break;
        case 'www.linkedin.com':
          icon = 'linkedin';
          break;
        case 'www.youtube.com':
          icon = 'youtube';
          break;
        case 'www.tiktok.com':
          icon = 'tiktok';
          break;
        case 'www.behance.net':
          icon = 'behance_18';
          break;
        case 'www.threads.net':
          icon = 'threads_18';
          break;
        case 'www.x.com':
          icon = 'x_corp_18';
          break;
        default: {
          const secondLevelDomain = urlObject.hostname.split('.')[1];
          if (secondLevelDomain === 'pinterest') {
            icon = 'pinterest';
          } else if (secondLevelDomain === 'facebook') {
            icon = 'facebook';
          }
        }
      }
      const $parent = $a.parentElement;
      if (!icon && $parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
        icon = 'globe';
      }
      if (icon) {
        $a.textContent = '';
        const $icon = getIconElementDeprecated(icon, 22);
        $icon.classList.add('social', 'is-visible');
        $a.appendChild($icon);
        $a.classList.add('social-link');
        if ($parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
          $parent.previousElementSibling.appendChild($a);
          $parent.remove();
        } else {
          $parent.classList.add('social-links');
        }
      }
    }
  });
}
