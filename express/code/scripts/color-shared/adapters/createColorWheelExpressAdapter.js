export default function createColorWheelExpressAdapter(initialColor, callbacks = {}, options = {}) {
  import('../components/color-wheel-express/index.js');

  const element = document.createElement('color-wheel-express');
  element.color = initialColor;
  element.setAttribute('aria-label', 'Color Wheel');
  element.setAttribute('wheel-marker-size', '21');

  if (options.controller && typeof options.controller.subscribe === 'function') {
    element.controller = options.controller;
  }

  element.addEventListener('change', (e) => {
    callbacks.onChange?.(e.detail);
  });

  element.addEventListener('change-end', (e) => {
    callbacks.onChangeEnd?.(e.detail);
  });

  return {
    element,
    setColor: (color) => {
      element.color = color;
    },
    getController: () => options.controller,
    destroy: () => {
      element.remove();
    },
  };
}
