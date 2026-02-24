const AUTOPLAY_INTERVAL_MS = 3500;

const ICON_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 1.5L4 6L7.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 1.5L8 6L4.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="3" height="10" rx="1" fill="currentColor"/><rect x="7" y="1" width="3" height="10" rx="1" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 1v10l8-5-8-5z" fill="currentColor"/></svg>';

export default function buildLocalCarousel(cards, createTag, options = {}) {
  const {
    isStatic = false,
    autoplayInterval = AUTOPLAY_INTERVAL_MS,
    viewAllNode = null,
  } = options;

  const slider = createTag('div', { class: 'blog-feature-marquee-slider' });
  const viewport = createTag('div', { class: 'blog-feature-marquee-slider-viewport' });
  const track = createTag('div', { class: 'blog-feature-marquee-slider-track' });

  cards.forEach((card) => track.append(card));
  viewport.append(track);
  slider.append(viewport);

  if (isStatic || cards.length <= 1) {
    const first = cards[0];
    if (first) {
      first.removeAttribute('tabindex');
      first.removeAttribute('aria-hidden');
    }
    return slider;
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  const controls = createTag('div', { class: 'carousel-controls' });

  const prevBtn = createTag('button', {
    class: 'carousel-btn carousel-btn-prev',
    'aria-label': 'Previous article',
    type: 'button',
  });
  prevBtn.innerHTML = ICON_PREV;

  const pagePosition = createTag('div', {
    class: 'carousel-btn carousel-page-position',
    role: 'tablist',
    'aria-label': 'Featured articles',
  });

  const dots = cards.map((_, i) => {
    const dot = createTag('button', {
      class: `carousel-dot${i === 0 ? ' active' : ''}`,
      role: 'tab',
      type: 'button',
      'aria-label': `Article ${i + 1} of ${cards.length}`,
      'aria-selected': i === 0 ? 'true' : 'false',
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

  const controlBar = createTag('div', { class: 'carousel-control-bar' });
  if (viewAllNode) controlBar.append(viewAllNode);
  controlBar.append(controls);
  slider.append(controlBar);

  // ── State machine ─────────────────────────────────────────────────────────

  let currentIndex = 0;
  let autoplayTimer = null;
  let isPlaying = true;

  const goToSlide = (rawIndex) => {
    currentIndex = ((rawIndex % cards.length) + cards.length) % cards.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    cards.forEach((card, i) => {
      const active = i === currentIndex;
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
      card.setAttribute('tabindex', active ? '0' : '-1');
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
      dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });
  };

  const startAutoplay = () => {
    if (autoplayTimer || !isPlaying) return;
    autoplayTimer = setInterval(() => goToSlide(currentIndex + 1), autoplayInterval);
  };

  const stopAutoplay = () => {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', () => { if (isPlaying) startAutoplay(); });

  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goToSlide(currentIndex + (diff > 0 ? 1 : -1));
    if (isPlaying) startAutoplay();
  }, { passive: true });

  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentIndex + 1); }
  });

  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  pauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      startAutoplay();
      pauseBtn.innerHTML = ICON_PAUSE;
      pauseBtn.setAttribute('aria-label', 'Pause autoplay');
    } else {
      stopAutoplay();
      pauseBtn.innerHTML = ICON_PLAY;
      pauseBtn.setAttribute('aria-label', 'Play autoplay');
    }
  });

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    stopAutoplay();
    goToSlide(i);
    if (isPlaying) startAutoplay();
  }));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && isPlaying) startAutoplay();
      else stopAutoplay();
    });
  }, { threshold: 0.3 });
  io.observe(slider);

  goToSlide(0);
  return slider;
}
