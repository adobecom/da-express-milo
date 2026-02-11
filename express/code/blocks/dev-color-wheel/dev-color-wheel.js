/**
 * Dev sandbox block for the Color Wheel page. Delegates to color-wheel.
 * DO NOT use in production. Use in dev/sandbox sheets only.
 */
export default async function decorate(block) {
  block.setAttribute('data-dev', 'true');
  const { default: decorateReal } = await import('../color-wheel/color-wheel.js');
  return decorateReal(block);
}
