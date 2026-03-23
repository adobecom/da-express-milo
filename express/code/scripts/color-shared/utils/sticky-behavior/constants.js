const DEFAULT_CONFIG = {
  animation: {
    duration: 200,
    visibleClass: 'is-visible',
    leavingClass: 'is-leaving',
  },
  observer: {
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0,
  },
  stickyClass: 'is-sticky-clone',
  appendTo: () => document.body,
};

export default DEFAULT_CONFIG;
