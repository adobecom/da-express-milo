/**
 * Validates required options and throws descriptive errors
 * @param {import('./constants.js').StickyBehaviorOptions} options - Options to validate
 * @throws {Error} If required options are missing or invalid
 */
export function validateOptions(options) {
  if (!options) {
    throw new Error('stickyBehavior: options object is required');
  }

  if (!options.sentinel) {
    throw new Error('stickyBehavior: sentinel element is required');
  }

  if (!(options.sentinel instanceof HTMLElement)) {
    throw new TypeError('stickyBehavior: sentinel must be an HTMLElement');
  }

  const hasCloneMode = typeof options.createClone === 'function';
  const hasRelocateMode = options.element instanceof HTMLElement;

  if (!hasCloneMode && !hasRelocateMode) {
    throw new TypeError(
      'stickyBehavior: either createClone (function) or element (HTMLElement) is required',
    );
  }
}

