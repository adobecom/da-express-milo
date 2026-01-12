export default function decorateButtons(root) {
  root.querySelectorAll('a').forEach((link) => {
    const container = link.closest('p');
    if (container) {
      container.classList.add('button-container');
    }
    link.classList.add('con-button');
  });
}
