// eslint-disable-next-line import/no-unresolved
import { getLibs, addTempWrapperDeprecated, getLottie, lazyLoadLottiePlayer, toClassName } from '../../scripts/utils.js';
import loadCarousel from '../../scripts/utils/load-carousel.js';
import {
  fetchRatingsData,
  determineActionUsed,
  hasRated,
  submitRating,
  createRatingSlider,
  sliderFunctionality,
  RATINGS_CONFIG,
  createHoverStarRating,
  createRatingsContainer,
} from '../../scripts/utils/ratings-utils.js';

let createTag;
let getConfig;
let loadStyle;

// Initialize utils
let utils;
try {
  utils = await import(`${getLibs()}/utils/utils.js`);
  ({ createTag, getConfig, loadStyle } = utils);
} catch (error) {
  window.lana?.log('Failed to load utils:', error, { tags: 'ax quotes' });
  throw error;
}

function pickRandomFromArray(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

function createQuoteContent(textContent, addContentClass = false) {
  const $blockquote = createTag('blockquote', { class: addContentClass ? 'content' : '' });
  const $p = createTag('p', { class: 'inner-content' });
  $p.textContent = textContent;
  $blockquote.appendChild($p);
  return $blockquote;
}

async function createQuotesRatings({
  sheet,
  isCarouselVariant = false,
}) {
  // Load placeholders module
  const placeholders = await import(`${getLibs()}/features/placeholders.js`);

  const data = await fetchRatingsData(sheet);
  if (!data) return null;

  // Check if user can rate and has already rated
  const actionUsed = determineActionUsed(data.segments);
  const alreadyRated = hasRated(sheet);

  // Create a wrapper for the rating interface
  const wrapper = createTag('div', { class: 'ratings' });

  // Ensure Lottie player is loaded before proceeding
  await lazyLoadLottiePlayer(wrapper);

  // If user can't rate yet, show the ratings container with stars and vote count
  if (!actionUsed) {
    const ratingsContainer = await createRatingsContainer({
      sheet,
      showAverage: true,
      votesText: await placeholders.replaceKey('rating-votes', getConfig()),
    });
    wrapper.appendChild(ratingsContainer);
    return wrapper;
  }

  // If user has already rated, show the "already rated" state
  if (alreadyRated) {
    const [
      alreadySubmittedTitle,
      alreadySubmittedText,
    ] = await Promise.all([
      placeholders.replaceKey('rating-already-submitted-title', getConfig()),
      placeholders.replaceKey('rating-already-submitted-text', getConfig()),
    ]);

    const thankYouContainer = createTag('div', { class: 'no-slider' });
    const title = createTag('h3', { id: toClassName(alreadySubmittedTitle) });
    title.textContent = alreadySubmittedTitle;
    const message = createTag('p');
    message.textContent = alreadySubmittedText;
    thankYouContainer.appendChild(title);
    thankYouContainer.appendChild(message);
    wrapper.appendChild(thankYouContainer);
    wrapper.classList.add('submitted');
    return wrapper;
  }

  // Load all placeholder text
  const [
    submissionTitle,
    submissionText,
  ] = await Promise.all([
    placeholders.replaceKey('rating-submission-title', getConfig()),
    placeholders.replaceKey('rating-submission-text', getConfig()),
  ]);

  // Create the rating interface based on variant
  if (isCarouselVariant) {
    // Use hover-based rating for carousel variant
    const hoverRating = await createHoverStarRating({
      ratings: RATINGS_CONFIG,
      onRatingSelect: async (rating) => {
        // Create a single timer instance at the hover rating level
        const timerAnimation = createTag('div', { class: 'timer' });

        // Countdown function to manage the timer
        const countdown = (bool, ratingValue) => {
          if (bool) {
            // Remove any existing timer
            const existingTimer = hoverRating.querySelector('.timer');
            if (existingTimer) {
              existingTimer.remove();
            }

            // Add timer to current star element
            const currentStar = hoverRating.querySelector(`[data-rating="${ratingValue}"]`);
            const hoverStars = hoverRating.querySelector('.hover-stars');
            if (currentStar && hoverStars) {
              hoverStars.appendChild(timerAnimation);
            }

            timerAnimation.innerHTML = getLottie(
              'countdown',
              '/express/code/blocks/ratings/countdown.json',
              false,
              true,
              false,
              false,
            );

            let counter = 10;
            window.ratingSubmitCountdown = setInterval(() => {
              if (counter > 0) {
                counter -= 1;
              } else {
                clearInterval(window.ratingSubmitCountdown);
                window.ratingSubmitCountdown = null;
                const submit = hoverRating.querySelector('input[type="submit"]');
                if (submit) {
                  submit.click();
                }
              }
            }, 920);
          } else if (window.ratingSubmitCountdown) {
            clearInterval(window.ratingSubmitCountdown);
            window.ratingSubmitCountdown = null;
            timerAnimation.remove();
          }
        };

        // Function to clean up previous rating state
        const cleanupPreviousRating = () => {
          // Clear any existing timer
          countdown(false);
        };

        // Clean up previous rating state
        cleanupPreviousRating();

        // Wait for the next tick to ensure the comment box is in the DOM
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        // Get the comment box and its elements
        const commentBox = hoverRating.querySelector('.slider-comment');
        if (!commentBox) return;

        const textarea = commentBox.querySelector('textarea');
        const submit = commentBox.querySelector('input[type="submit"]');

        // Add invalid class handling
        textarea.addEventListener('invalid', (e) => {
          e.preventDefault();
          textarea.classList.add('invalid');
        });

        textarea.addEventListener('input', () => {
          if (textarea.value !== '') {
            countdown(false);
            textarea.classList.remove('invalid');
          }
        });

        // Handle submission
        let isSubmitting = false;
        const handleSubmit = async (e) => {
          e.preventDefault();
          if (isSubmitting) return;

          // Check if textarea is required and empty
          if (textarea.hasAttribute('required') && !textarea.value.trim()) {
            textarea.classList.add('invalid');
            return;
          }

          isSubmitting = true;
          const comment = textarea.value;
          await submitRating(sheet, rating, comment);
          localStorage.removeItem(`ccxActionRatingsFeedback${sheet}`);

          // Show thank you message immediately after submission
          const thankYouContainer = createTag('div', { class: 'no-slider' });
          const title = createTag('h3', { id: toClassName(submissionTitle) });
          title.textContent = submissionTitle;
          const message = createTag('p');
          message.textContent = submissionText;
          thankYouContainer.appendChild(title);
          thankYouContainer.appendChild(message);

          // Replace the ratings interface with thank you message
          wrapper.innerHTML = '';
          wrapper.appendChild(thankYouContainer);
          wrapper.classList.add('submitted');

          // Scroll to top of section if needed
          const section = wrapper.closest('.section');
          if (window.scrollY > section.offsetTop) {
            window.scrollTo(0, section.offsetTop - 64);
          }
        };
        submit.addEventListener('click', handleSubmit);

        // Start countdown if feedback not required
        const ratingConfig = RATINGS_CONFIG[rating - 1];
        if (!ratingConfig.feedbackRequired) {
          countdown(true, rating);
        }

        // Add event listeners for timer control
        textarea.addEventListener('focus', () => {
          countdown(false);
        });
      },
    });
    wrapper.appendChild(hoverRating);
  } else {
    // Use existing slider for other variants
    const { container } = await createRatingSlider('', 'h3');
    sliderFunctionality(container, {
      sheetCamelCase: sheet,
      ratings: RATINGS_CONFIG,
    });
    wrapper.appendChild(container);
  }

  return wrapper;
}

export default async function decorate($block) {
  addTempWrapperDeprecated($block, 'quotes');
  lazyLoadLottiePlayer($block);

  const isSingularVariant = $block.classList.contains('singular');
  const isCarouselVariant = $block.classList.contains('carousel');
  const hasRatings = $block.classList.contains('ratings');

  if (isSingularVariant) {
    const $rows = [...$block.querySelectorAll(':scope>div')];

    // The Desktop design has a different element layout from the mobile design, plus
    // the desktop design uses the background image twice, while the mobile design uses
    // it once. Because of the many differences, it may be simpler to divide them into two layouts
    const $quoteContainer = createTag('div', { class: 'quote-container' });
    const $desktopContainer = createTag('div', { class: 'desktop-container' });
    const $mobileContainer = createTag('div', { class: 'mobile-container' });
    const $desktopContainerBackground = createTag('div', { class: 'background' });
    const $mobileContainerBackground = createTag('div', { class: 'background' });

    $desktopContainer.append($desktopContainerBackground);
    $mobileContainer.append($mobileContainerBackground);
    $quoteContainer.append($desktopContainer);
    $quoteContainer.append($mobileContainer);

    if ($rows[0].children.length === 1) {
      const $img = $rows[0].children[0].querySelector('img');
      const backgroundUrl = $img.src;

      const backgroundDesktopCSS = `no-repeat calc(-400px + 25%) -20px / 640px url("${backgroundUrl}"), `
        + `no-repeat calc(450px + 75%) -20px / 640px url("${backgroundUrl}")`;
      $desktopContainerBackground.style.background = backgroundDesktopCSS;

      const backgroundMobileCSS = `no-repeat -80px -48px / 750px url("${backgroundUrl}")`;
      $mobileContainerBackground.style.background = backgroundMobileCSS;

      $rows.shift();
    }

    // at this point, $rows contains only quotes (no param)
    const $quoteSelected = pickRandomFromArray($rows);
    const $picture = $quoteSelected.querySelector('picture');
    const $quoteDesktop = createTag('div', { class: 'quote' });

    $desktopContainer.append($quoteDesktop);

    const $authorPhoto = createTag('div', { class: 'author-photo' });
    $quoteDesktop.append($authorPhoto);

    $authorPhoto.append($picture);

    const $quoteDetails = createTag('div', { class: 'quote-details' });
    $quoteDesktop.append($quoteDetails);

    const $quoteComment = createTag('div', { class: 'quote-comment' });
    $quoteDetails.append($quoteComment);

    $quoteComment.append(createQuoteContent(
      $quoteSelected.firstElementChild.textContent,
    ));

    const authorDescription = $quoteSelected.children[1].textContent;

    const $authorDescription = createTag('div', { class: 'author-description' });
    $quoteDetails.append($authorDescription);

    $authorDescription.append(authorDescription);

    // Mobile layout

    const $quoteMobile = createTag('div', { class: 'quote' });
    $mobileContainer.append($quoteMobile);

    const $quoteDetailsMobile = createTag('div', { class: 'quote-details' });
    $quoteMobile.append($quoteDetailsMobile);

    const $quoteCommentMobile = $quoteComment.cloneNode(true);

    $quoteDetailsMobile.append($quoteCommentMobile);

    const $quoteAuthorPanelMobile = createTag('div', { class: 'author-panel' });
    $quoteDetailsMobile.append($quoteAuthorPanelMobile);

    const $quoteAuthorPhotoMobile = createTag('div', { class: 'author-photo' });
    $quoteAuthorPanelMobile.append($quoteAuthorPhotoMobile);

    const $pictureCloned = $picture.cloneNode(true);

    $quoteAuthorPhotoMobile.append($pictureCloned);
    $quoteAuthorPanelMobile.append(authorDescription);

    $block.replaceChildren($quoteContainer);
  } else if (isCarouselVariant) {
    // Extract ratings data source if present
    let ratingsDataSource;
    const $rows = [...$block.querySelectorAll(':scope>div')];

    // Only look for ratings data if first div contains text and no h2
    if (hasRatings
        && $rows[0]?.firstElementChild?.textContent
        && !$rows[0].querySelector('h2')) {
      ratingsDataSource = $rows[0].firstElementChild.textContent.trim();
      $rows.shift(); // Remove the ratings data source row
    }

    // Extract heading if present (should be the first or second row)
    const [$headingRow] = $rows.filter((row) => row.querySelector('h2'));
    if ($headingRow) {
      const headingIndex = $rows.indexOf($headingRow);
      $rows.splice(headingIndex, 1); // Remove the heading row from its position
    }

    // Create ratings container if needed
    let $ratingsContainer;
    if (hasRatings && ratingsDataSource) {
      $ratingsContainer = await createQuotesRatings({
        sheet: ratingsDataSource,
        isCarouselVariant: true,
      });
    }

    // Create carousel container
    const $carouselContainer = createTag('div', {
      class: `basic-carousel${hasRatings ? ' carousel-play-pause' : ''}`,
    });

    // Process each quote into a carousel item
    $rows.forEach(($card) => {
      $card.classList.add('template', 'basic-carousel-element', 'quote');
      if ($card.children.length > 1) {
        const $author = $card.children[1];
        $author.classList.add('author');
        const $authorContent = createTag('div', { class: 'author-content' });

        if ($author.querySelector('picture')) {
          const $authorImg = createTag('div', { class: 'image' });
          $authorImg.appendChild($author.querySelector('picture'));
          $authorContent.appendChild($authorImg);
        }

        const $authorSummary = createTag('div', { class: 'summary' });
        Array.from($author.querySelectorAll('p'))
          .filter(($p) => !!$p.textContent.trim())
          .forEach(($p) => $authorSummary.appendChild($p));
        $authorContent.appendChild($authorSummary);
        $author.appendChild($authorContent);
      }

      const $blockquote = createQuoteContent($card.firstElementChild.textContent, true);
      $card.firstElementChild.replaceWith($blockquote);
      // Move author before content
      if ($card.children.length > 1) {
        $card.insertBefore($card.children[1], $card.firstElementChild);
      }

      $carouselContainer.appendChild($card);
    });

    // Initialize the carousel after ensuring CSS is loaded
    const config = getConfig();
    await new Promise((resolve) => {
      loadStyle(`${config.codeRoot}/scripts/widgets/basic-carousel.css`, () => {
        resolve();
      });
    });
    await loadCarousel(null, $carouselContainer);

    // Create a wrapper to hold everything
    const $wrapper = createTag('div', { class: 'quotes-ratings-wrapper' });

    // Create headline wrapper for heading and ratings
    if ($headingRow || $ratingsContainer) {
      const $headlineWrapper = createTag('div', { class: 'container' });
      if ($headingRow) {
        $headlineWrapper.appendChild($headingRow);
      }
      if ($ratingsContainer) {
        $headlineWrapper.appendChild($ratingsContainer);
      }
      $wrapper.appendChild($headlineWrapper);
    }

    $wrapper.appendChild($carouselContainer);

    // Replace block content with wrapper containing headline and carousel
    $block.replaceChildren($wrapper);
  } else {
    $block.querySelectorAll(':scope>div').forEach(($card) => {
      $card.classList.add('quote');
      if ($card.children.length > 1) {
        const $author = $card.children[1];
        $author.classList.add('author');
        // Create a container for image and summary
        const $authorContent = createTag('div', { class: 'author-content' });

        if ($author.querySelector('picture')) {
          const $authorImg = createTag('div', { class: 'image' });
          $authorImg.appendChild($author.querySelector('picture'));
          $authorContent.appendChild($authorImg);
        }

        const $authorSummary = createTag('div', { class: 'summary' });
        Array.from($author.querySelectorAll('p'))
          .filter(($p) => !!$p.textContent.trim())
          .forEach(($p) => $authorSummary.appendChild($p));
        $authorContent.appendChild($authorSummary);
        // Append the author content container to author
        $author.appendChild($authorContent);
      }

      const $blockquote = createQuoteContent($card.firstElementChild.textContent, true);
      $card.firstElementChild.replaceWith($blockquote);
    });
  }
}
