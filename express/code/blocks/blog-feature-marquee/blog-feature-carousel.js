const AUTOPLAY_INTERVAL_MS = 3500;
const CARD_MARGIN = 4; // matches --card-margin in CSS

const ICON_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 1.5L4 6L7.5 10.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 1.5L8 6L4.5 10.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="3" height="10" rx="1" fill="currentColor"/><rect x="7" y="1" width="3" height="10" rx="1" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 1v10l8-5-8-5z" fill="currentColor"/></svg>';

function addCaretToViewAll(link, createTag) {
  const icon = createTag('span', { class: 'blog-feature-marquee-view-all-icon' });
  icon.innerHTML = ICON_NEXT;
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
  prevBtn.innerHTML = ICON_PREV;

  const pagePosition = createTag('div', {
    class: 'carousel-btn carousel-page-position',
    role: 'group',
    'aria-label': 'Featured articles',
    tabindex: '0',
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
  pauseBtn.innerHTML = ICON_PAUSE;

  const nextBtn = createTag('button', {
    class: 'carousel-btn carousel-btn-next',
    'aria-label': 'Next article',
    type: 'button',
  });
  nextBtn.innerHTML = ICON_NEXT;

  controls.append(pagePosition, pauseBtn, prevBtn, nextBtn);
  return { controls, dots, prevBtn, nextBtn, pauseBtn, pagePosition };
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

function createController(cards, track, dots, autoplayInterval) {
  const state = { currentIndex: 0, autoplayTimer: null, isPlaying: true };

  const getInner = (card) => card.querySelector('.blog-feature-marquee-card-inner');

  const goToSlide = (rawIndex) => {
    state.currentIndex = ((rawIndex % cards.length) + cards.length) % cards.length;
    const offset = state.currentIndex * CARD_MARGIN * 2;
    track.style.transform = `translateX(calc(-${state.currentIndex * 100}% - ${offset}px))`;

    cards.forEach((card, i) => {
      const active = i === state.currentIndex;
      const inner = getInner(card);
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
      card.setAttribute('tabindex', '-1');
      if (inner) inner.setAttribute('tabindex', active ? '0' : '-1');
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

  const focusActiveInner = () => {
    const inner = getInner(cards[state.currentIndex]);
    if (inner) inner.focus({ preventScroll: true });
  };

  return {
    state, goToSlide, startAutoplay, stopAutoplay, navigate, focusActiveInner,
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

function bindControlKeyboard(controls, pagePosition, pauseBtn, prevBtn, nextBtn) {
  const sliderControls = [pagePosition, pauseBtn, prevBtn, nextBtn];
  const getFocusedControlIndex = (target) => {
    if (pagePosition.contains(target)) return 0;
    if (pauseBtn === target) return 1;
    if (prevBtn === target) return 2;
    if (nextBtn === target) return 3;
    return -1;
  };
  const focusControl = (index) => sliderControls[((index % 4) + 4) % 4].focus();

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

function bindViewportKeyboard(viewport, { navigate, focusActiveInner }) {
  viewport.addEventListener('keydown', (e) => {
    const inner = e.target.closest('.blog-feature-marquee-card-inner');
    if (!inner) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
      focusActiveInner();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigate(1);
      focusActiveInner();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const card = inner.closest('.blog-feature-marquee-card');
      if (card?.href) card.click();
    }
  });
}

// eslint-disable-next-line max-len
function bindButtonEvents(prevBtn, nextBtn, pauseBtn, { navigate, startAutoplay, stopAutoplay, state }) {
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
  pauseBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      startAutoplay();
      pauseBtn.innerHTML = ICON_PAUSE;
      pauseBtn.setAttribute('aria-label', 'Pause autoplay');
    } else {
      stopAutoplay();
      pauseBtn.innerHTML = ICON_PLAY;
      pauseBtn.setAttribute('aria-label', 'Play autoplay');
    }
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

  const { slider, viewport, track } = buildSliderDOM(cards, createTag);

  if (isStatic || cards.length <= 1) {
    const first = cards[0];
    if (first) {
      const inner = first.querySelector('.blog-feature-marquee-card-inner');
      if (inner) inner.setAttribute('tabindex', '0');
      first.removeAttribute('aria-hidden');
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
    controls, dots, prevBtn, nextBtn, pauseBtn, pagePosition,
  } = buildControls(cards, createTag);
  slider.append(buildControlBar(controls, viewAllNode, createTag));

  const controller = createController(cards, track, dots, autoplayInterval);
  bindHoverEvents(slider, controller);
  bindTouchEvents(viewport, controller);
  bindControlKeyboard(controls, pagePosition, pauseBtn, prevBtn, nextBtn);
  bindViewportKeyboard(viewport, controller);
  bindButtonEvents(prevBtn, nextBtn, pauseBtn, controller);
  bindIntersectionObserver(slider, controller);

  controller.goToSlide(0);
  return slider;
}
