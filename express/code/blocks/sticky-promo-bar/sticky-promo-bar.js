import { getLibs } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { sendEventToAnalytics } from '../../scripts/instrument.js';

let createTag;

function initScrollInteraction(block) {
  const inBodyBanner = block.cloneNode(true);
  inBodyBanner.dataset.blockStatus = 'loaded';
  inBodyBanner.classList.add('clone');
  block.classList.add('inbody');
  block.after(inBodyBanner);

  const intersectionCallback = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && inBodyBanner.getBoundingClientRect().top < 0) {
        block.classList.add('shown');
      } else {
        block.classList.remove('shown');
      }
    });
  };

  const observer = new IntersectionObserver(intersectionCallback, {
    rootMargin: '0px',
    threshold: 0,
  });

  observer.observe(inBodyBanner);
}

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const close = createTag('button', {
    class: 'close',
    'aria-label': 'close',
  });
  block.appendChild(close);

  BlockMediator.set('promobar', {
    block,
    rendered: true,
  });

  close.addEventListener('click', () => {
    block.remove();
    BlockMediator.set('promobar', {
      block,
      rendered: false,
    });
    sendEventToAnalytics('adobe.com:express:cta:startYourFreeTrial:close');
  });

  if (block.classList.contains('loadinbody')) {
    setTimeout(() => {
      initScrollInteraction(block);
    });
  } else {
    setTimeout(() => {
      block.classList.add('shown');
    }, 10);
  }
}
