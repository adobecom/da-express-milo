export default function createS2StarIcon(starType, createTag) {
  if (starType === 'star-half') {
    const wrapper = createTag('div', {
      class: 'pdpx-star-icon-wrapper pdpx-star-icon-half-wrapper',
    });
    const filledHalf = createTag('img', {
      class: 'pdpx-star-icon pdpx-star-icon-star pdpx-star-icon-half-filled',
      src: '/express/code/icons/s2-star-filled.svg',
      width: '17',
      height: '17',
      alt: '',
      'aria-hidden': 'true',
    });
    const emptyHalf = createTag('img', {
      class: 'pdpx-star-icon pdpx-star-icon-star-empty pdpx-star-icon-half-empty',
      src: '/express/code/icons/s2-star-empty.svg',
      width: '17',
      height: '17',
      alt: '',
      'aria-hidden': 'true',
    });
    wrapper.appendChild(filledHalf);
    wrapper.appendChild(emptyHalf);
    return wrapper;
  }

  const iconSrc = starType === 'star'
    ? '/express/code/icons/s2-star-filled.svg'
    : '/express/code/icons/s2-star-empty.svg';

  const iconImg = createTag('img', {
    class: `pdpx-star-icon pdpx-star-icon-${starType}`,
    src: iconSrc,
    width: '17',
    height: '17',
    alt: '',
    'aria-hidden': 'true',
  });

  return iconImg;
}

export function populateStars(count, starType, parent, createTag) {
  for (let i = 0; i < count; i += 1) {
    parent.appendChild(createS2StarIcon(starType, createTag));
  }
}
