// eslint-disable-next-line import/no-unresolved
import { getLibs, getIconElementDeprecated, getLottie, toClassName, lazyLoadLottiePlayer } from '../utils.js';
import BlockMediator from '../block-mediator.min.js';

let createTag;
let getConfig;
let getMetadata;

// Initialize required dependencies
async function initDependencies() {
  if (!createTag || !getConfig || !getMetadata) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    ({ createTag, getConfig, getMetadata } = utils);
  }
}

/**
 * Creates star elements for rating display
 * @param {number} count - Number of stars to create
 * @param {string} starType - Type of star (star, star-half, star-empty)
 * @param {HTMLElement} parent - Parent element to append stars to
 */
export function populateStars(count, starType, parent) {
  for (let i = 0; i < count; i += 1) {
    parent.appendChild(getIconElementDeprecated(starType));
  }
}

/**
 * Fetches ratings data from the API
 * @param {string} sheet - Rating sheet identifier
 * @returns {Promise<{average: number, total: number, segments: string}>}
 */
export async function fetchRatingsData(sheet) {
  await initDependencies();
  const { env } = getConfig();
  let url = `https://www.adobe.com/reviews-api/ccx${sheet}.json`;
  if (env?.name === 'stage' || env?.name === 'local') {
    url = `https://www.stage.adobe.com/reviews-api/ccx${sheet}.json`;
  }
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const response = await resp.json();
  return {
    average: response.data[0]?.Average ? parseFloat(response.data[0].Average).toFixed(2) : null,
    total: response.data[0]?.Total ? parseInt(response.data[0].Total, 10) : null,
    segments: response.data[0]?.Segments || null,
  };
}

/**
 * Creates a star rating display with optional vote count
 * @param {Object} options - Configuration options
 * @param {number} options.rating - Rating value (0-5)
 * @param {number} options.total - Total number of votes
 * @param {boolean} options.showAverage - Whether to show the average rating
 * @param {string} options.votesText - Text to display for votes count
 * @returns {Promise<Object>} Object containing star rating elements
 */
export async function createStarRating({
  rating = 5,
  total = 0,
  showAverage = false,
  votesText = 'votes',
}) {
  await initDependencies();
  const stars = createTag('span', { class: 'rating-stars' });
  const ratingValue = Math.round(rating * 10) / 10;
  let votes = null;

  if (showAverage) {
    const ratingRoundedHalf = Math.round(ratingValue * 2) / 2;
    const filledStars = Math.floor(ratingRoundedHalf);
    const halfStars = filledStars === ratingRoundedHalf ? 0 : 1;
    const emptyStars = halfStars === 1 ? 4 - filledStars : 5 - filledStars;

    populateStars(filledStars, 'star', stars);
    populateStars(halfStars, 'star-half', stars);
    populateStars(emptyStars, 'star-empty', stars);

    const $votes = createTag('span', { class: 'rating-votes' });
    const ratingAverage = createTag('span', { class: 'rating-average' });
    const ratingCount = createTag('span', { class: 'rating-count' });
    ratingAverage.textContent = `${ratingValue} / 5`;
    $votes.appendChild(ratingAverage);
    ratingCount.textContent = `  - ${total.toLocaleString()} ${votesText}`;
    $votes.appendChild(ratingCount);

    if (getConfig().locale.region === 'kr') {
      $votes.childNodes[0].textContent = `${ratingValue} / 5`;
    }

    votes = $votes;
  } else {
    for (let i = 0; i < 5; i += 1) {
      stars.appendChild(getIconElementDeprecated('star'));
    }
  }

  return { stars, votes };
}

/**
 * Creates a complete ratings container with all elements
 * @param {Object} options - Configuration options
 * @param {string} options.sheet - Rating sheet identifier
 * @param {boolean} options.showAverage - Whether to show the average
 * @param {string} options.votesText - Text to display for votes
 * @returns {Promise<HTMLElement>} Complete ratings container
 */
