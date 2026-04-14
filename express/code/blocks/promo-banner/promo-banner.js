import { decorateButtonsDeprecated } from '../../scripts/utils.js';

export default async function decorate(block) {
  await decorateButtonsDeprecated(block);

  const rows = [...block.children];
  const [contentRow, bgRow, colorRow] = rows;

  // Apply background from second row if present
  if (bgRow) {
    const value = bgRow.textContent;
    if (value && value.trim()) {
      block.style.background = value.trim();
      block.classList.add('has-custom-bg');
    }
    bgRow.remove();
  }

  // Apply text color from third row if present
  if (colorRow) {
    const value = colorRow.textContent;
    if (value && value.trim()) {
      block.style.color = value.trim();
    }
    colorRow.remove();
  }

  // Mark content row
  if (contentRow) {
    contentRow.classList.add('content');
  }

  // Adjust button classes: remove primary/secondary, add accent dark
  const buttons = block.querySelectorAll('a.button');
  buttons.forEach((button) => {
    button.classList.remove('primary');
    button.classList.remove('secondary');
    button.classList.add('accent', 'dark');
  });
}
