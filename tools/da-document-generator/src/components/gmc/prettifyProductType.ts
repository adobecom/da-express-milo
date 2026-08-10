const VENDOR_PREFIXES = ['zazzle_', 'mojo_'];

/**
 * Turns a raw Zazzle-style product-type value into a human-readable group header where trivial:
 * strips a leading vendor prefix (`zazzle_`/`mojo_`), splits on separators and camelCase
 * boundaries, and title-cases the words. Falls back to the raw string when there's nothing
 * sensible to do (GMC-Submit-Dialog-PRD.md §7). Presentational only — never used for grouping or
 * submission keys, so a less-than-perfect prettification is harmless.
 */
export default function prettifyProductType(raw: string): string {
  if (!raw) return raw;
  let stripped = raw.trim();
  const lower = stripped.toLowerCase();
  for (const prefix of VENDOR_PREFIXES) {
    if (lower.startsWith(prefix)) {
      stripped = stripped.slice(prefix.length);
      break;
    }
  }

  const spaced = stripped
    .replace(/[_-]+/g, ' ') // separators → spaces
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase → words
    .trim();

  if (!spaced) return raw;

  return spaced
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