export async function createRatingsContainer({
  sheet,
  showAverage = false,
  votesText = 'votes',
}) {
  await initDependencies();
  const data = await fetchRatingsData(sheet);
  if (!data) return null;

  const container = createTag('div', { class: 'ratings-container' });
  const { stars, votes } = await createStarRating({
    rating: data.average,
    total: data.total,
    showAverage,
    votesText,
  });

  // Add votes first if available
  if (votes) {
    container.appendChild(votes);
  }
  // Then add stars
  container.appendChild(stars);

  const placeholders = await import(`${getLibs()}/features/placeholders.js`);
  const actionNotUsedText = await placeholders.replaceKey('rating-action-not-used', getConfig());
  const $noSlider = createTag('div', { class: 'no-slider' });
  const $tryIt = createTag('a', { href: '#', class: 'try-it' });
  $tryIt.textContent = actionNotUsedText;
  $noSlider.appendChild($tryIt);
  container.appendChild($noSlider);

  return container;
}

export const RATINGS_CONFIG = [
  {
    class: 'one-star',
    img: 'emoji-angry-face',
    feedbackRequired: true,
    ratingKey: 'one-star-rating',
    textKey: 'one-star-rating-text',
    inputKey: 'one-star-rating-input',
  },
  {
    class: 'two-stars',
    img: 'emoji-thinking-face',
    feedbackRequired: true,
    ratingKey: 'two-star-rating',
    textKey: 'two-star-rating-text',
    inputKey: 'two-star-rating-input',
  },
  {
    class: 'three-stars',
    img: 'emoji-upside-down-face',
    feedbackRequired: true,
    ratingKey: 'three-star-rating',
    textKey: 'three-star-rating-text',
    inputKey: 'three-star-rating-input',
  },
  {
    class: 'four-stars',
    img: 'emoji-smiling-face',
    feedbackRequired: false,
    ratingKey: 'four-star-rating',
    textKey: 'four-star-rating-text',
    inputKey: 'four-star-rating-input',
  },
  {
    class: 'five-stars',
    img: 'emoji-star-struck',
    feedbackRequired: false,
    ratingKey: 'five-star-rating',
    textKey: 'five-star-rating-text',
    inputKey: 'five-star-rating-input',
  },
];

export function hasRated(sheet) {
  // dev mode: check use-rating query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-rated');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for localStorage
  const ccxActionRatings = localStorage.getItem('ccxActionRatings');
  return ccxActionRatings && ccxActionRatings.includes(sheet);
}

export function determineActionUsed(actionSegments) {
  // "dev" mode: check action-used query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-used');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for audience
  const segments = BlockMediator.get('segments');

  if (actionSegments && segments) {
    const parsedActionSegments = actionSegments
      .replace(/ /g, '')
      .split(',')
      .map(Number);
    return parsedActionSegments.some((segment) => segments.includes(segment));
  }

  return false;
}

