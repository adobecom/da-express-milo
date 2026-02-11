/**
 * Dev sandbox block for the Explore page. Delegates to color-explore.
 * DO NOT use in production. Use in dev/sandbox sheets only.
 */
export default async function decorate(block) {
  block.setAttribute('data-dev', 'true');
  const { default: decorateReal } = await import('../color-explore/color-explore.js');
  return decorateReal(block);
}
