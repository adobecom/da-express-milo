const AUTOPLAY_INTERVAL_MS = 6000;
const ICONS = {
  prev: '/express/code/icons/slider-left-arrow.svg',
  next: '/express/code/icons/slider-right-arrow.svg',
  pause: '/express/code/icons/slider-pause-button.svg',
  play: '/express/code/icons/slider-play-button.svg',
  viewAll: '/express/code/icons/view-all-caret.svg',
};

function createIconImg(createTag, src) {
  return createTag('img', {
    src,
    alt: '',
    'aria-hidden': 'true',
    decoding: 'async',
  });
}

function addCaretToViewAll(link, createTag) {
  const icon = createTag('span', { class: 'blog-feature-marquee-view-all-icon' });
  icon.append(createIconImg(createTag, ICONS.viewAll));
  link.append(icon);
}

function buildSliderDOM(cards, createTag) {
  const slider = createTag('div', { class: 'blog-feature-marquee-slider' });
  const viewport = createTag('div', { class: 'blog-feature-marquee-slider-viewport' });
  const track = createTag('div', { class: 'blog-feature-marquee-slider-track' });
  cards.forEach((card) => track.append(card));
  viewport.append(track);
  slider.append(viewport);
  return { slider, viewport, track };
}

function buildControls(cards, createTag) {
  const controls = createTag('div', { class: 'carousel-controls' });

  const prevBtn = createTag('button', {
    class: 'carousel-btn carousel-btn-prev',
    'aria-label': 'Previous article',
    type: 'button',
  });
  prevBtn.append(createIconImg(createTag, ICONS.prev));

  const pagePosition = createTag('div', {
    class: 'carousel-btn carousel-page-position',
  });

  const dots = cards.map((_, i) => {
    const dot = createTag('span', {
      class: `carousel-dot${i === 0 ? ' active' : ''}`,
      'aria-hidden': 'true',
    });
    pagePosition.append(dot);
    return dot;
  });

  const pauseBtn = createTag('button', {
    class: 'carousel-btn carousel-btn-pause',
    'aria-label': 'Pause autoplay',
    type: 'button',
  });
  const pauseIcon = createIconImg(createTag, ICONS.pause);
  pauseBtn.append(pauseIcon);

  const nextBtn = createTag('button', {
    class: 'carousel-btn carousel-btn-next',
    'aria-label': 'Next article',
    type: 'button',
  });
  nextBtn.append(createIconImg(createTag, ICONS.next));

  controls.append(pagePosition, pauseBtn, prevBtn, nextBtn);
  return {
    controls,
    dots,
    prevBtn,
    nextBtn,
    pauseBtn,
    pauseIcon,
  };
}

function buildControlBar(controls, viewAllNode, createTag) {
  const controlBar = createTag('div', { class: 'carousel-control-bar' });
  if (viewAllNode) {
    addCaretToViewAll(viewAllNode, createTag);
    controlBar.append(viewAllNode, controls);
  } else {
    controlBar.append(controls);
  }
  return controlBar;
}

function createController(cards, dots, autoplayInterval) {
  const state = { currentIndex: 0, autoplayTimer: null, isPlaying: true };

  const goToSlide = (rawIndex) => {
    state.currentIndex = ((rawIndex % cards.length) + cards.length) % cards.length;

    cards.forEach((card, i) => {
      const active = i === state.currentIndex;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
      card.setAttribute('aria-live', active ? 'polite' : 'off');
      card.setAttribute('tabindex', active ? '0' : '-1');
    });

    dots.forEach((dot, i) => dot.classList.toggle('active', i === state.currentIndex));
  };

  const startAutoplay = () => {
    if (state.autoplayTimer || !state.isPlaying) return;
    state.autoplayTimer = setInterval(() => goToSlide(state.currentIndex + 1), autoplayInterval);
  };

  const stopAutoplay = () => {
    clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
  };

  const navigate = (delta) => {
    stopAutoplay();
    goToSlide(state.currentIndex + delta);
    if (state.isPlaying) startAutoplay();
  };

  const focusActiveCard = () => {
    const activeCard = cards[state.currentIndex];
    if (activeCard) activeCard.focus({ preventScroll: true });
  };

  return {
    state, goToSlide, startAutoplay, stopAutoplay, navigate, focusActiveCard,
  };
}

