import { getLibs } from '../../scripts/utils.js';

export default async function decorate(block) {
  const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { codeRoot } = getConfig();
  loadStyle(`${codeRoot}/styles/figma/figma_typography.css`);

  block.classList.add('block-layout');
  block.classList.add('figma-system');

  const row = block.children[0];
  row.classList.add('block-row');

  const [textColumn, imageColumn] = row.children;

  textColumn.classList.add('text-column');

  const title = textColumn.children[0];
  title.classList.add('figma-heading-s');

  imageColumn.classList.add('image-column');
  const images = imageColumn.querySelectorAll('img');

  images.forEach((img) => img.classList.add('brand-image'));
  if (images.length > 5) block.classList.add('numerous');
}
