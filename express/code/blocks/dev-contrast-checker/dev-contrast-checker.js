/**
 * Dev sandbox block for the Contrast Checker page. Delegates to contrast-checker.
 * DO NOT use in production. Use in dev/sandbox sheets only.
 */
export default async function decorate(block) {
  block.setAttribute('data-dev', 'true');
  const { default: decorateReal } = await import('../contrast-checker/contrast-checker.js');
  return decorateReal(block);
}