function bindHoverEvents(slider, { startAutoplay, stopAutoplay, state }) {
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', () => { if (state.isPlaying) startAutoplay(); });
}

function bindTouchEvents(viewport, { navigate, startAutoplay, stopAutoplay, state }) {
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    if (state.isPlaying) startAutoplay();
  }, { passive: true });
}

function bindControlKeyboard(controls, pauseBtn, prevBtn, nextBtn) {
  const sliderControls = [pauseBtn, prevBtn, nextBtn];
  const getFocusedControlIndex = (target) => {
    if (pauseBtn === target) return 0;
    if (prevBtn === target) return 1;
    if (nextBtn === target) return 2;
    return -1;
  };
  const focusControl = (index) => {
    const normalizedIndex = ((index % sliderControls.length)
     + sliderControls.length) % sliderControls.length;
    sliderControls[normalizedIndex].focus();
  };

  controls.addEventListener('keydown', (e) => {
    const idx = getFocusedControlIndex(e.target);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusControl(idx + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusControl(idx - 1);
    }
  });
}

function bindViewportKeyboard(viewport, { navigate, focusActiveCard }) {
  viewport.addEventListener('keydown', (e) => {
    const card = e.target.closest('.blog-feature-marquee-card');
    if (!card) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
      focusActiveCard();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigate(1);
      focusActiveCard();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card?.href) card.click();
    }
  });
}

// eslint-disable-next-line max-len
function bindButtonEvents(prevBtn, nextBtn, pauseBtn, pauseIcon, { navigate, startAutoplay, stopAutoplay, state }) {
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
  pauseBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
    pauseIcon.setAttribute('src', state.isPlaying ? ICONS.pause : ICONS.play);
    pauseBtn.setAttribute('aria-label', state.isPlaying ? 'Pause autoplay' : 'Play autoplay');
  });
}

function bindIntersectionObserver(slider, { startAutoplay, stopAutoplay, state }) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && state.isPlaying) startAutoplay();
      else stopAutoplay();
    });
  }, { threshold: 0.3 });
  io.observe(slider);
}

export default function buildLocalCarousel(cards, createTag, options = {}) {
  const {
    isStatic = false,
    autoplayInterval = AUTOPLAY_INTERVAL_MS,
    viewAllNode = null,
  } = options;

  const { slider, viewport } = buildSliderDOM(cards, createTag);
  const fadeDurationMs = Number.isFinite(autoplayInterval)
    ? autoplayInterval
    : AUTOPLAY_INTERVAL_MS;
  slider.style.setProperty('--blog-feature-marquee-card-fade-duration', `${fadeDurationMs}ms`);

  if (isStatic || cards.length <= 1) {
    const first = cards[0];
    if (first) {
      first.classList.add('is-active');
      first.removeAttribute('aria-hidden');
      first.setAttribute('tabindex', '0');
    }
    if (viewAllNode) {
      addCaretToViewAll(viewAllNode, createTag);
      const controlBar = createTag('div', { class: 'carousel-control-bar' });
      controlBar.append(viewAllNode);
      slider.append(controlBar);
    }
    return slider;
  }

  const {
    controls, dots, prevBtn, nextBtn, pauseBtn, pauseIcon,
  } = buildControls(cards, createTag);
  slider.append(buildControlBar(controls, viewAllNode, createTag));

  const controller = createController(cards, dots, autoplayInterval);
  bindHoverEvents(slider, controller);
  bindTouchEvents(viewport, controller);
  bindControlKeyboard(controls, pauseBtn, prevBtn, nextBtn);
  bindViewportKeyboard(viewport, controller);
  bindButtonEvents(prevBtn, nextBtn, pauseBtn, pauseIcon, controller);
  bindIntersectionObserver(slider, controller);

  controller.goToSlide(0);
  return slider;
}
