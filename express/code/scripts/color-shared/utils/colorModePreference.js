export const VALID_COLOR_MODES = ['HEX', 'RGB', 'HSB', 'Lab'];

const STORAGE_KEY = 'express-color-mode';
const DEFAULT_MODE = 'HEX';

const listeners = new Set();

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage disabled or quota exceeded — keep in-memory sync working */
  }
}

export function getPreferredColorMode(fallback = DEFAULT_MODE) {
  const stored = readStored();
  if (stored && VALID_COLOR_MODES.includes(stored)) return stored;
  return fallback;
}

export function setPreferredColorMode(mode) {
  if (!VALID_COLOR_MODES.includes(mode)) return;
  writeStored(mode);
  listeners.forEach((listener) => {
    try {
      listener(mode);
    } catch {
      /* isolate subscriber failures */
    }
  });
}

export function subscribeColorMode(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
