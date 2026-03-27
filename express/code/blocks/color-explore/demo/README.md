# Gradient demo (mock — not for prod)

Single JS + CSS bundle for all gradient demo content in color-explore. Used only for the gradients variant to show shared UI work (editor, strip, modal).

## To remove when mocks are no longer needed

1. Delete this `demo/` folder.
2. In `color-explore.css`: remove `@import url('./demo/gradientDemo.css');`
3. In `createGradientsRenderer.js`: remove import and usage of `createGradientSizesDemoSection`
4. In `createColorModalManager.js`: remove import and usage of `createGradientModalContentMock`; wire real gradient modal content
5. In `color-explore.js`: remove import of `getGradientsMockData`; wire real data source
