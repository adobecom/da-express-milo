import { getLibs } from '../../utils.js';

export const SHARE_MENU_PLACEHOLDERS = Object.freeze({
  copy: Object.freeze({ key: 'share-menu-copy', fallback: 'Copy' }),
  copied: Object.freeze({ key: 'share-menu-copied', fallback: 'Copied to clipboard' }),
  failed: Object.freeze({
    key: 'share-menu-failed',
    fallback: 'Unable to share. Please try again.',
  }),
  moreOptions: Object.freeze({
    key: 'share-menu-more-options',
    fallback: 'More options',
  }),
  whatsapp: Object.freeze({ key: 'share-menu-whatsapp', fallback: 'WhatsApp' }),
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key && value !== key.replaceAll('-', ' ');
}

/**
 * Resolves caller-provided placeholder descriptors in one lookup. Descriptors
 * use `{ key, fallback }`; unresolved keys retain the correctly cased fallback.
 */
export default async function loadShareMenuPlaceholders(descriptors = {}) {
  const entries = Object.entries(descriptors).filter(([, descriptor]) => descriptor?.key);
  const strings = Object.fromEntries(
    Object.entries(descriptors).map(([name, descriptor]) => [name, descriptor?.fallback || '']),
  );
  if (!entries.length) return strings;

  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);
    const keys = entries.map(([, descriptor]) => descriptor.key);
    const values = await replaceKeyArray(keys, getConfig());
    entries.forEach(([name, descriptor], index) => {
      if (isResolvedPlaceholder(values[index], descriptor.key)) strings[name] = values[index];
    });
  } catch {
    // English descriptor fallbacks are already populated.
  }

  return strings;
}
