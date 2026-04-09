function validateOptions(options) {
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

export default validateOptions;
