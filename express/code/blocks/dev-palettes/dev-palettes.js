/**
 * Dev block: dev-palettes (in blocks/ so Milo can load it).
 * DO NOT use in production. Naming dev-* = dev-only. See wiki: Dev-Blocks.
 */
export default async function decorate(block) {
  block.className = 'dev-palettes';
  block.innerHTML = '<div class="dev-palettes-placeholder"><p>Dev block: dev-palettes (Phase 1 harness)</p></div>';
}
