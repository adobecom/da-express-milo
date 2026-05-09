/**
 * Creates a category filter accordion using native <details>/<summary> elements.
 * No Spectrum accordion wrapper exists — uses native pattern per block-reuse decision.
 *
 * @param {Array<{id: string, label: string}>} categories
 * @param {function(string): void} onSelect - called with category id on selection
 * @returns {{ element: HTMLElement, getSelected: () => string, destroy: () => void }}
 */
export default function createCategoryAccordion(categories, onSelect) {
  const details = document.createElement('details');
  details.classList.add('fg-accordion');
  details.open = true;

  const summary = document.createElement('summary');
  summary.classList.add('fg-accordion-summary');
  summary.textContent = 'Category';
  details.append(summary);

  const pillContainer = document.createElement('div');
  pillContainer.classList.add('fg-accordion-pills');

  let selected = 'all';

  categories.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('fg-category-pill');
    btn.dataset.category = id;
    btn.textContent = label;
    if (id === 'all') btn.classList.add('is-selected');

    btn.addEventListener('click', () => {
      pillContainer.querySelectorAll('.fg-category-pill').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selected = id;
      onSelect(id);
    });

    pillContainer.append(btn);
  });

  details.append(pillContainer);

  return {
    element: details,
    getSelected: () => selected,
    destroy: () => details.remove(),
  };
}
