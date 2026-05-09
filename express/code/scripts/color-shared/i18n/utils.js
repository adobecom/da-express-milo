import { getLibs } from '../../utils.js';

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export default async function loadPlaceholders(keyMap, createFn) {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const keys = Object.values(keyMap);
    const values = await replaceKeyArray(keys, getConfig());
    const overrides = {};

    Object.entries(keyMap).forEach(([prop, key], index) => {
      const value = values[index];
      if (isResolvedPlaceholder(value, key)) {
        overrides[prop] = value;
      }
    });

    return createFn(overrides);
  } catch {
    return createFn();
  }
}
