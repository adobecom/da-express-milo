/**
 * Lowercase, hyphenate, and strip anything that isn't [a-z0-9] — shared by
 * every tool that needs to turn a block name or ref name into a safe path
 * segment / branch-name fragment.
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
