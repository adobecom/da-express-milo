import { addFreePlanWidget } from '../../scripts/widgets/free-plan.js';

async function setupButtonStyling(block) {
  const heading = block.querySelector('h1, h2, h3');
  heading?.classList.add('heading');
  if (!heading) return;

  const pWithLink = block.querySelector('p:has(a)');
  if (!pWithLink) return;

  pWithLink.classList.add('button-container');

  const link = pWithLink.querySelector('a');
  if (link) {
    link.classList.add('quick-link', 'button', 'accent');
    await addFreePlanWidget(link.parentElement);
  }
}

export default async function decorate(block) {
  await setupButtonStyling(block);
}
