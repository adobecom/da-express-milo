/**
 * Dev sandbox block for the Color Blindness page. Delegates to color-blindness.
 * DO NOT use in production. Use in dev/sandbox sheets only.
 */
export default async function decorate(block) {
  block.setAttribute('data-dev', 'true');
  const { default: decorateReal } = await import('../color-blindness/color-blindness.js');
  return decorateReal(block);
}