export function submitRating(sheet, rating, comment) {
  const segments = BlockMediator.get('segments') || [];
  const content = {
    data: [
      {
        name: 'Segments',
        value: segments.length ? segments.join(', ') : '',
      },
      {
        name: 'Locale',
        value: getConfig().locale.region,
      },
      {
        name: 'Rating',
        value: rating,
      },
      {
        name: 'Feedback',
        value: comment,
      },
      {
        name: 'Timestamp',
        value: new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
      },
    ],
  };

  fetch(`https://www.adobe.com/reviews-api/ccx${sheet}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });

  let ccxActionRatings = localStorage.getItem('ccxActionRatings') ?? '';

  if (!ccxActionRatings.includes(sheet)) {
    ccxActionRatings = ccxActionRatings.length > 0 ? sheet : `,${sheet}`;
  }

  localStorage.setItem('ccxActionRatings', ccxActionRatings);
}

export function buildSchema(ratingAverage, ratingTotal) {
  if (!ratingAverage || !ratingTotal) {
    return;
  }
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify({
    '@type': 'Product',
    '@context': 'https://schema.org',
    name: document.title,
    description: getMetadata('description'),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingAverage,
      ratingCount: ratingTotal,
    },
  });
  document.head.appendChild(script);
}

/**
 * Updates the front-end style of the slider
 * @param {HTMLElement} block - The ratings block element
 * @param {number} value - Current slider value
 */
export function updateSliderStyle(block, value) {
  const $input = block.querySelector('input[type=range]');
  const $tooltip = block.querySelector('.tooltip');
  const $sliderFill = block.querySelector('.slider-fill');
  const thumbWidth = 60;
  const pos = (value - $input.getAttribute('min'))
      / ($input.getAttribute('max') - $input.getAttribute('min'));
  const thumbCorrect = thumbWidth * (pos - 0.25) * -1 - 0.1;
  const titlePos = pos * $input.offsetWidth - thumbWidth / 4 + thumbCorrect;
  $tooltip.style.left = `${titlePos}px`;
  $sliderFill.style.width = `${titlePos + thumbWidth / 2}px`;
}

/**
 * Shared utility for managing tooltip state and content
 * @param {Object} options - Tooltip options
 * @param {HTMLElement} options.tooltip - Tooltip element
 * @param {HTMLElement} options.tooltipImg - Tooltip image element
 * @param {HTMLElement} options.tooltipText - Tooltip text element
 * @param {Object} options.ratingConfig - Rating configuration
 * @param {HTMLElement} options.target - Target element for positioning
 * @param {HTMLElement} options.container - Container element for positioning
 * @returns {Promise<void>}
 */
async function updateTooltip({
  tooltip,
  tooltipImg,
  tooltipText,
  ratingConfig,
  target,
  container,
}) {
  const placeholders = await import(`${getLibs()}/features/placeholders.js`);
  const ratingText = await placeholders.replaceKey(ratingConfig.ratingKey, getConfig());
  const labelText = await placeholders.replaceKey(ratingConfig.textKey, getConfig());
  // Clear and reinitialize the tooltip image
  tooltipImg.innerHTML = '';
  const iconElement = getIconElementDeprecated(ratingConfig.img);
  if (iconElement) {
    tooltipImg.appendChild(iconElement);
  }
  // Update tooltip text
  tooltipText.textContent = `${ratingText} - ${labelText}`;
  // Position the tooltip first
  if (target && container) {
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const tooltipLeft = targetRect.left - containerRect.left + (targetRect.width / 2);
    tooltip.style.left = `${tooltipLeft}px`;
  }
  // Show tooltip - this will trigger the CSS selector
  tooltip.style.display = 'block';
}

/**
 * Shared utility for managing star states
 * @param {Object} options - Star state options
 * @param {NodeList} options.stars - Collection of star elements
 * @param {number} options.activeIndex - Index of active star
 * @param {string} options.state - State to apply (hover/selected)
 */
function updateStarStates({ stars, activeIndex, state }) {
  stars.forEach((star, index) => {
    if (index < activeIndex) {
      star.classList.add(state);
    } else {
      star.classList.remove(state);
    }
  });
}

/**
 * Shared utility for managing rating storage
 * @param {Object} options - Storage options
 * @param {string} options.sheetCamelCase - Camel case version of sheet identifier
 * @param {number} options.rating - Selected rating value
 * @param {string} options.feedback - User feedback text
 */
function updateRatingStorage({ sheetCamelCase, rating, feedback }) {
  localStorage.setItem(
    `ccxActionRatingsFeedback${sheetCamelCase}`,
    `${rating},${feedback}`,
  );
}

/**
 * Shared timer management utility for ratings
 * @param {Object} options - Timer options
 * @param {boolean} options.start - Whether to start the timer
 * @param {HTMLElement} options.container - Container element for the timer
 * @param {HTMLElement} options.target - Target element to attach timer to
 * @param {Function} options.onComplete - Callback when timer completes
 * @returns {void}
 */
function manageRatingTimer({ start, container, target, onComplete }) {
  // Always clear any existing timer first
  if (window.ratingSubmitCountdown) {
    clearInterval(window.ratingSubmitCountdown);
    window.ratingSubmitCountdown = null;
  }

  // Remove any existing timer element
  const existingTimer = container.querySelector('.timer');
  if (existingTimer) {
    existingTimer.remove();
  }

  if (start) {
    // Create and add timer to target
    const timerAnimation = createTag('div', { class: 'timer' });
    timerAnimation.innerHTML = getLottie(
      'countdown',
      '/express/code/blocks/ratings/countdown.json',
      false,
      true,
      false,
      false,
    );
    target.appendChild(timerAnimation);

    let counter = 10;
    window.ratingSubmitCountdown = setInterval(() => {
      if (counter > 0) {
        counter -= 1;
      } else {
        clearInterval(window.ratingSubmitCountdown);
        window.ratingSubmitCountdown = null;
        onComplete();
      }
    }, 920);
  }
}

/**
 * Implements the slider functionality
 * @param {HTMLElement} block - The ratings block element
 * @param {Object} options - Configuration options
 * @param {string} options.sheetCamelCase - Camel case version of sheet identifier
 * @param {Array} options.ratings - Array of rating configurations
 */
export function sliderFunctionality(block, { sheetCamelCase, ratings }) {
  const input = block.querySelector('input[type=range]');
  const sliderFill = block.querySelector('.slider-fill');
  const tooltip = block.querySelector('.tooltip');
  const tooltipText = block.querySelector('.tooltip--text');
  const tooltipImg = block.querySelector('.tooltip--image');
  const textarea = block.querySelector('.slider-comment textarea');
  const textareaLabel = block.querySelector('.slider-comment label');
  const stars = Array.from(block.querySelectorAll('.stars'));
  const submit = block.querySelector('input[type=submit]');
  const scrollAnchor = block.querySelector('.ratings-scroll-anchor');
  const commentBox = block.querySelector('.slider-comment');

  // Countdown timer to auto-submit
  const countdown = (bool) => {
    if (bool) {
      manageRatingTimer({
        start: true,
        container: commentBox,
        target: stars[Math.round(parseFloat(input.value)) - 1],
        onComplete: () => submit.click(),
      });
    } else {
      manageRatingTimer({ start: false, container: commentBox });
    }
  };

  // Updates the comment box
  const updateCommentBoxAndTimer = () => {
    const val = parseFloat(input.value) ?? 0;
    const index = Math.round(val);
    if (val !== index) return;
    if (ratings[index - 1].feedbackRequired || textarea.value !== '') {
      commentBox.classList.add('submit--appear');
      countdown(false);
    } else {
      commentBox.classList.remove('submit--appear');
      countdown(true);
    }
    commentBox.classList.add('comment--appear');
  };

  // Updates the value of the slider and tooltip
  const updateSliderValue = async (snap = true) => {
    countdown(false);
    let val = parseFloat(input.value) ?? 0;
    const index = Math.round(val);
    if (snap) {
      val = index;
      input.value = index;
      updateCommentBoxAndTimer();
    }

    await updateTooltip({
      tooltip,
      tooltipImg,
      tooltipText,
      ratingConfig: ratings[index - 1],
    });

    const placeholders = await import(`${getLibs()}/features/placeholders.js`);
    textareaLabel.textContent = await placeholders.replaceKey(
      ratings[index - 1].textKey,
      getConfig(),
    );
    textarea.setAttribute('placeholder', await placeholders.replaceKey(
      ratings[index - 1].inputKey,
      getConfig(),
    ));

    if (ratings[index - 1].feedbackRequired) {
      textarea.setAttribute('required', 'true');
    } else {
      textarea.removeAttribute('required');
    }

    ratings.forEach((obj) => block.classList.remove(obj.class));
    block.classList.add(ratings[index - 1].class);
    block.classList.add('rated');

    updateRatingStorage({
      sheetCamelCase,
      rating: input.value,
      feedback: textarea.value,
    });

    updateSliderStyle(block, input.value);
  };

  // Slider event listeners
  input.addEventListener('input', () => updateSliderValue(false));
  input.addEventListener('change', () => updateSliderValue());
  let firstTimeInteract = true;
  const scrollToScrollAnchor = () => {
    if (firstTimeInteract) {
      setTimeout(() => {
        scrollAnchor.scrollIntoViewIfNeeded(false);
      }, 450); // Allows for comment slide animation
      firstTimeInteract = false;
    } else {
      scrollAnchor.scrollIntoViewIfNeeded(false);
    }
  };

  input.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      input.value -= 1;
      updateSliderValue();
      scrollToScrollAnchor();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      input.value += 1;
      updateSliderValue();
      scrollToScrollAnchor();
    }
  });

  ['mousedown', 'touchstart'].forEach((event) => {
    input.addEventListener(event, () => {
      tooltip.style.transition = 'none';
      sliderFill.style.transition = 'none';
    });
  });

  ['mouseup', 'touchend'].forEach((event) => {
    input.addEventListener(event, () => {
      tooltip.style.transition = 'left .3s, right .3s';
      sliderFill.style.transition = 'width .3s';
      if (
        (!textarea.getAttribute('required') && textarea.value !== '')
        || textarea.value !== ''
      ) {
        submit.focus({ preventScroll: true });
      }
      scrollToScrollAnchor();
    });
  });

  window.addEventListener('resize', () => {
    updateSliderStyle(block, input.value);
  });

  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      input.value = index + 1;
      updateSliderValue();
      scrollToScrollAnchor();
    });
  });

  textarea.addEventListener('focus', () => {
    commentBox.classList.add('submit--appear');
    countdown(false);
  });

  // Get text from localStorage if they navigated away after typing then came back
  textarea.addEventListener('keyup', () => {
    updateRatingStorage({
      sheetCamelCase,
      rating: input.value,
      feedback: textarea.value,
    });
  });

  const ccxActionRatingsFeedback = localStorage.getItem(
    `ccxActionRatingsFeedback${sheetCamelCase}`,
  );
  if (ccxActionRatingsFeedback) {
    const match = ccxActionRatingsFeedback.match(/([^,]*),((.|\n)*)/);
    const localStorageRating = match[1];
    const localStoragetext = match[2];
    if (localStoragetext && localStoragetext !== '') {
      textarea.value = localStoragetext;
      input.value = localStorageRating;
      commentBox.classList.add('comment--appear');
      updateSliderValue();
    }
  }
}

/**
 * Creates the rating slider HTML structure
 * @param {string} title - Title for the rating section
 * @param {string} headingTag - HTML tag to use for the heading
 * @returns {HTMLElement} The rating slider container
 */
export async function createRatingSlider(title, headingTag = 'h3') {
  await initDependencies();
  const headingWrapper = createTag('div', { class: 'ratings-heading' });
  const heading = createTag(headingTag, { id: toClassName(title) });
  heading.textContent = title;
  headingWrapper.appendChild(heading);

  const sliderContainer = createTag('div', { class: 'ratings-slider' });
  const slider = createTag('div', { class: 'slider' });
  const stars = createTag('div', { class: 'stars' });
  const input = createTag('input', { type: 'range', min: '1', max: '5', value: '1' });
  const sliderFill = createTag('div', { class: 'slider-fill' });
  const tooltip = createTag('div', { class: 'tooltip' });
  const tooltipText = createTag('div', { class: 'tooltip--text' });
  const tooltipImg = createTag('div', { class: 'tooltip--image' });
  const commentBox = createTag('div', { class: 'slider-comment' });
  const textareaLabel = createTag('label');
  const textarea = createTag('textarea');

  const placeholders = await import(`${getLibs()}/features/placeholders.js`);
  const submitText = await placeholders.replaceKey('rating-submit', getConfig());
  const submit = createTag('input', { type: 'submit', value: submitText });
  const scrollAnchor = createTag('div', { class: 'ratings-scroll-anchor' });

  tooltip.appendChild(tooltipText);
  tooltip.appendChild(tooltipImg);
  slider.appendChild(input);
  slider.appendChild(sliderFill);
  slider.appendChild(tooltip);
  commentBox.appendChild(textareaLabel);
  commentBox.appendChild(textarea);
  commentBox.appendChild(submit);
  sliderContainer.appendChild(stars);
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(commentBox);
  sliderContainer.appendChild(scrollAnchor);

  return {
    container: sliderContainer,
    heading: headingWrapper,
  };
}

/**
 * Creates a hover-based star rating interface
 * @param {Object} options - Configuration options
 * @param {Array} options.ratings - Array of rating configurations
 * @param {Function} options.onRatingSelect - Callback when rating is selected
 * @returns {Promise<HTMLElement>} The hover rating container
 */
export async function createHoverStarRating({ ratings, onRatingSelect }) {
  // Import dependencies at the start
  const placeholders = await import(`${getLibs()}/features/placeholders.js`);
  const config = getConfig();

  const container = createTag('div', { class: 'hover-ratings' });
  // Ensure Lottie player is loaded before proceeding
  await lazyLoadLottiePlayer(container);

  const starsContainer = createTag('div', { class: 'hover-stars' });
  const tooltip = createTag('div', { class: 'hover-tooltip' });

  // Create elements for tooltip content
  const tooltipContent = createTag('div', { class: 'tooltip-content' });
  const tooltipImg = createTag('div', { class: 'tooltip-image' });
  const tooltipText = createTag('span', { class: 'tooltip-text' });
  tooltipContent.appendChild(tooltipImg);
  tooltipContent.appendChild(tooltipText);
  tooltip.appendChild(tooltipContent);

  // Initialize shared tooltip state with first rating
  const firstRatingConfig = ratings[0];
  if (firstRatingConfig) {
    const ratingText = await placeholders.replaceKey(firstRatingConfig.ratingKey, config);
    const labelText = await placeholders.replaceKey(firstRatingConfig.textKey, config);
    tooltipImg.innerHTML = '';
    const iconElement = getIconElementDeprecated(firstRatingConfig.img);
    if (iconElement) {
      tooltipImg.appendChild(iconElement);
    }
    tooltipText.textContent = `${ratingText} - ${labelText}`;
    // Set initial display state to trigger CSS
    tooltip.style.display = 'block';
    // Force a reflow to ensure CSS selector matches
    tooltip.offsetHeight;
    // Hide tooltip but maintain state
    tooltip.style.display = 'none';
  }

  // Create persistent comment box structure
  const commentBox = createTag('div', { class: 'slider-comment' });
  const textareaLabel = createTag('label');
  const textarea = createTag('textarea');
  const submit = createTag('input', { type: 'submit' });
  commentBox.appendChild(textareaLabel);
  commentBox.appendChild(textarea);
  commentBox.appendChild(submit);

  // Create star buttons
  for (let i = 1; i <= ratings.length; i += 1) {
    const button = createTag('button', {
      type: 'button',
      class: 'hover-star',
      'aria-label': `${i} stars`,
      'data-rating': i,
    });

    // Add star icon using the original pattern
    populateStars(1, 'star', button);

    // Handle hover state
    button.addEventListener('mouseenter', async () => {
      const stars = starsContainer.querySelectorAll('.hover-star');
      updateStarStates({ stars, activeIndex: i, state: 'hover' });

      await updateTooltip({
        tooltip,
        tooltipImg,
        tooltipText,
        ratingConfig: ratings[i - 1],
        target: button,
        container,
      });
    });

    // Handle click state
    button.addEventListener('click', async () => {
      const stars = starsContainer.querySelectorAll('.hover-star');
      updateStarStates({ stars, activeIndex: i, state: 'selected' });

      // Update comment box content without recreating structure
      const ratingConfig = ratings[i - 1];
      if (!ratingConfig) {
        // eslint-disable-next-line no-console
        console.error('Invalid rating value:', i);
        return;
      }

      // Update label and placeholder
      textareaLabel.textContent = await placeholders.replaceKey(ratingConfig.textKey, config);
      textarea.setAttribute(
        'placeholder',
        await placeholders.replaceKey(ratingConfig.inputKey, config),
      );

      // Update required state
      if (ratingConfig.feedbackRequired) {
        textarea.setAttribute('required', 'true');
      } else {
        textarea.removeAttribute('required');
      }

      // Show comment box if not already visible
      if (!commentBox.classList.contains('comment--appear')) {
        commentBox.classList.add('comment--appear');
      }

      // Update submit button visibility
      if (ratingConfig.feedbackRequired || textarea.value !== '') {
        commentBox.classList.add('submit--appear');
      } else {
        commentBox.classList.remove('submit--appear');
      }

      // Handle timer
      if (!ratingConfig.feedbackRequired) {
        manageRatingTimer({
          start: true,
          container,
          target: button,
          onComplete: () => onRatingSelect(i),
        });
      } else {
        manageRatingTimer({ start: false, container });
      }

      // Call the original callback with the rating
      onRatingSelect(i, textareaLabel.textContent);

      // Only append the comment box when a star is clicked
      if (!container.contains(commentBox)) {
        container.appendChild(commentBox);
      }
    });

    starsContainer.appendChild(button);
  }

  // Handle mouseleave for stars container
  starsContainer.addEventListener('mouseleave', () => {
    const stars = starsContainer.querySelectorAll('.hover-star');
    stars.forEach((s) => s.classList.remove('hover'));
    tooltip.style.display = 'none';
  });

  // Add event listeners for timer control
  textarea.addEventListener('focus', () => {
    manageRatingTimer({ start: false, container });
  });

  textarea.addEventListener('input', () => {
    if (textarea.value !== '') {
      manageRatingTimer({ start: false, container });
      commentBox.classList.add('submit--appear');
    } else {
      const currentRating = starsContainer.querySelector('.hover-star.selected')?.dataset.rating;
      if (currentRating) {
        const ratingConfig = ratings[currentRating - 1];
        if (!ratingConfig.feedbackRequired) {
          commentBox.classList.remove('submit--appear');
        }
      }
    }
  });

  container.appendChild(starsContainer);
  container.appendChild(tooltip);

  return container;
}
