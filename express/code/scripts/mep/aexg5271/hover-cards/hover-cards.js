import { getLibs } from '../../../utils.js';
import buildGallery from '../../../widgets/gallery/gallery.js';

const decorateSplit = (el) => {
  const [leftContent, rightContent] = el.children;
  leftContent.classList.add('left-content');
  leftContent.querySelector('div')?.classList.add('media-wrapper');
  rightContent.classList.add('right-content');
  rightContent.querySelector('div')?.classList.add('content-wrapper');
  const section = rightContent.querySelector('.content-wrapper');
  const [h2, body, cta, subText] = section.children;
  h2.classList.add('heading-s');
  body.classList.add('body');
  cta.classList.add('cta');
  subText.classList.add('cta-sub-text', 'body-s');

  const videoEl = leftContent.querySelectorAll('video');
  videoEl?.forEach((video) => video.load());

  if (!cta) return;
  const cardText = section.querySelector('p')?.textContent;
  [...cta.querySelectorAll('a')].forEach((a, i) => {
    cardText && a.setAttribute('aria-label', `${cardText}-${a.textContent}`);
    const parent = a.closest('.cta');
    if (i === 0) {
      if (el.classList.contains('premium-cta')) a.classList.add('button', 'gradient');
      else a.classList.add('button', 'primary');
    } else if (parent.lastChild && el.classList.contains('outline-cta')) {
      a.classList.add('con-button');
    } else if (parent.lastChild && el.classList.contains('chevron-cta')) {
      const svg = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 5.4L11.8 10.2L7 15" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `;
      a.insertAdjacentHTML('beforeEnd', svg);
      a.classList.add('chevron-cta');
    }

    // if (parent.tagName === 'P' && parent.firstChild === parent.lastChild) {
    //   parent.replaceWith(a);
    // }
  });
};

export default async function init(el) {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);

  if (el.classList.contains('split')) {
    decorateSplit(el);
    return;
  }

  const [headingRow, hoverContainer, ...cards] = el.children;
  const pic = hoverContainer.querySelector('picture');
  hoverContainer.remove();
  headingRow.classList.add('heading-container');
  cards.forEach((card) => {
    card.classList.add('card');
    card.prepend(pic?.cloneNode(true));
    const [bgPic, media, cta] = card.children;
    bgPic.classList.add('bg-pic');
    media.classList.add('media');
    cta.classList.add('cta');
    const cardText = card.querySelector('p')?.textContent;
    if (!cta) return;
    [...cta.querySelectorAll('a')].forEach((a) => {
      a.classList.add('button', 'primary');
      cardText && a.setAttribute('aria-label', `${cardText}-${a.textContent}`);
      const parent = a.parentElement;
      if (parent.tagName === 'P' && parent.firstChild === parent.lastChild) {
        parent.replaceWith(a);
      }
    });
  });
  const cardsContainer = createTag('div', { class: 'cards-container centered' }, cards);
  const { control } = await buildGallery(cards, cardsContainer);
  el.append(cardsContainer, control);
}
