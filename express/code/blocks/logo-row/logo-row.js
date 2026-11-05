export default function decorate(block) {
  // Add class to the main block
  block.classList.add('block-layout');

  const row = block.children[0];
  row.classList.add('block-row');

  const [textColumn, imageColumn] = row.children;

  // Style text column
  textColumn.classList.add('text-column');

  // Style image column
  imageColumn.classList.add('image-column');

  imageColumn.querySelectorAll('p').forEach((paragraph) => {
    if (!paragraph.childElementCount && /^[\s/\\]+$/.test(paragraph.textContent)) {
      paragraph.remove();
    }
  });
  const walker = document.createTreeWalker(imageColumn, NodeFilter.SHOW_TEXT);
  const separators = [];
  while (walker.nextNode()) {
    if (/^[\s/\\]+$/.test(walker.currentNode.textContent)
      && walker.currentNode.textContent.trim()) {
      separators.push(walker.currentNode);
    }
  }
  separators.forEach((separator) => separator.remove());

  const images = imageColumn.querySelectorAll('img');
  // Add classes to all images
  images.forEach((img) => img.classList.add('brand-image'));
  if (images.length > 5) block.classList.add('numerous');
}
