/**
 * Dev sandbox block for the Extract page. Delegates to color-extract.
 * DO NOT use in production. Use in dev/sandbox sheets only.
 */
export default async function decorate(block) {
  block.setAttribute('data-dev', 'true');
  const { default: decorateReal } = await import('../color-extract/color-extract.js');
  return decorateReal(block);
}
