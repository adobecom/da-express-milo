export default async function decorate(block) {
  const rows = Array.from(block.children);

  rows.slice(0).forEach((row) => {
    row.classList.add('icon-row');
    row.setAttribute('role', 'listitem');

    const textDiv = row.children[1];
    if (textDiv) {
      const textElement = textDiv.firstElementChild || textDiv;
      textElement?.classList.add('text');
      textElement?.setAttribute('aria-label', textElement?.textContent.trim());

      const img = row.querySelector('img');
      if (img) {
        img.setAttribute('role', 'presentation');
      }
    }

    block.appendChild(row);
  });

  block.setAttribute('role', 'list');
}
