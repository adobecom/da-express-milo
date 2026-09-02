async function loadCarousel(selector, parent, options) {
  if (parent.closest('.grid-carousel')) {
    const { default: buildGridCarousel } = await import('../widgets/grid-carousel.js');
    return buildGridCarousel(selector, parent, options);
  }
  if (parent.closest('.basic-carousel')) {
    const { default: buildBasicCarousel } = await import('../widgets/basic-carousel.js');
    return buildBasicCarousel(selector, parent, options);
  }
  const { default: buildCarousel } = await import('../widgets/carousel.js');
  return buildCarousel(selector, parent, options);
}

export default loadCarousel;
