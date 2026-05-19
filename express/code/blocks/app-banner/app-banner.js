import { getLibs, getMobileOperatingSystem, fixIcons, getIconElementDeprecated, addTempWrapperDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';

let createTag; let getConfig;
let replaceKeyArray; let appleStoreRatingScore;
let appleStoreRatingCount; let googleStoreRatingScore;
let googleStoreRatingCount;

async function buildPayload() {
  const payload = {
    userAgent: getMobileOperatingSystem(),
    ratingScore: 0,
    ratingCount: '',
  };

  if (payload.userAgent === 'iOS') {
    payload.ratingScore = appleStoreRatingScore;
    payload.ratingCount = appleStoreRatingCount;
  } else {
    payload.ratingScore = googleStoreRatingScore;
    payload.ratingCount = googleStoreRatingCount;
  }

  return payload;
}

// Returns true if a week has passed or the banner has not been closed yet
const weekPassed = () => new Date().getTime() > localStorage.getItem('app-banner-optout-exp-date');

function populateStars(count, star, parent) {
  for (let i = 0; i < count; i += 1) {
    parent.appendChild(getIconElementDeprecated(star));
  }
}

function getCurrentRatingStars(rating = 5) {
  const stars = createTag('span', { class: 'rating-stars' });
  let newRating = rating;
  if (newRating > 5) newRating = 5;
  newRating = Math.round(newRating * 10) / 10; // round nearest decimal point
  const newRatingRoundedHalf = Math.round(newRating * 2) / 2;
  const filledStars = Math.floor(newRatingRoundedHalf);
  const halfStars = (filledStars === newRatingRoundedHalf) ? 0 : 1;
  const emptyStars = (halfStars === 1) ? 4 - filledStars : 5 - filledStars;
  populateStars(filledStars, 'star', stars);
  populateStars(halfStars, 'star-half', stars);
  populateStars(emptyStars, 'star-empty', stars);
  const votes = createTag('span', { class: 'rating-votes' });
  stars.appendChild(votes);
  return stars;
}

function addCloseBtn(block) {
  const $closeBtnDiv = createTag('div', { class: 'close-btn-div' });
  const $closeBtnImg = getIconElementDeprecated('close-icon');
  $closeBtnDiv.append($closeBtnImg);
  block.append($closeBtnDiv);

  $closeBtnDiv.addEventListener('click', () => {
    const $section = block.closest('.section');
    const $background = $section.querySelector('.gradient-background');
    $section.classList.add('block-removed');
    const $floatingButton = document.querySelector('.floating-button-wrapper[data-audience="mobile"]');
    if ($floatingButton) {
      $floatingButton.classList.remove('push-up');
    }
    block.remove();
    const sevenDaysFromNow = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('app-banner-optout-exp-date', sevenDaysFromNow);

    setTimeout(() => {
      $background.remove();
    }, 600);
  });
}

function initScrollDirection(block) {
  const $section = block.closest('.section');
  const background = $section.querySelector('.gradient-background');
  let lastScrollTop = 0;

  document.addEventListener('scroll', () => {
    if (!$section.classList.contains('block-removed')) {
      const $floatingButton = document.querySelector('.floating-button-wrapper[data-audience="mobile"]');
      const { scrollTop } = document.documentElement;
      if (scrollTop < lastScrollTop) {
        block.classList.remove('appear');
        if ($floatingButton && !$floatingButton.classList.contains('toolbox-opened')) {
          $floatingButton.classList.remove('push-up');
        }
        background.classList.remove('show');
        setTimeout(() => {
          if (!block.classList.contains('appear')) {
            block.classList.remove('show');
          }
        }, 600);
      } else {
        if ($floatingButton && $floatingButton.classList.contains('toolbox-opened')) return;
        block.classList.add('show');
        if ($floatingButton && !$floatingButton.classList.contains('toolbox-opened')) {
          $floatingButton.classList.add('push-up');
        }
        background.classList.add('show');
        setTimeout(() => {
          if (block.classList.contains('show')) {
            block.classList.add('appear');
          }
        }, 10);
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }
  }, { passive: true });
}

function decorateBanner($block, payload) {
  const $logo = $block.querySelector('img');
  const $title = $block.querySelector('h2');
  const $cta = $block.querySelector('a');
  const $addDetails = $block.querySelector('p:last-of-type');
  const $secondImage = $addDetails.querySelector('img');

  const $ratings = createTag('div', { class: 'ratings' });
  const $ratingText = createTag('span', { class: 'rating-text' });
  const $background = createTag('div', { class: 'gradient-background' });
  const $colTwo = createTag('div', { class: 'contents' });
  const $details = createTag('div', { class: 'app-details' });

  $ratingText.textContent = `${payload.ratingScore} • ${payload.ratingCount} ${$addDetails.textContent}`;
  const ratingNumber = payload.ratingScore;

  $logo.classList.add('main-img');
  $cta.classList.add('small');
  $secondImage.classList.add('sub-text-img');
  $block.innerHTML = '';

  $ratings.append($ratingText);
  $details.append($cta, $ratings, $secondImage);
  $colTwo.append($title, $details);
  $block.append($logo, $colTwo);
  $block.parentElement.prepend($background);
  $ratings.prepend(getCurrentRatingStars(ratingNumber));
}

function watchFloatingButtonState(block) {
  function handleFloatingButton($floatingButton) {
    const config = { attributes: true, childList: false, subtree: false };

    const callback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes'
                    && mutation.target.classList.contains('toolbox-opened')
                    && $floatingButton.classList.contains('push-up')) {
          const background = block.parentElement.querySelector('.gradient-background');
          block.classList.remove('appear');
          $floatingButton.classList.remove('push-up');
          background.classList.remove('show');
          setTimeout(() => {
            if (!block.classList.contains('appear')) {
              block.classList.remove('show');
            }
          }, 600);
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe($floatingButton, config);
  }
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE
                        && node.matches('.floating-button-wrapper[data-audience="mobile"]')) {
            handleFloatingButton(node);
            observer.disconnect();
          }
        });
      }
    }
  };
  const observer = new MutationObserver(callback);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'app-banner');
  let decorateButtons;
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), decorateButtonsDeprecated(block)]).then(([utils, placeholders, buttons]) => {
    ({ createTag, getConfig } = utils);
    ({ replaceKeyArray } = placeholders);
    decorateButtons = buttons;
  });
  ([appleStoreRatingScore, appleStoreRatingCount, googleStoreRatingScore, googleStoreRatingCount] = await replaceKeyArray(['apple-store-rating-score', 'apple-store-rating-count', 'google-store-rating-score', 'google-store-rating-count'], getConfig()));

  decorateButtons = decorateButtonsDeprecated(block);
  const fixIcon = fixIcons(block);
  await Promise.all([decorateButtons, fixIcon]);
  if (weekPassed()) {
    localStorage.removeItem('app-banner-optout-exp-date');
    const payload = await buildPayload();
    decorateBanner(block, payload);
    addCloseBtn(block);

    if (Array.isArray(window.floatingCta) && window.floatingCta.length) {
      const db = window.floatingCta[0];
      const mfb = window.floatingCta.find((p) => window.location.pathname === p.path);
      const delay = mfb.delay ? mfb.delay * 1000 : db.delay * 1000;

      setTimeout(() => {
        initScrollDirection(block);
        watchFloatingButtonState(block);
      }, delay);
    } else {
      setTimeout(() => {
        initScrollDirection(block);
        watchFloatingButtonState(block);
      }, 1000);
    }
  }
}
