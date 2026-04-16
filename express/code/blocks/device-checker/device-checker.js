import { getLibs } from '../../scripts/utils.js';

export default async function decorate(block) {
  const { PERSONALIZATION_TAGS } = await import(`${getLibs()}/features/personalization/personalization.js`);

  let message = '';
  if (PERSONALIZATION_TAGS.tablet()) {
    message = 'You are on a tablet device';
  } else if (PERSONALIZATION_TAGS.phone()) {
    message = 'You are on a mobile device';
  } else {
    message = 'You are on a desktop device';
  }

  block.textContent = message;
}
